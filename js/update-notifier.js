// Update Notifier - Shows changelog modal once per version update
class UpdateNotifier {
  static STORAGE_KEY = 'ginberfi_last_seen_version';
  
  // Current app version - UPDATE THIS with each release
  static CURRENT_VERSION = '1.2.0';
  
  // Changelog entries - ADD NEW ENTRIES AT THE TOP
  static CHANGELOG = [
    {
      version: '1.2.0',
      date: '2026-02-13',
      title: 'Lista de Compra y Mejoras',
      changes: [
        {
          type: 'feature',
          text: 'Nueva lista de compra accesible desde el icono del carrito en la cabecera. Añade productos, márcalos como comprados y reordénalos arrastrando.'
        }

      ]
    }
  ];

  static init() {
    const lastSeenVersion = localStorage.getItem(this.STORAGE_KEY);
    
    // Show modal if user hasn't seen this version
    if (lastSeenVersion !== this.CURRENT_VERSION) {
      this.showUpdateModal();
    }
  }

  static getChangeTypeIcon(type) {
    const icons = {
      feature: '✨',
      improvement: '⚡',
      fix: '🔧',
      security: '🔒',
      breaking: '⚠️'
    };
    return icons[type] || '📌';
  }

  static getChangeTypeLabel(type) {
    const labels = {
      feature: 'Nueva función',
      improvement: 'Mejora',
      fix: 'Corrección',
      security: 'Seguridad',
      breaking: 'Cambio importante'
    };
    return labels[type] || 'Cambio';
  }

  static formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  static buildChangelogHTML() {
    const currentEntry = this.CHANGELOG[0];
    if (!currentEntry) return '';

    const changesHTML = currentEntry.changes.map(change => `
      <div class="update-change-item">
        <span class="update-change-icon">${this.getChangeTypeIcon(change.type)}</span>
        <span class="update-change-text">${change.text}</span>
      </div>
    `).join('');

    return `
      <div class="update-version-header">
        <span class="update-version-badge">v${currentEntry.version}</span>
        <span class="update-version-date">${this.formatDate(currentEntry.date)}</span>
      </div>
      <h3 class="update-version-title">${currentEntry.title}</h3>
      <div class="update-changes-list">
        ${changesHTML}
      </div>
    `;
  }

  static showUpdateModal() {
    const modalData = {
      title: '¡Nueva Actualización!',
      className: 'update-modal',
      body: `
        <div class="update-content">
          ${this.buildChangelogHTML()}
        </div>
      `,
      footer: `
        <button type="button" class="btn-primary" id="updateModalDismissBtn">Entendido</button>
      `,
      onShow: (modal) => {
        const dismissBtn = modal.querySelector('#updateModalDismissBtn');
        dismissBtn.addEventListener('click', () => {
          this.markAsSeen();
          window.appEvents.emit('closeModal');
        });
      }
    };

    window.appEvents.emit('openModal', modalData);
  }

  static markAsSeen() {
    localStorage.setItem(this.STORAGE_KEY, this.CURRENT_VERSION);
  }

  // Utility method to manually reset (useful for testing)
  static reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('Update notifier reset. Modal will show on next page load.');
  }
}

// Initialize when app is ready
// appEvents is already available (defined in base.js which loads before this)
window.appEvents.on('appInitialized', () => {
  UpdateNotifier.init();
});
