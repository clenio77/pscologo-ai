import React, { useState, useEffect, useCallback } from 'react';
import { X, Mic, MicOff } from 'lucide-react';
import { Portal } from '../Portal';
import { useSpeechToText } from '../../hooks/useSpeechToText';
import type { Patient } from '../../services/api';

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onSubmit: (data: { sessionDate: string; content: string }) => Promise<void>;
}

export const EvolutionModal: React.FC<EvolutionModalProps> = ({
  isOpen,
  onClose,
  patient,
  onSubmit
}) => {
  const [evoDate, setEvoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [evoContent, setEvoContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save do rascunho da evolução no localStorage
  useEffect(() => {
    if (isOpen && patient) {
      const draft = localStorage.getItem(`evo_draft_${patient.id}`);
      if (draft) setEvoContent(draft);
    } else {
      // Reseta os estados quando fecha
      setEvoContent('');
      setEvoDate(new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, patient]);

  useEffect(() => {
    if (isOpen && patient && evoContent.trim() !== '') {
      localStorage.setItem(`evo_draft_${patient.id}`, evoContent);
    }
  }, [evoContent, isOpen, patient]);

  // Speech-to-Text Callback
  const handleTranscript = useCallback((text: string) => {
    setEvoContent(prev => prev + (prev.endsWith(' ') || prev.length === 0 ? '' : ' ') + text);
  }, []);

  const { isListening, toggleListen, isSupported: isSpeechSupported } = useSpeechToText(handleTranscript);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        sessionDate: evoDate,
        content: evoContent
      });
      // Limpa rascunho após submissão bem-sucedida
      localStorage.removeItem(`evo_draft_${patient.id}`);
      setEvoContent('');
      onClose();
    } catch (err) {
      console.error('Erro ao submeter evolução:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content animate-slide-up" style={{ maxWidth: '650px' }}>
          <div className="modal-header">
            <h3>Registrar Evolução de Sessão</h3>
            <button className="close-modal-btn" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Data da Sessão</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={evoDate}
                  onChange={(e) => setEvoDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Relato Clínico da Evolução</label>
                  {isSpeechSupported && (
                    <button 
                      type="button" 
                      onClick={toggleListen}
                      className={`btn btn-sm ${isListening ? 'btn-danger' : 'btn-secondary'}`}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '20px' }}
                      title={isListening ? 'Parar gravação' : 'Ditar evolução usando o microfone'}
                    >
                      {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                      {isListening ? 'Parar de Ditar' : 'Ditar por Voz'}
                    </button>
                  )}
                </div>
                <textarea 
                  className="form-control" 
                  rows={8} 
                  placeholder="Descreva as queixas, intervenções realizadas, progresso e próximos passos discutidos na sessão..."
                  value={evoContent}
                  onChange={(e) => setEvoContent(e.target.value)}
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{evoContent.length > 0 ? '✔️ Rascunho salvo automaticamente' : ''}</span>
                  <span>{evoContent.length} caracteres digitados.</span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Registrando...' : 'Salvar no Prontuário'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
