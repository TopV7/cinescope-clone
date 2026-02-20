import express from 'express';
import { query, transaction } from '../database.js';
import { validateCard, generateTransactionId } from '../utils/cardValidator.js';
import { encrypt, decrypt } from '../utils/encryption.js';
import { authenticateToken, requireOwnership } from '../middleware/auth.js';

const router = express.Router();

// Валидация банковской карты
router.post('/validate-card', (req, res) => {
  const { cardNumber, cvv, expiryMonth, expiryYear, cardholderName } = req.body;

  if (!cardNumber || !cvv || !expiryMonth || !expiryYear) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['cardNumber', 'cvv', 'expiryMonth', 'expiryYear']
    });
  }

  const validation = validateCard({
    cardNumber,
    cvv,
    expiryMonth,
    expiryYear
  });

  res.json({
    valid: validation.valid,
    cardType: validation.results.cardType,
    maskedNumber: validation.results.maskedNumber,
    errors: validation.errors,
    timestamp: new Date().toISOString()
  });
});

// Создание платежа
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { 
      userId, 
      amount, 
      currency = 'RUB',
      cardNumber, 
      cvv, 
      expiryMonth, 
      expiryYear,
      description 
    } = req.body;

    if (!userId || !amount || !cardNumber || !cvv || !expiryMonth || !expiryYear) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['userId', 'amount', 'cardNumber', 'cvv', 'expiryMonth', 'expiryYear']
      });
    }

    // Валидация карты
    const cardValidation = validateCard({
      cardNumber,
      cvv,
      expiryMonth,
      expiryYear
    });

    if (!cardValidation.valid) {
      return res.status(400).json({
        error: 'Invalid card details',
        errors: cardValidation.errors,
        cardType: cardValidation.results.cardType
      });
    }

    // Расчет комиссии (2.5% + фиксированная комиссия 30 руб)
    const commissionRate = 0.025; // 2.5%
    const fixedCommission = 30; // 30 руб
    const commissionAmount = (amount * commissionRate) + fixedCommission;
    const totalAmount = amount + commissionAmount;

    // Генерация transaction ID
    const transactionId = generateTransactionId();
    const cardLastFour = cardValidation.results.maskedNumber.slice(-4);
    const encryptedCardLastFour = encrypt(cardLastFour);

    // Сохранение платежа в базе данных
    const paymentResult = await query(
      `INSERT INTO payments (user_id, amount, original_amount, commission_amount, currency, status, card_last_four, transaction_id, payment_method, description, seats)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, transaction_id, status, created_at`,
      [
        userId,
        totalAmount, // Сохраняем полную сумму с комиссией
        amount, // Оригинальная сумма
        commissionAmount, // Комиссия
        currency,
        'pending',
        encryptedCardLastFour,
        transactionId,
        'credit_card',
        description || 'Movie ticket purchase',
        JSON.stringify([]) // Пустой массив мест
      ]
    );

    console.log(`Payment created: ${transactionId} for user ${userId}, amount ${totalAmount} (incl. ${commissionAmount.toFixed(2)} commission)`);

    // Имитация обработки платежа (в реальном проекте здесь был бы вызов платежного шлюза)
    const processPayment = async () => {
      try {
        // Случайный результат для демонстрации
        const isSuccess = Math.random() > 0.1; // 90% успех
        const status = isSuccess ? 'completed' : 'failed';

        await query(
          'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE transaction_id = $2',
          [status, transactionId]
        );

        console.log(`Payment ${status}: ${transactionId}`);
      } catch (error) {
        console.error('Payment processing failed:', error);
      }
    };

    // Запускаем обработку асинхронно
    setTimeout(processPayment, 2000); // 2 секунды имитация обработки

    // Сразу возвращаем ответ с pending статусом
    res.status(201).json({
      message: 'Payment processing initiated',
      transactionId,
      status: 'pending',
      originalAmount: amount,
      commissionAmount: commissionAmount.toFixed(2),
      totalAmount: totalAmount,
      currency,
      cardType: cardValidation.results.cardType,
      maskedCardNumber: cardValidation.results.maskedNumber,
      estimatedProcessingTime: '2 seconds'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Проверка статуса платежа
router.get('/status/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const paymentResult = await query(
      'SELECT * FROM payments WHERE transaction_id = $1',
      [transactionId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const payment = paymentResult.rows[0];

    res.json({
      transactionId: payment.transaction_id,
      status: payment.status,
      amount: parseFloat(payment.amount),
      originalAmount: parseFloat(payment.original_amount),
      commissionAmount: parseFloat(payment.commission_amount),
      currency: payment.currency,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at,
      cardLastFour: decrypt(payment.card_last_four),
      description: payment.description,
      seats: payment.seats ? JSON.parse(payment.seats) : []
    });
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// История платежей пользователя
router.get('/history/:userId', authenticateToken, requireOwnership, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    let sql = 'SELECT * FROM payments WHERE user_id = $1';
    const params = [userId];

    if (status) {
      sql += ' AND status = $' + (params.length + 1);
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    const limitNum = parseInt(limit);
    const offset = (parseInt(page) - 1) * limitNum;
    params.push(limitNum, offset);

    const paymentsResult = await query(sql, params);

    // Получить общее количество для пагинации
    let countSql = 'SELECT COUNT(*) as total FROM payments WHERE user_id = $1';
    const countParams = [userId];
    
    if (status) {
      countSql += ' AND status = $' + (countParams.length + 1);
      countParams.push(status);
    }

    const countResult = await query(countSql, countParams);

    res.json({
      userId: parseInt(userId),
      payments: paymentsResult.rows.map(p => ({
        transactionId: p.transaction_id,
        amount: parseFloat(p.amount),
        originalAmount: parseFloat(p.original_amount),
        commissionAmount: parseFloat(p.commission_amount),
        currency: p.currency,
        status: p.status,
        cardLastFour: decrypt(p.card_last_four),
        description: p.description,
        seats: p.seats ? JSON.parse(p.seats) : [],
        createdAt: p.created_at,
        updatedAt: p.updated_at
      })),
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limitNum)
      }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Возврат платежа
router.post('/refund', authenticateToken, async (req, res) => {
  try {
    const { transactionId, reason } = req.body;

    if (!transactionId) {
      return res.status(400).json({ 
        error: 'Transaction ID is required' 
      });
    }

    // Проверить существует ли платеж и можно ли его вернуть
    const paymentResult = await query(
      'SELECT * FROM payments WHERE transaction_id = $1 AND status = $2',
      [transactionId, 'completed']
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Completed transaction not found' 
      });
    }

    const payment = paymentResult.rows[0];

    // Создать запись о возврате
    const refundTransactionId = generateTransactionId();
    
    await transaction(async (client) => {
      // Создать запись возврата
      await client.query(
        `INSERT INTO refunds (payment_id, amount, reason, status, refund_transaction_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [
          payment.id,
          parseFloat(payment.amount),
          reason || 'Customer request',
          'completed',
          refundTransactionId
        ]
      );

    // Создать отрицательный платеж для возврата
      await client.query(
        `INSERT INTO payments (user_id, amount, original_amount, commission_amount, currency, status, card_last_four, transaction_id, payment_method, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          payment.user_id,
          -parseFloat(payment.amount), // Отрицательная сумма для возврата
          -parseFloat(payment.original_amount), // Возврат оригинальной суммы
          -parseFloat(payment.commission_amount), // Возврат комиссии
          payment.currency,
          'refunded',
          encrypt(decrypt(payment.card_last_four)), // Расшифровать и снова зашифровать для consistency
          refundTransactionId,
          'refund',
          `Refund for transaction ${transactionId}${reason ? ': ' + reason : ''}`
        ]
      );

      // Обновить статус оригинального платежа
      await client.query(
        'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE transaction_id = $2',
        ['refunded', transactionId]
      );
    });

    console.log(`Refund processed: ${refundTransactionId} for transaction ${transactionId}`);

    res.json({
      message: 'Refund processed successfully',
      originalTransactionId: transactionId,
      refundTransactionId,
      refundedAmount: parseFloat(payment.amount),
      refundedOriginalAmount: parseFloat(payment.original_amount),
      refundedCommissionAmount: parseFloat(payment.commission_amount),
      currency: payment.currency,
      reason: reason || 'Customer request'
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Получение статистики платежей
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let sql = `
      SELECT 
        COUNT(*) as "totaltransactions",
        SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as "totalrevenue",
        SUM(CASE WHEN status = 'completed' THEN original_amount ELSE 0 END) as "totaloriginalrevenue",
        SUM(CASE WHEN status = 'completed' THEN commission_amount ELSE 0 END) as "totalcommission",
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as "pendingtransactions",
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as "failedtransactions",
        AVG(amount) as "averagetransactionamount"
      FROM payments
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += ' AND created_at >= $1';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND created_at <= $' + (params.length + 1);
      params.push(endDate);
    }

    const statsResult = await query(sql, params);
    const stats = statsResult.rows[0];

    res.json({
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now'
      },
      statistics: {
        totalTransactions: parseInt(stats.totaltransactions) || 0,
        totalRevenue: parseFloat(stats.totalrevenue) || 0,
        totalOriginalRevenue: parseFloat(stats.totaloriginalrevenue) || 0,
        totalCommission: parseFloat(stats.totalcommission) || 0,
        pendingTransactions: parseInt(stats.pendingtransactions) || 0,
        failedTransactions: parseInt(stats.failedtransactions) || 0,
        averageTransactionAmount: parseFloat(stats.averagetransactionamount) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
