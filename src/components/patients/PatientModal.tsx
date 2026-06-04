import React, { useState } from 'react';
import { X } from 'lucide-react';
import { formatPhone } from '../../utils/formatters';
import { Portal } from '../Portal';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (patientData: {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    notes: string;
  }) => Promise<void>;
}

export const PatientModal: React.FC<PatientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [pName, setPName] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pBirthDate, setPBirthDate] = useState('');
  const [pNotes, setPNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        name: pName,
        email: pEmail,
        phone: pPhone,
        birthDate: pBirthDate,
        notes: pNotes,
      });
      // Reset form
      setPName('');
      setPEmail('');
      setPPhone('');
      setPBirthDate('');
      setPNotes('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content animate-slide-up">
          <div className="modal-header">
            <h3>Cadastrar Novo Paciente</h3>
            <button className="close-modal-btn" onClick={onClose} aria-label="Fechar modal">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ex: João da Silva" 
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  required 
                />
              </div>
              <div className="grid grid-2 gap-4">
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    placeholder="joao@email.com" 
                    value={pEmail}
                    onChange={(e) => setPEmail(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="(11) 99999-9999" 
                    value={pPhone}
                    onChange={(e) => setPPhone(formatPhone(e.target.value))}
                    maxLength={15}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Data de Nascimento</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={pBirthDate}
                  onChange={(e) => setPBirthDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Queixa Inicial / Observações</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Breve descrição dos sintomas relatados ou histórico do paciente..."
                  value={pNotes}
                  onChange={(e) => setPNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Criando...' : 'Criar Prontuário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
