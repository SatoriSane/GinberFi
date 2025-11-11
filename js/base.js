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
    this.resetExpansionState(); // 👈 Llama a esta función al iniciar
  },
  
  loadData() {
    this.wallets = Storage.getWallets();
    this.selectedWallet = Storage.getSelectedWallet();
    this.categories = Storage.getCategories();
    this.expenses = Storage.getExpenses();
  },
  resetExpansionState() {
    // Solo resetea el estado de las subcategorías
    this.categories.forEach(category => {
      if (category.subcategories) {
        category.subcategories.forEach(sub => {
          sub.expanded = false;
        });
      }
    });
  },
  
  refreshData() {
    this.loadData();
    // Llama a resetExpansionState aquí para plegar las subcategorías
    this.resetExpansionState(); 
    window.appEvents.emit('dataUpdated');
  }
};

// Global event emitter instance
window.appEvents = new EventEmitter();

// Initialize app state when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
});
