// Resumen tab functionality
class ResumenManager {
    constructor() {
      this.statsContainer = document.getElementById('statsContainer');
      
      this.init();
    }
  
    init() {
      this.render();
      
      // Listen for data updates
      window.appEvents.on('dataUpdated', () => {
        this.render();
      });
      
      // Listen for tab changes
      window.appEvents.on('tabChanged', (tabName) => {
        if (tabName === 'resumen') {
          this.render();
        }
      });
    }
  
    render() {
      // For now, just show placeholder content
      this.statsContainer.innerHTML = `
        <div class="stats-placeholder">
          <div class="coming-soon-icon">📊</div>
          <h3>Estadísticas y Resumen</h3>
          <p>Esta sección mostrará estadísticas detalladas de tus gastos, ingresos y tendencias financieras.</p>
          <p>Próximamente podrás ver:</p>
          <ul style="text-align: left; max-width: 400px; margin: 0 auto;">
            <li>Gráficos de gastos por categoría</li>
            <li>Tendencias de gastos mensuales</li>
            <li>Análisis de ingresos por fuente</li>
            <li>Configuraciones rápidas</li>
            <li>Exportación de datos</li>
          </ul>
        </div>
      `;
    }
  
    // Future methods for statistics
    calculateTotalExpenses() {
      return AppState.expenses.reduce((total, expense) => total + expense.amount, 0);
    }
  
    calculateTotalIncome() {
      const transactions = Storage.get('ginbertfi_transactions') || [];
      return transactions
        .filter(t => t.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0);
    }
  
    getExpensesByCategory() {
      const expenses = AppState.expenses;
      const categories = AppState.categories;
      
      return categories.map(category => {
        const categoryExpenses = expenses.filter(expense => {
          return category.subcategories.some(sub => sub.id === expense.subcategoryId);
        });
        
        const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        return {
          name: category.name,
          total: total,
          expenses: categoryExpenses
        };
      });
    }
  
    getIncomeBySource() {
      const transactions = Storage.get('ginbertfi_transactions') || [];
      const incomes = transactions.filter(t => t.type === 'income');
      
      const sourceMap = {};
      incomes.forEach(income => {
        if (!sourceMap[income.source]) {
          sourceMap[income.source] = 0;
        }
        sourceMap[income.source] += income.amount;
      });
      
      return Object.entries(sourceMap).map(([source, amount]) => ({
        source,
        amount
      }));
    }
  }
  
  // Initialize resumen manager when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new ResumenManager();
  });
  