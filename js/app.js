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

      // Initialize IndexedDB storage
      console.log('Initializing IndexedDB...');
      const dbInitialized = await Storage.init();
      if (!dbInitialized) {
        console.warn('IndexedDB initialization failed, some features may not work');
      }

      // Initialize app state (wait for data to load)
      await AppState.init();
      
      // Register service worker for PWA functionality
      this.registerServiceWorker();
      
      // Setup global error handling
      this.setupErrorHandling();
      
      // Setup keyboard shortcuts
      this.setupKeyboardShortcuts();

      // Setup reset app button
      this.setupResetButton();
      
      // Mark as initialized
      this.isInitialized = true;
      
      console.log('GinbertFi app initialized successfully');
      
      // Emit event to notify all managers that app is ready
      window.appEvents.emit('appInitialized');
      
    } catch (error) {
      console.error('Error initializing GinbertFi app:', error);
      Helpers.showToast('Error al inicializar la aplicación', 'error');
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
      Helpers.showToast('Ha ocurrido un error inesperado', 'error');
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      Helpers.showToast('Error en la aplicación', 'error');
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

  setupResetButton() {
    const resetBtn = document.getElementById('resetAppBtn');
    if (!resetBtn) return;

    resetBtn.addEventListener('click', async () => {
      if (confirm('⚠️ Esto eliminará TODOS tus datos y reiniciará la aplicación. ¿Continuar?')) {
        try {
          // Limpiar localStorage y sessionStorage
          localStorage.clear();
          sessionStorage.clear();

          // Limpiar IndexedDB
          if (DBConfig.isSupported()) {
            // Cerrar conexión si existe
            if (DBConfig._dbInstance) {
              DBConfig._dbInstance.close();
              DBConfig._dbInstance = null;
            }
            
            const dbName = DBConfig.DB_NAME;
            const deleteRequest = indexedDB.deleteDatabase(dbName);
            
            deleteRequest.onsuccess = () => {
              console.log('IndexedDB deleted successfully');
              location.reload();
            };
            
            deleteRequest.onerror = () => {
              console.error('Error deleting IndexedDB');
              location.reload();
            };
          } else {
            location.reload();
          }

          // Limpiar estado global si existe
          if (window.AppState) {
            window.AppState.categories = [];
            window.AppState.wallets = [];
            window.AppState.expenses = [];
          }
        } catch (err) {
          console.error('Error al reiniciar la app:', err);
          Helpers.showToast('No se pudo reiniciar la aplicación', 'error');
        }
      }
    });
  }
}

// Initialize the app
const app = new GinbertFiApp();
