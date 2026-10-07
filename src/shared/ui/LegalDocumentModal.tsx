import { X } from 'lucide-react';
import { useLocaleCurrency } from '../../app/providers/LocaleCurrencyContext';

interface LegalDocumentModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

/**
 * Componente modal de solo lectura para la presentación estructurada de documentos legales,
 * tales como Términos de Servicio o Políticas de Privacidad.
 *
 * @param props - Propiedades del modal: título, contenido de texto y función de cierre.
 */
export default function LegalDocumentModal({ title, content, onClose }: LegalDocumentModalProps) {
  const { t } = useLocaleCurrency();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '760px' }}>
        <div className="modal-header">
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={t('close')}
          >
            <X size={20} />
          </button>
          <h2 className="modal-title">{title}</h2>
        </div>
        <div className="modal-scroll-area" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)', maxHeight: '60vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain', paddingRight: '4px' }}>
          {content}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}
