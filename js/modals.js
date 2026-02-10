// Modal functionality
class ModalManager {
    static instance = null;

    constructor() {
        if (ModalManager.instance) {
            return ModalManager.instance;
        }

        this.modalsContainer = document.getElementById('modalsContainer');
        this.currentModal = null;
        this.escapeHandler = null;
        this.closeButtonHandler = null;
        this.overlayClickHandler = null;
        this._isOpening = false;

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
  
  // Marcar que el modal se está abriendo
  this._isOpening = true;

  // Mostrar con animación
  setTimeout(() => {
    if (this.currentModal === modal) {
      modal.classList.add('show');
    }
  }, 10);

  // Handlers de cierre - agregar después de un delay más largo para evitar que eventos
  // de click que abrieron el modal lo cierren inmediatamente
  setTimeout(() => {
    if (this.currentModal === modal) {
      this.setupCloseHandlers(modal);
      this._isOpening = false;
    }
  }, 300);

  if (modalData.onShow) modalData.onShow(modal);
  if (modalData.onOpen) modalData.onOpen(modal);
  
}

    
  
    closeModal() {
        // No cerrar si el modal se está abriendo
        if (this._isOpening) {
            return;
        }
        
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
      
      // Guardar referencias a los handlers para poder limpiarlos después
      this.closeButtonHandler = () => this.closeModal();
      this.overlayClickHandler = (e) => {
        if (e.target === overlay) {
          this.closeModal();
        }
      };
      this.escapeHandler = (e) => {
        if (e.key === 'Escape') {
          this.closeModal();
        }
      };
      
      // Agregar los listeners
      if (closeBtn) {
        closeBtn.addEventListener('click', this.closeButtonHandler);
      }
      overlay.addEventListener('click', this.overlayClickHandler);
      document.addEventListener('keydown', this.escapeHandler);
    }
  
    removeEventListeners() {
      // Remover listener de Escape
      if (this.escapeHandler) {
        document.removeEventListener('keydown', this.escapeHandler);
        this.escapeHandler = null;
      }
      
      // Remover listeners del modal actual
      if (this.currentModal) {
        const closeBtn = this.currentModal.querySelector('.modal-close');
        const overlay = this.currentModal;
        
        if (closeBtn && this.closeButtonHandler) {
          closeBtn.removeEventListener('click', this.closeButtonHandler);
        }
        
        if (overlay && this.overlayClickHandler) {
          overlay.removeEventListener('click', this.overlayClickHandler);
        }
      }
      
      // Limpiar referencias
      this.closeButtonHandler = null;
      this.overlayClickHandler = null;
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



static async editSubcategoryModal(subcategory) {
  const defaultStartDate = subcategory.startDate || Helpers.getDefaultStartDate(subcategory.frequency);
  const defaultEndDate = Helpers.getEndDate(defaultStartDate, subcategory.frequency);

  const category = AppState.categories.find(c => c.id === subcategory.categoryId);
  const expenses = await Storage.getExpenses();
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
      async function saveEdit(e) {
        e.preventDefault();
        const formData = new FormData(modal.querySelector('#editSubcategoryForm'));
        await Storage.updateSubcategory(formData.get('categoryId'), formData.get('subcategoryId'), {
          name: formData.get('name'),
          budget: parseFloat(formData.get('budget')),
          frequency: formData.get('frequency'),
          startDate: formData.get('startDate')
        });
        await AppState.refreshData();
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
          <label for="walletName">Nombre de la wallet</label>
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
          <label for="walletDescription">Descripción (opcional)</label>
          <input type="text" id="walletDescription" name="description" 
                 placeholder="ej: Gastos diarios">
        </div>
      </form>
    `,
    footer: `
      <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
      <button type="submit" class="btn-primary" form="walletForm">Crear Wallet</button>
    `,
    onShow: (modal) => {
      // Configurar la selección de monedas
      const currencyOptions = modal.querySelectorAll('.currency-option');
      const currencyInput = modal.querySelector('#walletCurrency');
      
      currencyOptions.forEach(option => {
        option.addEventListener('click', () => {
          // Remover selección previa
          currencyOptions.forEach(opt => opt.classList.remove('selected'));
          // Seleccionar la nueva opción
          option.classList.add('selected');
          
          // Actualizar el input hidden
          if (currencyInput) {
            currencyInput.value = option.dataset.currency;
          }
        });
      });
    }
  };
}

  
    static async createIncomeModal(walletId) {
      const wallet = AppState.wallets.find(acc => acc.id === walletId);
      const incomeSources = await Storage.getIncomeSources();
    
      return {
        title: 'Ingreso en ' + (wallet ? wallet.name : 'Wallet'),
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
              <label for="incomeDescription">Descripción (opcional)</label>
              <input type="text" id="incomeDescription" name="description" 
                     placeholder="ej: Sueldo de enero">
            </div>
            <div class="form-group">
              <label>Fuente del dinero</label>
              <div class="source-list" id="sourceList">
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

            <input type="hidden" name="walletId" value="${walletId}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
          <button type="submit" class="btn-primary" form="incomeForm">Agregar Ingreso</button>
        `,
        onShow: () => {
          const sourceList = document.getElementById('sourceList');
          const hiddenInput = document.getElementById('incomeSource');
          const addBtn = document.getElementById('addSourceBtn');
          const newSourceInput = document.getElementById('newSource');
    
          // Seleccionar fuente existente
          sourceList.addEventListener('click', (e) => {
            const item = e.target.closest('.source-item');
            if (!item) return;
    
            // Quitar selección previa
            sourceList.querySelectorAll('.source-item').forEach(el => el.classList.remove('selected'));
            // Marcar nuevo
            item.classList.add('selected');
            hiddenInput.value = item.dataset.source;
          });
    
          // Agregar nueva fuente
          addBtn.addEventListener('click', () => {
            const newSource = newSourceInput.value.trim();
            if (!newSource) return;
    
            // Guardar en storage
            Storage.addIncomeSource(newSource);
    
            // Crear item en la lista
            const item = document.createElement('div');
            item.className = 'source-item selected';
            item.dataset.source = newSource;
            item.textContent = newSource;
    
            // Quitar selección previa
            sourceList.querySelectorAll('.source-item').forEach(el => el.classList.remove('selected'));
            // Insertar y marcar como seleccionado
            sourceList.appendChild(item);
            hiddenInput.value = newSource;
    
            // Limpiar input
            newSourceInput.value = '';
          });
        }
      };
    }
    

  // Edit Income Modal
  static async editIncomeModal(transaction) {
    const wallet = AppState.wallets.find(w => w.id === transaction.walletId);
    const incomeSources = await Storage.getIncomeSources();
  
    return {
      title: 'Editar Ingreso en ' + (wallet ? wallet.name : 'Wallet'),
      className: 'income-modal',
      body: `
        <form class="modal-form" id="editIncomeForm">
          <div class="form-group">
            <label for="editIncomeAmount">Cantidad</label>
            <div class="input-with-currency">
              <input type="number" id="editIncomeAmount" name="amount" required 
                    placeholder="0.00" step="0.01" min="0.01" value="${Math.abs(transaction.amount)}">
              <span class="currency-display">${wallet ? wallet.currency : 'BOB'}</span>
            </div>
          </div>
                    <div class="form-group">
            <label for="editIncomeDescription">Descripción (opcional)</label>
            <input type="text" id="editIncomeDescription" name="description" 
                   placeholder="ej: Sueldo de enero" value="${transaction.description || ''}">
          </div>
          <div class="form-group">
            <label>Fuente del dinero</label>
            <div class="source-list" id="editSourceList">
              ${incomeSources.map(source => `
                <div class="source-item ${source === transaction.source ? 'selected' : ''}" data-source="${source}">${source}</div>
              `).join('')}
            </div>
            <div class="add-source-section">
              <div class="add-source-input">
                <input type="text" id="editNewSource" placeholder="Nueva fuente...">
                <button type="button" class="add-source-btn" id="editAddSourceBtn">Agregar</button>
              </div>
            </div>
            <input type="hidden" id="editIncomeSource" name="source" required value="${transaction.source || ''}">
          </div>

          
          <div class="form-group delete-expense">
            <button type="button" class="btn-text-danger"
                    onclick="window.huchasManager.handleDeleteIncome('${transaction.id}', '${transaction.walletId}')">
              🗑️ Eliminar ingreso
            </button>
          </div>
          
          <input type="hidden" name="transactionId" value="${transaction.id}">
          <input type="hidden" name="walletId" value="${transaction.walletId}">
        </form>
      `,
      footer: `
        <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
        <button type="submit" class="btn-primary" form="editIncomeForm">Guardar Cambios</button>
      `,
      onShow: () => {
        const sourceList = document.getElementById('editSourceList');
        const hiddenInput = document.getElementById('editIncomeSource');
        const addBtn = document.getElementById('editAddSourceBtn');
        const newSourceInput = document.getElementById('editNewSource');
  
        // Seleccionar fuente existente
        sourceList.addEventListener('click', (e) => {
          const item = e.target.closest('.source-item');
          if (!item) return;
  
          sourceList.querySelectorAll('.source-item').forEach(el => el.classList.remove('selected'));
          item.classList.add('selected');
          hiddenInput.value = item.dataset.source;
        });
  
        // Agregar nueva fuente
        addBtn.addEventListener('click', () => {
          const newSource = newSourceInput.value.trim();
          if (!newSource) return;
  
          Storage.addIncomeSource(newSource);
  
          const item = document.createElement('div');
          item.className = 'source-item selected';
          item.dataset.source = newSource;
          item.textContent = newSource;
  
          sourceList.querySelectorAll('.source-item').forEach(el => el.classList.remove('selected'));
          sourceList.appendChild(item);
          hiddenInput.value = newSource;
  
          newSourceInput.value = '';
        });
      }
    };
  }

  // View Transfer Modal (con opción de eliminar)
  static async viewTransferModal(transaction) {
    const transactionRepo = new TransactionRepository();
    const walletRepo = new WalletRepository();
    
    // Determinar cuál es la transacción de salida y cuál de entrada
    let transferOut, transferIn;
    
    if (transaction.type === 'transfer_out') {
      transferOut = transaction;
      // Buscar la transacción de entrada correspondiente (ID siguiente)
      const transferInId = (parseInt(transaction.id) + 1).toString();
      transferIn = await transactionRepo.getById(transferInId);
    } else {
      transferIn = transaction;
      // Buscar la transacción de salida correspondiente (ID anterior)
      const transferOutId = (parseInt(transaction.id) - 1).toString();
      transferOut = await transactionRepo.getById(transferOutId);
    }
    
    const fromWallet = await walletRepo.getById(transferOut.walletId);
    const toWallet = await walletRepo.getById(transferIn.walletId);
    
    return {
      title: 'Detalles de Transferencia',
      className: 'transfer-view-modal',
      body: `
        <div class="transfer-details">
          <div class="transfer-info-row">
            <span class="transfer-label">Desde:</span>
            <span class="transfer-value">${fromWallet ? fromWallet.name : 'Wallet eliminada'}</span>
          </div>
          <div class="transfer-info-row">
            <span class="transfer-label">Hacia:</span>
            <span class="transfer-value">${toWallet ? toWallet.name : 'Wallet eliminada'}</span>
          </div>
          <div class="transfer-info-row">
            <span class="transfer-label">Monto:</span>
            <span class="transfer-value transfer-amount">${Helpers.formatCurrency(Math.abs(transferOut.amount), fromWallet?.currency || 'BOB')}</span>
          </div>
          <div class="transfer-info-row">
            <span class="transfer-label">Fecha:</span>
            <span class="transfer-value">${Helpers.formatDate(transferOut.date)}</span>
          </div>
          ${transferOut.description ? `
          <div class="transfer-info-row">
            <span class="transfer-label">Descripción:</span>
            <span class="transfer-value">${transferOut.description}</span>
          </div>
          ` : ''}
          
          <div class="transfer-warning">
            ⚠️ Las transferencias no se pueden editar. Solo se pueden eliminar.
          </div>
          
          <div class="form-group delete-expense">
            <button type="button" class="btn-text-danger"
                    onclick="window.huchasManager.handleDeleteTransfer('${transferOut.id}', '${transferIn.id}', '${transferOut.walletId}', '${transferIn.walletId}')">
              🗑️ Eliminar transferencia
            </button>
          </div>
        </div>
      `,
      footer: `
        <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cerrar</button>
      `
    };
  }
  
    static createTransferModal(fromWalletId, toWalletId = null) {
      const wallets = AppState.wallets.filter(acc => acc.id !== fromWalletId);
      const fromWallet = AppState.wallets.find(acc => acc.id === fromWalletId);
      const toWallet = toWalletId ? AppState.wallets.find(acc => acc.id === toWalletId) : null;
  
      return {
        title: 'Transferir Dinero',
        className: 'transfer-modal',
        body: `
          <form class="modal-form" id="transferForm">
            ${toWalletId && toWallet ? `
              <div class="transfer-route">
                <div class="transfer-wallet-box">
                  <div class="transfer-wallet-label">Desde</div>
                  <div class="transfer-wallet-name">${fromWallet.name}</div>
                  <div class="transfer-wallet-balance">${Helpers.formatCurrency(fromWallet.balance, fromWallet.currency)}</div>
                </div>
                <div class="transfer-arrow">→</div>
                <div class="transfer-wallet-box">
                  <div class="transfer-wallet-label">Hacia</div>
                  <div class="transfer-wallet-name">${toWallet.name}</div>
                  <div class="transfer-wallet-balance">${Helpers.formatCurrency(toWallet.balance, toWallet.currency)}</div>
                </div>
                <input type="hidden" name="toWalletId" value="${toWalletId}">
              </div>
            ` : `
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
            `}
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


    static async editWalletModal(wallet) {
      // Obtener transacciones de IndexedDB
      const transactionRepo = new TransactionRepository();
      const allTransactions = await transactionRepo.getAll();
      const walletTransactions = (allTransactions || [])
        .filter(t => t.walletId === wallet.id);
    
      return {
        title: `Editar Wallet`,
        className: 'edit-wallet-modal',
        body: `
          <form class="modal-form" id="editWalletForm">
            <!-- Sección edición -->
            <div id="editWalletSection">
              <div class="wallet-summary">
                <div class="wallet-balance">
                  <span class="balance-label">Saldo actual:</span>
                  <span class="balance-value">${Helpers.formatCurrency(wallet.balance, wallet.currency)}</span>
                </div>
              </div>
    
              <div class="form-group">
                <label for="walletName">Nombre de la wallet:</label>
                <input type="text" 
                       id="walletName" 
                       name="name" 
                       value="${wallet.name}" 
                       required 
                       maxlength="50"
                       class="form-input">
              </div>
    
              <div class="form-group">
                <label for="walletDescription">Descripción:</label>
                <textarea id="walletDescription" 
                          name="description" 
                          maxlength="200"
                          class="form-input"
                          rows="3"
                          placeholder="Ej: Ahorros para vacaciones...">${wallet.description || ''}</textarea>
              </div>
    
              <div class="form-group delete-wallet">
                <button type="button" class="btn-text-danger" id="triggerDeleteWalletBtn">
                  🗑️ Eliminar wallet
                </button>
              </div>
            </div>
    
            <!-- Sección eliminación -->
            <div id="deleteWalletSection" style="display: none; margin-top: 1rem;">
              ${walletTransactions.length ? `
                <p>La wallet <strong>${wallet.name}</strong> contiene ${walletTransactions.length} transacciones.</p>
                <div class="delete-options">
                  <div class="delete-option card-option" data-option="delete">
                    <h4>🗑️ Eliminar todo</h4>
                    <p>Se eliminarán la wallet y todas sus transacciones.</p>
                  </div>
                </div>
              ` : ` 
                <p>¿Deseas eliminar la wallet <strong>${wallet.name}</strong>?</p>
              `}
            </div>
    
            <input type="hidden" name="walletId" value="${wallet.id}">
          </form>
        `,
        footer: `
          <button type="button" class="btn-secondary" id="walletCancelBtn">Cancelar</button>
          <button type="submit" class="btn-primary" form="editWalletForm" id="walletSaveBtn">Guardar</button>
          <button type="button" class="btn-danger" id="walletDeleteBtn" style="display: none;">Eliminar</button>
        `,
        onShow: async (modal) => {
          const editSection = modal.querySelector('#editWalletSection');
          const deleteSection = modal.querySelector('#deleteWalletSection');
          const modalTitle = modal.querySelector('.modal-title');
          const form = modal.querySelector('#editWalletForm');
          const walletNameInput = modal.querySelector('#walletName');
          const walletDescInput = modal.querySelector('#walletDescription');
          const cancelBtn = modal.querySelector('#walletCancelBtn');
          const saveBtn = modal.querySelector('#walletSaveBtn');
          const deleteBtn = modal.querySelector('#walletDeleteBtn');
          const triggerDeleteBtn = modal.querySelector('#walletTriggerDeleteBtn');
        
          // Cancelar → cerrar modal
          cancelBtn.onclick = () => window.appEvents.emit('closeModal');
    
          // Enfocar el input del nombre
          walletNameInput.focus();
          walletNameInput.select();
        
          // Guardar cambios
          form.onsubmit = async (e) => {
            e.preventDefault();
            
            const newName = walletNameInput.value.trim();
            const newDesc = walletDescInput.value.trim();
    
            if (!newName) {
              Helpers.showToast('El nombre no puede estar vacío', 'error');
              return;
            }
    
            // Actualizar wallet
            const success = await Storage.updateWallet(wallet.id, { 
              name: newName,
              description: newDesc 
            });
            
            if (success) {
              await AppState.refreshData();
              Helpers.showToast('Wallet actualizada', 'success');
              window.appEvents.emit('closeModal');
              window.appEvents.emit('dataUpdated');
            } else {
              Helpers.showToast('Error al actualizar la wallet', 'error');
            }
          };
        
          // Activar modo eliminación
          triggerDeleteBtn.onclick = () => {
            editSection.style.display = 'none';
            deleteSection.style.display = 'block';
            saveBtn.style.display = 'none';
            deleteBtn.style.display = 'inline-block';
            modalTitle.textContent = 'Eliminar Wallet';
          };
    
          // Confirmar eliminación
          deleteBtn.onclick = async (e) => {
            e.preventDefault();
      
            await Storage.deleteWallet(wallet.id);
            await AppState.refreshData();
            Helpers.showToast('Wallet eliminada', 'success');
            window.appEvents.emit('closeModal');
            window.appEvents.emit('dataUpdated');
          };
        }
      };
    }
    
    

    static async walletTransactionsModal(wallet) {
      // Obtener transacciones de IndexedDB (usar el mismo método que en últimos movimientos)
      const transactionRepo = new TransactionRepository();
      const transactions = await transactionRepo.getByWalletId(wallet.id) || [];
      
      const walletTransactions = transactions
        .sort((a, b) => {
          // Ordenar por createdAt (timestamp completo) para obtener el orden exacto de creación
          // Si no existe createdAt, extraer el timestamp del id
          const getTimestamp = (tx) => {
            if (tx.createdAt) return new Date(tx.createdAt).getTime();
            // Extraer timestamp del id (ej: "exp-1764687387892" -> 1764687387892)
            const match = tx.id.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          
          const timeA = getTimestamp(a);
          const timeB = getTimestamp(b);
          return timeB - timeA; // Orden descendente (más reciente primero)
        });

      // Función interna para etiquetas de tipo de transacción
      const getTransactionTypeLabel = (type) => {
        const labels = {
          'income': 'Ingreso',
          'expense': 'Gasto',
          'transfer_in': 'Transf. recibida',
          'transfer_out': 'Transf. enviada'
        };
        return labels[type] || type;
      };

      // Agrupar transacciones por fecha específica
      const groupedTransactions = {};
      walletTransactions.forEach(tx => {
        // Parsear fecha en hora local para evitar problemas de zona horaria
        const parts = tx.date.slice(0, 10).split('-');
        const date = new Date(parts[0], parts[1] - 1, parts[2]);
        const dateKey = tx.date.slice(0, 10); // YYYY-MM-DD
        const dateName = date.toLocaleDateString('es-ES', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        if (!groupedTransactions[dateKey]) {
          groupedTransactions[dateKey] = {
            name: dateName,
            transactions: []
          };
        }
        groupedTransactions[dateKey].transactions.push(tx);
      });
      
      // Ordenar transacciones dentro de cada grupo por createdAt/id
      Object.keys(groupedTransactions).forEach(dateKey => {
        groupedTransactions[dateKey].transactions.sort((a, b) => {
          const getTimestamp = (tx) => {
            if (tx.createdAt) return new Date(tx.createdAt).getTime();
            const match = tx.id.match(/(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          };
          const timeA = getTimestamp(a);
          const timeB = getTimestamp(b);
          return timeB - timeA;
        });
      });
      
      // Preparar datos para scroll infinito
      const sortedDateKeys = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));
      let currentIndex = 0;
      const ITEMS_PER_LOAD = 20;

      // Función para renderizar un grupo de transacciones
      const renderTransactionGroup = (dateKey) => {
        const group = groupedTransactions[dateKey];
        return `
          <div class="transaction-date-group">
            <div class="date-header">
              <span class="date-label">${group.name}</span>
            </div>
            <div class="date-transactions">
              ${group.transactions.map(tx => {
                return `
                  <div class="transaction-item-modal ${tx.type}" data-transaction-id="${tx.id}">
                    <div class="transaction-info">
                      <div class="transaction-type">${getTransactionTypeLabel(tx.type)}</div>
                      ${tx.description ? `<div class="transaction-description">${tx.description}</div>` : ''}
                    </div>
                    <div class="transaction-meta">
                      ${tx.source ? tx.source : (tx.categoryName ? tx.categoryName : '')}
                    </div>
                    <div class="transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}">
                      ${tx.amount > 0 ? '+' : ''}${Helpers.formatCurrency(Math.abs(tx.amount), wallet.currency)}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      };

      return {
        title: `Transacciones - ${wallet.name}`,
        className: 'wallet-transactions-modal',
        body: `
          <div class="wallet-transactions-content">
            <div class="wallet-summary">
              <span class="wallet-balance">
                Saldo: ${Helpers.formatCurrency(wallet.balance, wallet.currency)}
              </span>
              <span class="transactions-count">
                Transacciones: ${walletTransactions.length} 
              </span>
            </div>

            <div class="transactions-list" id="transactionsList">
              ${walletTransactions.length === 0 ? `
                <div class="empty-transactions">
                  <div class="empty-icon">📊</div>
                  <h3>No hay transacciones</h3>
                  <p>Esta wallet no tiene movimientos registrados</p>
                </div>
              ` : ''}
            </div>
            <div class="loading-indicator" id="loadingIndicator" style="display: none;">
              <div class="spinner"></div>
              <span>Cargando más transacciones...</span>
            </div>
          </div>
        `,
        footer: `
          <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cerrar</button>
        `,
        onShow: (modal) => {
          if (walletTransactions.length === 0) return;
          
          const transactionsList = modal.querySelector('#transactionsList');
          const loadingIndicator = modal.querySelector('#loadingIndicator');
          
          // Función para cargar más transacciones
          const loadMoreTransactions = () => {
            if (sortedDateKeys.length === 0) {
              console.log('No hay más grupos para cargar');
              return false;
            }
            
            let itemsLoaded = 0;
            const groupsToLoad = [];
            
            // Cargar grupos completos hasta alcanzar aproximadamente ITEMS_PER_LOAD
            while (sortedDateKeys.length > 0 && itemsLoaded < ITEMS_PER_LOAD) {
              const dateKey = sortedDateKeys[0];
              const groupSize = groupedTransactions[dateKey].transactions.length;
              
              groupsToLoad.push(dateKey);
              itemsLoaded += groupSize;
              
              // Remover el grupo de la lista
              sortedDateKeys.shift();
            }
            
            console.log(`Cargando ${groupsToLoad.length} grupos con ${itemsLoaded} transacciones. Quedan ${sortedDateKeys.length} grupos`);
            
            // Renderizar todos los grupos seleccionados
            groupsToLoad.forEach(dateKey => {
              const groupHTML = renderTransactionGroup(dateKey);
              transactionsList.insertAdjacentHTML('beforeend', groupHTML);
              currentIndex += groupedTransactions[dateKey].transactions.length;
            });
            
            // Agregar event listeners a las nuevas transacciones
            modal.querySelectorAll('.transaction-item-modal').forEach(el => {
              if (!el.dataset.listenerAdded) {
                el.dataset.listenerAdded = 'true';
                el.addEventListener('click', async () => {
                  const txId = el.dataset.transactionId;
                  const tx = walletTransactions.find(t => t.id === txId);
                  if (tx) {
                    // Abrir modal de edición según el tipo de transacción
                    if (tx.type === 'expense') {
                      // Para gastos, extraer expenseId del transaction.id (formato: 'exp-12345')
                      const expenseId = tx.id.replace('exp-', '');
                      const expenseRepo = new ExpenseRepository();
                      const expense = await expenseRepo.getById(expenseId);
                      
                      if (expense) {
                        window.appEvents.emit('closeModal'); // Cerrar modal de transacciones
                        setTimeout(() => {
                          const walletTx = AppState.wallets.find(w => w.id === expense.walletId);
                          const currency = walletTx ? walletTx.currency : 'BOB';
                          const isUnclassified = !expense.categoryId || expense.categoryId === 'unclassified';
                          
                          const modalData = isUnclassified
                            ? ModalManager.editExpenseModalUnclassified(expense, currency)
                            : ModalManager.editExpenseModalClassified(expense, currency);
                          
                          window.appEvents.emit('openModal', modalData);
                          
                          // Si es gasto sin clasificar, llenar el dropdown de categorías
                          if (isUnclassified && window.gastosManager) {
                            setTimeout(() => {
                              window.gastosManager.fillSubcategorySelect();
                              
                              const cancelBtn = document.getElementById('cancelButton');
                              if (cancelBtn) {
                                cancelBtn.addEventListener('click', () => window.appEvents.emit('closeModal'));
                              }
                            }, 50);
                          }
                        }, 300);
                      } else {
                        Helpers.showToast('No se pudo encontrar el gasto', 'error');
                      }
                    } else if (tx.type === 'income') {
                      // Abrir modal de edición de ingreso
                      window.appEvents.emit('closeModal');
                      setTimeout(async () => {
                        const modalData = await ModalManager.editIncomeModal(tx);
                        window.appEvents.emit('openModal', modalData);
                      }, 300);
                    } else if (tx.type === 'transfer_in' || tx.type === 'transfer_out') {
                      // Para transferencias, abrir modal de visualización con opción de eliminar
                      window.appEvents.emit('closeModal');
                      setTimeout(async () => {
                        const modalData = await ModalManager.viewTransferModal(tx);
                        window.appEvents.emit('openModal', modalData);
                      }, 300);
                    }
                  }
                });
              }
            });
            
            return sortedDateKeys.length > 0;
          };
          
          // Cargar primeras transacciones
          loadMoreTransactions();
          
          // Detectar scroll para cargar más
          const modalContent = modal.querySelector('.wallet-transactions-content');
          let isLoading = false;
          
          console.log('📜 Configurando scroll listener. Dimensiones iniciales:', {
            scrollHeight: transactionsList.scrollHeight,
            clientHeight: transactionsList.clientHeight,
            hasScroll: transactionsList.scrollHeight > transactionsList.clientHeight
          });
          
          let lastScrollTop = 0;
          let allLoaded = false;
          
          transactionsList.addEventListener('scroll', (e) => {
            const scrollTop = transactionsList.scrollTop;
            const scrollHeight = transactionsList.scrollHeight;
            const clientHeight = transactionsList.clientHeight;
            const scrollPercentage = ((scrollTop + clientHeight) / scrollHeight) * 100;
            
            // Detectar dirección del scroll
            const scrollingDown = scrollTop > lastScrollTop;
            lastScrollTop = scrollTop;
            
            // Si hace scroll hacia arriba y ya se cargó todo, ocultar el mensaje
            if (!scrollingDown && allLoaded && scrollPercentage < 95) {
              loadingIndicator.style.display = 'none';
            }
            
            console.log('📜 Scroll event:', {
              scrollTop,
              scrollHeight,
              clientHeight,
              scrollPercentage: scrollPercentage.toFixed(1) + '%',
              gruposRestantes: sortedDateKeys.length,
              isLoading,
              scrollingDown
            });
            
            // Cargar más cuando esté al 80% del scroll y vaya hacia abajo
            if (scrollPercentage >= 80 && !isLoading && sortedDateKeys.length > 0 && scrollingDown) {
              console.log(`✅ Scroll al ${scrollPercentage.toFixed(1)}% - Cargando más transacciones...`);
              isLoading = true;
              loadingIndicator.style.display = 'flex';
              
              setTimeout(() => {
                const hasMore = loadMoreTransactions();
                loadingIndicator.style.display = 'none';
                isLoading = false;
                
                if (!hasMore) {
                  console.log('No hay más transacciones para cargar');
                  allLoaded = true;
                  loadingIndicator.innerHTML = '<span style="color: var(--text-light); font-size: 12px;">No hay más transacciones</span>';
                  loadingIndicator.style.display = 'flex';
                }
              }, 300);
            }
          });
        }
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
  const activeWalletId = AppState.selectedWallet ? AppState.selectedWallet.id : (wallets.length > 0 ? wallets[0].id : '');
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

  // ============================================
  // SCHEDULED PAYMENTS MODALS
  // ============================================

  static createScheduledPaymentModal() {
    const wallets = AppState.wallets;
    const categories = AppState.categories;
    
    const walletOptions = wallets.map(w => 
      `<option value="${w.id}">${w.name} (${Helpers.formatCurrency(w.balance, w.currency)})</option>`
    ).join('');
    
    const subcategoryOptions = categories.map(cat => {
      if (!cat.subcategories || cat.subcategories.length === 0) return '';
      const opts = cat.subcategories.map(sub => 
        `<option value="${sub.id}">${cat.name} → ${sub.name}</option>`
      ).join('');
      return opts;
    }).join('');

    const today = new Date().toISOString().split('T')[0];

    return {
      title: 'Programar Pago',
      className: 'payment-modal',
      body: `
        <form class="modal-form" id="scheduledPaymentForm">
          <div class="form-group">
            <label for="paymentName">Nombre del Pago</label>
            <input type="text" id="paymentName" name="name" required placeholder="ej: Netflix, Alquiler, Luz">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="paymentAmount">Monto</label>
              <input type="number" id="paymentAmount" name="amount" step="0.01" required placeholder="0.00">
            </div>
            <div class="form-group">
              <label for="paymentDate">Fecha de Vencimiento</label>
              <input type="date" id="paymentDate" name="dueDate" required value="${today}">
            </div>
          </div>

          <div class="form-group">
            <label for="paymentWallet">Pagar con Wallet</label>
            <select id="paymentWallet" name="walletId" required>
              ${walletOptions}
            </select>
          </div>

          <div class="form-group">
            <label for="paymentSubcategory">Categoría / Subcategoría</label>
            <select id="paymentSubcategory" name="subcategoryId" required>
              <option value="">-- Selecciona --</option>
              ${subcategoryOptions}
            </select>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" id="paymentRecurring" name="isRecurring" value="true">
              Pago Recurrente
            </label>
          </div>

          <div id="recurrenceOptions" style="display: none;">
            <div class="form-group">
              <label for="paymentRecurrence">Frecuencia</label>
              <select id="paymentRecurrence" name="recurrence">
                <option value="weekly">Semanal</option>
                <option value="biweekly">Quincenal</option>
                <option value="monthly" selected>Mensual</option>
                <option value="quarterly">Trimestral</option>
                <option value="yearly">Anual</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="paymentNotify">Notificar con X días de anticipación</label>
            <input type="number" id="paymentNotify" name="notifyDaysBefore" value="3" min="0" max="30">
          </div>

          <div class="form-group">
            <label for="paymentNotes">Notas (opcional)</label>
            <textarea id="paymentNotes" name="notes" rows="2" placeholder="Información adicional..."></textarea>
          </div>
        </form>
      `,
      footer: `
        <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
        <button type="submit" class="btn-primary" form="scheduledPaymentForm">Programar</button>
      `,
      onShow: (modal) => {
        const recurringCheckbox = modal.querySelector('#paymentRecurring');
        const recurrenceOptions = modal.querySelector('#recurrenceOptions');
        
        recurringCheckbox.addEventListener('change', (e) => {
          recurrenceOptions.style.display = e.target.checked ? 'block' : 'none';
        });
      }
    };
  }

  static editScheduledPaymentModal(payment) {
    const wallets = AppState.wallets;
    const categories = AppState.categories;
    
    const walletOptions = wallets.map(w => 
      `<option value="${w.id}" ${w.id === payment.walletId ? 'selected' : ''}>
        ${w.name} (${Helpers.formatCurrency(w.balance, w.currency)})
      </option>`
    ).join('');
    
    const subcategoryOptions = categories.map(cat => {
      if (!cat.subcategories || cat.subcategories.length === 0) return '';
      const opts = cat.subcategories.map(sub => 
        `<option value="${sub.id}" ${sub.id === payment.subcategoryId ? 'selected' : ''}>
          ${cat.name} → ${sub.name}
        </option>`
      ).join('');
      return opts;
    }).join('');

    return {
      title: 'Editar Pago Programado',
      className: 'payment-modal',
      body: `
        <form class="modal-form" id="editScheduledPaymentForm">
          <input type="hidden" name="paymentId" value="${payment.id}">
          
          <div class="form-group">
            <label for="editPaymentName">Nombre del Pago</label>
            <input type="text" id="editPaymentName" name="name" required value="${payment.name}">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="editPaymentAmount">Monto</label>
              <input type="number" id="editPaymentAmount" name="amount" step="0.01" required value="${payment.amount}">
            </div>
            <div class="form-group">
              <label for="editPaymentDate">Fecha de Vencimiento</label>
              <input type="date" id="editPaymentDate" name="dueDate" required value="${payment.dueDate}">
            </div>
          </div>

          <div class="form-group">
            <label for="editPaymentWallet">Pagar con Wallet</label>
            <select id="editPaymentWallet" name="walletId" required>
              ${walletOptions}
            </select>
          </div>

          <div class="form-group">
            <label for="editPaymentSubcategory">Categoría / Subcategoría</label>
            <select id="editPaymentSubcategory" name="subcategoryId" required>
              ${subcategoryOptions}
            </select>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" id="editPaymentRecurring" name="isRecurring" value="true" ${payment.isRecurring ? 'checked' : ''}>
              Pago Recurrente
            </label>
          </div>

          <div id="editRecurrenceOptions" style="display: ${payment.isRecurring ? 'block' : 'none'};">
            <div class="form-group">
              <label for="editPaymentRecurrence">Frecuencia</label>
              <select id="editPaymentRecurrence" name="recurrence">
                <option value="weekly" ${payment.recurrence === 'weekly' ? 'selected' : ''}>Semanal</option>
                <option value="biweekly" ${payment.recurrence === 'biweekly' ? 'selected' : ''}>Quincenal</option>
                <option value="monthly" ${payment.recurrence === 'monthly' ? 'selected' : ''}>Mensual</option>
                <option value="quarterly" ${payment.recurrence === 'quarterly' ? 'selected' : ''}>Trimestral</option>
                <option value="yearly" ${payment.recurrence === 'yearly' ? 'selected' : ''}>Anual</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label for="editPaymentNotify">Notificar con X días de anticipación</label>
            <input type="number" id="editPaymentNotify" name="notifyDaysBefore" value="${payment.notifyDaysBefore || 3}" min="0" max="30">
          </div>

          <div class="form-group">
            <label for="editPaymentNotes">Notas</label>
            <textarea id="editPaymentNotes" name="notes" rows="2">${payment.notes || ''}</textarea>
          </div>

          <div class="form-group danger-zone">
            <button type="button" class="btn-text-danger" id="triggerDeletePaymentBtn">🗑️ Eliminar pago programado</button>
          </div>

          <!-- Sección de eliminación -->
          <div id="deletePaymentSection" style="display: none; margin-top: 1rem;">
            ${payment.isRecurring ? `
              <p style="margin-bottom: 1rem;">¿Qué deseas hacer con este pago recurrente?</p>
              <div class="delete-options">
                <div class="delete-option" data-delete-option="skip">
                  <h4>⏭️ Omitir esta ocurrencia</h4>
                  <p>Se saltará el pago actual y se programará automáticamente la siguiente fecha.</p>
                </div>
                <div class="delete-option" data-delete-option="end">
                  <h4>🛑 Finalizar pago recurrente</h4>
                  <p>Se cancelará este pago y no se generarán más ocurrencias futuras.</p>
                </div>
              </div>
            ` : `
              <p style="margin-bottom: 1rem;">¿Estás seguro de que deseas eliminar este pago programado?</p>
              <div class="delete-options">
                <div class="delete-option selected" data-delete-option="delete">
                  <h4>🗑️ Eliminar pago</h4>
                  <p>El pago programado será eliminado permanentemente.</p>
                </div>
              </div>
            `}
          </div>
        </form>
      `,
      footer: `
        <button type="button" class="btn-secondary" id="editPaymentCancelBtn">Cancelar</button>
        <button type="submit" class="btn-primary" id="editPaymentSubmitBtn" form="editScheduledPaymentForm">Guardar Cambios</button>
      `,
      onShow: async (modal) => {
        const recurringCheckbox = modal.querySelector('#editPaymentRecurring');
        const recurrenceOptions = modal.querySelector('#editRecurrenceOptions');
        const editForm = modal.querySelector('#editScheduledPaymentForm');
        const deleteSection = modal.querySelector('#deletePaymentSection');
        const triggerDeleteBtn = modal.querySelector('#triggerDeletePaymentBtn');
        const cancelBtn = modal.querySelector('#editPaymentCancelBtn');
        const submitBtn = modal.querySelector('#editPaymentSubmitBtn');
        const modalTitle = modal.querySelector('.modal-title');
        
        let isDeleteMode = false;
        let selectedDeleteOption = payment.isRecurring ? null : 'delete';
        
        recurringCheckbox.addEventListener('change', (e) => {
          recurrenceOptions.style.display = e.target.checked ? 'block' : 'none';
        });

        // Cancelar: volver a modo edición o cerrar modal
        cancelBtn.addEventListener('click', () => {
          if (isDeleteMode) {
            // Volver a modo edición
            isDeleteMode = false;
            deleteSection.style.display = 'none';
            triggerDeleteBtn.style.display = 'block';
            modalTitle.textContent = 'Editar Pago Programado';
            submitBtn.textContent = 'Guardar Cambios';
            submitBtn.classList.remove('btn-danger');
            submitBtn.classList.add('btn-primary');
            selectedDeleteOption = payment.isRecurring ? null : 'delete';
            modal.querySelectorAll('.delete-option').forEach(o => o.classList.remove('selected'));
            if (!payment.isRecurring) {
              modal.querySelector('[data-delete-option="delete"]')?.classList.add('selected');
            }
          } else {
            window.appEvents.emit('closeModal');
          }
        });

        // Activar modo eliminación
        triggerDeleteBtn.addEventListener('click', () => {
          isDeleteMode = true;
          deleteSection.style.display = 'block';
          triggerDeleteBtn.style.display = 'none';
          modalTitle.textContent = 'Eliminar Pago Programado';
          submitBtn.textContent = payment.isRecurring ? 'Confirmar' : 'Eliminar';
          submitBtn.classList.remove('btn-primary');
          submitBtn.classList.add('btn-danger');
        });

        // Selección de opción de eliminación
        const deleteOptions = modal.querySelectorAll('.delete-option');
        deleteOptions.forEach(opt => {
          opt.addEventListener('click', () => {
            deleteOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedDeleteOption = opt.dataset.deleteOption;
          });
        });

        // Manejar submit del formulario
        editForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          if (isDeleteMode) {
            // Modo eliminación
            if (!selectedDeleteOption) {
              Helpers.showToast('Selecciona una opción para continuar', 'error');
              return;
            }

            const repo = new ScheduledPaymentRepository();
            
            if (selectedDeleteOption === 'skip') {
              // Omitir esta ocurrencia (saltar a la siguiente)
              await repo.skipPayment(payment.id, 'Omitido por el usuario');
              Helpers.showToast('Ocurrencia omitida, próxima fecha programada', 'success');
            } else if (selectedDeleteOption === 'end') {
              // Finalizar pago recurrente
              await repo.cancelPayment(payment.id);
              Helpers.showToast('Pago recurrente finalizado', 'success');
            } else if (selectedDeleteOption === 'delete') {
              // Eliminar pago no recurrente
              await repo.delete(payment.id);
              Helpers.showToast('Pago programado eliminado', 'success');
            }
            
            window.appEvents.emit('closeModal');
            window.appEvents.emit('dataUpdated');
          } else {
            // Modo edición normal - dejar que el handler existente lo maneje
            const formData = new FormData(editForm);
            const paymentId = formData.get('paymentId');
            
            const updatedData = {
              name: Helpers.sanitizeInput(formData.get('name')),
              amount: parseFloat(formData.get('amount')),
              dueDate: formData.get('dueDate'),
              walletId: formData.get('walletId'),
              subcategoryId: formData.get('subcategoryId'),
              isRecurring: formData.get('isRecurring') === 'true',
              recurrence: formData.get('recurrence') || 'monthly',
              notifyDaysBefore: parseInt(formData.get('notifyDaysBefore')) || 3,
              notes: Helpers.sanitizeInput(formData.get('notes') || '')
            };

            const category = AppState.categories.find(cat =>
              cat.subcategories.some(sub => sub.id === updatedData.subcategoryId)
            );
            
            if (category) {
              updatedData.categoryId = category.id;
            }

            const repo = new ScheduledPaymentRepository();
            const existingPayment = await repo.getById(paymentId);
            if (!existingPayment) {
              Helpers.showToast('Pago no encontrado', 'error');
              return;
            }

            Object.assign(existingPayment, updatedData);
            
            const success = await repo.update(existingPayment);
            if (success) {
              Helpers.showToast('Pago actualizado exitosamente', 'success');
              window.appEvents.emit('closeModal');
              window.appEvents.emit('dataUpdated');
            } else {
              Helpers.showToast('Error al actualizar el pago', 'error');
            }
          }
        });
      }
    };
  }

  static executePaymentModal(payment) {
    const wallets = AppState.wallets;
    const currentWallet = wallets.find(w => w.id === payment.walletId);
    const currency = currentWallet ? currentWallet.currency : 'BOB';
    const today = new Date().toISOString().split('T')[0];

    const walletOptions = wallets.map(w => 
      `<option value="${w.id}" ${w.id === payment.walletId ? 'selected' : ''}>
        ${w.name} (${Helpers.formatCurrency(w.balance, w.currency)})
      </option>`
    ).join('');

    return {
      title: 'Registrar Pago',
      className: 'payment-modal',
      body: `
        <form class="modal-form" id="executePaymentForm">
          <input type="hidden" name="paymentId" value="${payment.id}">
          <input type="hidden" name="action" value="pay">
          
          <div class="payment-info-box">
            <div class="payment-info-simple">
              <div class="payment-info-name">${payment.name}</div>
              <div class="payment-info-amount">${Helpers.formatCurrency(payment.amount, currency)}</div>
            </div>
            <div class="payment-info-due">
              Vence: ${Helpers.formatDate(payment.dueDate)}
            </div>
          </div>

          <div class="form-group">
            <label for="paymentWallet">Pagar con Wallet</label>
            <select id="paymentWallet" name="walletId" required>
              ${walletOptions}
            </select>
          </div>

          <div class="form-group">
            <label for="actualPaymentDate">Fecha del pago</label>
            <input type="date" id="actualPaymentDate" name="actualDate" value="${today}" required>
          </div>
        </form>
      `,
      footer: `
        <button type="button" class="btn-secondary" onclick="window.appEvents.emit('closeModal')">Cancelar</button>
        <button type="submit" class="btn-primary" form="executePaymentForm">Registrar Pago</button>
      `
    };
  }


  static getRecurrenceText(recurrence) {
    const texts = {
      'weekly': 'Semanal',
      'biweekly': 'Quincenal',
      'monthly': 'Mensual',
      'quarterly': 'Trimestral',
      'yearly': 'Anual',
      'custom': 'Personalizado'
    };
    return texts[recurrence] || 'Una vez';
  }

    static getTransactionTypeLabel(type) {
      const labels = {
        'income': 'Ingreso',
        'expense': 'Gasto',
        'transfer_in': 'Transf. recibida',
        'transfer_out': 'Transf. enviada'
      };
      return labels[type] || type;
    }
  }
  
  // Initialize modal manager when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    ModalManager.getInstance();  
  });
  