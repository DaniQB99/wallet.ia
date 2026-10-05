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
- **Refinamiento UI/UX Premium (Listados & Filtros)**: Rediseño completo de la lista de transacciones (agrupadas por meses en bloques de bordes curvos con separadores limpios de alto contraste). Los filtros ahora utilizan un menú desplegable unificado y excluyente. Se habilitó la edición rápida de transacciones directamente pulsando sobre ellas desde el Dashboard. Las iniciales de usuarios en transacciones compartidas ahora se obtienen de los metadatos reales de las cuentas.
- **Rediseño Dashboard Estilo Banca Moderna (Bank Card Carousel & Acciones Rápidas)**:
  - Implementación del carrusel visual de tarjetas bancarias (`BankCardCarousel`) con estética Liquid Glass y efectos 3D, reflejando el color preestablecido de cada cuenta, saldo disponible y badge de ámbito (Personal/Compartida).
  - Paginación interactiva mediante dots animados con cápsula alargada activa.
  - Botón de engranaje (⚙️) en la tarjeta activa que abre directamente la configuración de cuentas pre-cargando la cuenta visualizada.
  - Bloque de 4 acciones rápidas (Gasto, Ingreso, Transferencia, Cuentas) ubicado debajo del carrusel, pre-seleccionando automáticamente la cuenta activa al abrir el modal de transacción.
  - Filtrado reactivo del listado de transacciones recientes asociado a la tarjeta activa del carrusel.
  - Carrusel táctil con transiciones 3D realistas implementado con `swiper` (`EffectCreative`): soporte de arrastre nativo (swipe táctil en móviles y ratón en escritorio), perspectiva 3D, inclinación y profundidad con sincronización fluida de dots y flechas.
  - Reubicación de elementos en la tarjeta: eliminación del número simulado de tarjeta (`•••• 12C3`), reubicación de la píldora de ámbito (`Personal` / `Compartida`) en la esquina inferior derecha y desplazamiento del bloque de saldo disponible unos píxeles a la derecha para un equilibrio visual óptimo.
  - **Modo Privacidad en Tarjeta Bancaria**: reemplazo del icono de señal por un botón de ojo interactivo (`Eye`/`EyeOff`). Al pulsar, el saldo se desenfoca visualmente con efecto *blur* para impedir miradas indiscretas, guardando la preferencia del usuario en `localStorage` (`wallet_hide_card_balance`) de forma persistente.
  - **Acceso a Analíticas Actualizado**: actualización del icono de acceso rápido a Analíticas en la cabecera superior derecha del Dashboard a un gráfico circular (`PieChart`).
  - Estandarización de modales flotantes (botón de cierre con X superior izquierda y títulos centrados consistentes).
  - Modal explicativo interactivo para instalación de PWA ("Instalar como App") con detección automática del navegador.
- **Rediseño Modal de Transacciones Estilo Banca Moderna (Liquid Glass & Teclado iOS)**:
  - Header con tirador superior, botón de cierre a la izquierda y título centrado dinámico (`Nuevo gasto`, `Nuevo ingreso`, `Nueva transferencia`).
  - Selector de pestañas horizontales 100% responsivo en cuadrícula de 3 columnas (`Transfer.` adaptativo para evitar desbordamientos en móviles estrechos).
  - Display de importe centrado con cursor vertical parpadeante y símbolo de divisa a la derecha.
  - Tarjetas de campos estructuradas con micro-etiquetas en mayúsculas (`CUENTA`, `DESCRIPCIÓN`, `CATEGORÍA`, `FECHA`): tarjeta de cuenta con icono y saldo en tiempo real, input de descripción con botón de dictado por voz y tarjeta de fecha con selector integrado.
  - Sub-vista de Calendario Liquid Glass Personalizado: selección fluida de fechas con atajos rápidos ("Ayer", "Hoy", "Mañana"), navegación mensual con flechas, cuadrícula de días con resaltado del día activo y botón de confirmación.
  - Integración nativa del teclado numérico del móvil: uso de input con `inputMode="decimal"` y foco automático para levantar directamente el teclado del sistema operativo (iOS / Android) con háptica y sonidos nativos.
  - Eliminación del teclado HTML redundante dentro de la ventana: libera más de 200px de altura vertical, garantizando que el modal encaje completo y sin scroll apretado en pantallas compactas como iPhone SE (375x667).
  - Envío rápido mediante la tecla "Intro/Enter" del teclado nativo o mediante el botón inferior de guardado con gradientes fluidos.
  - Soporte multi-idioma (i18n) completo en los 6 idiomas del sistema.
- **Auditoría e Integridad Estricta de Internacionalización (i18n - 100% Completado)**:
  - Erradicación integral de cadenas de texto fijas (hardcodeadas) en la totalidad de la aplicación: `TransactionModal`, `Transactions`, `Goals`, `Analytics`, `Dashboard`, `BankCardCarousel`, `Settings` y todos sus submodales (`ProfileSettings`, `ChangePasswordModal`, `DataPrivacyModal`, `InstallAppModal`, `AccountsSettings`, `CategoriesSettings`, `PartnerSettings`), componentes compartidos (`DoubleConfirmModal`, `LegalDocumentModal`, `OnboardingOverlay`, `CookieConsent`) y widgets (`Sidebar`, `BottomNav`).
  - Implementación nativa de `Intl.DisplayNames` en la configuración de divisas y países, permitiendo nombres de regiones y monedas 100% nativos según el idioma del usuario sin sobrecargar los archivos JSON.
  - Traducción contextual de entidades por defecto (`translateEntityName`) para categorías de sistema y cuentas por defecto, respetando rigurosamente que los datos generados por el usuario se mantengan inmutables.
  - Automatización con script de paridad `npm run i18n:check` (`scripts/check-i18n.mjs`) que verifica paridad al 100% de las 433 claves en los 6 idiomas registrados (`es-ES`, `en-US`, `de-DE`, `fr-FR`, `it-IT`, `pt-PT`).
  - Regla invariable: todo texto de la aplicación vive en los JSON de idiomas; solo los datos propios del usuario (nombres de cuenta, descripciones, categorías custom) se mantienen dinámicos sin traducir.

