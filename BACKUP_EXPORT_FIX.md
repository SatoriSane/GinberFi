# Corrección de Exportación de Backups

## 🐛 Problema Identificado

### Síntoma
Cuando exportabas una copia de seguridad después de la migración a IndexedDB y luego intentabas importarla, los datos no se cargaban correctamente.

### Causa Raíz

El método `createBackup()` en `/js/opciones.js` **NO se había actualizado** para usar IndexedDB. Seguía usando el antiguo método `Storage.get()` de localStorage:

```javascript
// ❌ CÓDIGO ANTIGUO (NO FUNCIONABA)
static createBackup() {
  const backupData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      wallets: Storage.get('ginbertfi_wallets') || [],      // ← localStorage
      categories: Storage.get('ginbertfi_categories') || [], // ← localStorage
      expenses: Storage.get('ginbertfi_expenses') || [],     // ← localStorage
      // ...
    }
  };
  // ...
}
```

### ¿Por Qué Fallaba?

```
Flujo INCORRECTO:
┌─────────────────────────────────────────────────────┐
│ 1. Usuario crea gastos → Se guardan en IndexedDB   │
│                                                      │
│ 2. Usuario exporta backup                          │
│    └─> createBackup() lee de localStorage         │
│        └─> localStorage está VACÍO (migrado)      │
│            └─> Backup JSON tiene arrays vacíos [] │
│                                                      │
│ 3. Usuario importa ese backup                      │
│    └─> Importa arrays vacíos                      │
│        └─> ¡Todos los datos desaparecen!          │
└─────────────────────────────────────────────────────┘
```

### ¿Por Qué los Backups Antiguos Funcionaban?

Los backups creados **antes** de la migración a IndexedDB funcionaban porque:

1. Fueron creados cuando la app usaba localStorage
2. Contenían datos reales en el JSON
3. Al importarlos, se copiaban correctamente a IndexedDB

Pero los backups creados **después** de la migración:

1. Se creaban leyendo de localStorage (vacío)
2. Contenían arrays vacíos `[]`
3. Al importarlos, borraban todo

---

## ✅ Solución Implementada

### Código Actualizado

```javascript
// ✅ CÓDIGO NUEVO (FUNCIONA)
static async createBackup() {
  try {
    // Leer TODOS los datos de IndexedDB
    const wallets = await Storage.getWallets();
    const categories = await Storage.getCategories();
    const expenses = await Storage.getExpenses();
    
    // Obtener transacciones
    const transactionRepo = new TransactionRepository();
    const transactions = await transactionRepo.getAll();
    
    // Obtener gastos históricos
    const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
    const historicalExpenses = await historicalRepo.getAll();
    
    // Obtener fuentes de ingreso
    const incomeRepo = new BaseRepository(DBConfig.STORES.INCOME_SOURCES);
    const incomeSources = await incomeRepo.getAll();
    
    // Obtener wallet seleccionada
    const selectedWallet = await Storage.getSelectedWallet();
    
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
        selectedWallet: selectedWallet || null
      }
    };

    // Crear archivo y descargarlo
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `ginbertfi_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.closeModal();
    this.showSuccessMessage('Copia de seguridad creada', 'El archivo se ha descargado correctamente');
    
  } catch (error) {
    console.error('Error creating backup:', error);
    this.showErrorMessage('Error al crear la copia', 'No se pudo generar el archivo de respaldo');
  }
}
```

### Cambios Clave

1. **Método convertido a `async`**
   ```javascript
   static async createBackup() { // ← Agregado async
   ```

2. **Lee de IndexedDB en lugar de localStorage**
   ```javascript
   // ANTES
   Storage.get('ginbertfi_wallets')
   
   // AHORA
   await Storage.getWallets()
   ```

3. **Usa repositorios para datos adicionales**
   ```javascript
   const transactionRepo = new TransactionRepository();
   const transactions = await transactionRepo.getAll();
   
   const historicalRepo = new BaseRepository(DBConfig.STORES.HISTORICAL_EXPENSES);
   const historicalExpenses = await historicalRepo.getAll();
   ```

4. **Mapea incomeSources correctamente**
   ```javascript
   // IndexedDB guarda objetos { name: "Sueldo" }
   // JSON necesita solo strings ["Sueldo", "Freelance"]
   incomeSources: incomeSources ? incomeSources.map(s => s.name || s.id || s) : []
   ```

---

## 🔄 Flujo Corregido

```
Flujo CORRECTO:
┌─────────────────────────────────────────────────────┐
│ 1. Usuario crea gastos → Se guardan en IndexedDB   │
│                                                      │
│ 2. Usuario exporta backup                          │
│    └─> createBackup() lee de IndexedDB ✅         │
│        └─> IndexedDB tiene datos reales           │
│            └─> Backup JSON contiene todos los datos│
│                                                      │
│ 3. Usuario importa ese backup                      │
│    └─> Importa datos reales                       │
│        └─> ¡Todo funciona correctamente! ✅        │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Formato del Backup JSON

El backup exportado ahora tiene esta estructura:

```json
{
  "version": "1.0",
  "timestamp": "2025-12-20T14:10:00.000Z",
  "data": {
    "wallets": [
      {
        "id": "wallet_123",
        "name": "Banco Principal",
        "balance": 1500.50,
        "currency": "USD",
        "description": "Cuenta corriente",
        "createdAt": "2025-11-01T10:00:00.000Z"
      }
    ],
    "categories": [
      {
        "id": "cat_456",
        "name": "Comida",
        "icon": "🍔",
        "subcategories": [
          {
            "id": "sub_789",
            "name": "Restaurantes",
            "budget": 200,
            "startDate": "2025-12-01",
            "endDate": "2025-12-31"
          }
        ]
      }
    ],
    "expenses": [
      {
        "id": "exp_101",
        "name": "Almuerzo",
        "amount": 15.50,
        "date": "2025-12-20",
        "walletId": "wallet_123",
        "categoryId": "cat_456",
        "subcategoryId": "sub_789",
        "createdAt": "2025-12-20T12:30:00.000Z"
      }
    ],
    "transactions": [
      {
        "id": "trans_202",
        "type": "expense",
        "amount": 15.50,
        "walletId": "wallet_123",
        "date": "2025-12-20",
        "description": "Almuerzo"
      }
    ],
    "historicalExpenses": [
      {
        "id": "hist_303",
        "name": "Gasto archivado",
        "amount": 50,
        "date": "2025-11-15",
        "archivedAt": "2025-12-01T00:00:00.000Z"
      }
    ],
    "incomeSources": [
      "Sueldo",
      "Freelance",
      "Inversiones"
    ],
    "selectedWallet": "wallet_123"
  }
}
```

---

## 🧪 Testing

### Cómo Verificar que Funciona

1. **Crear datos en la app**
   ```
   - Crear 1-2 wallets
   - Crear 2-3 categorías con subcategorías
   - Crear 5-10 gastos
   ```

2. **Exportar backup**
   ```
   Opciones → Guardar copia de seguridad
   ```

3. **Verificar el archivo JSON**
   ```
   - Abrir el archivo descargado
   - Verificar que tiene datos reales (no arrays vacíos)
   - Verificar que tiene wallets, categories, expenses, etc.
   ```

4. **Importar el backup**
   ```
   Opciones → Restaurar copia de seguridad → Seleccionar archivo
   ```

5. **Verificar que los datos se restauraron**
   ```
   - Ir a pestaña Gastos → Ver categorías y gastos
   - Ir a pestaña Wallets → Ver cuentas
   - Ir a pestaña Resumen → Ver estadísticas
   ```

### Casos de Prueba

| Caso | Resultado Esperado |
|------|-------------------|
| Exportar con datos | ✅ JSON con datos reales |
| Exportar sin datos | ✅ JSON con arrays vacíos |
| Importar backup nuevo | ✅ Datos se cargan correctamente |
| Importar backup antiguo | ✅ Datos se cargan correctamente |
| Exportar → Importar inmediatamente | ✅ Datos idénticos |

---

## 🔍 Comparación: Antes vs Ahora

### ANTES (Roto)

```javascript
// Exportar
createBackup() {
  const data = Storage.get('ginbertfi_wallets'); // ← localStorage vacío
  // Resultado: JSON con arrays vacíos []
}

// Importar
executeRestore(backup) {
  await Storage.saveWallets(backup.data.wallets); // ← Guarda arrays vacíos
  // Resultado: ¡Datos borrados!
}
```

### AHORA (Funciona)

```javascript
// Exportar
async createBackup() {
  const data = await Storage.getWallets(); // ← IndexedDB con datos
  // Resultado: JSON con datos reales
}

// Importar
async executeRestore(backup) {
  await Storage.saveWallets(backup.data.wallets); // ← Guarda datos reales
  // Resultado: ¡Datos restaurados correctamente!
}
```

---

## 📝 Archivo Modificado

- ✅ `/js/opciones.js` - Método `createBackup()` actualizado

---

## 🎯 Lecciones Aprendidas

### Por Qué Pasó Esto

Durante la migración a IndexedDB:
1. ✅ Se actualizó la **lectura** de datos (Storage.getWallets, etc.)
2. ✅ Se actualizó la **escritura** de datos (Storage.saveWallets, etc.)
3. ✅ Se actualizó la **importación** de backups (executeRestore)
4. ❌ **NO** se actualizó la **exportación** de backups (createBackup)

### Cómo Prevenir en el Futuro

Cuando migres de un sistema de almacenamiento a otro:

```
Checklist de Migración:
☑ Lectura de datos
☑ Escritura de datos
☑ Actualización de datos
☑ Eliminación de datos
☑ Importación de datos
☑ Exportación de datos ← ¡No olvidar!
☑ Búsquedas/Filtros
☑ Validaciones
```

### Patrón para Detectar Código Antiguo

Buscar en el código:
```javascript
// ❌ Patrones antiguos que deben actualizarse:
Storage.get('ginbertfi_*')
Storage.set('ginbertfi_*', *)
localStorage.getItem('ginbertfi_*')
localStorage.setItem('ginbertfi_*', *)

// ✅ Patrones nuevos correctos:
await Storage.getWallets()
await Storage.saveWallets(data)
await repo.getAll()
await repo.add(item)
```

---

## ✅ Conclusión

El problema estaba en que `createBackup()` seguía leyendo de localStorage (vacío) en lugar de IndexedDB (con datos). Ahora está corregido y los backups exportados contienen todos los datos de IndexedDB correctamente.

**¡Ahora puedes exportar e importar backups sin problemas!** 🎉
