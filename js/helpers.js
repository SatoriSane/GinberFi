// helpers.js - universal para gastos.js y modals.js
// No usa módulos ES, carga directa en el navegador

window.Helpers = {
    // ------------------------------
    // 🗓 Manejo de fechas y períodos
    // ------------------------------
    formatDateLocalYYYYMMDD(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    getDefaultStartDate(frequency) {
        const today = new Date();
        today.setHours(0,0,0,0);

        switch (frequency) {
            case 'semanal': {
                const day = today.getDay();
                const diff = (day === 0 ? -6 : 1 - day);
                const monday = new Date(today);
                monday.setDate(today.getDate() + diff);
                return this.formatDateLocalYYYYMMDD(monday);
            }
            case 'mensual':
                return this.formatDateLocalYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), 1));
            case 'trimestral': {
                const quarterMonth = today.getMonth() - (today.getMonth() % 3);
                return this.formatDateLocalYYYYMMDD(new Date(today.getFullYear(), quarterMonth, 1));
            }
            case 'anual':
                return this.formatDateLocalYYYYMMDD(new Date(today.getFullYear(),0,1));
            default:
                return this.formatDateLocalYYYYMMDD(today);
        }
    },

    getNextResetDate(startDateStr, frequency) {
        const startDate = new Date(startDateStr + 'T00:00:00');
        const next = new Date(startDate);
        switch(frequency) {
            case 'semanal': next.setDate(startDate.getDate()+7); break;
            case 'mensual': next.setMonth(startDate.getMonth()+1); break;
            case 'trimestral': next.setMonth(startDate.getMonth()+3); break;
            case 'anual': next.setFullYear(startDate.getFullYear()+1); break;
        }
        next.setHours(0,0,0,0);
        return next;
    },

    getEndDate(startDateStr, frequency) {
        const startDate = new Date(startDateStr + 'T00:00:00');
        const endDate = new Date(startDate);

        switch(frequency) {
            case 'semanal': endDate.setDate(startDate.getDate()+6); break;
            case 'mensual': endDate.setMonth(startDate.getMonth()+1); endDate.setDate(0); break;
            case 'trimestral': endDate.setMonth(startDate.getMonth()+3); endDate.setDate(0); break;
            case 'anual': endDate.setFullYear(startDate.getFullYear()+1); endDate.setDate(0); break;
        }
        return this.formatDateLocalYYYYMMDD(endDate);
    },

    formatLocalDate(dateStr) {
        const d = new Date(dateStr + 'T00:00:00');
        return d.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    },

    getRemainingTime(endDateStr) {
        const now = new Date();
        const endDate = new Date(endDateStr + 'T23:59:59.999');
        const diffMs = endDate - now;
        if (diffMs <= 0) return "Reiniciado";

        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        if (diffDays >= 1) return `${Math.ceil(diffDays)} días`;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (diffHours >= 1) return `${Math.ceil(diffHours)} horas`;
        const diffMinutes = diffMs / (1000 * 60);
        return `${Math.ceil(diffMinutes)} minutos`;
    },

    // ------------------------------
    // 📊 Cálculos y formato
    // ------------------------------
    calculateProgress(spent, total) {
        if (!total) return 0;
        return Math.min((spent / total) * 100, 100);
    },


    formatCurrency(amount, currency = 'BOB') {
        const currencySymbols = {
            'BOB': 'Bs',
            'USD': '$',
            'EUR': '€',
            'BCH': 'BCH'
        };
        const numericAmount = (!amount && amount !== 0) ? 0 : parseFloat(amount);
        const validAmount = isNaN(numericAmount) ? 0 : numericAmount;
        const formatted = validAmount.toFixed(2);
        const symbol = currencySymbols[currency] || currency;
        return `${formatted} ${symbol}`;
    },

    formatDate(dateStr) {
        if (!dateStr) return 'Invalid Date';
        let date;
        if (typeof dateStr === 'string') {
            const parts = dateStr.slice(0,10).split('-');
            if (parts.length !== 3) return 'Invalid Date';
            date = new Date(parts[0], parts[1]-1, parts[2]);
        } else if (dateStr instanceof Date) {
            date = dateStr;
        } else {
            return 'Invalid Date';
        }
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    },

    validateNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value) && value >= 0;
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    sanitizeInput(str) {
        if (!str) return '';
        return str.toString().trim().replace(/[<>]/g, '');
    },

    getCurrentLocalDateISO() {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // offset en milisegundos
        const localTime = new Date(now.getTime() - offset);
        return localTime.toISOString();
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => { clearTimeout(timeout); func(...args); };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    },

    // ------------------------------
    // 🖱️ Helpers de modales
    // ------------------------------
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
    
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translate(-50%, -150%); /* empieza oculto arriba */
                    background: var(--white);
                    color: var(--dark-blue);
                    padding: var(--spacing-md) var(--spacing-lg);
                    border-radius: var(--radius-md);
                    box-shadow: var(--shadow-lg);
                    z-index: 2000;
                    max-width: 90%;
                    text-align: center;
                    transition: transform 0.4s ease, opacity 0.4s ease;
                    opacity: 0;
                }
                .toast.toast-success { border-top: 4px solid var(--color-success); }
                .toast.toast-error { border-top: 4px solid var(--color-error); }
                .toast.toast-warning { border-top: 4px solid var(--color-warning); }
                .toast.toast-info { border-top: 4px solid var(--color-info); }
                .toast.show {
                    transform: translate(-50%, 0); /* baja hacia el centro superior */
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }
    
        document.body.appendChild(toast);
    
        // Animar entrada
        setTimeout(() => toast.classList.add('show'), 50);
    
        // Animar salida
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 400);
        }, 3000);
    },
    

    confirmDialog(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header"><h3 class="modal-title">Confirmar</h3></div>
                <div class="modal-body"><p>${message}</p></div>
                <div class="modal-footer">
                    <button class="btn-secondary cancel-btn">Cancelar</button>
                    <button class="btn-primary confirm-btn">Confirmar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const cleanup = () => { overlay.classList.remove('show'); setTimeout(() => document.body.removeChild(overlay), 300); };
        overlay.querySelector('.confirm-btn').addEventListener('click', () => { cleanup(); if (onConfirm) onConfirm(); });
        overlay.querySelector('.cancel-btn').addEventListener('click', () => { cleanup(); if (onCancel) onCancel(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { cleanup(); if (onCancel) onCancel(); } });
    },

    openModal(modalData) {
        if (!window.appEvents) return;
        window.appEvents.emit('openModal', modalData);
    },

    closeModal() {
        if (!window.appEvents) return;
        window.appEvents.emit('closeModal');
    },

    confirmAction(message) {
        return confirm(message);
    },

    /**
     * Muestra un modal de error con detalles técnicos copiables
     * @param {string} title - Título del error
     * @param {string} message - Mensaje principal para el usuario
     * @param {object} technicalDetails - Detalles técnicos del error
     */
    showErrorModal(title, message, technicalDetails = {}) {
        const errorId = Date.now().toString();
        const timestamp = new Date().toISOString();
        
        // Crear string de detalles técnicos
        const detailsText = JSON.stringify({
            errorId,
            timestamp,
            userAgent: navigator.userAgent,
            ...technicalDetails
        }, null, 2);

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay show';
        overlay.style.zIndex = '10000';
        
        overlay.innerHTML = `
            <div class="modal error-modal" style="max-width: 600px;">
                <div class="modal-header" style="background-color: #fee; border-bottom: 2px solid #f44;">
                    <h3 class="modal-title" style="color: #c00;">⚠️ ${title}</h3>
                </div>
                <div class="modal-body">
                    <p style="margin-bottom: 1rem; font-size: 1.1em;">${message}</p>
                    
                    <div style="background: #f5f5f5; padding: 1rem; border-radius: 8px; margin-top: 1rem;">
                        <p style="margin-bottom: 0.5rem; font-weight: 600;">Detalles técnicos (puedes copiar esto):</p>
                        <textarea 
                            id="errorDetails_${errorId}" 
                            readonly 
                            style="width: 100%; height: 200px; font-family: monospace; font-size: 0.85em; padding: 0.5rem; border: 1px solid #ddd; border-radius: 4px; resize: vertical;"
                        >${detailsText}</textarea>
                        <button 
                            id="copyErrorBtn_${errorId}" 
                            class="btn-secondary" 
                            style="margin-top: 0.5rem; width: 100%;"
                        >
                            📋 Copiar detalles
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary close-error-btn" style="width: 100%;">Entendido</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);

        // Botón copiar
        const copyBtn = overlay.querySelector(`#copyErrorBtn_${errorId}`);
        const textarea = overlay.querySelector(`#errorDetails_${errorId}`);
        
        copyBtn.addEventListener('click', () => {
            textarea.select();
            document.execCommand('copy');
            copyBtn.textContent = '✅ Copiado!';
            setTimeout(() => {
                copyBtn.textContent = '📋 Copiar detalles';
            }, 2000);
        });

        // Botón cerrar
        const closeBtn = overlay.querySelector('.close-error-btn');
        closeBtn.addEventListener('click', () => {
            overlay.classList.remove('show');
            setTimeout(() => document.body.removeChild(overlay), 300);
        });

        // No permitir cerrar haciendo click fuera del modal (error importante)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                // Hacer que el modal "rebote" para indicar que debe cerrarse con el botón
                const modal = overlay.querySelector('.modal');
                modal.style.animation = 'shake 0.3s';
                setTimeout(() => {
                    modal.style.animation = '';
                }, 300);
            }
        });
    },

    // ------------------------------
    // 💾 Helpers de almacenamiento
    // ------------------------------
    async archiveExpenses(expenses) {
        if (!Storage || !expenses?.length) return;
        await Storage.archiveExpenses(expenses);
    },
    /**
 * Construye un <select> con todas las subcategorías, agrupadas por categoría.
 * @param {string|null} selectedId - id de subcategoría seleccionada por defecto
 * @param {string|null} excludeSubcategoryId - id de subcategoría que debe excluirse (ej: la que se está eliminando)
 * @returns {HTMLSelectElement} - el <select> ya armado
 */
buildSubcategorySelect(selectedId = null, excludeSubcategoryId = null) {
    const select = document.createElement('select');
    select.name = 'targetSubcategory';

    // opción inicial
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '-- Selecciona una subcategoría --';
    select.appendChild(placeholder);

    const categories = AppState.categories || [];
    categories.forEach(cat => {
        if (!cat.subcategories?.length) return;

        const optgroup = document.createElement('optgroup');
        optgroup.label = cat.name;

        cat.subcategories.forEach(sub => {
            if (!sub.id || !sub.name) return;
            if (excludeSubcategoryId && sub.id === excludeSubcategoryId) return;

            const option = document.createElement('option');
            option.value = sub.id;
            option.textContent = sub.name;

            if (selectedId && selectedId === sub.id) {
                option.selected = true;
            }

            optgroup.appendChild(option);
        });

        if (optgroup.children.length) {
            select.appendChild(optgroup);
        }
    });

    return select;
},
/**
 * Construye un <select> con todas las categorías disponibles.
 * @param {string|null} selectedId - ID de la categoría que debe aparecer seleccionada (opcional).
 * @param {string|null} excludeId - ID de la categoría que debe excluirse de la lista (opcional).
 * @returns {HTMLSelectElement} - Elemento <select> listo para insertar en el DOM.
 */
 buildCategorySelect(selectedId = null, excludeId = null) {
    const select = document.createElement('select');
    select.name = 'targetCategory';
    select.required = true;
  
    // Opción por defecto
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Selecciona una categoría --';
    select.appendChild(defaultOption);
  
    const categories = AppState.categories || [];
    categories.forEach(cat => {
      if (!cat.id || cat.id === excludeId) return;
  
      const option = document.createElement('option');
      option.value = cat.id;
      option.textContent = cat.name;
      if (selectedId && cat.id === selectedId) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  
    return select;
  }
  


};
