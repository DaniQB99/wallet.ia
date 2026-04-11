/**
 * ==========================================
 * Wallet.ia — Tipos de Datos y Esquema
 * ==========================================
 *
 * Este archivo define la estructura de datos para toda la aplicación.
 * Las interfaces aquí definidas reflejan fielmente el esquema de la base de datos Supabase,
 * garantizando seguridad de tipos en toda la lógica de negocio.
 */

/** Estados posibles de la vinculación de pareja */
export type CoupleStatus = "pending" | "active" | "rejected";

/** Estados de las invitaciones para compartir cuentas */
export type InvitationStatus = "pending" | "used" | "expired";

/** Ámbito de la transacción: personal o compartido con la pareja */
export type TransactionType = "personal" | "shared";

/** Tipo de meta de ahorro */
export type GoalType = "personal" | "shared";

/** Ámbito de visibilidad de una categoría */
export type CategoryScope = "personal" | "shared";

/** Tipos de notificaciones del sistema */
export type NotificationType =
  | "shared_transaction"
  | "goal_contribution"
  | "goal_reached"
  | "couple_linked"
  | "couple_unlinked";

/** Perfil extendido del usuario basado en auth.users */
export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
}

/** Representación de una cuenta bancaria o billetera */
export interface Account {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  icon: string;
  color: string;
  /** Indica si la cuenta es para uso personal o compartida con la pareja */
  scope?: "personal" | "shared";
  /** Referencia a la relación de pareja si es una cuenta compartida */
  couple_id?: string;
  created_at: string;
  updated_at: string;
}

/** Relación de vinculación entre dos usuarios */
export interface CoupleLink {
  id: string;
  user_a_id: string;
  user_b_id: string;
  status: CoupleStatus;
  created_at: string;
  linked_at?: string;
}

/** Invitación enviada de un usuario a otro para vincularse */
export interface CoupleInvitation {
  id: string;
  inviter_id: string;
  code: string;
  status: InvitationStatus;
  expires_at: string;
  created_at: string;
}

/** Registro de un movimiento financiero */
export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  couple_id?: string;
  account_id?: string;
  category_id: string;
  goal_id?: string;
  amount: number;
  description: string;
  /** Fecha del movimiento (ISO format) */
  date: string;
  created_at: string;
  updated_at: string;

  /**
   * Campos virtuales inyectados mediante JOINs de base de datos
   * para evitar múltiples peticiones y mejorar el rendimiento.
   */
  category?: Category;
  user?: UserProfile;
  account?: Account;
  goal?: Goal;
}

/** Categorías de gastos e ingresos */
export interface Category {
  id: string;
  user_id?: string;
  name: string;
  icon: string;
  color: string;
  scope: CategoryScope;
  is_active: boolean;
}

/** Objetivos de ahorro personalizados o compartidos */
export interface Goal {
  id: string;
  user_id?: string;
  couple_id?: string;
  type: GoalType;
  name: string;
  target_amount: number;
  current_amount: number;
  icon: string;
  color: string;
  category_id?: string;
  start_date: string;
  deadline?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** Sistema de alertas y avisos al usuario */
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

/**
 * Semillas de datos para categorías compartidas predeterminadas.
 * Se utilizan para inicializar nuevos vínculos de pareja.
 */
export const SHARED_CATEGORIES: Omit<Category, "id" | "user_id">[] = [
  {
    name: "Hogar",
    icon: "🏠",
    color: "#6366F1",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Servicios",
    icon: "💡",
    color: "#F59E0B",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Comida",
    icon: "🛒",
    color: "#10B981",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Transporte",
    icon: "🚗",
    color: "#3B82F6",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Entretención",
    icon: "🎬",
    color: "#EC4899",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Salud",
    icon: "🏥",
    color: "#EF4444",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Viajes",
    icon: "✈️",
    color: "#8B5CF6",
    scope: "shared",
    is_active: true,
  },
  {
    name: "Regalos",
    icon: "🎁",
    color: "#F97316",
    scope: "shared",
    is_active: true,
  },
];

export const PERSONAL_CATEGORIES: Omit<Category, "id" | "user_id">[] = [
  {
    name: "Alimentación",
    icon: "🍕",
    color: "#F59E0B",
    scope: "personal",
    is_active: true,
  },
  {
    name: "Transporte",
    icon: "🚌",
    color: "#3B82F6",
    scope: "personal",
    is_active: true,
  },
  {
    name: "Ocio",
    icon: "🎮",
    color: "#EC4899",
    scope: "personal",
    is_active: true,
  },
  {
    name: "Ropa",
    icon: "👕",
    color: "#8B5CF6",
    scope: "personal",
    is_active: true,
  },
  {
    name: "Suscripciones",
    icon: "📱",
    color: "#6366F1",
    scope: "personal",
    is_active: true,
  },
  {
    name: "Educación",
    icon: "📚",
    color: "#10B981",
    scope: "personal",
    is_active: true,
  },
  {
    name: "Otros",
    icon: "📦",
    color: "#64748B",
    scope: "personal",
    is_active: true,
  },
];
