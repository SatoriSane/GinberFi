/**
 * Database Upgrade Utility - v1 to v2
 * Run this once to upgrade the database to version 2 (adds scheduled_payments store)
 */

class DBUpgradeV2 {
  static async checkAndUpgrade() {
    console.log('🔍 Checking database version...');
    
    // Check current DB version
    const currentVersion = await this.getCurrentVersion();
    console.log(`Current DB version: ${currentVersion}`);
    
    // Check if scheduled_payments store exists
    const hasScheduledPayments = await this.checkScheduledPaymentsStore();
    
    if (currentVersion < 2 || !hasScheduledPayments) {
      if (currentVersion >= 2 && !hasScheduledPayments) {
        console.log('⚠️ Database is in inconsistent state (v2 without scheduled_payments store)');
      } else {
        console.log('⚠️ Database needs upgrade to version 2');
      }
      return await this.performUpgrade();
    } else {
      console.log('✅ Database is already at version 2 with scheduled_payments store');
      return true;
    }
  }

  static async checkScheduledPaymentsStore() {
    return new Promise((resolve) => {
      const request = indexedDB.open(DBConfig.DB_NAME);
      
      request.onsuccess = () => {
        const db = request.result;
        const hasStore = db.objectStoreNames.contains('scheduled_payments');
        db.close();
        resolve(hasStore);
      };
      
      request.onerror = () => {
        console.error('Error checking scheduled_payments store');
        resolve(false);
      };
    });
  }

  static async getCurrentVersion() {
    return new Promise((resolve) => {
      const request = indexedDB.open(DBConfig.DB_NAME);
      
      request.onsuccess = () => {
        const db = request.result;
        const version = db.version;
        db.close();
        resolve(version);
      };
      
      request.onerror = () => {
        console.error('Error checking DB version');
        resolve(0);
      };
    });
  }

  static async performUpgrade() {
    try {
      console.log('🔄 Starting database upgrade...');
      
      // Step 1: Close any existing connection
      DBConfig.closeDB();
      console.log('✓ Closed existing connections');
      
      // Step 2: Delete old database
      console.log('🗑️ Deleting old database...');
      await DBConfig.resetDB();
      console.log('✓ Old database deleted');
      
      // Step 3: Initialize new database with version 2
      console.log('🆕 Creating new database v2...');
      await DBConfig.initDB();
      console.log('✓ Database upgraded to version 2');
      
      // Step 4: Re-run migration to restore data
      console.log('📦 Restoring data from localStorage...');
      if (localStorage.getItem('ginbertfi_wallets')) {
        await MigrationService.migrateAll();
        console.log('✓ Data restored from localStorage');
      } else {
        console.log('ℹ️ No localStorage data to restore');
      }
      
      console.log('✅ Database upgrade completed successfully!');
      return true;
      
    } catch (error) {
      console.error('❌ Error during database upgrade:', error);
      return false;
    }
  }

  static async verifyUpgrade() {
    console.log('🔍 Verifying upgrade...');
    
    const db = await DBConfig.getDB();
    const hasScheduledPayments = db.objectStoreNames.contains('scheduled_payments');
    
    if (hasScheduledPayments) {
      console.log('✅ scheduled_payments store verified!');
      return true;
    } else {
      console.error('❌ scheduled_payments store not found!');
      return false;
    }
  }
}

// Auto-run on load if needed
(async function autoUpgrade() {
  // Wait for dependencies to load
  await new Promise(resolve => {
    if (typeof DBConfig !== 'undefined' && typeof MigrationService !== 'undefined') {
      resolve();
    } else {
      setTimeout(resolve, 500);
    }
  });
  
  const upgraded = await DBUpgradeV2.checkAndUpgrade();
  
  if (upgraded) {
    await DBUpgradeV2.verifyUpgrade();
  }
})();
