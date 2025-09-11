// Resumen tab functionality - Interactive expense analytics and charts
class ResumenManager {
  constructor() {
    this.container = document.getElementById('resumenContainer');
    this.currentPeriod = 'month';
    this.currentDate = new Date();
    this.charts = {};
    
    this.init();
  }

  init() {
    this.setupEventListeners();
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

  setupEventListeners() {
    // Period change listeners will be added dynamically when controls are rendered
  }

  render() {
    if (!this.container) return;

    const expenses = this.getAllExpenses();
    const categories = AppState.categories;
    const wallets = AppState.wallets;

    if (expenses.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.container.innerHTML = this.generateHTML(expenses, categories, wallets);
    this.attachEventListeners();
    this.renderCharts(expenses, categories, wallets);
  }

  getAllExpenses() {
    // Get current active expenses
    const activeExpenses = AppState.expenses || [];
    
    // Get historical expenses
    const historicalExpenses = Storage.get('ginbertfi_historical_expenses') || [];
    
    // Combine and sort by date
    return [...activeExpenses, ...historicalExpenses]
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  generateHTML(expenses, categories, wallets) {
    const periodData = this.getFilteredData(expenses);
    const stats = this.calculateStats(periodData, wallets);
    
    return `
      <div class="resumen-header">
        <h2>Resumen de Gastos</h2>
        <div class="period-controls">
          <button class="period-btn ${this.currentPeriod === 'week' ? 'active' : ''}" data-period="week">Semana</button>
          <button class="period-btn ${this.currentPeriod === 'month' ? 'active' : ''}" data-period="month">Mes</button>
          <button class="period-btn ${this.currentPeriod === 'quarter' ? 'active' : ''}" data-period="quarter">Trimestre</button>
          <button class="period-btn ${this.currentPeriod === 'year' ? 'active' : ''}" data-period="year">Año</button>
        </div>
        <div class="date-navigation">
          <button class="nav-btn" id="prevPeriod">‹</button>
          <span class="current-period-label">${this.getPeriodLabel()}</span>
          <button class="nav-btn" id="nextPeriod">›</button>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card total-spent">
          <div class="stat-icon">💸</div>
          <div class="stat-content">
            <div class="stat-value">${Helpers.formatCurrency(stats.totalSpent)}</div>
            <div class="stat-label">Total Gastado</div>
          </div>
        </div>
        <div class="stat-card avg-daily">
          <div class="stat-icon">📅</div>
          <div class="stat-content">
            <div class="stat-value">${Helpers.formatCurrency(stats.avgDaily)}</div>
            <div class="stat-label">Promedio Diario</div>
          </div>
        </div>
        <div class="stat-card transactions">
          <div class="stat-icon">🧾</div>
          <div class="stat-content">
            <div class="stat-value">${stats.transactionCount}</div>
            <div class="stat-label">Transacciones</div>
          </div>
        </div>
        <div class="stat-card top-category">
          <div class="stat-icon">🏆</div>
          <div class="stat-content">
            <div class="stat-value">${stats.topCategory.name}</div>
            <div class="stat-label">Categoría Principal</div>
          </div>
        </div>
      </div>

      <div class="charts-container">
        <div class="chart-section">
          <h3>Gastos por Categoría</h3>
          <div class="chart-wrapper">
            <canvas id="categoryChart"></canvas>
          </div>
        </div>
        
        <div class="chart-section">
          <h3>Tendencia de Gastos</h3>
          <div class="chart-wrapper">
            <canvas id="trendChart"></canvas>
          </div>
        </div>
        
        <div class="chart-section">
          <h3>Distribución por Wallet</h3>
          <div class="chart-wrapper">
            <canvas id="walletChart"></canvas>
          </div>
        </div>
      </div>

      <div class="insights-section">
        <h3>Análisis e Insights</h3>
        <div class="insights-grid">
          ${this.generateInsights(periodData, stats).map(insight => `
            <div class="insight-card ${insight.type}">
              <div class="insight-icon">${insight.icon}</div>
              <div class="insight-content">
                <div class="insight-title">${insight.title}</div>
                <div class="insight-description">${insight.description}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="detailed-breakdown">
        <h3>Desglose Detallado</h3>
        <div class="breakdown-tabs">
          <button class="breakdown-tab active" data-tab="categories">Por Categorías</button>
          <button class="breakdown-tab" data-tab="timeline">Línea de Tiempo</button>
          <button class="breakdown-tab" data-tab="wallets">Por Wallets</button>
        </div>
        
        <div class="breakdown-content">
          <div class="breakdown-panel active" id="categoriesBreakdown">
            ${this.generateCategoriesBreakdown(periodData, categories)}
          </div>
          <div class="breakdown-panel" id="timelineBreakdown">
            ${this.generateTimelineBreakdown(periodData)}
          </div>
          <div class="breakdown-panel" id="walletsBreakdown">
            ${this.generateWalletsBreakdown(periodData, wallets)}
          </div>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    this.container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <h3>No hay datos para mostrar</h3>
        <p>Comienza agregando algunos gastos para ver tu resumen financiero</p>
        <button class="btn-primary" onclick="window.appEvents.emit('tabChanged', 'gastos')">
          Ir a Gastos
        </button>
      </div>
    `;
  }

  getFilteredData(expenses) {
    const { start, end } = this.getPeriodRange();
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= start && expenseDate <= end;
    });
  }

  getPeriodRange() {
    const start = new Date(this.currentDate);
    const end = new Date(this.currentDate);

    switch (this.currentPeriod) {
      case 'week':
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      
      case 'quarter':
        const quarter = Math.floor(start.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(quarter * 3 + 3);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      
      case 'year':
        start.setMonth(0);
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(11);
        end.setDate(31);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  }

  getPeriodLabel() {
    const options = {
      week: { month: 'short', day: 'numeric' },
      month: { year: 'numeric', month: 'long' },
      quarter: { year: 'numeric' },
      year: { year: 'numeric' }
    };

    if (this.currentPeriod === 'week') {
      const { start, end } = this.getPeriodRange();
      return `${start.toLocaleDateString('es-ES', options.week)} - ${end.toLocaleDateString('es-ES', options.week)}`;
    } else if (this.currentPeriod === 'quarter') {
      const quarter = Math.floor(this.currentDate.getMonth() / 3) + 1;
      return `Q${quarter} ${this.currentDate.getFullYear()}`;
    } else {
      return this.currentDate.toLocaleDateString('es-ES', options[this.currentPeriod]);
    }
  }

  calculateStats(expenses, wallets) {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const transactionCount = expenses.length;
    
    // Calculate average daily spending
    const { start, end } = this.getPeriodRange();
    const daysDiff = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const avgDaily = totalSpent / daysDiff;

    // Find top category
    const categorySpending = {};
    expenses.forEach(expense => {
      const category = this.getCategoryForExpense(expense);
      if (category) {
        categorySpending[category.name] = (categorySpending[category.name] || 0) + expense.amount;
      }
    });

    const topCategoryName = Object.keys(categorySpending).reduce((a, b) => 
      categorySpending[a] > categorySpending[b] ? a : b, 'N/A');

    return {
      totalSpent,
      avgDaily,
      transactionCount,
      topCategory: { name: topCategoryName }
    };
  }

  getCategoryForExpense(expense) {
    for (const category of AppState.categories) {
      if (category.subcategories) {
        const subcategory = category.subcategories.find(sub => sub.id === expense.subcategoryId);
        if (subcategory) {
          return category;
        }
      }
    }
    return null;
  }

  generateInsights(expenses, stats) {
    const insights = [];

    // Spending trend insight
    const previousPeriodExpenses = this.getPreviousPeriodExpenses();
    const currentTotal = stats.totalSpent;
    const previousTotal = previousPeriodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    if (previousTotal > 0) {
      const change = ((currentTotal - previousTotal) / previousTotal) * 100;
      if (Math.abs(change) > 10) {
        insights.push({
          type: change > 0 ? 'warning' : 'success',
          icon: change > 0 ? '📈' : '📉',
          title: change > 0 ? 'Gastos Aumentaron' : 'Gastos Disminuyeron',
          description: `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'más' : 'menos'} que el período anterior`
        });
      }
    }

    // High spending day insight
    const dailySpending = this.groupExpensesByDay(expenses);
    const maxDay = Object.keys(dailySpending).reduce((a, b) => 
      dailySpending[a] > dailySpending[b] ? a : b, null);
    
    if (maxDay && dailySpending[maxDay] > stats.avgDaily * 2) {
      insights.push({
        type: 'info',
        icon: '💰',
        title: 'Día de Mayor Gasto',
        description: `${Helpers.formatDate(maxDay)}: ${Helpers.formatCurrency(dailySpending[maxDay])}`
      });
    }

    // Budget performance insight
    const budgetPerformance = this.calculateBudgetPerformance(expenses);
    if (budgetPerformance.overBudgetCount > 0) {
      insights.push({
        type: 'warning',
        icon: '⚠️',
        title: 'Presupuestos Excedidos',
        description: `${budgetPerformance.overBudgetCount} subcategorías excedieron su presupuesto`
      });
    }

    return insights;
  }

  getPreviousPeriodExpenses() {
    const previousDate = new Date(this.currentDate);
    
    switch (this.currentPeriod) {
      case 'week':
        previousDate.setDate(previousDate.getDate() - 7);
        break;
      case 'month':
        previousDate.setMonth(previousDate.getMonth() - 1);
        break;
      case 'quarter':
        previousDate.setMonth(previousDate.getMonth() - 3);
        break;
      case 'year':
        previousDate.setFullYear(previousDate.getFullYear() - 1);
        break;
    }

    const originalDate = this.currentDate;
    this.currentDate = previousDate;
    const expenses = this.getFilteredData(this.getAllExpenses());
    this.currentDate = originalDate;
    
    return expenses;
  }

  groupExpensesByDay(expenses) {
    const dailySpending = {};
    expenses.forEach(expense => {
      const day = expense.date.split('T')[0];
      dailySpending[day] = (dailySpending[day] || 0) + expense.amount;
    });
    return dailySpending;
  }

  calculateBudgetPerformance(expenses) {
    let overBudgetCount = 0;
    
    AppState.categories.forEach(category => {
      if (category.subcategories) {
        category.subcategories.forEach(subcategory => {
          const subcategoryExpenses = expenses.filter(exp => exp.subcategoryId === subcategory.id);
          const spent = subcategoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          if (spent > subcategory.budget) {
            overBudgetCount++;
          }
        });
      }
    });

    return { overBudgetCount };
  }

  generateCategoriesBreakdown(expenses, categories) {
    const categoryData = {};
    
    expenses.forEach(expense => {
      const category = this.getCategoryForExpense(expense);
      if (category) {
        if (!categoryData[category.id]) {
          categoryData[category.id] = {
            name: category.name,
            total: 0,
            count: 0,
            subcategories: {}
          };
        }
        categoryData[category.id].total += expense.amount;
        categoryData[category.id].count++;

        const subcategory = category.subcategories.find(sub => sub.id === expense.subcategoryId);
        if (subcategory) {
          if (!categoryData[category.id].subcategories[subcategory.id]) {
            categoryData[category.id].subcategories[subcategory.id] = {
              name: subcategory.name,
              total: 0,
              count: 0,
              budget: subcategory.budget
            };
          }
          categoryData[category.id].subcategories[subcategory.id].total += expense.amount;
          categoryData[category.id].subcategories[subcategory.id].count++;
        }
      }
    });

    return Object.values(categoryData)
      .sort((a, b) => b.total - a.total)
      .map(category => `
        <div class="category-breakdown-item">
          <div class="category-header">
            <span class="category-name">${category.name}</span>
            <span class="category-total">${Helpers.formatCurrency(category.total)}</span>
          </div>
          <div class="subcategories-list">
            ${Object.values(category.subcategories)
              .sort((a, b) => b.total - a.total)
              .map(sub => {
                const percentage = sub.budget > 0 ? (sub.total / sub.budget) * 100 : 0;
                const budgetColors = Helpers.getProgressBarColor(Math.max(0, 100 - percentage));
                return `
                  <div class="subcategory-breakdown-item" style="border-left-color: ${budgetColors.border};">
                    <div class="subcategory-info">
                      <span class="subcategory-name">${sub.name}</span>
                      <span class="subcategory-total">${Helpers.formatCurrency(sub.total)}</span>
                    </div>
                    <div class="subcategory-budget">
                      <div class="budget-bar">
                        <div class="budget-progress" style="width: ${Math.min(percentage, 100)}%; background-color: ${budgetColors.border};"></div>
                      </div>
                      <span class="budget-text">${Helpers.formatCurrency(sub.total)} / ${Helpers.formatCurrency(sub.budget)}</span>
                    </div>
                  </div>
                `;
              }).join('')}
          </div>
        </div>
      `).join('');
  }

  generateTimelineBreakdown(expenses) {
    const timelineData = this.groupExpensesByDay(expenses);
    
    return Object.keys(timelineData)
      .sort((a, b) => new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) // 1. Ordena usando la convención T00:00:00
      .map(date => {
        // 2. Crea un objeto Date con la convención T00:00:00 para asegurar el día correcto
        const localDate = new Date(date + 'T00:00:00');
        
        return `
          <div class="timeline-item">
            <div class="timeline-date">
              <div class="date-day">${localDate.getDate()}</div>
              <div class="date-month">${localDate.toLocaleDateString('es-ES', { month: 'short' })}</div>
            </div>
            <div class="timeline-content">
              <div class="timeline-total">${Helpers.formatCurrency(timelineData[date])}</div>
              <div class="timeline-expenses">
                ${expenses
                  .filter(exp => exp.date.startsWith(date))
                  .map(exp => {
                    const category = this.getCategoryForExpense(exp);
                    return `
                      <div class="timeline-expense">
                        <span class="expense-name">${exp.name}</span>
                        <span class="expense-category">${category ? category.name : 'Sin categoría'}</span>
                        <span class="expense-amount">${Helpers.formatCurrency(exp.amount)}</span>
                      </div>
                    `;
                  }).join('')}
              </div>
            </div>
          </div>
        `;
      }).join('');
  }

  generateWalletsBreakdown(expenses, wallets) {
    const walletData = {};
    
    expenses.forEach(expense => {
      const wallet = wallets.find(w => w.id === expense.walletId);
      if (wallet) {
        if (!walletData[wallet.id]) {
          walletData[wallet.id] = {
            name: wallet.name,
            currency: wallet.currency,
            total: 0,
            count: 0
          };
        }
        walletData[wallet.id].total += expense.amount;
        walletData[wallet.id].count++;
      }
    });

    return Object.values(walletData)
      .sort((a, b) => b.total - a.total)
      .map(wallet => `
        <div class="wallet-breakdown-item">
          <div class="wallet-header">
            <span class="wallet-name">${wallet.name}</span>
            <span class="wallet-total">${Helpers.formatCurrency(wallet.total, wallet.currency)}</span>
          </div>
          <div class="wallet-stats">
            <span class="wallet-count">${wallet.count} transacciones</span>
            <span class="wallet-avg">Promedio: ${Helpers.formatCurrency(wallet.total / wallet.count, wallet.currency)}</span>
          </div>
        </div>
      `).join('');
  }

  attachEventListeners() {
    // Period controls
    this.container.querySelectorAll('.period-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentPeriod = e.target.dataset.period;
        this.render();
      });
    });

    // Date navigation
    const prevBtn = this.container.querySelector('#prevPeriod');
    const nextBtn = this.container.querySelector('#nextPeriod');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigatePeriod(-1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigatePeriod(1);
      });
    }

    // Breakdown tabs
    this.container.querySelectorAll('.breakdown-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchBreakdownTab(tabName);
      });
    });
  }

  navigatePeriod(direction) {
    const newDate = new Date(this.currentDate);
    
    switch (this.currentPeriod) {
      case 'week':
        newDate.setDate(newDate.getDate() + (direction * 7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + direction);
        break;
      case 'quarter':
        newDate.setMonth(newDate.getMonth() + (direction * 3));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + direction);
        break;
    }
    
    this.currentDate = newDate;
    this.render();
  }

  switchBreakdownTab(tabName) {
    // Update tab buttons
    this.container.querySelectorAll('.breakdown-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update panels
    this.container.querySelectorAll('.breakdown-panel').forEach(panel => {
      panel.classList.remove('active');
    });
    
    const targetPanel = this.container.querySelector(`#${tabName}Breakdown`);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }
  }

  renderCharts(expenses, categories, wallets) {
    // Destroy existing charts
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    this.charts = {};

    const filteredExpenses = this.getFilteredData(expenses);
    
    this.renderCategoryChart(filteredExpenses, categories);
    this.renderTrendChart(filteredExpenses);
    this.renderWalletChart(filteredExpenses, wallets);
  }

  renderCategoryChart(expenses, categories) {
    const ctx = this.container.querySelector('#categoryChart');
    if (!ctx) return;

    const categoryData = {};
    expenses.forEach(expense => {
      const category = this.getCategoryForExpense(expense);
      if (category) {
        categoryData[category.name] = (categoryData[category.name] || 0) + expense.amount;
      }
    });

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);
    const colors = this.generateColors(labels.length);

    this.charts.category = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom'
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = data.reduce((sum, val) => sum + val, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${Helpers.formatCurrency(context.parsed)} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  renderTrendChart(expenses) {
    const ctx = this.container.querySelector('#trendChart');
    if (!ctx) return;

    const dailyData = this.groupExpensesByDay(expenses);
    const { start, end } = this.getPeriodRange();
    
    const labels = [];
    const data = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      labels.push(d.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
      data.push(dailyData[dateStr] || 0);
    }

    this.charts.trend = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Gastos Diarios',
          data,
          borderColor: '#4A90E2',
          backgroundColor: 'rgba(74, 144, 226, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => Helpers.formatCurrency(value)
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => `Gastos: ${Helpers.formatCurrency(context.parsed.y)}`
            }
          }
        }
      }
    });
  }

  renderWalletChart(expenses, wallets) {
    const ctx = this.container.querySelector('#walletChart');
    if (!ctx) return;

    const walletData = {};
    expenses.forEach(expense => {
      const wallet = wallets.find(w => w.id === expense.walletId);
      if (wallet) {
        walletData[wallet.name] = (walletData[wallet.name] || 0) + expense.amount;
      }
    });

    const labels = Object.keys(walletData);
    const data = Object.values(walletData);
    const colors = this.generateColors(labels.length);

    this.charts.wallet = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Gastos por Wallet',
          data,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => Helpers.formatCurrency(value)
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => `${context.dataset.label}: ${Helpers.formatCurrency(context.parsed.y)}`
            }
          }
        }
      }
    });
  }

  generateColors(count) {
    const colors = [
      'rgba(74, 144, 226, 0.8)',
      'rgba(80, 227, 194, 0.8)',
      'rgba(255, 206, 84, 0.8)',
      'rgba(255, 99, 132, 0.8)',
      'rgba(153, 102, 255, 0.8)',
      'rgba(255, 159, 64, 0.8)',
      'rgba(199, 199, 199, 0.8)',
      'rgba(83, 102, 255, 0.8)'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }
}

// Load Chart.js library
function loadChartJS() {
  if (typeof Chart !== 'undefined') {
    return Promise.resolve();
  }
  
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Initialize resumen manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  loadChartJS().then(() => {
    new ResumenManager();
  }).catch(error => {
    console.error('Failed to load Chart.js:', error);
    // Initialize without charts as fallback
    new ResumenManager();
  });
});