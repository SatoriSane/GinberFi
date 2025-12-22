# Solución: Error de Base de Datos al Programar Pagos

## 🔴 Problema

Al intentar programar un pago aparece este error:
```
DOMException: IDBDatabase.transaction: 'scheduled_payments' is not a known object store name
```

## 🎯 Causa

La base de datos IndexedDB ya existe en tu navegador en versión 1, pero la nueva funcionalidad de Pagos Programados requiere versión 2. El navegador tiene cacheada la conexión antigua.

## ✅ Solución Automática (RECOMENDADO)

He implementado un script de actualización automática. Sigue estos pasos:

### Opción 1: Recarga Simple (Más Fácil)

1. **Cierra TODAS las pestañas** de la aplicación GinbertFi
2. **Abre una nueva pestaña** y carga la app
3. **Espera 2 segundos** - verás mensajes en consola:
   ```
   🔍 Checking database version...
   ⚠️ Database needs upgrade to version 2
   🔄 Starting database upgrade...
   ✅ Database upgrade completed successfully!
   ```
4. **Actualiza la página** (F5 o Ctrl+R)
5. **Listo** - Ahora puedes programar pagos

### Opción 2: Hard Refresh (Si Opción 1 no funciona)

1. **Cierra todas las pestañas** de la app
2. **Abre DevTools** (F12)
3. **Ve a la pestaña Application**
4. En el menú lateral: **Storage → IndexedDB**
5. **Clic derecho en "GinberFiDB"** → Delete database
6. **Cierra DevTools**
7. **Recarga la página** (Ctrl+Shift+R para hard refresh)
8. La app se recargará automáticamente con la versión 2

## 🔧 Solución Manual (Avanzado)

Si prefieres hacerlo manualmente desde la consola:

```javascript
// 1. Abrir consola del navegador (F12)

// 2. Ejecutar este código:
await DBConfig.resetDB();
await DBConfig.initDB();
await MigrationService.migrateAll();

// 3. Recargar la página
location.reload();
```

## ✅ Verificación

Para confirmar que la actualización fue exitosa:

1. **Abre la consola** (F12)
2. **Ejecuta**:
   ```javascript
   await DBUpgradeV2.verifyUpgrade();
   ```
3. **Deberías ver**:
   ```
   ✅ scheduled_payments store verified!
   ```

## 📊 ¿Qué Hace la Actualización?

1. **Detecta** la versión actual de tu base de datos
2. **Cierra** conexiones existentes
3. **Elimina** la base de datos antigua (v1)
4. **Crea** nueva base de datos (v2) con el store `scheduled_payments`
5. **Restaura** todos tus datos desde localStorage
6. **Verifica** que todo funcionó correctamente

## 💾 ¿Perderé Mis Datos?

**NO.** Tus datos están seguros porque:

- Están respaldados en **localStorage**
- El script de migración los **restaura automáticamente**
- Incluye: wallets, categorías, gastos, transacciones

## 🆘 Si Aún Tienes Problemas

### Error: "Database deletion blocked"

**Causa**: Tienes múltiples pestañas abiertas de la app.

**Solución**:
1. Cierra **TODAS** las pestañas de GinbertFi
2. Abre **UNA SOLA** pestaña nueva
3. Espera a que se complete la actualización

### Error persiste después de todo

**Última opción** (reseteo completo):

1. **Exporta un backup** desde Opciones → Exportar Datos
2. **Limpia todo**:
   ```javascript
   // En consola
   localStorage.clear();
   await DBConfig.resetDB();
   ```
3. **Recarga la página**
4. **Importa tu backup** desde Opciones → Importar Datos

## 📝 Cambios Técnicos

**Base de Datos v1 → v2:**
- ✅ Nuevo store: `scheduled_payments`
- ✅ 7 índices: walletId, categoryId, subcategoryId, dueDate, status, isRecurring, createdAt
- ✅ Mantiene todos los stores existentes

**Archivos agregados:**
- `/js/db/upgrade-db-v2.js` - Script de actualización automática
- Actualizado `db-config.js` con métodos `closeDB()` y `resetDB()`

## ✨ Después de la Actualización

Una vez solucionado, podrás:

- ✅ Programar pagos futuros
- ✅ Crear pagos recurrentes
- ✅ Gestionar suscripciones
- ✅ Ver todos tus pagos pendientes organizados

---

**Versión de la solución**: 1.0  
**Service Worker**: v3.16  
**IndexedDB**: v2
