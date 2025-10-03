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
    this.setupGlobalClickListener();
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
        <div class="wallet-card ${isExpanded ? 'expanded' : 'collapsed'}" data-wallet-id="${wallet.id}">
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
            <button class="edit-wallet-btn"
                    data-wallet-id="${wallet.id}"
                    aria-label="Editar wallet"
                    title="Editar wallet">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
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

    const transactionsHTML = walletTransactions.map(tx => {
      // Formato de fecha compacto: "3 nov"
      const date = new Date(tx.date);
      const day = date.getDate();
      const month = date.toLocaleDateString('es-ES', { month: 'short' });
      const compactDate = `${day} ${month}`;
      
      return `
        <div class="recent-transaction-item" data-wallet-id="${walletId}">
          <div class="transaction-left">
            <div class="transaction-date">${compactDate}</div>
            <div class="transaction-type">${this.getTransactionTypeLabel(tx.type)}</div>
          </div>
          <div class="transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}">
            ${tx.amount > 0 ? '+' : ''}${Helpers.formatCurrency(Math.abs(tx.amount), currency)}
          </div>
        </div>
      `;
    }).join('');

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
        // Don't toggle if clicking on action buttons or edit button
        if (!e.target.closest('.action-btn') && !e.target.closest('.edit-wallet-btn')) {
          const walletCard = header.closest('.wallet-card');
          const wasCollapsed = walletCard.classList.contains('collapsed');
          
          walletCard.classList.toggle('collapsed');
          
          // Mostrar botón de editar después del toggle
          setTimeout(() => {
            if (wasCollapsed) {
              // Se expandió
              walletCard.classList.add('expanded');
              this.showEditButton(walletCard);
            } else {
              // Se colapsó
              walletCard.classList.remove('expanded');
              this.hideAllEditButtons();
            }
          }, 50);
        }
      });
    });

    // Edit wallet buttons
    this.walletsContainer.querySelectorAll('.edit-wallet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        this.openEditWalletModal(walletId);
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

  getTransactionTypeLabel(type) {
    const labels = {
      'income': 'Ingreso',
      'expense': 'Gasto',
      'transfer_in': 'Transferencia recibida',
      'transfer_out': 'Transferencia enviada'
    };
    return labels[type] || type;
  }

  // Función para ocultar todos los botones de editar
  hideAllEditButtons() {
    // Ocultar botones de wallets
    document.querySelectorAll('.wallet-card').forEach(card => {
      card.classList.remove('show-edit');
    });
    // Ocultar botones de gastos
    document.querySelectorAll('.category-wrapper').forEach(wrapper => {
      wrapper.classList.remove('show-edit');
    });
    document.querySelectorAll('.subcategory-wrapper').forEach(wrapper => {
      wrapper.classList.remove('show-edit');
    });
  }

  // Función para mostrar solo un botón de editar
  showEditButton(element) {
    this.hideAllEditButtons();
    element.classList.add('show-edit');
    console.log('Mostrando botón de editar en wallet:', element.className, element);
  }

  // Event listener global para ocultar botones al hacer click fuera
  setupGlobalClickListener() {
    document.addEventListener('click', (e) => {
      // Si el click no es en una wallet card, ocultar botones
      if (!e.target.closest('.wallet-card')) {
        this.hideAllEditButtons();
      }
    });
  }

  // Función para editar wallet
  openEditWalletModal(walletId) {
    const wallet = AppState.wallets.find(w => w.id === walletId);
    if (!wallet) {
      Helpers.showToast('Wallet no encontrada', 'error');
      return;
    }
    
    const modalConfig = ModalManager.editWalletModal(wallet);
    window.appEvents.emit('openModal', modalConfig);
  }

  // Función para mostrar todas las transacciones de una wallet
  openTransactionsModal(wallet) {
    const modalConfig = ModalManager.walletTransactionsModal(wallet);
    window.appEvents.emit('openModal', modalConfig);
  }
}

// Initialize huchas manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HuchasManager();
});