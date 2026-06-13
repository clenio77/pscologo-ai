import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Portal } from '../Portal';
import type { Patient } from '../../services/api';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  isSubmitting: boolean;
  initialDate: string;
  onSubmit: (data: {
    patientId: string;
    date: string;
    time: string;
    duration: number;
    notes: string;
  }) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  patients,
  isSubmitting,
  initialDate,
  onSubmit
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appDate, setAppDate] = useState(initialDate);
  const [appTime, setAppTime] = useState('09:00');
  const [appDuration, setAppDuration] = useState(50);
  const [appNotes, setAppNotes] = useState('');

  useEffect(() => {
    if (initialDate) {
      setAppDate(initialDate);
    }
  }, [initialDate]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId: selectedPatientId,
      date: appDate,
      time: appTime,
      duration: appDuration,
      notes: appNotes
    });
  };

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content animate-slide-up">
          <div className="modal-header">
            <h3>Marcar Consulta / Sessão</h3>
            <button className="close-modal-btn" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {patients.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    É necessário ter pelo menos um paciente cadastrado para realizar agendamentos.
                  </p>
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    Cadastre o paciente primeiro na aba de Pacientes!
                  </span>
                </div>
              ) : (
                <>
                  <div className="form-group">
                    <label className="form-label">Selecione o Paciente</label>
                    <select 
                      className="form-control"
                      value={selectedPatientId}
                      onChange={(e) => setSelectedPatientId(e.target.value)}
                      required
                    >
                      <option value="">Selecione...</option>
                      {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Data da Consulta</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={appDate}
                        onChange={(e) => setAppDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Horário de Início</label>
                      <input 
                        type="time" 
                        className="form-control" 
                        value={appTime}
                        onChange={(e) => setAppTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duração Estimada (minutos)</label>
                    <select 
                      className="form-control"
                      value={appDuration}
                      onChange={(e) => setAppDuration(Number(e.target.value))}
                    >
                      <option value={30}>30 minutos</option>
                      <option value={45}>45 minutos</option>
                      <option value={50}>50 minutos (Padrão)</option>
                      <option value={60}>60 minutos / 1 hora</option>
                      <option value={90}>90 minutos</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Queixas Clínicas / Notas do Agendamento</label>
                    <textarea 
                      className="form-control" 
                      rows={3} 
                      placeholder="Ex: Primeira consulta, alinhar metas..."
                      value={appNotes}
                      onChange={(e) => setAppNotes(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={patients.length === 0 || isSubmitting}
              >
                {isSubmitting ? 'Agendando...' : 'Salvar Consulta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
