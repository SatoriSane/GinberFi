// Navigation functionality
class Navigation {
    constructor() {
      this.navTabs = document.querySelectorAll('.nav-tab');
      this.tabContents = document.querySelectorAll('.tab-content');
      this.currentTab = 'gastos';
      
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
  