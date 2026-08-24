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
- **Transacciones Recurrentes & Transferencias**: Gestión completa de transferencias entre cuentas y gastos repetitivos directamente a nivel de base de datos y UI.
- **Transacción Mobile-First**: Rediseño completo del modal de transacciones (pantalla completa, paneles deslizables, botones 'pill') y teclado numérico customizado. 
- **Dashboard Refactorizado**: Incorporación de cuadrícula de acciones rápidas (iconos de Gasto, Ingreso, Transferencia y Cuentas exclusivos en vista móvil) y saldos globales (Cuentas Personales y Compartidas) más compactos y adaptativos.
- **Bugfix Crítico de Divisas**: Resolución a nivel de base de datos de un trigger recursivo. Se implementó un bypass mediante `set_config` para prevenir el efecto de auto-incremento de balances durante la conversión de divisas.
- **Flujo de Eliminación**: Incorporación de opción para eliminar transacciones directamente desde el interior del modal de edición, ofreciendo una experiencia más segura y limpia sin recargar la lista principal.
- **Sistema de Avatares**: Se añadió soporte nativo para subir fotos de perfil a Supabase Storage y sincronización automática de fotos de cuentas de Google Auth, mejorando la personalización del usuario y el modal de perfil.
