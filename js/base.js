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
  
  async init() {
    await this.loadData();
    this.resetExpansionState();
    window.appEvents.emit('dataUpdated');
  },
  
  async loadData() {
    this.wallets = await Storage.getWallets();
    this.selectedWallet = await Storage.getSelectedWallet();
    this.categories = await Storage.getCategories();
    this.expenses = await Storage.getExpenses();
  },
  
  resetExpansionState() {
    // Solo resetea el estado de las subcategorías
    if (Array.isArray(this.categories)) {
      this.categories.forEach(category => {
        if (category.subcategories) {
          category.subcategories.forEach(sub => {
            sub.expanded = false;
          });
        }
      });
    }
  },
  
  async refreshData() {
    await this.loadData();
    this.resetExpansionState();
    window.appEvents.emit('dataUpdated');
  }
};

// Global event emitter instance
window.appEvents = new EventEmitter();
