class HuchasManager {
  constructor() {
    this.walletsContainer = document.getElementById('walletsContainer');
    this.emptywalletsState = document.getElementById('emptywalletsState');
    this.addWalletBtn = document.getElementById('addWalletBtn');
    this.addWalletListBtn = document.getElementById('addWalletListBtn');
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
    // Hacemos la instancia accesible globalmente para los onclick de los modales
    window.huchasManager = this;

    if (this.firstWalletBtn) {
      this.firstWalletBtn.addEventListener('click', () => this.openCreateWalletModal());
    }

    // Botón de añadir wallet en la lista
    if (this.addWalletListBtn) {
      this.addWalletListBtn.addEventListener('click', () => this.openCreateWalletModal());
    }

    document.addEventListener('submit', (e) => {
      if (e.target.id === 'incomeForm') {
        e.preventDefault();
        this.handleAddIncome(e.target);
      } else if (e.target.id === 'editIncomeForm') {
        e.preventDefault();
        this.handleEditIncome(e.target);
      } else if (e.target.id === 'transferForm') {
        e.preventDefault();
        this.handleTransferMoney(e.target);
      }
    });
  }

  async render() {
    console.log('🔄 HuchasManager.render() llamado');
    
    AppState.wallets = await Storage.getWallets() || [];
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
      this.addWalletListBtn.style.display = 'none';
    } else {
      this.emptywalletsState.style.display = 'none';
      this.addWalletListBtn.style.display = 'block';

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
            <div class="recent-transactions" data-wallet-id="${wallet.id}">
              <p>Cargando transacciones...</p>
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
      
      // Attach event listeners for wallet cards (toggle, edit, actions)
      this.attachWalletCardListeners();
      
      // Load transactions asynchronously
      for (const wallet of wallets) {
        const transactionsHTML = await this.getRecentTransactionsHTML(wallet.id, wallet.currency);
        const container = this.walletsContainer.querySelector(`.recent-transactions[data-wallet-id="${wallet.id}"]`);
        if (container) {
          console.log(`[${wallet.name}] Insertando HTML en el DOM. Container encontrado:`, !!container);
          container.innerHTML = transactionsHTML;
          console.log(`[${wallet.name}] HTML insertado. Longitud:`, transactionsHTML.length, 'caracteres');
        } else {
          console.error(`[${wallet.name}] ❌ Container NO encontrado para walletId: ${wallet.id}`);
        }
      }
      
      // Attach event listeners for transaction buttons (view-all, transaction items)
      this.attachTransactionListeners();
    }
  }

  async getRecentTransactionsHTML(walletId, currency) {
    const transactionRepo = new TransactionRepository();
    const transactions = await transactionRepo.getByWalletId(walletId) || [];
    
    const wallet = AppState.wallets.find(w => w.id === walletId);
    console.log(`[${wallet?.name}] Cargando transacciones recientes:`, {
      walletId,
      totalTransactions: transactions.length,
      transactionIds: transactions.map(t => t.id).slice(0, 5)
    });
    
    // Ordenar por createdAt (timestamp completo) para obtener el orden exacto de creación
    // Si no existe createdAt, extraer el timestamp del id
    const walletTransactions = transactions
      .sort((a, b) => {
        // Extraer timestamp: si es createdAt usar directamente, si es id extraer el número
        const getTimestamp = (tx) => {
          if (tx.createdAt) return new Date(tx.createdAt).getTime();
          // Extraer timestamp del id (ej: "exp-1764687387892" -> 1764687387892)
          const match = tx.id.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        
        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        return timeB - timeA; // Orden descendente (más reciente primero)
      })
      .slice(0, 3);
    
    console.log(`[${wallet?.name}] Top 3 transacciones:`, walletTransactions.map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      type: t.type,
      amount: t.amount,
      date: t.date,
      sortKey: t.createdAt || t.id
    })));
    
    // Mostrar también las últimas 5 transacciones ANTES de ordenar para comparar
    const last5BeforeSort = transactions.slice(-5).map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      sortKey: t.createdAt || t.id
    }));
    console.log(`[${wallet?.name}] Últimas 5 transacciones (sin ordenar):`, last5BeforeSort);

    if (walletTransactions.length === 0) {
      return `
        <div class="no-recent-transactions">
          <p>No hay movimientos recientes</p>
          <span>Usa los botones de abajo para empezar</span>
        </div>
      `;
    }

    const transactionsHTML = walletTransactions.map(tx => {
      // Usar Helpers.formatDate para parsear correctamente en hora local
      const compactDate = Helpers.formatDate(tx.date);
      // Mostrar descripción si existe, sino mostrar el tipo de transacción
      const displayText = tx.description || this.getTransactionTypeLabel(tx.type);
      
      return `
        <div class="recent-transaction-item" data-wallet-id="${walletId}">
          <div class="transaction-left">
            <div class="transaction-date">${compactDate}</div>
            <div class="transaction-type">${displayText}</div>
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

  // Event listeners for wallet card elements (exist from the start)
  attachWalletCardListeners() {
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        await this.openEditWalletModal(walletId);
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        await this.openIncomeModal(walletId);
      });
    });
  }

  // Event listeners for transaction elements (created after async load)
  attachTransactionListeners() {
    this.walletsContainer.querySelectorAll('.view-all-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const walletId = btn.dataset.walletId;
        const wallet = AppState.wallets.find(w => w.id === walletId);
        if (wallet) {
          await this.openTransactionsModal(wallet);
        }
      });
    });

    this.walletsContainer.querySelectorAll('.recent-transaction-item').forEach(item => {
      item.addEventListener('click', async (e) => {
        e.stopPropagation();
        const walletId = item.dataset.walletId;
        const wallet = AppState.wallets.find(w => w.id === walletId);
        if (wallet) {
          await this.openTransactionsModal(wallet);
        }
      });
    });
  }

  async openTransactionsModal(wallet) {
    const modalData = await ModalManager.walletTransactionsModal(wallet);
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

  async openIncomeModal(walletId) {
    const modalData = await ModalManager.createIncomeModal(walletId);
    window.appEvents.emit('openModal', modalData);
    
    setTimeout(() => {
      this.setupIncomeSourceSelection();
    }, 100);
  }

  openTransferModal(fromWalletId, toWalletId = null) {
    const wallets = AppState.wallets.filter(acc => acc.id !== fromWalletId);
    if (wallets.length === 0) {
      Helpers.showToast('Necesitas al menos 2 wallets para hacer transferencias', 'warning');
      return;
    }
    
    const modalData = ModalManager.createTransferModal(fromWalletId, toWalletId);
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
      addSourceBtn.addEventListener('click', async () => {
        const newSource = Helpers.sanitizeInput(newSourceInput.value);
        if (newSource) {
          await Storage.addIncomeSource(newSource);
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

  async handleCreateWallet(form) {
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

    if (await Storage.addWallet(walletData)) {
      await AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Wallet creada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al crear la wallet', 'error');
    }
  }

  async handleAddIncome(form) {
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

    if (await Storage.addIncome(walletId, amount, source, description)) {
      const wallet = AppState.wallets.find(w => w.id === walletId);
      console.log(`✅ Ingreso agregado a ${wallet?.name} (${walletId})`);
      await AppState.refreshData(); // Ya emite 'dataUpdated' internamente
      window.appEvents.emit('closeModal');
      Helpers.showToast('Ingreso agregado exitosamente', 'success');
    } else {
      Helpers.showToast('Error al agregar el ingreso', 'error');
    }
  }

  async handleEditIncome(form) {
    const formData = new FormData(form);
    const transactionId = formData.get('transactionId');
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

    // Obtener transacción original
    const transactionRepo = new TransactionRepository();
    const transaction = await transactionRepo.getById(transactionId);
    
    if (!transaction) {
      Helpers.showToast('Transacción no encontrada', 'error');
      return;
    }

    const oldAmount = transaction.amount;
    const amountDiff = amount - Math.abs(oldAmount);

    // Actualizar transacción
    transaction.amount = amount;
    transaction.source = source;
    transaction.description = description;

    if (await transactionRepo.update(transaction)) {
      // Actualizar balance de wallet
      const walletRepo = new WalletRepository();
      const wallet = await walletRepo.getById(walletId);
      
      if (wallet) {
        wallet.balance += amountDiff;
        await walletRepo.update(wallet);
      }

      await AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Ingreso actualizado exitosamente', 'success');
    } else {
      Helpers.showToast('Error al actualizar el ingreso', 'error');
    }
  }

  async handleDeleteIncome(transactionId, walletId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingreso?')) {
      return;
    }

    const transactionRepo = new TransactionRepository();
    const transaction = await transactionRepo.getById(transactionId);
    
    if (!transaction) {
      Helpers.showToast('Transacción no encontrada', 'error');
      return;
    }

    // Eliminar transacción
    if (await transactionRepo.delete(transactionId)) {
      // Actualizar balance de wallet (restar el ingreso)
      const walletRepo = new WalletRepository();
      const wallet = await walletRepo.getById(walletId);
      
      if (wallet) {
        wallet.balance -= Math.abs(transaction.amount);
        await walletRepo.update(wallet);
      }

      await AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Ingreso eliminado exitosamente', 'success');
    } else {
      Helpers.showToast('Error al eliminar el ingreso', 'error');
    }
  }

  async handleDeleteTransfer(transferOutId, transferInId, fromWalletId, toWalletId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta transferencia? Se eliminarán ambos movimientos.')) {
      return;
    }

    const transactionRepo = new TransactionRepository();
    const walletRepo = new WalletRepository();
    
    // Obtener ambas transacciones
    const transferOut = await transactionRepo.getById(transferOutId);
    const transferIn = await transactionRepo.getById(transferInId);
    
    if (!transferOut || !transferIn) {
      Helpers.showToast('Transacciones no encontradas', 'error');
      return;
    }

    // Eliminar ambas transacciones
    const deleteOut = await transactionRepo.delete(transferOutId);
    const deleteIn = await transactionRepo.delete(transferInId);
    
    if (deleteOut && deleteIn) {
      // Actualizar balances: revertir la transferencia
      const fromWallet = await walletRepo.getById(fromWalletId);
      const toWallet = await walletRepo.getById(toWalletId);
      
      if (fromWallet) {
        // Devolver el dinero a la wallet origen (transferOut es negativo)
        fromWallet.balance -= transferOut.amount; // Resta un negativo = suma
        await walletRepo.update(fromWallet);
      }
      
      if (toWallet) {
        // Quitar el dinero de la wallet destino (transferIn es positivo)
        toWallet.balance -= transferIn.amount;
        await walletRepo.update(toWallet);
      }

      await AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Transferencia eliminada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al eliminar la transferencia', 'error');
    }
  }

  async handleTransferMoney(form) {
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

    if (await Storage.transferMoney(fromWalletId, toWalletId, amount, description)) {
      await AppState.refreshData(); // Ya emite 'dataUpdated' internamente
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
      'transfer_in': 'Transf. recibida',
      'transfer_out': 'Transf. enviada'
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

  async openEditWalletModal(walletId) {
    const wallet = AppState.wallets.find(w => w.id === walletId);
    if (!wallet) {
      Helpers.showToast('Wallet no encontrada', 'error');
      return;
    }
    
    const modalConfig = await ModalManager.editWalletModal(wallet);
    window.appEvents.emit('openModal', modalConfig);
  }

  showIncomeWalletSelector() {
    // Crear el overlay si no existe
    let overlay = document.getElementById('incomeWalletOverlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'incomeWalletOverlay';
      overlay.className = 'income-wallet-overlay';
      
      const container = document.createElement('div');
      container.className = 'income-wallet-container';
      
      const header = document.createElement('div');
      header.className = 'income-wallet-header';
      header.innerHTML = `
        <h3 class="income-wallet-title">Wallet a ingresar</h3>
        <button class="income-wallet-close" aria-label="Cerrar">×</button>
      `;
      
      const list = document.createElement('div');
      list.className = 'income-wallet-list';
      
      container.appendChild(header);
      container.appendChild(list);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
      // Event listeners
      const closeBtn = header.querySelector('.income-wallet-close');
      closeBtn.addEventListener('click', () => this.hideIncomeWalletSelector());
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideIncomeWalletSelector();
        }
      });
    }
    
    // Llenar con las wallets actuales
    const list = overlay.querySelector('.income-wallet-list');
    const wallets = AppState.wallets;
    
    if (wallets.length === 0) {
      list.innerHTML = `
        <div class="income-wallet-empty">
          <div class="income-wallet-empty-icon">🐷</div>
          <p>No hay wallets disponibles</p>
          <span style="font-size: var(--font-size-sm); font-style: italic;">Crea tu primera wallet para empezar</span>
        </div>
      `;
    } else {
      list.innerHTML = wallets.map(wallet => `
        <div class="income-wallet-item" data-wallet-id="${wallet.id}">
          <div class="income-wallet-info">
            <div class="income-wallet-name">${wallet.name}</div>
          </div>
          <div class="income-wallet-icon"></div>
        </div>
      `).join('');
      
      // Event listeners para cada wallet
      list.querySelectorAll('.income-wallet-item').forEach(item => {
        item.addEventListener('click', async () => {
          const walletId = item.dataset.walletId;
          this.hideIncomeWalletSelector();
          await this.openIncomeModal(walletId);
        });
      });
    }
    
    // Mostrar overlay con animación
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
  }

  hideIncomeWalletSelector() {
    const overlay = document.getElementById('incomeWalletOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new HuchasManager();
});