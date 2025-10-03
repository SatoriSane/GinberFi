// Gastos tab functionality
class GastosManager {
  constructor() {
    this.categoriesContainer = document.getElementById('categoriesContainer');
    this.emptyCategoriesState = document.getElementById('emptyCategoriesState');
    this.addCategoryBtn = document.getElementById('addCategoryBtn');

    // ✅ CAMBIO: IDs de los botones actualizados según el nuevo index.html
    this.addQuickExpenseFab = document.getElementById('addQuickExpenseFab');
    this.addCategoryListBtn = document.getElementById('addCategoryListBtn');
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.checkAndResetBudgets();
    this.render();
    
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

    // El botón del estado vacío sigue abriendo el modal de crear categoría
    this.addCategoryBtn.addEventListener('click', () => {
      this.openCreateCategoryModal();
    });

    // ✅ CAMBIO: El FAB ahora abre el modal de "Gasto Rápido"
    this.addQuickExpenseFab.addEventListener('click', () => {
      this.openQuickExpenseModal();
    });

    // 🚀 NUEVO: El nuevo botón "+ Añadir Categoría" también abre el modal de creación
    this.addCategoryListBtn.addEventListener('click', () => {
        this.openCreateCategoryModal();
    });

// Handle form submissions
document.addEventListener('submit', (e) => {
  e.preventDefault(); 
  const form = e.target;

  switch (form.id) {
    case 'categoryForm':
      this.handleCreateCategory(form);
      break;
    case 'subcategoryForm':
      this.handleCreateSubcategory(form);
      break;
    case 'editCategoryForm': {
      const formData = new FormData(form);
      const categoryId = formData.get('categoryId'); 
      this.handleEditCategory(form, categoryId);
      break;
    }
    case 'editSubcategoryForm': {
      const formData = new FormData(form);
      const categoryId = formData.get('categoryId');        
      const subcategoryId = formData.get('subcategoryId');  
      this.handleEditSubcategory(form, categoryId, subcategoryId);
      break;
    }
    case 'editExpenseForm':
      this.handleEditExpense(form);
      break;
    case 'expenseForm':
      this.handleCreateExpense(form);
      break;
    // 🚀 NUEVO: Manejador para el formulario de gasto rápido
    case 'quickExpenseForm':
      this.handleCreateQuickExpense(form);
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

    // ✅ CAMBIO: La lógica de visibilidad ahora considera los gastos sin clasificar
    // Limpiamos el contenido anterior, pero mantenemos el nodo del estado vacío
    while (this.categoriesContainer.firstChild && this.categoriesContainer.firstChild !== this.emptyCategoriesState) {
        this.categoriesContainer.removeChild(this.categoriesContainer.firstChild);
    }

    if (categories.length === 0 && unclassifiedExpenses.length === 0) {
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
        
        // Insertamos el nuevo contenido ANTES del nodo de estado vacío
        this.categoriesContainer.insertAdjacentHTML('afterbegin', finalHtml);
        this.attachCategoryEventListeners();
    }
    
    // El FAB de gasto rápido siempre debe estar visible si hay wallets
    this.addQuickExpenseFab.style.display = AppState.wallets.length > 0 ? 'flex' : 'none';
  }

  renderCategories(categories) {
    const expenses = AppState.expenses;
    // ✅ CAMBIO: La función ahora devuelve el string HTML en lugar de modificar el DOM directamente
    return categories.map(category => {
      const categoryExpenses = this.getCategoryExpenses(category.id, expenses);
      const totalBudget = this.getCategoryBudget(category);
      const totalSpent = this.getCategorySpent(category.id, expenses);
      const remaining = totalBudget - totalSpent;
      const percentage = Helpers.calculateProgress(totalSpent, totalBudget);
      const budgetColors = Helpers.getProgressBarColor(100 - percentage);

      return `
        <div class="category-wrapper ${category.expanded ? 'expanded' : ''}" data-category-id="${category.id}">
          <div class="category-content" data-toggle="category" style="background-color: ${budgetColors.background}; border-color: ${budgetColors.border};">
            <div class="category-left">
              <div class="category-arrow">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <span class="category-name">${category.name}</span>
            </div>
            <div class="category-right">
              <div class="category-budget">
                <div class="budget-amount">${Helpers.formatCurrency(remaining)}</div>
                <div class="budget-percentage">(${(100 - percentage).toFixed(1)}%)</div>
              </div>
              <button class="add-subcategory-btn"
                      data-category-id="${category.id}"
                      data-category-name="${category.name}"
                      aria-label="Añadir subcategoría"
                      title="Añadir subcategoría">+</button>
              <button class="edit-category-btn"
                      data-category-id="${category.id}"
                      aria-label="Opciones"
                      title="Opciones">⋮</button>
            </div>
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
        <div class="category-content" style="background-color: #f5f5f5; border-color: #ddd;">
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
          const budgetColors = Helpers.getProgressBarColor(100 - percentage);
  
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
                <div class="subcategory-left">
                  <div class="subcategory-arrow">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <span class="subcategory-name">${sub.name}</span>
                </div>
                <div class="subcategory-right">
                  <div class="subcategory-budget">
                    <div class="budget-top">
                      <div class="budget-amount">${Helpers.formatCurrency(remaining)}</div>
                    </div>
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
                          aria-label="Opciones"
                          title="Opciones">⋮</button>
                </div>
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
    // Category toggle
    this.categoriesContainer.querySelectorAll('[data-toggle="category"]').forEach(element => {
      element.addEventListener('click', (e) => {
        if (
          e.target.classList.contains('add-subcategory-btn') ||
          e.target.classList.contains('edit-category-btn')
        ) return;
        
        const categoryId = element.closest('.category-wrapper').dataset.categoryId;
        this.toggleCategory(categoryId);
      });
    });
  
    // Subcategory toggle
    this.categoriesContainer.querySelectorAll('[data-toggle="subcategory"]').forEach(element => {
      element.addEventListener('click', (e) => {
        if (
          e.target.classList.contains('add-expense-btn') ||
          e.target.classList.contains('edit-subcategory-btn')
        ) return;
        
        const subcategoryId = element.closest('.subcategory-wrapper').dataset.subcategoryId;
        this.toggleSubcategory(subcategoryId);
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
  
    // Edit subcategory buttons
    this.categoriesContainer.querySelectorAll('.edit-subcategory-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subcategoryId = btn.dataset.subcategoryId;
        this.openEditSubcategoryModal(subcategoryId);
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
  
  openEditSubcategoryModal(subcategoryId) {
    let subcategory = null;
    AppState.categories.forEach(cat => {
      const found = cat.subcategories.find(sub => sub.id === subcategoryId);
      if (found) subcategory = found;
    });
    if (!subcategory) return;
  
    const modalData = ModalManager.editSubcategoryModal(subcategory);
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
  handleCreateCategory(form) {
    // ... (sin cambios)
    const formData = new FormData(form);
    const categoryData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      description: Helpers.sanitizeInput(formData.get('description') || ''),
      expanded: false
    };

    if (Storage.addCategory(categoryData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Categoría creada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al crear la categoría', 'error');
    }
  }

  handleCreateSubcategory(form) {
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
  
    if (Storage.addSubcategory(categoryId, subcategoryData)) {
      // Expandir la categoría para mostrar la nueva subcategoría
      const categories = Storage.getCategories();
      const category = categories.find(cat => cat.id === categoryId);
      if (category) {
        category.expanded = true;
        Storage.saveCategories(categories);
      }
      
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Subcategoría creada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al crear la subcategoría', 'error');
    }
  }
  
  handleEditSubcategory(form, categoryId, subcategoryId) {
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
  
    if (Storage.updateSubcategory(categoryId, subcategoryId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Subcategoría actualizada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al actualizar la subcategoría', 'error');
    }
  }
  
  handleEditCategory(form, categoryId) {
    // ... (sin cambios)
     const formData = new FormData(form);
    const updatedData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      description: Helpers.sanitizeInput(formData.get('description') || '')
    };

    if (Storage.updateCategory(categoryId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Categoría actualizada exitosamente', 'success');
    } else {
      Helpers.showToast('Error al actualizar la categoría', 'error');
    }
  }

  handleEditExpense(form) {
    // ✅ CAMBIO: Al editar un gasto, buscamos la nueva categoryId a partir de la subcategoría
    const formData = new FormData(form);
    const expenseId = formData.get('expenseId');
    const subcategoryId = formData.get('subcategoryId'); // Este es el campo clave

    const category = AppState.categories.find(cat =>
      cat.subcategories.some(sub => sub.id === subcategoryId)
    );

    if (!category) {
      Helpers.showToast('Debes seleccionar una subcategoría válida.', 'error');
      // No cerramos el modal aquí para que el usuario pueda corregir.
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
  
    if (Storage.updateExpense(expenseId, updatedData)) {
        AppState.refreshData();
        Helpers.showToast('Gasto actualizado y clasificado exitosamente', 'success');
        window.appEvents.emit('closeModal'); // Cierra solo en caso de éxito
    } else {
        Helpers.showToast('Error al actualizar el gasto', 'error');
        // No cerramos el modal aquí para que el usuario vea el error.
    }

  }
  
  handleCreateExpense(form) {
    // ✅ CAMBIO: Añadimos la categoryId al crear un gasto normal
    const formData = new FormData(form);
    const subcategoryId = formData.get('subcategoryId');

    const category = AppState.categories.find(cat =>
      cat.subcategories.some(sub => sub.id === subcategoryId)
    );
    
    if (!category) { // Esto no debería pasar, pero por seguridad
      Helpers.showToast('Error: Subcategoría no encontrada.', 'error');
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
  
    if (Storage.addExpense(expenseData)) {
      AppState.refreshData();
      const cat = AppState.categories.find(c => c.id === category.id);
      const sub = cat.subcategories.find(s => s.id === subcategoryId);
      if (cat) cat.expanded = true;
      if (sub) sub.expanded = true;
      Storage.saveCategories(AppState.categories);
  
      window.appEvents.emit('closeModal');
      Helpers.showToast('Gasto agregado exitosamente', 'success');
      this.render();
    } else {
      Helpers.showToast('Error al agregar el gasto', 'error');
    }
  }

  // 🚀 NUEVO: Manejador para guardar un gasto rápido
  handleCreateQuickExpense(form) {
    const formData = new FormData(form);
    const expenseData = {
      name: Helpers.sanitizeInput(formData.get('name')),
      amount: parseFloat(formData.get('amount')),
      date: new Date().toISOString().split('T')[0], // Fecha actual
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

    if (Storage.addExpense(expenseData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Helpers.showToast('Gasto rápido guardado. ¡Clasifícalo cuando puedas!', 'success');
    } else {
      Helpers.showToast('Error al guardar el gasto rápido', 'error');
    }
  }

  // --- Dejo el resto de tus funciones de helpers y reinicio intactas ---
  toggleCategory(categoryId) {
    // ... (sin cambios)
     const categories = AppState.categories;
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      category.expanded = !category.expanded;
      Storage.saveCategories(categories);
      this.render();
    }
  }

  toggleSubcategory(subcategoryId) {
    // ... (sin cambios)
     const categories = AppState.categories;
    let subcategory = null;
    
    categories.forEach(category => {
      const found = category.subcategories.find(sub => sub.id === subcategoryId);
      if (found) subcategory = found;
    });
    
    if (subcategory) {
      subcategory.expanded = !subcategory.expanded;
      Storage.saveCategories(categories);
      this.render();
    }
  }
  handleDeleteCategory(categoryId) {
    if (confirm('¿Seguro que quieres eliminar esta categoría y todas sus subcategorías?')) {
      if (Storage.deleteCategory(categoryId)) {
        AppState.refreshData();
        Helpers.showToast('Categoría eliminada', 'success');
      } else {
        Helpers.showToast('Error al eliminar la categoría', 'error');
      }
    }
  }


  handleDeleteExpense(expenseId) {
    if (!expenseId) return;
    if (confirm('¿Seguro que quieres eliminar este gasto?')) {
      if (Storage.deleteExpense(expenseId)) {
        AppState.refreshData();
        window.appEvents.emit('closeModal');
        Helpers.showToast('Gasto eliminado exitosamente', 'success');
      } else {
        Helpers.showToast('Error al eliminar el gasto', 'error');
      }
    }
  }


  
  
  
  
  getCategoryExpenses(categoryId, expenses) {
    // ... (sin cambios)
    const category = AppState.categories.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories) return [];
    
    const subcategoryIds = category.subcategories.map(sub => sub.id);
    return expenses.filter(expense => subcategoryIds.includes(expense.subcategoryId));
  }
  getCategoryBudget(category) {
    // ... (sin cambios)
    if (!category.subcategories) return 0;
    return category.subcategories.reduce((total, sub) => total + (sub.budget || 0), 0);
  }
  getCategorySpent(categoryId, expenses) {
    // ... (sin cambios)
    const categoryExpenses = this.getCategoryExpenses(categoryId, expenses);
    return categoryExpenses.reduce((total, expense) => total + expense.amount, 0);
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

    if (!subcategory) {
        return [];
    }

    const { startDate, endDate } = subcategory;

    if (!startDate || !endDate) {
        return expenses.filter(expense => expense.subcategoryId === subcategoryId);
    }

    const periodStart = new Date(startDate + 'T00:00:00');
    const periodEnd = new Date(endDate + 'T23:59:59');

    return expenses.filter(expense => {
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

  resetSubcategoryBudget(categoryId, subcategoryId, allExpenses) {
    // ... (sin cambios)
    const sub = AppState.categories
      .flatMap(cat => cat.subcategories)
      .find(s => s.id === subcategoryId);

    if (!sub) return;

    const periodStart = new Date(sub.startDate + 'T00:00:00');
    const periodEnd = new Date(sub.endDate + 'T23:59:59');

    const expensesToArchive = allExpenses.filter(e => {
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
        Storage.archiveExpenses(enrichedExpenses);

        const expenseIdsToArchive = new Set(expensesToArchive.map(e => e.id));
        const remaining = allExpenses.filter(e => !expenseIdsToArchive.has(e.id));
        Storage.saveExpenses(remaining);
    }

    const categories = Storage.getCategories();
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
            Storage.saveCategories(categories);
            
        }
    }
  }
  
  checkAndResetBudgets() {
    const categories = Storage.getCategories();
    const allExpenses = Storage.getExpenses();
    let didReset = false;

    categories.forEach(category => {
        category.subcategories.forEach(sub => {
            const resetDate = Helpers.getNextResetDate(sub.startDate, sub.frequency);
            if (new Date() >= resetDate) {
                this.resetSubcategoryBudget(category.id, sub.id, allExpenses);
                didReset = true;
            }
        });
    });

    if (didReset) {
        AppState.refreshData();
        Helpers.showToast('Algunas subcategorías fueron reiniciadas automáticamente', 'info');
    }
  }
}

// Initialize gastos manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GastosManager();
});