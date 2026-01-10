// Theme Manager - Centraliza la lógica de temas
class ThemeManager {
  static getCurrentTheme() {
    return localStorage.getItem('ginbertfi_theme') || 'light';
  }

  static isTheme(themeName) {
    return this.getCurrentTheme() === themeName;
  }

  static isDarkTheme() {
    return this.isTheme('dark');
  }

  // Detectar si el tema actual es oscuro (dark, midnight, starry, etc.)
  static isDarkVariant() {
    const theme = this.getCurrentTheme();
    const darkThemes = ['dark', 'midnight', 'starry'];
    return darkThemes.includes(theme);
  }

  // Colores adaptativos para presupuestos según el tema
  static getBudgetColors(percentage) {
    // Usar variables CSS que se adaptan automáticamente al tema
    if (percentage >= 90) {
      return {
        background: 'var(--budget-danger-bg)',
        border: 'var(--budget-danger-border)'
      };
    } else if (percentage >= 70) {
      return {
        background: 'var(--budget-warning-bg)',
        border: 'var(--budget-warning-border)'
      };
    } else if (percentage >= 50) {
      return {
        background: 'var(--budget-good-bg)',
        border: 'var(--budget-good-border)'
      };
    } else {
      return {
        background: 'var(--budget-excellent-bg)',
        border: 'var(--budget-excellent-border)'
      };
    }
  }

  // Colores para categorías sin clasificar
  static getUnclassifiedColors() {
    return {
      background: 'var(--unclassified-bg)',
      border: 'var(--unclassified-border)'
    };
  }

  // Colores para gráficos (valores computados para Chart.js)
  static getChartColors() {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      primary: computedStyle.getPropertyValue('--chart-primary').trim(),
      primaryAlpha: computedStyle.getPropertyValue('--chart-primary-alpha').trim()
    };
  }


  // Aplicar tema a elementos dinámicos
  static applyThemeToElement(element, themeClass) {
    if (this.isDarkTheme()) {
      element.classList.add(`${themeClass}-dark`);
      element.classList.remove(`${themeClass}-light`);
    } else {
      element.classList.add(`${themeClass}-light`);
      element.classList.remove(`${themeClass}-dark`);
    }
  }

  // Obtener clases CSS según el tema actual
  static getThemeClasses(baseClass) {
    const theme = this.getCurrentTheme();
    return `${baseClass} ${baseClass}-${theme}`;
  }

  // Listener para cambios de tema
  static onThemeChange(callback) {
    // Observar cambios en localStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'ginbertfi_theme') {
        callback(e.newValue);
      }
    });

    // También observar cambios en la clase del body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const isDark = document.body.classList.contains('dark-theme');
          callback(isDark ? 'dark' : 'light');
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    });

    return observer;
  }

  // Actualizar iconos según el tema (ahora se hace automáticamente con CSS filters)
  static updateThemeIcons() {
    // Los colores de los iconos ahora se adaptan automáticamente con CSS
    // en /css/icon-colors.css usando filtros según el tema activo
    // Ya no es necesario cambiar el src de las imágenes
    console.log('Iconos adaptados automáticamente al tema:', this.getCurrentTheme());
  }
}

// Hacer disponible globalmente
window.ThemeManager = ThemeManager;
