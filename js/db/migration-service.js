// Migration Service - Migrate data from localStorage to IndexedDB
class MigrationService {
  static MIGRATION_KEY = 'ginbertfi_migrated_to_indexeddb';

  /**
   * Check if migration has already been completed
   */
  static isMigrated() {
    return localStorage.getItem(this.MIGRATION_KEY) === 'true';
  }

  /**
   * Mark migration as completed
   */
  static markAsMigrated() {
    localStorage.setItem(this.MIGRATION_KEY, 'true');
  }

  /**
   * Migrate all data from localStorage to IndexedDB
   */
  static async migrateAll() {
    if (this.isMigrated()) {
      console.log('Migration already completed');
      return true;
    }

    console.log('Starting migration from localStorage to IndexedDB...');

    try {
      // Initialize IndexedDB
      await DBConfig.initDB();

      // Migrate each data type
      await this.migrateWallets();
      await this.migrateCategories();
      await this.migrateExpenses();
      await this.migrateTransactions();
      await this.migrateIncomeSources();
      await this.migrateHistoricalExpenses();
      await this.migrateSettings();

      // Mark migration as complete
      this.markAsMigrated();
      console.log('Migration completed successfully!');
      return true;
    } catch (error) {
      console.error('Migration failed:', error);
      return false;
    }
  }

  /**
   * Migrate wallets
   */
  static async migrateWallets() {
    const wallets = this.getFromLocalStorage('ginbertfi_wallets');
    if (wallets && wallets.length > 0) {
      const repo = new WalletRepository();
      for (const wallet of wallets) {
        await repo.add(wallet);
      }
      console.log(`Migrated ${wallets.length} wallets`);
    }
  }

  /**
   * Migrate categories
   */
  static async migrateCategories() {
    const categories = this.getFromLocalStorage('ginbertfi_categories');
    if (categories && categories.length > 0) {
      const repo = new CategoryRepository();
      for (const category of categories) {
        await repo.add(category);
      }
      console.log(`Migrated ${categories.length} categories`);
    }
  }

  /**
   * Migrate expenses
   */
  static async migrateExpenses() {
    const expenses = this.getFromLocalStorage('ginbertfi_expenses');
    if (expenses && expenses.length > 0) {
      const repo = new ExpenseRepository();
      for (const expense of expenses) {
        await repo.add(expense);
      }
      console.log(`Migrated ${expenses.length} expenses`);
    }
  }

  /**
   * Migrate transactions
   */
  static async migrateTransactions() {
    const transactions = this.getFromLocalStorage('ginbertfi_transactions');
    if (transactions && transactions.length > 0) {
      const repo = new TransactionRepository();
      for (const transaction of transactions) {
        await repo.add(transaction);
      }
      console.log(`Migrated ${transactions.length} transactions`);
    }
  }

  /**
   * Migrate income sources
   */
  static async migrateIncomeSources() {
    const sources = this.getFromLocalStorage('ginbertfi_income_sources');
    if (sources && sources.length > 0) {
      const repo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
      for (const source of sources) {
        await repo.add({ name: source });
      }
      console.log(`Migrated ${sources.length} income sources`);
    }
  }

  /**
   * Migrate historical expenses
   */
  static async migrateHistoricalExpenses() {
    const historical = this.getFromLocalStorage('ginbertfi_historical_expenses');
    if (historical && historical.length > 0) {
      const repo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
      for (const expense of historical) {
        await repo.add(expense);
      }
      console.log(`Migrated ${historical.length} historical expenses`);
    }
  }

  /**
   * Migrate settings (selected wallet, etc.)
   */
  static async migrateSettings() {
    const selectedWallet = localStorage.getItem('ginbertfi_selected_wallet');
    if (selectedWallet) {
      const repo = new BaseRepository(DBConfig.STORES.SETTINGS);
      await repo.add({
        key: 'selected_wallet',
        value: JSON.parse(selectedWallet)
      });
      console.log('Migrated selected wallet setting');
    }
  }

  /**
   * Helper to get data from localStorage
   */
  static getFromLocalStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage:`, error);
      return null;
    }
  }

  /**
   * Backup localStorage data before migration
   */
  static backupLocalStorage() {
    const backup = {};
    const keys = [
      'ginbertfi_wallets',
      'ginbertfi_categories',
      'ginbertfi_expenses',
      'ginbertfi_transactions',
      'ginbertfi_income_sources',
      'ginbertfi_historical_expenses',
      'ginbertfi_selected_wallet'
    ];

    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        backup[key] = data;
      }
    });

    const backupString = JSON.stringify(backup);
    const blob = new Blob([backupString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `ginberfi-backup-${new Date().toISOString()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    console.log('Backup created successfully');
  }

  /**
   * Clear localStorage data after successful migration (optional)
   */
  static clearLocalStorageData() {
    const keys = [
      'ginbertfi_wallets',
      'ginbertfi_categories',
      'ginbertfi_expenses',
      'ginbertfi_transactions',
      'ginbertfi_income_sources',
      'ginbertfi_historical_expenses'
    ];

    keys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log('localStorage data cleared');
  }
}
