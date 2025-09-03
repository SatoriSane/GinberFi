// Local Storage Management
class Storage {
    static keys = {
      ACCOUNTS: 'ginberfi_accounts',
      CATEGORIES: 'ginberfi_categories',
      EXPENSES: 'ginberfi_expenses',
      INCOME_SOURCES: 'ginberfi_income_sources',
      SELECTED_ACCOUNT: 'ginberfi_selected_account'
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
  
    // Account methods
    static getAccounts() {
      return this.get(this.keys.ACCOUNTS) || [];
    }
  
    static saveAccounts(accounts) {
      return this.set(this.keys.ACCOUNTS, accounts);
    }
  
    static addAccount(account) {
      const accounts = this.getAccounts();
      account.id = Date.now().toString();
      account.createdAt = new Date().toISOString();
      accounts.push(account);
      return this.saveAccounts(accounts);
    }
  
    static updateAccount(accountId, updates) {
      const accounts = this.getAccounts();
      const index = accounts.findIndex(acc => acc.id === accountId);
      if (index !== -1) {
        accounts[index] = { ...accounts[index], ...updates };
        return this.saveAccounts(accounts);
      }
      return false;
    }
  
    static getSelectedAccount() {
      const selectedId = this.get(this.keys.SELECTED_ACCOUNT);
      if (selectedId) {
        const accounts = this.getAccounts();
        return accounts.find(acc => acc.id === selectedId);
      }
      const accounts = this.getAccounts();
      return accounts.length > 0 ? accounts[0] : null;
    }
  
    static setSelectedAccount(accountId) {
      return this.set(this.keys.SELECTED_ACCOUNT, accountId);
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
        subcategory.id = Date.now().toString();
        subcategory.createdAt = new Date().toISOString();
        subcategory.categoryId = categoryId;
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
      
      // Update account balance
      const accounts = this.getAccounts();
      const account = accounts.find(acc => acc.id === expense.accountId);
      if (account) {
        account.balance -= parseFloat(expense.amount);
        this.saveAccounts(accounts);
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
    static addIncome(accountId, amount, source, description = '') {
      const accounts = this.getAccounts();
      const account = accounts.find(acc => acc.id === accountId);
      if (account) {
        account.balance += parseFloat(amount);
        this.saveAccounts(accounts);
        
        // Add transaction record
        const transaction = {
          id: Date.now().toString(),
          accountId,
          type: 'income',
          amount: parseFloat(amount),
          source,
          description,
          date: new Date().toISOString()
        };
        
        const transactions = this.get('ginberfi_transactions') || [];
        transactions.push(transaction);
        this.set('ginberfi_transactions', transactions);
        
        return true;
      }
      return false;
    }
  
    static transferMoney(fromAccountId, toAccountId, amount, description = '') {
      const accounts = this.getAccounts();
      const fromAccount = accounts.find(acc => acc.id === fromAccountId);
      const toAccount = accounts.find(acc => acc.id === toAccountId);
      
      if (fromAccount && toAccount && fromAccount.balance >= parseFloat(amount)) {
        fromAccount.balance -= parseFloat(amount);
        toAccount.balance += parseFloat(amount);
        this.saveAccounts(accounts);
        
        // Add transaction records
        const transactions = this.get('ginberfi_transactions') || [];
        const timestamp = new Date().toISOString();
        
        transactions.push({
          id: Date.now().toString(),
          accountId: fromAccountId,
          type: 'transfer_out',
          amount: -parseFloat(amount),
          description: `Transferencia a ${toAccount.name}: ${description}`,
          date: timestamp
        });
        
        transactions.push({
          id: (Date.now() + 1).toString(),
          accountId: toAccountId,
          type: 'transfer_in',
          amount: parseFloat(amount),
          description: `Transferencia de ${fromAccount.name}: ${description}`,
          date: timestamp
        });
        
        this.set('ginberfi_transactions', transactions);
        return true;
      }
      return false;
    }
  }
  