import type {
  Transaction,
  Goal,
  Notification,
  CoupleLink,
  UserProfile,
} from "../types/database";
import { SHARED_CATEGORIES, PERSONAL_CATEGORIES } from "../types/database";

// Mock current user
export const mockUser: UserProfile = {
  id: "user-1",
  email: "user@wallet.ia",
  display_name: "Dani",
  avatar_url: undefined,
  created_at: "2026-01-01T00:00:00Z",
};

// Mock partner
export const mockPartner: UserProfile = {
  id: "user-2",
  email: "partner@wallet.ia",
  display_name: "Pareja",
  avatar_url: undefined,
  created_at: "2026-01-15T00:00:00Z",
};

// Mock couple link
export const mockCoupleLink: CoupleLink = {
  id: "couple-1",
  user_a_id: "user-1",
  user_b_id: "user-2",
  status: "active",
  shared_permission: "read_write",
  created_at: "2026-02-01T00:00:00Z",
  linked_at: "2026-02-01T00:05:00Z",
};

// Mock categories with IDs
export const mockSharedCategories = SHARED_CATEGORIES.map((cat, i) => ({
  ...cat,
  id: `shared-cat-${i + 1}`,
  user_id: undefined,
}));

export const mockPersonalCategories = PERSONAL_CATEGORIES.map((cat, i) => ({
  ...cat,
  id: `personal-cat-${i + 1}`,
  user_id: "user-1",
}));

// Mock transactions
export const mockTransactions: Transaction[] = [
  {
    id: "tx-1",
    user_id: "user-1",
    type: "shared",
    couple_id: "couple-1",
    category_id: "shared-cat-1",
    amount: 850,
    description: "Alquiler marzo",
    date: "2026-03-01",
    created_at: "2026-03-01T10:00:00Z",
    updated_at: "2026-03-01T10:00:00Z",
    category: mockSharedCategories[0],
  },
  {
    id: "tx-2",
    user_id: "user-2",
    type: "shared",
    couple_id: "couple-1",
    category_id: "shared-cat-3",
    amount: 120.5,
    description: "Compra semanal supermercado",
    date: "2026-03-15",
    created_at: "2026-03-15T14:30:00Z",
    updated_at: "2026-03-15T14:30:00Z",
    category: mockSharedCategories[2],
    user: mockPartner,
  },
  {
    id: "tx-3",
    user_id: "user-1",
    type: "personal",
    category_id: "personal-cat-3",
    amount: 14.99,
    description: "Netflix",
    date: "2026-03-10",
    created_at: "2026-03-10T08:00:00Z",
    updated_at: "2026-03-10T08:00:00Z",
    category: mockPersonalCategories[2],
  },
  {
    id: "tx-4",
    user_id: "user-1",
    type: "shared",
    couple_id: "couple-1",
    category_id: "shared-cat-2",
    amount: 95.3,
    description: "Factura luz",
    date: "2026-03-05",
    created_at: "2026-03-05T09:00:00Z",
    updated_at: "2026-03-05T09:00:00Z",
    category: mockSharedCategories[1],
  },
  {
    id: "tx-5",
    user_id: "user-1",
    type: "personal",
    category_id: "personal-cat-1",
    amount: 8.5,
    description: "Café con amigos",
    date: "2026-03-18",
    created_at: "2026-03-18T11:00:00Z",
    updated_at: "2026-03-18T11:00:00Z",
    category: mockPersonalCategories[0],
  },
  {
    id: "tx-6",
    user_id: "user-2",
    type: "shared",
    couple_id: "couple-1",
    category_id: "shared-cat-4",
    amount: 45.0,
    description: "Gasolina",
    date: "2026-03-20",
    created_at: "2026-03-20T16:00:00Z",
    updated_at: "2026-03-20T16:00:00Z",
    category: mockSharedCategories[3],
    user: mockPartner,
  },
  {
    id: "tx-7",
    user_id: "user-1",
    type: "shared",
    couple_id: "couple-1",
    category_id: "shared-cat-5",
    amount: 32.0,
    description: "Cine + palomitas",
    date: "2026-03-22",
    created_at: "2026-03-22T20:00:00Z",
    updated_at: "2026-03-22T20:00:00Z",
    category: mockSharedCategories[4],
  },
  {
    id: "tx-8",
    user_id: "user-1",
    type: "personal",
    category_id: "personal-cat-5",
    amount: 9.99,
    description: "Spotify Premium",
    date: "2026-03-01",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    category: mockPersonalCategories[4],
  },
];

// Mock goals
export const mockGoals: Goal[] = [
  {
    id: "goal-1",
    couple_id: "couple-1",
    type: "shared",
    name: "Vacaciones verano",
    target_amount: 3000,
    current_amount: 1850,
    icon: "✈️",
    color: "#8B5CF6",
    deadline: "2026-07-01",
    start_date: "2026-01-01",
    created_by: "user-1",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-03-20T00:00:00Z",
  },
  {
    id: "goal-2",
    user_id: "user-1",
    type: "personal",
    name: "MacBook Pro",
    target_amount: 2500,
    current_amount: 800,
    icon: "💻",
    color: "#3B82F6",
    deadline: "2026-12-01",
    start_date: "2026-01-01",
    created_by: "user-1",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "goal-3",
    couple_id: "couple-1",
    type: "shared",
    name: "Fondo emergencia",
    target_amount: 5000,
    current_amount: 3200,
    icon: "🛡️",
    color: "#10B981",
    start_date: "2026-01-01",
    created_by: "user-2",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-03-18T00:00:00Z",
  },
  {
    id: "goal-4",
    user_id: "user-1",
    type: "personal",
    name: "Curso diseño UX",
    target_amount: 400,
    current_amount: 400,
    icon: "🎨",
    color: "#EC4899",
    start_date: "2026-01-01",
    created_by: "user-1",
    created_at: "2026-02-15T00:00:00Z",
    updated_at: "2026-03-15T00:00:00Z",
  },
];

// Mock notifications
export const mockNotifications: Notification[] = [
  {
    id: "notif-1",
    user_id: "user-1",
    type: "shared_transaction",
    title: "Nueva transacción compartida",
    message: 'Pareja añadió "Compra semanal supermercado" por €120.50',
    is_read: false,
    created_at: "2026-03-15T14:30:00Z",
  },
  {
    id: "notif-2",
    user_id: "user-1",
    type: "goal_contribution",
    title: "Aporte a meta compartida",
    message: 'Pareja contribuyó €200 a "Vacaciones verano"',
    is_read: false,
    created_at: "2026-03-14T10:00:00Z",
  },
  {
    id: "notif-3",
    user_id: "user-1",
    type: "goal_reached",
    title: "¡Meta alcanzada! 🎉",
    message: '"Curso diseño UX" ha alcanzado su objetivo de €400',
    is_read: true,
    created_at: "2026-03-15T12:00:00Z",
  },
  {
    id: "notif-4",
    user_id: "user-1",
    type: "shared_transaction",
    title: "Nueva transacción compartida",
    message: 'Pareja añadió "Gasolina" por €45.00',
    is_read: false,
    created_at: "2026-03-20T16:00:00Z",
  },
];

// Helper functions for summary calculations
export function getSharedBalance() {
  const sharedTxs = mockTransactions.filter((t) => t.type === "shared");
  const myContribution = sharedTxs
    .filter((t) => t.user_id === "user-1")
    .reduce((sum, t) => sum + t.amount, 0);
  const partnerContribution = sharedTxs
    .filter((t) => t.user_id === "user-2")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalShared = myContribution + partnerContribution;

  return { myContribution, partnerContribution, totalShared };
}

export function getPersonalBalance() {
  const personalTxs = mockTransactions.filter(
    (t) => t.type === "personal" && t.user_id === "user-1",
  );
  return personalTxs.reduce((sum, t) => sum + t.amount, 0);
}

export function getMonthlySharedByCategory() {
  const sharedTxs = mockTransactions.filter((t) => t.type === "shared");
  const byCategory: Record<
    string,
    { name: string; icon: string; color: string; total: number }
  > = {};

  for (const tx of sharedTxs) {
    const catId = tx.category_id;
    if (!byCategory[catId] && tx.category) {
      byCategory[catId] = {
        name: tx.category.name,
        icon: tx.category.icon,
        color: tx.category.color,
        total: 0,
      };
    }
    if (byCategory[catId]) {
      byCategory[catId].total += tx.amount;
    }
  }

  return Object.values(byCategory).sort((a, b) => b.total - a.total);
}
