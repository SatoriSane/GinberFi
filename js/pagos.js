// Pagos tab functionality - Scheduled payments management
class PagosManager {
  constructor() {
    this.pagosContainer = document.getElementById('pagosContainer');
    this.emptyPagosState = document.getElementById('emptyPagosState');
    this.addPaymentBtn = document.getElementById('addPaymentBtn');
    this.addPaymentFab = document.getElementById('addPaymentFab');
    
    this.scheduledRepo = new ScheduledPaymentRepository();
    this.payments = [];
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.render();
    
    // Listen for app initialization
    window.appEvents.on('appInitialized', () => {
      this.render();
    });
    
    // Listen for data updates
    window.appEvents.on('dataUpdated', () => {
      this.render();
    });
    
    // Listen for tab changes
    window.appEvents.on('tabChanged', (tabName) => {
      if (tabName === 'pagos') {
        this.render();
      }
    });
  }
  
  setupEventListeners() {
    // Hacer la instancia accesible globalmente
    window.pagosManager = this;

    // Botón del estado vacío
    this.addPaymentBtn.addEventListener('click', () => {
      this.openCreatePaymentModal();
    });

    // FAB para agregar pago
    this.addPaymentFab.addEventListener('click', () => {
      this.openCreatePaymentModal();
    });

    // Handle form submissions
    document.addEventListener('submit', async (e) => {
      const form = e.target;

      switch (form.id) {
        case 'scheduledPaymentForm':
          e.preventDefault();
          await this.handleCreatePayment(form);
          break;
        case 'editScheduledPaymentForm':
          e.preventDefault();
          await this.handleEditPayment(form);
          break;
        case 'executePaymentForm':
          e.preventDefault();
          await this.handleExecutePayment(form);
          break;
      }
    });
  }

  async render() {
    // Load payments from IndexedDB
    this.payments = await this.scheduledRepo.getAll() || [];
    
    if (this.payments.length === 0) {
      this.pagosContainer.innerHTML = '';
      this.pagosContainer.appendChild(this.emptyPagosState);
      this.emptyPagosState.style.display = 'block';
      this.addPaymentFab.style.display = 'none';
    } else {
      this.emptyPagosState.style.display = 'none';
      this.addPaymentFab.style.display = 'flex';
      
      const html = await this.generateHTML();
      this.pagosContainer.innerHTML = html + this.emptyPagosState.outerHTML;
      
      // Recuperar la referencia al estado vacío
      this.emptyPagosState = this.pagosContainer.querySelector('#emptyPagosState');
      
      this.attachEventListeners();
    }
  }

  async generateHTML() {
    const overdue = await this.scheduledRepo.getOverdue();
    const upcoming = await this.scheduledRepo.getUpcoming(7);
    const thisMonth = await this.scheduledRepo.getThisMonth();
    const future = await this.scheduledRepo.getFuture();

    // Filter to avoid duplicates (payments can appear in multiple categories)
    const upcomingFiltered = upcoming.filter(p => !overdue.find(o => o.id === p.id));
    const thisMonthFiltered = thisMonth.filter(p => 
      !overdue.find(o => o.id === p.id) && 
      !upcoming.find(u => u.id === p.id)
    );
    const futureFiltered = future.filter(p => 
      !overdue.find(o => o.id === p.id) && 
      !upcoming.find(u => u.id === p.id) && 
      !thisMonth.find(t => t.id === p.id)
    );

    let html = '';

    // Overdue section
    if (overdue.length > 0) {
      html += this.renderSection('🔴 VENCIDOS', overdue, 'overdue');
    }

    // Upcoming section (next 7 days)
    if (upcomingFiltered.length > 0) {
      html += this.renderSection('⚠️ PRÓXIMOS 7 DÍAS', upcomingFiltered, 'upcoming');
    }

    // This month section
    if (thisMonthFiltered.length > 0) {
      html += this.renderSection('📅 ESTE MES', thisMonthFiltered, 'this-month');
    }

    // Future section
    if (futureFiltered.length > 0) {
      html += this.renderSection('📆 FUTUROS', futureFiltered, 'future');
    }

    return html;
  }

  renderSection(title, payments, sectionClass) {
    const count = payments.length;
    const total = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return `
      <div class="pagos-section ${sectionClass}">
        <div class="pagos-section-header">
          <h3 class="pagos-section-title">${title} (${count})</h3>
          <span class="pagos-section-total">${Helpers.formatCurrency(total)}</span>
        </div>
        <div class="pagos-list">
          ${payments.map(p => this.renderPaymentItem(p)).join('')}
        </div>
      </div>
    `;
  }

  renderPaymentItem(payment) {
    const wallet = AppState.wallets.find(w => w.id === payment.walletId);
    const category = AppState.categories.find(c => c.id === payment.categoryId);
    let subcategory = null;
    if (category) {
      subcategory = category.subcategories.find(s => s.id === payment.subcategoryId);
    }

    const currency = wallet ? wallet.currency : 'BOB';
    const recurrenceIcon = payment.isRecurring ? '⟳' : '';
    const recurrenceText = this.getRecurrenceText(payment.recurrence);
    
    // Calculate days until due
    const daysUntil = this.getDaysUntilDue(payment.dueDate);
    const dueDateText = daysUntil === 0 ? 'HOY' : 
                        daysUntil === 1 ? 'MAÑANA' :
                        daysUntil < 0 ? `VENCIDO ${Math.abs(daysUntil)}d` :
                        Helpers.formatDate(payment.dueDate);

    return `
      <div class="payment-item" data-payment-id="${payment.id}">
        <div class="payment-main">
          <div class="payment-info">
            <div class="payment-name">${payment.name}</div>
            <div class="payment-details">
              <span class="payment-date ${daysUntil < 0 ? 'overdue' : ''}">${dueDateText}</span>
              ${category ? `<span class="payment-category">🏷️ ${category.name}</span>` : ''}
              ${subcategory ? `<span class="payment-subcategory">${subcategory.name}</span>` : ''}
              ${payment.isRecurring ? `<span class="payment-recurrence">${recurrenceIcon} ${recurrenceText}</span>` : ''}
            </div>
          </div>
          <div class="payment-amount-container">
            <div class="payment-amount">${Helpers.formatCurrency(payment.amount, currency)}</div>
            ${wallet ? `<div class="payment-wallet">${wallet.name}</div>` : ''}
          </div>
        </div>
        <div class="payment-actions">
          <button class="payment-action-btn pay-btn" data-payment-id="${payment.id}" title="Registrar pago">
            ✓ Pagar
          </button>
          <button class="payment-action-btn edit-btn" data-payment-id="${payment.id}" title="Editar">
            ✏️
          </button>
          <button class="payment-action-btn postpone-btn" data-payment-id="${payment.id}" title="Posponer">
            ⏰
          </button>
        </div>
      </div>
    `;
  }

  getRecurrenceText(recurrence) {
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

  getDaysUntilDue(dueDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  attachEventListeners() {
    // Pay buttons
    this.pagosContainer.querySelectorAll('.pay-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const paymentId = btn.dataset.paymentId;
        this.openExecutePaymentModal(paymentId);
      });
    });

    // Edit buttons
    this.pagosContainer.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const paymentId = btn.dataset.paymentId;
        this.openEditPaymentModal(paymentId);
      });
    });

    // Postpone buttons
    this.pagosContainer.querySelectorAll('.postpone-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const paymentId = btn.dataset.paymentId;
        this.openPostponeModal(paymentId);
      });
    });

    // Click on payment item to view details
    this.pagosContainer.querySelectorAll('.payment-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.payment-actions')) {
          const paymentId = item.dataset.paymentId;
          this.openPaymentDetailsModal(paymentId);
        }
      });
    });
  }

  // Modal handlers
  openCreatePaymentModal() {
    if (AppState.wallets.length === 0) {
      Helpers.showToast('Primero debes crear una wallet en la pestaña Wallets', 'warning');
      return;
    }
    
    const modalData = ModalManager.createScheduledPaymentModal();
    window.appEvents.emit('openModal', modalData);
  }

  async openEditPaymentModal(paymentId) {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const modalData = ModalManager.editScheduledPaymentModal(payment);
    window.appEvents.emit('openModal', modalData);
  }

  async openExecutePaymentModal(paymentId) {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const modalData = ModalManager.executePaymentModal(payment);
    window.appEvents.emit('openModal', modalData);
  }

  async openPostponeModal(paymentId) {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const days = prompt('¿Cuántos días deseas posponer el pago?', '7');
    if (!days || isNaN(days)) return;

    const success = await this.scheduledRepo.postponePayment(paymentId, parseInt(days));
    if (success) {
      Helpers.showToast(`Pago pospuesto ${days} días`, 'success');
      this.render();
    } else {
      Helpers.showToast('Error al posponer el pago', 'error');
    }
  }

  async openPaymentDetailsModal(paymentId) {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return;

    const modalData = ModalManager.paymentDetailsModal(payment);
    window.appEvents.emit('openModal', modalData);
  }

  // Form handlers
  async handleCreatePayment(form) {
    const formData = new FormData(form);
    
    const paymentData = {
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

    // Find category from subcategory
    const category = AppState.categories.find(cat =>
      cat.subcategories.some(sub => sub.id === paymentData.subcategoryId)
    );
    
    if (category) {
      paymentData.categoryId = category.id;
    }

    if (!Helpers.validateNumber(paymentData.amount)) {
      Helpers.showToast('El monto debe ser un número válido', 'error');
      return;
    }

    const success = await this.scheduledRepo.addScheduledPayment(paymentData);
    if (success) {
      Helpers.showToast('Pago programado creado exitosamente', 'success');
      window.appEvents.emit('closeModal');
      this.render();
    } else {
      Helpers.showToast('Error al crear el pago programado', 'error');
    }
  }

  async handleEditPayment(form) {
    const formData = new FormData(form);
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

    // Find category from subcategory
    const category = AppState.categories.find(cat =>
      cat.subcategories.some(sub => sub.id === updatedData.subcategoryId)
    );
    
    if (category) {
      updatedData.categoryId = category.id;
    }

    const payment = await this.scheduledRepo.getById(paymentId);
    if (!payment) {
      Helpers.showToast('Pago no encontrado', 'error');
      return;
    }

    Object.assign(payment, updatedData);
    
    const success = await this.scheduledRepo.update(payment);
    if (success) {
      Helpers.showToast('Pago actualizado exitosamente', 'success');
      window.appEvents.emit('closeModal');
      this.render();
    } else {
      Helpers.showToast('Error al actualizar el pago', 'error');
    }
  }

  async handleExecutePayment(form) {
    const formData = new FormData(form);
    const paymentId = formData.get('paymentId');
    const action = formData.get('action'); // 'pay', 'skip'
    const actualDate = formData.get('actualDate');
    
    const payment = await this.scheduledRepo.getById(paymentId);
    if (!payment) {
      Helpers.showToast('Pago no encontrado', 'error');
      return;
    }

    if (action === 'pay') {
      // Create expense
      const expenseData = {
        name: payment.name,
        amount: payment.amount,
        date: actualDate || payment.dueDate,
        walletId: payment.walletId,
        subcategoryId: payment.subcategoryId,
        categoryId: payment.categoryId
      };

      // Check wallet balance
      const wallet = AppState.wallets.find(w => w.id === payment.walletId);
      if (!wallet || wallet.balance < payment.amount) {
        Helpers.showToast('Saldo insuficiente en la wallet seleccionada', 'error');
        return;
      }

      // Add expense
      const expenseSuccess = await Storage.addExpense(expenseData);
      if (!expenseSuccess) {
        Helpers.showToast('Error al registrar el gasto', 'error');
        return;
      }

      // Mark payment as paid
      const paymentSuccess = await this.scheduledRepo.markAsPaid(paymentId, actualDate);
      if (paymentSuccess) {
        await AppState.refreshData();
        Helpers.showToast('Pago registrado exitosamente', 'success');
        window.appEvents.emit('closeModal');
        this.render();
      } else {
        Helpers.showToast('Error al actualizar el pago programado', 'error');
      }
    } else if (action === 'skip') {
      const reason = formData.get('skipReason') || '';
      const success = await this.scheduledRepo.skipPayment(paymentId, reason);
      if (success) {
        Helpers.showToast('Pago omitido', 'success');
        window.appEvents.emit('closeModal');
        this.render();
      } else {
        Helpers.showToast('Error al omitir el pago', 'error');
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PagosManager();
  });
} else {
  new PagosManager();
}
