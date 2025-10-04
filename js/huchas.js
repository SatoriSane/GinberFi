class HuchasManager {
  constructor() {
    this.walletsContainer = document.getElementById('walletsContainer');
    this.emptywalletsState = document.getElementById('emptywalletsState');
    this.addWalletBtn = document.getElementById('addWalletBtn');
    this.addNewWalletFab = document.getElementById('addNewWalletFab');
    this.firstWalletBtn = this.emptywalletsState.querySelector('#addWalletBtn');
    this.expandedwallets = new Set();

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupGlobalClickListener();
    this.render();

    window.appEvents.on('dataUpdated', () => this.render());
    window.appEvents.on('tabChanged', (tabName) => {
      if (tabName === 'huchas') this.render();
    });
    window.appEvents.on('refreshWallets', () => this.render());
  }

  setupEventListeners() {
    if (this.addNewWalletFab) {
      this.addNewWalletFab.addEventListener('click', () => this.openCreateWalletModal());
    }

    if (this.firstWalletBtn) {
      this.firstWalletBtn.addEventListener('click', () => this.openCreateWalletModal());
    }

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

    const expandedWallets = new Set();
    this.walletsContainer.querySelectorAll('.wallet-card:not(.collapsed)').forEach(card => {
      expandedWallets.add(card.dataset.walletId);
    });

    while (this.walletsContainer.firstChild && this.walletsContainer.firstChild !== this.emptywalletsState) {
      this.walletsContainer.removeChild(this.walletsContainer.firstChild);
    }

    if (!wallets.length) {
      this.emptywalletsState.style.display = 'block';
      this.addNewWalletFab.style.display = 'none';
    } else {
      this.emptywalletsState.style.display = 'none';
      this.addNewWalletFab.style.display = 'flex';

      const walletsHtml = wallets.map(wallet => {
        const isExpanded = expandedWallets.has(wallet.id);
        return `
        <div class="wallet-card ${isExpanded ? 'expanded' : 'collapsed'}" data-wallet-id="${wallet.id}">
          <div class="wallet-header" data-action="toggle">
            <div class="wallet-header-content">
            <div class="wallet-info">
              <div class="wallet-name-header">
                ${wallet.name}
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
${wallet.description ? `<div class="wallet-description">${wallet.description}</div>` : ''}            </div>
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

  getRecentTransactionsHTML(walletId, currency) {
    const transactions = Storage.get('ginbertfi_transactions') || [];
    const walletTransactions = transactions
      .filter(t => t.walletId === walletId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);

    if (walletTransactions.length === 0) {
      return `
        <div class="no-recent-transactions">
          <p>No hay movimientos recientes</p>
          <span>Usa los botones de abajo para empezar</span>
        </div>
      `;
    }

    const transactionsHTML = walletTransactions.map(tx => {
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
    this.walletsContainer.querySelectorAll('[data-action="toggle"]').forEach(header => {
      header.addEventListener('click', (e) => {
        if (!e.target.closest('.action-btn') && !e.target.closest('.edit-wallet-btn')) {
          const walletCard = header.closest('.wallet-card');
          const wasCollapsed = walletCard.classList.contains('collapsed');
          
          walletCard.classList.toggle('collapsed');
          
          setTimeout(() => {
            if (wasCollapsed) {
              walletCard.classList.add('expanded');
              this.showEditButton(walletCard);
            } else {
              walletCard.classList.remove('expanded');
              this.hideAllEditButtons();
            }
          }, 50);
        }
      });
    });

    this.walletsContainer.querySelectorAll('.edit-wallet-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        this.openEditWalletModal(walletId);
      });
    });

    this.walletsContainer.querySelectorAll('.move-money-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        this.openTransferModal(walletId);
      });
    });

    this.walletsContainer.querySelectorAll('.add-income-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        this.openIncomeModal(walletId);
      });
    });

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

  openCreateWalletModal() {
    const modalData = ModalManager.createWalletModal();
    window.appEvents.emit('openModal', modalData);
  
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
        currencyOptions.forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
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
    
    sourceItems.forEach(item => {
      item.addEventListener('click', () => {
        sourceItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        
        if (sourceInput) {
          sourceInput.value = item.dataset.source;
        }
      });
    });
    
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

  handleCreateWallet(form) {
    const formData = new FormData(form);
    const walletData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      currency: formData.get('currency'),
      balance: parseFloat(formData.get('balance')),
      description: Helpers.sanitizeInput(formData.get('description') || '')    };

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

  getTransactionTypeLabel(type) {
    const labels = {
      'income': 'Ingreso',
      'expense': 'Gasto',
      'transfer_in': 'Transferencia recibida',
      'transfer_out': 'Transferencia enviada'
    };
    return labels[type] || type;
  }

  hideAllEditButtons() {
    document.querySelectorAll('.wallet-card').forEach(card => {
      card.classList.remove('show-edit');
    });
    document.querySelectorAll('.category-wrapper').forEach(wrapper => {
      wrapper.classList.remove('show-edit');
    });
    document.querySelectorAll('.subcategory-wrapper').forEach(wrapper => {
      wrapper.classList.remove('show-edit');
    });
  }

  showEditButton(element) {
    this.hideAllEditButtons();
    element.classList.add('show-edit');
  }

  setupGlobalClickListener() {
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.wallet-card')) {
        this.hideAllEditButtons();
      }
    });
  }

  openEditWalletModal(walletId) {
    const wallet = AppState.wallets.find(w => w.id === walletId);
    if (!wallet) {
      Helpers.showToast('Wallet no encontrada', 'error');
      return;
    }
    
    const modalConfig = ModalManager.editWalletModal(wallet);
    window.appEvents.emit('openModal', modalConfig);
  }

  openTransactionsModal(wallet) {
    const modalConfig = ModalManager.walletTransactionsModal(wallet);
    window.appEvents.emit('openModal', modalConfig);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HuchasManager();
});