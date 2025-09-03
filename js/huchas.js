// Huchas tab functionality
class HuchasManager {
  constructor() {
    this.accountsContainer = document.getElementById('accountsContainer');
    this.emptyAccountsState = document.getElementById('emptyAccountsState');
    this.addAccountBtn = document.getElementById('addAccountBtn');
    this.addNewAccountFab = document.getElementById('addNewAccountFab');
    this.expandedAccounts = new Set(); // Track which accounts have expanded transactions
    
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
    this.addAccountBtn.addEventListener('click', () => {
      this.openCreateAccountModal();
    });

    this.addNewAccountFab.addEventListener('click', () => {
      this.openCreateAccountModal();
    });

    // Handle form submissions
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'accountForm') {
        e.preventDefault();
        this.handleCreateAccount(e.target);
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
    const accounts = AppState.accounts;
    
    if (accounts.length === 0) {
      this.emptyAccountsState.style.display = 'block';
      this.addNewAccountFab.style.display = 'none';
      // Clear any existing account elements except the empty state
      this.accountsContainer.querySelectorAll('.account-card').forEach(el => el.remove());
    } else {
      this.emptyAccountsState.style.display = 'none';
      this.addNewAccountFab.style.display = 'flex';
      this.renderAccounts(accounts);
    }
  }

  renderAccounts(accounts) {
    this.accountsContainer.innerHTML = accounts.map(account => {
      const transactionCount = this.getTransactionCount(account.id);
      
      return `
        <div class="account-card" data-account-id="${account.id}">
          <div class="account-header" data-tap-target="account">
            <div class="account-name-header">${account.name}</div>
            ${account.purpose ? `<div class="account-purpose">${account.purpose}</div>` : ''}
          </div>
          <div class="account-balance-display" data-tap-target="account">
            <div class="balance-amount-large">${Utils.formatCurrency(account.balance, account.currency)}</div>
            <div class="balance-currency">${this.getCurrencyName(account.currency)}</div>
          </div>
          <div class="account-actions">
            <button class="action-btn move-money-btn" data-account-id="${account.id}">
              <span class="action-icon">💸</span>
              Enviar
            </button>
            <button class="action-btn add-income-btn" data-account-id="${account.id}">
              <span class="action-icon">💰</span>
              Ingresar
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.attachAccountEventListeners();
  }

  // Removed - no longer needed as we use modal for transactions

  // Removed - transactions now shown in modal

  getTransactionCount(accountId) {
    const transactions = Storage.get('ginberfi_transactions') || [];
    return transactions.filter(t => t.accountId === accountId).length;
  }

  attachAccountEventListeners() {
    // Move money buttons
    this.accountsContainer.querySelectorAll('.move-money-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const accountId = btn.dataset.accountId;
        this.openTransferModal(accountId);
      });
    });

    // Add income buttons
    this.accountsContainer.querySelectorAll('.add-income-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const accountId = btn.dataset.accountId;
        this.openIncomeModal(accountId);
      });
    });

    // Account tap to view transactions
    this.accountsContainer.querySelectorAll('[data-tap-target="account"]').forEach(element => {
      element.addEventListener('click', () => {
        const accountCard = element.closest('.account-card');
        const accountId = accountCard.dataset.accountId;
        this.openTransactionsModal(accountId);
      });
    });
  }

  openTransactionsModal(accountId) {
    const modalData = ModalManager.createTransactionsModal(accountId);
    if (modalData) {
      window.appEvents.emit('openModal', modalData);
    }
  }

  // Modal handlers
  openCreateAccountModal() {
    const modalData = ModalManager.createAccountModal();
    window.appEvents.emit('openModal', modalData);
    
    // Setup currency selection after modal is created
    setTimeout(() => {
      this.setupCurrencySelection();
    }, 100);
  }

  openIncomeModal(accountId) {
    const modalData = ModalManager.createIncomeModal(accountId);
    window.appEvents.emit('openModal', modalData);
    
    // Setup income source selection after modal is created
    setTimeout(() => {
      this.setupIncomeSourceSelection();
    }, 100);
  }

  openTransferModal(fromAccountId) {
    const accounts = AppState.accounts.filter(acc => acc.id !== fromAccountId);
    if (accounts.length === 0) {
      Utils.showToast('Necesitas al menos 2 cuentas para hacer transferencias', 'warning');
      return;
    }
    
    const modalData = ModalManager.createTransferModal(fromAccountId);
    window.appEvents.emit('openModal', modalData);
  }

  setupCurrencySelection() {
    const currencyOptions = document.querySelectorAll('.currency-option');
    const currencyInput = document.getElementById('accountCurrency');
    
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
        const newSource = Utils.sanitizeInput(newSourceInput.value);
        if (newSource) {
          Storage.addIncomeSource(newSource);
          sourceInput.value = newSource;
          newSourceInput.value = '';
          Utils.showToast('Nueva fuente agregada', 'success');
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
  handleCreateAccount(form) {
    const formData = new FormData(form);
    const accountData = {
      name: Utils.sanitizeInput(formData.get('name')),
      currency: formData.get('currency'),
      balance: parseFloat(formData.get('balance')),
      purpose: Utils.sanitizeInput(formData.get('purpose') || '')
    };

    if (!Utils.validateNumber(accountData.balance)) {
      Utils.showToast('El saldo inicial debe ser un número válido', 'error');
      return;
    }

    if (Storage.addAccount(accountData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Cuenta creada exitosamente', 'success');
    } else {
      Utils.showToast('Error al crear la cuenta', 'error');
    }
  }

  handleAddIncome(form) {
    const formData = new FormData(form);
    const accountId = formData.get('accountId');
    const amount = parseFloat(formData.get('amount'));
    const source = formData.get('source');
    const description = Utils.sanitizeInput(formData.get('description') || '');

    if (!Utils.validateNumber(amount)) {
      Utils.showToast('El monto debe ser un número válido', 'error');
      return;
    }

    if (!source) {
      Utils.showToast('Debes seleccionar una fuente de ingreso', 'error');
      return;
    }

    if (Storage.addIncome(accountId, amount, source, description)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Ingreso agregado exitosamente', 'success');
    } else {
      Utils.showToast('Error al agregar el ingreso', 'error');
    }
  }

  handleTransferMoney(form) {
    const formData = new FormData(form);
    const fromAccountId = formData.get('fromAccountId');
    const toAccountId = formData.get('toAccountId');
    const amount = parseFloat(formData.get('amount'));
    const description = Utils.sanitizeInput(formData.get('description') || '');

    if (!Utils.validateNumber(amount)) {
      Utils.showToast('El monto debe ser un número válido', 'error');
      return;
    }

    if (!toAccountId) {
      Utils.showToast('Debes seleccionar una cuenta destino', 'error');
      return;
    }

    if (Storage.transferMoney(fromAccountId, toAccountId, amount, description)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Transferencia realizada exitosamente', 'success');
    } else {
      Utils.showToast('Error al realizar la transferencia. Verifica el saldo disponible.', 'error');
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