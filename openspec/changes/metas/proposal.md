# Proposal: Funcionalidad de Metas (Goals) & Contexto de App

## 1. Executive Summary

El objetivo inicial fue reintegrar y hacer funcional el sistema de **Metas (Goals)** en Wallet.ia, permitiendo a los usuarios establecer objetivos de ahorro vinculables a transacciones. 

**ESTADO ACTUAL (Completado):** 
La funcionalidad de Metas ha sido exitosamente implementada e integrada en el flujo general de la aplicación. Actualmente la App se encuentra conectada a **Supabase** (Auth y DB), desplegada en **Vercel** (`wallet-ia-couple.vercel.app`), y cuenta con un sistema robusto de múltiples monedas, multi-idioma (i18n), protección de rutas y un Onboarding premium para nuevos usuarios.
Además, se han aplicado optimizaciones profundas de **SEO** (Open Graph, Helmet para títulos dinámicos y sitemaps) para su correcta indexación y visualización al compartirse.

## 2. Requirements & Features Implementadas

1. **Autenticación (Supabase Auth)**:
   - Rutas protegidas (`<ProtectedRoute>`).
   - El tutorial/onboarding y los consentimientos de cookies son exclusivos y no interfieren con la pantalla de Login.
2. **Tipos de Metas**:
   - Individuales (`personal`) o Compartidas (`shared`).
3. **Registro de Metas**:
   - Nombre, Categoría, Importe Objetivo (Target), Fecha Límite (Deadline).
4. **Onboarding / UX**:
   - Tutorial animado con Framer Motion de gama alta que solo se muestra a usuarios cuya cuenta fue creada en las últimas 24 horas.
5. **Contexto Multi-moneda**:
   - Soporte total integrado en el contexto local (`LocaleCurrencyContext`).

## 3. Database Schema (Activo)

Las tablas en Supabase ya reflejan:
- **`goals` table**: Soporta vínculos y montos con Row Level Security (RLS) habilitado.
- **`transactions` table**: Contempla todo el ecosistema de gastos en pareja.

## 4. Próximos Pasos de la App

- Ampliar analíticas para mostrar desvíos presupuestarios.
- Notificaciones Push (PWA) para avisar cuando la pareja añade un gasto o se completa una meta compartida.

## 5. Mejoras Recientes (UI/UX)
- **Eliminación en cascada**: Reflejo inmediato en la interfaz al eliminar cuentas (las transacciones desaparecen automáticamente).
- **Saldos sincronizados**: Actualización automática del dinero de la cuenta principal al eliminar una transacción vinculada.
- **Detalles UI premium**: El recuadro de selección de colores durante la creación de cuentas ahora flota sin romper el diseño (posición absoluta) y adquiere sutilmente el tinte del color seleccionado para mayor inmersión.
