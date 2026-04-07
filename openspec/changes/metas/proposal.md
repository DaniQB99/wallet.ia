# Proposal: Funcionalidad de Metas (Goals)

## 1. Executive Summary

El objetivo es reintegrar y hacer funcional el sistema de **Metas (Goals)** en Wallet.ia. Las metas permitirán a los usuarios (individuales o en pareja) establecer objetivos de ahorro. La innovación principal es que **las transacciones (ingresos/gastos) se podrán relacionar directamente con una meta**, ya sea explícitamente al crear la transacción o implícitamente mediante categorías (ej. categoría "Viajes" -> incrementa meta "Viajes").

## 2. Requirements & Features

1. **Tipos de Metas**:
   - Individuales (`personal`) o Compartidas (`shared`).
2. **Registro de Metas**:
   - Nombre, Categoría (opcional - para vinculación automática), Importe Objetivo (Target), Fecha Límite (Deadline).
3. **Vinculación con Transacciones**:
   - **Manual**: Al añadir una transacción, se añade un selector opcional "Vincular a Meta".
   - **Automática**: Si se registra una transacción en una categoría vinculada a una meta activa, suma (o resta) automáticamente.
4. **Cálculo de Progreso**:
   - El progreso actual de la meta será calculado dinámicamente sumando las transacciones vinculadas a dicha meta, o se puede mantener como un campo `current_amount` actualizado mediante base de datos.

## 3. Database Schema Changes

Se requerirá crear/modificar tablas en Supabase:

- **`goals` table**:
  - `id` (uuid)
  - `user_id` (uuid)
  - `type` ('personal' | 'shared')
  - `name` (text)
  - `target_amount` (numeric)
  - `deadline` (date, nullable)
  - `category_id` (uuid, nullable) - Para auto-vincular
  - `icon`, `color` (text)
- **`transactions` table modification**:
  - Añadir columna `goal_id` (uuid, opcional) como Foreign Key a `goals(id)`.

## 4. UI/UX Changes

- **Página de Metas**: Nueva vista/pestaña para visualizar tarjetas de progreso de metas, con botón de "Añadir Meta".
- **Modal de Transacción**: Añadir campo oculto/colapsable u opcional: "Relacionar con meta: [ Ninguna | Selección ]".
- **Dashboard**: Opcionalmente mostrar las metas más relevantes o próximas a caducar si el usuario lo desea en el futuro.

## 5. Risks & Considerations

- **Cálculo de saldos**: ¿Una aportación a una meta descuenta el saldo general? Idealmente no, el saldo es de cuentas, las metas son puramente analíticas (saber cuánto de tu dinero acumulado está mentalmente reservado para ese fin).
- **Gastos vs Ingresos en metas**: Un "ingreso" aumenta el progreso de la meta. Un "gasto" (ej. comprando un billete de avión) relacionado a la meta "Viaje" debería completar el objetivo final (ya me he gastado el dinero en ese objetivo) o restar progreso? Depende de si es una meta de ahorro (ingresos suman progreso) o una bolsa de gasto (gastos suman progreso). Se propondrá: Las Metas son objetivos de "Acumulación".
