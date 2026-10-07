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
- **Rediseño Premium de Analíticas (Donut Moderno, Filtro de Cuenta & Propagación de Filtros)**:
  - **Gráfica Circular Moderna (`ModernDonutChart`)**: Reemplazo de los arcos manuales SVG por un sistema geométrico de segmentación perimetral por `stroke-dasharray` y `stroke-dashoffset`. Se erradicó por completo el solapamiento o distorsión de porciones (quesitos) en porcentajes mínimos, garantizando separación limpia (gaps), extremos redondeados (`strokeLinecap="round"`), iluminación sutil de fondo y micro-animaciones con Framer Motion.
  - **Micro-interacciones en Donut**: Al interactuar o pasar el cursor sobre cualquier sector, este se expande suavemente con un resplandor (*glow*) temático, atenúa los demás sectores y proyecta en el centro del donut el icono, nombre, importe y porcentaje de la categoría con transiciones fluidas.
  - **Filtro Desplegable de Cuenta**: Se incorporó un selector de cuenta a ancho completo (`AnalyticsAccountFilter`), ubicado estratégicamente entre el saldo total y los bloques de gastos/ingresos, replicando fielmente el diseño de tarjeta de campo (`tx-field-card`) del modal de transacción (icono con badge de color, nombre de cuenta o "Todas las cuentas", balance actual y flecha interactiva). Al pulsar, despliega un menú flotante con efecto Liquid Glass y opción de selección rápida.
  - **Propagación Integral de Filtros hacia Transacciones**: Al pulsar sobre cualquier categoría (sea desde la gráfica Donut o desde el listado inferior), la navegación hacia la pantalla de transacciones traslada y activa de forma automática todos los filtros en vigor: categoría seleccionada, rango de fechas/mes/semana/año, tipo de flujo (gasto o ingreso) y cuenta específica seleccionada.
- **Rediseño Integral de Gestión de Cookies y Privacidad (RGPD / ePrivacy / LSSI-CE)**:
  - **Corrección de Transparencia, Posicionamiento y Adaptación al Dispositivo**: Se reemplazó el fondo transparente defectuoso por un contenedor completamente opaco de gama alta que se adapta dinámicamente al tema por defecto del dispositivo del usuario (Modo Claro `#ffffff` con sombras y bordes suaves / Modo Oscuro `#131522` con reflejos Liquid Glass). Se añadió detección instantánea previa a la hidratación para sincronizar `prefers-color-scheme` sin parpadeos.
  - **Aparición en Pantalla de Login para Nuevos Usuarios**: El banner se despliega de forma elegante en la parte inferior de la pantalla de inicio de sesión (`/auth`) para visitantes nuevos, manteniendo una elevación de `z-index: 99999` y garantizando que no obstaculice el formulario ni la interacción táctil.
  - **Diseño Fiel y Experiencia Premium**: Badge circular lila con icono `Cookie` de Lucide, texto explicativo ("Usamos cookies para mejorar tu experiencia...") con enlace a "Más información", y botones estilizados: `[ Aceptar ]` (acepta todas y persiste), `[ Rechazar ]` (rechaza las no esenciales dejando solo las técnicas obligatorias) y `Ajustes` (abre la ventana flotante con switches detallados para configuración granular).
  - **Sincronización Reactiva Bidireccional**: Al aceptar o rechazar desde el banner inferior o desde el modal, los conmutadores (switches) reflejan con precisión milimétrica el estado real guardado al volver a entrar en cualquier momento.
  - **Persistencia Multinivel Conforme a Estándares**: Almacenamiento simultáneo en `localStorage` (`wallet_ia_cookie_consent`), first-party cookie con 1 año de expiración (`document.cookie`), registro de auditoría legal RGPD en base de datos Supabase (`user_consents`), y acceso permanente para revocar o ajustar el consentimiento en cualquier momento desde los Ajustes de la App (`/settings`).
  - **Página Integral de Política de Cookies (`/cookies`)**: Creación de una página dedicada y pública (`CookiePolicyPage.tsx`) con 12 secciones exhaustivas estructuradas al milímetro según la auditoría de Shifty y los marcos legales (RGPD, LOPDGDD, LSSI-CE 22.2 y directrices de la AEPD). Incluye barra superior adhesiva con botón de retorno y acceso directo a «Ajustes de cookies», tablas detalladas de cookies técnicas, de funcionalidad y analíticas, desglose de almacenamiento local (`localStorage`), guías de configuración para los 5 principales navegadores y adaptabilidad 100% a modo claro y oscuro. Al pulsar «Más información» en el banner, navega directamente a esta página sin perder el contexto.
- **Gestión Avanzada de Categorías y Emojis Nativo (UI/UX)**:
  - Botón de alternancia entre modo eliminación y finalización (`Eliminar` / `Listo`) en `TransactionModal` y apertura fiable de modales anidados mediante elevación de `z-index` (1300/1400/1500) y escape de contextos de apilamiento con React Portal.
  - Implementación de `EmojiPickerModal` nativo y liviano compatible con React 19 (reduciendo 513 KB de bundle y acelerando la compilación a <800ms), con pestañas categorizadas y buscador en tiempo real.
- **Gráfica Donut Optimizada y Desacoplada (Analytics)**:
  - Sectores con división angular limpia sin líneas residuales, soporte táctil por coordenadas polares (`atan2`) para scrubbing e inspección fluida en móviles.
  - Desacoplamiento de navegación: interactuar con la gráfica se enfoca exclusivamente en inspeccionar importes y porcentajes, reservando la navegación al desglose de categorías inferior.
- **Paleta de Colores Dinámica & Personalización de Apariencia**:
  - Creación de `ColorPickerModal` con escala continua deslizable (`react-color-palette`), muestras rápidas populares, visualización en tiempo real del código `#HEX` y botón de confirmación «Aceptar».
  - Integración en la creación/edición de categorías y cuentas.
  - Implementación en `Ajustes -> Apariencia -> Color de acento`, recalculando dinámicamente las variables CSS del sistema (`--accent-primary`, `--accent-primary-hover`, `--accent-primary-rgb`, `--accent-gradient`, `--accent-primary-glow`) para personalizar la app libremente con cualquier color `#HEX`.
- **Corrección Crítica de Edición de Transacciones & Trigger de Auditoría (Punto 5)**:
  - **Corrección en Base de Datos PostgreSQL (Trigger `audit_transaction_change`)**: Se subsanó el error `22P02: malformed array literal` provocado por la concatenación de texto ambiguo (`v_changed || 'campo'`) en entornos con `search_path TO ''`. Se reemplazó por `pg_catalog.array_append` (`supabase/migrations/003_fix_audit_trigger.sql`), desbloqueando de forma definitiva la modificación de transacciones existentes.
  - **Internacionalización Completa de Claves de Guardado**: Registro e integración de la clave `"save"` en los 6 idiomas (`es-ES`, `en-US`, `de-DE`, `fr-FR`, `it-IT`, `pt-PT`), alcanzando 457 claves con 100% de paridad (`npm run i18n:check`). El botón de confirmación en modo edición ahora muestra con precisión «Guardar cambios» (`saveChanges`) en lugar del texto literal `(save)`.
  - **Gestión Visual de Errores & Prevención de Bloqueos en UI**: Sincronización de campos multidivisa (`base_amount`, `currency`) durante la actualización, captura reactiva de errores con banner animado (Framer Motion) y desbloqueo garantizado del estado `submitting`.
- **Reordenación Personalizada de Tarjetas Bancarias en el Carrusel (Punto 10)**:
  - **Persistencia en Base de Datos PostgreSQL**: Creación de la columna `position INT NOT NULL DEFAULT 0` con índice `idx_accounts_user_position` en la tabla `accounts` (`011_add_account_position.sql`), con backfill automático por orden de creación previo.
  - **Modelo y Consulta Reactiva (`useAccounts.ts`)**: Ordenación primaria por `position ASC` y secundaria por `created_at ASC`. Asignación automática de posición secuencial al crear nuevas cuentas y mutación optimista `reorderAccounts` con rollback seguro ante errores.
  - **Componente Premium `ReorderCardsModal`**: Modal Liquid Glass montado con React Portal en `document.body` (`z-index: 1500`), con botón de cierre (✕) estandarizado en la esquina superior izquierda, título centrado y alineado en el eje, descripción inferior y lista minimalista optimizada exclusivamente con agarre táctil de puntos (`GripVertical`) con físicas Framer Motion (`Reorder.Group` / `Reorder.Item`).
  - **Integración Directa en el Carrusel**: Botón interactivo (`ArrowUpDown`) en la cabecera de las tarjetas y en la configuración de cuentas (`AccountsSettings.tsx`). Mantenimiento reactivo del foco de la tarjeta seleccionada tras guardar. Flechas de navegación rápida del carrusel perfectamente centradas en el eje vertical estricto de la tarjeta (aisladas de los dots de paginación) y con visibilidad condicional reactiva: la flecha izquierda desaparece al situarse en la primera tarjeta y la derecha al alcanzar el final de la lista.
  - **Paridad Multilingüe Total**: Incorporación de 6 nuevas claves (`reorderCards`, `reorderCardsDesc`, `saveOrder`, `orderSavedSuccess`, `moveUp`, `moveDown`) en los 6 idiomas registrados, alcanzando 463 claves al 100% de integridad (`npm run i18n:check`).
- **Barrido Integral del Proyecto, Limpieza de Código Muerto y Rutina Pre-Commit**:
  - **Eliminación de Archivos Huérfanos y Temporales**: Purga de componentes obsoletos (`AccountSelector.tsx`, `CategorySelector.tsx`, `TotalBalance.tsx`), hooks descontinuados (`useDashboardStats.ts`, `useRealtimeTransactions.ts`), clientes de caché no utilizados (`ratesCache.ts`), módulos desacoplados (`NotificationsModal.tsx`, `useNotifications.ts`) y scripts temporales `.cjs`.
  - **Auditoría y Purgado de Claves i18n Huérfanas**: Identificación y eliminación de 48 claves en desuso en los 6 diccionarios de idiomas, manteniendo 415 claves activas con 100% de paridad e integridad.
  - **Script de Auditoría Automatizado (`npm run audit`)**: Creación de `scripts/audit-project.mjs` que valida simultáneamente la ausencia de archivos huérfanos, la salud de las carpetas de scripts y la paridad y uso de las claves i18n, registrado como protocolo obligatorio en `.agents/AGENTS.md` antes de cualquier commit.
  