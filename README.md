# 💸 Wallet.ia

**Wallet.ia** es una Aplicación Web Progresiva (PWA) moderna y de alto rendimiento diseñada para ayudar a las parejas a gestionar sus finanzas compartidas y personales sin esfuerzo. Está construida con un enfoque estricto en la experiencia del usuario (UX), seguridad en la base de datos y una arquitectura web altamente escalable.

![Wallet.ia Preview](https://via.placeholder.com/1200x600?text=Wallet.ia+-+Gestor+Financiero+para+Parejas)

## ✨ Características Principales (Actualizado)

- **🔐 Autenticación Segura (Supabase Auth):** Sistema de inicio de sesión completo. Protección de rutas en el frontend para evitar que usuarios no autenticados accedan a la app.
- **👥 Gestión Financiera Dual:** Rastrea tanto los gastos personales como los conjuntos en tiempo real. Vincula cuentas con tu pareja mediante códigos de invitación seguros.
- **🎯 Metas de Ahorro Inteligentes:** Crea y visualiza el progreso de metas compartidas (ej. "Vacaciones", "Casa Nueva") o personales. Las transacciones y categorías se pueden vincular para calcular el progreso de forma automática.
- **🌍 Soporte Multi-moneda Avanzado (i18n):** Adaptación automática de monedas según el país. Cálculos en tiempo real respaldados por triggers optimizados en PostgreSQL para prevenir distorsiones por tipos de cambio.
- **✨ Onboarding Premium:** Los nuevos usuarios reciben un tour guiado con animaciones fluidas (Framer Motion) y un diseño *glassmorphism* exquisito.
- **🖼️ Avatares Personalizables:** Subida de fotos de perfil integradas con Supabase Storage (HTML5 nativo para cámara/galería) y sincronización automática de fotos de Google Auth.
- **⚡ Estado Reactivo:** Eliminaciones en cascada y sincronización instantánea de saldos sin refrescar la página.
- **🚀 SEO & Open Graph:** Totalmente optimizada para buscadores y redes sociales. Al compartir tu perfil o la app, se generan tarjetas visuales dinámicas. Los títulos de página se adaptan dinámicamente usando `react-helmet-async`.
- **💳 Experiencia Bancaria de Última Generación:** Dashboard con carrusel visual de tarjetas bancarias estilo *Liquid Glass* y efecto 3D, reflejando el color y saldo de cada cuenta, botón de configuración rápida, paginación interactiva, modo privacidad con desenfoque de saldo y **reordenación personalizada al antojo del usuario** mediante arrastre táctil y botones de precisión con persistencia en tiempo real.
- **📱 Modal de Transacciones de Alta Gama:** Ventana de nueva transacción rediseñada con estética *Liquid Glass*, cursor dinámico, pestañas con píldoras translúcidas, tarjetas de campo con saldo en tiempo real, reconocimiento de voz y teclado numérico estilo iOS / banca con sub-letras telefónicas.
- **📊 Analíticas Financieras Interactivas de Última Generación:** Gráfica Donut ultra-moderna con segmentación matemática perfecta (sin solapamiento de quesitos), micro-animaciones dinámicas al pasar el cursor (glow temático, foco de categoría, detalles y porcentajes animados en el centro), selector desplegable de cuenta a ancho completo y propagación automática de filtros (cuenta, periodo, tipo de flujo y categoría) hacia el listado de transacciones.
- **🛡️ Consentimiento de Cookies & Privacidad (RGPD / ePrivacy):** Banner flotante moderno con badge circular e interfaz minimalista (`Aceptar`, `Rechazar`, `Ajustes`). Configuración granular con switches animados para cookies técnicas obligatorias, analíticas y preferencias, persistidas de forma segura en `localStorage`, cookies de primer nivel y auditoría en Supabase.
- **🎨 Paleta de Colores y Personalización Total:** Selector de color flotante con escala continua gradiente (`react-color-palette`), muestras rápidas, previsualización HEX y botón de confirmación («Aceptar») para personalizar categorías, cuentas o el color de acento global de toda la aplicación.
- **🔁 Transferencias y Recurrencias:** Gestión de traspasos entre cuentas y automatización de cobros/pagos recurrentes integrados directamente en Base de Datos para evitar bloqueos del frontend.

## 🏗️ Arquitectura y Tecnologías

El proyecto sigue los principios de **Feature-Sliced Design (FSD)**, garantizando una separación de responsabilidades clara y una escalabilidad de grado empresarial.

**Frontend Stack:**

- **React 19** & **TypeScript** para un tipado estricto y seguro.
- **Vite** para una compilación ultra rápida.
- **Framer Motion** para micro-interacciones, físicas de rebote y transiciones de UI de gama alta.
- **Lucide React** para iconografía minimalista.
- **Internacionalización Completa (i18n):** 6 idiomas nativos (`es-ES`, `en-US`, `de-DE`, `fr-FR`, `it-IT`, `pt-PT`) con carga dinámica bajo demanda, paridad estricta y sincronizada de 415 claves 100% activas (`npm run i18n:check` y `npm run audit`) y soporte de `Intl.DisplayNames` para formatos y nombres regionales automáticos.

**Backend & Datos:**

- **Supabase (PostgreSQL):** Base de datos en la nube en tiempo real.
- **Suscripciones Websocket:** Sincronización instantánea de transacciones y metas entre parejas vinculadas.

## 🔒 Seguridad y Rendimiento

- **Row Level Security (RLS):** Las políticas estrictas en la base de datos garantizan que un usuario solo pueda leer/escribir su propia información o la de su pareja, incluso si la API Key queda expuesta.
- **Optimización de Bundle:** Implementación avanzada de code-splitting mediante `React.lazy` y `Suspense`. Los módulos de configuración y analíticas se cargan en paralelo solo cuando el usuario los solicita.
- **Privacidad y Cumplimiento Normativo (RGPD / ePrivacy / AEPD):** Gestión transparente de cookies multinivel (`localStorage`, cookies first-party y base de datos) con panel interactivo granular y página pública completa de Política de Cookies (`/cookies`).
- **Despliegue en Vercel:** Integración CI/CD directa con Vercel para latencia ultrabaja.

## 🚀 Despliegue Local

1. Clonar el repositorio y configurar variables de entorno:

   ```bash
   cp .env.example .env
   # Añade tus credenciales de Supabase VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
   ```

2. Instalar dependencias y correr en modo desarrollo:

   ```bash
   npm install
   npm run dev
   ```

---
*Desarrollado con pasión, enfocado en código limpio, estética premium y arquitectura escalable.*
