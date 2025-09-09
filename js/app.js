// Main app initialization and coordination
class GinbertFiApp {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Wait for DOM to be fully loaded
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Initialize app state
      AppState.init();

      // Initialize the singleton ModalManager
      new ModalManager();
      
      // Register service worker for PWA functionality
      this.registerServiceWorker();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('GinbertFi app initialized successfully');
      
    } catch (error) {
      console.error('Error initializing GinbertFi app:', error);
      Utils.showToast('Error al inicializar la aplicación', 'error');
    }
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            console.log('Service Worker registered successfully:', registration.scope);
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  }

  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      Utils.showToast('Ha ocurrido un error inesperado', 'error');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      Utils.showToast('Error en la aplicación', 'error');
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when no modal is open
      if (document.querySelector('.modal-overlay.show')) return;
      
      // Alt + 1: Switch to Huchas
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        window.appEvents.emit('switchTab', 'huchas');
      }
      
      // Alt + 2: Switch to Gastos
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        window.appEvents.emit('switchTab', 'gastos');
      }
      
      // Alt + 3: Switch to Resumen
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        window.appEvents.emit('switchTab', 'resumen');
      }
      
      // Escape: Close any open dropdowns
      if (e.key === 'Escape') {
        const balanceDropdown = document.getElementById('balanceDropdown');
        if (balanceDropdown && balanceDropdown.classList.contains('show')) {
          balanceDropdown.classList.remove('show');
          document.getElementById('balanceSelector').classList.remove('open');
        }
      }
    });
  }
}

// Initialize the app
const app = new GinbertFiApp();
