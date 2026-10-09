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
  - Display de importe perfectamente centrado con tipografía de alto impacto, color adaptativo al tema visual (blanco en modo oscuro y negro/carbón en modo claro) y símbolo de divisa simplificado y limpio integrado al número (sin recuadros independientes ni códigos de letras ISO).
  - Eliminación de controladores y tiradores de selección de texto flotantes en iOS, incorporando una barra sutil y elegante indicadora de foco activo.
  - Cierre automático del teclado numérico nativo al tocar fuera del importe o sobre las tarjetas de selección (cuenta, categoría, fecha) para una interacción táctil despejada y fluida.
  - Tarjetas de campos estructuradas con micro-etiquetas en mayúsculas (`CUENTA`, `DESCRIPCIÓN`, `CATEGORÍA`, `FECHA`): tarjeta de cuenta con icono y saldo en tiempo real, input de descripción manual limpio (sin bloqueos por dictado de voz) y tarjeta de fecha con selector integrado.
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
- **Suite de Pruebas Automatizadas con Vitest & JSDOM (Calidad y Prevención de Regresiones)**:
  - **Integración de Vitest**: Configuración nativa con Vite 8 (`vitest.config.ts`) y entorno `jsdom` para pruebas de utilidades con acceso a Web APIs (`localStorage`, `document.cookie`).
  - **Scripts de Comandos**: Añadidos `npm run test` (ejecución única CI/CD) y `npm run test:watch` (desarrollo interactivo) en `package.json`.
  - **Pruebas de Utilidades y Lógica Crítica (30 tests automatizados)**:
    - `src/shared/lib/financialMath.test.ts`: Validación de aritmética financiera (parseo de comas/puntos, balance neto sin desvíos de coma flotante, porcentaje de metas de ahorro/presupuesto e invariante de conservación de saldos en transferencias).
    - `src/features/analytics/model/useAnalyticsStats.test.ts`: Desplazamiento de rangos temporales en analíticas (semana, mes, año, inmutabilidad de fecha base).
    - `src/shared/config/locales/locales.test.ts`: Contrato de internacionalización, carga dinámica (`loadLocaleMessages`), paridad estricta al 100% y ausencia de claves vacías en los 6 idiomas.
    - `src/shared/lib/supabaseErrors.test.ts`: Validación de mapeo determinista de códigos de error de invitación hacia claves i18n.
    - `src/shared/lib/cookieConsent.test.ts`: Pruebas de compatibilidad retroactiva, persistencia en `localStorage`, cookies y flags de cumplimiento legal RGPD.
  - **Quality Gate Integrado**: Inclusión de la ejecución automática de Vitest en el paso 4 de `npm run audit`, asegurando que ningún cambio defectuoso pueda comitearse.
- **Soporte de Tarjetas y Cuentas Multi-Divisa (Migración 012 & Suite de Tests de Divisas)**:
  - **Migración PostgreSQL (`012_multi_currency_accounts.sql`)**: Incorporación de columna `currency public.supported_currency NOT NULL DEFAULT 'EUR'` en la tabla `accounts` con backfill automático según el perfil de usuario e índice `idx_accounts_user_currency`.
  - **Suite de Pruebas de Cambio de Divisa (`currencyExchange.test.ts`)**: 11 pruebas unitarias cubriendo actualización diaria con tipos históricos, fluctuación drástica con preservación de transacciones pasadas, precisión matemática (IEEE 754 y JPY sin centavos) y resiliencia ante caídas del proveedor (HTTP 500).
  - **Contexto y Formateo Contextual**: Ampliación de `formatMoney` y `getCurrencySymbol` en `LocaleCurrencyContext` con `currencyOverride` para permitir a cada tarjeta renderizar su saldo en su divisa nativa.
  - **Configuración de Cuentas y Creación de Transacciones**: Selector de divisa en `AccountsSettings.tsx`, badges de divisa en la lista de cuentas y herencia automática de la divisa de la cuenta seleccionada al registrar transacciones en `TransactionModal.tsx`.
- **Inmutabilidad Estricta de Divisa por Cuenta (Migración 013 & Triggers)**:
  - **Migración PostgreSQL (`013_account_currency_immutability.sql`)**: Trigger `trg_prevent_account_currency_change` que impide modificaciones a la divisa de una tarjeta una vez creada, y trigger `trg_sync_transaction_account_currency` que sincroniza de forma determinista `currency = account.currency`, `exchange_rate_used = 1.0` y `base_amount = amount`.
  - **Saneamiento Histórico**: Corrección de transacciones de prueba con divisas desalineadas en la base de datos de producción de Supabase.
- **Asistente Progresivo de Creación de Tarjetas (`CreateAccountWizardModal.tsx`)**:
  - Wizard guiado en 3 pasos interactivos: Identidad Visual -> Elección de Divisa Inmutable -> Saldo Inicial y Ámbito (Personal/Compartido).
  - Previsualización 3D en tiempo real con efecto Liquid Glass que muta instantáneamente con el icono, color, divisa, saldo y alcance seleccionados.
- **Interacción Swipe-to-Action y Experiencia Táctil Pura (Cuentas y Categorías)**:
  - **Edición Directa por Toque**: Apertura inmediata del modal de edición pulsando directamente sobre la tarjeta, con guardia anti-arrastre (`isDraggingRef`).
  - **Cajón Deslizable Sobrio Exclusivo para Eliminar**: Implementación con Framer Motion (`drag="x"`, 76px) revelando acción de borrado en fondo sutil (`rgba(239, 68, 68, 0.12)`) e icono en rojo (`#ef4444`), erradicando sangrado cromático y botones duplicados.
  - **Indicadores en Línea & Supresión de Textos Redundantes**: El icono de ámbito (personal/compartido) se ubica en línea junto al título en `var(--accent-primary)`, acompañado del símbolo sutil de divisa.
  - **Botón Compacto de Reordenación de Tarjetas**: Botón cuadrado compacto de 44x44px con icono `ArrowUpDown` sin etiquetas de texto, maximizando el espacio horizontal para el botón principal de creación.
- **Contrato Universal de Cabeceras de Ventanas/Modales (Window Header Contract)**:
  - Estandarización arquitectónica en `.agents/AGENTS.md`, `index.css` y todos los modales:
    1. Botón de cierre (`X`): Arriba a la izquierda (`left: 0`).
    2. Título de la ventana: Centrado horizontalmente y alineado exactamente a la altura del botón `X`.
    3. Descripción/Subtítulo: Centrado horizontalmente justo debajo del título, con ancho máximo relativo y diseño 100% adaptativo en mobile.
- **Arquitectura Universal de Desplazamiento Vertical y Responsividad en Ventanas Modales (Scroll & 100dvh)**:
  - Soporte universal de `100dvh` (Dynamic Viewport Height) y `min(92vh, 92dvh, 760px)` con contención de sobredesplazamiento (`overscroll-behavior: contain`) y gestos táctiles (`touch-action: pan-y`).
  - Erradicación de bloqueos de scroll mediante `margin: auto` en contenedores hijos y `overflow-y: auto` en overlays, previniendo el clipping superior provocado por el centrado de Flexbox en pantallas cortas o con teclado desplegado.
  - Implementación de `.modal-scroll-area` con barras de desplazamiento sutiles y personalizadas (`::-webkit-scrollbar` translúcido) para affordance visual inmediato en Windows, macOS, Android e iOS.
  - Media queries adaptativas `@media (max-width: 480px)` y `@media (max-height: 720px)` garantizando un uso ergonómico incluso en pantallas compactas, con teclado en pantalla o en orientación horizontal (landscape).
- **Rediseño iOS Liquid Glass, Depuración Cromática y Bimodalidad Estricta (Modo Claro & Oscuro)**:
  - **Color de Acento Predeterminado & Arquitectura Dinámica**: Extracción y fijación del rojo carmesí/fresa del logotipo (`#F71E5D`) como acento base predeterminado de la app, orquestado 100% dinámico a través de `var(--accent-primary)` y `var(--accent-primary-glow)`. La app mantiene total cohesión con cualquier color seleccionado por el usuario en Ajustes.
  - **Erradicación del Ruido Cromático ("Efecto Arcoíris")**: Sustitución de sombras de neón multicolor en tarjetas por superficies neutras iOS Inset Grouped (`var(--bg-card)` y `var(--bg-tertiary)`), sustituyendo resplandores dispersos por una elegante pastilla vertical de 3.5px que denota el color asignado a la tarjeta y badges de divisa y alcance sin estridencias.
  - **Soporte Bimodal Integral (Light & Dark Theme)**: Adaptación completa de todas las ventanas modales (`.card-modal`, `CreateAccountWizardModal`, `AccountsSettings`, `CategoriesSettings`, `ReorderCardsModal`, `ColorPickerModal`, `EmojiPickerModal`) a Modo Claro y Modo Oscuro, garantizando contraste óptimo y eliminando cajas de texto blancas desajustadas.
  - **Ergonomía y Ajuste Móvil iPhone 16**: Optimización milimétrica para pantallas modernas (393 x 852 px), garantizando proporciones armoniosas, botones táctiles de 46px y scroll suave sin cortes ni saturación.
- **Flujo de Recuperación de Contraseña & Resiliencia Móvil (Notch & Safe Areas)**:
  - **Página de Recuperación (`ResetPasswordPage.tsx`)**: Nueva vista dedicada con validación segura de contraseña, retroalimentación en tiempo real y centrado vertical equilibrado (`margin: auto 0`).
  - **Soporte Dinámico de Notch e Isla Dinámica**: Protección ergonómica en cabeceras de autenticación con `max(80px, calc(env(safe-area-inset-top, 0px) + 28px))`, impidiendo solapamientos visuales con cámaras frontales o muescas en iOS y Android.
  - **Mapeo Robusto de Errores de Autenticación**: Cobertura ampliada en `supabaseErrors.ts` para flujos OAuth (GitHub/Google) y expiración de tokens OTP.
- **Arquitectura de Divisas Nativas y Flujo de Gestión de Cuentas**:
  - **Desacoplamiento de Divisa Global**: Eliminación de selectores y modales de conversión de divisa global en `Settings.tsx`, consolidando el modelo de cuentas y tarjetas con divisas independientes e inmutables.
  - **Navegación Intuitiva de Cuentas en Dashboard**: El botón rápido de "Cuentas" en el Dashboard abre directamente el panel de gestión `AccountsSettings` ("Cuentas y Tarjetas"), desde donde el usuario puede consultar su balance o lanzar el asistente guiado "+ Nueva tarjeta".
  - **Integridad y Limpieza i18n (447 claves activas)**: Corrección de etiquetas tipográficas (`Gestión de categorías`, `Color`) y purga de 8 claves de conversión obsoletas en los 6 idiomas.
- **Tour Guiado de Bienvenida Interactivo (8 Pasos) & Selección Inicial de Categorías**:
  - **Recorrido Real y Secuencial de la Aplicación**:
    1. *Bienvenida*: Introducción al centro financiero para finanzas individuales y en pareja.
    2. *Tarjetas 3D y Saldos*: Carrusel Liquid Glass interactivo (`.bank-card-carousel`).
    3. *Acciones Rápidas & Botón Central (+)*: Explicación de los 4 botones de acceso rápido (Gasto, Ingreso, Transferencia, Cuentas) y affordance del botón circular `(+)` central de la barra inferior para registrar transacciones desde cualquier pantalla (`.dashboard-actions-grid`).
    4. *Acceso a Analíticas*: Foco en el icono de gráfico circular de la esquina superior del Dashboard (`#dashboard-analytics-btn`) indicando cómo entrar a las métricas.
    5. *Analíticas & Gráfica Donut*: Transición guiada a `/analytics` con foco en la gráfica interactiva Donut (`.analytics-donut-section`) e icono circular representativo.
    6. *Categorías en Ajustes con Pregunta Interactiva*: Transición a `/settings` focalizando la sección de Categorías (`#settings-categories-item`) con elección inicial en 2 opciones:
       - *Categorías por defecto (Recomendado)*: Siembra de las 9 categorías iniciales esenciales con emojis limpios, editables en cualquier momento.
       - *Empezar desde cero*: Limpieza de categorías para configuración personalizada por el usuario desde cero.
    7. *Finanzas en Pareja*: Vinculación mediante código compartido y permisos en Ajustes (`#settings-partner-card`).
    8. *Barra de Navegación Completa*: Vista general de navegación global con gota deslizante (`.bottom-nav-container`).
- **Sincronización Reactiva en Tiempo Real Multi-Dispositivo & Multi-Ventana (Realtime Cloud Sync)**:
  - **Suscripciones WebSocket Supabase Realtime**: Implementación de escucha bidireccional automática en `transactions`, `accounts`, `categories`, `goals`, `couple_links` y `profiles` mediante `useRealtimeSync.ts`. Los cambios realizados en un móvil, tablet o PC se reflejan en menos de 100ms en los demás dispositivos sin tener que recargar la web ni cerrar sesión.
  - **Canal Local BroadcastChannel (0ms Latency)**: Comunicación entre pestañas y ventanas del mismo navegador (`wallet_ia_tab_sync`). Al insertar, editar o borrar transacciones, tarjetas o metas en una ventana, las demás pestañas se invalidan y actualizan al instante de forma reactiva.
  - **Persistencia Cloud de Preferencias de Usuario (`public.profiles`)**: Migración de preferencias previamente atrapadas en `localStorage` a la base de datos Supabase:
    - `theme` (`light`, `dark`, `system`) sincronizado entre dispositivos.
    - `accent_color` (código `#HEX`) replicado al instante en móvil, tablet y escritorio.
    - `locale` (idioma de la interfaz) y `currency` persistidos a nivel de perfil.
    - `hide_card_balance` (modo privacidad de saldo) sincronizado en la nube.
    - `onboarding_completed` (estado del tour de bienvenida) unificado en el perfil para no repetir el tour al abrir la app desde otro dispositivo.
  - **Optimización Integral de Tiempos de Ejecución y Rendimiento de Animaciones**:
    - Sustitución de físicas pesadas de resorte (`spring`) con alto cálculo de CPU/GPU y desenfoque por transiciones aceleradas por hardware de 160ms (`ease: [0.16, 1, 0.3, 1]` / `easeOut`).
    - Apertura y navegación instantánea en modales (`TransactionModal`, `AccountsSettings`, `CategoriesSettings`, `DoubleConfirmModal`, `ColorPickerModal`, `EmojiPickerModal`, `GoalDetailModal`, `CreateAccountWizardModal`, `ReorderCardsModal`).
    - Ajuste de frescura de caché en React Query (`staleTime: 30s`) y refresco reactivo automático al recuperar foco o visibilidad (`visibilitychange`) en PWAs y móviles.
  