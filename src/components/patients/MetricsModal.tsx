import React from 'react';
import { X, Calendar, Activity, Clock, CheckCircle } from 'lucide-react';
import type { Patient, Evolution } from '../../services/api';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  evolutions: Evolution[];
}

export const MetricsModal: React.FC<MetricsModalProps> = ({
  isOpen,
  onClose,
  patient,
  evolutions
}) => {
  if (!isOpen) return null;

  const totalSessions = evolutions.length;
  
  // Calculate frequency based on first and last session
  let frequencyText = "N/A";
  let engagementLevel = "Baixo";
  let engagementColor = "#ef4444";

  if (totalSessions > 0) {
    const sorted = [...evolutions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
    const firstDate = new Date(sorted[0].session_date);
    const lastDate = new Date(sorted[sorted.length - 1].session_date);
    
    // Difference in weeks
    const diffTime = Math.abs(lastDate.getTime() - firstDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = diffDays / 7;
    
    if (totalSessions >= 2) {
      if (diffWeeks > 0) {
        const sessionsPerWeek = totalSessions / diffWeeks;
        if (sessionsPerWeek >= 0.8) {
          frequencyText = "Semanal";
          engagementLevel = "Alto";
          engagementColor = "#22c55e";
        } else if (sessionsPerWeek >= 0.4) {
          frequencyText = "Quinzenal";
          engagementLevel = "Médio";
          engagementColor = "#f59e0b";
        } else {
          frequencyText = "Mensal / Esporádico";
        }
      } else {
         frequencyText = "Semanal";
      }
    } else {
      frequencyText = "Primeira sessão";
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '600px', width: '95%' }}>
        <div className="modal-header">
          <h3>Painel de Métricas — {patient.name}</h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-soft, #f7faf8)' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <Activity size={18} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total de Sessões</span>
              </div>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{totalSessions}</span>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <Calendar size={18} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Frequência</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: 'auto' }}>{frequencyText}</span>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <CheckCircle size={18} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Engajamento</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: engagementColor, marginTop: 'auto' }}>{engagementLevel}</span>
            </div>

            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                <Clock size={18} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Duração Média</span>
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginTop: 'auto' }}>50 min</span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Padrão por sessão</span>
            </div>

          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '12px', color: '#1e293b' }}>Resumo de Período</h4>
            {totalSessions > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.9rem', color: '#475569' }}>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Primeira Sessão:</span>
                  <strong>{new Date([...evolutions].sort((a,b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())[0].session_date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sessão Mais Recente:</span>
                  <strong>{new Date([...evolutions].sort((a,b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0].session_date + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>
                </li>
              </ul>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Sem registros de sessões para gerar o período.</p>
            )}
          </div>

        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
