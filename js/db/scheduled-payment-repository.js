// Scheduled Payment Repository - Specialized operations for scheduled payments
class ScheduledPaymentRepository extends BaseRepository {
  constructor() {
    super(DBConfig.STORES.SCHEDULED_PAYMENTS);
  }

  /**
   * Add a new scheduled payment with auto-generated ID
   */
  async addScheduledPayment(payment) {
    payment.id = Date.now().toString();
    payment.createdAt = new Date().toISOString();
    payment.status = payment.status || 'pending';
    
    // Calculate next due date if recurring
    if (payment.isRecurring && !payment.dueDate) {
      payment.dueDate = this.calculateNextDueDate(payment);
    }
    
    return await this.add(payment);
  }

  /**
   * Get scheduled payments by wallet ID
   */
  async getByWalletId(walletId) {
    return await this.getByIndex('walletId', walletId);
  }

  /**
   * Get scheduled payments by category ID
   */
  async getByCategoryId(categoryId) {
    return await this.getByIndex('categoryId', categoryId);
  }

  /**
   * Get scheduled payments by subcategory ID
   */
  async getBySubcategoryId(subcategoryId) {
    return await this.getByIndex('subcategoryId', subcategoryId);
  }

  /**
   * Get scheduled payments by status
   */
  async getByStatus(status) {
    return await this.getByIndex('status', status);
  }

  /**
   * Get pending scheduled payments
   */
  async getPending() {
    return await this.getByStatus('pending');
  }

  /**
   * Get overdue payments (due date in the past and status is pending)
   */
  async getOverdue() {
    const pending = await this.getPending();
    const today = new Date().toISOString().split('T')[0];
    return pending.filter(payment => payment.dueDate < today);
  }

  /**
   * Get payments due in next N days
   */
  async getUpcoming(days = 7) {
    const pending = await this.getPending();
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    
    const todayStr = today.toISOString().split('T')[0];
    const futureStr = futureDate.toISOString().split('T')[0];
    
    return pending.filter(payment => 
      payment.dueDate >= todayStr && payment.dueDate <= futureStr
    );
  }

  /**
   * Get payments due this month
   */
  async getThisMonth() {
    const pending = await this.getPending();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const monthStart = `${year}-${month}-01`;
    
    // Calculate last day of month
    const nextMonth = new Date(year, today.getMonth() + 1, 0);
    const monthEnd = `${year}-${month}-${String(nextMonth.getDate()).padStart(2, '0')}`;
    
    return pending.filter(payment => 
      payment.dueDate >= monthStart && payment.dueDate <= monthEnd
    );
  }

  /**
   * Get future payments (beyond current month)
   */
  async getFuture() {
    const pending = await this.getPending();
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    
    // Calculate last day of current month
    const nextMonth = new Date(year, today.getMonth() + 1, 0);
    const monthEnd = `${year}-${month}-${String(nextMonth.getDate()).padStart(2, '0')}`;
    
    return pending.filter(payment => payment.dueDate > monthEnd);
  }

  /**
   * Get recurring payments
   */
  async getRecurring() {
    const all = await this.getAll();
    return all.filter(payment => payment.isRecurring);
  }

  /**
   * Mark payment as paid and create expense
   */
  async markAsPaid(paymentId, actualDate = null) {
    const payment = await this.getById(paymentId);
    if (!payment) return false;

    const paidDate = actualDate || new Date().toISOString().split('T')[0];
    
    // Update execution history
    if (!payment.executionHistory) {
      payment.executionHistory = [];
    }
    
    payment.executionHistory.push({
      date: paidDate,
      status: 'paid',
      executedAt: new Date().toISOString()
    });

    // If recurring, calculate next due date
    if (payment.isRecurring) {
      payment.dueDate = this.calculateNextDueDate(payment);
      payment.status = 'pending'; // Keep it pending for next occurrence
    } else {
      payment.status = 'paid'; // One-time payment, mark as completed
    }

    return await this.update(payment);
  }

  /**
   * Skip a payment occurrence
   */
  async skipPayment(paymentId, reason = '') {
    const payment = await this.getById(paymentId);
    if (!payment) return false;

    if (!payment.executionHistory) {
      payment.executionHistory = [];
    }
    
    payment.executionHistory.push({
      date: payment.dueDate,
      status: 'skipped',
      reason: reason,
      executedAt: new Date().toISOString()
    });

    // Calculate next due date if recurring
    if (payment.isRecurring) {
      payment.dueDate = this.calculateNextDueDate(payment);
    } else {
      payment.status = 'skipped';
    }

    return await this.update(payment);
  }

  /**
   * Postpone a payment by N days
   */
  async postponePayment(paymentId, days) {
    const payment = await this.getById(paymentId);
    if (!payment) return false;

    const currentDate = new Date(payment.dueDate);
    currentDate.setDate(currentDate.getDate() + days);
    payment.dueDate = currentDate.toISOString().split('T')[0];

    if (!payment.executionHistory) {
      payment.executionHistory = [];
    }
    
    payment.executionHistory.push({
      action: 'postponed',
      days: days,
      executedAt: new Date().toISOString()
    });

    return await this.update(payment);
  }

  /**
   * Cancel a scheduled payment
   */
  async cancelPayment(paymentId) {
    const payment = await this.getById(paymentId);
    if (!payment) return false;

    payment.status = 'cancelled';
    payment.cancelledAt = new Date().toISOString();

    return await this.update(payment);
  }

  /**
   * Calculate next due date based on recurrence
   */
  calculateNextDueDate(payment) {
    if (!payment.isRecurring) return payment.dueDate;

    const currentDue = new Date(payment.dueDate);
    const nextDue = new Date(currentDue);

    switch (payment.recurrence) {
      case 'weekly':
        nextDue.setDate(currentDue.getDate() + 7);
        break;
      case 'monthly':
        // Keep the same day of month
        nextDue.setMonth(currentDue.getMonth() + 1);
        // Handle month overflow (e.g., Jan 31 -> Feb 28)
        if (nextDue.getDate() !== currentDue.getDate()) {
          nextDue.setDate(0); // Set to last day of previous month
        }
        break;
      case 'quarterly':
        nextDue.setMonth(currentDue.getMonth() + 3);
        break;
      case 'yearly':
        nextDue.setFullYear(currentDue.getFullYear() + 1);
        break;
      case 'biweekly':
        nextDue.setDate(currentDue.getDate() + 14);
        break;
      case 'custom':
        // For custom recurrence, use customDays if provided
        if (payment.customDays) {
          nextDue.setDate(currentDue.getDate() + payment.customDays);
        }
        break;
      default:
        return payment.dueDate;
    }

    return nextDue.toISOString().split('T')[0];
  }

  /**
   * Get statistics for scheduled payments
   */
  async getStats() {
    const all = await this.getAll();
    const pending = all.filter(p => p.status === 'pending');
    const overdue = await this.getOverdue();
    const upcoming = await this.getUpcoming(7);
    const recurring = all.filter(p => p.isRecurring);

    const totalPending = pending.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOverdue = overdue.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalUpcoming = upcoming.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      total: all.length,
      pending: pending.length,
      overdue: overdue.length,
      upcoming: upcoming.length,
      recurring: recurring.length,
      totalPendingAmount: totalPending,
      totalOverdueAmount: totalOverdue,
      totalUpcomingAmount: totalUpcoming
    };
  }

  /**
   * Delete scheduled payments by subcategory ID
   */
  async deleteBySubcategoryId(subcategoryId) {
    // Protección: No permitir eliminar pagos con subcategoryId null
    if (!subcategoryId) {
      console.warn('Attempted to delete scheduled payments with null subcategoryId - operation blocked');
      return false;
    }
    const payments = await this.getBySubcategoryId(subcategoryId);
    const ids = payments.map(p => p.id);
    return await this.deleteMany(ids);
  }

  /**
   * Delete scheduled payments by category ID
   */
  async deleteByCategoryId(categoryId) {
    const payments = await this.getByCategoryId(categoryId);
    const ids = payments.map(p => p.id);
    return await this.deleteMany(ids);
  }
}
