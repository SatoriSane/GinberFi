// Modal functionality
class ModalManager {
    constructor() {
      this.modalsContainer = document.getElementById('modalsContainer');
      this.currentModal = null;
      this.init();
    }
  
    init() {
      // Listen for modal events
      window.appEvents.on('openModal', (modalData) => {
        this.openModal(modalData);
      });
      
      window.appEvents.on('closeModal', () => {
        this.closeModal();
      });
    }
  
    openModal(modalData) {
      this.closeModal(); // Close any existing modal
      
      const modal = this.createModal(modalData);
      this.modalsContainer.appendChild(modal);
      this.currentModal = modal;
      
      // Show modal with animation
      setTimeout(() => {
        modal.classList.add('show');
      }, 10);
      
      // Setup close handlers
      this.setupCloseHandlers(modal);
    }
  
    closeModal() {
      if (this.currentModal) {
        this.currentModal.classList.remove('show');
        setTimeout(() => {
          if (this.currentModal && this.currentModal.parentNode) {
            this.currentModal.parentNode.removeChild(this.currentModal);
          }
          this.currentModal = null;
        }, 300);
      }
    }
  
    createModal(modalData) {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      
      overlay.innerHTML = `
        <div class="modal ${modalData.className || ''}">
          <div class="modal-header">
            <h3 class="modal-title">${modalData.title}</h3>
            <button class="modal-close" type="button">×</button>
          </div>
          <div class="modal-body">
            ${modalData.body}
          </div>
          ${modalData.footer ? `<div class="modal-footer">${modalData.footer}</div>` : ''}
        </div>
      `;
      
      return overlay;
    }
  
    setupCloseHandlers(modal) {
      const closeBtn = modal.querySelector('.modal-close');
      const overlay = modal;
      
      closeBtn.addEventListener('click', () => this.closeModal());
      
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      });
      
      // Close on Escape key
      const escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
          document.removeEventListener('keydown', escapeHandler);
        }
      };
      document.addEventListener('keydown', escapeHandler);
    }
  
    // Specific modal creators
    static createSubcategoryModal(categoryId, categoryName) {
      return {
        title: 'Nueva Subcategoría',
        className: 'subcategory-modal',
        body: `
          <form class="modal-form" id="subcategoryForm">
            <div class="form-group">
              <label for="subcategoryName">Nombre de la subcategoría</label>
              <input type="text" id="subcategoryName" name="name" required 
                     placeholder="ej: Comer fuera">
            </div>
            <div class="form-group">
              <label for="subcategoryBudget">Presupuesto</label>
              <input type="number" id="subcategoryBudget" name="budget" required 
                     placeholder="1000" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="subcategoryFrequency">Frecuencia</label>
              <select id="subcategoryFrequency" name="frequency" required>
                <option value="">Seleccionar frecuencia</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
                <option value="trimestral">Trimestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <input type="hidden" name="categoryId" value="${categoryId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="subcategoryForm">Crear Subcategoría</button>
        `
      };
    }
  
    static createExpenseModal(subcategoryId, subcategoryName, remainingBudget, currency = 'BOB') {
      const selectedAccount = AppState.selectedAccount;
      const accounts = AppState.accounts;
      
      return {
        title: 'Nuevo Gasto',
        className: 'expense-modal',
        body: `
          <div class="expense-info">
            <div class="expense-info-text">Presupuesto disponible en "${subcategoryName}":</div>
            <div class="remaining-budget">${Utils.formatCurrency(remainingBudget, currency)}</div>
          </div>
          <form class="modal-form" id="expenseForm">
            <div class="form-group">
              <label for="expenseDate">Fecha</label>
              <input type="date" id="expenseDate" name="date" required 
                     value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label for="expenseAccount">Cuenta/Cartera</label>
              <select id="expenseAccount" name="accountId" required>
                ${accounts.map(account => `
                  <option value="${account.id}" ${selectedAccount && selectedAccount.id === account.id ? 'selected' : ''}>
                    ${account.name} (${Utils.formatCurrency(account.balance, account.currency)})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="expenseName">Producto/Servicio</label>
              <input type="text" id="expenseName" name="name" required 
                     placeholder="ej: Almuerzo en restaurante">
            </div>
            <div class="form-group">
              <label for="expenseAmount">Valor <span class="currency-display" id="currencyDisplay">${currency}</span></label>
              <input type="number" id="expenseAmount" name="amount" required 
                     placeholder="0.00" step="0.01" min="0.01">
            </div>
            <input type="hidden" name="subcategoryId" value="${subcategoryId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="expenseForm">Agregar Gasto</button>
        `
      };
    }
  
    static createAccountModal() {
      const currencies = [
        { code: 'BOB', name: 'Boliviano' },
        { code: 'USD', name: 'Dólar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'BCH', name: 'Bitcoin Cash' }
      ];
  
      return {
        title: 'Nueva Cuenta/Cartera',
        className: 'account-modal',
        body: `
          <form class="modal-form" id="accountForm">
            <div class="form-group">
              <label for="accountName">Nombre de la cuenta/cartera</label>
              <input type="text" id="accountName" name="name" required 
                     placeholder="ej: Cuenta Corriente">
            </div>
            <div class="form-group">
              <label for="accountCurrency">Moneda</label>
              <div class="currency-grid">
                ${currencies.map((currency, index) => `
                  <div class="currency-option ${index === 0 ? 'selected' : ''}" data-currency="${currency.code}">
                    <div class="currency-code">${currency.code}</div>
                    <div class="currency-name">${currency.name}</div>
                  </div>
                `).join('')}
              </div>
              <input type="hidden" id="accountCurrency" name="currency" value="BOB">
            </div>
            <div class="form-group">
              <label for="accountBalance">Cantidad inicial</label>
              <input type="number" id="accountBalance" name="balance" required 
                     placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="accountPurpose">Propósito (opcional)</label>
              <input type="text" id="accountPurpose" name="purpose" 
                     placeholder="ej: Gastos diarios">
            </div>
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="accountForm">Crear Cuenta</button>
        `
      };
    }
  
    static createIncomeModal(accountId) {
      const account = AppState.accounts.find(acc => acc.id === accountId);
      const incomeSources = Storage.getIncomeSources();
  
      return {
        title: 'Agregar Ingreso',
        className: 'income-modal',
        body: `
          <form class="modal-form" id="incomeForm">
            <div class="form-group">
              <label for="incomeAmount">Cantidad</label>
              <input type="number" id="incomeAmount" name="amount" required 
                     placeholder="0.00" step="0.01" min="0.01">
              <span class="currency-display">${account ? account.currency : 'BOB'}</span>
            </div>
            <div class="form-group">
              <label>Fuente del dinero</label>
              <div class="source-list">
                ${incomeSources.map(source => `
                  <div class="source-item" data-source="${source}">${source}</div>
                `).join('')}
              </div>
              <div class="add-source-section">
                <div class="add-source-input">
                  <input type="text" id="newSource" placeholder="Nueva fuente...">
                  <button type="button" class="add-source-btn" id="addSourceBtn">Agregar</button>
                </div>
              </div>
              <input type="hidden" id="incomeSource" name="source" required>
            </div>
            <div class="form-group">
              <label for="incomeDescription">Descripción (opcional)</label>
              <input type="text" id="incomeDescription" name="description" 
                     placeholder="ej: Sueldo de enero">
            </div>
            <input type="hidden" name="accountId" value="${accountId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="incomeForm">Agregar Ingreso</button>
        `
      };
    }
  
    static createTransferModal(fromAccountId) {
      const accounts = AppState.accounts.filter(acc => acc.id !== fromAccountId);
      const fromAccount = AppState.accounts.find(acc => acc.id === fromAccountId);
  
      return {
        title: 'Transferir Dinero',
        className: 'transfer-modal',
        body: `
          <form class="modal-form" id="transferForm">
            <div class="form-group">
              <label>Desde: ${fromAccount ? fromAccount.name : ''}</label>
              <div class="account-balance">
                Disponible: ${fromAccount ? Utils.formatCurrency(fromAccount.balance, fromAccount.currency) : '0.00'}
              </div>
            </div>
            <div class="form-group">
              <label for="transferTo">Transferir a</label>
              <select id="transferTo" name="toAccountId" required>
                <option value="">Seleccionar cuenta destino</option>
                ${accounts.map(account => `
                  <option value="${account.id}">
                    ${account.name} (${Utils.formatCurrency(account.balance, account.currency)})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="transferAmount">Cantidad</label>
              <input type="number" id="transferAmount" name="amount" required 
                     placeholder="0.00" step="0.01" min="0.01" 
                     max="${fromAccount ? fromAccount.balance : 0}">
              <span class="currency-display">${fromAccount ? fromAccount.currency : 'BOB'}</span>
            </div>
            <div class="form-group">
              <label for="transferDescription">Descripción (opcional)</label>
              <input type="text" id="transferDescription" name="description" 
                     placeholder="ej: Pago de deuda">
            </div>
            <input type="hidden" name="fromAccountId" value="${fromAccountId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="transferForm">Transferir</button>
        `
      };
    }
  
    static createTransactionsModal(accountId) {
      const account = AppState.accounts.find(acc => acc.id === accountId);
      if (!account) return null;

      const transactions = Storage.get('ginberfi_transactions') || [];
      const accountTransactions = transactions
        .filter(t => t.accountId === accountId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        title: `Transacciones - ${account.name}`,
        className: 'transactions-modal',
        body: `
          <div class="account-summary">
            <div class="account-balance">
              <span class="balance-label">Saldo actual:</span>
              <span class="balance-value">${Utils.formatCurrency(account.balance, account.currency)}</span>
            </div>
          </div>
          <div class="transactions-list">
            ${accountTransactions.length === 0 ? `
              <div class="empty-transactions">
                <p>No hay transacciones registradas</p>
              </div>
            ` : accountTransactions.map(transaction => `
              <div class="transaction-item-modal ${transaction.type}">
                <div class="transaction-main">
                  <div class="transaction-info">
                    <div class="transaction-type">${this.getTransactionTypeLabel(transaction.type)}</div>
                    ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                    ${transaction.source ? `<div class="transaction-source">Fuente: ${transaction.source}</div>` : ''}
                  </div>
                  <div class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                    ${transaction.amount > 0 ? '+' : ''}${Utils.formatCurrency(Math.abs(transaction.amount), account.currency)}
                  </div>
                </div>
                <div class="transaction-date">${Utils.formatDate(transaction.date)}</div>
              </div>
            `).join('')}
          </div>
        `,
        footer: `
          <button type="button" class="btn-primary" onclick="window.appEvents.emit('closeModal')">Cerrar</button>
        `
      };
    }

    static createCategoryModal() {
      return {
        title: 'Nueva Categoría',
        className: 'category-modal',
        body: `
          <form class="modal-form" id="categoryForm">
            <div class="form-group">
              <label for="categoryName">Nombre de la categoría</label>
              <input type="text" id="categoryName" name="name" required 
                     placeholder="ej: Alimentación">
            </div>
            <div class="form-group">
              <label for="categoryDescription">Descripción (opcional)</label>
              <input type="text" id="categoryDescription" name="description" 
                     placeholder="ej: Gastos relacionados con comida">
            </div>
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="categoryForm">Crear Categoría</button>
        `
      };
    }

    static getTransactionTypeLabel(type) {
      const labels = {
        'income': 'Ingreso',
        'expense': 'Gasto',
        'transfer_in': 'Transferencia recibida',
        'transfer_out': 'Transferencia enviada'
      };
      return labels[type] || type;
    }
  }
  
  // Initialize modal manager when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    new ModalManager();
  });
  