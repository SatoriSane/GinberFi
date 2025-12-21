# 🔍 Diagnóstico: Últimos 3 movimientos vs Modal

## Problema reportado

En el móvil, los últimos 3 movimientos mostrados en cada wallet no coinciden con las primeras 3 transacciones del modal "Ver todos".

## Posibles causas

### 1. **Caché del Service Worker (MÁS PROBABLE)**

El móvil puede estar usando una versión antigua del código JavaScript cacheada por el Service Worker.

**Solución:**
1. En el móvil, abre la app
2. Espera a que aparezca la notificación "Nueva versión disponible"
3. Haz clic en "Actualizar ahora"
4. Si no aparece la notificación:
   - Cierra completamente la app (cierra todas las pestañas/ventanas)
   - Vuelve a abrir la app

**Verificación:**
- Abre DevTools en el móvil (si es posible) o usa Chrome Remote Debugging
- Ve a Application → Service Workers
- Verifica que la versión sea `ginbertfi-v3.1` o superior

### 2. **Problema con IndexedDB en móvil**

El método `getByWalletId()` puede estar devolviendo datos en diferente orden en móvil vs desktop.

**Verificación:**
1. En el móvil, abre la app
2. Abre DevTools (Chrome Remote Debugging)
3. Ve a la pestaña Console
4. Busca los logs:
   - `[Últimos 3] Wallet XXX: N transacciones totales`
   - `[Últimos 3] Transacciones mostradas: [...]`
   - `[Modal] Wallet XXX: N transacciones totales`
   - `[Modal] Primeras 3 transacciones: [...]`

**Comparar:**
- ¿Los IDs de las transacciones coinciden?
- ¿Los `createdAt` están en el mismo orden?
- ¿Hay diferencias en los datos?

### 3. **Problema con el ordenamiento de strings**

El método `localeCompare()` puede comportarse diferente en diferentes navegadores/dispositivos.

**Verificación en logs:**
- Verifica que `createdAt` o `id` existan en todas las transacciones
- Verifica que sean strings válidos (no `null` o `undefined`)

---

## Cómo usar Chrome Remote Debugging (Android)

### Requisitos:
- Cable USB
- Chrome en desktop
- Chrome en móvil
- Habilitar "Depuración USB" en el móvil

### Pasos:

1. **En el móvil:**
   - Ve a Configuración → Opciones de desarrollador
   - Activa "Depuración USB"

2. **Conecta el móvil al PC con USB**

3. **En Chrome desktop:**
   - Abre `chrome://inspect`
   - Verifica que tu dispositivo aparezca
   - Haz clic en "inspect" debajo de tu PWA

4. **En DevTools:**
   - Ve a la pestaña "Console"
   - Navega en la app del móvil
   - Los logs aparecerán en la consola del desktop

---

## Logs agregados para debug

### En `/js/huchas.js` (líneas 130-151):

```javascript
// Log de cuántas transacciones totales hay
console.log(`[Últimos 3] Wallet ${walletId}: ${transactions.length} transacciones totales`);

// Log de las 3 transacciones que se van a mostrar
console.log('[Últimos 3] Transacciones mostradas:', walletTransactions.map(tx => ({
  id: tx.id,
  description: tx.description,
  amount: tx.amount,
  date: tx.date,
  createdAt: tx.createdAt
})));
```

### En `/js/modals.js` (líneas 1111-1130):

```javascript
// Log de cuántas transacciones totales hay
console.log(`[Modal] Wallet ${wallet.id}: ${transactions.length} transacciones totales`);

// Log de las primeras 3 transacciones del modal
console.log('[Modal] Primeras 3 transacciones:', walletTransactions.slice(0, 3).map(tx => ({
  id: tx.id,
  description: tx.description,
  amount: tx.amount,
  date: tx.date,
  createdAt: tx.createdAt
})));
```

---

## Qué buscar en los logs

### ✅ Caso correcto:

```
[Últimos 3] Wallet abc123: 10 transacciones totales
[Últimos 3] Transacciones mostradas: [
  { id: "1734820000000", description: "Café", amount: -5.50, date: "2024-12-21", createdAt: "2024-12-21T18:00:00.000Z" },
  { id: "1734819000000", description: "Pan", amount: -2.00, date: "2024-12-21", createdAt: "2024-12-21T17:50:00.000Z" },
  { id: "1734818000000", description: "Leche", amount: -3.00, date: "2024-12-21", createdAt: "2024-12-21T17:40:00.000Z" }
]

[Modal] Wallet abc123: 10 transacciones totales
[Modal] Primeras 3 transacciones: [
  { id: "1734820000000", description: "Café", amount: -5.50, date: "2024-12-21", createdAt: "2024-12-21T18:00:00.000Z" },
  { id: "1734819000000", description: "Pan", amount: -2.00, date: "2024-12-21", createdAt: "2024-12-21T17:50:00.000Z" },
  { id: "1734818000000", description: "Leche", amount: -3.00, date: "2024-12-21", createdAt: "2024-12-21T17:40:00.000Z" }
]
```

**Los IDs coinciden → Todo está bien**

### ❌ Caso incorrecto:

```
[Últimos 3] Wallet abc123: 10 transacciones totales
[Últimos 3] Transacciones mostradas: [
  { id: "1734820000000", description: "Café", amount: -5.50, date: "2024-12-21", createdAt: "2024-12-21T18:00:00.000Z" },
  { id: "1734800000000", description: "Desayuno", amount: -8.00, date: "2024-12-20", createdAt: "2024-12-20T09:00:00.000Z" },
  { id: "1734700000000", description: "Cena", amount: -15.00, date: "2024-12-19", createdAt: "2024-12-19T20:00:00.000Z" }
]

[Modal] Wallet abc123: 10 transacciones totales
[Modal] Primeras 3 transacciones: [
  { id: "1734820000000", description: "Café", amount: -5.50, date: "2024-12-21", createdAt: "2024-12-21T18:00:00.000Z" },
  { id: "1734819000000", description: "Pan", amount: -2.00, date: "2024-12-21", createdAt: "2024-12-21T17:50:00.000Z" },
  { id: "1734818000000", description: "Leche", amount: -3.00, date: "2024-12-21", createdAt: "2024-12-21T17:40:00.000Z" }
]
```

**Los IDs NO coinciden → Hay un problema con el ordenamiento en "Últimos 3"**

---

## Soluciones según el problema encontrado

### Si el problema es caché:
1. Incrementa `CACHE_NAME` en `sw.js` (ya está en v3.1)
2. Haz push
3. En el móvil, espera la notificación de actualización
4. Haz clic en "Actualizar ahora"

### Si el problema es con `localeCompare()`:
Cambiar el ordenamiento a comparación numérica:

```javascript
.sort((a, b) => {
  const timeA = parseInt(a.createdAt || a.id);
  const timeB = parseInt(b.createdAt || b.id);
  return timeB - timeA;
})
```

### Si el problema es con `getByWalletId()`:
Verificar que el índice de IndexedDB esté funcionando correctamente en móvil.

---

## Próximos pasos

1. **Hacer push** de los cambios con logs de debug
2. **Esperar** a que el móvil detecte la actualización (v3.1)
3. **Actualizar** la app en el móvil
4. **Revisar** los logs en Chrome Remote Debugging
5. **Reportar** qué muestran los logs para diagnosticar el problema exacto

---

## Eliminar logs después de diagnosticar

Una vez identificado el problema, eliminar los `console.log()` agregados en:
- `/js/huchas.js` líneas 130-131 y 144-151
- `/js/modals.js` líneas 1111-1112 y 1123-1130

Y incrementar `CACHE_NAME` a v3.2 para desplegar la versión sin logs.
