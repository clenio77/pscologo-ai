import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';
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
    status?: string;
  }) => Promise<string>;
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
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && templates.length > 0) {
      setSelectedTemplateId(templates[0].id);
      setFormAnswers({});
      setIsRespondentThirdParty(false);
      setRespName('');
      setRespRelationship('');
      setGeneratedLink(null);
      setCopied(false);
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
        respondentRelationship: isRespondentThirdParty ? respRelationship : undefined,
        status: 'completed'
      });
      onClose();
    } catch (err) {
      console.error('Erro ao aplicar formulário em sessão:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateExternalLink = async () => {
    setIsSubmitting(true);
    try {
      const formId = await onSubmit({
        templateId: selectedTemplateId,
        answers: {}, // inicia vazio para o paciente responder
        respondentName: isRespondentThirdParty ? respName : undefined,
        respondentRelationship: isRespondentThirdParty ? respRelationship : undefined,
        status: 'pending' // status pending indica link externo ativo
      });
      
      const link = `${window.location.origin}/responder-formulario/${formId}`;
      setGeneratedLink(link);
    } catch (err) {
      console.error('Erro ao gerar link externo:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    if (!generatedLink || !patient) return;
    const message = `Olá, ${patient.name}! Como parte do nosso acompanhamento terapêutico, por favor, responda a este formulário quando puder: ${generatedLink}`;
    
    // Remove caracteres não numéricos do telefone
    const phoneClean = patient.phone ? patient.phone.replace(/\D/g, '') : '';
    const url = `https://api.whatsapp.com/send?phone=${phoneClean}&text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Portal>
      <div className="modal-overlay">
        <div className="modal-content animate-slide-up" style={{ maxWidth: '700px', width: '95%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          
          <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color, #e1ebe3)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main, #2b3a30)' }}>
              {generatedLink ? 'Link Externo Gerado com Sucesso' : 'Aplicar Ficha de Anamnese / Formulário'}
            </h3>
            <button className="close-modal-btn" onClick={onClose} type="button">
              <X size={20} />
            </button>
          </div>

          {generatedLink ? (
            /* TELA DE SUCESSO DO LINK GERADO */
            <div className="modal-body" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px', backgroundColor: 'white', overflowY: 'auto' }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eaf2eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4a7c59' }}>
                  <Share2 size={28} />
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#2b3a30' }}>Enviar Formulário para o Paciente</h4>
                <p style={{ color: '#5e6f64', fontSize: '0.92rem', margin: 0, maxWidth: '480px', lineHeight: '1.5' }}>
                  O link foi gerado e está pronto. O paciente poderá acessar o formulário diretamente do navegador dele (computador ou celular) sem precisar de login.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2b3a30' }}>URL de Acesso Público</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-control" 
                    readOnly 
                    value={generatedLink}
                    style={{ backgroundColor: '#f4f7f5', fontSize: '0.88rem', border: '1.5px solid #d8e2dc', padding: '10px 14px', borderRadius: '8px', flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className={`btn ${copied ? 'btn-success' : 'btn-secondary'}`}
                    onClick={handleCopyLink}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px', padding: '0 16px', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: copied ? '#4a7c59' : '#5e6f64', color: 'white', border: 'none', cursor: 'pointer' }}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    <span>{copied ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleSendWhatsApp}
                  style={{ width: '100%', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', fontSize: '0.98rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  <Share2 size={18} />
                  <span>Enviar por WhatsApp do Paciente</span>
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={onClose}
                  style={{ width: '100%', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '10px', fontSize: '0.92rem', cursor: 'pointer', border: '1.5px solid #d8e2dc', backgroundColor: 'white', color: '#5e6f64' }}
                >
                  Fechar Janela
                </button>
              </div>
            </div>
          ) : (
            /* TELA PADRÃO DE PREENCHIMENTO EM SESSÃO */
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
              
              <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color, #e1ebe3)', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleGenerateExternalLink} 
                  disabled={isSubmitting || templates.length === 0}
                  style={{ borderRadius: '8px', height: '40px', padding: '0 18px', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#e8efe9', color: '#2b3a30', border: '1px solid #c2d6c7', cursor: 'pointer', fontWeight: 600 }}
                >
                  <Share2 size={16} />
                  <span>Gerar Link Externo</span>
                </button>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" className="btn btn-secondary" onClick={onClose} style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }} disabled={isSubmitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ borderRadius: '8px', height: '40px', padding: '0 20px' }} disabled={isSubmitting || templates.length === 0}>
                    {isSubmitting ? 'Salvando...' : 'Concluir e Salvar Respostas'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </Portal>
  );
};
