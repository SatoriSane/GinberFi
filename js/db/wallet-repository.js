// Wallet Repository - Specialized operations for wallets
class WalletRepository extends BaseRepository {
  constructor() {
    super(DBConfig.STORES.WALLETS);
  }

  /**
   * Add a new wallet with auto-generated ID
   */
  async addWallet(wallet) {
    wallet.id = Date.now().toString();
    wallet.createdAt = new Date().toISOString();
    return await this.add(wallet);
  }

  /**
   * Update wallet balance
   */
  async updateBalance(walletId, newBalance) {
    const wallet = await this.getById(walletId);
    if (wallet) {
      wallet.balance = newBalance;
      return await this.update(wallet);
    }
    return false;
  }

  /**
   * Increment wallet balance (for income)
   */
  async incrementBalance(walletId, amount) {
    const wallet = await this.getById(walletId);
    if (wallet) {
      wallet.balance += parseFloat(amount);
      return await this.update(wallet);
    }
    return false;
  }

  /**
   * Decrement wallet balance (for expenses)
   */
  async decrementBalance(walletId, amount) {
    const wallet = await this.getById(walletId);
    if (wallet) {
      wallet.balance -= parseFloat(amount);
      return await this.update(wallet);
    }
    return false;
  }

  /**
   * Get wallet by currency
   */
  async getWalletsByCurrency(currency) {
    const wallets = await this.getAll();
    return wallets.filter(w => w.currency === currency);
  }

  /**
   * Get total balance across all wallets
   */
  async getTotalBalance() {
    const wallets = await this.getAll();
    return wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(walletId, amount) {
    const wallet = await this.getById(walletId);
    return wallet && wallet.balance >= parseFloat(amount);
  }
}
