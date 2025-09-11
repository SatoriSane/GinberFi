// Modal functionality
class ModalManager {
    static instance = null;

    constructor() {
        if (ModalManager.instance) {
            return ModalManager.instance;
        }

        this.modalsContainer = document.getElementById('modalsContainer');
        this.currentModal = null;
        this.escapeHandler = null; // Para poder remover el listener correctamente

        ModalManager.instance = this;
        this.init();
    }

    static getInstance() {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
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
  
// Abrir modal genérico
openModal(modalData) {
  if (!this.modalsContainer) return;

  this.closeModal(); // siempre cerramos el modal actual antes de mostrar uno nuevo

  const modal = this.createModal(modalData);
  this.modalsContainer.appendChild(modal);
  this.currentModal = modal;

  // Mostrar con animación
  setTimeout(() => modal.classList.add('show'), 10);

  // Handlers de cierre
  this.setupCloseHandlers(modal);

  // Ejecutar función específica si la hay (como asignar eventos)
  if (modalData.onShow) modalData.onShow(modal);
}

    
  
    closeModal() {
        if (this.currentModal) {
            this.currentModal.classList.remove('show');
            this.removeEventListeners(); // Limpiar listeners

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
        const modalContent = overlay.querySelector('.modal');
        if (!modalContent.contains(e.target)) {
          this.closeModal();
        }
      });
      
      
      // Close on Escape key
      this.escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }
  
    removeEventListeners() {
        if (this.escapeHandler) {
            document.removeEventListener('keydown', this.escapeHandler);
            this.escapeHandler = null;
        }
    }
    reattachCloseHandlers() {
      if (!this.currentModal) return;
  
      // Elimina el listener de Escape que pudiera quedar colgado
      this.removeEventListeners();
  
      const closeBtn = this.currentModal.querySelector('.modal-close');
      const overlay  = this.currentModal;   // overlay = elemento .modal‑overlay
  
      // Botón X
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeModal());
      }
  
      // Click fuera del contenido
      overlay.addEventListener('click', e => {
        if (e.target === overlay) this.closeModal();
      });
  
      // Tecla Escape
      this.escapeHandler = e => {
        if (e.key === 'Escape') this.closeModal();
      };
      document.addEventListener('keydown', this.escapeHandler);
    }

    // Specific modal creators
// --- Crear subcategoría ---
static createSubcategoryModal(categoryId) {
  const defaultFrequency = 'mensual';
  const defaultStartDate = Helpers.getDefaultStartDate(defaultFrequency);
  const defaultEndDate = Helpers.getEndDate(defaultStartDate, defaultFrequency);

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
            Último día: ${Helpers.formatLocalDate(defaultEndDate)}
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
        const endDate = Helpers.getEndDate(startDate, frequency);
        info.textContent = `Último día: ${Helpers.formatLocalDate(endDate)}`;
      }
    }

    if (freqSelect && startInput) {
      freqSelect.addEventListener('change', () => {
        startInput.value = Helpers.getDefaultStartDate(freqSelect.value);
        updateInfo();
      });
      startInput.addEventListener('change', updateInfo);
      updateInfo();
    }


  }, 0);

  return modalConfig;
}



static editSubcategoryModal(subcategory) {
  const defaultStartDate = subcategory.startDate || Helpers.getDefaultStartDate(subcategory.frequency);
  const defaultEndDate = Helpers.getEndDate(defaultStartDate, subcategory.frequency);

  const category = AppState.categories.find(c => c.id === subcategory.categoryId);
  const expenses = Storage.getExpenses();
  const hasExpenses = expenses.some(exp => exp.subcategoryId === subcategory.id);

  const modalConfig = {
    title: 'Editar Subcategoría',
    className: 'subcategory-modal',
    body: `
      <form class="modal-form" id="editSubcategoryForm">
        <!-- Sección edición -->
        <div id="editSection">
          <div class="form-group">
            <label for="editSubcategoryName">Nombre de la subcategoría</label>
            <input type="text" id="editSubcategoryName" name="name" required value="${subcategory.name}">
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
              Último día: ${Helpers.formatLocalDate(defaultEndDate)}
            </small>
          </div>

          <div class="form-group delete-subcategory">
            <button type="button" class="btn-text-danger" id="triggerDeleteBtn">🗑️ Eliminar subcategoría</button>
          </div>
        </div>

        <!-- Sección eliminación -->
        <div id="deleteSection" style="display: none; margin-top: 1rem;">
          ${hasExpenses ? `
            <p>La subcategoría <strong>${subcategory.name}</strong> tiene gastos asociados.</p>
            <div class="delete-options">
              <div class="delete-option card-option" data-option="delete">
                <h4>🗑️ Eliminar gastos</h4>
                <p>Todos los gastos asociados serán eliminados junto con la subcategoría.</p>
              </div>
              <div class="delete-option card-option" data-option="move">
                <h4>📂 Mover gastos</h4>
                <p>Conserva los gastos y muévelos a otra subcategoría.</p>
                <div id="subcategorySelectWrapper" style="display:none; margin-top:0.5rem;"></div>
              </div>
            </div>
          ` : `
            <p>¿Deseas eliminar la subcategoría <strong>${subcategory.name}</strong>?</p>
          `}
        </div>

        <input type="hidden" name="subcategoryId" value="${subcategory.id}">
        <input type="hidden" name="categoryId" value="${subcategory.categoryId}">
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" id="modalCancelBtn">Cancelar</button>
      <button type="submit" class="btn-primary" form="editSubcategoryForm" id="modalSubmitBtn">Guardar</button>
    `,
    onShow: (modal) => {
      const editSection = modal.querySelector('#editSection');
      const deleteSection = modal.querySelector('#deleteSection');
      const modalTitle = modal.querySelector('.modal-title');
      const freqSelect = modal.querySelector('#editSubcategoryFrequency');
      const startInput = modal.querySelector('#editSubcategoryStartDate');
      const info = modal.querySelector('#editSubcategoryInfo');
      const triggerDeleteBtn = modal.querySelector('#triggerDeleteBtn');
      const cancelBtn = modal.querySelector('#modalCancelBtn');
      const submitBtn = modal.querySelector('#modalSubmitBtn');
      const wrapper = modal.querySelector('#subcategorySelectWrapper');

      // Actualizar info de fechas
      function updateInfo() {
        const frequency = freqSelect.value;
        const startDate = startInput.value;
        if (startDate) {
          const endDate = Helpers.getEndDate(startDate, frequency);
          info.textContent = `Último día: ${Helpers.formatLocalDate(endDate)}`;
        }
      }
      freqSelect.addEventListener('change', () => {
        startInput.value = Helpers.getDefaultStartDate(freqSelect.value);
        updateInfo();
      });
      startInput.addEventListener('change', updateInfo);
      updateInfo();

      // Guardar cambios de edición
      function saveEdit(e) {
        e.preventDefault();
        const formData = new FormData(modal.querySelector('#editSubcategoryForm'));
        Storage.updateSubcategory(formData.get('categoryId'), formData.get('subcategoryId'), {
          name: formData.get('name'),
          budget: parseFloat(formData.get('budget')),
          frequency: formData.get('frequency'),
          startDate: formData.get('startDate')
        });
        AppState.refreshData();
        Helpers.showToast('Subcategoría actualizada', 'success');
        window.appEvents.emit('closeModal');
      }
      submitBtn.onclick = saveEdit;

      // Cancelar
      cancelBtn.onclick = () => window.appEvents.emit('closeModal');

      // Modo eliminación
      triggerDeleteBtn.addEventListener('click', () => {
        editSection.style.display = 'none';
        deleteSection.style.display = 'block';
        modalTitle.textContent = 'Eliminar Subcategoría';
        submitBtn.textContent = 'Eliminar';

        let deleteChoice = 'delete';
        const deleteOptions = modal.querySelectorAll('.delete-option');

        deleteOptions.forEach(opt => {
          opt.addEventListener('click', () => {
            deleteOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            deleteChoice = opt.dataset.option;

            if (deleteChoice === 'move') {
              wrapper.style.display = 'block';
              wrapper.innerHTML = '';
              const select = Helpers.buildSubcategorySelect(null, subcategory.id);
              
              // ⚡ Evita que los clics dentro del select afecten al card-option padre
              select.addEventListener('click', e => e.stopPropagation());
              select.addEventListener('change', e => e.stopPropagation());
              
              wrapper.appendChild(select);
            } else {
              wrapper.style.display = 'none';
            }
            
          });
        });

        // Confirmar eliminación
        submitBtn.onclick = (e) => {
          e.preventDefault();

          let targetId = null;
          if (deleteChoice === 'move') {
            targetId = wrapper.querySelector('select[name="targetSubcategory"]')?.value;
            if (!targetId) {
              Helpers.showToast('Selecciona una subcategoría destino', 'error');
              return;
            }
          }

          Storage.deleteSubcategory(subcategory.categoryId, subcategory.id, {
            action: deleteChoice,
            targetSubcategoryId: targetId
          });

          AppState.refreshData();
          Helpers.showToast(
            deleteChoice === 'delete'
              ? 'Subcategoría y gastos eliminados'
              : 'Subcategoría eliminada y gastos movidos',
            'success'
          );

          window.appEvents.emit('closeModal');
        };
      });
    }
  };

  return modalConfig;
}






static editCategoryModal(category) {
  const hasSubcategories = category.subcategories?.length > 0;
  const otherCategories = (AppState.categories || []).filter(c => c.id !== category.id);

  return {
    title: 'Editar Categoría',
    className: 'category-modal',
    body: `
      <form class="modal-form" id="editCategoryForm">
        <!-- Sección edición -->
        <div id="editCategorySection">
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

          <div class="form-group delete-category">
            <button type="button" class="btn-text-danger" id="triggerDeleteCategoryBtn">
              🗑️ Eliminar categoría
            </button>
          </div>
        </div>

        <!-- Sección eliminación -->
        <div id="deleteCategorySection" style="display: none; margin-top: 1rem;">
          ${hasSubcategories ? `
            <p>La categoría <strong>${category.name}</strong> contiene subcategorías y gastos.</p>

            <div class="delete-options">
              <div class="delete-option card-option" data-option="delete">
                <h4>🗑️ Eliminar todo</h4>
                <p>Se eliminarán la categoría, sus subcategorías y todos los gastos asociados.</p>
              </div>
              <div class="delete-option card-option ${otherCategories.length ? '' : 'disabled'}" data-option="move">
                <h4>📂 Mover subcategorías</h4>
                <p>Mover todas las subcategorías (y sus gastos) a otra categoría.</p>
                <div id="categorySelectWrapper" style="display:none; margin-top:0.5rem;"></div>
              </div>
            </div>
          ` : `
            <p>¿Deseas eliminar la categoría <strong>${category.name}</strong>?</p>
          `}
        </div>

        <input type="hidden" name="categoryId" value="${category.id}">
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" id="categoryCancelBtn">Cancelar</button>
      <button type="submit" class="btn-primary" form="editCategoryForm" id="categorySubmitBtn">Guardar</button>
    `,
    onShow: (modal) => {
      const editSection = modal.querySelector('#editCategorySection');
      const deleteSection = modal.querySelector('#deleteCategorySection');
      const modalTitle = modal.querySelector('.modal-title');
      const submitBtn = modal.querySelector('#categorySubmitBtn');
      const cancelBtn = modal.querySelector('#categoryCancelBtn');
      const triggerDeleteBtn = modal.querySelector('#triggerDeleteCategoryBtn');
      const wrapper = modal.querySelector('#categorySelectWrapper');

      // Guardar cambios
      function saveEdit(e) {
        e.preventDefault();
        const formData = new FormData(modal.querySelector('#editCategoryForm'));
        Storage.updateCategory(formData.get('categoryId'), {
          name: formData.get('name'),
          description: formData.get('description')
        });
        AppState.refreshData();
        Helpers.showToast('Categoría actualizada', 'success');
        window.appEvents.emit('closeModal');
      }
      submitBtn.onclick = saveEdit;

      // Cancelar → cerrar modal
      cancelBtn.onclick = () => window.appEvents.emit('closeModal');

      // Pasar a modo eliminación
      triggerDeleteBtn.addEventListener('click', () => {
        editSection.style.display = 'none';
        deleteSection.style.display = 'block';
        modalTitle.textContent = 'Eliminar Categoría';
        submitBtn.textContent = 'Eliminar';

        let deleteChoice = null;

        // Construir select si corresponde
        if (wrapper && otherCategories.length) {
          wrapper.innerHTML = '';
          wrapper.appendChild(Helpers.buildCategorySelect(null, category.id));
        }

        // Selección de opción
        const options = modal.querySelectorAll('.delete-option');
        options.forEach(opt => {
          if (opt.classList.contains('disabled')) return;
          opt.addEventListener('click', () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            deleteChoice = opt.dataset.option;

            if (deleteChoice === 'move') {
              wrapper.style.display = 'block';
            } else {
              wrapper.style.display = 'none';
            }
          });
        });

        // Confirmar eliminación
        submitBtn.onclick = (e) => {
          e.preventDefault();

          if (hasSubcategories) {
            if (!deleteChoice) {
              Helpers.showToast('Selecciona una opción para continuar', 'error');
              return;
            }

            let targetId = null;
            if (deleteChoice === 'move') {
              targetId = wrapper.querySelector('select[name="targetCategory"]')?.value;
              if (!targetId) {
                Helpers.showToast('Selecciona una categoría destino', 'error');
                return;
              }
            }

            Storage.deleteCategory(category.id, {
              action: deleteChoice,
              targetCategoryId: targetId
            });
            Helpers.showToast(
              deleteChoice === 'delete'
                ? 'Categoría y subcategorías eliminadas'
                : 'Categoría eliminada y subcategorías movidas',
              'success'
            );
          } else {
            Storage.deleteCategory(category.id, { action: 'delete' });
            Helpers.showToast('Categoría eliminada', 'success');
          }

          AppState.refreshData();
          window.appEvents.emit('closeModal');
        };
      });
    }
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
            <div class="remaining-budget">${Helpers.formatCurrency(remainingBudget, currency)}</div>
          </div>
          <form class="modal-form" id="expenseForm">
<div class="form-group">
  <label for="expenseDate">Fecha</label>
  <input type="date" id="expenseDate" name="date" required 
         value="${new Date().toLocaleDateString('en-CA')}">
</div>

            <div class="form-group">
              <label for="expenseWallet">Wallet</label>
              <select id="expenseWallet" name="walletId" required>
                ${wallets.map(wallet => `
                  <option value="${wallet.id}" ${selectedWallet && selectedWallet.id === wallet.id ? 'selected' : ''}>
                    ${wallet.name} (${Helpers.formatCurrency(wallet.balance, wallet.currency)})
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
// ------------------------------------------------------------
//  EDIT EXPENSE – GASTO CLASIFICADO (ya tiene categoría)
// ------------------------------------------------------------
static editExpenseModalClassified(expense, currency = 'BOB') {
  return {
    title: 'Editar Gasto',
    className: 'expense-modal',

    /* ----------  SOLO EL FORMULARIO  ---------- */
    body: `
      <form class="modal-form" id="editExpenseForm">
        <div class="form-group">
          <label for="editExpenseName">Producto/Servicio</label>
          <input type="text" id="editExpenseName" name="name" required
                 value="${expense.name}">
        </div>

        <div class="form-group">
          <label for="editExpenseAmount">Valor <span class="currency-display">${currency}</span></label>
          <input type="number" id="editExpenseAmount" name="amount" required
                 value="${expense.amount}" step="0.01" min="0.01">
        </div>

        <div class="form-group">
          <label for="editExpenseDate">Fecha</label>
          <input type="date" id="editExpenseDate" name="date" required
                 value="${expense.date}">
        </div>

        <div class="form-group">
          <label for="editExpenseWallet">Wallet</label>
          <select id="editExpenseWallet" name="walletId" required>
            ${AppState.wallets.map(w => `
              <option value="${w.id}" ${w.id === expense.walletId ? 'selected' : ''}>
                ${w.name} (${Helpers.formatCurrency(w.balance, w.currency)})
              </option>`).join('')}
          </select>
        </div>

        <!-- La sub‑categoría ya está guardada → la enviamos como hidden -->
        <input type="hidden" name="subcategoryId"
               value="${expense.subcategoryId}">

        <div class="form-group delete-expense">
          <button type="button" class="btn-text-danger"
                  onclick="window.gastosManager.handleDeleteExpense('${expense.id}')">
            🗑️ Eliminar gasto
          </button>
        </div>

        <input type="hidden" name="expenseId" value="${expense.id}">
      </form>
    `,

    /* ----------  FOOTER FUERA DEL FORMULARIO  ---------- */
    footer: `
      <button type="button" class="btn-secondary"
              onclick="window.appEvents.emit('closeModal')">Cancelar</button>
      <button type="submit" class="btn-primary"
              form="editExpenseForm">Guardar</button>
    `
  };
}
/**
 * Modal → Clasificar un gasto que se creó con “Gasto rápido”.
 * Contiene un <select> para elegir la sub‑categoría a la que se quiere
 * asignar el gasto.
 */
// ------------------------------------------------------------
//  EDIT EXPENSE – GASTO SIN CLASIFICAR (quick‑expense)
// ------------------------------------------------------------
static editExpenseModalUnclassified(expense, currency = 'BOB') {
  return {
    title: 'Clasificar Gasto',
    className: 'expense-modal',

    body: `
      <form class="modal-form" id="editExpenseForm">
        <div class="form-group">
          <label for="editExpenseName">Producto/Servicio</label>
          <input type="text" id="editExpenseName" name="name" required
                 value="${expense.name}">
        </div>

        <div class="form-group">
          <label for="editExpenseAmount">Valor <span class="currency-display">${currency}</span></label>
          <input type="number" id="editExpenseAmount" name="amount" required
                 value="${expense.amount}" step="0.01" min="0.01">
        </div>

        <div class="form-group">
          <label for="editExpenseDate">Fecha</label>
          <input type="date" id="editExpenseDate" name="date" required
                 value="${expense.date}">
        </div>

        <div class="form-group">
          <label for="editExpenseWallet">Wallet</label>
          <select id="editExpenseWallet" name="walletId" required>
            ${AppState.wallets.map(w => `
              <option value="${w.id}" ${w.id === expense.walletId ? 'selected' : ''}>
                ${w.name} (${Helpers.formatCurrency(w.balance, w.currency)})
              </option>`).join('')}
          </select>
        </div>

        <div class="form-group" id="subcategory-container">
          <label for="expenseSubcategory">Clasificar en</label>
          <select id="expenseSubcategory" name="subcategoryId" required>
            <option value="">-- Selecciona para clasificar --</option>
          </select>
        </div>

        <div class="form-group delete-expense">
          <button type="button" class="btn-text-danger"
                  onclick="window.gastosManager.handleDeleteExpense('${expense.id}')">
            🗑️ Eliminar gasto
          </button>
        </div>

        <input type="hidden" name="expenseId" value="${expense.id}">

        <!-- MOVEMOS EL FOOTER DENTRO DEL FORM -->
        <div class="modal-footer">
          <button type="button" class="btn-secondary" id="cancelButton">Cancelar</button>
          <button type="submit" class="btn-primary">Clasificar</button>
        </div>
      </form>
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
                Disponible: ${fromWallet ? Helpers.formatCurrency(fromWallet.balance, fromWallet.currency) : '0.00'}
              </div>
            </div>
            <div class="form-group">
              <label for="transferTo">Transferir a</label>
              <select id="transferTo" name="toWalletId" required>
                <option value="">Seleccionar wallet destino</option>
                ${wallets.map(wallet => `
                  <option value="${wallet.id}">
                    ${wallet.name} (${Helpers.formatCurrency(wallet.balance, wallet.currency)})
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
              <span class="balance-value">${Helpers.formatCurrency(wallet.balance, wallet.currency)}</span>
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
                    ${transaction.amount > 0 ? '+' : ''}${Helpers.formatCurrency(Math.abs(transaction.amount), wallet.currency)}
                  </div>
                </div>
                <div class="transaction-date">${Helpers.formatDate(transaction.date)}</div>
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
// 🚀 NUEVA FUNCIÓN para el Gasto Rápido
static createQuickExpenseModal() {
  const wallets = AppState.wallets;
  // Obtenemos la wallet activa para preseleccionarla y hacer el proceso más rápido
  const activeWalletId = Storage.get('ginbertfi_activeWalletId') || (wallets.length > 0 ? wallets[0].id : '');

  // Generamos las opciones para el selector de wallets
  const walletOptions = wallets.map(wallet => 
      `<option value="${wallet.id}" ${wallet.id === activeWalletId ? 'selected' : ''}>
          ${wallet.name} (${Helpers.formatCurrency(wallet.balance, wallet.currency)})
      </option>`
  ).join('');

  return {
      title: 'Gasto Rápido',
      className: 'expense-modal',
      body: `
          <form class="modal-form" id="quickExpenseForm">
              <div class="form-group">
                  <label for="quickExpenseName">Nombre del Gasto</label>
                  <input type="text" id="quickExpenseName" name="name" required placeholder="ej: Café y pastel">
              </div>
              <div class="form-group">
                  <label for="quickExpenseAmount">Monto</label>
                  <input type="number" id="quickExpenseAmount" name="amount" step="0.01" required placeholder="0.00">
              </div>
              <div class="form-group">
                  <label for="quickExpenseWallet">Pagar con</label>
                  <select id="quickExpenseWallet" name="walletId" required>
                      ${walletOptions}
                  </select>
              </div>
          </form>
      `,
      footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="quickExpenseForm">Guardar Gasto</button>
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
    ModalManager.getInstance();  
  });
  