# 💸 Wallet.ia

**Wallet.ia** es una Aplicación Web Progresiva (PWA) moderna y de alto rendimiento diseñada para ayudar a las parejas a gestionar sus finanzas compartidas y personales sin esfuerzo. Está construida con un enfoque estricto en la experiencia del usuario (UX), seguridad en la base de datos y una arquitectura web altamente escalable.

![Wallet.ia Preview](https://via.placeholder.com/1200x600?text=Wallet.ia+-+Gestor+Financiero+para+Parejas)

## ✨ Características Principales (Actualizado)

- **🔐 Autenticación Segura (Supabase Auth):** Sistema de inicio de sesión completo. Protección de rutas en el frontend para evitar que usuarios no autenticados accedan a la app.
- **👥 Gestión Financiera Dual:** Rastrea tanto los gastos personales como los conjuntos en tiempo real. Vincula cuentas con tu pareja mediante códigos de invitación seguros.
- **🎯 Metas de Ahorro Inteligentes:** Crea y visualiza el progreso de metas compartidas (ej. "Vacaciones", "Casa Nueva") o personales. Las transacciones y categorías se pueden vincular para calcular el progreso de forma automática.
- **🌍 Soporte Multi-moneda y Multi-idioma (i18n):** Adaptación automática de monedas según el país. Diccionarios de idiomas cargados bajo demanda (lazy loading) para no saturar el rendimiento.
- **✨ Onboarding Premium:** Los nuevos usuarios reciben un tour guiado con animaciones fluidas (Framer Motion) y un diseño *glassmorphism* exquisito.
- **⚡ Estado Reactivo:** Eliminaciones en cascada y sincronización instantánea de saldos sin refrescar la página. Detalles de UI pulidos al máximo, como selectores de color flotantes que se tiñen según la selección, priorizando una experiencia inmersiva.
- **🚀 SEO & Open Graph:** Totalmente optimizada para buscadores y redes sociales. Al compartir tu perfil o la app, se generan tarjetas visuales dinámicas. Los títulos de página se adaptan dinámicamente usando `react-helmet-async`.
- **📱 PWA "Mobile-First":** Interacciones fluidas que se sienten nativas, navegación inferior (Bottom Nav) y compatibilidad total PWA para instalación offline en iOS y Android.

## 🏗️ Arquitectura y Tecnologías

El proyecto sigue los principios de **Feature-Sliced Design (FSD)**, garantizando una separación de responsabilidades clara y una escalabilidad de grado empresarial.

**Frontend Stack:**
- **React 19** & **TypeScript** para un tipado estricto y seguro.
- **Vite** para una compilación ultra rápida.
- **Framer Motion** para micro-interacciones, físicas de rebote y transiciones de UI de gama alta.
- **Lucide React** para iconografía minimalista.

**Backend & Datos:**
- **Supabase (PostgreSQL):** Base de datos en la nube en tiempo real.
- **Suscripciones Websocket:** Sincronización instantánea de transacciones y metas entre parejas vinculadas.

## 🔒 Seguridad y Rendimiento

- **Row Level Security (RLS):** Las políticas estrictas en la base de datos garantizan que un usuario solo pueda leer/escribir su propia información o la de su pareja, incluso si la API Key queda expuesta.
- **Optimización de Bundle:** Implementación avanzada de code-splitting mediante `React.lazy` y `Suspense`. Los módulos de configuración y analíticas se cargan en paralelo solo cuando el usuario los solicita.
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
