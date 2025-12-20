# Corrección de Error en selectedWallet

## 🐛 Problema Identificado

### Síntoma
Al importar un backup (especialmente uno recién exportado), aparecía este error en consola:

```
Error getting selected wallet: DOMException: Data provided to an operation does not meet requirements.
    getById http://127.0.0.1:8080/js/db/base-repository.js:37
    getSelectedWallet http://127.0.0.1:8080/js/storage-indexeddb.js:101
```

### Causa Raíz

Había **dos problemas** relacionados con `selectedWallet`:

#### Problema 1: Exportación Incorrecta

```javascript
// ❌ ANTES - Exportaba el objeto completo
const selectedWallet = await Storage.getSelectedWallet();
// selectedWallet = { id: "wallet_123", name: "Banco", balance: 1000, ... }

const backupData = {
  data: {
    selectedWallet: selectedWallet  // ← Objeto completo en JSON
  }
};
```

**Resultado en JSON:**
```json
{
  "selectedWallet": {
    "id": "wallet_123",
    "name": "Banco Principal",
    "balance": 1000,
    "currency": "USD"
  }
}
```

#### Problema 2: Importación Sin Validación

```javascript
// ❌ ANTES - Asumía que era un string
if (data.selectedWallet) {
  await Storage.setSelectedWallet(data.selectedWallet);
  // Si data.selectedWallet es un objeto, falla!
}
```

#### Problema 3: setSelectedWallet No Manejaba Casos Nuevos

```javascript
// ❌ ANTES - Solo hacía update
await settingsRepo.update({
  key: 'selected_wallet',
  value: walletId
});
// Si el setting no existe, falla con DOMException
```

### ¿Por Qué Fallaba?

```
Flujo del Error:
┌─────────────────────────────────────────────────────┐
│ 1. Exportar backup                                  │
│    └─> selectedWallet = objeto completo            │
│        └─> JSON tiene: { id: "x", name: "y", ... } │
│                                                      │
│ 2. Importar backup                                  │
│    └─> Intenta guardar objeto en settings          │
│        └─> IndexedDB espera: { key: "...", value: "id" }│
│            └─> Recibe: objeto completo ❌          │
│                └─> DOMException!                   │
└─────────────────────────────────────────────────────┘
```

---

## ✅ Solución Implementada

### 1. Exportación: Solo Guardar el ID

**Archivo**: `/js/opciones.js`

```javascript
// ✅ AHORA - Solo exporta el ID
const selectedWallet = await Storage.getSelectedWallet();
const selectedWalletId = selectedWallet ? selectedWallet.id : null;

const backupData = {
  version: '1.0',
  timestamp: new Date().toISOString(),
  data: {
    wallets: wallets || [],
    categories: categories || [],
    expenses: expenses || [],
    transactions: transactions || [],
    historicalExpenses: historicalExpenses || [],
    incomeSources: incomeSources ? incomeSources.map(s => s.name || s.id || s) : [],
    selectedWallet: selectedWalletId  // ← Solo el ID (string)
  }
};
```

**Resultado en JSON:**
```json
{
  "selectedWallet": "wallet_123"
}
```

### 2. Importación: Validar Tipo de Dato

**Archivo**: `/js/opciones.js`

```javascript
// ✅ AHORA - Valida si es string u objeto
if (data.selectedWallet) {
  // Asegurarse de que sea solo el ID, no el objeto completo
  const walletId = typeof data.selectedWallet === 'string' 
    ? data.selectedWallet           // ← Ya es string (backup nuevo)
    : data.selectedWallet.id;       // ← Es objeto (backup antiguo)
  
  if (walletId) {
    await Storage.setSelectedWallet(walletId);
  }
}
```

### 3. setSelectedWallet: Manejar Casos Nuevos

**Archivo**: `/js/storage-indexeddb.js`

```javascript
// ✅ AHORA - Intenta update, si falla hace add
static async setSelectedWallet(walletId) {
  try {
    const settingsRepo = new BaseRepository(DBConfig.STORES.SETTINGS);
    const setting = {
      key: 'selected_wallet',
      value: walletId
    };
    
    // Intentar actualizar, si no existe, agregar
    try {
      await settingsRepo.update(setting);
    } catch (updateError) {
      // Si falla el update (no existe), hacer add
      await settingsRepo.add(setting);
    }
    
    return true;
  } catch (error) {
    console.error('Error setting selected wallet:', error);
    return false;
  }
}
```

---

## 🔄 Flujo Corregido

### Exportación

```
1. Storage.getSelectedWallet()
   └─> Devuelve: { id: "wallet_123", name: "Banco", ... }
   
2. Extraer solo el ID
   └─> selectedWalletId = selectedWallet.id
   └─> selectedWalletId = "wallet_123"
   
3. Guardar en JSON
   └─> "selectedWallet": "wallet_123"
```

### Importación

```
1. Leer data.selectedWallet del JSON
   
2. Validar tipo:
   ├─> Si es string: usar directamente
   └─> Si es objeto: extraer .id
   
3. Storage.setSelectedWallet(walletId)
   ├─> Intentar update en settings
   └─> Si falla: hacer add
   
4. ✅ Guardado correctamente
```

---

## 📊 Compatibilidad

### Backups Antiguos (Objeto Completo)

```json
{
  "selectedWallet": {
    "id": "wallet_123",
    "name": "Banco Principal",
    "balance": 1000
  }
}
```

✅ **Funciona**: La validación extrae el `.id`

### Backups Nuevos (Solo ID)

```json
{
  "selectedWallet": "wallet_123"
}
```

✅ **Funciona**: Se usa directamente

### Sin Wallet Seleccionada

```json
{
  "selectedWallet": null
}
```

✅ **Funciona**: Se ignora, no se guarda nada

---

## 🧪 Testing

### Caso 1: Exportar e Importar Inmediatamente

```
1. Tener wallet seleccionada
2. Exportar backup
3. Verificar JSON: "selectedWallet": "wallet_xxx"
4. Importar ese backup
5. ✅ Wallet seleccionada se mantiene
```

### Caso 2: Importar Backup Antiguo

```
1. Tener backup antiguo con objeto completo
2. Importar backup
3. ✅ Extrae el ID correctamente
4. ✅ No hay error en consola
```

### Caso 3: Importar Sin Wallet Seleccionada

```
1. Backup con "selectedWallet": null
2. Importar backup
3. ✅ Se selecciona la primera wallet automáticamente
```

### Caso 4: Primera Vez (Settings Vacío)

```
1. Base de datos nueva
2. Importar backup
3. setSelectedWallet hace add (no update)
4. ✅ Setting se crea correctamente
```

---

## 🔍 Comparación: Antes vs Ahora

### ANTES (Con Errores)

```javascript
// Exportar
const selectedWallet = await Storage.getSelectedWallet();
// → { id: "x", name: "y", balance: 1000 }

backupData.selectedWallet = selectedWallet;
// → JSON tiene objeto completo

// Importar
await Storage.setSelectedWallet(data.selectedWallet);
// → Intenta guardar objeto completo
// → DOMException! ❌

// setSelectedWallet
await settingsRepo.update({ key: '...', value: walletId });
// → Si no existe, falla ❌
```

### AHORA (Corregido)

```javascript
// Exportar
const selectedWallet = await Storage.getSelectedWallet();
const selectedWalletId = selectedWallet ? selectedWallet.id : null;
// → "wallet_123"

backupData.selectedWallet = selectedWalletId;
// → JSON tiene solo ID (string)

// Importar
const walletId = typeof data.selectedWallet === 'string'
  ? data.selectedWallet
  : data.selectedWallet.id;
// → Siempre extrae el ID correctamente

await Storage.setSelectedWallet(walletId);
// → Guarda solo el ID ✅

// setSelectedWallet
try {
  await settingsRepo.update(setting);
} catch {
  await settingsRepo.add(setting);
}
// → Funciona siempre ✅
```

---

## 📝 Archivos Modificados

1. ✅ `/js/opciones.js`
   - `createBackup()`: Extrae solo el ID
   - `executeRestore()`: Valida tipo de dato

2. ✅ `/js/storage-indexeddb.js`
   - `setSelectedWallet()`: Maneja add/update

---

## 🎯 Lecciones Aprendidas

### 1. Consistencia en Formato de Datos

```
Regla: Los backups JSON deben guardar IDs, no objetos completos

✅ CORRECTO:
{
  "selectedWallet": "wallet_123",
  "expenses": [
    { "walletId": "wallet_123", ... }  // ← Solo IDs
  ]
}

❌ INCORRECTO:
{
  "selectedWallet": { id: "wallet_123", name: "...", ... },
  "expenses": [
    { "wallet": { id: "wallet_123", ... }, ... }  // ← Objetos completos
  ]
}
```

### 2. Validación de Tipos

```javascript
// Siempre validar tipo antes de usar
const id = typeof data.field === 'string' 
  ? data.field 
  : data.field.id;
```

### 3. Manejo de Errores en Operaciones DB

```javascript
// Intentar update, si falla hacer add
try {
  await repo.update(item);
} catch {
  await repo.add(item);
}
```

### 4. Backward Compatibility

```javascript
// Soportar ambos formatos (antiguo y nuevo)
const value = typeof data === 'string' 
  ? data           // Nuevo formato
  : data.id;       // Formato antiguo
```

---

## 🚀 Mejoras Futuras (Opcional)

### Validación de Schema en Importación

```javascript
function validateBackupSchema(backup) {
  // Validar estructura
  if (!backup.version || !backup.data) {
    throw new Error('Invalid backup format');
  }
  
  // Normalizar selectedWallet
  if (backup.data.selectedWallet && typeof backup.data.selectedWallet === 'object') {
    backup.data.selectedWallet = backup.data.selectedWallet.id;
  }
  
  return backup;
}
```

### Versioning de Backups

```javascript
// Diferentes versiones de backup
{
  "version": "2.0",  // ← Incrementar cuando cambie formato
  "schemaVersion": 2,
  "data": { ... }
}

// Al importar, migrar según versión
if (backup.version === "1.0") {
  backup = migrateV1toV2(backup);
}
```

---

## ✅ Conclusión

El problema estaba en que:
1. **Exportación** guardaba el objeto wallet completo en lugar del ID
2. **Importación** no validaba si era string u objeto
3. **setSelectedWallet** no manejaba el caso de crear un nuevo setting

Ahora:
- ✅ Exportación guarda solo el ID
- ✅ Importación valida y extrae el ID correctamente
- ✅ setSelectedWallet maneja add/update automáticamente
- ✅ Compatible con backups antiguos y nuevos

**¡No más errores de DOMException al importar backups!** 🎉
