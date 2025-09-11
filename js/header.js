// Header functionality
class Header {
    constructor() {
      this.balanceSelector = document.getElementById('balanceSelector');
      this.balanceAmount = document.getElementById('balanceAmount');
      this.balanceDropdown = document.getElementById('balanceDropdown');
      this.walletsList = document.getElementById('walletsList');
      this.configwalletsBtn = document.getElementById('configwalletsBtn');
      
      this.init();
    }
  
    init() {
      this.setupEventListeners();
      this.updateBalance();
      
      // Listen for data updates
      window.appEvents.on('dataUpdated', () => {
        this.updateBalance();
        this.renderwalletsList();
      });
      
      // Listen for wallet selection
      window.appEvents.on('walletselected', (walletId) => {
        Storage.setSelectedWallet(walletId);
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
  
      // Config wallets button
      this.configwalletsBtn.addEventListener('click', () => {
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
      this.renderwalletsList();
      this.balanceDropdown.classList.add('show');
      this.balanceSelector.classList.add('open');
    }
  
    closeDropdown() {
      this.balanceDropdown.classList.remove('show');
      this.balanceSelector.classList.remove('open');
    }
  
    updateBalance() {
      const selectedWallet = AppState.selectedWallet;
      if (selectedWallet) {
        this.balanceAmount.textContent = Helpers.formatCurrency(selectedWallet.balance, selectedWallet.currency);
      } else {
        this.balanceAmount.textContent = '0.00 BOB';
      }
    }
  
    renderwalletsList() {
      const wallets = AppState.wallets;
      const selectedWallet = AppState.selectedWallet;
  
      if (wallets.length === 0) {
        this.walletsList.innerHTML = `
          <div class="empty-wallets-message">
            No hay wallets creadas
          </div>
        `;
        return;
      }
  
      this.walletsList.innerHTML = wallets.map(wallet => `
        <div class="wallet-item ${selectedWallet && selectedWallet.id === wallet.id ? 'selected' : ''}" 
             data-wallet-id="${wallet.id}">
          <div>
            <div class="wallet-name">${wallet.name}</div>
            ${wallet.purpose ? `<div class="wallet-purpose">${wallet.purpose}</div>` : ''}
          </div>
          <div class="wallet-balance">
            ${Helpers.formatCurrency(wallet.balance, wallet.currency)}
          </div>
        </div>
      `).join('');
  
      // Add click listeners to wallet items
      this.walletsList.querySelectorAll('.wallet-item').forEach(item => {
        item.addEventListener('click', () => {
          const walletId = item.dataset.walletId;
          window.appEvents.emit('walletselected', walletId);
        });
      });
    }
  }
  
  // Initialize header when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new Header();
  });
  