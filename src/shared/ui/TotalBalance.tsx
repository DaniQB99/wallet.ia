import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

interface TotalBalanceProps {
  value: number;
  label: string;
  icon?: React.ReactNode;
  color?: string;
  iconBg?: string;
  iconColor?: string;
  size?: 'normal' | 'small';
}

export const TotalBalance: React.FC<TotalBalanceProps> = ({ 
  value, 
  label, 
  icon, 
  color = 'var(--bg-secondary)', 
  iconBg = 'var(--bg-tertiary)',
  iconColor = 'var(--text-primary)',
  size = 'normal'
}) => {
  const { locale, currency } = useLocaleCurrency();
  
  const spring = useSpring(value, { mass: 0.8, stiffness: 100, damping: 15 });
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  const display = useTransform(spring, (current) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(current);
  });

  return (
    <div className={`stat-card ${size === 'small' ? 'stat-card-small' : ''}`} style={{ '--stat-color': color } as React.CSSProperties}>
      {icon && (
        <div className="stat-card-icon" style={{ background: iconBg, color: iconColor }}>
          {icon}
        </div>
      )}
      <motion.div className="stat-card-value tabular-nums">
        {display}
      </motion.div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
};
