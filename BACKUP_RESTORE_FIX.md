# Corrección de Importación de Backups

## Problema Identificado

Al intentar restaurar un backup JSON anterior, la aplicación mostraba el error:
```
Storage.set() is deprecated with IndexedDB
```

Luego se recargaba la página y no mostraba ningún contenido.

## Causa Raíz

El método `executeRestore()` en `/js/opciones.js` estaba usando el antiguo método `Storage.set()` de localStorage, que ya no existe después de la migración a IndexedDB.

```javascript
// ❌ Código antiguo (no funciona con IndexedDB)
Storage.set('ginbertfi_wallets', data.wallets || []);
Storage.set('ginbertfi_categories', data.categories || []);
// ...
```

## Solución Implementada

### 1. Actualización de `executeRestore()` a IndexedDB

**Archivo**: `/js/opciones.js`

Convertido el método a `async` y actualizado para usar los métodos correctos de IndexedDB:

```javascript
static async executeRestore(backupData) {
  try {
    const data = backupData.data;
    
    // Restaurar usando métodos de IndexedDB
    await Storage.saveWallets(data.wallets || []);
    await Storage.saveCategories(data.categories || []);
    await Storage.saveExpenses(data.expenses || []);
    
    // Restaurar transacciones
    const transactionRepo = new TransactionRepository();
    await transactionRepo.clear();
    if (data.transactions && data.transactions.length > 0) {
      for (const transaction of data.transactions) {
        await transactionRepo.add(transaction);
      }
    }
    
    // Restaurar gastos históricos
    const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
    await historicalRepo.clear();
    if (data.historicalExpenses && data.historicalExpenses.length > 0) {
      for (const expense of data.historicalExpenses) {
        await historicalRepo.add(expense);
      }
    }
    
    // Restaurar fuentes de ingreso
    const incomeRepo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
    await incomeRepo.clear();
    if (data.incomeSources && data.incomeSources.length > 0) {
      for (const source of data.incomeSources) {
        await incomeRepo.add({ id: source, name: source });
      }
    }
    
    // Restaurar wallet seleccionada
    if (data.selectedWallet) {
      await Storage.setSelectedWallet(data.selectedWallet);
    }

    // Recargar después de restaurar
    this.closeConfirmRestoreModal();
    this.showSuccessMessage('Datos restaurados', 'La aplicación se recargará...');
    setTimeout(() => window.location.reload(), 2000);
    
  } catch (error) {
    console.error('Error restoring backup:', error);
    this.showErrorMessage('Error al restaurar', 'No se pudieron restaurar los datos');
  }
}
```

### 2. Refactorización de Event Handlers

**Problema**: El botón de confirmación pasaba el objeto completo como string en el `onclick`, lo cual no funciona bien con objetos grandes.

**Solución**: Usar event listeners y almacenar temporalmente los datos:

```javascript
static showRestoreConfirmation(backupData) {
  // Almacenar temporalmente
  this._pendingBackupData = backupData;
  
  // HTML sin onclick inline
  const modalHTML = `
    <button class="btn-cancel" id="cancelRestoreBtn">Cancelar</button>
    <button class="btn-confirm" id="confirmRestoreBtn">Restaurar</button>
  `;
  
  // Event listeners
  document.getElementById('confirmRestoreBtn').addEventListener('click', async () => {
    await this.executeRestore(this._pendingBackupData);
  });
}
```

## Formato de Backup Soportado

El backup JSON debe tener la siguiente estructura:

```json
{
  "version": "1.0",
  "timestamp": "2025-12-01T19:16:06.210Z",
  "data": {
    "wallets": [...],
    "categories": [...],
    "expenses": [...],
    "transactions": [...],
    "historicalExpenses": [...],
    "incomeSources": [...],
    "selectedWallet": "id"
  }
}
```

## Proceso de Restauración

1. **Validación**: Verifica estructura del backup
2. **Confirmación**: Muestra modal de confirmación con fecha del backup
3. **Limpieza**: Limpia cada object store usando `clear()`
4. **Restauración**: Inserta los datos del backup usando repositorios
5. **Recarga**: Recarga la aplicación para aplicar cambios

## Compatibilidad

- ✅ Backups creados con localStorage (formato antiguo)
- ✅ Backups creados con IndexedDB (formato nuevo)
- ✅ Ambos usan la misma estructura JSON

## Testing

Para probar la restauración:

1. Exportar backup actual
2. Hacer cambios en la app
3. Importar el backup exportado
4. Verificar que los datos se restauraron correctamente

## Notas Importantes

- La restauración es **destructiva**: reemplaza todos los datos actuales
- Se muestra confirmación antes de ejecutar
- La app se recarga automáticamente después de restaurar
- Los datos se validan antes de restaurar
- Si hay error, se muestra mensaje y no se aplican cambios

## Archivos Modificados

- `/js/opciones.js` - Método `executeRestore()` y `showRestoreConfirmation()`

## Dependencias

- `Storage` (storage-indexeddb.js)
- `TransactionRepository`
- `BaseRepository`
- `DBConfig`
