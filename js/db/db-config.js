// IndexedDB Configuration
class DBConfig {
  static DB_NAME = 'GinberFiDB';
  static DB_VERSION = 2;
  static _dbInstance = null; // Cache de la conexión

  // Object Store Names
  static STORES = {
    WALLETS: 'wallets',
    CATEGORIES: 'categories',
    EXPENSES: 'expenses',
    TRANSACTIONS: 'transactions',
    INCOME_SOURCES: 'income_sources',
    HISTORICAL_EXPENSES: 'historical_expenses',
    SETTINGS: 'settings',
    SCHEDULED_PAYMENTS: 'scheduled_payments'
  };

  // Index definitions for each store
  static INDEXES = {
    WALLETS: [
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ],
    CATEGORIES: [
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ],
    EXPENSES: [
      { name: 'walletId', keyPath: 'walletId', unique: false },
      { name: 'categoryId', keyPath: 'categoryId', unique: false },
      { name: 'subcategoryId', keyPath: 'subcategoryId', unique: false },
      { name: 'date', keyPath: 'date', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ],
    TRANSACTIONS: [
      { name: 'walletId', keyPath: 'walletId', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'date', keyPath: 'date', unique: false }
    ],
    HISTORICAL_EXPENSES: [
      { name: 'categoryId', keyPath: 'categoryId', unique: false },
      { name: 'subcategoryId', keyPath: 'subcategoryId', unique: false },
      { name: 'date', keyPath: 'date', unique: false },
      { name: 'archivedAt', keyPath: 'archivedAt', unique: false }
    ],
    SCHEDULED_PAYMENTS: [
      { name: 'walletId', keyPath: 'walletId', unique: false },
      { name: 'categoryId', keyPath: 'categoryId', unique: false },
      { name: 'subcategoryId', keyPath: 'subcategoryId', unique: false },
      { name: 'dueDate', keyPath: 'dueDate', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'isRecurring', keyPath: 'isRecurring', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false }
    ]
  };

  /**
   * Initialize the database and create object stores
   */
  static async initDB() {
    if (this._dbInstance) {
      return this._dbInstance;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('Database opened successfully');
        this._dbInstance = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('Upgrading database...');

        // Create Wallets store
        if (!db.objectStoreNames.contains(this.STORES.WALLETS)) {
          const walletStore = db.createObjectStore(this.STORES.WALLETS, { keyPath: 'id' });
          this.INDEXES.WALLETS.forEach(index => {
            walletStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create Categories store
        if (!db.objectStoreNames.contains(this.STORES.CATEGORIES)) {
          const categoryStore = db.createObjectStore(this.STORES.CATEGORIES, { keyPath: 'id' });
          this.INDEXES.CATEGORIES.forEach(index => {
            categoryStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create Expenses store
        if (!db.objectStoreNames.contains(this.STORES.EXPENSES)) {
          const expenseStore = db.createObjectStore(this.STORES.EXPENSES, { keyPath: 'id' });
          this.INDEXES.EXPENSES.forEach(index => {
            expenseStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create Transactions store
        if (!db.objectStoreNames.contains(this.STORES.TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(this.STORES.TRANSACTIONS, { keyPath: 'id' });
          this.INDEXES.TRANSACTIONS.forEach(index => {
            transactionStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create Historical Expenses store
        if (!db.objectStoreNames.contains(this.STORES.HISTORICAL_EXPENSES)) {
          const historicalStore = db.createObjectStore(this.STORES.HISTORICAL_EXPENSES, { keyPath: 'id' });
          this.INDEXES.HISTORICAL_EXPENSES.forEach(index => {
            historicalStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        // Create Income Sources store (simple key-value)
        if (!db.objectStoreNames.contains(this.STORES.INCOME_SOURCES)) {
          db.createObjectStore(this.STORES.INCOME_SOURCES, { keyPath: 'name' });
        }

        // Create Settings store (simple key-value)
        if (!db.objectStoreNames.contains(this.STORES.SETTINGS)) {
          db.createObjectStore(this.STORES.SETTINGS, { keyPath: 'key' });
        }

        // Create Scheduled Payments store
        if (!db.objectStoreNames.contains(this.STORES.SCHEDULED_PAYMENTS)) {
          const scheduledStore = db.createObjectStore(this.STORES.SCHEDULED_PAYMENTS, { keyPath: 'id' });
          this.INDEXES.SCHEDULED_PAYMENTS.forEach(index => {
            scheduledStore.createIndex(index.name, index.keyPath, { unique: index.unique });
          });
        }

        console.log('Database upgrade complete');
      };
    });
  }

  /**
   * Get a database connection
   */
  static async getDB() {
    if (this._dbInstance) {
      return this._dbInstance;
    }
    
    // Si no existe, inicializar
    return await this.initDB();
  }

  /**
   * Close current database connection
   */
  static closeDB() {
    if (this._dbInstance) {
      this._dbInstance.close();
      this._dbInstance = null;
      console.log('Database connection closed');
    }
  }

  /**
   * Reset database (useful for testing or fixing upgrade issues)
   */
  static async resetDB() {
    return new Promise((resolve, reject) => {
      this.closeDB();
      
      const request = indexedDB.deleteDatabase(this.DB_NAME);
      
      request.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('Error deleting database:', request.error);
        reject(request.error);
      };
      
      request.onblocked = () => {
        console.warn('Database deletion blocked. Close all tabs using this database.');
      };
    });
  }

  /**
   * Check if IndexedDB is supported
   */
  static isSupported() {
    return 'indexedDB' in window;
  }
}
