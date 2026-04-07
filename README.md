# 💸 Wallet.ia

**Wallet.ia** is a modern, high-performance Progressive Web Application (PWA) designed to help couples manage their shared and personal finances effortlessly. Built with a focus on seamless user experience, strict security, and modern web architecture.

![Wallet.ia Preview](https://via.placeholder.com/1200x600?text=Wallet.ia+-+Finance+Manager+for+Couples)

## ✨ Core Features

- **👥 Dual-Mode Finance Management:** Track both personal and joint expenses in real-time. Link accounts with your partner via secure invitation codes.
- **🎯 Shared Savings Goals:** Create and visualize progress on shared goals (e.g., "Vacations", "New House") or keep personal targets.
- **🔒 Enterprise-Grade Security:** Data visibility is strictly governed at the database level using Supabase Row Level Security (RLS). Users can only access their data or their partner's explicitly shared data.
- **⚡ Performance Optimized:** Built on Vite with React. Implements advanced code-splitting via `React.lazy` and `Suspense`, ensuring lightning-fast load times even on slow mobile networks.
- **📱 Mobile-First PWA:** Native-feeling interactions, bottom navigation, and full PWA compatibility for offline-ready installation on iOS and Android.

## 🏗️ Architecture & Technologies

**Frontend Stack:**

- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/) for strict type safety
- [Vite](https://vitejs.dev/) for ultra-fast HMR and optimized builds
- [React Router](https://reactrouter.com/) (Lazy Loaded Routes)
- [Framer Motion](https://www.framer.com/motion/) for micro-interactions and smooth UI transitions
- [Lucide React](https://lucide.dev/) & [Emoji Mart](https://github.com/missive/emoji-mart)

**Backend Stack:**

- [Supabase](https://supabase.com/) (PostgreSQL)
- **Row Level Security (RLS):** Complex DB policies limit row reads/writes inherently without relying on the client's honesty.
- **Realtime Subscriptions:** Websocket listeners to instantly sync transactions and goals between linked partners.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- A Supabase Project configured with the schemas in `/supabase/`

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-username/wallet.ia.git
   cd wallet.ia
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment:**
   Rename `.env.example` to `.env` and add your Supabase keys:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 🔒 Security Posture

- **Strict RLS Policies:** Even if an API key is extracted, users cannot fetch data associated with `user_id` outside of their personal or linked partner's scope.
- **Component Boundary Escapes:** Protected routing drops unauthenticated users before any sensitive chunks are requested.

## 📄 License

This project is licensed under the MIT License.
