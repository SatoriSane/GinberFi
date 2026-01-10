// Gestor de Opciones de la Aplicación
class OpcionesManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Botón de opciones en el header
    const optionsBtn = document.getElementById('optionsBtn');
    if (optionsBtn) {
      optionsBtn.addEventListener('click', () => {
        this.showOptionsModal();
      });
    }
  }

  showOptionsModal() {
    const modalHTML = `
      <div class="modal-overlay options-modal" id="optionsModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">⚙️ Opciones</h2>
            <button class="modal-close" onclick="OpcionesManager.closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="options-list">
              <div class="option-item" onclick="OpcionesManager.showDesignOptions()">
                <div class="option-icon">🎨</div>
                <div class="option-content">
                  <div class="option-title">Temas de Color</div>
                  <div class="option-description">Elige entre 10 temas diferentes para personalizar tu experiencia</div>
                </div>
              </div>
              
              <div class="option-item success" onclick="OpcionesManager.createBackup()">
                <div class="option-icon">💾</div>
                <div class="option-content">
                  <div class="option-title">Guardar copia de seguridad</div>
                  <div class="option-description">Descarga todos tus datos en un archivo JSON</div>
                </div>
              </div>
              
              <div class="option-item warning" onclick="OpcionesManager.showRestoreOption()">
                <div class="option-icon">📂</div>
                <div class="option-content">
                  <div class="option-title">Restaurar copia de seguridad</div>
                  <div class="option-description">Carga datos desde un archivo de respaldo</div>
                </div>
              </div>
              
              <div class="option-item danger" onclick="OpcionesManager.showResetConfirmation()">
                <div class="option-icon">🗑️</div>
                <div class="option-content">
                  <div class="option-title">Reiniciar aplicación</div>
                  <div class="option-description">Elimina todos los datos y vuelve al estado inicial</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('optionsModal');
    
    // Mostrar modal con animación
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });
  }

  static closeModal() {
    const modal = document.getElementById('optionsModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  static toggleTheme(event) {
    // Prevenir que se cierre el modal
    event.stopPropagation();
    
    const currentTheme = localStorage.getItem('ginbertfi_theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Guardar preferencia
    localStorage.setItem('ginbertfi_theme', newTheme);
    
    // Aplicar tema
    this.applyTheme(newTheme);
    
    // Actualizar el toggle visualmente
    const toggleSlider = event.target.closest('.theme-toggle').querySelector('.toggle-slider');
    if (newTheme === 'dark') {
      toggleSlider.classList.add('active');
    } else {
      toggleSlider.classList.remove('active');
    }
    
    // Actualizar datos para refrescar colores dinámicos
    if (window.appEvents) {
      window.appEvents.emit('dataUpdated');
    }
  }

  static applyTheme(theme) {
    const head = document.head;
    
    // Limpiar todos los temas CSS existentes
    const existingThemeCSS = document.querySelectorAll('[data-theme-css]');
    existingThemeCSS.forEach(css => css.remove());
    
    // Limpiar todas las clases de tema del body
    document.body.classList.remove('dark-theme', 'sunset-theme', 'ocean-theme', 'forest-theme', 'lavender-theme', 'coral-theme', 'zen-theme', 'midnight-theme', 'coastal-theme', 'starry-theme');
    
    // Tema light no necesita CSS adicional (usa base.css)
    if (theme === 'light') return;
    
    // Mapeo de temas a archivos CSS
    const themeFiles = {
      'dark': 'css/base-dark.css',
      'sunset': 'css/base-sunset.css',
      'ocean': 'css/base-ocean.css',
      'forest': 'css/base-forest.css',
      'lavender': 'css/base-lavender.css',
      'coral': 'css/base-coral.css',
      'zen': 'css/base-zen.css',
      'midnight': 'css/base-midnight.css',
      'coastal': 'css/base-coastal.css',
      'starry': 'css/base-starry.css'
    };
    
    // Mapeo de temas a clases del body
    const themeClasses = {
      'dark': 'dark-theme',
      'sunset': 'sunset-theme',
      'ocean': 'ocean-theme',
      'forest': 'forest-theme',
      'lavender': 'lavender-theme',
      'coral': 'coral-theme',
      'zen': 'zen-theme',
      'midnight': 'midnight-theme',
      'coastal': 'coastal-theme',
      'starry': 'starry-theme'
    };
    
    // Cargar CSS del tema seleccionado
    if (themeFiles[theme]) {
      const themeCSS = document.createElement('link');
      themeCSS.setAttribute('data-theme-css', theme);
      themeCSS.rel = 'stylesheet';
      themeCSS.href = themeFiles[theme];
      head.appendChild(themeCSS);
      
      // Aplicar clase al body
      document.body.classList.add(themeClasses[theme]);
    }
    
    // Actualizar iconos que dependen del tema
    if (window.ThemeManager && typeof window.ThemeManager.updateThemeIcons === 'function') {
      // Pequeño delay para asegurar que el tema se aplicó
      setTimeout(() => {
        window.ThemeManager.updateThemeIcons();
      }, 100);
    }
  }

  static showDesignOptions() {
    const currentTheme = localStorage.getItem('ginbertfi_theme') || 'light';
    
    const modalHTML = `
      <div class="modal-overlay options-modal" id="designModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">🎨 Temas de Color</h2>
            <button class="modal-close" onclick="OpcionesManager.closeDesignModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="design-options">
              <div class="theme-option ${currentTheme === 'light' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('light')">
                <div class="theme-preview light-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">☀️ Modo Claro</div>
                  <div class="theme-description">Diseño clásico con colores claros y alegres</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'dark' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('dark')">
                <div class="theme-preview dark-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌙 Modo Oscuro</div>
                  <div class="theme-description">Diseño elegante para ambientes con poca luz</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'sunset' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('sunset')">
                <div class="theme-preview sunset-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌅 Modo Sunset</div>
                  <div class="theme-description">Colores cálidos inspirados en el atardecer</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'ocean' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('ocean')">
                <div class="theme-preview ocean-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌊 Modo Ocean</div>
                  <div class="theme-description">Azules profesionales inspirados en el océano</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'forest' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('forest')">
                <div class="theme-preview forest-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌲 Modo Forest</div>
                  <div class="theme-description">Colores naturales inspirados en el bosque</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'lavender' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('lavender')">
                <div class="theme-preview lavender-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌸 Modo Lavender</div>
                  <div class="theme-description">Colores elegantes inspirados en la lavanda</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'coral' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('coral')">
                <div class="theme-preview coral-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🪸 Modo Coral</div>
                  <div class="theme-description">Colores vibrantes inspirados en el coral</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'zen' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('zen')">
                <div class="theme-preview zen-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🧘 Modo Zen</div>
                  <div class="theme-description">Diseño minimalista y espacioso revolucionario</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'midnight' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('midnight')">
                <div class="theme-preview midnight-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌙✨ Modo Midnight</div>
                  <div class="theme-description">Elegancia premium en negro y oro</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'coastal' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('coastal')">
                <div class="theme-preview coastal-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌊⚓ Modo Coastal</div>
                  <div class="theme-description">Elegancia oceánica con tonos cobre</div>
                </div>
              </div>
              
              <div class="theme-option ${currentTheme === 'starry' ? 'selected' : ''}" 
                   onclick="OpcionesManager.setTheme('starry')">
                <div class="theme-preview starry-preview">
                  <div class="preview-header"></div>
                  <div class="preview-content">
                    <div class="preview-card"></div>
                    <div class="preview-card"></div>
                  </div>
                </div>
                <div class="theme-info">
                  <div class="theme-title">🌌 Starry Night</div>
                  <div class="theme-description">Noche Estrellada</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cerrar modal principal
    this.closeModal();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('designModal');
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeDesignModal();
      }
    });
  }

  static closeDesignModal() {
    const modal = document.getElementById('designModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  static setTheme(theme) {
    // Guardar preferencia
    localStorage.setItem('ginbertfi_theme', theme);
    
    // Aplicar tema
    this.applyTheme(theme);
    
    // Cerrar modal para que el usuario vea el cambio inmediatamente
    this.closeDesignModal();
    
    // Actualizar datos para refrescar colores dinámicos
    if (window.appEvents) {
      window.appEvents.emit('dataUpdated');
    }
    
    // Actualizar visualmente la selección en el modal sin cerrarlo
    const modal = document.getElementById('designModal');
    if (modal) {
      const themeOptions = modal.querySelectorAll('.theme-option');
      themeOptions.forEach(option => {
        option.classList.remove('selected');
      });
      
      // Marcar el tema seleccionado
      const themeMap = {
        'light': 0, 'dark': 1, 'sunset': 2, 'ocean': 3, 
        'forest': 4, 'lavender': 5, 'coral': 6, 'zen': 7,
        'midnight': 8, 'coastal': 9, 'starry': 10
      };
      
      const index = themeMap[theme];
      if (index !== undefined && themeOptions[index]) {
        themeOptions[index].classList.add('selected');
      }
    }
  }

  static initializeTheme() {
    const savedTheme = localStorage.getItem('ginbertfi_theme') || 'light';
    this.applyTheme(savedTheme);
  }

  static async createBackup() {
    try {
      // Recopilar todos los datos de IndexedDB
      const wallets = await Storage.getWallets();
      const categories = await Storage.getCategories();
      const expenses = await Storage.getExpenses();
      
      // Obtener transacciones
      const transactionRepo = new TransactionRepository();
      const transactions = await transactionRepo.getAll();
      
      // Obtener gastos históricos
      const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
      const historicalExpenses = await historicalRepo.getAll();
      
      // Obtener fuentes de ingreso
      const incomeRepo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
      const incomeSources = await incomeRepo.getAll();
      
      // Obtener pagos programados
      const scheduledPaymentRepo = new ScheduledPaymentRepository();
      const scheduledPayments = await scheduledPaymentRepo.getAll();
      
      // Obtener wallet seleccionada (solo el ID)
      const selectedWallet = await Storage.getSelectedWallet();
      const selectedWalletId = selectedWallet ? selectedWallet.id : null;
      
      const backupData = {
        version: '1.1',
        timestamp: new Date().toISOString(),
        data: {
          wallets: wallets || [],
          categories: categories || [],
          expenses: expenses || [],
          transactions: transactions || [],
          historicalExpenses: historicalExpenses || [],
          incomeSources: incomeSources ? incomeSources.map(s => s.name || s.id || s) : [],
          scheduledPayments: scheduledPayments || [],
          selectedWallet: selectedWalletId
        }
      };

      // Crear archivo y descargarlo
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `ginbertfi_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.closeModal();
      this.showSuccessMessage('Copia de seguridad creada', 'El archivo se ha descargado correctamente');
      
    } catch (error) {
      console.error('Error creating backup:', error);
      this.showErrorMessage('Error al crear la copia', 'No se pudo generar el archivo de respaldo');
    }
  }

  static showRestoreOption() {
    const modalHTML = `
      <div class="modal-overlay options-modal" id="restoreModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">📂 Restaurar copia de seguridad</h2>
            <button class="modal-close" onclick="OpcionesManager.closeRestoreModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="file-input-wrapper">
              <div class="option-item warning" onclick="document.getElementById('backupFile').click()">
                <div class="option-icon">📁</div>
                <div class="option-content">
                  <div class="option-title">Seleccionar archivo</div>
                  <div class="option-description">Elige el archivo JSON de respaldo</div>
                </div>
              </div>
              <input type="file" id="backupFile" accept=".json" onchange="OpcionesManager.handleFileSelect(event)">
            </div>
          </div>
        </div>
      </div>
    `;

    // Cerrar modal principal
    this.closeModal();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('restoreModal');
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeRestoreModal();
      }
    });
  }

  static closeRestoreModal() {
    const modal = document.getElementById('restoreModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  static handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target.result);
        this.restoreBackup(backupData);
      } catch (error) {
        console.error('Error parsing backup file:', error);
        this.showErrorMessage('Archivo inválido', 'El archivo seleccionado no es un respaldo válido');
      }
    };
    reader.readAsText(file);
  }

  static restoreBackup(backupData) {
    try {
      // Validar estructura del backup
      if (!backupData.data || typeof backupData.data !== 'object') {
        throw new Error('Estructura de backup inválida');
      }

      // Confirmar restauración
      this.showRestoreConfirmation(backupData);
      
    } catch (error) {
      console.error('Error validating backup:', error);
      this.showErrorMessage('Error de validación', 'El archivo de respaldo no tiene el formato correcto');
    }
  }

  static showRestoreConfirmation(backupData) {
    this.closeRestoreModal();
    
    // Almacenar temporalmente los datos del backup
    this._pendingBackupData = backupData;
    
    const modalHTML = `
      <div class="modal-overlay options-modal" id="confirmRestoreModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">⚠️ Confirmar restauración</h2>
          </div>
          <div class="modal-body">
            <div class="confirmation-dialog">
              <div class="confirmation-message">
                <strong>¿Estás seguro de que quieres restaurar esta copia de seguridad?</strong><br><br>
                Esta acción reemplazará todos tus datos actuales con los del archivo de respaldo.<br>
                <small>Fecha del respaldo: ${new Date(backupData.timestamp).toLocaleString()}</small>
              </div>
              <div class="confirmation-actions">
                <button class="btn-cancel" id="cancelRestoreBtn">Cancelar</button>
                <button class="btn-confirm" id="confirmRestoreBtn">Restaurar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirmRestoreModal');
    
    // Agregar event listeners
    document.getElementById('cancelRestoreBtn').addEventListener('click', () => {
      this.closeConfirmRestoreModal();
    });
    
    document.getElementById('confirmRestoreBtn').addEventListener('click', async () => {
      await this.executeRestore(this._pendingBackupData);
    });
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  static closeConfirmRestoreModal() {
    const modal = document.getElementById('confirmRestoreModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  static async executeRestore(backupData) {
    try {
      // Limpiar datos actuales y restaurar
      const data = backupData.data;
      
      // Normalizar wallets: convertir 'purpose' a 'description' si existe
      const normalizedWallets = (data.wallets || []).map(wallet => {
        if (wallet.purpose && !wallet.description) {
          return {
            ...wallet,
            description: wallet.purpose
          };
        }
        return wallet;
      });
      
      // Restaurar cada tipo de dato usando IndexedDB
      await Storage.saveWallets(normalizedWallets);
      await Storage.saveCategories(data.categories || []);
      await Storage.saveExpenses(data.expenses || []);
      
      // Restaurar transacciones
      const transactionRepo = new TransactionRepository();
      await transactionRepo.clear();
      if (data.transactions && data.transactions.length > 0) {
        for (const transaction of data.transactions) {
          await transactionRepo.add(transaction);
        }
      }
      
      // Restaurar gastos históricos
      const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
      await historicalRepo.clear();
      if (data.historicalExpenses && data.historicalExpenses.length > 0) {
        for (const expense of data.historicalExpenses) {
          await historicalRepo.add(expense);
        }
      }
      
      // Restaurar fuentes de ingreso
      const incomeRepo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
      await incomeRepo.clear();
      if (data.incomeSources && data.incomeSources.length > 0) {
        for (const source of data.incomeSources) {
          await incomeRepo.add({ id: source, name: source });
        }
      }
      
      // Restaurar pagos programados
      const scheduledPaymentRepo = new ScheduledPaymentRepository();
      await scheduledPaymentRepo.clear();
      if (data.scheduledPayments && data.scheduledPayments.length > 0) {
        for (const payment of data.scheduledPayments) {
          await scheduledPaymentRepo.add(payment);
        }
      }
      
      // Restaurar wallet seleccionada
      if (data.selectedWallet) {
        // Asegurarse de que sea solo el ID, no el objeto completo
        const walletId = typeof data.selectedWallet === 'string' 
          ? data.selectedWallet 
          : data.selectedWallet.id;
        
        if (walletId) {
          await Storage.setSelectedWallet(walletId);
        }
      }

      // Refrescar AppState antes de recargar
      await AppState.refreshData();

      this.closeConfirmRestoreModal();
      this.showSuccessMessage('Datos restaurados', 'La aplicación se recargará para aplicar los cambios');
      
      // Recargar la aplicación después de un breve delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      this.showErrorMessage('Error al restaurar', 'No se pudieron restaurar los datos del respaldo');
    }
  }

  static showResetConfirmation() {
    this.closeModal();
    
    const modalHTML = `
      <div class="modal-overlay options-modal" id="resetModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">🗑️ Reiniciar aplicación</h2>
          </div>
          <div class="modal-body">
            <div class="confirmation-dialog">
              <div class="confirmation-message">
                <strong>¿Estás seguro de que quieres reiniciar la aplicación?</strong><br><br>
                Esta acción eliminará permanentemente:<br>
                • Todas las wallets y sus saldos<br>
                • Todas las categorías y gastos<br>
                • Todos los pagos programados<br>
                • Todo el historial de transacciones<br><br>
                <strong>Esta acción no se puede deshacer.</strong>
              </div>
              <div class="confirmation-actions">
                <button class="btn-cancel" onclick="OpcionesManager.closeResetModal()">Cancelar</button>
                <button class="btn-confirm" onclick="OpcionesManager.executeReset()">Reiniciar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('resetModal');
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.closeResetModal();
      }
    });
  }

  static closeResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  static async executeReset() {
    try {
      console.log('🗑️ Iniciando limpieza completa de la aplicación...');
      
      // 1. Limpiar localStorage COMPLETO
      console.log('Limpiando localStorage...');
      localStorage.clear();
      
      // 2. Limpiar sessionStorage
      console.log('Limpiando sessionStorage...');
      sessionStorage.clear();
      
      // 3. Limpiar todas las cookies del dominio
      console.log('Limpiando cookies...');
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // 4. Limpiar todo el cache del navegador
      console.log('Limpiando cache...');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.log(`✓ ${cacheNames.length} caches eliminados`);
      }
      
      // 5. Desregistrar Service Workers
      console.log('Desregistrando Service Workers...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
        console.log(`✓ ${registrations.length} Service Workers desregistrados`);
      }
      
      // 6. Limpiar IndexedDB
      console.log('Limpiando IndexedDB...');
      if (DBConfig.isSupported()) {
        // Cerrar conexión si existe
        if (DBConfig._dbInstance) {
          DBConfig._dbInstance.close();
          DBConfig._dbInstance = null;
        }
        
        const dbName = DBConfig.DB_NAME;
        const deleteRequest = indexedDB.deleteDatabase(dbName);
        
        deleteRequest.onsuccess = async () => {
          console.log('✓ IndexedDB eliminada correctamente');
          
          // 7. Limpiar cualquier otra base de datos IndexedDB que pueda existir
          if (window.indexedDB.databases) {
            const databases = await window.indexedDB.databases();
            for (const db of databases) {
              if (db.name && db.name.includes('ginbert')) {
                indexedDB.deleteDatabase(db.name);
                console.log(`✓ Base de datos adicional eliminada: ${db.name}`);
              }
            }
          }
          
          console.log('✅ Limpieza completa finalizada');
          this.closeResetModal();
          this.showSuccessMessage(
            'Aplicación reiniciada', 
            'Todos los datos, cache, cookies y almacenamiento han sido eliminados. La aplicación se recargará.'
          );
          
          setTimeout(() => {
            // Forzar recarga completa sin cache
            window.location.href = window.location.href.split('?')[0] + '?nocache=' + Date.now();
          }, 2000);
        };
        
        deleteRequest.onerror = (error) => {
          console.error('Error al eliminar IndexedDB:', error);
          this.showErrorMessage('Error', 'Hubo un problema al reiniciar la aplicación');
        };
      } else {
        // Si no hay IndexedDB, solo recargar
        console.log('✅ Limpieza completa finalizada (sin IndexedDB)');
        this.closeResetModal();
        this.showSuccessMessage(
          'Aplicación reiniciada', 
          'Todos los datos, cache y cookies han sido eliminados. La aplicación se recargará.'
        );
        
        setTimeout(() => {
          // Forzar recarga completa sin cache
          window.location.href = window.location.href.split('?')[0] + '?nocache=' + Date.now();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error resetting app:', error);
      this.showErrorMessage('Error al reiniciar', 'No se pudo completar el reinicio de la aplicación');
    }
  }

  static showSuccessMessage(title, message) {
    const modalHTML = `
      <div class="modal-overlay options-modal" id="successModal">
        <div class="modal">
          <div class="modal-body">
            <div class="message-dialog success">
              <div class="message-icon">✅</div>
              <div class="message-title">${title}</div>
              <div class="message-text">${message}</div>
              <button class="btn-close" onclick="OpcionesManager.closeSuccessModal()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('successModal');
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  static closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }

  static showErrorMessage(title, message) {
    const modalHTML = `
      <div class="modal-overlay options-modal" id="errorModal">
        <div class="modal">
          <div class="modal-body">
            <div class="message-dialog error">
              <div class="message-icon">❌</div>
              <div class="message-title">${title}</div>
              <div class="message-text">${message}</div>
              <button class="btn-close" onclick="OpcionesManager.closeErrorModal()">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('errorModal');
    
    setTimeout(() => {
      modal.classList.add('show');
    }, 10);
  }

  static closeErrorModal() {
    const modal = document.getElementById('errorModal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new OpcionesManager();
  // Aplicar tema guardado
  OpcionesManager.initializeTheme();
});
