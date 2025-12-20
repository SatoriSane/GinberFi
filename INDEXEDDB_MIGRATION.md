# Migración a IndexedDB

## ¿Por qué IndexedDB?

La aplicación ha sido migrada de **localStorage** a **IndexedDB** para resolver problemas de rendimiento a medida que crece el volumen de datos.

### Problemas con localStorage:
- ❌ Límite de 5-10MB según navegador
- ❌ Operaciones síncronas que bloquean la UI
- ❌ Serialización completa en cada operación
- ❌ Sin índices para búsquedas rápidas
- ❌ Filtros manuales lentos en arrays grandes

### Ventajas de IndexedDB:
- ✅ Almacenamiento de 50MB+ (hasta GB)
- ✅ Operaciones asíncronas (no bloquea la UI)
- ✅ Índices para búsquedas optimizadas
- ✅ Transacciones atómicas
- ✅ Consultas eficientes por rangos y filtros

## Arquitectura

La implementación está dividida en archivos modulares (< 600 líneas cada uno):

```
js/db/
├── db-config.js              # Configuración de la base de datos
├── base-repository.js        # Operaciones CRUD genéricas
├── wallet-repository.js      # Operaciones específicas de wallets
├── category-repository.js    # Operaciones de categorías/subcategorías
├── expense-repository.js     # Operaciones de gastos
├── transaction-repository.js # Operaciones de transacciones
└── migration-service.js      # Migración automática desde localStorage
```

## Migración Automática

La migración ocurre **automáticamente** la primera vez que se carga la app con IndexedDB:

1. Se detecta si ya se migró (flag en localStorage)
2. Si no, se copian todos los datos de localStorage a IndexedDB
3. Se marca la migración como completada
4. Los datos antiguos permanecen en localStorage como backup

### Datos migrados:
- Wallets
- Categorías y subcategorías
- Gastos
- Transacciones
- Fuentes de ingreso
- Gastos históricos archivados
- Configuración (wallet seleccionada)

## Compatibilidad

### Navegadores soportados:
- ✅ Chrome/Edge 24+
- ✅ Firefox 16+
- ✅ Safari 10+
- ✅ Opera 15+
- ✅ iOS Safari 10+
- ✅ Android Browser 4.4+

### Fallback:
Si IndexedDB no está disponible, la app muestra una advertencia pero continúa funcionando con las capacidades disponibles.

## API de Storage

La clase `Storage` mantiene la **misma API** que antes, pero ahora usa IndexedDB internamente:

```javascript
// Todas las operaciones ahora son asíncronas
await Storage.init();                    // Inicializar DB
await Storage.getWallets();              // Obtener wallets
await Storage.addWallet(wallet);         // Agregar wallet
await Storage.getExpenses();             // Obtener gastos
await Storage.addExpense(expense);       // Agregar gasto
```

## Rendimiento

### Mejoras esperadas:

| Operación | localStorage | IndexedDB | Mejora |
|-----------|-------------|-----------|--------|
| Leer 1000 gastos | ~50ms | ~5ms | 10x |
| Filtrar por fecha | ~100ms | ~10ms | 10x |
| Agregar gasto | ~20ms | ~2ms | 10x |
| Búsqueda por wallet | O(n) | O(log n) | Escalable |

## Estructura de Datos

### Object Stores (Tablas):

1. **wallets**: Almacena wallets/cuentas
   - Índices: `createdAt`

2. **categories**: Almacena categorías con subcategorías embebidas
   - Índices: `createdAt`

3. **expenses**: Almacena gastos
   - Índices: `walletId`, `categoryId`, `subcategoryId`, `date`, `createdAt`

4. **transactions**: Almacena transacciones (ingresos, transferencias)
   - Índices: `walletId`, `type`, `date`

5. **historical_expenses**: Gastos archivados
   - Índices: `categoryId`, `subcategoryId`, `date`, `archivedAt`

6. **income_sources**: Fuentes de ingreso
   - Key: `name`

7. **settings**: Configuración de la app
   - Key: `key`

## Backup Manual

Para crear un backup manual de los datos:

```javascript
// En la consola del navegador
MigrationService.backupLocalStorage();
```

Esto descargará un archivo JSON con todos los datos.

## Resetear la App

El botón "Resetear App" en Opciones ahora:
1. Limpia localStorage
2. Elimina la base de datos IndexedDB
3. Recarga la aplicación

## Desarrollo

### Agregar un nuevo repositorio:

```javascript
class MyRepository extends BaseRepository {
  constructor() {
    super(DBConfig.STORES.MY_STORE);
  }

  async myCustomMethod() {
    // Implementación
  }
}
```

### Agregar índices:

Editar `db-config.js`:

```javascript
static INDEXES = {
  MY_STORE: [
    { name: 'myField', keyPath: 'myField', unique: false }
  ]
}
```

Incrementar `DB_VERSION` para aplicar cambios.

## Troubleshooting

### La migración no se ejecuta:
- Verificar consola del navegador
- Comprobar que `ginbertfi_migrated_to_indexeddb` no esté en localStorage
- Eliminar el flag y recargar: `localStorage.removeItem('ginbertfi_migrated_to_indexeddb')`

### Datos no aparecen:
- Abrir DevTools → Application → IndexedDB → GinberFiDB
- Verificar que los object stores tengan datos
- Revisar consola por errores

### Rendimiento no mejora:
- Verificar que se estén usando los índices correctos
- Revisar que las consultas usen `getByIndex()` en lugar de `getAll()` + filter

## Notas Técnicas

- Todas las operaciones de Storage son ahora **asíncronas** (retornan Promises)
- Los métodos `Storage.get()`, `Storage.set()`, `Storage.remove()` están deprecados
- La migración solo ocurre una vez
- Los datos en localStorage permanecen como backup
- IndexedDB persiste incluso si se cierra el navegador
