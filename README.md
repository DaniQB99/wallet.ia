# 💸 Wallet.ia

**Wallet.ia** es una Aplicación Web Progresiva (PWA) moderna y de alto rendimiento diseñada para ayudar a las parejas a gestionar sus finanzas compartidas y personales sin esfuerzo. Está construida con un enfoque estricto en la experiencia del usuario (UX), seguridad en la base de datos y una arquitectura web altamente escalable.

![Wallet.ia Preview](https://via.placeholder.com/1200x600?text=Wallet.ia+-+Gestor+Financiero+para+Parejas)

## ✨ Características Principales

- **👥 Gestión Financiera Dual:** Rastrea tanto los gastos personales como los conjuntos en tiempo real. Vincula cuentas con tu pareja mediante códigos de invitación seguros.
- **🎯 Metas de Ahorro Compartidas:** Crea y visualiza el progreso de metas compartidas (ej. "Vacaciones", "Casa Nueva") o mantén objetivos personales.
- **📱 PWA "Mobile-First":** Interacciones fluidas que se sienten nativas, navegación inferior (Bottom Nav) y compatibilidad total PWA para instalación offline en iOS y Android.
- **🌐 Internacionalización (i18n):** Soporte multi-idioma con carga dinámica (`lazy loading`) de diccionarios JSON para no saturar el bundle principal.

## 🏗️ Arquitectura y Tecnologías

El proyecto sigue los principios de **Feature-Sliced Design (FSD)**, garantizando una separación de responsabilidades clara y una escalabilidad de grado empresarial.

**Frontend Stack:**
- **React 19** & **TypeScript** para un tipado estricto y seguro.
- **Vite** para una compilación ultra rápida y HMR.
- **Framer Motion** para micro-interacciones y transiciones de UI fluidas.
- **Lucide React** para iconografía.

**Backend & Datos:**
- **Supabase (PostgreSQL):** Base de datos en tiempo real.
- **Suscripciones Websocket:** Sincronización instantánea de transacciones y metas entre parejas vinculadas.

## 🔒 Seguridad y Rendimiento

- **Row Level Security (RLS):** Las políticas estrictas en la base de datos garantizan que un usuario solo pueda leer/escribir su propia información o la información explícitamente compartida por su pareja, incluso si la API Key queda expuesta.
- **Rutas Protegidas:** Los usuarios no autenticados son interceptados antes de descargar los chunks de código sensible.
- **Optimización de Bundle:** Implementación avanzada de code-splitting mediante `React.lazy` y `Suspense`, y separación de chunks (`manualChunks`) para dependencias pesadas, asegurando tiempos de carga relámpago.

## 🐳 Ejecución Local y Despliegue

El proyecto está completamente **Dockerizado** para garantizar consistencia entre desarrollo y producción.

### Requisitos Previos
- Node.js (v18+) o Docker Desktop
- Un proyecto configurado en Supabase

### Opción A: Usando Docker (Recomendado)

1. Clonar el repositorio y configurar variables de entorno:
   ```bash
   cp .env.example .env
   # Añade tus credenciales de Supabase en .env
   ```
2. Levantar el entorno de desarrollo con Hot-Reload:
   ```bash
   docker-compose up app-dev -d
   ```
3. (Opcional) Probar el contenedor de producción (NGINX + Multi-stage build):
   ```bash
   docker-compose up app-prod -d
   ```

### Opción B: Usando NPM/PNPM

```bash
npm install
npm run dev
```
*(Para compilar a producción localmente, ejecuta `npm run build` y luego usa un servidor estático sobre la carpeta `/dist`)*.

## 🧠 Integración de Memoria Persistente (IA)

Este repositorio incluye configuración MCP para `engram` en `.cursor/mcp.json`, lo que permite a agentes de código mantener memoria a largo plazo entre sesiones de programación. Las instrucciones detalladas están en `docs/ENGRAM.md`.

---
*Desarrollado con pasión, enfocado en código limpio y arquitectura escalable.*
