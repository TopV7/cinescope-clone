import { API_ENDPOINTS, getAuthHeaders } from './api';

// Types
export interface CardData {
  cardNumber: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName?: string;
}

export interface PaymentRequest {
  userId: number;
  amount: number;
  currency?: string;
  cardData: CardData;
  description?: string;
}

export interface Payment {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  cardLastFour: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentHistoryParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
}

export interface RefundRequest {
  transactionId: string;
  reason?: string;
}

export interface PaymentStats {
  totalTransactions: number;
  totalRevenue: number;
  pendingTransactions: number;
  failedTransactions: number;
  averageTransactionAmount: number;
}

// Payment Service
export const paymentService = {
  // Validate card
  async validateCard(cardData: CardData): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENT.VALIDATE_CARD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Card validation failed');
      }

      return data;
    } catch (error) {
      console.error('Error validating card:', error);
      throw error;
    }
  },

  // Create payment
  async createPayment(paymentData: PaymentRequest): Promise<Payment> {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENT.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: paymentData.userId,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          cardNumber: paymentData.cardData.cardNumber,
          cvv: paymentData.cardData.cvv,
          expiryMonth: paymentData.cardData.expiryMonth,
          expiryYear: paymentData.cardData.expiryYear,
          description: paymentData.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed');
      }

      return data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Get payment status
  async getPaymentStatus(transactionId: string): Promise<Payment> {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENT.STATUS(transactionId), {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get payment status');
      }

      return data;
    } catch (error) {
      console.error('Error getting payment status:', error);
      throw error;
    }
  },

  // Get payment history
  async getPaymentHistory(userId: string, params: PaymentHistoryParams = {}): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.status) searchParams.append('status', params.status);

      const url = `${API_ENDPOINTS.PAYMENT.HISTORY(userId)}?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get payment history');
      }

      return data;
    } catch (error) {
      console.error('Error getting payment history:', error);
      throw error;
    }
  },

  // Refund payment
  async refundPayment(refundData: RefundRequest): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENT.REFUND, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Refund failed');
      }

      return data;
    } catch (error) {
      console.error('Error refunding payment:', error);
      throw error;
    }
  },

  // Get payment statistics
  async getPaymentStats(params?: { startDate?: string; endDate?: string }): Promise<PaymentStats> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);

      const url = `${API_ENDPOINTS.PAYMENT.STATS}?${searchParams.toString()}`;

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get payment stats');
      }

      return data.statistics || data;
    } catch (error) {
      console.error('Error getting payment stats:', error);
      throw error;
    }
  },

  // Check payment service health
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch(API_ENDPOINTS.PAYMENT.HEALTH);
      return await response.json();
    } catch (error) {
      console.error('Payment service health check failed:', error);
      return null;
    }
  },
};

export default paymentService;
