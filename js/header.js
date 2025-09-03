// Header functionality
class Header {
    constructor() {
      this.balanceSelector = document.getElementById('balanceSelector');
      this.balanceAmount = document.getElementById('balanceAmount');
      this.balanceDropdown = document.getElementById('balanceDropdown');
      this.accountsList = document.getElementById('accountsList');
      this.configAccountsBtn = document.getElementById('configAccountsBtn');
      
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.updateBalance();
      
      // Listen for data updates
      window.appEvents.on('dataUpdated', () => {
        this.updateBalance();
        this.renderAccountsList();
      });
      
      // Listen for account selection
      window.appEvents.on('accountSelected', (accountId) => {
        Storage.setSelectedAccount(accountId);
        AppState.refreshData();
        this.closeDropdown();
      });
    }
  
    setupEventListeners() {
      // Toggle balance dropdown
      this.balanceSelector.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleDropdown();
      });
  
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.balanceDropdown.contains(e.target) && !this.balanceSelector.contains(e.target)) {
          this.closeDropdown();
        }
      });
  
      // Config accounts button
      this.configAccountsBtn.addEventListener('click', () => {
        window.appEvents.emit('switchTab', 'huchas');
        this.closeDropdown();
      });
    }
  
    toggleDropdown() {
      const isOpen = this.balanceDropdown.classList.contains('show');
      if (isOpen) {
        this.closeDropdown();
      } else {
        this.openDropdown();
      }
    }
  
    openDropdown() {
      this.renderAccountsList();
      this.balanceDropdown.classList.add('show');
      this.balanceSelector.classList.add('open');
    }
  
    closeDropdown() {
      this.balanceDropdown.classList.remove('show');
      this.balanceSelector.classList.remove('open');
    }
  
    updateBalance() {
      const selectedAccount = AppState.selectedAccount;
      if (selectedAccount) {
        this.balanceAmount.textContent = Utils.formatCurrency(selectedAccount.balance, selectedAccount.currency);
      } else {
        this.balanceAmount.textContent = '0.00 BOB';
      }
    }
  
    renderAccountsList() {
      const accounts = AppState.accounts;
      const selectedAccount = AppState.selectedAccount;
  
      if (accounts.length === 0) {
        this.accountsList.innerHTML = `
          <div class="empty-accounts-message">
            No hay cuentas creadas
          </div>
        `;
        return;
      }
  
      this.accountsList.innerHTML = accounts.map(account => `
        <div class="account-item ${selectedAccount && selectedAccount.id === account.id ? 'selected' : ''}" 
             data-account-id="${account.id}">
          <div>
            <div class="account-name">${account.name}</div>
            ${account.purpose ? `<div class="account-purpose">${account.purpose}</div>` : ''}
          </div>
          <div class="account-balance">
            ${Utils.formatCurrency(account.balance, account.currency)}
          </div>
        </div>
      `).join('');
  
      // Add click listeners to account items
      this.accountsList.querySelectorAll('.account-item').forEach(item => {
        item.addEventListener('click', () => {
          const accountId = item.dataset.accountId;
          window.appEvents.emit('accountSelected', accountId);
        });
      });
    }
  }
  
  // Initialize header when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new Header();
  });
  