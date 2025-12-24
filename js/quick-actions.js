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
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
      overlay.className = 'income-wallet-overlay'; // Reutilizamos los mismos estilos
      
      const container = document.createElement('div');
      container.className = 'income-wallet-container';
      
      const header = document.createElement('div');
      header.className = 'income-wallet-header';
      header.innerHTML = `
        <h3 class="income-wallet-title">Origen de la transferencia</h3>
      `;
      
      const list = document.createElement('div');
      list.className = 'income-wallet-list';
      
      container.appendChild(header);
      container.appendChild(list);
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
      // Event listener solo para cerrar al hacer click fuera
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.hideTransferWalletSelector();
        }
      });
    }
    
    // Llenar con las wallets actuales
    const list = overlay.querySelector('.income-wallet-list');
    const wallets = AppState.wallets;
    
    if (wallets.length < 2) {
      list.innerHTML = `
        <div class="income-wallet-empty">
          <div class="income-wallet-empty-icon">🐷</div>
          <p>Necesitas al menos 2 wallets</p>
          <span style="font-size: var(--font-size-sm); font-style: italic;">Crea otra wallet para poder transferir dinero</span>
        </div>
      `;
    } else {
      list.innerHTML = wallets.map(wallet => `
        <div class="income-wallet-item" data-wallet-id="${wallet.id}">
          <div class="income-wallet-info">
            <div class="income-wallet-name">${wallet.name}</div>
            <div style="font-size: var(--font-size-sm); color: var(--text-light);">
              ${Helpers.formatCurrency(wallet.balance, wallet.currency)}
            </div>
          </div>
          <div class="income-wallet-icon">💰</div>
        </div>
      `).join('');
      
      // Event listeners para cada wallet
      list.querySelectorAll('.income-wallet-item').forEach(item => {
        item.addEventListener('click', () => {
          const walletId = item.dataset.walletId;
          this.hideTransferWalletSelector();
          this.openTransferModal(walletId);
        });
      });
    }
    
    // Mostrar overlay con animación
    setTimeout(() => {
      overlay.classList.add('active');
    }, 10);
  }

  hideTransferWalletSelector() {
    const overlay = document.getElementById('transferWalletOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  }

  openTransferModal(fromWalletId) {
    // Llama al método del HuchasManager para abrir el modal de transferencia
    if (window.huchasManager && typeof window.huchasManager.openTransferModal === 'function') {
      window.huchasManager.openTransferModal(fromWalletId);
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
