// Base JavaScript - Utility functions and global variables
class Utils {
  static formatCurrency(amount, currency = 'BOB') {
    const currencySymbols = {
      'BOB': 'Bs',
      'USD': '$',
      'EUR': '€',
      'BCH': 'BCH'
    };
    
    const symbol = currencySymbols[currency] || currency;
    const formattedAmount = parseFloat(amount).toFixed(2);
    return `${formattedAmount} ${symbol}`;
  }

  static formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  static calculateProgress(spent, budget) {
    if (budget === 0) return 0;
    return Math.min((spent / budget) * 100, 100);
  }

  static getProgressBarColor(percentage) {
    // Hue transitions from 120 (green) to 0 (red) as the percentage of budget remaining decreases.
    const hue = 120 * (percentage / 100);
    // Return two variants: a saturated border and a light background.
    return {
      border: `hsl(${hue}, 90%, 50%)`,
      background: `hsl(${hue}, 70%, 92%)`,
    };
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static validateNumber(value) {
    return !isNaN(value) && isFinite(value) && value >= 0;
  }

  static sanitizeInput(input) {
    return input.trim().replace(/[<>]/g, '');
  }

  static showToast(message, type = 'info') {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles if not already added
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast {
          position: fixed;
          top: 100px;
          right: 20px;
          background: var(--white);
          color: var(--dark-blue);
          padding: var(--spacing-md) var(--spacing-lg);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow-lg);
          z-index: 2000;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          max-width: 300px;
          word-wrap: break-word;
        }
        .toast.toast-success {
          border-left: 4px solid var(--pastel-green);
        }
        .toast.toast-error {
          border-left: 4px solid #EF4444;
        }
        .toast.toast-warning {
          border-left: 4px solid #F59E0B;
        }
        .toast.toast-info {
          border-left: 4px solid var(--pastel-blue);
        }
        .toast.show {
          transform: translateX(0);
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  static confirmDialog(message, onConfirm, onCancel) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Confirmar</h3>
        </div>
        <div class="modal-body">
          <p>${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary cancel-btn">Cancelar</button>
          <button class="btn-primary confirm-btn">Confirmar</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    const confirmBtn = overlay.querySelector('.confirm-btn');
    const cancelBtn = overlay.querySelector('.cancel-btn');
    
    const cleanup = () => {
      overlay.classList.remove('show');
      setTimeout(() => document.body.removeChild(overlay), 300);
    };
    
    confirmBtn.addEventListener('click', () => {
      cleanup();
      if (onConfirm) onConfirm();
    });
    
    cancelBtn.addEventListener('click', () => {
      cleanup();
      if (onCancel) onCancel();
    });
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cleanup();
        if (onCancel) onCancel();
      }
    });
  }
}

// Global event emitter for component communication
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data));
    }
  }
}

// Global app state
const AppState = {
  currentTab: 'gastos',
  selectedWallet: null,
  categories: [],
  wallets: [],
  expenses: [],
  
  init() {
    this.loadData();
  },
  
  loadData() {
    this.wallets = Storage.getWallets();
    this.selectedWallet = Storage.getSelectedWallet();
    this.categories = Storage.getCategories();
    this.expenses = Storage.getExpenses();
  },
  
  refreshData() {
    this.loadData();
    window.appEvents.emit('dataUpdated');
  }
};

// Global event emitter instance
window.appEvents = new EventEmitter();

// Initialize app state when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
});
