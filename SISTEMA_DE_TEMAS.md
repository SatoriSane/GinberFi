# Sistema de Temas Multi-Color

## 🎨 Implementación Completa

El sistema ahora soporta **4 temas** diferentes que el usuario puede seleccionar:

### Temas Disponibles:

#### 1. ☀️ **Modo Claro** (Light)
- **Colores**: Verde/Azul pastel
- **Estilo**: Alegre y clásico
- **Uso**: Tema por defecto, ideal para uso diurno

#### 2. 🌙 **Modo Oscuro** (Dark)
- **Colores**: Negro/Azul oscuro
- **Estilo**: Elegante y sofisticado
- **Uso**: Para ambientes con poca luz o uso nocturno

#### 3. 🌅 **Modo Sunset** (Sunset)
- **Colores**: Rosa/Naranja/Púrpura
- **Estilo**: Cálido y relajado
- **Uso**: Para ambiente acogedor inspirado en el atardecer

#### 4. 🌊 **Modo Ocean** (Ocean)
- **Colores**: Azul marino/Turquesa
- **Estilo**: Profesional y fresco
- **Uso**: Para ambiente corporativo inspirado en el océano

---

## 📁 Archivos Creados/Modificados

### Archivos CSS Nuevos:
- `/css/base-sunset.css` - Variables y estilos del tema Sunset
- `/css/base-ocean.css` - Variables y estilos del tema Ocean

### Archivos Modificados:
- `/js/opciones.js` - Sistema multi-tema actualizado
- `/css/modal_opciones.css` - Estilos para previews y compatibilidad
- `/sw.js` - Versión 3.48 con nuevos archivos en caché

---

## 🔧 Arquitectura Técnica

### Sistema de Clases del Body:
```javascript
// Sin clase adicional
body                    // Tema Light (usa base.css)

// Con clases específicas
body.dark-theme         // Tema Dark
body.sunset-theme       // Tema Sunset
body.ocean-theme        // Tema Ocean
```

### Sistema de Carga CSS:
```javascript
// Solo UN tema CSS se carga a la vez
base.css                // Siempre cargado (base)
+ base-dark.css         // Solo si tema = 'dark'
+ base-sunset.css       // Solo si tema = 'sunset'
+ base-ocean.css        // Solo si tema = 'ocean'
```

### Función `applyTheme()`:
```javascript
static applyTheme(theme) {
  // 1. Limpiar todos los CSS de temas anteriores
  const existingThemeCSS = document.querySelectorAll('[data-theme-css]');
  existingThemeCSS.forEach(css => css.remove());
  
  // 2. Limpiar todas las clases del body
  document.body.classList.remove('dark-theme', 'sunset-theme', 'ocean-theme');
  
  // 3. Si es 'light', no hacer nada más (usa base.css)
  if (theme === 'light') return;
  
  // 4. Cargar CSS y aplicar clase del tema seleccionado
  const themeCSS = document.createElement('link');
  themeCSS.setAttribute('data-theme-css', theme);
  themeCSS.href = themeFiles[theme];
  head.appendChild(themeCSS);
  document.body.classList.add(themeClasses[theme]);
}
```

---

## 🎯 Cómo Usar

### Para el Usuario:
1. Abrir modal de Opciones (⚙️)
2. Hacer clic en "🎨 Temas de Color"
3. Seleccionar uno de los 4 temas disponibles
4. El cambio es instantáneo y se guarda en `localStorage`

### Persistencia:
```javascript
// La selección se guarda automáticamente
localStorage.setItem('ginbertfi_theme', 'sunset');

// Se restaura al recargar la página
OpcionesManager.initializeTheme();
```

---

## 🎨 Paletas de Colores

### Sunset Theme:
```css
--pastel-green: #FBBF24  /* Amarillo dorado */
--pastel-blue: #F472B6   /* Rosa vibrante */
--dark-blue: #831843     /* Rosa oscuro */
--pastel-pink: #FB923C   /* Naranja */
```

### Ocean Theme:
```css
--pastel-green: #06B6D4  /* Cyan */
--pastel-blue: #0EA5E9   /* Azul cielo */
--dark-blue: #0C4A6E     /* Azul marino */
--pastel-pink: #22D3EE   /* Turquesa */
```

---

## ✨ Características

### Diferenciación del Header:
- **Light**: Verde → Azul pastel
- **Dark**: Negro gradiente
- **Sunset**: Rosa → Púrpura gradiente (diferente a wallets)
- **Ocean**: Azul marino → Azul claro (profesional)

### Compatibilidad:
- ✅ Todos los componentes adaptados
- ✅ Modales, navegación, FAB
- ✅ Wallets, gastos, pagos
- ✅ Formularios e inputs
- ✅ Scrollbars personalizadas

### Performance:
- Solo 1 CSS de tema cargado simultáneamente
- Cambio instantáneo sin recarga de página
- Cache optimizado en service worker

---

## 🔮 Futuras Extensiones

Para agregar más temas:

1. Crear nuevo archivo CSS: `/css/base-[nombre].css`
2. Agregar al mapeo en `opciones.js`:
   ```javascript
   const themeFiles = {
     'dark': 'css/base-dark.css',
     'sunset': 'css/base-sunset.css',
     'ocean': 'css/base-ocean.css',
     'nuevo': 'css/base-nuevo.css'  // ← Agregar aquí
   };
   ```
3. Agregar opción en `showDesignOptions()`
4. Actualizar service worker con nuevo archivo

---

## 📊 Resultado

**Antes**: 2 temas (Light/Dark)
**Ahora**: 4 temas (Light/Dark/Sunset/Ocean)

El sistema es escalable y permite agregar más temas fácilmente en el futuro.

**Versión**: v3.48
**Estado**: ✅ Completamente funcional
