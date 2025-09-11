// Local Storage Management
class Storage {
    static keys = {
      wallets: 'ginbertfi_wallets',
      CATEGORIES: 'ginbertfi_categories',
      EXPENSES: 'ginbertfi_expenses',
      INCOME_SOURCES: 'ginbertfi_income_sources',
      SELECTED_WALLET: 'ginbertfi_selected_wallet'
    };
  
    static get(key) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      } catch (error) {
        console.error('Error getting data from storage:', error);
        return null;
      }
    }
  
    static set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.error('Error saving data to storage:', error);
        return false;
      }
    }
  
    static remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.error('Error removing data from storage:', error);
        return false;
      }
    }
  
    // Wallet methods
    static getWallets() {
      return this.get(this.keys.wallets) || [];
    }
  
    static saveWallets(wallets) {
      return this.set(this.keys.wallets, wallets);
    }
  
    static addWallet(wallet) {
      const wallets = this.getWallets();
      wallet.id = Date.now().toString();
      wallet.createdAt = new Date().toISOString();
      wallets.push(wallet);
      return this.saveWallets(wallets);
    }
  
    static updateWallet(walletId, updates) {
      const wallets = this.getWallets();
      const index = wallets.findIndex(acc => acc.id === walletId);
      if (index !== -1) {
        wallets[index] = { ...wallets[index], ...updates };
        return this.saveWallets(wallets);
      }
      return false;
    }
  
    static getSelectedWallet() {
      const selectedId = this.get(this.keys.SELECTED_WALLET);
      if (selectedId) {
        const wallets = this.getWallets();
        return wallets.find(acc => acc.id === selectedId);
      }
      const wallets = this.getWallets();
      return wallets.length > 0 ? wallets[0] : null;
    }
  
    static setSelectedWallet(walletId) {
      return this.set(this.keys.SELECTED_WALLET, walletId);
    }
  
    // Category methods
    static getCategories() {
      return this.get(this.keys.CATEGORIES) || [];
    }
  
    static saveCategories(categories) {
      return this.set(this.keys.CATEGORIES, categories);
    }
  
    static addCategory(category) {
      const categories = this.getCategories();
      category.id = Date.now().toString();
      category.createdAt = new Date().toISOString();
      category.subcategories = [];
      categories.push(category);
      return this.saveCategories(categories);
    }
  
    static addSubcategory(categoryId, subcategory) {
      const categories = this.getCategories();
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        const now = new Date();
        subcategory.id = Date.now().toString();
        subcategory.createdAt = now.toISOString();
        subcategory.categoryId = categoryId;
    
        // 🔹 Calcular fechas desde la frecuencia
        subcategory.startDate = subcategory.startDate || getDefaultStartDate(subcategory.frequency);
        subcategory.endDate = getEndDate(subcategory.startDate, subcategory.frequency);
    
        category.subcategories.push(subcategory);
        return this.saveCategories(categories);
      }
      return false;
    }
    
  
    // Expense methods
    static getExpenses() {
      return this.get(this.keys.EXPENSES) || [];
    }
  
    static saveExpenses(expenses) {
      return this.set(this.keys.EXPENSES, expenses);
    }
  
    static addExpense(expense) {
      const expenses = this.getExpenses();
      expense.id = Date.now().toString();
      expense.createdAt = new Date().toISOString();
      expenses.push(expense);

      // Update wallet balance and add transaction record
      const wallets = this.getWallets();
      const wallet = wallets.find(acc => acc.id === expense.walletId);
      if (wallet) {
        wallet.balance -= parseFloat(expense.amount);
        this.saveWallets(wallets);

        const transaction = {
          id: 'exp-' + expense.id,
          walletId: expense.walletId,
          type: 'expense',
          amount: -parseFloat(expense.amount),
          description: expense.name,
          date: expense.date
        };

        const transactions = this.get('ginbertfi_transactions') || [];
        transactions.push(transaction);
        this.set('ginbertfi_transactions', transactions);
      }

      return this.saveExpenses(expenses);
    }
  
    // Income source methods
    static getIncomeSources() {
      return this.get(this.keys.INCOME_SOURCES) || ['Sueldo', 'Freelance', 'Inversiones', 'Regalo', 'Otros'];
    }
  
    static saveIncomeSources(sources) {
      return this.set(this.keys.INCOME_SOURCES, sources);
    }
  
    static addIncomeSource(source) {
      const sources = this.getIncomeSources();
      if (!sources.includes(source)) {
        sources.push(source);
        return this.saveIncomeSources(sources);
      }
      return false;
    }
  
    // Transaction methods
    static addIncome(walletId, amount, source, description = '') {
      const wallets = this.getWallets();
      const wallet = wallets.find(acc => acc.id === walletId);
      if (wallet) {
        wallet.balance += parseFloat(amount);
        this.saveWallets(wallets);
        
        // Add transaction record
        const transaction = {
          id: Date.now().toString(),
          walletId,
          type: 'income',
          amount: parseFloat(amount),
          source,
          description,
          date: new Date().toISOString()
        };
        
        const transactions = this.get('ginbertfi_transactions') || [];
        transactions.push(transaction);
        this.set('ginbertfi_transactions', transactions);
        
        return true;
      }
      return false;
    }
  
    static transferMoney(fromWalletId, toWalletId, amount, description = '') {
      const wallets = this.getWallets();
      const fromWallet = wallets.find(acc => acc.id === fromWalletId);
      const toWallet = wallets.find(acc => acc.id === toWalletId);
      
      if (fromWallet && toWallet && fromWallet.balance >= parseFloat(amount)) {
        fromWallet.balance -= parseFloat(amount);
        toWallet.balance += parseFloat(amount);
        this.saveWallets(wallets);
        
        // Add transaction records
        const transactions = this.get('ginbertfi_transactions') || [];
        const timestamp = new Date().toISOString();
        
        transactions.push({
          id: Date.now().toString(),
          walletId: fromWalletId,
          type: 'transfer_out',
          amount: -parseFloat(amount),
          description: `Transferencia a ${toWallet.name}: ${description}`,
          date: timestamp
        });
        
        transactions.push({
          id: (Date.now() + 1).toString(),
          walletId: toWalletId,
          type: 'transfer_in',
          amount: parseFloat(amount),
          description: `Transferencia de ${fromWallet.name}: ${description}`,
          date: timestamp
        });
        
        this.set('ginbertfi_transactions', transactions);
        return true;
      }
      return false;
    }
        // Edit category
        static updateCategory(categoryId, updates) {
          const categories = this.getCategories();
          const index = categories.findIndex(cat => cat.id === categoryId);
          if (index !== -1) {
            categories[index] = { ...categories[index], ...updates };
            return this.saveCategories(categories);
          }
          return false;
        }
    
        // Edit subcategory
        static updateSubcategory(categoryId, subcategoryId, updates) {
          const categories = this.getCategories();
          const category = categories.find(cat => cat.id === categoryId);
          if (category) {
            const subIndex = category.subcategories.findIndex(sub => sub.id === subcategoryId);
            if (subIndex !== -1) {
              const updatedSub = { ...category.subcategories[subIndex], ...updates };
        
              // 🔹 Recalcular endDate si cambia startDate o frequency
              if (updates.startDate || updates.frequency) {
                updatedSub.startDate = updates.startDate || updatedSub.startDate;
                updatedSub.frequency = updates.frequency || updatedSub.frequency;
                updatedSub.endDate = getEndDate(updatedSub.startDate, updatedSub.frequency);
              }
        
              category.subcategories[subIndex] = updatedSub;
              return this.saveCategories(categories);
            }
          }
          return false;
        }
        
        // Storage.js
      static updateExpense(expenseId, updatedData) {
        const expenses = this.getExpenses();
        const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex === -1) return false;

        const oldExpense = expenses[expenseIndex];

        // Restaurar el balance de la wallet anterior
        const wallets = this.getWallets();
        const oldWallet = wallets.find(w => w.id === oldExpense.walletId);
        if (oldWallet) {
          oldWallet.balance += parseFloat(oldExpense.amount); // revertir gasto
        }

        // Aplicar el gasto a la nueva wallet
        const newWallet = wallets.find(w => w.id === updatedData.walletId);
        if (newWallet) {
          if (newWallet.balance < parseFloat(updatedData.amount)) {
            console.warn('Saldo insuficiente en la nueva wallet');
            return false;
          }
          newWallet.balance -= parseFloat(updatedData.amount);
        }

        this.saveWallets(wallets);

        // Actualizar el gasto
        expenses[expenseIndex] = { ...oldExpense, ...updatedData };
        this.saveExpenses(expenses);

        // Actualizar transacciones: opcional, depende si quieres mantener histórico separado
        const transactions = this.get('ginbertfi_transactions') || [];

        // Eliminar transacción antigua del gasto
        const oldTransactionIndex = transactions.findIndex(tx => tx.id === 'exp-' + expenseId);
        if (oldTransactionIndex !== -1) transactions.splice(oldTransactionIndex, 1);

        // Agregar nueva transacción
        const transaction = {
          id: 'exp-' + expenseId,
          walletId: updatedData.walletId,
          type: 'expense',
          amount: -parseFloat(updatedData.amount),
          description: updatedData.name,
          date: updatedData.date
        };
        transactions.push(transaction);
        this.set('ginbertfi_transactions', transactions);

        return true;
      }

        static archiveExpenses(expenses) {
          const archived = this.get('ginbertfi_historical_expenses') || [];
          archived.push(...expenses);
          this.set('ginbertfi_historical_expenses', archived);
        }
        // Eliminar un gasto
static deleteExpense(expenseId) {
  const expenses = this.getExpenses();
  const expenseIndex = expenses.findIndex(exp => exp.id === expenseId);
  if (expenseIndex === -1) return false;

  const expense = expenses[expenseIndex];

  // ✅ Restaurar el balance en la wallet asociada
  const wallets = this.getWallets();
  const wallet = wallets.find(w => w.id === expense.walletId);
  if (wallet) {
    wallet.balance += parseFloat(expense.amount); // devolvemos el gasto
    this.saveWallets(wallets);
  }

  // ✅ Eliminar el gasto
  expenses.splice(expenseIndex, 1);
  this.saveExpenses(expenses);

  // ✅ Eliminar transacción asociada
  const transactions = this.get('ginbertfi_transactions') || [];
  const txIndex = transactions.findIndex(tx => tx.id === 'exp-' + expenseId);
  if (txIndex !== -1) {
    transactions.splice(txIndex, 1);
    this.set('ginbertfi_transactions', transactions);
  }

  return true;
}

                  
  }
  