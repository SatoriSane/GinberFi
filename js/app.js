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
            
            // Verificar actualizaciones cada 60 segundos
            setInterval(() => {
              registration.update();
            }, 60000);
            
            // Detectar cuando hay una actualización disponible
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              console.log('Nueva versión de la app detectada, instalando...');
              
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Hay una nueva versión disponible
                  console.log('Nueva versión instalada, esperando activación');
                  this.showUpdateNotification();
                }
              });
            });
          })
          .catch(error => {
            console.log('Service Worker registration failed:', error);
          });
        
        // Detectar cuando el nuevo SW toma control
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          refreshing = true;
          console.log('Nueva versión activada, recargando...');
          window.location.reload();
        });
      });
    }
  }
  
  showUpdateNotification() {
    // Crear notificación de actualización
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-content">
        <span class="update-icon">🔄</span>
        <div class="update-text">
          <strong>Nueva versión disponible</strong>
          <p>Hay una actualización de GinbertFi lista para instalar</p>
        </div>
        <button class="update-btn" id="updateAppBtn">Actualizar ahora</button>
        <button class="update-dismiss" id="dismissUpdateBtn">×</button>
      </div>
    `;
    
    // Agregar estilos si no existen
    if (!document.querySelector('#update-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'update-notification-styles';
      style.textContent = `
        .update-notification {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--white);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-xl);
          z-index: 9999;
          max-width: 90%;
          width: 500px;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
          }
        }
        
        .update-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          position: relative;
        }
        
        .update-icon {
          font-size: 32px;
          flex-shrink: 0;
        }
        
        .update-text {
          flex: 1;
        }
        
        .update-text strong {
          display: block;
          color: var(--dark-blue);
          margin-bottom: 4px;
        }
        
        .update-text p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
        
        .update-btn {
          background: var(--primary-color);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.2s;
        }
        
        .update-btn:hover {
          background: var(--primary-dark);
        }
        
        .update-dismiss {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
        }
        
        .update-dismiss:hover {
          color: var(--dark-blue);
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Botón para actualizar
    document.getElementById('updateAppBtn').addEventListener('click', () => {
      // Enviar mensaje al SW para que se active inmediatamente
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    });
    
    // Botón para descartar
    document.getElementById('dismissUpdateBtn').addEventListener('click', () => {
      notification.remove();
    });
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
