# 🔄 Sistema de Actualizaciones de GinbertFi PWA

## ¿Cómo funciona el proceso de actualización?

### 📋 Flujo completo:

1. **Haces cambios y subes a GitHub**
   ```bash
   git add .
   git commit -m "Nueva funcionalidad"
   git push
   ```

2. **Usuario abre la app**
   - El navegador detecta que hay un nuevo `sw.js` (cambió `CACHE_NAME`)
   - Descarga e instala el nuevo Service Worker en segundo plano
   - **El usuario sigue usando la versión antigua**

3. **Sistema de notificación automático**
   - La app detecta que hay una nueva versión instalada
   - Muestra una notificación en pantalla: "Nueva versión disponible"
   - El usuario puede:
     - **Hacer clic en "Actualizar ahora"**: Se actualiza inmediatamente
     - **Hacer clic en "×"**: Descarta la notificación (se actualizará la próxima vez que cierre la app)

4. **Actualización**
   - Si el usuario hace clic en "Actualizar ahora":
     - El nuevo SW se activa inmediatamente
     - La app se recarga automáticamente
     - El usuario ve la nueva versión
   - Si el usuario descarta:
     - La actualización se aplicará cuando cierre todas las pestañas de la app

---

## ✅ Checklist para desplegar actualizaciones

### 1. **Incrementa la versión del cache**
```javascript
// En sw.js
const CACHE_NAME = 'ginbertfi-v2.6'; // Incrementa el número
```

⚠️ **IMPORTANTE**: Si no cambias `CACHE_NAME`, el navegador NO detectará que hay una actualización.

### 2. **Haz commit y push**
```bash
git add .
git commit -m "Descripción de los cambios"
git push origin main
```

### 3. **Los usuarios verán la actualización**
- **Automáticamente**: La próxima vez que abran la app (si está desplegada en un servidor)
- **Con notificación**: Verán el banner "Nueva versión disponible"
- **Verificación cada minuto**: La app verifica actualizaciones cada 60 segundos

---

## 🎯 Comportamiento del usuario

### Escenario 1: Usuario activo (app abierta)
1. Usuario tiene la app abierta
2. Haces push de una actualización
3. Dentro de 1 minuto, la app detecta la actualización
4. Aparece notificación: "Nueva versión disponible"
5. Usuario hace clic en "Actualizar ahora"
6. La app se recarga con la nueva versión

### Escenario 2: Usuario cierra la app
1. Usuario tiene la app abierta con una actualización pendiente
2. Usuario cierra la app (cierra todas las pestañas)
3. Usuario vuelve a abrir la app
4. **Automáticamente** se carga la nueva versión

### Escenario 3: Usuario ignora la notificación
1. Aparece notificación de actualización
2. Usuario hace clic en "×" (descartar)
3. Usuario sigue usando la versión antigua
4. Cuando cierre y vuelva a abrir, se actualizará automáticamente

---

## 🔍 Verificación de actualizaciones

### Frecuencia de verificación:
- **Cada 60 segundos**: Mientras la app está abierta
- **Al abrir la app**: Siempre verifica si hay actualizaciones
- **Al recargar**: Verifica actualizaciones

### Cómo saber si hay una actualización:
1. Abre las DevTools (F12)
2. Ve a la pestaña "Console"
3. Busca mensajes:
   - `"Nueva versión de la app detectada, instalando..."`
   - `"Nueva versión instalada, esperando activación"`

---

## 🛠️ Archivos modificados

### `/js/app.js`
- **Línea 62-65**: Verifica actualizaciones cada 60 segundos
- **Línea 68-79**: Detecta cuando hay una nueva versión
- **Línea 86-92**: Recarga automáticamente cuando se activa el nuevo SW
- **Línea 97-222**: Muestra notificación de actualización con UI

### `/sw.js`
- **Línea 2**: `CACHE_NAME` - Incrementa esto en cada actualización
- **Línea 99-104**: Escucha el comando `SKIP_WAITING` para activar inmediatamente

---

## 📊 Estrategia de versionado

### Recomendación:
```javascript
// Formato: ginbertfi-vMAJOR.MINOR
const CACHE_NAME = 'ginbertfi-v2.5';

// Incrementa MINOR para cambios pequeños:
// v2.5 → v2.6 → v2.7

// Incrementa MAJOR para cambios grandes:
// v2.9 → v3.0
```

### Cuándo incrementar:
- ✅ **Siempre** que quieras que los usuarios reciban una actualización
- ✅ Cuando cambias archivos JS, CSS o HTML
- ✅ Cuando agregas nuevas funcionalidades
- ❌ No es necesario para cambios en README o documentación

---

## 🐛 Solución de problemas

### "Los usuarios no ven la actualización"

**Posibles causas:**
1. No incrementaste `CACHE_NAME` en `sw.js`
2. El servidor no está sirviendo la nueva versión
3. El navegador tiene cache del servidor (no del SW)

**Solución:**
1. Verifica que `CACHE_NAME` cambió
2. Haz hard refresh: `Ctrl + Shift + R` (Windows/Linux) o `Cmd + Shift + R` (Mac)
3. Desregistra el SW manualmente:
   - DevTools → Application → Service Workers → Unregister

### "La actualización no se aplica inmediatamente"

**Esto es normal.** El nuevo SW se instala pero no se activa hasta que:
- El usuario hace clic en "Actualizar ahora", O
- El usuario cierra todas las pestañas de la app

**Para forzar actualización inmediata:**
- El usuario debe hacer clic en el botón "Actualizar ahora" de la notificación

### "Quiero forzar actualización sin notificación"

Cambia en `sw.js` línea 54:
```javascript
// Antes:
.then(() => self.skipWaiting())

// Esto ya fuerza la actualización, pero la notificación da mejor UX
```

---

## 📱 Comportamiento en diferentes plataformas

### Android (Chrome/Edge)
- ✅ Detecta actualizaciones automáticamente
- ✅ Muestra notificación de actualización
- ✅ Actualización instantánea al hacer clic

### iOS (Safari)
- ✅ Detecta actualizaciones automáticamente
- ✅ Muestra notificación de actualización
- ⚠️ Puede tardar más en verificar actualizaciones

### Desktop (Chrome/Edge/Firefox)
- ✅ Detecta actualizaciones automáticamente
- ✅ Muestra notificación de actualización
- ✅ Actualización instantánea al hacer clic

---

## 🎨 Personalización de la notificación

La notificación de actualización se puede personalizar en `/js/app.js` línea 101-111:

```javascript
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
```

Puedes cambiar:
- El icono (🔄)
- El título ("Nueva versión disponible")
- El mensaje
- El texto del botón

---

## 📈 Mejores prácticas

### ✅ DO:
- Incrementa `CACHE_NAME` en cada actualización
- Prueba la actualización en local antes de hacer push
- Comunica cambios importantes a los usuarios
- Mantén un changelog de versiones

### ❌ DON'T:
- No olvides incrementar `CACHE_NAME`
- No hagas actualizaciones muy frecuentes (espera a tener varios cambios)
- No fuerces actualizaciones sin notificar al usuario
- No elimines el sistema de notificación (mala UX)

---

## 🔗 Recursos adicionales

- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [PWA Update Patterns](https://web.dev/service-worker-lifecycle/#update-on-reload)
- [Workbox (alternativa avanzada)](https://developers.google.com/web/tools/workbox)
