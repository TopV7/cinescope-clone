import express from 'express';
import db from '../database.js';
import { validateCard, generateTransactionId } from '../utils/cardValidator.js';

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
router.post('/create', async (req, res) => {
  const { 
    userId, 
    amount, 
    currency = 'USD',
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

  // Генерация transaction ID
  const transactionId = generateTransactionId();
  const cardLastFour = cardValidation.results.maskedNumber.slice(-4);

  // Имитация обработки платежа (в реальном проекте здесь был бы вызов платежного шлюза)
  setTimeout(() => {
    // Случайный результат для демонстрации
    const isSuccess = Math.random() > 0.1; // 90% успех
    const status = isSuccess ? 'completed' : 'failed';
    const failureReason = isSuccess ? null : 'Insufficient funds';

    db.run(`
      INSERT INTO payments (user_id, amount, currency, status, card_last_four, transaction_id, payment_method, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId,
      amount,
      currency,
      status,
      cardLastFour,
      transactionId,
      'credit_card',
      description || 'Movie ticket purchase'
    ], function(err) {
      if (err) {
        console.error('Error creating payment:', err);
        return;
      }

      console.log(`Payment ${status}: ${transactionId} for user ${userId}, amount $${amount}`);
    });
  }, 2000); // 2 секунды имитация обработки

  // Сразу возвращаем ответ с pending статусом
  res.status(201).json({
    message: 'Payment processing initiated',
    transactionId,
    status: 'pending',
    amount,
    currency,
    cardType: cardValidation.results.cardType,
    maskedCardNumber: cardValidation.results.maskedNumber,
    estimatedProcessingTime: '2 seconds'
  });
});

// Проверка статуса платежа
router.get('/status/:transactionId', (req, res) => {
  const { transactionId } = req.params;

  db.get(
    'SELECT * FROM payments WHERE transaction_id = ?',
    [transactionId],
    (err, payment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!payment) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json({
        transactionId: payment.transaction_id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        cardLastFour: payment.card_last_four,
        description: payment.description
      });
    }
  );
});

// История платежей пользователя
router.get('/history/:userId', (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  let query = 'SELECT * FROM payments WHERE user_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const limitNum = parseInt(limit);
  const offset = (parseInt(page) - 1) * limitNum;
  params.push(limitNum, offset);

  db.all(query, params, (err, payments) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Получаем общее количество для пагинации
    let countQuery = 'SELECT COUNT(*) as total FROM payments WHERE user_id = ?';
    const countParams = [userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        userId: parseInt(userId),
        payments: payments.map(p => ({
          transactionId: p.transaction_id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          cardLastFour: p.card_last_four,
          description: p.description,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        })),
        pagination: {
          page: parseInt(page),
          limit: limitNum,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limitNum)
        }
      });
    });
  });
});

// Возврат платежа
router.post('/refund', (req, res) => {
  const { transactionId, reason } = req.body;

  if (!transactionId) {
    return res.status(400).json({ 
      error: 'Transaction ID is required' 
    });
  }

  // Проверяем существует ли платеж и можно ли его вернуть
  db.get(
    'SELECT * FROM payments WHERE transaction_id = ? AND status = "completed"',
    [transactionId],
    (err, payment) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!payment) {
        return res.status(404).json({ 
          error: 'Completed transaction not found' 
        });
      }

      // Создаем запись о возврате
      const refundTransactionId = generateTransactionId();
      
      db.run(`
        INSERT INTO payments (user_id, amount, currency, status, card_last_four, transaction_id, payment_method, description)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        payment.user_id,
        -payment.amount, // Отрицательная сумма для возврата
        payment.currency,
        'refunded',
        payment.card_last_four,
        refundTransactionId,
        'refund',
        `Refund for transaction ${transactionId}${reason ? ': ' + reason : ''}`
      ], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        // Обновляем статус оригинального платежа
        db.run(
          'UPDATE payments SET status = "refunded", updated_at = CURRENT_TIMESTAMP WHERE transaction_id = ?',
          [transactionId]
        );

        res.json({
          message: 'Refund processed successfully',
          originalTransactionId: transactionId,
          refundTransactionId,
          refundedAmount: payment.amount,
          currency: payment.currency,
          reason: reason || 'Customer request'
        });
      });
    }
  );
});

// Получение статистики платежей
router.get('/stats', (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT 
      COUNT(*) as totalTransactions,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as totalRevenue,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingTransactions,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedTransactions,
      AVG(amount) as averageTransactionAmount
    FROM payments
    WHERE 1=1
  `;
  const params = [];

  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  db.get(query, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({
      period: {
        startDate: startDate || 'all time',
        endDate: endDate || 'now'
      },
      statistics: {
        totalTransactions: stats.totalTransactions || 0,
        totalRevenue: stats.totalRevenue || 0,
        pendingTransactions: stats.pendingTransactions || 0,
        failedTransactions: stats.failedTransactions || 0,
        averageTransactionAmount: stats.averageTransactionAmount || 0
      }
    });
  });
});

export default router;
