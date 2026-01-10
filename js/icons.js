// Icon Helper - Sistema centralizado de iconos SVG usando Lucide
class IconHelper {
  /**
   * Crea un elemento de ícono SVG usando Lucide
   * @param {string} iconName - Nombre del ícono de Lucide (ej: 'credit-card', 'calendar')
   * @param {Object} options - Opciones de personalización
   * @param {number} options.size - Tamaño del ícono en px (default: 24)
   * @param {string} options.color - Color del ícono (default: 'currentColor')
   * @param {number} options.strokeWidth - Grosor del trazo (default: 2)
   * @param {string} options.className - Clases CSS adicionales
   * @returns {HTMLElement} Elemento i con el ícono
   */
  static create(iconName, options = {}) {
    const {
      size = 24,
      color = 'currentColor',
      strokeWidth = 2,
      className = ''
    } = options;

    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', iconName);
    icon.style.width = `${size}px`;
    icon.style.height = `${size}px`;
    icon.style.color = color;
    icon.style.strokeWidth = strokeWidth;
    
    if (className) {
      icon.className = className;
    }

    return icon;
  }

  /**
   * Reemplaza un elemento con un ícono SVG
   * @param {HTMLElement} element - Elemento a reemplazar
   * @param {string} iconName - Nombre del ícono de Lucide
   * @param {Object} options - Opciones de personalización
   */
  static replace(element, iconName, options = {}) {
    const icon = this.create(iconName, options);
    element.replaceWith(icon);
    
    // Inicializar el ícono de Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    return icon;
  }

  /**
   * Agrega un ícono como hijo de un elemento
   * @param {HTMLElement} parent - Elemento padre
   * @param {string} iconName - Nombre del ícono de Lucide
   * @param {Object} options - Opciones de personalización
   */
  static append(parent, iconName, options = {}) {
    const icon = this.create(iconName, options);
    parent.appendChild(icon);
    
    // Inicializar el ícono de Lucide
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
    
    return icon;
  }

  /**
   * Inicializa todos los iconos de Lucide en el documento
   */
  static initAll() {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  /**
   * Mapeo de iconos para la aplicación
   * Centraliza todos los iconos usados en la app
   */
  static icons = {
    // Quick Actions
    quickExpense: 'credit-card',      // Gasto rápido
    schedulePayment: 'calendar-clock', // Programar pago
    addIncome: 'piggy-bank',          // Ingresar a wallet
    transfer: 'arrow-left-right',     // Transferir

    // Navegación
    wallets: 'wallet',                // Pestaña Wallets
    payments: 'calendar-check',       // Pestaña Pagos
    expenses: 'receipt',              // Pestaña Gastos
    summary: 'bar-chart-3',           // Pestaña Resumen
    settings: 'settings',             // Opciones

    // Acciones comunes
    add: 'plus',                      // Agregar
    edit: 'pencil',                   // Editar
    delete: 'trash-2',                // Eliminar
    close: 'x',                       // Cerrar
    check: 'check',                   // Confirmar
    search: 'search',                 // Buscar
    filter: 'filter',                 // Filtrar
    
    // Estados
    success: 'check-circle',          // Éxito
    error: 'alert-circle',            // Error
    warning: 'alert-triangle',        // Advertencia
    info: 'info',                     // Información

    // Otros
    menu: 'menu',                     // Menú hamburguesa
    chevronDown: 'chevron-down',      // Flecha abajo
    chevronUp: 'chevron-up',          // Flecha arriba
    chevronLeft: 'chevron-left',      // Flecha izquierda
    chevronRight: 'chevron-right',    // Flecha derecha
  };

  /**
   * Obtiene el nombre del ícono desde el mapeo
   * @param {string} key - Clave del ícono en el mapeo
   * @returns {string} Nombre del ícono de Lucide
   */
  static getIcon(key) {
    return this.icons[key] || 'circle';
  }
}

// Hacer disponible globalmente
window.IconHelper = IconHelper;
