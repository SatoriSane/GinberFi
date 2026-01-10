// Verification utility for IndexedDB migration
// Run this in browser console to verify migration status

class MigrationVerifier {
  /**
   * Run all verification checks
   */
  static async verifyAll() {
    console.log('🔍 Starting IndexedDB Migration Verification...\n');

    const results = {
      indexedDBSupport: this.checkIndexedDBSupport(),
      migrationStatus: this.checkMigrationStatus(),
      databaseExists: await this.checkDatabaseExists(),
      storesCreated: await this.checkStoresCreated(),
      dataCount: await this.countAllData(),
      indexesWorking: await this.checkIndexes()
    };

    this.printResults(results);
    return results;
  }

  /**
   * Check if IndexedDB is supported
   */
  static checkIndexedDBSupport() {
    const supported = 'indexedDB' in window;
    console.log(`✓ IndexedDB Support: ${supported ? '✅ YES' : '❌ NO'}`);
    return supported;
  }

  /**
   * Check migration status
   */
  static checkMigrationStatus() {
    const migrated = localStorage.getItem('ginbertfi_migrated_to_indexeddb') === 'true';
    console.log(`✓ Migration Status: ${migrated ? '✅ COMPLETED' : '⚠️ NOT MIGRATED'}`);
    return migrated;
  }

  /**
   * Check if database exists
   */
  static async checkDatabaseExists() {
    try {
      const db = await DBConfig.getDB();
      const exists = db !== null;
      console.log(`✓ Database Exists: ${exists ? '✅ YES' : '❌ NO'}`);
      db.close();
      return exists;
    } catch (error) {
      console.log(`✓ Database Exists: ❌ ERROR - ${error.message}`);
      return false;
    }
  }

  /**
   * Check if all stores were created
   */
  static async checkStoresCreated() {
    try {
      const db = await DBConfig.getDB();
      const storeNames = Array.from(db.objectStoreNames);
      const expectedStores = Object.values(DBConfig.STORES);
      
      console.log('\n📦 Object Stores:');
      expectedStores.forEach(storeName => {
        const exists = storeNames.includes(storeName);
        console.log(`  ${exists ? '✅' : '❌'} ${storeName}`);
      });

      db.close();
      return storeNames.length === expectedStores.length;
    } catch (error) {
      console.log(`❌ Error checking stores: ${error.message}`);
      return false;
    }
  }

  /**
   * Count data in all stores
   */
  static async countAllData() {
    try {
      const counts = {};
      
      console.log('\n📊 Data Count:');
      
      const walletRepo = new WalletRepository();
      counts.wallets = await walletRepo.count();
      console.log(`  Wallets: ${counts.wallets}`);

      const categoryRepo = new CategoryRepository();
      counts.categories = await categoryRepo.count();
      console.log(`  Categories: ${counts.categories}`);

      const expenseRepo = new ExpenseRepository();
      counts.expenses = await expenseRepo.count();
      console.log(`  Expenses: ${counts.expenses}`);

      const transactionRepo = new TransactionRepository();
      counts.transactions = await transactionRepo.count();
      console.log(`  Transactions: ${counts.transactions}`);

      const incomeRepo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
      counts.incomeSources = await incomeRepo.count();
      console.log(`  Income Sources: ${counts.incomeSources}`);

      const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
      counts.historical = await historicalRepo.count();
      console.log(`  Historical Expenses: ${counts.historical}`);

      return counts;
    } catch (error) {
      console.log(`❌ Error counting data: ${error.message}`);
      return null;
    }
  }

  /**
   * Check if indexes are working
   */
  static async checkIndexes() {
    try {
      console.log('\n🔍 Testing Indexes:');
      
      // Test expense indexes
      const expenseRepo = new ExpenseRepository();
      const expenses = await expenseRepo.getAll();
      
      if (expenses.length > 0) {
        const firstExpense = expenses[0];
        
        // Test walletId index
        const byWallet = await expenseRepo.getByWalletId(firstExpense.walletId);
        console.log(`  ✅ walletId index: ${byWallet.length} expenses found`);

        // Test date index
        const byDate = await expenseRepo.getByDate(firstExpense.date);
        console.log(`  ✅ date index: ${byDate.length} expenses found`);
      } else {
        console.log(`  ⚠️ No expenses to test indexes`);
      }

      return true;
    } catch (error) {
      console.log(`  ❌ Error testing indexes: ${error.message}`);
      return false;
    }
  }

  /**
   * Compare localStorage vs IndexedDB data
   */
  static async compareData() {
    console.log('\n🔄 Comparing localStorage vs IndexedDB:\n');

    try {
      // Wallets
      const localWallets = JSON.parse(localStorage.getItem('ginbertfi_wallets') || '[]');
      const dbWallets = await new WalletRepository().getAll();
      console.log(`Wallets - localStorage: ${localWallets.length}, IndexedDB: ${dbWallets.length}`);

      // Categories
      const localCategories = JSON.parse(localStorage.getItem('ginbertfi_categories') || '[]');
      const dbCategories = await new CategoryRepository().getAll();
      console.log(`Categories - localStorage: ${localCategories.length}, IndexedDB: ${dbCategories.length}`);

      // Expenses
      const localExpenses = JSON.parse(localStorage.getItem('ginbertfi_expenses') || '[]');
      const dbExpenses = await new ExpenseRepository().getAll();
      console.log(`Expenses - localStorage: ${localExpenses.length}, IndexedDB: ${dbExpenses.length}`);

      // Transactions
      const localTransactions = JSON.parse(localStorage.getItem('ginbertfi_transactions') || '[]');
      const dbTransactions = await new TransactionRepository().getAll();
      console.log(`Transactions - localStorage: ${localTransactions.length}, IndexedDB: ${dbTransactions.length}`);

    } catch (error) {
      console.log(`❌ Error comparing data: ${error.message}`);
    }
  }

  /**
   * Print summary results
   */
  static printResults(results) {
    console.log('\n' + '='.repeat(50));
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(50));
    
    const allPassed = 
      results.indexedDBSupport &&
      results.migrationStatus &&
      results.databaseExists &&
      results.storesCreated;

    if (allPassed) {
      console.log('✅ All checks passed! IndexedDB is working correctly.');
    } else {
      console.log('⚠️ Some checks failed. Review the details above.');
    }
    
    console.log('='.repeat(50) + '\n');
  }

  /**
   * Get database size estimate
   */
  static async estimateSize() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usage = (estimate.usage / 1024 / 1024).toFixed(2);
      const quota = (estimate.quota / 1024 / 1024).toFixed(2);
      
      console.log('\n💾 Storage Usage:');
      console.log(`  Used: ${usage} MB`);
      console.log(`  Available: ${quota} MB`);
      console.log(`  Percentage: ${((estimate.usage / estimate.quota) * 100).toFixed(2)}%`);
    } else {
      console.log('⚠️ Storage estimation not supported in this browser');
    }
  }
}

// Auto-run verification if this script is loaded
if (typeof window !== 'undefined') {
  console.log('💡 Migration Verifier loaded. Run: MigrationVerifier.verifyAll()');
}
