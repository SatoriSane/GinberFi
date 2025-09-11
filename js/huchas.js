// Huchas tab functionality
class HuchasManager {
  constructor() {
    this.walletsContainer = document.getElementById('walletsContainer');
    this.emptywalletsState = document.getElementById('emptywalletsState');
    this.addWalletBtn = document.getElementById('addWalletBtn');
    this.addNewWalletFab = document.getElementById('addNewWalletFab');
    this.expandedwallets = new Set(); // Track which wallets have expanded transactions
    
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
      if (tabName === 'huchas') {
        this.render();
      }
    });
  }

  setupEventListeners() {
    this.addWalletBtn.addEventListener('click', () => {
      this.openCreateWalletModal();
    });

    this.addNewWalletFab.addEventListener('click', () => {
      this.openCreateWalletModal();
    });

    // Handle form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'walletForm') {
        e.preventDefault();
        this.handleCreateWallet(e.target);
      } else if (e.target.id === 'incomeForm') {
        e.preventDefault();
        this.handleAddIncome(e.target);
      } else if (e.target.id === 'transferForm') {
        e.preventDefault();
        this.handleTransferMoney(e.target);
      }
    });
  }

  render() {
    const wallets = AppState.wallets;
    
    if (wallets.length === 0) {
      this.emptywalletsState.style.display = 'block';
      this.addNewWalletFab.style.display = 'none';
      // Clear any existing wallet elements except the empty state
      this.walletsContainer.querySelectorAll('.wallet-card').forEach(el => el.remove());
    } else {
      this.emptywalletsState.style.display = 'none';
      this.addNewWalletFab.style.display = 'flex';
      this.renderwallets(wallets);
    }
  }

  renderwallets(wallets) {
    this.walletsContainer.innerHTML = wallets.map(wallet => {
      const transactionCount = this.getTransactionCount(wallet.id);
      
      return `
        <div class="wallet-card" data-wallet-id="${wallet.id}">
          <div class="wallet-header" data-tap-target="wallet">
            <div class="wallet-name-header">${wallet.name}</div>
            ${wallet.purpose ? `<div class="wallet-purpose">${wallet.purpose}</div>` : ''}
          </div>
          <div class="wallet-balance-display" data-tap-target="wallet">
            <div class="balance-amount-large">${Helpers.formatCurrency(wallet.balance, wallet.currency)}</div>
          </div>
          <div class="wallet-actions">
            <button class="action-btn move-money-btn" data-wallet-id="${wallet.id}">
              <span class="action-icon">🔁</span>
              Transferir
            </button>
            <button class="action-btn add-income-btn" data-wallet-id="${wallet.id}">
              <span class="action-icon">💰</span>
              Ingresar
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.attachWalletEventListeners();
  }

  // Removed - no longer needed as we use modal for transactions

  // Removed - transactions now shown in modal

  getTransactionCount(walletId) {
    const transactions = Storage.get('ginbertfi_transactions') || [];
    return transactions.filter(t => t.walletId === walletId).length;
  }

  attachWalletEventListeners() {
    // Move money buttons
    this.walletsContainer.querySelectorAll('.move-money-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        this.openTransferModal(walletId);
      });
    });

    // Add income buttons
    this.walletsContainer.querySelectorAll('.add-income-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        this.openIncomeModal(walletId);
      });
    });

    // Wallet tap to view transactions
    this.walletsContainer.querySelectorAll('[data-tap-target="wallet"]').forEach(element => {
      element.addEventListener('click', () => {
        const walletCard = element.closest('.wallet-card');
        const walletId = walletCard.dataset.walletId;
        this.openTransactionsModal(walletId);
      });
    });
  }

  openTransactionsModal(walletId) {
    const modalData = ModalManager.createTransactionsModal(walletId);
    if (modalData) {
      window.appEvents.emit('openModal', modalData);
    }
  }

  // Modal handlers
  openCreateWalletModal() {
    const modalData = ModalManager.createWalletModal();
    window.appEvents.emit('openModal', modalData);
    
    // Setup currency selection after modal is created
    setTimeout(() => {
      this.setupCurrencySelection();
    }, 100);
  }

  openIncomeModal(walletId) {
    const modalData = ModalManager.createIncomeModal(walletId);
    window.appEvents.emit('openModal', modalData);
    
    // Setup income source selection after modal is created
    setTimeout(() => {
      this.setupIncomeSourceSelection();
    }, 100);
  }

  openTransferModal(fromWalletId) {
    const wallets = AppState.wallets.filter(acc => acc.id !== fromWalletId);
    if (wallets.length === 0) {
      Helpers.showToast('Necesitas al menos 2 wallets para hacer transferencias', 'warning');
      return;
    }
    
    const modalData = ModalManager.createTransferModal(fromWalletId);
    window.appEvents.emit('openModal', modalData);
  }

  setupCurrencySelection() {
    const currencyOptions = document.querySelectorAll('.currency-option');
    const currencyInput = document.getElementById('walletCurrency');
    
    currencyOptions.forEach(option => {
      option.addEventListener('click', () => {
        // Remove selected class from all options
        currencyOptions.forEach(opt => opt.classList.remove('selected'));
        
        // Add selected class to clicked option
        option.classList.add('selected');
        
        // Update hidden input
        if (currencyInput) {
          currencyInput.value = option.dataset.currency;
        }
      });
    });
  }

  setupIncomeSourceSelection() {
    const sourceItems = document.querySelectorAll('.source-item');
    const sourceInput = document.getElementById('incomeSource');
    const newSourceInput = document.getElementById('newSource');
    const addSourceBtn = document.getElementById('addSourceBtn');
    
    // Handle source selection
    sourceItems.forEach(item => {
      item.addEventListener('click', () => {
        // Remove selected class from all items
        sourceItems.forEach(i => i.classList.remove('selected'));
        
        // Add selected class to clicked item
        item.classList.add('selected');
        
        // Update hidden input
        if (sourceInput) {
          sourceInput.value = item.dataset.source;
        }
      });
    });
    
    // Handle adding new source
    if (addSourceBtn && newSourceInput && sourceInput) {
      addSourceBtn.addEventListener('click', () => {
        const newSource = Helpers.sanitizeInput(newSourceInput.value);
        if (newSource) {
          Storage.addIncomeSource(newSource);
          sourceInput.value = newSource;
          newSourceInput.value = '';
          Helpers.showToast('Nueva fuente agregada', 'success');
        }
      });
      
      newSourceInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addSourceBtn.click();
        }
      });
    }
  }

  // Form handlers
  handleCreateWallet(form) {
    const formData = new FormData(form);
    const walletData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      currency: formData.get('currency'),
      balance: parseFloat(formData.get('balance')),
      purpose: Helpers.sanitizeInput(formData.get('purpose') || '')
    };

    if (!Helpers.validateNumber(walletData.balance)) {
      Helpers.showToast('El saldo inicial debe ser un número válido', 'error');
      return;
    }

    if (Storage.addWallet(walletData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Wallet creada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al crear la wallet', 'error');
    }
  }

  handleAddIncome(form) {
    const formData = new FormData(form);
    const walletId = formData.get('walletId');
    const amount = parseFloat(formData.get('amount'));
    const source = formData.get('source');
    const description = Helpers.sanitizeInput(formData.get('description') || '');

    if (!Helpers.validateNumber(amount)) {
      Helpers.showToast('El monto debe ser un número válido', 'error');
      return;
    }

    if (!source) {
      Helpers.showToast('Debes seleccionar una fuente de ingreso', 'error');
      return;
    }

    if (Storage.addIncome(walletId, amount, source, description)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Ingreso agregado exitosamente', 'success');
    } else {
      Helpers.showToast('Error al agregar el ingreso', 'error');
    }
  }

  handleTransferMoney(form) {
    const formData = new FormData(form);
    const fromWalletId = formData.get('fromWalletId');
    const toWalletId = formData.get('toWalletId');
    const amount = parseFloat(formData.get('amount'));
    const description = Helpers.sanitizeInput(formData.get('description') || '');

    if (!Helpers.validateNumber(amount)) {
      Helpers.showToast('El monto debe ser un número válido', 'error');
      return;
    }

    if (!toWalletId) {
      Helpers.showToast('Debes seleccionar una wallet destino', 'error');
      return;
    }

    if (Storage.transferMoney(fromWalletId, toWalletId, amount, description)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Transferencia realizada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al realizar la transferencia. Verifica el saldo disponible.', 'error');
    }
  }

  // Helper methods
  getCurrencyName(currency) {
    const currencyNames = {
      'BOB': 'Boliviano',
      'USD': 'Dólar Estadounidense',
      'EUR': 'Euro',
      'BCH': 'Bitcoin Cash'
    };
    return currencyNames[currency] || currency;
  }

  getTransactionTypeLabel(type) {
    const labels = {
      'income': 'Ingreso',
      'expense': 'Gasto',
      'transfer_in': 'Transferencia recibida',
      'transfer_out': 'Transferencia enviada'
    };
    return labels[type] || type;
  }
}

// Initialize huchas manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HuchasManager();
});