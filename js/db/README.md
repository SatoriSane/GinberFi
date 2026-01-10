# IndexedDB Layer - Estructura

Esta carpeta contiene la capa de persistencia basada en IndexedDB para GinberFi.

## Archivos

### `db-config.js` (145 líneas)
Configuración central de la base de datos:
- Nombre y versión de la DB
- Definición de object stores
- Definición de índices
- Inicialización de la base de datos
- Creación de stores e índices en upgrade

### `base-repository.js` (200 líneas)
Repositorio base con operaciones CRUD genéricas:
- `getAll()` - Obtener todos los registros
- `getById(id)` - Obtener por ID
- `add(data)` - Agregar registro
- `update(data)` - Actualizar registro
- `delete(id)` - Eliminar registro
- `deleteMany(ids)` - Eliminar múltiples
- `clear()` - Limpiar store
- `getByIndex(indexName, value)` - Buscar por índice
- `getByIndexRange(indexName, lower, upper)` - Buscar por rango
- `count()` - Contar registros
- `updateMany(records)` - Actualizar múltiples

### `wallet-repository.js` (75 líneas)
Operaciones especializadas para wallets:
- `addWallet(wallet)` - Agregar con ID auto-generado
- `updateBalance(walletId, newBalance)` - Actualizar balance
- `incrementBalance(walletId, amount)` - Incrementar (ingresos)
- `decrementBalance(walletId, amount)` - Decrementar (gastos)
- `getWalletsByCurrency(currency)` - Filtrar por moneda
- `getTotalBalance()` - Balance total de todas las wallets
- `hasSufficientBalance(walletId, amount)` - Verificar fondos

### `category-repository.js` (120 líneas)
Operaciones para categorías y subcategorías:
- `addCategory(category)` - Agregar categoría
- `addSubcategory(categoryId, subcategory)` - Agregar subcategoría
- `updateSubcategory(categoryId, subcategoryId, updates)` - Actualizar subcategoría
- `deleteSubcategory(categoryId, subcategoryId)` - Eliminar subcategoría
- `getSubcategory(categoryId, subcategoryId)` - Obtener subcategoría
- `getAllSubcategories()` - Todas las subcategorías (de todas las categorías)
- `getSubcategoriesByCategoryId(categoryId)` - Subcategorías de una categoría
- `updateCategory(categoryId, updates)` - Actualizar categoría

### `expense-repository.js` (155 líneas)
Operaciones para gastos:
- `addExpense(expense)` - Agregar gasto
- `getByWalletId(walletId)` - Gastos por wallet
- `getByCategoryId(categoryId)` - Gastos por categoría
- `getBySubcategoryId(subcategoryId)` - Gastos por subcategoría
- `getByDateRange(startDate, endDate)` - Gastos por rango de fechas
- `getByDate(date)` - Gastos de una fecha
- `deleteBySubcategoryId(subcategoryId)` - Eliminar por subcategoría
- `deleteByCategoryId(categoryId)` - Eliminar por categoría
- `moveToSubcategory(from, to)` - Mover gastos entre subcategorías
- `getTotalByWallet(walletId)` - Total gastado por wallet
- `getTotalByCategory(categoryId)` - Total por categoría
- `getTotalBySubcategory(subcategoryId)` - Total por subcategoría
- `getFiltered(filters)` - Filtrado avanzado
- `archiveExpenses(expenseIds)` - Archivar gastos

### `transaction-repository.js` (145 líneas)
Operaciones para transacciones:
- `addTransaction(transaction)` - Agregar transacción
- `getByWalletId(walletId)` - Transacciones por wallet
- `getByType(type)` - Por tipo (income, expense, transfer)
- `getByDateRange(startDate, endDate)` - Por rango de fechas
- `getByWalletAndType(walletId, type)` - Combinado
- `getByWalletAndDateRange(walletId, start, end)` - Combinado
- `deleteByWalletId(walletId)` - Eliminar por wallet
- `getTotalIncome(walletId)` - Total de ingresos
- `getTotalExpenses(walletId)` - Total de gastos
- `getRecent(walletId, limit)` - Transacciones recientes
- `addIncome(walletId, amount, source, description, date)` - Agregar ingreso
- `addExpense(expenseId, walletId, amount, description, date)` - Agregar gasto
- `addTransfer(fromWalletId, toWalletId, amount, description, ...)` - Transferencia

### `migration-service.js` (200 líneas)
Servicio de migración desde localStorage:
- `isMigrated()` - Verificar si ya se migró
- `markAsMigrated()` - Marcar como migrado
- `migrateAll()` - Migrar todos los datos
- `migrateWallets()` - Migrar wallets
- `migrateCategories()` - Migrar categorías
- `migrateExpenses()` - Migrar gastos
- `migrateTransactions()` - Migrar transacciones
- `migrateIncomeSources()` - Migrar fuentes de ingreso
- `migrateHistoricalExpenses()` - Migrar históricos
- `migrateSettings()` - Migrar configuración
- `backupLocalStorage()` - Crear backup manual
- `clearLocalStorageData()` - Limpiar localStorage (opcional)

## Flujo de Datos

```
Usuario → Storage API → Repository → IndexedDB
                ↓
         (Migración automática si es primera vez)
```

## Uso

```javascript
// Inicializar
await Storage.init();

// Usar repositorios directamente (avanzado)
const walletRepo = new WalletRepository();
const wallets = await walletRepo.getAll();

// O usar Storage API (recomendado)
const wallets = await Storage.getWallets();
```

## Índices Disponibles

### Wallets
- `createdAt`

### Categories
- `createdAt`

### Expenses
- `walletId` - Para filtrar gastos por wallet
- `categoryId` - Para filtrar por categoría
- `subcategoryId` - Para filtrar por subcategoría
- `date` - Para rangos de fechas
- `createdAt` - Para ordenar por creación

### Transactions
- `walletId` - Para filtrar por wallet
- `type` - Para filtrar por tipo (income/expense/transfer)
- `date` - Para rangos de fechas

### Historical Expenses
- `categoryId`
- `subcategoryId`
- `date`
- `archivedAt`

## Extensibilidad

Para agregar un nuevo store:

1. Agregar a `DBConfig.STORES`
2. Agregar índices a `DBConfig.INDEXES` (si es necesario)
3. Agregar creación en `DBConfig.initDB()`
4. Crear repositorio extendiendo `BaseRepository`
5. Incrementar `DBConfig.DB_VERSION`

## Rendimiento

Los índices permiten búsquedas O(log n) en lugar de O(n):

```javascript
// ❌ Lento (sin índice)
const expenses = await expenseRepo.getAll();
const filtered = expenses.filter(e => e.walletId === id);

// ✅ Rápido (con índice)
const filtered = await expenseRepo.getByWalletId(id);
```

## Transacciones

Todas las operaciones usan transacciones automáticas:
- `readonly` para lecturas
- `readwrite` para escrituras

Para operaciones complejas, se pueden hacer múltiples operaciones en secuencia (cada una con su transacción).
