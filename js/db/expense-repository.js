// Expense Repository - Specialized operations for expenses
class ExpenseRepository extends BaseRepository {
  constructor() {
    super(DBConfig.STORES.EXPENSES);
  }

  /**
   * Add a new expense with auto-generated ID
   */
  async addExpense(expense) {
    expense.id = Date.now().toString();
    expense.createdAt = new Date().toISOString();
    
    console.log('ExpenseRepository: Attempting to save expense', {
      id: expense.id,
      name: expense.name,
      amount: expense.amount,
      categoryId: expense.categoryId,
      subcategoryId: expense.subcategoryId
    });
    
    const result = await this.add(expense);
    
    console.log('ExpenseRepository: Expense saved successfully', {
      id: expense.id,
      result: result
    });
    
    return result;
  }

  /**
   * Get expenses by wallet ID
   */
  async getByWalletId(walletId) {
    return await this.getByIndex('walletId', walletId);
  }

  /**
   * Get expenses by category ID
   */
  async getByCategoryId(categoryId) {
    return await this.getByIndex('categoryId', categoryId);
  }

  /**
   * Get expenses by subcategory ID
   */
  async getBySubcategoryId(subcategoryId) {
    return await this.getByIndex('subcategoryId', subcategoryId);
  }

  /**
   * Get expenses by date range
   */
  async getByDateRange(startDate, endDate) {
    return await this.getByIndexRange('date', startDate, endDate);
  }

  /**
   * Get expenses for a specific date
   */
  async getByDate(date) {
    return await this.getByIndex('date', date);
  }

  /**
   * Delete expenses by subcategory ID
   */
  async deleteBySubcategoryId(subcategoryId) {
    // Protección: No permitir eliminar gastos con subcategoryId null (gastos rápidos)
    if (!subcategoryId) {
      console.warn('Attempted to delete expenses with null subcategoryId - operation blocked');
      return false;
    }
    const expenses = await this.getBySubcategoryId(subcategoryId);
    const ids = expenses.map(exp => exp.id);
    return await this.deleteMany(ids);
  }

  /**
   * Delete expenses by category ID
   */
  async deleteByCategoryId(categoryId) {
    // Protección: No permitir eliminar gastos sin clasificar (gastos rápidos)
    if (categoryId === 'unclassified') {
      console.warn('Attempted to delete unclassified expenses - operation blocked');
      return false;
    }
    const expenses = await this.getByCategoryId(categoryId);
    const ids = expenses.map(exp => exp.id);
    return await this.deleteMany(ids);
  }

  /**
   * Move expenses from one subcategory to another
   */
  async moveToSubcategory(fromSubcategoryId, toSubcategoryId) {
    // Protección: No permitir mover gastos desde/hacia null (gastos rápidos)
    if (!fromSubcategoryId || !toSubcategoryId) {
      console.warn('Attempted to move expenses with null subcategoryId - operation blocked');
      return false;
    }
    const expenses = await this.getBySubcategoryId(fromSubcategoryId);
    expenses.forEach(exp => {
      exp.subcategoryId = toSubcategoryId;
    });
    return await this.updateMany(expenses);
  }

  /**
   * Get total spent by wallet
   */
  async getTotalByWallet(walletId) {
    const expenses = await this.getByWalletId(walletId);
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  }

  /**
   * Get total spent by category
   */
  async getTotalByCategory(categoryId) {
    const expenses = await this.getByCategoryId(categoryId);
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  }

  /**
   * Get total spent by subcategory
   */
  async getTotalBySubcategory(subcategoryId) {
    const expenses = await this.getBySubcategoryId(subcategoryId);
    return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  }

  /**
   * Get expenses filtered by multiple criteria
   */
  async getFiltered(filters = {}) {
    let expenses = await this.getAll();

    if (filters.walletId) {
      expenses = expenses.filter(exp => exp.walletId === filters.walletId);
    }

    if (filters.categoryId) {
      expenses = expenses.filter(exp => exp.categoryId === filters.categoryId);
    }

    if (filters.subcategoryId) {
      expenses = expenses.filter(exp => exp.subcategoryId === filters.subcategoryId);
    }

    if (filters.startDate && filters.endDate) {
      expenses = expenses.filter(exp => 
        exp.date >= filters.startDate && exp.date <= filters.endDate
      );
    }

    return expenses;
  }

  /**
   * Archive expenses (move to historical)
   */
  async archiveExpenses(expenseIds) {
    const expenses = [];
    for (const id of expenseIds) {
      const expense = await this.getById(id);
      if (expense) {
        expense.archivedAt = new Date().toISOString();
        expenses.push(expense);
      }
    }
    
    // Move to historical store
    const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
    for (const expense of expenses) {
      await historicalRepo.add(expense);
    }

    // Delete from current expenses
    return await this.deleteMany(expenseIds);
  }
}
