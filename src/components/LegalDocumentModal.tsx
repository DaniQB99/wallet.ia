interface LegalDocumentModalProps {
  title: string;
  content: string;
  onClose: () => void;
}
import { useLocaleCurrency } from '../contexts/LocaleCurrencyContext';

export default function LegalDocumentModal({ title, content, onClose }: LegalDocumentModalProps) {
  const { t } = useLocaleCurrency();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '760px' }}>
        <div className="modal-title" style={{ marginBottom: '16px' }}>{title}</div>
        <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)', maxHeight: '60vh', overflowY: 'auto' }}>
          {content}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn btn-primary" onClick={onClose}>{t('close')}</button>
        </div>
      </div>
    </div>
  );
}
