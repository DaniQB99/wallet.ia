export interface DefaultCategoryTemplate {
  name: string;
  icon: string;
  color: string;
  scope: 'personal' | 'shared';
}

export const DEFAULT_CATEGORIES: DefaultCategoryTemplate[] = [
  { name: 'Ocio', icon: '🍺', color: '#F59E0B', scope: 'personal' },
  { name: 'Comida', icon: '🍔', color: '#EF4444', scope: 'personal' },
  { name: 'Transporte', icon: '🚌', color: '#3B82F6', scope: 'personal' },
  { name: 'Compras', icon: '🛍️', color: '#EC4899', scope: 'personal' },
  { name: 'Suscripciones', icon: '📱', color: '#8B5CF6', scope: 'personal' },
  { name: 'Hogar', icon: '🏠', color: '#6366F1', scope: 'shared' },
  { name: 'Supermercado', icon: '🛒', color: '#10B981', scope: 'shared' },
  { name: 'Servicios', icon: '💡', color: '#F59E0B', scope: 'shared' },
  { name: 'Transporte', icon: '🚗', color: '#3B82F6', scope: 'shared' },
];
