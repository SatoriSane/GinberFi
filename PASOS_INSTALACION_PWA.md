# 📱 Pasos para instalar GinbertFi como PWA

## ✅ Cambios realizados (comparando con tu otra app)

### 1. **Rutas relativas en lugar de absolutas**
- ✅ `manifest.json`: Cambiado `start_url: "/"` → `start_url: "./"`
- ✅ `manifest.json`: Cambiado `scope: "/"` → `scope: "./"`
- ✅ `manifest.json`: Iconos sin `/` inicial
- ✅ `sw.js`: Todas las rutas ahora son relativas
- ✅ `index.html`: Links a manifest e iconos con `./`

### 2. **Screenshots agregados**
- ✅ Agregado campo `screenshots` en manifest.json (requerido para instalabilidad)

### 3. **Meta tags mejorados**
- ✅ Agregado `<meta name="description">`
- ✅ Agregado `<meta name="mobile-web-app-capable">`
- ✅ Agregado `<link rel="icon">` y `<link rel="apple-touch-icon">`

### 4. **Service Worker mejorado**
- ✅ Estrategia Network First (igual que tu otra app)
- ✅ Mejor manejo de errores
- ✅ Mejor logging para debug
- ✅ Validación de peticiones GET y HTTP/HTTPS

---

## 🎨 PASO 1: Generar los iconos (IMPORTANTE)

**Sin los iconos, Chrome NO mostrará la opción de instalar.**

### Opción A: Usar el generador incluido
1. Abre `generate-icons.html` en tu navegador
2. Sube la imagen `rank-piggy.png` (o cualquier otra imagen cuadrada)
3. Haz clic en "Generar Iconos"
4. Descarga TODOS los iconos (8 archivos)
5. Guárdalos en la raíz del proyecto con estos nombres exactos:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png`
   - `icon-384x384.png`
   - `icon-512x512.png`

### Opción B: Usar herramienta online
- https://www.pwabuilder.com/imageGenerator
- Sube tu imagen y descarga todos los tamaños

---

## 🚀 PASO 2: Limpiar cache y probar

### En Android Chrome:

1. **Cierra TODAS las pestañas de tu app**

2. **Borra datos del sitio:**
   - Abre Chrome
   - Ve a Configuración → Privacidad y seguridad → Borrar datos de navegación
   - Selecciona "Avanzado"
   - Marca:
     - ✅ Cookies y datos de sitios
     - ✅ Imágenes y archivos en caché
   - Borra los datos

3. **O desde DevTools (si tienes acceso):**
   - Abre tu app en Chrome
   - Abre DevTools (menú → Más herramientas → Herramientas para desarrolladores)
   - Ve a Application → Storage
   - Haz clic en "Clear site data"

4. **Vuelve a abrir tu app**
   - Espera unos segundos
   - Deberías ver un banner de instalación O
   - Un ícono de instalación en la barra de direcciones

5. **Instala la app:**
   - Toca "Instalar" o "Añadir a pantalla de inicio"
   - Acepta el diálogo

6. **Abre la app instalada:**
   - Busca el ícono de GinbertFi en tu pantalla de inicio
   - Al abrirla, NO debería aparecer la barra del navegador
   - Debería verse como una app nativa

---

## 🔍 PASO 3: Verificar con DevTools (Desktop)

Si tienes acceso a Chrome en desktop:

1. **Abre tu app en Chrome desktop**

2. **Abre DevTools (F12)**

3. **Ve a la pestaña "Application"**

4. **Verifica Manifest:**
   - Clic en "Manifest" en el panel izquierdo
   - Deberías ver todos los campos correctamente
   - No debería haber errores en rojo

5. **Verifica Service Worker:**
   - Clic en "Service Workers"
   - Debería aparecer `sw.js` como "activated and running"
   - Si aparece un SW antiguo, haz clic en "Unregister" y recarga

6. **Usa Lighthouse:**
   - Clic en la pestaña "Lighthouse"
   - Selecciona "Progressive Web App"
   - Haz clic en "Generate report"
   - Debería pasar la mayoría de checks de PWA

---

## 🐛 Solución de problemas

### "Sigue sin aparecer la opción de instalar"

**Checklist:**
- [ ] ¿Existen TODOS los archivos de iconos (8 archivos)?
- [ ] ¿Los iconos tienen los nombres EXACTOS? (icon-72x72.png, etc.)
- [ ] ¿Borraste el cache completamente?
- [ ] ¿Cerraste todas las pestañas de la app?
- [ ] ¿Estás usando HTTPS o localhost?
- [ ] ¿El manifest.json se carga correctamente? (abre: tu-url/manifest.json)

**Si todo lo anterior está bien:**
1. Desregistra el Service Worker antiguo:
   - DevTools → Application → Service Workers → Unregister
2. Borra todo el storage:
   - DevTools → Application → Clear storage → Clear site data
3. Cierra Chrome completamente
4. Vuelve a abrir y espera 30 segundos

### "Se instala pero sigue mostrando la barra del navegador"

**Causa:** El manifest no se está cargando correctamente

**Solución:**
1. Verifica que `manifest.json` tenga `"display": "standalone"`
2. Verifica que el link en HTML sea: `<link rel="manifest" href="./manifest.json">`
3. Desinstala la app del teléfono
4. Borra cache
5. Vuelve a instalar

### "Los iconos no se ven"

**Causa:** Los archivos no existen o tienen nombres incorrectos

**Solución:**
1. Verifica que los 8 archivos de iconos existan en la raíz
2. Usa el generador `generate-icons.html` para crearlos
3. Asegúrate de que los nombres sean EXACTOS (minúsculas, guiones)

---

## 📊 Diferencias clave con tu otra app (Final Fantasy Tasks)

| Aspecto | Final Fantasy Tasks | GinbertFi (Ahora) |
|---------|---------------------|-------------------|
| Rutas | Relativas (`./`) | ✅ Relativas (`./`) |
| Screenshots | ✅ Tiene | ✅ Agregado |
| Scope | `./` | ✅ `./` |
| Meta description | ✅ Tiene | ✅ Agregado |
| mobile-web-app-capable | ✅ Tiene | ✅ Agregado |
| Estrategia fetch | Network First | ✅ Network First |
| Manejo errores SW | ✅ Robusto | ✅ Mejorado |

---

## ✅ Checklist final antes de probar

- [ ] Los 8 archivos de iconos existen en la raíz
- [ ] Cache del navegador borrado
- [ ] Todas las pestañas de la app cerradas
- [ ] Service Worker anterior desregistrado
- [ ] App abierta en HTTPS o localhost
- [ ] Esperado al menos 30 segundos después de abrir

---

## 🎯 Resultado esperado

Cuando todo funcione:
1. ✅ Chrome mostrará un banner de instalación
2. ✅ O verás un ícono de instalación en la barra de direcciones
3. ✅ Al instalar, la app se agregará a tu pantalla de inicio
4. ✅ Al abrir, NO verás la barra del navegador
5. ✅ Se verá como una app nativa de Android

---

## 📞 Si aún no funciona

Comparte:
1. URL de tu app
2. Screenshot del panel "Manifest" en DevTools
3. Screenshot del panel "Service Workers" en DevTools
4. Errores en la consola (si los hay)
