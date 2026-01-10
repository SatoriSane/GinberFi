// Storage wrapper using IndexedDB (maintains same API as localStorage version)
class Storage {
  static keys = {
    wallets: 'ginbertfi_wallets',
    CATEGORIES: 'ginbertfi_categories',
    EXPENSES: 'ginbertfi_expenses',
    INCOME_SOURCES: 'ginbertfi_income_sources',
    SELECTED_WALLET: 'ginbertfi_selected_wallet'
  };

  // Repository instances
  static walletRepo = new WalletRepository();
  static categoryRepo = new CategoryRepository();
  static expenseRepo = new ExpenseRepository();
  static transactionRepo = new TransactionRepository();
  static scheduledPaymentRepo = new ScheduledPaymentRepository();

  /**
   * Initialize IndexedDB and run migration if needed
   */
  static async init() {
    try {
      if (!DBConfig.isSupported()) {
        console.warn('IndexedDB not supported, falling back to localStorage');
        return false;
      }

      await DBConfig.initDB();
      
      // Run migration if not already done
      if (!MigrationService.isMigrated()) {
        await MigrationService.migrateAll();
      }

      return true;
    } catch (error) {
      console.error('Error initializing storage:', error);
      return false;
    }
  }

  // Legacy methods for compatibility (not used with IndexedDB)
  static get(key) {
    console.warn('Storage.get() is deprecated with IndexedDB');
    return null;
  }

  static set(key, value) {
    console.warn('Storage.set() is deprecated with IndexedDB');
    return false;
  }

  static remove(key) {
    console.warn('Storage.remove() is deprecated with IndexedDB');
    return false;
  }

  // Wallet methods
  static async getWallets() {
    return await this.walletRepo.getAll();
  }

  static async saveWallets(wallets) {
    await this.walletRepo.clear();
    for (const wallet of wallets) {
      await this.walletRepo.add(wallet);
    }
    return true;
  }

  static async addWallet(wallet) {
    try {
      await this.walletRepo.addWallet(wallet);
      return true;
    } catch (error) {
      console.error('Error adding wallet:', error);
      return false;
    }
  }

  static async updateWallet(walletId, updates) {
    try {
      const wallet = await this.walletRepo.getById(walletId);
      if (wallet) {
        const updated = { ...wallet, ...updates };
        await this.walletRepo.update(updated);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating wallet:', error);
      return false;
    }
  }

  static async getSelectedWallet() {
    try {
      const settingsRepo = new BaseRepository(DBConfig.STORES.SETTINGS);
      const setting = await settingsRepo.getById('selected_wallet');
      
      if (setting && setting.value) {
        return await this.walletRepo.getById(setting.value);
      }
      
      const wallets = await this.getWallets();
      return wallets.length > 0 ? wallets[0] : null;
    } catch (error) {
      console.error('Error getting selected wallet:', error);
      return null;
    }
  }

  static async setSelectedWallet(walletId) {
    try {
      const settingsRepo = new BaseRepository(DBConfig.STORES.SETTINGS);
      const setting = {
        key: 'selected_wallet',
        value: walletId
      };
      
      // Intentar actualizar, si no existe, agregar
      try {
        await settingsRepo.update(setting);
      } catch (updateError) {
        // Si falla el update (no existe), hacer add
        await settingsRepo.add(setting);
      }
      
      return true;
    } catch (error) {
      console.error('Error setting selected wallet:', error);
      return false;
    }
  }

  // Category methods
  static async getCategories() {
    return await this.categoryRepo.getAll();
  }

  static async saveCategories(categories) {
    await this.categoryRepo.clear();
    for (const category of categories) {
      await this.categoryRepo.add(category);
    }
    return true;
  }

  static async addCategory(category) {
    try {
      await this.categoryRepo.addCategory(category);
      return true;
    } catch (error) {
      console.error('Error adding category:', error);
      return false;
    }
  }

  static async addSubcategory(categoryId, subcategory) {
    try {
      return await this.categoryRepo.addSubcategory(categoryId, subcategory);
    } catch (error) {
      console.error('Error adding subcategory:', error);
      return false;
    }
  }

  static async updateCategory(categoryId, updates) {
    try {
      return await this.categoryRepo.updateCategory(categoryId, updates);
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  }

  static async updateSubcategory(categoryId, subcategoryId, updates) {
    try {
      return await this.categoryRepo.updateSubcategory(categoryId, subcategoryId, updates);
    } catch (error) {
      console.error('Error updating subcategory:', error);
      return false;
    }
  }

  // Expense methods
  static async getExpenses() {
    return await this.expenseRepo.getAll();
  }

  static async saveExpenses(expenses) {
    await this.expenseRepo.clear();
    for (const expense of expenses) {
      await this.expenseRepo.add(expense);
    }
    return true;
  }

  static async addExpense(expense) {
    try {
      await this.expenseRepo.addExpense(expense);

      // Update wallet balance
      await this.walletRepo.decrementBalance(expense.walletId, expense.amount);

      // Add transaction record
      await this.transactionRepo.addExpense(
        expense.id,
        expense.walletId,
        expense.amount,
        expense.name,
        expense.date
      );

      return true;
    } catch (error) {
      console.error('Error adding expense:', error);
      console.error('Expense data:', expense);
      console.error('Error details:', error.message, error.name);
      
      // Mostrar modal de error con detalles técnicos
      const errorTitle = error.name === 'QuotaExceededError' 
        ? 'Almacenamiento Lleno' 
        : 'Error al Guardar Gasto';
      
      const errorMessage = error.name === 'QuotaExceededError'
        ? 'No hay suficiente espacio de almacenamiento. Por favor, exporta datos antiguos o libera espacio en tu navegador.'
        : 'No se pudo guardar el gasto en la base de datos. Por favor, copia los detalles técnicos y compártelos con soporte.';
      
      Helpers.showErrorModal(errorTitle, errorMessage, {
        errorType: error.name,
        errorMessage: error.message,
        expenseId: expense.id,
        expenseName: expense.name,
        expenseAmount: expense.amount,
        categoryId: expense.categoryId,
        subcategoryId: expense.subcategoryId,
        walletId: expense.walletId,
        date: expense.date
      });
      
      return false;
    }
  }

  // Income source methods
  static async getIncomeSources() {
    try {
      const repo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
      const sources = await repo.getAll();
      return sources.length > 0 
        ? sources.map(s => s.name) 
        : ['Sueldo', 'Freelance', 'Inversiones', 'Regalo', 'Otros'];
    } catch (error) {
      console.error('Error getting income sources:', error);
      return ['Sueldo', 'Freelance', 'Inversiones', 'Regalo', 'Otros'];
    }
  }

  static async saveIncomeSources(sources) {
    try {
      const repo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
      await repo.clear();
      for (const source of sources) {
        await repo.add({ name: source });
      }
      return true;
    } catch (error) {
      console.error('Error saving income sources:', error);
      return false;
    }
  }

  static async addIncomeSource(source) {
    try {
      const sources = await this.getIncomeSources();
      if (!sources.includes(source)) {
        sources.push(source);
        return await this.saveIncomeSources(sources);
      }
      return false;
    } catch (error) {
      console.error('Error adding income source:', error);
      return false;
    }
  }

  // Transaction methods
  static async addIncome(walletId, amount, source, description = '') {
    try {
      await this.walletRepo.incrementBalance(walletId, amount);
      await this.transactionRepo.addIncome(walletId, amount, source, description);
      return true;
    } catch (error) {
      console.error('Error adding income:', error);
      return false;
    }
  }

  static async transferMoney(fromWalletId, toWalletId, amount, description = '') {
    try {
      const fromWallet = await this.walletRepo.getById(fromWalletId);
      const toWallet = await this.walletRepo.getById(toWalletId);

      if (!fromWallet || !toWallet) return false;
      if (fromWallet.balance < parseFloat(amount)) return false;

      await this.walletRepo.decrementBalance(fromWalletId, amount);
      await this.walletRepo.incrementBalance(toWalletId, amount);

      await this.transactionRepo.addTransfer(
        fromWalletId,
        toWalletId,
        amount,
        description,
        fromWallet.name,
        toWallet.name
      );

      return true;
    } catch (error) {
      console.error('Error transferring money:', error);
      return false;
    }
  }

  static async updateExpense(expenseId, updatedData) {
    try {
      const oldExpense = await this.expenseRepo.getById(expenseId);
      if (!oldExpense) return false;

      // Restore balance to old wallet
      await this.walletRepo.incrementBalance(oldExpense.walletId, oldExpense.amount);

      // Check new wallet has sufficient balance
      const hasSufficient = await this.walletRepo.hasSufficientBalance(
        updatedData.walletId,
        updatedData.amount
      );
      if (!hasSufficient) {
        console.warn('Insufficient balance in new wallet');
        return false;
      }

      // Deduct from new wallet
      await this.walletRepo.decrementBalance(updatedData.walletId, updatedData.amount);

      // Update expense
      const updated = { ...oldExpense, ...updatedData };
      await this.expenseRepo.update(updated);

      // Update transaction
      await this.transactionRepo.delete('exp-' + expenseId);
      await this.transactionRepo.addExpense(
        expenseId,
        updatedData.walletId,
        updatedData.amount,
        updatedData.name,
        updatedData.date
      );

      return true;
    } catch (error) {
      console.error('Error updating expense:', error);
      return false;
    }
  }

  static async archiveExpenses(expenses) {
    try {
      const ids = expenses.map(exp => exp.id);
      await this.expenseRepo.archiveExpenses(ids);
      return true;
    } catch (error) {
      console.error('Error archiving expenses:', error);
      return false;
    }
  }

  static async deleteSubcategory(categoryId, subcategoryId, options = { action: 'delete', targetSubcategoryId: null }) {
    try {
      if (options.action === 'delete') {
        await this.expenseRepo.deleteBySubcategoryId(subcategoryId);
      } else if (options.action === 'move' && options.targetSubcategoryId) {
        await this.expenseRepo.moveToSubcategory(subcategoryId, options.targetSubcategoryId);
      }

      await this.categoryRepo.deleteSubcategory(categoryId, subcategoryId);
      return true;
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      return false;
    }
  }

  static async deleteExpense(expenseId) {
    try {
      const expense = await this.expenseRepo.getById(expenseId);
      if (!expense) return false;

      // Restore wallet balance
      await this.walletRepo.incrementBalance(expense.walletId, expense.amount);

      // Delete expense
      await this.expenseRepo.delete(expenseId);

      // Delete transaction
      await this.transactionRepo.delete('exp-' + expenseId);

      return true;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return false;
    }
  }

  static async deleteCategory(categoryId, options = { action: 'delete', targetCategoryId: null }) {
    try {
      const category = await this.categoryRepo.getById(categoryId);
      if (!category) return false;

      if (options.action === 'delete') {
        await this.expenseRepo.deleteByCategoryId(categoryId);
      } else if (options.action === 'move' && options.targetCategoryId) {
        const targetCategory = await this.categoryRepo.getById(options.targetCategoryId);
        if (targetCategory && category.subcategories) {
          // Move subcategories
          for (const sub of category.subcategories) {
            await this.categoryRepo.addSubcategory(options.targetCategoryId, sub);
            
            // Update expenses
            const expenses = await this.expenseRepo.getBySubcategoryId(sub.id);
            for (const exp of expenses) {
              exp.categoryId = options.targetCategoryId;
              await this.expenseRepo.update(exp);
            }
          }
        }
      }

      await this.categoryRepo.delete(categoryId);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  }

  static async deleteWallet(walletId) {
    try {
      // Delete transactions
      await this.transactionRepo.deleteByWalletId(walletId);

      // Delete expenses
      const expenses = await this.expenseRepo.getByWalletId(walletId);
      const expenseIds = expenses.map(exp => exp.id);
      await this.expenseRepo.deleteMany(expenseIds);

      // Delete wallet
      await this.walletRepo.delete(walletId);

      // Update selected wallet if needed
      const selectedWallet = await this.getSelectedWallet();
      if (selectedWallet?.id === walletId) {
        const wallets = await this.getWallets();
        if (wallets.length > 0) {
          await this.setSelectedWallet(wallets[0].id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting wallet:', error);
      return false;
    }
  }

  // ============================================
  // SCHEDULED PAYMENTS METHODS
  // ============================================

  /**
   * Get all scheduled payments
   */
  static async getScheduledPayments() {
    try {
      return await this.scheduledPaymentRepo.getAll();
    } catch (error) {
      console.error('Error getting scheduled payments:', error);
      return [];
    }
  }

  /**
   * Get scheduled payment by ID
   */
  static async getScheduledPayment(paymentId) {
    try {
      return await this.scheduledPaymentRepo.getById(paymentId);
    } catch (error) {
      console.error('Error getting scheduled payment:', error);
      return null;
    }
  }

  /**
   * Add new scheduled payment
   */
  static async addScheduledPayment(paymentData) {
    try {
      return await this.scheduledPaymentRepo.addScheduledPayment(paymentData);
    } catch (error) {
      console.error('Error adding scheduled payment:', error);
      return false;
    }
  }

  /**
   * Update scheduled payment
   */
  static async updateScheduledPayment(paymentId, updates) {
    try {
      const payment = await this.scheduledPaymentRepo.getById(paymentId);
      if (!payment) return false;
      
      Object.assign(payment, updates);
      return await this.scheduledPaymentRepo.update(payment);
    } catch (error) {
      console.error('Error updating scheduled payment:', error);
      return false;
    }
  }

  /**
   * Delete scheduled payment
   */
  static async deleteScheduledPayment(paymentId) {
    try {
      return await this.scheduledPaymentRepo.delete(paymentId);
    } catch (error) {
      console.error('Error deleting scheduled payment:', error);
      return false;
    }
  }

  /**
   * Mark payment as paid and create expense
   */
  static async executeScheduledPayment(paymentId, actualDate = null) {
    try {
      const payment = await this.scheduledPaymentRepo.getById(paymentId);
      if (!payment) return false;

      // Create expense
      const expenseData = {
        name: payment.name,
        amount: payment.amount,
        date: actualDate || payment.dueDate,
        walletId: payment.walletId,
        subcategoryId: payment.subcategoryId,
        categoryId: payment.categoryId
      };

      const expenseSuccess = await this.addExpense(expenseData);
      if (!expenseSuccess) return false;

      // Mark payment as paid
      return await this.scheduledPaymentRepo.markAsPaid(paymentId, actualDate);
    } catch (error) {
      console.error('Error executing scheduled payment:', error);
      return false;
    }
  }

  /**
   * Get pending payments
   */
  static async getPendingPayments() {
    try {
      return await this.scheduledPaymentRepo.getPending();
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return [];
    }
  }

  /**
   * Get overdue payments
   */
  static async getOverduePayments() {
    try {
      return await this.scheduledPaymentRepo.getOverdue();
    } catch (error) {
      console.error('Error getting overdue payments:', error);
      return [];
    }
  }

  /**
   * Get upcoming payments (next N days)
   */
  static async getUpcomingPayments(days = 7) {
    try {
      return await this.scheduledPaymentRepo.getUpcoming(days);
    } catch (error) {
      console.error('Error getting upcoming payments:', error);
      return [];
    }
  }

  /**
   * Clean up payments when deleting category/subcategory
   */
  static async deleteScheduledPaymentsBySubcategory(subcategoryId) {
    try {
      return await this.scheduledPaymentRepo.deleteBySubcategoryId(subcategoryId);
    } catch (error) {
      console.error('Error deleting scheduled payments:', error);
      return false;
    }
  }

  static async deleteScheduledPaymentsByCategory(categoryId) {
    try {
      return await this.scheduledPaymentRepo.deleteByCategoryId(categoryId);
    } catch (error) {
      console.error('Error deleting scheduled payments:', error);
      return false;
    }
  }
}
