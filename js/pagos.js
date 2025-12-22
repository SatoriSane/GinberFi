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
    
    // Calculate days until due
    const daysUntil = this.getDaysUntilDue(payment.dueDate);
    const dueDateText = daysUntil === 0 ? 'HOY' : 
                        daysUntil === 1 ? 'MAÑANA' :
                        daysUntil < 0 ? `VENCIDO` :
                        Helpers.formatDate(payment.dueDate);

    return `
      <div class="payment-item" data-payment-id="${payment.id}">
        <div class="payment-item-content">
          <div class="payment-left">
            <div class="payment-title">
              ${payment.name}
              ${payment.isRecurring ? `<span class="recurring-indicator">⟳</span>` : ''}
            </div>
            <div class="payment-subtitle">
              ${subcategory ? `${category.name} · ${subcategory.name}` : ''}
            </div>
          </div>
          <div class="payment-right">
            <div class="payment-date-badge ${daysUntil < 0 ? 'overdue' : ''}">${dueDateText}</div>
            <div class="payment-amount">${Helpers.formatCurrency(payment.amount, currency)}</div>
          </div>
        </div>
        <button class="payment-action-btn" data-payment-id="${payment.id}" title="Registrar pago">
          Pagar
        </button>
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
    this.pagosContainer.querySelectorAll('.payment-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const paymentId = btn.dataset.paymentId;
        this.openExecutePaymentModal(paymentId);
      });
    });

    // Click on payment item content to edit
    this.pagosContainer.querySelectorAll('.payment-item-content').forEach(content => {
      content.addEventListener('click', (e) => {
        const paymentId = content.closest('.payment-item').dataset.paymentId;
        this.openEditPaymentModal(paymentId);
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
    const actualDate = formData.get('actualDate');
    const walletId = formData.get('walletId'); // Wallet seleccionada en el formulario
    
    const payment = await this.scheduledRepo.getById(paymentId);
    if (!payment) {
      Helpers.showToast('Pago no encontrado', 'error');
      return;
    }

    // Create expense with selected wallet
    const expenseData = {
      name: payment.name,
      amount: payment.amount,
      date: actualDate || payment.dueDate,
      walletId: walletId, // Usar la wallet seleccionada
      subcategoryId: payment.subcategoryId,
      categoryId: payment.categoryId
    };

    // Check wallet balance
    const wallet = AppState.wallets.find(w => w.id === walletId);
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
