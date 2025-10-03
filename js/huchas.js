class HuchasManager {
  constructor() {
    this.walletsContainer = document.getElementById('walletsContainer');
    this.emptywalletsState = document.getElementById('emptywalletsState');
    this.addWalletBtn = document.getElementById('addWalletBtn'); // botón dentro del FAB
    this.addNewWalletFab = document.getElementById('addNewWalletFab'); // FAB
    this.firstWalletBtn = this.emptywalletsState.querySelector('#addWalletBtn'); // botón "Crear Primera Wallet"
    this.expandedwallets = new Set(); // Track which wallets have expanded transactions

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();

    // Listeners globales de actualización y cambios de tab
    window.appEvents.on('dataUpdated', () => this.render());
    window.appEvents.on('tabChanged', (tabName) => {
      if (tabName === 'huchas') this.render();
    });
    window.appEvents.on('refreshWallets', () => this.render());
  }

  setupEventListeners() {
    // FAB para crear wallet
    if (this.addNewWalletFab) {
      this.addNewWalletFab.addEventListener('click', () => this.openCreateWalletModal());
    }

    // Botón "Crear Primera Wallet" (si existe)
    if (this.firstWalletBtn) {
      this.firstWalletBtn.addEventListener('click', () => this.openCreateWalletModal());
    }

    // Form submissions de otros modales
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'incomeForm') {
        e.preventDefault();
        this.handleAddIncome(e.target);
      } else if (e.target.id === 'transferForm') {
        e.preventDefault();
        this.handleTransferMoney(e.target);
      }
    });
  }

  render() {
    AppState.wallets = Storage.getWallets() || [];
    const wallets = AppState.wallets;

    // Guardar estado de wallets expandidas antes de limpiar
    const expandedWallets = new Set();
    this.walletsContainer.querySelectorAll('.wallet-card:not(.collapsed)').forEach(card => {
      expandedWallets.add(card.dataset.walletId);
    });

    // Limpiar wallets previos, pero mantener nodo empty
    while (this.walletsContainer.firstChild && this.walletsContainer.firstChild !== this.emptywalletsState) {
      this.walletsContainer.removeChild(this.walletsContainer.firstChild);
    }

    if (!wallets.length) {
      // Mostrar estado vacío
      this.emptywalletsState.style.display = 'block';
      this.addNewWalletFab.style.display = 'none';
    } else {
      // Mostrar wallets
      this.emptywalletsState.style.display = 'none';
      this.addNewWalletFab.style.display = 'flex';

      const walletsHtml = wallets.map(wallet => {
        const isExpanded = expandedWallets.has(wallet.id);
        return `
        <div class="wallet-card ${isExpanded ? '' : 'collapsed'}" data-wallet-id="${wallet.id}">
          <div class="wallet-header" data-action="toggle">
            <div class="wallet-header-content">
              <div class="wallet-info">
                <div class="wallet-name-header">${wallet.name}</div>
                ${wallet.purpose ? `<div class="wallet-purpose">${wallet.purpose}</div>` : ''}
              </div>
            </div>
            <div class="wallet-balance-compact">${Helpers.formatCurrency(wallet.balance, wallet.currency)}</div>
            <div class="expand-indicator">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
          <div class="wallet-card-content">
            <div class="recent-transactions">
              ${this.getRecentTransactionsHTML(wallet.id, wallet.currency)}
            </div>
            <div class="wallet-actions">
              <button class="action-btn move-money-btn" data-wallet-id="${wallet.id}">🔄 Transferir</button>
              <button class="action-btn add-income-btn" data-wallet-id="${wallet.id}">💰 Ingresar</button>
            </div>
          </div>
        </div>
        `;
      }).join('');

      this.walletsContainer.insertAdjacentHTML('afterbegin', walletsHtml);
      this.attachWalletEventListeners();
    }
  }
  
  getTransactionCount(walletId) {
    const transactions = Storage.get('ginbertfi_transactions') || [];
    return transactions.filter(t => t.walletId === walletId).length;
  }

  getWalletIcon(currency, purpose) {
    // Iconos por moneda
    const currencyIcons = {
      'BOB': '🏛️',
      'USD': '💵',
      'EUR': '💶',
      'BCH': '₿'
    };

    // Iconos por propósito
    const purposeIcons = {
      'ahorro': '🏦',
      'gastos': '💳',
      'emergencia': '🚨',
      'vacaciones': '🏖️',
      'casa': '🏠',
      'auto': '🚗',
      'educacion': '📚',
      'salud': '🏥',
      'inversion': '📈',
      'negocio': '💼'
    };

    // Buscar por propósito primero
    if (purpose) {
      const purposeLower = purpose.toLowerCase();
      for (const [key, icon] of Object.entries(purposeIcons)) {
        if (purposeLower.includes(key)) {
          return icon;
        }
      }
    }

    // Si no encuentra por propósito, usar icono de moneda
    return currencyIcons[currency] || '💰';
  }

  getRecentTransactionsHTML(walletId, currency) {
    const transactions = Storage.get('ginbertfi_transactions') || [];
    const walletTransactions = transactions
      .filter(t => t.walletId === walletId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3); // Solo los últimos 3

    if (walletTransactions.length === 0) {
      return `
        <div class="no-recent-transactions">
          <p>No hay movimientos recientes</p>
          <span>Usa los botones de abajo para empezar</span>
        </div>
      `;
    }

    const transactionsHTML = walletTransactions.map(tx => `
      <div class="recent-transaction-item" data-wallet-id="${walletId}">
        <div class="transaction-info">
          <div class="transaction-type">${this.getTransactionTypeLabel(tx.type)}</div>
          <div class="transaction-date">${Helpers.formatDate(tx.date)}</div>
        </div>
        <div class="transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}">
          ${tx.amount > 0 ? '+' : ''}${Helpers.formatCurrency(Math.abs(tx.amount), currency)}
        </div>
      </div>
    `).join('');

    return `
      <div class="recent-transactions-header">
        <span>Últimos movimientos</span>
        <button class="view-all-btn" data-wallet-id="${walletId}">Ver todos</button>
      </div>
      <div class="recent-transactions-list">
        ${transactionsHTML}
      </div>
    `;
  }

  attachWalletEventListeners() {
    // Toggle wallet expand/collapse
    this.walletsContainer.querySelectorAll('[data-action="toggle"]').forEach(header => {
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking on action buttons
        if (!e.target.closest('.action-btn')) {
          const walletCard = header.closest('.wallet-card');
          walletCard.classList.toggle('collapsed');
        }
      });
    });

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

    // View all transactions buttons
    this.walletsContainer.querySelectorAll('.view-all-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        const wallet = AppState.wallets.find(w => w.id === walletId);
        if (wallet) {
          this.openTransactionsModal(wallet);
        }
      });
    });

    // Recent transaction items (click to open modal)
    this.walletsContainer.querySelectorAll('.recent-transaction-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = item.dataset.walletId;
        const wallet = AppState.wallets.find(w => w.id === walletId);
        if (wallet) {
          this.openTransactionsModal(wallet);
        }
      });
    });
  }

  openTransactionsModal(wallet) {
    const modalData = ModalManager.editWalletModal(wallet);
    if (modalData) {
      window.appEvents.emit('openModal', modalData);
    }
  }

  // Modal handlers
  openCreateWalletModal() {
    const modalData = ModalManager.createWalletModal();
    window.appEvents.emit('openModal', modalData);
  
    // Setup currency selection después de abrir el modal
    setTimeout(() => {
      this.setupCurrencySelection();
  
      const form = document.getElementById('walletForm');
      const cancelBtn = document.querySelector('.wallet-modal .btn-secondary');
  
      if (cancelBtn) {
        cancelBtn.onclick = () => window.appEvents.emit('closeModal');
      }
  
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          this.handleCreateWallet(form);
        };
      }
  
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