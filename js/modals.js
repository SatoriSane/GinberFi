// --- Helpers internos para calcular fecha por defecto ---
// Formatea siempre en YYYY-MM-DD en hora local
// -----------------------------
// Helpers (colocar AL PRINCIPIO de modals.js)
// -----------------------------

// Formatea una Date local como YYYY-MM-DD (sin usar toISOString)
function formatDateLocalYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Devuelve la fecha de inicio por defecto (YYYY-MM-DD) en hora local
function getDefaultStartDate(frequency) {
  const today = new Date();
  switch (frequency) {
    case 'semanal': {
      const day = today.getDay(); // domingo=0, lunes=1
      const diff = (day === 0 ? -6 : 1 - day); // mover al lunes
      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);
      monday.setHours(0, 0, 0, 0);
      return formatDateLocalYYYYMMDD(monday);
    }
    case 'mensual': {
      const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startMonth.setHours(0, 0, 0, 0);
      return formatDateLocalYYYYMMDD(startMonth);
    }
    case 'trimestral': {
      const startQuarter = new Date(today.getFullYear(), today.getMonth(), 1);
      startQuarter.setHours(0, 0, 0, 0);
      return formatDateLocalYYYYMMDD(startQuarter);
    }
    case 'anual': {
      const startYear = new Date(today.getFullYear(), 0, 1);
      startYear.setHours(0, 0, 0, 0);
      return formatDateLocalYYYYMMDD(startYear);
    }
    default: {
      today.setHours(0, 0, 0, 0);
      return formatDateLocalYYYYMMDD(today);
    }
  }
}

// Calcula la fecha de reinicio (primer día siguiente ciclo) en YYYY-MM-DD (hora local)
// startDate debe ser 'YYYY-MM-DD'
function getEndDate(startDate, frequency) {
  // Forzamos hora local a medianoche creando Date con T00:00:00
  const start = new Date(startDate + 'T00:00:00');
  let end = new Date(start);

  switch (frequency) {
    case 'semanal':
      end.setDate(start.getDate() + 7);
      break;
    case 'mensual':
      end.setMonth(start.getMonth() + 1);
      break;
    case 'trimestral':
      end.setMonth(start.getMonth() + 3);
      break;
    case 'anual':
      end.setFullYear(start.getFullYear() + 1);
      break;
    default:
      end = new Date(start);
  }

  end.setHours(0, 0, 0, 0);
  return formatDateLocalYYYYMMDD(end);
}

// Convierte 'YYYY-MM-DD' a texto legible local (ej: "1 de enero de 2026")
function formatLocalDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00'); // forzar medianoche local
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

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
// --- Crear subcategoría ---
static createSubcategoryModal(categoryId) {
  const defaultFrequency = 'mensual';
  const defaultStartDate = getDefaultStartDate(defaultFrequency);
  const defaultEndDate = getEndDate(defaultStartDate, defaultFrequency);

  const modalConfig = {
    title: 'Crear Subcategoría',
    className: 'subcategory-modal',
    body: `
      <form class="modal-form" id="subcategoryForm">
        <div class="form-group">
          <label for="subcategoryName">Nombre de la subcategoría</label>
          <input type="text" id="subcategoryName" name="name" required>
        </div>
        <div class="form-group">
          <label for="subcategoryBudget">Presupuesto</label>
          <input type="number" id="subcategoryBudget" name="budget" required step="0.01" min="0">
        </div>
        <div class="form-group">
          <label for="subcategoryFrequency">Frecuencia</label>
          <select id="subcategoryFrequency" name="frequency" required>
            <option value="semanal">Semanal</option>
            <option value="mensual" selected>Mensual</option>
            <option value="trimestral">Trimestral</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        <div class="form-group">
          <label for="subcategoryStartDate">Fecha de inicio del presupuesto</label>
          <input type="date" id="subcategoryStartDate" name="startDate" required value="${defaultStartDate}">
          <small id="subcategoryInfo" class="info-text">
            Se reiniciará el ${formatLocalDate(defaultEndDate)}
          </small>
        </div>
        <input type="hidden" name="categoryId" value="${categoryId}">
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
      <button type="submit" class="btn-primary" form="subcategoryForm">Crear Subcategoría</button>
    `
  };

  setTimeout(() => {
    const freqSelect = document.getElementById('subcategoryFrequency');
    const startInput = document.getElementById('subcategoryStartDate');
    const info = document.getElementById('subcategoryInfo');

    function updateInfo() {
      const frequency = freqSelect.value;
      const startDate = startInput.value;
      if (startDate) {
        const endDate = getEndDate(startDate, frequency);
        info.textContent = `Se reiniciará el ${formatLocalDate(endDate)}`;
      }
    }

    if (freqSelect && startInput) {
      freqSelect.addEventListener('change', () => {
        startInput.value = getDefaultStartDate(freqSelect.value);
        updateInfo();
      });
      startInput.addEventListener('change', updateInfo);
      updateInfo();
    }

    // ⚡ Guardar subcategoría con endDate al enviar el formulario
    const form = document.getElementById('subcategoryForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const budget = parseFloat(form.budget.value);
      const frequency = form.frequency.value;
      const startDate = form.startDate.value;
      const endDate = getEndDate(startDate, frequency);

      const subcategory = { name, budget, frequency, startDate, endDate };

      Storage.addSubcategory(categoryId, subcategory);
      window.appEvents.emit('closeModal');
      window.appEvents.emit('refreshCategories'); // Para re-renderizar
    });

  }, 0);

  return modalConfig;
}



// --- Editar subcategoría ---
static editSubcategoryModal(subcategory) {
  const defaultStartDate = subcategory.startDate || getDefaultStartDate(subcategory.frequency);
  const defaultEndDate = subcategory.endDate || getEndDate(defaultStartDate, subcategory.frequency);

  const modalConfig = {
    title: 'Editar Subcategoría',
    className: 'subcategory-modal',
    body: `
      <form class="modal-form" id="editSubcategoryForm">
        <div class="form-group">
          <label for="editSubcategoryName">Nombre de la subcategoría</label>
          <input type="text" id="editSubcategoryName" name="name" required value="${subcategory.name || ''}">
        </div>
        <div class="form-group">
          <label for="editSubcategoryBudget">Presupuesto</label>
          <input type="number" id="editSubcategoryBudget" name="budget" required value="${subcategory.budget}" step="0.01" min="0">
        </div>
        <div class="form-group">
          <label for="editSubcategoryFrequency">Frecuencia</label>
          <select id="editSubcategoryFrequency" name="frequency" required>
            <option value="semanal" ${subcategory.frequency === 'semanal' ? 'selected' : ''}>Semanal</option>
            <option value="mensual" ${subcategory.frequency === 'mensual' ? 'selected' : ''}>Mensual</option>
            <option value="trimestral" ${subcategory.frequency === 'trimestral' ? 'selected' : ''}>Trimestral</option>
            <option value="anual" ${subcategory.frequency === 'anual' ? 'selected' : ''}>Anual</option>
          </select>
        </div>
        <div class="form-group">
          <label for="editSubcategoryStartDate">Fecha de inicio del presupuesto</label>
          <input type="date" id="editSubcategoryStartDate" name="startDate" required value="${defaultStartDate}">
          <small id="editSubcategoryInfo" class="info-text">
            Se reiniciará el ${formatLocalDate(defaultEndDate)}
          </small>
        </div>
        <div class="form-group delete-subcategory">
          <button type="button" class="btn-text-danger"
                  onclick="if(confirm('¿Seguro que quieres eliminar esta subcategoría?')) deleteSubcategory(${subcategory.id})">
            🗑️ Eliminar subcategoría
          </button>
        </div>

        <input type="hidden" name="subcategoryId" value="${subcategory.id}">
        <input type="hidden" name="categoryId" value="${subcategory.categoryId}">
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
      <button type="submit" class="btn-primary" form="editSubcategoryForm">Guardar</button>
    `
  };

  setTimeout(() => {
    const freqSelect = document.getElementById('editSubcategoryFrequency');
    const startInput = document.getElementById('editSubcategoryStartDate');
    const info = document.getElementById('editSubcategoryInfo');

    function updateInfo() {
      const frequency = freqSelect.value;
      const startDate = startInput.value;
      if (startDate) {
        const endDate = getEndDate(startDate, frequency);
        info.textContent = `Se reiniciará el ${formatLocalDate(endDate)}`;
      }
    }

    if (freqSelect && startInput) {
      freqSelect.addEventListener('change', () => {
        startInput.value = getDefaultStartDate(freqSelect.value);
        updateInfo();
      });
      startInput.addEventListener('change', updateInfo);
      updateInfo();
    }

    // ⚡ Guardar cambios al enviar el formulario
    const form = document.getElementById('editSubcategoryForm');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      const budget = parseFloat(form.budget.value);
      const frequency = form.frequency.value;
      const startDate = form.startDate.value;
      const endDate = getEndDate(startDate, frequency);

      const updates = { name, budget, frequency, startDate, endDate };

      Storage.updateSubcategory(subcategory.categoryId, subcategory.id, updates);
      window.appEvents.emit('closeModal');
      window.appEvents.emit('refreshCategories'); // Para re-renderizar
    });

  }, 0);

  return modalConfig;
}



    static editCategoryModal(category) {
      return {
        title: 'Editar Categoría',
        className: 'category-modal',
        body: `
          <form class="modal-form" id="editCategoryForm">
            <div class="form-group">
              <label for="editCategoryName">Nombre de la categoría</label>
              <input type="text" id="editCategoryName" name="name" required 
                     value="${category.name || ''}">
            </div>
            <div class="form-group">
              <label for="editCategoryDescription">Descripción (opcional)</label>
              <input type="text" id="editCategoryDescription" name="description" 
                     value="${category.description || ''}">
            </div>
            <input type="hidden" name="categoryId" value="${category.id}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="editCategoryForm">Guardar</button>
        `
      };
    }
    

    
    
    static createExpenseModal(subcategoryId, subcategoryName, remainingBudget, currency = 'BOB') {
      const selectedWallet = AppState.selectedWallet;
      const wallets = AppState.wallets;
      
      return {
        title: 'Gasto en '+ subcategoryName,
        className: 'expense-modal',
        body: `
          <div class="expense-info">
            <div class="expense-info-text">Presupuesto disponible:</div>
            <div class="remaining-budget">${Utils.formatCurrency(remainingBudget, currency)}</div>
          </div>
          <form class="modal-form" id="expenseForm">
            <div class="form-group">
              <label for="expenseDate">Fecha</label>
              <input type="date" id="expenseDate" name="date" required 
                     value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label for="expenseWallet">Wallet</label>
              <select id="expenseWallet" name="walletId" required>
                ${wallets.map(wallet => `
                  <option value="${wallet.id}" ${selectedWallet && selectedWallet.id === wallet.id ? 'selected' : ''}>
                    ${wallet.name} (${Utils.formatCurrency(wallet.balance, wallet.currency)})
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
          <button type="submit" class="btn-primary" form="expenseForm">Agregar</button>
        `
      };
    }
    static editExpenseModal(expense, currency = 'BOB') {
      return {
        title: 'Editar Gasto',
        className: 'expense-modal',
        body: `
          <form class="modal-form" id="editExpenseForm">
            <div class="form-group">
              <label for="editExpenseName">Producto/Servicio</label>
              <input type="text" id="editExpenseName" name="name" required value="${expense.name}">
            </div>
            <div class="form-group">
              <label for="editExpenseAmount">Valor <span class="currency-display">${currency}</span></label>
              <input type="number" id="editExpenseAmount" name="amount" required value="${expense.amount}" step="0.01" min="0.01">
            </div>
            <div class="form-group">
              <label for="editExpenseDate">Fecha</label>
              <input type="date" id="editExpenseDate" name="date" required value="${expense.date}">
            </div>
            <div class="form-group">
              <label for="editExpenseWallet">Wallet</label>
              <select id="editExpenseWallet" name="walletId" required>
                ${AppState.wallets.map(w => `
                  <option value="${w.id}" ${w.id === expense.walletId ? 'selected' : ''}>
                    ${w.name} (${Utils.formatCurrency(w.balance, w.currency)})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group delete-expense">
              <button type="button" class="btn-text-danger" onclick="if(confirm('¿Seguro que quieres eliminar este gasto?')) deleteExpense(${expense.id})">
                🗑️ Eliminar gasto
              </button>
            </div>
            <input type="hidden" name="expenseId" value="${expense.id}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="editExpenseForm">Guardar</button>
        `
      };
    }
    
    static createWalletModal() {
      const currencies = [
        { code: 'BOB', name: 'Boliviano' },
        { code: 'USD', name: 'Dólar' },
        { code: 'EUR', name: 'Euro' },
        { code: 'BCH', name: 'Bitcoin Cash' }
      ];
  
      return {
        title: 'Nueva Wallet',
        className: 'wallet-modal',
        body: `
          <form class="modal-form" id="walletForm">
            <div class="form-group">
              <label for="walletName">Nombre de la wallet/wallet</label>
              <input type="text" id="walletName" name="name" required 
                     placeholder="ej: Wallet Corriente">
            </div>
            <div class="form-group">
              <label for="walletCurrency">Moneda</label>
              <div class="currency-grid">
                ${currencies.map((currency, index) => `
                  <div class="currency-option ${index === 0 ? 'selected' : ''}" data-currency="${currency.code}">
                    <div class="currency-code">${currency.code}</div>
                    <div class="currency-name">${currency.name}</div>
                  </div>
                `).join('')}
              </div>
              <input type="hidden" id="walletCurrency" name="currency" value="BOB">
            </div>
            <div class="form-group">
              <label for="walletBalance">Cantidad inicial</label>
              <input type="number" id="walletBalance" name="balance" required 
                     placeholder="0.00" step="0.01" min="0">
            </div>
            <div class="form-group">
              <label for="walletPurpose">Propósito (opcional)</label>
              <input type="text" id="walletPurpose" name="purpose" 
                     placeholder="ej: Gastos diarios">
            </div>
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="walletForm">Crear Wallet</button>
        `
      };
    }
  
    static createIncomeModal(walletId) {
      const wallet = AppState.wallets.find(acc => acc.id === walletId);
      const incomeSources = Storage.getIncomeSources();
  
      return {
        title: 'Agregar Ingreso',
        className: 'income-modal',
        body: `
          <form class="modal-form" id="incomeForm">
            <div class="form-group">
              <label for="incomeAmount">Cantidad</label>
              <div class="input-with-currency">
                <input type="number" id="incomeAmount" name="amount" required 
                      placeholder="0.00" step="0.01" min="0.01">
                <span class="currency-display">${wallet ? wallet.currency : 'BOB'}</span>
              </div>
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
            <input type="hidden" name="walletId" value="${walletId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="incomeForm">Agregar Ingreso</button>
        `
      };
    }
  
    static createTransferModal(fromWalletId) {
      const wallets = AppState.wallets.filter(acc => acc.id !== fromWalletId);
      const fromWallet = AppState.wallets.find(acc => acc.id === fromWalletId);
  
      return {
        title: 'Transferir Dinero',
        className: 'transfer-modal',
        body: `
          <form class="modal-form" id="transferForm">
            <div class="form-group">
              <label>Desde: ${fromWallet ? fromWallet.name : ''}</label>
              <div class="wallet-balance">
                Disponible: ${fromWallet ? Utils.formatCurrency(fromWallet.balance, fromWallet.currency) : '0.00'}
              </div>
            </div>
            <div class="form-group">
              <label for="transferTo">Transferir a</label>
              <select id="transferTo" name="toWalletId" required>
                <option value="">Seleccionar wallet destino</option>
                ${wallets.map(wallet => `
                  <option value="${wallet.id}">
                    ${wallet.name} (${Utils.formatCurrency(wallet.balance, wallet.currency)})
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
        <label for="transferAmount">Cantidad</label>
        <div class="input-with-currency">
          <input type="number" id="transferAmount" name="amount" required 
                placeholder="0.00" step="0.01" min="0.01" 
                max="${fromWallet ? fromWallet.balance : 0}">
          <span class="currency-display">${fromWallet ? fromWallet.currency : 'BOB'}</span>
        </div>
      </div>
            <div class="form-group">
              <label for="transferDescription">Descripción (opcional)</label>
              <input type="text" id="transferDescription" name="description" 
                     placeholder="ej: Pago de deuda">
            </div>
            <input type="hidden" name="fromWalletId" value="${fromWalletId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="transferForm">Transferir</button>
        `
      };
    }
  
    static createTransactionsModal(walletId) {
      const wallet = AppState.wallets.find(acc => acc.id === walletId);
      if (!wallet) return null;

      const transactions = Storage.get('ginbertfi_transactions') || [];
      const walletTransactions = transactions
        .filter(t => t.walletId === walletId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      return {
        title: `Transacciones - ${wallet.name}`,
        className: 'transactions-modal',
        body: `
          <div class="wallet-summary">
            <div class="wallet-balance">
              <span class="balance-label">Saldo actual:</span>
              <span class="balance-value">${Utils.formatCurrency(wallet.balance, wallet.currency)}</span>
            </div>
          </div>
          <div class="transactions-list">
            ${walletTransactions.length === 0 ? `
              <div class="empty-transactions">
                <p>No hay transacciones registradas</p>
              </div>
            ` : walletTransactions.map(transaction => `
              <div class="transaction-item-modal ${transaction.type}">
                <div class="transaction-main">
                  <div class="transaction-info">
                    <div class="transaction-type">${this.getTransactionTypeLabel(transaction.type)}</div>
                    ${transaction.description ? `<div class="transaction-description">${transaction.description}</div>` : ''}
                    ${transaction.source ? `<div class="transaction-source">Fuente: ${transaction.source}</div>` : ''}
                  </div>
                  <div class="transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}">
                    ${transaction.amount > 0 ? '+' : ''}${Utils.formatCurrency(Math.abs(transaction.amount), wallet.currency)}
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
  