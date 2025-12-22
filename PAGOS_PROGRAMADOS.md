# Pagos Programados - Guía de Usuario

## 📋 Descripción

La funcionalidad de **Pagos Programados** te permite gestionar y controlar gastos futuros y recurrentes de manera eficiente. Ideal para:

- Pagos mensuales (Netflix, Spotify, alquiler, etc.)
- Facturas recurrentes (luz, agua, internet)
- Pagos puntuales futuros
- Cualquier gasto que necesites recordar

## 🚀 Características Principales

### ✅ Tipos de Pagos

1. **Pagos Únicos**: Para gastos puntuales futuros
2. **Pagos Recurrentes**: Se reprograman automáticamente después de ejecutarlos
   - Semanal
   - Quincenal
   - Mensual
   - Trimestral
   - Anual

### 📊 Organización Automática

Los pagos se organizan en 4 categorías:

- **🔴 VENCIDOS**: Pagos cuya fecha ya pasó
- **⚠️ PRÓXIMOS 7 DÍAS**: Pagos que vencen en la próxima semana
- **📅 ESTE MES**: Pagos programados para el mes actual
- **📆 FUTUROS**: Pagos programados más allá del mes actual

## 📝 Cómo Usar

### Crear un Pago Programado

1. Ve a la pestaña **Pagos** (📅)
2. Haz clic en el botón **+** (FAB) o "Programar Primer Pago"
3. Completa el formulario:
   - **Nombre**: Ej: "Netflix", "Alquiler", "Electricidad"
   - **Monto**: Cantidad a pagar
   - **Fecha de Vencimiento**: Cuándo debe realizarse el pago
   - **Wallet**: De qué cuenta se descontará
   - **Categoría/Subcategoría**: Para clasificar el gasto
   - **Pago Recurrente**: Actívalo si se repite periódicamente
   - **Frecuencia**: Si es recurrente, elige la periodicidad
   - **Notificación**: Cuántos días antes quieres ser notificado
   - **Notas**: Información adicional (opcional)

4. Haz clic en **Programar**

### Ejecutar un Pago

Cuando llega la fecha de pago, tienes varias opciones:

1. **✓ Pagar**: Registra el gasto en tu wallet
   - Se descuenta el saldo de la wallet seleccionada
   - Se crea el gasto en la categoría correspondiente
   - Si es recurrente, se calcula automáticamente la próxima fecha
   
2. **⏰ Posponer**: Retrasa el pago X días
   - El pago se mueve a una nueva fecha
   - Se guarda en el historial

3. **⊘ Omitir**: Salta este pago sin ejecutarlo
   - Útil para pagos opcionales que decides no realizar
   - Si es recurrente, avanza a la siguiente fecha

### Editar un Pago

1. Haz clic en el botón **✏️ Editar** del pago
2. Modifica los campos necesarios
3. Guarda los cambios

### Eliminar un Pago

1. Abre el modal de edición del pago
2. Haz clic en **Eliminar Pago Programado** (botón rojo)
3. Confirma la eliminación

### Ver Detalles

- Haz clic en cualquier pago para ver todos sus detalles
- Incluye historial de ejecuciones (pagos realizados, omitidos, pospuestos)

## 💡 Ejemplos de Uso

### Ejemplo 1: Suscripción Mensual (Netflix)

```
Nombre: Netflix
Monto: 15 BOB
Fecha: 20 de cada mes
Wallet: Efectivo
Categoría: Ocio → Entretenimiento
Pago Recurrente: ✓
Frecuencia: Mensual
Notificación: 3 días antes
```

**Resultado**: Cada mes el 20, aparecerá en "Próximos 7 días" el día 17. Cuando lo ejecutes, se creará el gasto y se programará automáticamente para el 20 del siguiente mes.

### Ejemplo 2: Alquiler

```
Nombre: Alquiler Departamento
Monto: 2500 BOB
Fecha: 1 de cada mes
Wallet: Cuenta Bancaria
Categoría: Hogar → Vivienda
Pago Recurrente: ✓
Frecuencia: Mensual
Notificación: 5 días antes
Notas: Cuenta IBAN: ES12345678...
```

### Ejemplo 3: Pago Único Futuro

```
Nombre: Regalo cumpleaños mamá
Monto: 300 BOB
Fecha: 15/01/2025
Wallet: Efectivo
Categoría: Personal → Regalos
Pago Recurrente: ✗
Notificación: 7 días antes
```

## 🔄 Flujo de Pagos Recurrentes

1. **Creación**: Programas "Netflix - 15 BOB - Mensual"
2. **Fecha 1**: 20/Dic/2024 → Ejecutas el pago
3. **Auto-reprogramación**: Se crea automáticamente para 20/Ene/2025
4. **Fecha 2**: 20/Ene/2025 → Ejecutas el pago
5. **Auto-reprogramación**: Se crea para 20/Feb/2025
6. Y así sucesivamente...

## 📱 Integración con Gastos

Cuando ejecutas un pago programado:

1. Se crea un **gasto** en la pestaña Gastos
2. Se descuenta del **saldo** de la wallet
3. Se suma al **presupuesto gastado** de la subcategoría
4. Aparece en el **Resumen** y estadísticas

## 🎯 Ventajas

✅ **Nunca olvides un pago**: Todos tus pagos futuros en un solo lugar  
✅ **Control de presupuesto**: Proyecta tus gastos futuros  
✅ **Automatización**: Los pagos recurrentes se reprograman solos  
✅ **Historial completo**: Rastrea todos los pagos realizados, omitidos o pospuestos  
✅ **Flexibilidad**: Pospón o salta pagos cuando sea necesario  
✅ **Organización visual**: Ve claramente qué pagos están vencidos, próximos o futuros  

## 🔧 Detalles Técnicos

- Los pagos se almacenan en **IndexedDB** (base de datos local)
- Se sincronizan automáticamente con tus categorías y wallets
- Si eliminas una categoría/subcategoría, los pagos asociados se eliminan
- Los pagos ejecutados se convierten en gastos normales

## 📊 Proyecciones Futuras

En la pestaña **Resumen** podrás ver (próximamente):
- Total de pagos pendientes este mes
- Proyección de gastos futuros
- Comparativa: gastado vs presupuestado vs programado
- Estadísticas de pagos recurrentes

## 💭 Tips y Mejores Prácticas

1. **Programa todos tus gastos fijos**: Alquiler, servicios, suscripciones
2. **Usa notificaciones**: Configura avisos con suficiente antelación
3. **Revisa semanalmente**: Mira la sección "Próximos 7 días"
4. **Agrega notas**: Incluye información útil (números de cuenta, referencias)
5. **Categoriza correctamente**: Facilita el análisis de gastos

## 🆘 Preguntas Frecuentes

**P: ¿Puedo editar la fecha de un pago programado?**  
R: Sí, edítalo y cambia la fecha de vencimiento.

**P: ¿Qué pasa si no tengo saldo suficiente?**  
R: Al ejecutar el pago, el sistema te avisará que no hay saldo suficiente.

**P: ¿Puedo cambiar un pago de recurrente a único?**  
R: Sí, edítalo y desmarca "Pago Recurrente".

**P: ¿Se pueden importar/exportar pagos programados?**  
R: Sí, se incluyen en el backup/restore de la app.

**P: ¿Los pagos vencidos se ejecutan automáticamente?**  
R: No, debes ejecutarlos manualmente para tener control total.

---

**Versión**: 1.0 - Fase MVP  
**Fecha**: Diciembre 2024
