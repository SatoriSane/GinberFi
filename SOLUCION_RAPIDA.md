# ⚡ Solución Rápida - Resetear Base de Datos

## 🎯 Tu Problema

Tu base de datos está en un estado inconsistente:
- ✅ Versión: 2
- ❌ Store `scheduled_payments`: NO EXISTE

Esto ocurre cuando la versión se incrementó pero el upgrade no se ejecutó correctamente.

## 🔧 Solución en 3 Pasos (30 segundos)

### **OPCIÓN 1: Desde la Consola del Navegador** ⭐ (MÁS RÁPIDO)

1. **Abre la consola** del navegador (F12)

2. **Copia y pega este código** exactamente como está:
   ```javascript
   // Paso 1: Cerrar y eliminar DB
   indexedDB.deleteDatabase('GinberFiDB');
   
   // Paso 2: Recargar después de 1 segundo
   setTimeout(() => location.reload(), 1000);
   ```

3. **Presiona Enter** y espera a que se recargue la página

4. **¡Listo!** La app se recargará con la DB correcta

### **OPCIÓN 2: Desde DevTools** (VISUAL)

1. **Abre DevTools** (F12)
2. **Ve a la pestaña "Application"**
3. En el menú lateral: **Storage** → **IndexedDB**
4. **Clic derecho en "GinberFiDB"** → **Delete database**
5. **Recarga la página** (F5 o Ctrl+R)

## ✅ Verificación

Después de recargar, abre la consola y deberías ver:

```
🔍 Checking database version...
Current DB version: 0  (o 1)
⚠️ Database needs upgrade to version 2
🔄 Starting database upgrade...
✓ Database upgraded to version 2
✅ Database upgrade completed successfully!
✅ scheduled_payments store verified!
```

## 💾 ¿Perderé mis datos?

**NO**. Tus datos están seguros en localStorage y se restaurarán automáticamente:
- Wallets ✅
- Categorías ✅
- Gastos ✅
- Transacciones ✅

## 🔍 Si Quieres Verificar Manualmente

Después de la recarga, ejecuta en consola:

```javascript
// Verificar que el store existe
const request = indexedDB.open('GinberFiDB');
request.onsuccess = () => {
  const db = request.result;
  console.log('Version:', db.version);
  console.log('Stores:', Array.from(db.objectStoreNames));
  console.log('Has scheduled_payments:', db.objectStoreNames.contains('scheduled_payments'));
  db.close();
};
```

Deberías ver:
```
Version: 2
Stores: Array(8) [ "wallets", "categories", "expenses", ... "scheduled_payments" ]
Has scheduled_payments: true
```

## 📝 Explicación Técnica (Opcional)

El problema ocurrió porque:
1. IndexedDB intentó actualizar de v1 a v2
2. El evento `onupgradeneeded` se disparó
3. Pero por alguna razón (conexión existente, timing, cache), el store no se creó
4. La versión se incrementó a 2, pero sin el store necesario

La solución es **forzar el reseteo completo** eliminando la DB y permitiendo que se recree desde cero con todos los stores correctos.

---

**Tiempo estimado**: 30 segundos  
**Dificultad**: Muy fácil (copy-paste)  
**Riesgo de pérdida de datos**: 0% (todo en localStorage)
