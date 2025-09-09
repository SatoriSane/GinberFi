// Gastos tab functionality
class GastosManager {
  constructor() {
    this.categoriesContainer = document.getElementById('categoriesContainer');
    this.emptyCategoriesState = document.getElementById('emptyCategoriesState');
    this.addCategoryBtn = document.getElementById('addCategoryBtn');
    this.addNewCategoryFab = document.getElementById('addNewCategoryFab');
    
    this.init();
  }


  init() {
    this.setupEventListeners();
    
    // 👇 Antes de renderizar, revisar si hay subcategorías que deben reiniciarse
    this.checkAndResetBudgets();
  
    this.render();
    
    // Listen for data updates
    window.appEvents.on('dataUpdated', () => {
      this.checkAndResetBudgets(); // 👈 también aquí
      this.render();
    });
    
    // Listen for tab changes
    window.appEvents.on('tabChanged', (tabName) => {
      if (tabName === 'gastos') {
        this.checkAndResetBudgets(); // 👈 también aquí
        this.render();
      }
    });
  }
  

  setupEventListeners() {
    this.addCategoryBtn.addEventListener('click', () => {
      this.openCreateCategoryModal();
    });

    this.addNewCategoryFab.addEventListener('click', () => {
      this.openCreateCategoryModal();
    });
    // Handle form submissions
    document.addEventListener('submit', (e) => {
      e.preventDefault(); // prevenimos submit por defecto para todos los formularios

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

        default:
          console.warn('Formulario no manejado:', form.id);
      }
    });
    document.getElementById('subcategoryFrequency')?.addEventListener('change', (e) => {
      const freq = e.target.value;
      const startDateInput = document.getElementById('subcategoryStartDate');
      if (startDateInput) {
        startDateInput.value = this.getDefaultStartDate(freq);
      }
    });
  }
  // ---------------------------------------
  // --- Renderizado de categorías/subcategorías---
  // ---------------------------------------

  render() {
    const categories = AppState.categories;
    
    if (categories.length === 0) {
      this.emptyCategoriesState.style.display = 'block';
      this.addNewCategoryFab.style.display = 'none';
      this.categoriesContainer.querySelectorAll('.category-wrapper').forEach(el => el.remove());
    } else {
      this.emptyCategoriesState.style.display = 'none';
      this.addNewCategoryFab.style.display = 'flex';
      this.renderCategories(categories);
    }
  }

  renderCategories(categories) {
    const expenses = AppState.expenses;
    
    this.categoriesContainer.innerHTML = categories.map(category => {
      const categoryExpenses = this.getCategoryExpenses(category.id, expenses);
      const totalBudget = this.getCategoryBudget(category);
      const totalSpent = this.getCategorySpent(category.id, expenses);
      const remaining = totalBudget - totalSpent;
      const percentage = Utils.calculateProgress(totalSpent, totalBudget);
      const budgetColors = Utils.getProgressBarColor(100 - percentage);

      return `
        <div class="category-wrapper ${category.expanded ? 'expanded' : ''}" data-category-id="${category.id}">
          <div class="category-content" data-toggle="category" style="background-color: ${budgetColors.background}; border-color: ${budgetColors.border};">
            <div class="category-left">
              <span class="category-arrow">▶</span>
              <span class="category-name">${category.name}</span>
            </div>
            <div class="category-right">
              <div class="category-budget">
                <div class="budget-amount">${Utils.formatCurrency(remaining)}</div>
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

    this.attachCategoryEventListeners();
  }

  renderSubcategories(category, expenses) {
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
          const percentage = Utils.calculateProgress(spent, sub.budget);
          const budgetColors = Utils.getProgressBarColor(100 - percentage);
  
          // ✅ Formatear fecha de inicio
          const formattedStart = sub.startDate ? Utils.formatDate(sub.startDate) : '---';
  
          // Determinar fecha final segura
          let endDate = sub.endDate;
          if (!endDate || isNaN(new Date(endDate))) {
            endDate = getEndDate(sub.startDate, sub.frequency);
          }
          const formattedEnd = Utils.formatDate(endDate);

          // Calcular tiempo restante para el reinicio
          const remainingTime = this.getRemainingTime(endDate);

          return `
            <div class="subcategory-wrapper ${sub.expanded ? 'expanded' : ''}" data-subcategory-id="${sub.id}">
              <div class="subcategory-content" data-toggle="subcategory"
                   style="background-color: ${budgetColors.background}; border-color: ${budgetColors.border};">
                <div class="subcategory-left">
                  <span class="subcategory-arrow">▶</span>
                  <span class="subcategory-name">${sub.name}</span>
                </div>
                <div class="subcategory-right">
                  <div class="subcategory-budget">
                    <div class="budget-top">
                      <div class="budget-amount">${Utils.formatCurrency(remaining)}</div>
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
                <div class="expense-date">${Utils.formatDate(expense.date)}</div>
              </div>
              <div class="expense-right">
                <div class="expense-amount">
                  -${Utils.formatCurrency(expense.amount, wallet ? wallet.currency : 'BOB')}
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
        // Editar gasto al hacer click
    this.categoriesContainer.querySelectorAll('.expense-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const expenseId = item.dataset.expenseId;
        this.openEditExpenseModal(expenseId);
      });
    });

  }
  

  toggleCategory(categoryId) {
    const categories = AppState.categories;
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
      category.expanded = !category.expanded;
      Storage.saveCategories(categories);
      this.render();
    }
  }

  toggleSubcategory(subcategoryId) {
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

  // Modal handlers
  openCreateCategoryModal() {
    const modalData = ModalManager.createCategoryModal();
    window.appEvents.emit('openModal', modalData);
  }

  openCreateSubcategoryModal(categoryId, categoryName) {
    const modalData = ModalManager.createSubcategoryModal(categoryId, categoryName);
    window.appEvents.emit('openModal', modalData);
  }
  openEditCategoryModal(categoryId) {
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
  
    const wallet = AppState.wallets.find(acc => acc.id === expense.walletId);
    const modalData = ModalManager.editExpenseModal(expense, wallet ? wallet.currency : 'BOB');
    window.appEvents.emit('openModal', modalData);
  }
  
  openCreateExpenseModal(subcategoryId, subcategoryName, remainingBudget) {
    if (AppState.wallets.length === 0) {
      Utils.showToast('Primero debes crear una wallet en la pestaña Wallets', 'warning');
      return;
    }
    
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
    const formData = new FormData(form);
    const categoryData = {
      name: Utils.sanitizeInput(formData.get('name')),
      description: Utils.sanitizeInput(formData.get('description') || ''),
      expanded: false
    };

    if (Storage.addCategory(categoryData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Categoría creada exitosamente', 'success');
    } else {
      Utils.showToast('Error al crear la categoría', 'error');
    }
  }

  handleCreateSubcategory(form) {
    const formData = new FormData(form);
    const subcategoryData = {
      name: Utils.sanitizeInput(formData.get('name')),
      budget: parseFloat(formData.get('budget')),
      frequency: formData.get('frequency'),
      startDate: formData.get('startDate'), // guardar fecha de inicio
      expanded: false
    };
  
    const categoryId = formData.get('categoryId');
  
    if (!Utils.validateNumber(subcategoryData.budget)) {
      Utils.showToast('El presupuesto debe ser un número válido', 'error');
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
      Utils.showToast('Subcategoría creada exitosamente', 'success');
    } else {
      Utils.showToast('Error al crear la subcategoría', 'error');
    }
  }
  
  handleEditSubcategory(form, categoryId, subcategoryId) {
    const formData = new FormData(form);
    const updatedData = {
      name: Utils.sanitizeInput(formData.get('name')),
      budget: parseFloat(formData.get('budget')),
      frequency: formData.get('frequency'),
      startDate: formData.get('startDate') // usar la fecha manual del formulario
    };
  
    if (!Utils.validateNumber(updatedData.budget)) {
      Utils.showToast('El presupuesto debe ser un número válido', 'error');
      return;
    }
  
    if (Storage.updateSubcategory(categoryId, subcategoryId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Subcategoría actualizada exitosamente', 'success');
    } else {
      Utils.showToast('Error al actualizar la subcategoría', 'error');
    }
  }
  
  
  handleEditCategory(form, categoryId) {
    const formData = new FormData(form);
    const updatedData = {
      name: Utils.sanitizeInput(formData.get('name')),
      description: Utils.sanitizeInput(formData.get('description') || '')
    };

    if (Storage.updateCategory(categoryId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Categoría actualizada exitosamente', 'success');
    } else {
      Utils.showToast('Error al actualizar la categoría', 'error');
    }
  }
  handleEditExpense(form) {
    const formData = new FormData(form);
    const expenseId = formData.get('expenseId'); // asegurarse de que el input hidden exista
    const updatedData = {
      name: Utils.sanitizeInput(formData.get('name')),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      walletId: formData.get('walletId'),
      subcategoryId: formData.get('subcategoryId')
    };
  
    if (!Utils.validateNumber(updatedData.amount)) {
      Utils.showToast('El monto debe ser un número válido', 'error');
      return;
    }
  
    // Validar saldo de wallet si es necesario
    const wallet = AppState.wallets.find(acc => acc.id === updatedData.walletId);
    if (!wallet || wallet.balance < updatedData.amount) {
      Utils.showToast('Saldo insuficiente en la wallet seleccionada', 'error');
      return;
    }
  
    if (Storage.updateExpense(expenseId, updatedData)) {
      AppState.refreshData();
      window.appEvents.emit('closeModal');
      Utils.showToast('Gasto actualizado exitosamente', 'success');
    } else {
      Utils.showToast('Error al actualizar el gasto', 'error');
    }
  }
  
  handleDeleteCategory(categoryId) {
    if (confirm('¿Seguro que quieres eliminar esta categoría y todas sus subcategorías?')) {
      if (Storage.deleteCategory(categoryId)) {
        AppState.refreshData();
        Utils.showToast('Categoría eliminada', 'success');
      } else {
        Utils.showToast('Error al eliminar la categoría', 'error');
      }
    }
  }

  handleDeleteSubcategory(categoryId, subcategoryId) {
    if (confirm('¿Seguro que quieres eliminar esta subcategoría?')) {
      if (Storage.deleteSubcategory(categoryId, subcategoryId)) {
        AppState.refreshData();
        Utils.showToast('Subcategoría eliminada', 'success');
      } else {
        Utils.showToast('Error al eliminar la subcategoría', 'error');
      }
    }
  }
  handleCreateExpense(form) {
    const formData = new FormData(form);
    const expenseData = {
      name: Utils.sanitizeInput(formData.get('name')),
      amount: parseFloat(formData.get('amount')),
      date: formData.get('date'),
      walletId: formData.get('walletId'),
      subcategoryId: formData.get('subcategoryId')
    };
  
    if (!Utils.validateNumber(expenseData.amount)) {
      Utils.showToast('El monto debe ser un número válido', 'error');
      return;
    }
  
    // Check if wallet has sufficient balance
    const wallet = AppState.wallets.find(acc => acc.id === expenseData.walletId);
    if (!wallet || wallet.balance < expenseData.amount) {
      Utils.showToast('Saldo insuficiente en la wallet seleccionada', 'error');
      return;
    }
  
    if (Storage.addExpense(expenseData)) {
      AppState.refreshData();
  
      // 🔹 Desplegar automáticamente la subcategoría a la que pertenece el gasto
      const category = AppState.categories.find(cat =>
        cat.subcategories.some(sub => sub.id === expenseData.subcategoryId)
      );
      if (category) {
        const sub = category.subcategories.find(s => s.id === expenseData.subcategoryId);
        if (sub) {
          sub.expanded = true; // aseguramos que se muestre expandida
        }
      }
  
      window.appEvents.emit('closeModal');
      Utils.showToast('Gasto agregado exitosamente', 'success');
  
      // 🔹 Forzar render después de marcar expandida
      this.render();
    } else {
      Utils.showToast('Error al agregar el gasto', 'error');
    }
  }
  

  // Helper methods
  getCategoryExpenses(categoryId, expenses) {
    const category = AppState.categories.find(cat => cat.id === categoryId);
    if (!category || !category.subcategories) return [];
    
    const subcategoryIds = category.subcategories.map(sub => sub.id);
    return expenses.filter(expense => subcategoryIds.includes(expense.subcategoryId));
  }

  getCategoryBudget(category) {
    if (!category.subcategories) return 0;
    return category.subcategories.reduce((total, sub) => total + (sub.budget || 0), 0);
  }

  getCategorySpent(categoryId, expenses) {
    const categoryExpenses = this.getCategoryExpenses(categoryId, expenses);
    return categoryExpenses.reduce((total, expense) => total + expense.amount, 0);
  }

  getRemainingTime(endDateStr) {
    const now = new Date();
    // El ciclo termina al FINAL del `endDateStr`, así que el reinicio es al día siguiente a las 00:00
    const endDate = new Date(endDateStr + 'T23:59:59.999');

    const diffMs = endDate - now;

    if (diffMs <= 0) {
        return "Reiniciado";
    }

    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays >= 1) {
        return `${Math.ceil(diffDays)} días`;
    }

    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours >= 1) {
        return `${Math.ceil(diffHours)} horas`;
    }

    const diffMinutes = diffMs / (1000 * 60);
    return `${Math.ceil(diffMinutes)} minutos`;
  }

  getSubcategoryExpenses(subcategoryId, expenses) {
    // Find the subcategory to get its date range
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
        // If no date range, return all expenses for that subcategory (old behavior)
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
    const subcategoryExpenses = this.getSubcategoryExpenses(subcategoryId, expenses);
    return subcategoryExpenses.reduce((total, expense) => total + expense.amount, 0);
  }

  getDefaultStartDate(frequency) {
    const today = new Date();
    let startDate;
  
    switch (frequency) {
      case 'semanal': {
        // Obtener el lunes de la semana actual
        const day = today.getDay(); // 0=domingo, 1=lunes...
        const diff = (day === 0 ? -6 : 1 - day); // ajustar si hoy es domingo
        startDate = new Date(today);
        startDate.setDate(today.getDate() + diff);
        break;
      }
      case 'mensual':
      case 'trimestral': {
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      }
      case 'anual':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = today;
    }
  
    // Formatear a yyyy-mm-dd para el input date
    return startDate.toISOString().split('T')[0];
  }
  resetSubcategoryBudget(categoryId, subcategoryId, allExpenses) {
    // 1. Filtrar gastos de la subcategoría que están dentro del ciclo que termina
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
        // 2. Guardar en histórico
        const enrichedExpenses = expensesToArchive.map(e => ({
            ...e,
            archivedAt: new Date().toISOString(),
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString()
        }));
        Storage.archiveExpenses(enrichedExpenses);

        // 3. Eliminar de la lista activa
        const expenseIdsToArchive = new Set(expensesToArchive.map(e => e.id));
        const remaining = allExpenses.filter(e => !expenseIdsToArchive.has(e.id));
        Storage.saveExpenses(remaining);
    }

    // 4. Actualizar la subcategoría con la nueva fecha de inicio
    const categories = Storage.getCategories();
    const category = categories.find(cat => cat.id === categoryId);
    if (category) {
        const subToUpdate = category.subcategories.find(s => s.id === subcategoryId);
        if (subToUpdate) {
            const nextStartDate = getNextResetDate(subToUpdate.startDate, subToUpdate.frequency);
            // Formatear a YYYY-MM-DD
            const year = nextStartDate.getFullYear();
            const month = String(nextStartDate.getMonth() + 1).padStart(2, '0');
            const day = String(nextStartDate.getDate()).padStart(2, '0');
            
            subToUpdate.startDate = `${year}-${month}-${day}`;
            subToUpdate.endDate = getEndDate(subToUpdate.startDate, subToUpdate.frequency);
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
            // La fecha de reinicio es el día DESPUÉS del `endDate`
            const resetDate = getNextResetDate(sub.startDate, sub.frequency);

            // Si la fecha actual es igual o posterior a la fecha de reinicio, se procede
            if (new Date() >= resetDate) {
                this.resetSubcategoryBudget(category.id, sub.id, allExpenses);
                didReset = true;
            }
        });
    });

    if (didReset) {
        AppState.refreshData();
        Utils.showToast('Algunas subcategorías fueron reiniciadas automáticamente', 'info');
    }
  }
  
}

// Initialize gastos manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new GastosManager();
});
