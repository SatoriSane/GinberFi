// Gastos tab functionality
class GastosManager {
  constructor() {
    this.categoriesContainer = document.getElementById('categoriesContainer');
    this.emptyCategoriesState = document.getElementById('emptyCategoriesState');
    this.addCategoryBtn = document.getElementById('addCategoryBtn');
    this.addCategoryListBtn = document.getElementById('addCategoryListBtn');

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupGlobalClickListener();
    
    // Render initially (will show empty state if no data yet)
    this.render();
    
    // Listen for app initialization
    window.appEvents.on('appInitialized', () => {
      this.checkAndResetBudgets();
      this.render();
    });
    
    // Listen for data updates
    window.appEvents.on('dataUpdated', () => {
      this.checkAndResetBudgets();
      this.render();
    });
    
    // Listen for tab changes
    window.appEvents.on('tabChanged', (tabName) => {
      if (tabName === 'gastos') {
        this.checkAndResetBudgets();
        this.render();
      }
    });
  }
  
  setupEventListeners() {
    // Hacemos la instancia accesible globalmente para los onclick de los modales
    window.gastosManager = this;

    // El botón del estado vacío abre el modal de crear categoría
    this.addCategoryBtn.addEventListener('click', () => {
      this.openCreateCategoryModal();
    });

    // El botón "+ Añadir Categoría" abre el modal de creación
    this.addCategoryListBtn.addEventListener('click', () => {
        this.openCreateCategoryModal();
    });

    // Handle form submissions
    document.addEventListener('submit', async (e) => {
      e.preventDefault(); 
      const form = e.target;

      switch (form.id) {
        case 'categoryForm':
          await this.handleCreateCategory(form);
          break;
        case 'subcategoryForm':
          await this.handleCreateSubcategory(form);
          break;
        case 'editCategoryForm': {
          const formData = new FormData(form);
          const categoryId = formData.get('categoryId'); 
          await this.handleEditCategory(form, categoryId);
          break;
        }
        case 'editSubcategoryForm': {
          const formData = new FormData(form);
          const categoryId = formData.get('categoryId');        
          const subcategoryId = formData.get('subcategoryId');  
          await this.handleEditSubcategory(form, categoryId, subcategoryId);
          break;
        }
        case 'editExpenseForm':
          await this.handleEditExpense(form);
          break;
        case 'expenseForm':
          await this.handleCreateExpense(form);
          break;
        // 🚀 NUEVO: Manejador para el formulario de gasto rápido
        case 'quickExpenseForm':
          await this.handleCreateQuickExpense(form);
          window.appEvents.emit('closeModal'); // 🔥 cerrar modal después de guardar
          break;
        default:
          console.warn('Formulario no manejado:', form.id);
      }
    });

    document.getElementById('subcategoryFrequency')?.addEventListener('change', (e) => {
      const freq = e.target.value;
      const startDateInput = document.getElementById('subcategoryStartDate');
      if (startDateInput) {
        startDateInput.value = Helpers.getDefaultStartDate(freq);
      }
    });
  }

  // ---------------------------------------
  // --- Renderizado de categorías/subcategorías---
  // ---------------------------------------

  render() {
    const categories = AppState.categories;
    // 🚀 NUEVO: Obtenemos los gastos sin clasificar
    const unclassifiedExpenses = AppState.expenses.filter(e => e.categoryId === 'unclassified');

    if (categories.length === 0 && unclassifiedExpenses.length === 0) {
        this.categoriesContainer.innerHTML = '';
        this.categoriesContainer.appendChild(this.emptyCategoriesState);
        this.emptyCategoriesState.style.display = 'block';
        this.addCategoryListBtn.style.display = 'none';
    } else {
        this.emptyCategoriesState.style.display = 'none';
        this.addCategoryListBtn.style.display = 'block';

        let finalHtml = '';
        if (unclassifiedExpenses.length > 0) {
            finalHtml += this.renderUnclassifiedCategory(unclassifiedExpenses);
        }
        if (categories.length > 0) {
            finalHtml += this.renderCategories(categories);
        }
        
        // Agregar el estado vacío al final del HTML
        finalHtml += this.emptyCategoriesState.outerHTML;
        
        // Reemplazar todo el contenido
        this.categoriesContainer.innerHTML = finalHtml;
        
        // Recuperar la referencia al estado vacío
        this.emptyCategoriesState = this.categoriesContainer.querySelector('#emptyCategoriesState');
        
        console.log('HTML insertado, adjuntando event listeners...');
        this.attachCategoryEventListeners();
    }
  }

  renderCategories(categories) {
    const expenses = AppState.expenses;
    // ✅ CAMBIO: La función ahora devuelve el string HTML en lugar de modificar el DOM directamente
    return categories.map(category => {
      const available = this.getCategoryBudget(category); // Ya es la suma de presupuestos disponibles
      const totalSpent = this.getCategorySpent(category.id, expenses);
      
      // Calcular el presupuesto total original de todas las subcategorías
      const totalBudget = category.subcategories.reduce((sum, sub) => sum + (sub.budget || 0), 0);
      const percentage = Helpers.calculateProgress(totalSpent, totalBudget);
      const budgetColors = ThemeManager.getBudgetColors(percentage);

      return `
        <div class="category-wrapper ${category.expanded ? 'expanded' : ''}" data-category-id="${category.id}">
          <div class="category-content" data-toggle="category" style="background-color: ${budgetColors.background}; border-color: ${budgetColors.border};">
            <div class="category-arrow">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span class="category-name">${category.name}</span>
            <div class="category-budget">
              <div class="budget-amount">${Helpers.formatCurrency(available)}</div>
              <div class="budget-percentage">(${(100 - percentage).toFixed(1)}%)</div>
            </div>
            <button class="add-subcategory-btn"
                    data-category-id="${category.id}"
                    data-category-name="${category.name}"
                    aria-label="Añadir subcategoría"
                    title="Añadir subcategoría">+</button>
            <button class="edit-category-btn"
                    data-category-id="${category.id}"
                    aria-label="Editar categoría"
                    title="Editar categoría">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          ${category.expanded ? this.renderSubcategories(category, expenses) : ''}
        </div>
      `;
    }).join('');
  }

  // 🚀 NUEVO: Función para renderizar la pseudo-categoría de gastos sin clasificar
  renderUnclassifiedCategory(unclassifiedExpenses) {
    const totalSpent = unclassifiedExpenses.reduce((sum, e) => sum + e.amount, 0);
    // Ordenamos los gastos del más reciente al más antiguo
    const sortedExpenses = [...unclassifiedExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));

    return `
      <div class="category-wrapper expanded unclassified-category">
        <div class="category-content" style="background-color: ${ThemeManager.getUnclassifiedColors().background}; border-color: ${ThemeManager.getUnclassifiedColors().border};">
          <div class="category-left">
            <div class="category-arrow"></div>
            <span class="category-name">Gastos sin Clasificar</span>
          </div>
          <div class="category-right">
            <div class="category-budget">
              <div class="budget-amount">${Helpers.formatCurrency(totalSpent)}</div>
            </div>
          </div>
        </div>
        <div class="subcategories-container">
          <div class="expenses-container">
            ${sortedExpenses.map(expense => `
              <div class="expense-item unclassified-expense-item" data-expense-id="${expense.id}" title="Haz clic para clasificar este gasto">
                <div class="expense-info">
                  <div class="expense-name">${expense.name}</div>
                  <div class="expense-date">${Helpers.formatDate(expense.date)}</div>
                </div>
                <div class="expense-right">
                  <div class="expense-amount">
                    -${Helpers.formatCurrency(expense.amount)}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderSubcategories(category, expenses) {
    // ... (sin cambios en esta función)
    if (!category.subcategories || category.subcategories.length === 0) {
      return `
        <div class="subcategories-container">
          <div class="empty-state">
            <p>No hay subcategorías en esta categoría</p>
          </div>
        </div>
      `;
    }
  
    return `
      <div class="subcategories-container">
        ${category.subcategories.map(sub => {
          const subExpenses = this.getSubcategoryExpenses(sub.id, expenses);
          const spent = this.getSubcategorySpent(sub.id, expenses);
          const remaining = sub.budget - spent;
          const percentage = Helpers.calculateProgress(spent, sub.budget);
          const budgetColors = ThemeManager.getBudgetColors(percentage);
  
          // ✅ Formatear fecha de inicio
          const formattedStart = sub.startDate ? Helpers.formatDate(sub.startDate) : '---';
  
          // Determinar fecha final segura
          let endDate = sub.endDate;
          if (!endDate || isNaN(new Date(endDate))) {
            endDate = Helpers.getEndDate(sub.startDate, sub.frequency);
          }
          const formattedEnd = Helpers.formatDate(endDate);

          // Calcular tiempo restante para el reinicio
          const remainingTime = Helpers.getRemainingTime(endDate);

          return `
            <div class="subcategory-wrapper ${sub.expanded ? 'expanded' : ''}" data-subcategory-id="${sub.id}">
              <div class="subcategory-content" data-toggle="subcategory"
                   style="background-color: ${budgetColors.background}; border-color: ${budgetColors.border};">
                <div class="subcategory-arrow">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="subcategory-name">${sub.name}</span>
                <div class="subcategory-budget">
                  <div class="budget-amount">${Helpers.formatCurrency(remaining)}</div>
                </div>
                <button class="add-expense-btn"
                        data-subcategory-id="${sub.id}"
                        data-subcategory-name="${sub.name}"
                        data-remaining-budget="${remaining}"
                        aria-label="Gastar"
                        title="Gastar">
                  <span class="nav-icon">
                    <img src="dollar-banknote-svgrepo-com.svg" alt="icono gastos">
                  </span>
                </button>
                <button class="edit-subcategory-btn"
                        data-subcategory-id="${sub.id}"
                        aria-label="Editar subcategoría"
                        title="Editar subcategoría">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
  
              ${sub.expanded ? `
                <div class="subcategory-info">
                  <div class="budget-reset-detail">
                    Gastos entre ${formattedStart} y ${formattedEnd} (↻ ${remainingTime})
                  </div>
                </div>
                ${this.renderExpenses(subExpenses)}
              ` : ''}
            </div>
          `;
  
        }).join('')}
      </div>
    `;
  }
  
  renderExpenses(expenses) {
    // ... (sin cambios en esta función)
     if (expenses.length === 0) {
      return `
        <div class="expenses-container">
          <div class="empty-state">
            <p>No hay gastos registrados</p>
          </div>
        </div>
      `;
    }
  
    // 🔹 Ordenar de más reciente a más antiguo
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
  
    return `
      <div class="expenses-container">
        ${sortedExpenses.map(expense => {
          const wallet = AppState.wallets.find(acc => acc.id === expense.walletId);
          return `
            <div class="expense-item" data-expense-id="${expense.id}">
              <div class="expense-info">
                <div class="expense-name">${expense.name}</div>
                <div class="expense-date">${Helpers.formatDate(expense.date)}</div>
              </div>
              <div class="expense-right">
                <div class="expense-amount">
                  -${Helpers.formatCurrency(expense.amount, wallet ? wallet.currency : 'BOB')}
                </div>
                ${wallet ? `<div class="expense-wallet">${wallet.name}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }
  
  attachCategoryEventListeners() {
    
      // 1. Category toggle (Categorías)
      this.categoriesContainer.querySelectorAll('[data-toggle="category"]').forEach(element => {
          element.addEventListener('click', (e) => {
              if (
                  e.target.closest('.add-subcategory-btn') ||
                  e.target.closest('.edit-category-btn')
              ) return;
  
              const categoryWrapper = element.closest('.category-wrapper');
              const categoryId = categoryWrapper.dataset.categoryId;
              
              // 🚨 CLAVE: 
              // 1. Ocultamos todos (Deselección).
              this.hideAllEditButtons(); 
              
              // 2. Si la categoría estaba visible antes de ocultarla (doble clic), 
              // no hacemos el toggle de expansión/colapso.
              // Si la categoría NO estaba visible (primer clic), sí hacemos el toggle.
              const wasSelected = categoryWrapper.classList.contains('show-edit');
  
              // Solo hacemos el toggle de expansión si no estaba previamente seleccionado.
              // Esto evita que el doble clic colapse/expanda de nuevo inmediatamente.
              if (!wasSelected) {
                  this.toggleCategory(categoryId); // Esta función debe llamar a this.render()
                  
                  // 3. Después de que se re-renderice (asumimos que toggleCategory es rápido o asíncrono)
                  // Usamos un pequeño delay para asegurar que el DOM se actualice con el render.
                  setTimeout(() => {
                      const newWrapper = this.categoriesContainer.querySelector(`[data-category-id="${categoryId}"]`);
                      // Solo mostramos el botón si la tarjeta está expandida (se colapsa con el segundo clic)
                      if (newWrapper && newWrapper.classList.contains('expanded')) {
                          this.showEditButton(newWrapper);
                      }
                  }, 100);
              }
          });
      });
  
      // 2. Subcategory toggle (Subcategorías)
      this.categoriesContainer.querySelectorAll('[data-toggle="subcategory"]').forEach(element => {
          element.addEventListener('click', (e) => {
              if (
                  e.target.closest('.add-expense-btn') ||
                  e.target.closest('.edit-subcategory-btn')
              ) return;
  
              const subcategoryWrapper = element.closest('.subcategory-wrapper');
              const subcategoryId = subcategoryWrapper.dataset.subcategoryId;
              
              // 🚨 CLAVE: 
              this.hideAllEditButtons();
              
              const wasSelected = subcategoryWrapper.classList.contains('show-edit');
  
              if (!wasSelected) {
                  this.toggleSubcategory(subcategoryId); // Esta función debe llamar a this.render()
                  
                  setTimeout(() => {
                      const newWrapper = this.categoriesContainer.querySelector(`[data-subcategory-id="${subcategoryId}"]`);
                      if (newWrapper && newWrapper.classList.contains('expanded')) {
                          this.showEditButton(newWrapper);
                      }
                  }, 100);
              }
          });
      });

    // Add subcategory buttons
    this.categoriesContainer.querySelectorAll('.add-subcategory-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const categoryId = btn.dataset.categoryId;
        const categoryName = btn.dataset.categoryName;
        this.openCreateSubcategoryModal(categoryId, categoryName);
      });
    });
  
    // Edit category buttons
    this.categoriesContainer.querySelectorAll('.edit-category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const categoryId = btn.dataset.categoryId;
        this.openEditCategoryModal(categoryId);
      });
    });

    // Edit subcategory buttons
    this.categoriesContainer.querySelectorAll('.edit-subcategory-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const subcategoryId = btn.dataset.subcategoryId;
        await this.openEditSubcategoryModal(subcategoryId);
      });
    });
  
    // Add expense buttons
    this.categoriesContainer.querySelectorAll('.add-expense-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subcategoryId = btn.dataset.subcategoryId;
        const subcategoryName = btn.dataset.subcategoryName;
        const remainingBudget = parseFloat(btn.dataset.remainingBudget);
        this.openCreateExpenseModal(subcategoryId, subcategoryName, remainingBudget);
      });
    });
  
    // Editar gasto (clasificado o sin clasificar)
    this.categoriesContainer.querySelectorAll('.expense-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const expenseId = item.dataset.expenseId;
        this.openEditExpenseModal(expenseId); 
      });
    });
  }
  // 
  // ----------------------------------------------------
  // --- MODAL & FORM HANDLERS ---
  // ----------------------------------------------------

  // Modal handlers
  openCreateCategoryModal() {
    const modalData = ModalManager.createCategoryModal();
    window.appEvents.emit('openModal', modalData);
  }

  // 🚀 NUEVO: Modal para gasto rápido
  openQuickExpenseModal() {
    if (AppState.wallets.length === 0) {
      Helpers.showToast('Primero debes crear una wallet en la pestaña Wallets', 'warning');
      return;
    }
    const modalData = ModalManager.createQuickExpenseModal(); // Necesitarás crear esta función en modals.js
    window.appEvents.emit('openModal', modalData);
  }

  openCreateSubcategoryModal(categoryId, categoryName) {
    // ... (sin cambios)
    const modalData = ModalManager.createSubcategoryModal(categoryId, categoryName);
    window.appEvents.emit('openModal', modalData);
  }
  openEditCategoryModal(categoryId) {
    // ... (sin cambios)
    const category = AppState.categories.find(cat => cat.id === categoryId);
    if (!category) return;
  
    const modalData = ModalManager.editCategoryModal(category);
    window.appEvents.emit('openModal', modalData);
  }
  
  async openEditSubcategoryModal(subcategoryId) {
    let subcategory = null;
    AppState.categories.forEach(cat => {
      const found = cat.subcategories.find(sub => sub.id === subcategoryId);
      if (found) subcategory = found;
    });
    if (!subcategory) return;
  
    const modalData = await ModalManager.editSubcategoryModal(subcategory);
    window.appEvents.emit('openModal', modalData);
  }

  openEditExpenseModal(expenseId) {
    const expense = AppState.expenses.find(e => e.id === expenseId);
    if (!expense) return;
  
    const wallet   = AppState.wallets.find(w => w.id === expense.walletId);
    const currency = wallet ? wallet.currency : 'BOB';
    const isUnclassified = !expense.categoryId || expense.categoryId === 'unclassified';
  
    const modalData = isUnclassified
      ? ModalManager.editExpenseModalUnclassified(expense, currency)
      : ModalManager.editExpenseModalClassified(expense, currency);
  
    // Abrimos el modal
    window.appEvents.emit('openModal', modalData);
  
    if (isUnclassified) {
      setTimeout(() => {
        this.fillSubcategorySelect();
  
        const cancelBtn = document.getElementById('cancelButton');
        if (cancelBtn) {
          cancelBtn.addEventListener('click', () => window.appEvents.emit('closeModal'));
        }
      }, 50);
    }
  }
  
/**
 * Rellena el <select id="expenseSubcategory"> dentro del modal
 * de clasificación de gasto sin categoría.
 * No toca el resto del modal, por lo que los listeners de cierre siguen activos.
 */
fillSubcategorySelect() {
  const select = document.getElementById('expenseSubcategory');
  if (!select) return;               // <-- proteger contra null

  // Opción por defecto
  select.innerHTML = `<option value="">-- Selecciona para clasificar --</option>`;

  const categories = AppState.categories || [];
  categories.forEach(cat => {
    if (!cat.subcategories?.length) return;

    const optgroup = document.createElement('optgroup');
    optgroup.label = cat.name;

    cat.subcategories.forEach(sub => {
      if (!sub.id || !sub.name) return;
      const option = document.createElement('option');
      option.value = sub.id;
      option.textContent = sub.name;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });
}

  openCreateExpenseModal(subcategoryId, subcategoryName, remainingBudget) {
    const modalData = ModalManager.createExpenseModal(subcategoryId, subcategoryName, remainingBudget);
    window.appEvents.emit('openModal', modalData);
    
    // Setup dynamic currency display
    setTimeout(() => {
      const walletselect = document.getElementById('expenseWallet');
      const currencyDisplay = document.getElementById('currencyDisplay');
      
      if (walletselect && currencyDisplay) {
        const updateCurrency = () => {
          const selectedWalletId = walletselect.value;
          const wallet = AppState.wallets.find(acc => acc.id === selectedWalletId);
          if (wallet) {
            currencyDisplay.textContent = wallet.currency;
          }
        };
        
        walletselect.addEventListener('change', updateCurrency);
        updateCurrency(); // Initial update
      }
    }, 100);
  }

  // Form handlers
  async handleCreateCategory(form) {
    // ... (sin cambios)
    const formData = new FormData(form);
    const categoryData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      description: Helpers.sanitizeInput(formData.get('description') || ''),
      expanded: false
    };

    if (await Storage.addCategory(categoryData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Categoría creada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al crear la categoría', 'error');
    }
  }

  async handleCreateSubcategory(form) {
    // ... (sin cambios)
    const formData = new FormData(form);
    const subcategoryData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      budget: parseFloat(formData.get('budget')),
      frequency: formData.get('frequency'),
      startDate: formData.get('startDate'), // guardar fecha de inicio
      expanded: false
    };
  
    const categoryId = formData.get('categoryId');
  
    if (!Helpers.validateNumber(subcategoryData.budget)) {
      Helpers.showToast('El presupuesto debe ser un número válido', 'error');
      return;
    }
  
    if (await Storage.addSubcategory(categoryId, subcategoryData)) {
      // Expandir la categoría para mostrar la nueva subcategoría
      const categories = await Storage.getCategories();
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        category.expanded = true;
        await Storage.saveCategories(categories);
      }
      
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Subcategoría creada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al crear la subcategoría', 'error');
    }
  }
  
  async handleEditSubcategory(form, categoryId, subcategoryId) {
    // ... (sin cambios)
     const formData = new FormData(form);
    const updatedData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      budget: parseFloat(formData.get('budget')),
      frequency: formData.get('frequency'),
      startDate: formData.get('startDate') // usar la fecha manual del formulario
    };
  
    if (!Helpers.validateNumber(updatedData.budget)) {
      Helpers.showToast('El presupuesto debe ser un número válido', 'error');
      return;
    }
  
    if (await Storage.updateSubcategory(categoryId, subcategoryId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Subcategoría actualizada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al actualizar la subcategoría', 'error');
    }
  }
  
  async handleEditCategory(form, categoryId) {
    // ... (sin cambios)
     const formData = new FormData(form);
    const updatedData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      description: Helpers.sanitizeInput(formData.get('description') || '')
    };

    if (await Storage.updateCategory(categoryId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Categoría actualizada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al actualizar la categoría', 'error');
    }
  }

  async handleEditExpense(form) {
    // ✅ CAMBIO: Al editar un gasto, buscamos la nueva categoryId a partir de la subcategoría
    const formData = new FormData(form);
    const expenseId = formData.get('expenseId');
    const subcategoryId = formData.get('subcategoryId'); // Este es el campo clave

    const category = AppState.categories.find(cat =>
      cat.subcategories.some(sub => sub.id === subcategoryId)
    );

    if (!category) {
      Helpers.showToast('Debes seleccionar una subcategoría válida.', 'error');
      return;
    }
    
    const updatedData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      walletId: formData.get('walletId'),
      subcategoryId: subcategoryId,
      categoryId: category.id // <- Guardamos la categoryId correcta
    };
  
    if (!Helpers.validateNumber(updatedData.amount)) {
      Helpers.showToast('El monto debe ser un número válido', 'error');
      return;
    }
  
    if (await Storage.updateExpense(expenseId, updatedData)) {
        AppState.refreshData();
        Helpers.showToast('Gasto actualizado y clasificado exitosamente', 'success');
        window.appEvents.emit('closeModal'); // Cierra solo en caso de éxito
    } else {
        Helpers.showErrorModal(
          'Error al Actualizar Gasto',
          'No se pudo actualizar el gasto en la base de datos. Por favor, copia los detalles técnicos y compártelos con soporte.',
          {
            errorType: 'UpdateExpenseError',
            userAction: 'Actualizando gasto clasificado',
            expenseId: expenseId,
            updatedData: updatedData,
            categoryName: category.name
          }
        );
    }

  }
  
  async handleCreateExpense(form) {
    // ✅ CAMBIO: Añadimos la categoryId al crear un gasto normal
    const formData = new FormData(form);
    const subcategoryId = formData.get('subcategoryId');

    const category = AppState.categories.find(cat =>
      cat.subcategories.some(sub => sub.id === subcategoryId)
    );
    
    if (!category) {
      Helpers.showErrorModal(
        'Error de Datos',
        'No se pudo encontrar la categoría para la subcategoría seleccionada. Esto indica un problema con los datos de la aplicación.',
        {
          errorType: 'DataInconsistencyError',
          userAction: 'Creando nuevo gasto',
          subcategoryId: subcategoryId,
          availableCategories: AppState.categories.map(c => ({ id: c.id, name: c.name, subcategories: c.subcategories?.length || 0 }))
        }
      );
      return;
    }

    const expenseData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      walletId: formData.get('walletId'),
      subcategoryId: subcategoryId,
      categoryId: category.id // <- Guardamos la categoryId
    };
  
    if (!Helpers.validateNumber(expenseData.amount)) {
      Helpers.showToast('El monto debe ser un número válido', 'error');
      return;
    }
  
    const wallet = AppState.wallets.find(acc => acc.id === expenseData.walletId);
    if (!wallet || wallet.balance < expenseData.amount) {
      Helpers.showToast('Saldo insuficiente en la wallet seleccionada', 'error');
      return;
    }
  
    if (await Storage.addExpense(expenseData)) {
      await AppState.refreshData();
      const cat = AppState.categories.find(c => c.id === category.id);
      const sub = cat.subcategories.find(s => s.id === subcategoryId);
      if (cat) cat.expanded = true;
      if (sub) sub.expanded = true;
      await Storage.saveCategories(AppState.categories);
  
      window.appEvents.emit('closeModal');
      Helpers.showToast('Gasto agregado exitosamente', 'success');
      this.render();
    } else {
      Helpers.showErrorModal(
        'Error al Crear Gasto',
        'No se pudo crear el gasto en la base de datos. Por favor, copia los detalles técnicos y compártelos con soporte.',
        {
          errorType: 'CreateExpenseError',
          userAction: 'Creando nuevo gasto clasificado',
          expenseData: expenseData,
          categoryName: category.name
        }
      );
    }
  }

  // 🚀 NUEVO: Manejador para guardar un gasto rápido
  async handleCreateQuickExpense(form) {
    const formData = new FormData(form);
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const expenseData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      amount: parseFloat(formData.get('amount')),
      date: localDate, // Fecha actual en hora local
      walletId: formData.get('walletId'),
      categoryId: 'unclassified', // <- La magia está aquí
      subcategoryId: null
    };

    if (!expenseData.name || !Helpers.validateNumber(expenseData.amount)) {
        Helpers.showToast('Por favor, completa nombre y monto.', 'error');
        return;
    }

    const wallet = AppState.wallets.find(acc => acc.id === expenseData.walletId);
    if (!wallet || wallet.balance < expenseData.amount) {
      Helpers.showToast('Saldo insuficiente en la wallet seleccionada', 'error');
      return;
    }

    const saveResult = await Storage.addExpense(expenseData);
    
    if (saveResult) {
      // Verificar que el gasto realmente se guardó en IndexedDB
      const expenseRepo = new ExpenseRepository();
      const savedExpense = await expenseRepo.getById(expenseData.id);
      
      if (savedExpense) {
        await AppState.refreshData();
        window.appEvents.emit('closeModal');
        Helpers.showToast('Gasto rápido guardado. ¡Clasifícalo cuando puedas!', 'success');
      } else {
        console.error('Expense was not persisted to IndexedDB:', expenseData.id);
        
        // Mostrar modal de error con detalles técnicos
        Helpers.showErrorModal(
          'Error de Persistencia',
          'El gasto se procesó pero no se guardó correctamente en la base de datos. Esto puede indicar un problema de almacenamiento. Por favor, copia los detalles técnicos y compártelos con soporte.',
          {
            errorType: 'PersistenceFailure',
            errorMessage: 'Expense was saved but not found in IndexedDB after verification',
            expenseId: expenseData.id,
            expenseName: expenseData.name,
            expenseAmount: expenseData.amount,
            categoryId: expenseData.categoryId,
            subcategoryId: expenseData.subcategoryId,
            walletId: expenseData.walletId,
            date: expenseData.date,
            saveResult: saveResult
          }
        );
      }
    } else {
      // El error ya fue mostrado por Storage.addExpense con modal
      console.error('Failed to save quick expense:', expenseData);
    }
  }

  // --- Dejo el resto de tus funciones de helpers y reinicio intactas ---
  async toggleCategory(categoryId) {
    // ... (sin cambios)
     const categories = AppState.categories;
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      category.expanded = !category.expanded;
      await Storage.saveCategories(categories);
      this.render();
    }
  }

  async toggleSubcategory(subcategoryId) {
    // ... (sin cambios)
     const categories = AppState.categories;
    let subcategory = null;
    
    categories.forEach(category => {
      const found = category.subcategories.find(sub => sub.id === subcategoryId);
      if (found) subcategory = found;
    });
    
    if (subcategory) {
      subcategory.expanded = !subcategory.expanded;
      await Storage.saveCategories(categories);
      this.render();
    }
  }
  async handleDeleteCategory(categoryId) {
    if (confirm('¿Seguro que quieres eliminar esta categoría y todas sus subcategorías?')) {
      if (await Storage.deleteCategory(categoryId)) {
        await AppState.refreshData();
        Helpers.showToast('Categoría eliminada', 'success');
      } else {
        Helpers.showErrorModal(
          'Error al Eliminar Categoría',
          'No se pudo eliminar la categoría de la base de datos. Por favor, copia los detalles técnicos y compártelos con soporte.',
          {
            errorType: 'DeleteCategoryError',
            userAction: 'Eliminando categoría',
            categoryId: categoryId,
            categoryName: category?.name || 'Desconocida',
            hasSubcategories: category?.subcategories?.length > 0,
            subcategoriesCount: category?.subcategories?.length || 0
          }
        );
      }
    }
  }


  async handleDeleteExpense(expenseId) {
    if (!expenseId) return;
    if (confirm('¿Seguro que quieres eliminar este gasto?')) {
      if (await Storage.deleteExpense(expenseId)) {
        await AppState.refreshData();
        window.appEvents.emit('closeModal');
        Helpers.showToast('Gasto eliminado exitosamente', 'success');
      } else {
        Helpers.showErrorModal(
          'Error al Eliminar Gasto',
          'No se pudo eliminar el gasto de la base de datos. Por favor, copia los detalles técnicos y compártelos con soporte.',
          {
            errorType: 'DeleteExpenseError',
            userAction: 'Eliminando gasto',
            expenseId: expenseId,
            expense: expense
          }
        );
      }
    }
  }


  getCategoryBudget(category) {
    // Suma de los presupuestos DISPONIBLES de cada subcategoría
    if (!category.subcategories) return 0;
    
    const expenses = AppState.expenses;
    return category.subcategories.reduce((total, sub) => {
      const spent = this.getSubcategorySpent(sub.id, expenses);
      const available = sub.budget - spent;
      return total + available;
    }, 0);
  }
  getCategorySpent(categoryId, expenses) {
    // Suma de los gastos de cada subcategoría DENTRO de su período actual
    const category = AppState.categories.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories) return 0;
    
    return category.subcategories.reduce((total, sub) => {
      const spent = this.getSubcategorySpent(sub.id, expenses);
      return total + spent;
    }, 0);
  }

  getSubcategoryExpenses(subcategoryId, expenses) {
    // ... (sin cambios)
    let subcategory = null;
    for (const category of AppState.categories) {
        const found = category.subcategories.find(sub => sub.id === subcategoryId);
        if (found) {
            subcategory = found;
            break;
        }
    }

    if (!subcategory) return [];

    const periodStart = new Date(subcategory.startDate + 'T00:00:00');
    const periodEnd = new Date(subcategory.endDate + 'T23:59:59');

    return expenses.filter(expense => {
        // Excluir gastos sin clasificar (gastos rápidos)
        if (!expense.subcategoryId || expense.categoryId === 'unclassified') {
          return false;
        }
        const expenseDate = new Date(expense.date + 'T00:00:00');
        return expense.subcategoryId === subcategoryId &&
               expenseDate >= periodStart &&
               expenseDate <= periodEnd;
    });
  }
  getSubcategorySpent(subcategoryId, expenses) {
    // ... (sin cambios)
    const subcategoryExpenses = this.getSubcategoryExpenses(subcategoryId, expenses);
    return subcategoryExpenses.reduce((total, expense) => total + expense.amount, 0);
  }

  async resetSubcategoryBudget(categoryId, subcategoryId, allExpenses) {
    const sub = AppState.categories
      .flatMap(cat => cat.subcategories || [])
      .find(s => s.id === subcategoryId);

    if (!sub) return;

    const periodStart = new Date(sub.startDate + 'T00:00:00');
    const periodEnd = new Date(sub.endDate + 'T23:59:59');

    const expensesToArchive = allExpenses.filter(e => {
        // CRÍTICO: Nunca archivar gastos sin clasificar (gastos rápidos)
        if (!e.subcategoryId || e.categoryId === 'unclassified') {
          return false;
        }
        const expenseDate = new Date(e.date + 'T00:00:00');
        return e.subcategoryId === subcategoryId && expenseDate >= periodStart && expenseDate <= periodEnd;
    });

    if (expensesToArchive.length > 0) {
        const enrichedExpenses = expensesToArchive.map(e => ({
            ...e,
            archivedAt: new Date().toISOString(),
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString()
        }));
        await Storage.archiveExpenses(enrichedExpenses);

        const expenseIdsToArchive = new Set(expensesToArchive.map(e => e.id));
        const remaining = allExpenses.filter(e => !expenseIdsToArchive.has(e.id));
        await Storage.saveExpenses(remaining);
    }

    const categories = await Storage.getCategories();
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
        const subToUpdate = category.subcategories.find(s => s.id === subcategoryId);
        if (subToUpdate) {
            const nextStartDate = Helpers.getNextResetDate(subToUpdate.startDate, subToUpdate.frequency);
            const year = nextStartDate.getFullYear();
            const month = String(nextStartDate.getMonth() + 1).padStart(2, '0');
            const day = String(nextStartDate.getDate()).padStart(2, '0');
            
            subToUpdate.startDate = `${year}-${month}-${day}`;
            subToUpdate.endDate = Helpers.getEndDate(subToUpdate.startDate, subToUpdate.frequency);
            await Storage.saveCategories(categories);
        }
    }
  }
  
  async checkAndResetBudgets() {
    const categories = await Storage.getCategories();
    const allExpenses = await Storage.getExpenses();
    let didReset = false;

    if (Array.isArray(categories)) {
      for (const category of categories) {
        if (category.subcategories && Array.isArray(category.subcategories)) {
          for (const sub of category.subcategories) {
            const resetDate = Helpers.getNextResetDate(sub.startDate, sub.frequency);
            if (new Date() >= resetDate) {
              await this.resetSubcategoryBudget(category.id, sub.id, allExpenses);
              didReset = true;
            }
          }
        }
      }
    }

    if (didReset) {
      await AppState.refreshData();
      Helpers.showToast('Algunas subcategorías fueron reiniciadas automáticamente', 'info');
    }
  }

  // Función para ocultar todos los botones de editar
  hideAllEditButtons() {
    // Ocultar botones de gastos
    document.querySelectorAll('.category-wrapper').forEach(wrapper => {
      wrapper.classList.remove('show-edit');
    });
    document.querySelectorAll('.subcategory-wrapper').forEach(wrapper => {
      wrapper.classList.remove('show-edit');
    });
    // Ocultar botones de wallets
    document.querySelectorAll('.wallet-card').forEach(card => {
      card.classList.remove('show-edit');
    });
  }

  // Función para mostrar solo un botón de editar
  showEditButton(element) {
    this.hideAllEditButtons();
    element.classList.add('show-edit');
    console.log('Mostrando botón de editar en:', element.className, element);
  }

  // Event listener global para ocultar botones al hacer click fuera
  setupGlobalClickListener() {
    document.addEventListener('click', (e) => {
      // 1. Si el click fue dentro de un elemento interactivo (que ya tiene su propia lógica), NO HACER NADA.
      if (
        e.target.closest('.edit-category-btn') || 
        e.target.closest('.edit-subcategory-btn') || 
        e.target.closest('.edit-wallet-btn') ||
        // Si fue un click para seleccionar/deseleccionar (toggle), dejar que el otro listener lo maneje
        e.target.closest('[data-toggle="category"]') || 
        e.target.closest('[data-toggle="subcategory"]') ||
        e.target.closest('[data-action="toggle"]') 
      ) {
        return;
      }
      
      // 2. Si el click fue en el "fondo" (fuera de cualquier tarjeta/wrapper), OCULTAR TODOS.
      if (!e.target.closest('.category-wrapper') && 
          !e.target.closest('.subcategory-wrapper') &&
          !e.target.closest('.wallet-card')) {
        this.hideAllEditButtons();
      }
    });
  }
}

// Initialize gastos manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GastosManager();
});