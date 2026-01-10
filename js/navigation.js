// Navigation functionality
class Navigation {
    constructor() {
      this.navTabs = document.querySelectorAll('.nav-tab');
      this.tabContents = document.querySelectorAll('.tab-content');
      this.currentTab = this.getLastActiveTab();
      
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.switchTab(this.currentTab);
      
      // Listen for tab switch events
      window.appEvents.on('switchTab', (tabName) => {
        this.switchTab(tabName);
      });
    }

    getLastActiveTab() {
      // Get the last active tab from localStorage, default to 'gastos'
      const savedTab = localStorage.getItem('ginbertfi_active_tab');
      return savedTab || 'gastos';
    }

    saveActiveTab(tabName) {
      localStorage.setItem('ginbertfi_active_tab', tabName);
    }
  
    setupEventListeners() {
      this.navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const tabName = tab.dataset.tab;
          this.switchTab(tabName);
        });
      });
    }
  
    switchTab(tabName) {
      // Update current tab
      this.currentTab = tabName;
      AppState.currentTab = tabName;
      
      // Save the active tab for persistence
      this.saveActiveTab(tabName);

      // Update nav buttons
      this.navTabs.forEach(tab => {
        if (tab.dataset.tab === tabName) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // Update tab content
      this.tabContents.forEach(content => {
        if (content.id === `${tabName}Tab`) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });

      // Emit tab change event
      window.appEvents.emit('tabChanged', tabName);
    }
  }
  
  // Initialize navigation when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new Navigation();
  });
  