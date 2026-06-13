import React from 'react';
import { 
  X, 
  Clock, 
  Phone, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  Trash2 
} from 'lucide-react';
import { Portal } from '../Portal';
import type { Appointment } from '../../services/api';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  isSubmitting?: boolean;
  onUpdateStatus: (id: string, status: Appointment['status']) => void;
  onSendWhatsApp: (app: Appointment) => void;
  onDelete: (id: string) => void;
  getStatusBadge: (status: Appointment['status']) => React.ReactNode;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdateStatus,
  onSendWhatsApp,
  onDelete,
  getStatusBadge
}) => {
  if (!isOpen || !appointment) return null;

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content animate-slide-up" style={{ maxWidth: '450px' }}>
          <div className="modal-header">
            <h3>Detalhes da Consulta</h3>
            <button className="close-modal-btn" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
          <div className="modal-body">
            <div className="detail-profile-block">
              <div className="avatar-circle">
                {appointment.patient?.name.charAt(0).toUpperCase()}
              </div>
              <h4>{appointment.patient?.name}</h4>
              {getStatusBadge(appointment.status)}
            </div>

            <div className="detail-list" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                <Clock size={16} />
                <span style={{ fontSize: '0.9rem' }}>
                  {new Date(appointment.date_time).toLocaleDateString('pt-BR')} às {new Date(appointment.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({appointment.duration_minutes} min)
                </span>
              </div>
              {appointment.patient?.phone && (
                <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                  <Phone size={16} />
                  <span style={{ fontSize: '0.9rem' }}>{appointment.patient.phone}</span>
                </div>
              )}
              {appointment.notes && (
                <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary-light)' }}>
                  <strong>Observações:</strong>
                  <p style={{ marginTop: '4px' }}>{appointment.notes}</p>
                </div>
              )}
            </div>

            <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="form-label" style={{ fontSize: '0.75rem' }}>Alterar Status do Atendimento</span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => onUpdateStatus(appointment.id, 'completed')}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--success)' }}
                  type="button"
                >
                  <CheckCircle size={14} /> Realizado
                </button>
                <button 
                  onClick={() => onUpdateStatus(appointment.id, 'no_show')}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--warning)' }}
                  type="button"
                >
                  <AlertTriangle size={14} /> Falta / No-Show
                </button>
                <button 
                  onClick={() => onUpdateStatus(appointment.id, 'canceled')}
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--error)' }}
                  type="button"
                >
                  <XCircle size={14} /> Cancelar
                </button>
                <button 
                  onClick={() => onUpdateStatus(appointment.id, 'scheduled')}
                  className="btn btn-secondary btn-sm"
                  type="button"
                >
                  Agendado
                </button>
              </div>

              <hr style={{ margin: '10px 0', borderColor: 'var(--border-color)' }} />

              <button 
                onClick={() => onSendWhatsApp(appointment)}
                className="btn btn-primary"
                style={{ width: '100%', backgroundColor: '#25d366', borderColor: '#25d366', color: 'white', boxShadow: 'none' }}
                type="button"
              >
                <MessageSquare size={16} /> Lembrete WhatsApp
              </button>
              
              <button 
                onClick={() => onDelete(appointment.id)}
                className="btn btn-danger"
                style={{ width: '100%' }}
                type="button"
              >
                <Trash2 size={16} /> Excluir Agendamento
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
