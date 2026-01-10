// Quick Actions Central FAB Manager
class QuickActionsManager {
  constructor() {
    this.centralFab = document.getElementById('centralFabBtn');
    this.overlay = document.getElementById('quickActionsOverlay');
    this.actionButtons = document.querySelectorAll('.quick-action-btn');
    
    this.isOpen = false;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle menu on FAB click
    this.centralFab.addEventListener('click', () => this.toggleMenu());
    
    // Close menu on overlay click (outside menu)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.closeMenu();
      }
    });
    
    // Close menu on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeMenu();
      }
    });
    
    // Handle action buttons
    this.actionButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleAction(action);
      });
    });
  }

  toggleMenu() {
    if (this.isOpen) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    this.isOpen = true;
    this.overlay.classList.add('active');
    this.centralFab.classList.add('active');
  }

  closeMenu() {
    this.isOpen = false;
    this.overlay.classList.remove('active');
    this.centralFab.classList.remove('active');
  }

  async handleAction(action) {
    this.closeMenu();
    
    // Pequeño delay para que la animación de cierre sea visible
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (action) {
      case 'quick-expense':
        this.handleQuickExpense();
        break;
      case 'schedule-payment':
        this.handleSchedulePayment();
        break;
      case 'add-income':
        this.handleAddIncome();
        break;
      case 'transfer':
        this.handleTransfer();
        break;
      default:
        console.warn('Unknown action:', action);
    }
  }

  handleQuickExpense() {
    // Abre el modal inmediatamente (respuesta instantánea)
    if (window.gastosManager && typeof window.gastosManager.openQuickExpenseModal === 'function') {
      window.gastosManager.openQuickExpenseModal();
    } else {
      console.error('GastosManager not available or openQuickExpenseModal not found');
      Helpers.showToast('Error al abrir el formulario de gastos', 'error');
      return;
    }
    
    // Cambia a la pestaña de Gastos en segundo plano
    if (window.appEvents) {
      window.appEvents.emit('switchTab', 'gastos');
    }
  }

  handleSchedulePayment() {
    // Abre el modal inmediatamente (respuesta instantánea)
    if (window.pagosManager && typeof window.pagosManager.openCreatePaymentModal === 'function') {
      window.pagosManager.openCreatePaymentModal();
    } else {
      console.error('PagosManager not available or openCreatePaymentModal not found');
      Helpers.showToast('Error al abrir el formulario de pagos', 'error');
      return;
    }
    
    // Cambia a la pestaña de Pagos en segundo plano
    if (window.appEvents) {
      window.appEvents.emit('switchTab', 'pagos');
    }
  }

  handleAddIncome() {
    // Muestra el selector inmediatamente (respuesta instantánea)
    if (window.huchasManager && typeof window.huchasManager.showIncomeWalletSelector === 'function') {
      window.huchasManager.showIncomeWalletSelector();
    } else {
      console.error('HuchasManager not available or showIncomeWalletSelector not found');
      Helpers.showToast('Error al abrir el selector de wallets', 'error');
      return;
    }
    
    // Cambia a la pestaña de Wallets en segundo plano
    if (window.appEvents) {
      window.appEvents.emit('switchTab', 'huchas');
    }
  }

  handleTransfer() {
    // Muestra el selector inmediatamente (respuesta instantánea)
    this.showTransferWalletSelector();
    
    // Cambia a la pestaña de Wallets en segundo plano
    if (window.appEvents) {
      window.appEvents.emit('switchTab', 'huchas');
    }
  }

  showTransferWalletSelector() {
    // Crear el overlay si no existe
    let overlay = document.getElementById('transferWalletOverlay');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'transferWalletOverlay';
      overlay.className = 'income-wallet-overlay'; // Reutilizar estilos de income
      
      const container = document.createElement('div');
      container.className = 'income-wallet-container transfer-dual-container';
      
      const content = document.createElement('div');
      content.className = 'transfer-dual-columns';
      content.innerHTML = `
        <div class="transfer-column transfer-column-from">
          <h4 class="transfer-column-title">📤 Desde</h4>
          <div class="transfer-wallet-list" id="transferFromList"></div>
        </div>
        <div class="transfer-column transfer-column-to">
          <h4 class="transfer-column-title">📥 Hacia</h4>
          <div class="transfer-wallet-list" id="transferToList"></div>
        </div>
      `;
      
      container.appendChild(content);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
      // Event listener para cerrar al hacer click fuera
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideTransferWalletSelector();
        }
      });
    }
    
    // Variables para almacenar selecciones
    this.selectedFromWallet = null;
    this.selectedToWallet = null;
    
    // Llenar con las wallets actuales
    const fromList = overlay.querySelector('#transferFromList');
    const toList = overlay.querySelector('#transferToList');
    const content = overlay.querySelector('.transfer-dual-columns');
    const wallets = AppState.wallets;
    
    if (wallets.length < 2) {
      const emptyHTML = `
        <div class="income-wallet-empty">
          <div class="income-wallet-empty-icon">🐷</div>
          <p>Necesitas al menos 2 wallets</p>
          <span style="font-size: var(--font-size-sm); font-style: italic;">Crea otra wallet para poder transferir dinero</span>
        </div>
      `;
      content.innerHTML = `<div style="grid-column: 1 / -1;">${emptyHTML}</div>`;
    } else {
      this.renderWalletLists(fromList, toList, wallets);
    }
    
    // Resetear scroll al inicio
    const container = overlay.querySelector('.income-wallet-container');
    if (container) {
      container.scrollTop = 0;
    }
    
    // Mostrar overlay con animación
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
  }
  
  renderWalletLists(fromList, toList, wallets) {
    const createWalletHTML = (wallet, isDisabled = false, isSelected = false) => `
      <div class="income-wallet-item ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}" 
           data-wallet-id="${wallet.id}"
           ${isDisabled ? 'data-disabled="true"' : ''}>
        <div class="income-wallet-info">
          <div class="income-wallet-name">${wallet.name}</div>
        </div>
      </div>
    `;
    
    // Renderizar lista FROM
    fromList.innerHTML = wallets.map(wallet => {
      const isDisabled = this.selectedToWallet === wallet.id;
      const isSelected = this.selectedFromWallet === wallet.id;
      return createWalletHTML(wallet, isDisabled, isSelected);
    }).join('');
    
    // Renderizar lista TO
    toList.innerHTML = wallets.map(wallet => {
      const isDisabled = this.selectedFromWallet === wallet.id;
      const isSelected = this.selectedToWallet === wallet.id;
      return createWalletHTML(wallet, isDisabled, isSelected);
    }).join('');
    
    // Event listeners para FROM list
    fromList.querySelectorAll('.income-wallet-item:not(.disabled)').forEach(item => {
      item.addEventListener('click', () => {
        const walletId = item.dataset.walletId;
        this.selectedFromWallet = walletId;
        
        // Re-renderizar listas para actualizar estados
        this.renderWalletLists(fromList, toList, wallets);
        
        // Si ambos están seleccionados, abrir modal
        this.checkAndOpenTransferModal();
      });
    });
    
    // Event listeners para TO list
    toList.querySelectorAll('.income-wallet-item:not(.disabled)').forEach(item => {
      item.addEventListener('click', () => {
        const walletId = item.dataset.walletId;
        this.selectedToWallet = walletId;
        
        // Re-renderizar listas para actualizar estados
        this.renderWalletLists(fromList, toList, wallets);
        
        // Si ambos están seleccionados, abrir modal
        this.checkAndOpenTransferModal();
      });
    });
  }
  
  checkAndOpenTransferModal() {
    if (this.selectedFromWallet && this.selectedToWallet) {
      this.hideTransferWalletSelector();
      // Pasar ambos IDs al modal
      this.openTransferModal(this.selectedFromWallet, this.selectedToWallet);
    }
  }

  hideTransferWalletSelector() {
    const overlay = document.getElementById('transferWalletOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  openTransferModal(fromWalletId, toWalletId = null) {
    // Llama al método del HuchasManager para abrir el modal de transferencia
    if (window.huchasManager && typeof window.huchasManager.openTransferModal === 'function') {
      window.huchasManager.openTransferModal(fromWalletId, toWalletId);
    } else {
      console.error('HuchasManager not available or openTransferModal not found');
      Helpers.showToast('Error al abrir el modal de transferencia', 'error');
    }
  }
}

// Inicializar el manager cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new QuickActionsManager();
});
