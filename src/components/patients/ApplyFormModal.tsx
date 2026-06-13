import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Portal } from '../Portal';
import type { Patient, FormTemplate } from '../../services/api';

interface ApplyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  templates: FormTemplate[];
  onSubmit: (data: {
    templateId: string;
    answers: Record<string, unknown>;
    respondentName?: string;
    respondentRelationship?: string;
  }) => Promise<void>;
}

export const ApplyFormModal: React.FC<ApplyFormModalProps> = ({
  isOpen,
  onClose,
  patient,
  templates,
  onSubmit
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [formAnswers, setFormAnswers] = useState<Record<string, unknown>>({});
  const [isRespondentThirdParty, setIsRespondentThirdParty] = useState(false);
  const [respName, setRespName] = useState('');
  const [respRelationship, setRespRelationship] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
      setFormAnswers({});
      setIsRespondentThirdParty(false);
      setRespName('');
      setRespRelationship('');
    }
  }, [isOpen, templates]);

  if (!isOpen || !patient) return null;

  const handleAnswerChange = (fieldLabel: string, value: unknown) => {
    setFormAnswers(prev => ({
      ...prev,
      [fieldLabel]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        templateId: selectedTemplateId,
        answers: formAnswers,
        respondentName: isRespondentThirdParty ? respName : undefined,
        respondentRelationship: isRespondentThirdParty ? respRelationship : undefined
      });
      onClose();
    } catch (err) {
      console.error('Erro ao aplicar formulário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content animate-slide-up" style={{ maxWidth: '700px', width: '95%', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, #e1ebe3)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main, #2b3a30)' }}>Aplicar Ficha de Anamnese / Formulário</h3>
            <button className="close-modal-btn" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'var(--bg-soft, #f7faf8)' }}>
              
              {/* Cabeçalho de Contexto do Paciente */}
              <div className="modal-patient-context" style={{ padding: '14px 18px', background: 'var(--primary-light, #6c9a75)', color: 'white', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <span>Paciente em atendimento:</span>
                <strong>{patient.name}</strong>
              </div>

              {/* Seleção do Roteiro */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color, #e1ebe3)', boxShadow: '0 2px 5px rgba(43, 58, 48, 0.02)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main, #2b3a30)', marginBottom: '8px' }}>
                    Selecione o Modelo de Formulário
                  </label>
                  <select 
                    className="form-control"
                    value={selectedTemplateId}
                    onChange={(e) => {
                      setSelectedTemplateId(e.target.value);
                      setFormAnswers({});
                    }}
                    required
                    style={{ height: '42px', fontSize: '0.95rem', borderRadius: '8px' }}
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bloco de Respondente de Terceiros */}
              <div className="respondent-selection-box" style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #e1ebe3)',
                boxShadow: '0 2px 5px rgba(43, 58, 48, 0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input 
                    type="checkbox"
                    id="third-party-respondent"
                    style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    checked={isRespondentThirdParty}
                    onChange={(e) => setIsRespondentThirdParty(e.target.checked)}
                  />
                  <label htmlFor="third-party-respondent" style={{ fontSize: '0.92rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-main, #2b3a30)' }}>
                    Ficha respondida por um familiar ou terceiro (mãe, pai, filho, cuidador)
                  </label>
                </div>
                
                {isRespondentThirdParty && (
                  <div className="grid grid-2 gap-4 animate-slide-up" style={{ boxSizing: 'border-box', borderTop: '1px dashed var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Nome do Familiar Respondente</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ex: Maria Pereira"
                        value={respName}
                        onChange={(e) => setRespName(e.target.value)}
                        required={isRespondentThirdParty}
                        style={{ backgroundColor: 'var(--bg-soft, #f7faf8)', borderRadius: '8px', height: '40px' }}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>Grau de Parentesco / Vínculo</label>
                      <input 
                        type="text"
                        className="form-control"
                        placeholder="Ex: Mãe, Filho, Cuidador..."
                        value={respRelationship}
                        onChange={(e) => setRespRelationship(e.target.value)}
                        required={isRespondentThirdParty}
                        style={{ backgroundColor: 'var(--bg-soft, #f7faf8)', borderRadius: '8px', height: '40px' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Renderização Dinâmica dos Campos do Formulário */}
              <div className="dynamic-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {templates.find(t => t.id === selectedTemplateId)?.fields.map((field) => {
                  const hasColon = field.label.includes(':');
                  let title = field.label;
                  let subtitle = '';

                  if (hasColon) {
                    const index = field.label.indexOf(':');
                    title = field.label.substring(0, index).trim();
                    subtitle = field.label.substring(index + 1).trim();
                  }

                  const formatTitle = (t: string) => {
                    if (t === t.toUpperCase() && t.length > 5) {
                      return t.toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase());
                    }
                    return t;
                  };

                  return (
                    <div key={field.id} className="dynamic-field-card" style={{
                      backgroundColor: 'white',
                      padding: '20px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color, #e1ebe3)',
                      boxShadow: '0 2px 5px rgba(43, 58, 48, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main, #2b3a30)' }}>
                          {formatTitle(title)} {field.required && <span style={{ color: 'var(--error, #dc3545)' }}>*</span>}
                        </label>
                        {subtitle && (
                          <span style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted, #5e6f64)', marginTop: '4px', lineHeight: '1.4' }}>
                            {subtitle}
                          </span>
                        )}
                      </div>

                      {field.type === 'text' && (
                        <input 
                          type="text" 
                          className="form-control"
                          value={String(formAnswers[field.label] || '')}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          required={field.required}
                          placeholder="Escreva a resposta curta..."
                          style={{ padding: '10px 14px', borderRadius: '8px', height: '40px' }}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea 
                          className="form-control"
                          rows={3}
                          value={String(formAnswers[field.label] || '')}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          required={field.required}
                          placeholder="Escreva o relato ou observação clínica do campo..."
                          style={{ padding: '12px 14px', borderRadius: '8px', minHeight: '80px', resize: 'vertical' }}
                        />
                      )}

                      {field.type === 'select' && (
                        <select 
                          className="form-control"
                          value={String(formAnswers[field.label] || '')}
                          onChange={(e) => handleAnswerChange(field.label, e.target.value)}
                          required={field.required}
                          style={{ padding: '10px 14px', borderRadius: '8px', height: '42px' }}
                        >
                          <option value="">Selecione uma opção...</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.type === 'checkbox' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                          <input 
                            type="checkbox"
                            id={`check-${field.id}`}
                            style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                            checked={Boolean(formAnswers[field.label] || false)}
                            onChange={(e) => handleAnswerChange(field.label, e.target.checked)}
                          />
                          <label htmlFor={`check-${field.id}`} style={{ fontSize: '0.9rem', color: 'var(--text-main, #2b3a30)', cursor: 'pointer' }}>
                            Confirmar / Assinalar item
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e1ebe3)', backgroundColor: 'white', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }} disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Concluir e Salvar Respostas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
};
