# Sistema de Iconos Temáticos

**Versión**: v3.121  
**Fecha**: Diciembre 2024

## Problema Resuelto

Los iconos PNG personalizados (como `icon-programar.png`) no se veían bien en temas oscuros porque:
- El ícono negro se perdía en fondos oscuros
- No había adaptación automática según el tema

## Solución Implementada

Sistema automático que cambia los iconos según el tema activo:
- **Temas claros** (light, sunset, ocean, etc.) → `icon-programar.png` (negro)
- **Temas oscuros** (dark, midnight, starry) → `icon-programar-dark.png` (blanco)

---

## Arquitectura

### 1. **Detección de Temas Oscuros**

En `/js/theme-manager.js`:

```javascript
static isDarkVariant() {
  const theme = this.getCurrentTheme();
  const darkThemes = ['dark', 'midnight', 'starry'];
  return darkThemes.includes(theme);
}
```

### 2. **Actualización Automática de Iconos**

```javascript
static updateThemeIcons() {
  const programarIcon = document.querySelector('[data-action="schedule-payment"] img');
  if (programarIcon) {
    if (this.isDarkVariant()) {
      programarIcon.src = 'icon-programar-dark.png';
    } else {
      programarIcon.src = 'icon-programar.png';
    }
  }
}
```

### 3. **Integración con Sistema de Temas**

En `/js/opciones.js`, después de aplicar un tema:

```javascript
// Actualizar iconos que dependen del tema
if (window.ThemeManager && typeof window.ThemeManager.updateThemeIcons === 'function') {
  setTimeout(() => {
    window.ThemeManager.updateThemeIcons();
  }, 100);
}
```

### 4. **Inicialización al Cargar**

En `/js/app.js`:

```javascript
// Actualizar iconos según el tema actual
if (window.ThemeManager && typeof window.ThemeManager.updateThemeIcons === 'function') {
  window.ThemeManager.updateThemeIcons();
}
```

---

## Flujo de Funcionamiento

### Al Cargar la App:
1. App se inicializa
2. Tema guardado se aplica
3. `ThemeManager.updateThemeIcons()` se ejecuta
4. Ícono correcto se muestra según el tema

### Al Cambiar de Tema:
1. Usuario selecciona nuevo tema
2. `OpcionesManager.applyTheme(theme)` se ejecuta
3. CSS del tema se carga
4. Clase del body se actualiza
5. `ThemeManager.updateThemeIcons()` se ejecuta (con delay de 100ms)
6. Ícono cambia automáticamente

---

## Temas Oscuros Detectados

Los siguientes temas usan `icon-programar-dark.png`:
- ✅ **Dark** - Negro/Azul oscuro
- ✅ **Midnight** - Azul marino profundo
- ✅ **Starry** - Escala de grises/Negro

Todos los demás temas usan `icon-programar.png`:
- Light, Sunset, Ocean, Forest, Lavender, Coral, Zen, Coastal

---

## Agregar Más Iconos Temáticos

Para agregar otros iconos que cambien con el tema:

### 1. Crear las Imágenes
- `icon-nombre.png` (versión clara/negra)
- `icon-nombre-dark.png` (versión oscura/blanca)

### 2. Actualizar HTML
```html
<button class="quick-action-btn" data-action="mi-accion">
  <span class="action-icon">
    <img src="icon-nombre.png" alt="Mi Acción" data-theme-icon="mi-accion">
  </span>
  <span class="action-label">Mi Acción</span>
</button>
```

### 3. Actualizar `ThemeManager.updateThemeIcons()`
```javascript
static updateThemeIcons() {
  const isDark = this.isDarkVariant();
  
  // Ícono de programar
  const programarIcon = document.querySelector('[data-action="schedule-payment"] img');
  if (programarIcon) {
    programarIcon.src = isDark ? 'icon-programar-dark.png' : 'icon-programar.png';
  }
  
  // Nuevo ícono
  const miIcon = document.querySelector('[data-theme-icon="mi-accion"]');
  if (miIcon) {
    miIcon.src = isDark ? 'icon-nombre-dark.png' : 'icon-nombre.png';
  }
}
```

### 4. Agregar al Service Worker
```javascript
// En sw.js
const urlsToCache = [
  // ... otros archivos
  'icon-nombre.png',
  'icon-nombre-dark.png',
];
```

---

## Archivos Modificados

### JavaScript:
1. **`/js/theme-manager.js`**:
   - `isDarkVariant()` - Detecta temas oscuros
   - `updateThemeIcons()` - Cambia iconos según tema

2. **`/js/opciones.js`**:
   - `applyTheme()` - Llama a `updateThemeIcons()` después de aplicar tema

3. **`/js/app.js`**:
   - Inicialización - Llama a `updateThemeIcons()` al cargar

### Service Worker:
4. **`/sw.js`**:
   - Versión 3.121
   - Agregados `icon-programar.png` y `icon-programar-dark.png` al caché

---

## Ventajas

✅ **Automático** - Cambia sin intervención del usuario  
✅ **Instantáneo** - Se actualiza al cambiar de tema  
✅ **Persistente** - Mantiene el ícono correcto al recargar  
✅ **Extensible** - Fácil agregar más iconos temáticos  
✅ **Offline** - Ambas versiones en caché PWA  

---

## Ejemplo de Uso

```javascript
// Detectar si el tema actual es oscuro
if (ThemeManager.isDarkVariant()) {
  console.log('Tema oscuro activo');
} else {
  console.log('Tema claro activo');
}

// Actualizar todos los iconos temáticos
ThemeManager.updateThemeIcons();
```

---

## Notas Importantes

1. **Delay de 100ms**: Se usa un pequeño delay al cambiar de tema para asegurar que el CSS se haya cargado completamente antes de cambiar los iconos.

2. **Selector específico**: Se usa `[data-action="schedule-payment"] img` para encontrar el ícono exacto. Esto evita conflictos con otras imágenes.

3. **Temas oscuros**: La lista de temas oscuros está hardcodeada en `isDarkVariant()`. Si agregas nuevos temas oscuros, debes actualizar este array.

4. **Fallback**: Si el ícono no se encuentra, el código no genera errores. Simplemente no hace nada.

---

**Resultado**: Los iconos PNG personalizados ahora se adaptan automáticamente al tema activo, mejorando la visibilidad y la experiencia del usuario.
