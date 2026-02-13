// Shopping List Manager - Simple grocery/shopping list with drag & drop reordering
class ShoppingListManager {
  static STORAGE_KEY = 'ginberfi_shopping_list';

  constructor() {
    this.items = [];
    this.overlay = null;
    this.draggedItem = null;
    this.draggedIndex = null;
    this.touchStartY = 0;
    this.touchCurrentY = 0;
    this.dragClone = null;
    this.placeholder = null;
    this.listContainer = null;

    this.init();
  }

  init() {
    this.loadItems();
    this.createOverlay();
    this.setupHeaderButton();

    window.appEvents.on('openShoppingList', () => this.open());
  }

  // --- Storage ---

  loadItems() {
    try {
      const data = localStorage.getItem(ShoppingListManager.STORAGE_KEY);
      this.items = data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error loading shopping list:', e);
      this.items = [];
    }
  }

  saveItems() {
    try {
      localStorage.setItem(ShoppingListManager.STORAGE_KEY, JSON.stringify(this.items));
    } catch (e) {
      console.error('Error saving shopping list:', e);
    }
  }

  // --- Header Button ---

  setupHeaderButton() {
    const headerContent = document.querySelector('.header-content');
    if (!headerContent) return;

    const btn = document.createElement('button');
    btn.className = 'shopping-list-header-btn';
    btn.id = 'shoppingListBtn';
    btn.setAttribute('aria-label', 'Lista de compra');
    btn.innerHTML = '<i data-lucide="shopping-cart"></i>';

    // Insert before balance selector (right side of header)
    const balanceSelector = headerContent.querySelector('.balance-selector');
    if (balanceSelector) {
      headerContent.insertBefore(btn, balanceSelector);
    } else {
      headerContent.appendChild(btn);
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.open();
    });

    // Initialize the lucide icon
    if (typeof lucide !== 'undefined') {
      lucide.createIcons({ nodes: [btn] });
    }
  }

  // --- Badge ---

  updateBadge() {
    const btn = document.getElementById('shoppingListBtn');
    if (!btn) return;

    const pending = this.items.filter(i => !i.bought).length;
    let badge = btn.querySelector('.shopping-badge');

    if (pending > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'shopping-badge';
        btn.appendChild(badge);
      }
      badge.textContent = pending;
    } else if (badge) {
      badge.remove();
    }
  }

  // --- Overlay ---

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'shopping-list-overlay';
    this.overlay.id = 'shoppingListOverlay';

    this.overlay.innerHTML = `
      <div class="shopping-list-panel">
        <div class="shopping-list-header">
          <h2 class="shopping-list-title">Lista de Compra</h2>
          <button class="shopping-list-close-btn" id="shoppingListCloseBtn" aria-label="Cerrar">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="shopping-list-input-row">
          <input type="text" id="shoppingListInput" class="shopping-list-input"
                 placeholder="Añadir producto..." autocomplete="off" maxlength="100">
          <button class="shopping-list-add-btn" id="shoppingListAddBtn" aria-label="Añadir">
            <i data-lucide="plus"></i>
          </button>
        </div>
        <div class="shopping-list-items" id="shoppingListItems"></div>
        <div class="shopping-list-footer" id="shoppingListFooter"></div>
      </div>
    `;

    document.body.appendChild(this.overlay);

    // Close button
    this.overlay.querySelector('#shoppingListCloseBtn').addEventListener('click', () => this.close());

    // Click outside to close
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });

    // Add item
    const addBtn = this.overlay.querySelector('#shoppingListAddBtn');
    const input = this.overlay.querySelector('#shoppingListInput');

    addBtn.addEventListener('click', () => this.addFromInput());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.addFromInput();
    });

    this.listContainer = this.overlay.querySelector('#shoppingListItems');
  }

  // --- Open / Close ---

  open() {
    this.loadItems();
    this.render();
    this.overlay.classList.add('active');

    // Initialize lucide icons inside overlay
    if (typeof lucide !== 'undefined') {
      lucide.createIcons({ nodes: [this.overlay] });
    }

    // Focus input
    setTimeout(() => {
      this.overlay.querySelector('#shoppingListInput')?.focus();
    }, 300);
  }

  close() {
    this.overlay.classList.remove('active');
  }

  // --- CRUD ---

  addFromInput() {
    const input = this.overlay.querySelector('#shoppingListInput');
    const name = input.value.trim();
    if (!name) return;

    this.items.push({
      id: Date.now().toString(),
      name: name,
      bought: false
    });

    this.saveItems();
    input.value = '';
    this.render();
    input.focus();
  }

  toggleBought(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      item.bought = !item.bought;
      this.saveItems();
      this.render();
    }
  }

  removeItem(id) {
    this.items = this.items.filter(i => i.id !== id);
    this.saveItems();
    this.render();
  }

  clearBought() {
    this.items = this.items.filter(i => !i.bought);
    this.saveItems();
    this.render();
  }

  // --- Render ---

  render() {
    const pending = this.items.filter(i => !i.bought);
    const bought = this.items.filter(i => i.bought);

    let html = '';

    if (this.items.length === 0) {
      html = `
        <div class="shopping-list-empty">
          <span class="shopping-list-empty-icon">🛒</span>
          <p>Tu lista está vacía</p>
        </div>
      `;
    } else {
      // Pending items (draggable)
      if (pending.length > 0) {
        html += pending.map((item, index) => `
          <div class="shopping-item" data-id="${item.id}" data-index="${index}" draggable="false">
            <span class="shopping-item-drag-handle" aria-label="Arrastrar para reordenar">⠿</span>
            <button class="shopping-item-check" data-id="${item.id}" aria-label="Marcar como comprado"></button>
            <span class="shopping-item-name">${Helpers.sanitizeInput(item.name)}</span>
            <button class="shopping-item-delete" data-id="${item.id}" aria-label="Eliminar">
              <i data-lucide="x" class="shopping-item-delete-icon"></i>
            </button>
          </div>
        `).join('');
      }

      // Bought items
      if (bought.length > 0) {
        html += `<div class="shopping-list-bought-divider">Comprados (${bought.length})</div>`;
        html += bought.map(item => `
          <div class="shopping-item bought" data-id="${item.id}">
            <button class="shopping-item-check checked" data-id="${item.id}" aria-label="Desmarcar">✓</button>
            <span class="shopping-item-name">${Helpers.sanitizeInput(item.name)}</span>
            <button class="shopping-item-delete" data-id="${item.id}" aria-label="Eliminar">
              <i data-lucide="x" class="shopping-item-delete-icon"></i>
            </button>
          </div>
        `).join('');
      }
    }

    this.listContainer.innerHTML = html;

    // Footer
    const footer = this.overlay.querySelector('#shoppingListFooter');
    if (bought.length > 0) {
      footer.innerHTML = `<button class="shopping-list-clear-btn" id="clearBoughtBtn">Limpiar comprados</button>`;
      footer.querySelector('#clearBoughtBtn').addEventListener('click', () => this.clearBought());
      footer.style.display = 'block';
    } else {
      footer.innerHTML = '';
      footer.style.display = 'none';
    }

    // Attach event listeners
    this.attachItemListeners();

    // Initialize lucide icons
    if (typeof lucide !== 'undefined') {
      lucide.createIcons({ nodes: [this.listContainer] });
    }

    // Update header badge
    this.updateBadge();
  }

  attachItemListeners() {
    // Check/uncheck
    this.listContainer.querySelectorAll('.shopping-item-check').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleBought(btn.dataset.id);
      });
    });

    // Delete
    this.listContainer.querySelectorAll('.shopping-item-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeItem(btn.dataset.id);
      });
    });

    // Drag & drop (touch-based for mobile)
    this.setupDragAndDrop();
  }

  // --- Drag & Drop (Touch + Mouse) ---

  setupDragAndDrop() {
    const handles = this.listContainer.querySelectorAll('.shopping-item-drag-handle');

    handles.forEach(handle => {
      // Touch events
      handle.addEventListener('touchstart', (e) => this.onDragStart(e, handle), { passive: false });

      // Mouse events
      handle.addEventListener('mousedown', (e) => this.onMouseDragStart(e, handle));
    });
  }

  getItemElements() {
    return Array.from(this.listContainer.querySelectorAll('.shopping-item:not(.bought)'));
  }

  onDragStart(e, handle) {
    e.preventDefault();
    const item = handle.closest('.shopping-item');
    if (!item || item.classList.contains('bought')) return;

    this.draggedItem = item;
    this.draggedIndex = parseInt(item.dataset.index);
    this.touchStartY = e.touches[0].clientY;
    this.touchCurrentY = this.touchStartY;

    // Create clone for visual feedback
    this.createDragClone(item, e.touches[0].clientY);

    // Create placeholder
    this.createPlaceholder(item);

    // Hide original
    item.style.opacity = '0';
    item.style.height = item.offsetHeight + 'px';

    // Bind move/end
    this._touchMove = (ev) => this.onDragMove(ev);
    this._touchEnd = (ev) => this.onDragEnd(ev);
    document.addEventListener('touchmove', this._touchMove, { passive: false });
    document.addEventListener('touchend', this._touchEnd);
  }

  onMouseDragStart(e, handle) {
    e.preventDefault();
    const item = handle.closest('.shopping-item');
    if (!item || item.classList.contains('bought')) return;

    this.draggedItem = item;
    this.draggedIndex = parseInt(item.dataset.index);
    this.touchStartY = e.clientY;
    this.touchCurrentY = this.touchStartY;

    this.createDragClone(item, e.clientY);
    this.createPlaceholder(item);
    item.style.opacity = '0';
    item.style.height = item.offsetHeight + 'px';

    this._mouseMove = (ev) => this.onMouseDragMove(ev);
    this._mouseUp = (ev) => this.onMouseDragEnd(ev);
    document.addEventListener('mousemove', this._mouseMove);
    document.addEventListener('mouseup', this._mouseUp);
  }

  createDragClone(item, startY) {
    const rect = item.getBoundingClientRect();
    this.dragClone = item.cloneNode(true);
    this.dragClone.className = 'shopping-item drag-clone';
    this.dragClone.style.position = 'fixed';
    this.dragClone.style.left = rect.left + 'px';
    this.dragClone.style.top = rect.top + 'px';
    this.dragClone.style.width = rect.width + 'px';
    this.dragClone.style.zIndex = '100000';
    this.dragClone.style.pointerEvents = 'none';
    document.body.appendChild(this.dragClone);
    this._cloneStartTop = rect.top;
  }

  createPlaceholder(item) {
    this.placeholder = document.createElement('div');
    this.placeholder.className = 'shopping-item-placeholder';
    this.placeholder.style.height = item.offsetHeight + 'px';
    item.parentNode.insertBefore(this.placeholder, item);
  }

  onDragMove(e) {
    e.preventDefault();
    this.touchCurrentY = e.touches[0].clientY;
    this.updateDragPosition();
  }

  onMouseDragMove(e) {
    e.preventDefault();
    this.touchCurrentY = e.clientY;
    this.updateDragPosition();
  }

  updateDragPosition() {
    if (!this.dragClone) return;

    const deltaY = this.touchCurrentY - this.touchStartY;
    this.dragClone.style.top = (this._cloneStartTop + deltaY) + 'px';

    // Determine which item we're hovering over
    const items = this.getItemElements();
    const cloneRect = this.dragClone.getBoundingClientRect();
    const cloneCenterY = cloneRect.top + cloneRect.height / 2;

    for (const item of items) {
      if (item === this.draggedItem) continue;
      const rect = item.getBoundingClientRect();
      const itemCenterY = rect.top + rect.height / 2;

      if (cloneCenterY < itemCenterY) {
        item.parentNode.insertBefore(this.placeholder, item);
        return;
      }
    }

    // If past all items, put placeholder at the end (before bought divider or at end)
    const divider = this.listContainer.querySelector('.shopping-list-bought-divider');
    if (divider) {
      this.listContainer.insertBefore(this.placeholder, divider);
    } else {
      this.listContainer.appendChild(this.placeholder);
    }
  }

  onDragEnd(e) {
    document.removeEventListener('touchmove', this._touchMove);
    document.removeEventListener('touchend', this._touchEnd);
    this.finalizeDrag();
  }

  onMouseDragEnd(e) {
    document.removeEventListener('mousemove', this._mouseMove);
    document.removeEventListener('mouseup', this._mouseUp);
    this.finalizeDrag();
  }

  finalizeDrag() {
    if (!this.draggedItem || !this.placeholder) return;

    // Determine new order from placeholder position
    const pendingItems = this.items.filter(i => !i.bought);
    const boughtItems = this.items.filter(i => i.bought);

    // Get all current item elements (including placeholder) to determine new order
    const allElements = Array.from(this.listContainer.querySelectorAll('.shopping-item:not(.bought), .shopping-item-placeholder'));
    const newPending = [];

    for (const el of allElements) {
      if (el === this.placeholder) {
        // This is where the dragged item goes
        newPending.push(pendingItems[this.draggedIndex]);
      } else if (el !== this.draggedItem) {
        const id = el.dataset.id;
        const item = pendingItems.find(i => i.id === id);
        if (item) newPending.push(item);
      }
    }

    this.items = [...newPending, ...boughtItems];
    this.saveItems();

    // Cleanup
    if (this.dragClone) {
      this.dragClone.remove();
      this.dragClone = null;
    }
    if (this.placeholder) {
      this.placeholder.remove();
      this.placeholder = null;
    }
    if (this.draggedItem) {
      this.draggedItem.style.opacity = '';
      this.draggedItem.style.height = '';
    }
    this.draggedItem = null;
    this.draggedIndex = null;

    this.render();
  }
}

// Initialize when DOM is ready
window.appEvents.on('appInitialized', () => {
  window.shoppingListManager = new ShoppingListManager();
});
