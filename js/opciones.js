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
              <div class="option-item theme-toggle-item">
                <div class="option-icon">🌙</div>
                <div class="option-content">
                  <div class="option-title">Modo Oscuro</div>
                  <div class="option-description">Alternar entre tema claro y oscuro</div>
                </div>
                <div class="theme-toggle" onclick="OpcionesManager.toggleTheme(event)">
                  <div class="toggle-slider ${localStorage.getItem('ginbertfi_theme') === 'dark' ? 'active' : ''}"></div>
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
    const existingDarkCSS = document.getElementById('dark-theme-css');
    
    // Limpiar temas existentes
    document.body.classList.remove('dark-theme');
    
    if (theme === 'dark') {
      // Agregar CSS oscuro si no existe
      if (!existingDarkCSS) {
        const darkCSS = document.createElement('link');
        darkCSS.id = 'dark-theme-css';
        darkCSS.rel = 'stylesheet';
        darkCSS.href = 'css/base-dark.css';
        head.appendChild(darkCSS);
      }
      document.body.classList.add('dark-theme');
    } else {
      // Tema light - remover CSS oscuro
      if (existingDarkCSS) {
        existingDarkCSS.remove();
      }
    }
  }

  static showDesignOptions() {
    const currentTheme = localStorage.getItem('ginbertfi_theme') || 'light';
    
    const modalHTML = `
      <div class="modal-overlay options-modal" id="designModal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title"> Opciones de dise o</h2>
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
                  <div class="theme-title"> Modo Claro</div>
                  <div class="theme-description">Dise o cl sico con colores claros</div>
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
                  <div class="theme-title"> Modo Oscuro</div>
                  <div class="theme-description">Dise o elegante para ambientes con poca luz</div>
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
    
    // Actualizar datos para refrescar colores dinámicos
    if (window.appEvents) {
      window.appEvents.emit('dataUpdated');
    }
    
    // Cerrar modal y mostrar confirmación
    this.closeDesignModal();
    this.showSuccessMessage('Tema aplicado', `Se ha cambiado al modo ${theme === 'dark' ? 'oscuro' : 'claro'}`);
  }

  static applyTheme(theme) {
    const head = document.head;
    const existingDarkCSS = document.getElementById('dark-theme-css');
    
    if (theme === 'dark') {
      // Agregar CSS oscuro si no existe
      if (!existingDarkCSS) {
        const darkCSS = document.createElement('link');
        darkCSS.id = 'dark-theme-css';
        darkCSS.rel = 'stylesheet';
        darkCSS.href = 'css/base-dark.css';
        head.appendChild(darkCSS);
      }
      document.body.classList.add('dark-theme');
    } else {
      // Remover CSS oscuro
      if (existingDarkCSS) {
        existingDarkCSS.remove();
      }
      document.body.classList.remove('dark-theme');
    }
  }

  static initializeTheme() {
    const savedTheme = localStorage.getItem('ginbertfi_theme') || 'light';
    this.applyTheme(savedTheme);
  }

  static createBackup() {
    try {
      // Recopilar todos los datos de la aplicación
      const backupData = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        data: {
          wallets: Storage.get('ginbertfi_wallets') || [],
          categories: Storage.get('ginbertfi_categories') || [],
          expenses: Storage.get('ginbertfi_expenses') || [],
          transactions: Storage.get('ginbertfi_transactions') || [],
          historicalExpenses: Storage.get('ginbertfi_historical_expenses') || [],
          incomeSources: Storage.get('ginbertfi_income_sources') || [],
          selectedWallet: Storage.get('ginbertfi_selected_wallet') || null
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
                <button class="btn-cancel" onclick="OpcionesManager.closeConfirmRestoreModal()">Cancelar</button>
                <button class="btn-confirm" onclick="OpcionesManager.executeRestore(${JSON.stringify(backupData).replace(/"/g, '&quot;')})">Restaurar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = document.getElementById('confirmRestoreModal');
    
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

  static executeRestore(backupData) {
    try {
      // Limpiar datos actuales y restaurar
      const data = backupData.data;
      
      // Restaurar cada tipo de dato
      Storage.set('ginbertfi_wallets', data.wallets || []);
      Storage.set('ginbertfi_categories', data.categories || []);
      Storage.set('ginbertfi_expenses', data.expenses || []);
      Storage.set('ginbertfi_transactions', data.transactions || []);
      Storage.set('ginbertfi_historical_expenses', data.historicalExpenses || []);
      Storage.set('ginbertfi_income_sources', data.incomeSources || []);
      
      if (data.selectedWallet) {
        Storage.set('ginbertfi_selected_wallet', data.selectedWallet);
      }

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

  static executeReset() {
    try {
      // Limpiar todos los datos del localStorage
      const keysToRemove = [
        'ginbertfi_wallets',
        'ginbertfi_categories', 
        'ginbertfi_expenses',
        'ginbertfi_transactions',
        'ginbertfi_historical_expenses',
        'ginbertfi_income_sources',
        'ginbertfi_selected_wallet'
      ];

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      this.closeResetModal();
      this.showSuccessMessage('Aplicación reiniciada', 'Todos los datos han sido eliminados. La aplicación se recargará.');
      
      // Recargar la aplicación
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
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
