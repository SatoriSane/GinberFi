// Transaction Repository - Specialized operations for transactions
class TransactionRepository extends BaseRepository {
  constructor() {
    super(DBConfig.STORES.TRANSACTIONS);
  }

  /**
   * Add a new transaction with auto-generated ID
   */
  async addTransaction(transaction) {
    if (!transaction.id) {
      transaction.id = Date.now().toString();
    }
    transaction.createdAt = transaction.createdAt || new Date().toISOString();
    return await this.add(transaction);
  }

  /**
   * Get transactions by wallet ID
   */
  async getByWalletId(walletId) {
    return await this.getByIndex('walletId', walletId);
  }

  /**
   * Get transactions by type
   */
  async getByType(type) {
    return await this.getByIndex('type', type);
  }

  /**
   * Get transactions by date range
   */
  async getByDateRange(startDate, endDate) {
    return await this.getByIndexRange('date', startDate, endDate);
  }

  /**
   * Get transactions by wallet and type
   */
  async getByWalletAndType(walletId, type) {
    const transactions = await this.getByWalletId(walletId);
    return transactions.filter(tx => tx.type === type);
  }

  /**
   * Get transactions by wallet and date range
   */
  async getByWalletAndDateRange(walletId, startDate, endDate) {
    const transactions = await this.getByWalletId(walletId);
    return transactions.filter(tx => tx.date >= startDate && tx.date <= endDate);
  }

  /**
   * Delete transactions by wallet ID
   */
  async deleteByWalletId(walletId) {
    const transactions = await this.getByWalletId(walletId);
    const ids = transactions.map(tx => tx.id);
    return await this.deleteMany(ids);
  }

  /**
   * Get total income for a wallet
   */
  async getTotalIncome(walletId) {
    const transactions = await this.getByWalletAndType(walletId, 'income');
    return transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  }

  /**
   * Get total expenses for a wallet
   */
  async getTotalExpenses(walletId) {
    const transactions = await this.getByWalletAndType(walletId, 'expense');
    return transactions.reduce((sum, tx) => sum + Math.abs(parseFloat(tx.amount || 0)), 0);
  }

  /**
   * Get recent transactions for a wallet
   */
  async getRecent(walletId, limit = 10) {
    const transactions = await this.getByWalletId(walletId);
    return transactions
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, limit);
  }

  /**
   * Add income transaction
   */
  async addIncome(walletId, amount, source, description = '', date = null) {
    const transaction = {
      id: Date.now().toString(),
      walletId,
      type: 'income',
      amount: parseFloat(amount),
      source,
      description,
      date: date || Helpers.getCurrentLocalDateISO()
    };
    return await this.addTransaction(transaction);
  }

  /**
   * Add expense transaction
   */
  async addExpense(expenseId, walletId, amount, description, date) {
    const transaction = {
      id: 'exp-' + expenseId,
      walletId,
      type: 'expense',
      amount: -parseFloat(amount),
      description,
      date
    };
    return await this.addTransaction(transaction);
  }

  /**
   * Add transfer transactions (out and in)
   */
  async addTransfer(fromWalletId, toWalletId, amount, description = '', fromWalletName = '', toWalletName = '') {
    const timestamp = Helpers.getCurrentLocalDateISO();
    const baseId = Date.now();

    const transferOut = {
      id: baseId.toString(),
      walletId: fromWalletId,
      type: 'transfer_out',
      amount: -parseFloat(amount),
      description: `Transf. a ${toWalletName}${description ? ': ' + description : ''}`,
      date: timestamp
    };

    const transferIn = {
      id: (baseId + 1).toString(),
      walletId: toWalletId,
      type: 'transfer_in',
      amount: parseFloat(amount),
      description: `Transf. de ${fromWalletName}${description ? ': ' + description : ''}`,
      date: timestamp
    };

    await this.addTransaction(transferOut);
    await this.addTransaction(transferIn);
    return true;
  }
}
