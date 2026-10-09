import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

interface EmojiItem {
  emoji: string;
  name: string;
  keywords: string[];
}

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: EmojiItem[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'finance',
    name: 'Finanzas',
    icon: '🏦',
    emojis: [
      { emoji: '🏦', name: 'Banco', keywords: ['banco', 'bank', 'cuenta', 'ahorro', 'institucion'] },
      { emoji: '💳', name: 'Tarjeta', keywords: ['tarjeta', 'card', 'credito', 'debito', 'visa'] },
      { emoji: '💰', name: 'Dinero', keywords: ['dinero', 'bolsa', 'money', 'oro', 'rico'] },
      { emoji: '💵', name: 'Billetes', keywords: ['efectivo', 'cash', 'billete', 'dolar', 'euro'] },
      { emoji: '🪙', name: 'Moneda', keywords: ['moneda', 'coin', 'cambio', 'suelto'] },
      { emoji: '💎', name: 'Lujo', keywords: ['joya', 'diamante', 'inversion', 'lujo'] },
      { emoji: '📈', name: 'Inversión', keywords: ['inversion', 'acciones', 'subida', 'bolsa', 'trading'] },
      { emoji: '📉', name: 'Pérdida', keywords: ['bajada', 'perdida', 'gastos'] },
      { emoji: '🧾', name: 'Factura', keywords: ['recibo', 'ticket', 'factura', 'cuenta', 'impuesto'] },
      { emoji: '🏷️', name: 'Etiqueta', keywords: ['descuento', 'oferta', 'etiqueta', 'precio'] },
      { emoji: '🏧', name: 'Cajero', keywords: ['cajero', 'atm', 'sacar'] },
      { emoji: '🛒', name: 'Supermercado', keywords: ['super', 'compra', 'carrito', 'mercado'] },
      { emoji: '🛍️', name: 'Compras', keywords: ['bolsas', 'shopping', 'tienda', 'ropa'] },
      { emoji: '🏪', name: 'Tienda', keywords: ['tienda', 'comercio', 'local'] },
      { emoji: '💼', name: 'Sueldo', keywords: ['nomina', 'trabajo', 'maletin', 'ingreso', 'empleo'] },
      { emoji: '🎁', name: 'Regalo', keywords: ['regalo', 'presente', 'navidad', 'cumpleanos'] },
    ],
  },
  {
    id: 'home',
    name: 'Hogar',
    icon: '🏠',
    emojis: [
      { emoji: '🏠', name: 'Casa', keywords: ['casa', 'piso', 'hogar', 'alquiler', 'hipoteca'] },
      { emoji: '🏡', name: 'Chalet', keywords: ['chalet', 'jardin', 'vivienda'] },
      { emoji: '🛋️', name: 'Muebles', keywords: ['sofa', 'salon', 'decoracion', 'ikea'] },
      { emoji: '🛏️', name: 'Cama', keywords: ['dormitorio', 'habitacion', 'hotel'] },
      { emoji: '🚿', name: 'Baño', keywords: ['ducha', 'aseo', 'fontaneria'] },
      { emoji: '🧹', name: 'Limpieza', keywords: ['escoba', 'limpiar', 'hogar', 'mantenimiento'] },
      { emoji: '⚡', name: 'Electricidad', keywords: ['luz', 'electricidad', 'energia', 'factura'] },
      { emoji: '💧', name: 'Agua', keywords: ['agua', 'suministro', 'gota'] },
      { emoji: '📶', name: 'Internet', keywords: ['wifi', 'fibra', 'red', 'router'] },
      { emoji: '📱', name: 'Móvil', keywords: ['telefono', 'linea', 'celular', 'tarifa'] },
      { emoji: '🔑', name: 'Llave', keywords: ['llave', 'seguridad', 'cerrajero'] },
      { emoji: '🪴', name: 'Plantas', keywords: ['planta', 'jardin', 'flores'] },
      { emoji: '🐶', name: 'Perro', keywords: ['perro', 'mascota', 'veterinario'] },
      { emoji: '🐱', name: 'Gato', keywords: ['gato', 'mascota', 'animal'] },
      { emoji: '🐾', name: 'Mascotas', keywords: ['huella', 'pienso', 'animales'] },
      { emoji: '👶', name: 'Bebé', keywords: ['bebe', 'guarderia', 'hijos', 'panales'] },
    ],
  },
  {
    id: 'transport',
    name: 'Transporte',
    icon: '🚗',
    emojis: [
      { emoji: '🚗', name: 'Coche', keywords: ['coche', 'auto', 'vehiculo', 'seguro'] },
      { emoji: '⛽', name: 'Gasolina', keywords: ['combustible', 'diesel', 'gasolinera', 'repostar'] },
      { emoji: '🅿️', name: 'Parking', keywords: ['aparcamiento', 'estacionamiento', 'garaje'] },
      { emoji: '🔧', name: 'Taller', keywords: ['mecanico', 'reparacion', 'itv', 'averia'] },
      { emoji: '🚌', name: 'Autobús', keywords: ['bus', 'transporte', 'billete'] },
      { emoji: '🚇', name: 'Metro', keywords: ['subte', 'metro', 'estacion'] },
      { emoji: '🚆', name: 'Tren', keywords: ['renfe', 'ave', 'tren', 'viaje'] },
      { emoji: '✈️', name: 'Avión', keywords: ['vuelo', 'viaje', 'vacaciones', 'aeropuerto'] },
      { emoji: '🚖', name: 'Taxi', keywords: ['taxi', 'uber', 'cabify', 'transporte'] },
      { emoji: '🛵', name: 'Moto', keywords: ['scooter', 'ciclomotor', 'gasolina'] },
      { emoji: '🚲', name: 'Bicicleta', keywords: ['bici', 'ciclismo', 'movilidad'] },
      { emoji: '🚢', name: 'Barco', keywords: ['crucero', 'ferry', 'mar'] },
      { emoji: '🎫', name: 'Billetes', keywords: ['ticket', 'pase', 'abono'] },
      { emoji: '🧳', name: 'Equipaje', keywords: ['maleta', 'viaje', 'turismo'] },
    ],
  },
  {
    id: 'food',
    name: 'Comida',
    icon: '🍽️',
    emojis: [
      { emoji: '🍽️', name: 'Restaurante', keywords: ['restaurante', 'cena', 'comida', 'plato'] },
      { emoji: '☕', name: 'Café', keywords: ['cafe', 'desayuno', 'merienda', 'cafeteria'] },
      { emoji: '🍕', name: 'Pizza', keywords: ['pizza', 'cena', 'fast food', 'italiana'] },
      { emoji: '🍔', name: 'Hamburguesa', keywords: ['burger', 'hamburguesa', 'cena'] },
      { emoji: '🌮', name: 'Tacos', keywords: ['mexicano', 'taco', 'burrito'] },
      { emoji: '🍣', name: 'Sushi', keywords: ['japones', 'sushi', 'pescado'] },
      { emoji: '🥗', name: 'Saludable', keywords: ['ensalada', 'verdura', 'dieta'] },
      { emoji: '🥖', name: 'Panadería', keywords: ['pan', 'baguette', 'bolleria'] },
      { emoji: '🍎', name: 'Fruta', keywords: ['manzana', 'fruteria', 'salud'] },
      { emoji: '🥩', name: 'Carnicería', keywords: ['carne', 'chuleton', 'asado'] },
      { emoji: '🍺', name: 'Cerveza', keywords: ['cana', 'birra', 'bar'] },
      { emoji: '🍻', name: 'Ocio', keywords: ['cervezas', 'amigos', 'tapas', 'bar', 'copas'] },
      { emoji: '🍷', name: 'Vino', keywords: ['copa', 'bodega', 'cena'] },
      { emoji: '🍹', name: 'Cóctel', keywords: ['trago', 'copas', 'fiesta', 'pub'] },
      { emoji: '🍩', name: 'Dulces', keywords: ['donut', 'pasteleria', 'capricho'] },
      { emoji: '🍦', name: 'Helado', keywords: ['postre', 'heladeria', 'verano'] },
    ],
  },
  {
    id: 'leisure',
    name: 'Ocio & Salud',
    icon: '🎮',
    emojis: [
      { emoji: '🎮', name: 'Videojuegos', keywords: ['gaming', 'playstation', 'xbox', 'juegos'] },
      { emoji: '🎬', name: 'Cine', keywords: ['pelicula', 'cine', 'netflix', 'streaming'] },
      { emoji: '🎵', name: 'Música', keywords: ['concierto', 'spotify', 'cancion', 'show'] },
      { emoji: '🎟️', name: 'Entradas', keywords: ['ticket', 'evento', 'teatro', 'festival'] },
      { emoji: '🏖️', name: 'Vacaciones', keywords: ['playa', 'verano', 'relax', 'viaje'] },
      { emoji: '🏋️', name: 'Gimnasio', keywords: ['gym', 'fitness', 'entrenamiento', 'pesas'] },
      { emoji: '⚽', name: 'Fútbol', keywords: ['deporte', 'partido', 'liga'] },
      { emoji: '🎾', name: 'Pádel', keywords: ['tenis', 'padel', 'raqueta'] },
      { emoji: '💊', name: 'Farmacia', keywords: ['medicinas', 'farmacia', 'pastillas', 'receta'] },
      { emoji: '🩺', name: 'Médico', keywords: ['salud', 'consulta', 'doctor', 'clinica'] },
      { emoji: '🦷', name: 'Dentista', keywords: ['dientes', 'odontologo', 'limpieza'] },
      { emoji: '👓', name: 'Óptica', keywords: ['gafas', 'lentillas', 'vision'] },
      { emoji: '💇', name: 'Peluquería', keywords: ['peluqueria', 'corte', 'barberia', 'belleza'] },
      { emoji: '📚', name: 'Libros', keywords: ['libros', 'estudio', 'lectura', 'universidad'] },
      { emoji: '🎓', name: 'Educación', keywords: ['curso', 'master', 'colegio', 'academia'] },
    ],
  },
  {
    id: 'symbols',
    name: 'Símbolos',
    icon: '⭐',
    emojis: [
      { emoji: '⭐', name: 'Estrella', keywords: ['estrella', 'favorito', 'destacado'] },
      { emoji: '🔥', name: 'Fuego', keywords: ['fuego', 'urgente', 'importante', 'top'] },
      { emoji: '✨', name: 'Brillo', keywords: ['especial', 'magia', 'nuevo'] },
      { emoji: '❤️', name: 'Amor', keywords: ['corazon', 'pareja', 'cita'] },
      { emoji: '🎯', name: 'Objetivo', keywords: ['meta', 'diana', 'ahorro', 'reto'] },
      { emoji: '💡', name: 'Idea', keywords: ['bombilla', 'proyecto', 'creatividad'] },
      { emoji: '📌', name: 'Pin', keywords: ['chincheta', 'fijar', 'nota'] },
      { emoji: '🔒', name: 'Seguridad', keywords: ['candado', 'privado', 'seguro'] },
      { emoji: '🚀', name: 'Cohete', keywords: ['lanzamiento', 'rapido', 'crecimiento'] },
      { emoji: '🎉', name: 'Fiesta', keywords: ['celebracion', 'exito', 'aniversario'] },
      { emoji: '👑', name: 'Corona', keywords: ['premium', 'rey', 'vip'] },
      { emoji: '🌿', name: 'Naturaleza', keywords: ['ecologico', 'verde', 'sostenible'] },
    ],
  },
];

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  currentEmoji?: string;
  zIndex?: number;
}

/**
 * EmojiPickerModal
 * Selector de emojis nativo para Wallet.ia, optimizado para React 19 y dispositivos móviles (PWA).
 * Montado directamente mediante createPortal en document.body para evitar distorsiones de stacking context.
 */
export default function EmojiPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentEmoji,
  zIndex = 1500,
}: EmojiPickerModalProps) {
  const { t } = useLocaleCurrency();
  const [activeCategory, setActiveCategory] = useState<string>('finance');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Búsqueda inteligente a través de emojis y keywords
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory);
      return cat ? cat.emojis : [];
    }

    const matches: EmojiItem[] = [];
    const seen = new Set<string>();

    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (seen.has(item.emoji)) continue;
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesKeywords = item.keywords.some((k) => k.toLowerCase().includes(q));
        if (matchesName || matchesKeywords || item.emoji.includes(q)) {
          seen.add(item.emoji);
          matches.push(item);
        }
      }
    }
    return matches;
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Backdrop oscuro con blur suave */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />

        {/* Modal Contenedor Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            maxHeight: 'min(90vh, 90dvh, 600px)',
            minHeight: 0,
            margin: 'auto',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            color: 'var(--text-primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Cabecera del selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 18px 12px 18px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {t('icon') || 'Icono'}
            </h3>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Barra de búsqueda interactiva */}
          <div style={{ padding: '12px 16px 8px 16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '8px 12px',
              }}
            >
              <Search size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('search') || 'Buscar...'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Pestañas de categorías con scroll horizontal */}
          {!searchQuery && (
            <div
              style={{
                display: 'flex',
                gap: '6px',
                padding: '4px 16px 10px 16px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {EMOJI_CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      background: isActive ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border)'}`,
                      borderRadius: '10px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      fontWeight: isActive ? 600 : 400,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Cuadrícula de Emojis */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '8px 16px 18px 16px',
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '8px',
              maxHeight: '320px',
            }}
          >
            {filteredEmojis.length > 0 ? (
              filteredEmojis.map((item) => {
                const isSelected = currentEmoji === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => {
                      onSelect(item.emoji);
                      onClose();
                    }}
                    title={item.name}
                    style={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      minHeight: '48px',
                      background: isSelected ? 'var(--accent-primary-glow)' : 'var(--bg-tertiary)',
                      border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border)'}`,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.65rem',
                      cursor: 'pointer',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {item.emoji}
                  </button>
                );
              })
            ) : (
              <div
                style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '30px 0',
                  color: 'rgba(255, 255, 255, 0.4)',
                  fontSize: '0.88rem',
                }}
              >
                No se encontraron iconos para &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
