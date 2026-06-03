import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { FormTemplate } from '../services/api';
import { 
  Plus, 
  Trash2, 
  Eye, 
  PlusCircle, 
  FileText, 
  HelpCircle, 
  X
} from 'lucide-react';
import './Forms.css';

interface DynamicField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  options?: string[]; // Opções adicionais se for select
}

export const Forms: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // States do Criador de Formulário (Modal)
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [fields, setFields] = useState<DynamicField[]>([]);
  
  // States auxiliares para adicionar pergunta
  const [tempLabel, setTempLabel] = useState('');
  const [tempType, setTempType] = useState<DynamicField['type']>('text');
  const [tempRequired, setTempRequired] = useState(false);
  const [tempOptionsStr, setTempOptionsStr] = useState(''); // Opções separadas por vírgula

  // Visualização de um modelo existente
  const [viewingTemplate, setViewingTemplate] = useState<FormTemplate | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const data = await api.getFormTemplates(user.id);
      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar modelos de formulário:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTemplates();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTemplates]);

  const handleAddField = () => {
    if (!tempLabel.trim()) {
      addToast('A pergunta ou rótulo não pode ser vazio.', 'warning');
      return;
    }

    const newField: DynamicField = {
      id: `field-id-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      label: tempLabel,
      type: tempType,
      required: tempRequired,
      options: tempType === 'select' 
        ? tempOptionsStr.split(',').map(o => o.trim()).filter(Boolean) 
        : undefined
    };

    setFields([...fields, newField]);
    
    // Reset da pergunta temporária
    setTempLabel('');
    setTempType('text');
    setTempRequired(false);
    setTempOptionsStr('');
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!formTitle.trim()) {
      addToast('Por favor, informe um título para o formulário.', 'warning');
      return;
    }
    if (fields.length === 0) {
      addToast('Adicione pelo menos uma pergunta ao seu formulário antes de salvar.', 'warning');
      return;
    }

    try {
      await api.createFormTemplate({
        professional_id: user.id,
        title: formTitle,
        description: formDesc || undefined,
        fields: fields,
      });

      setIsCreatorModalOpen(false);
      setFormTitle('');
      setFormDesc('');
      setFields([]);
      addToast('Modelo de formulário salvo!', 'success');
      loadTemplates();
    } catch (err) {
      console.error('Erro ao salvar modelo de formulário:', err);
      addToast('Erro ao salvar modelo de formulário.', 'error');
    }
  };

  const openCreateModal = () => {
    setFormTitle('');
    setFormDesc('');
    setFields([]);
    setIsCreatorModalOpen(true);
  };

  return (
    <div className="forms-page">
      <div className="action-header" style={{ justifyContent: 'flex-end', marginBottom: '24px' }}>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={18} />
          <span>Criar Modelo de Ficha</span>
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <span className="spinner"></span>
          <p>Buscando modelos de fichas e anamneses...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state card">
          <FileText size={48} className="empty-icon" />
          <h3>Nenhum modelo de formulário criado</h3>
          <p>
            Crie fichas de anamnese, questionários de acompanhamento ou evolução comportamental 
            para preencher rapidamente durante as sessões com seus pacientes.
          </p>
          <button className="btn btn-primary" onClick={openCreateModal}>
            Criar Primeiro Modelo
          </button>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card card">
              <div className="template-card-header">
                <FileText className="template-icon" size={24} />
                <div className="template-header-info">
                  <h4>{template.title}</h4>
                  <span>{template.fields.length} perguntas</span>
                </div>
              </div>
              <p className="template-desc">{template.description || 'Sem descrição'}</p>
              
              <div className="template-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => setViewingTemplate(template)}>
                  <Eye size={14} />
                  <span>Visualizar Modelo</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: CRIADOR DE FORMULÁRIO */}
      {isCreatorModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '850px', width: '90%' }}>
            <div className="modal-header">
              <h3>Criador de Fichas e Formulários</h3>
              <button className="close-modal-btn" onClick={() => setIsCreatorModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="creator-layout">
              {/* Lado Esquerdo: Adicionar campos e Metadados */}
              <div className="creator-left-panel">
                <form onSubmit={(e) => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Título do Modelo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Anamnese Inicial Infantil"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição / Instruções</label>
                    <textarea 
                      className="form-control" 
                      rows={2} 
                      placeholder="Instruções para o preenchimento..."
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>

                  <hr style={{ borderColor: 'var(--border-color)' }} />
                  
                  <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Adicionar Nova Pergunta
                  </h4>

                  <div className="form-group">
                    <label className="form-label">Texto da Pergunta</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Como descreve a qualidade do sono?"
                      value={tempLabel}
                      onChange={(e) => setTempLabel(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Tipo de Campo</label>
                      <select 
                        className="form-control"
                        value={tempType}
                        onChange={(e) => setTempType(e.target.value as DynamicField['type'])}
                      >
                        <option value="text">Texto Curto</option>
                        <option value="textarea">Texto Longo / Parágrafo</option>
                        <option value="select">Seleção / Dropdown</option>
                        <option value="checkbox">Caixa de Seleção (Sim/Não)</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                        <input 
                          type="checkbox" 
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                          checked={tempRequired}
                          onChange={(e) => setTempRequired(e.target.checked)}
                        />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Obrigatório</span>
                      </div>
                    </div>
                  </div>

                  {tempType === 'select' && (
                    <div className="form-group">
                      <label className="form-label">Opções de Seleção (separadas por vírgula)</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ex: Excelente, Bom, Regular, Ruim"
                        value={tempOptionsStr}
                        onChange={(e) => setTempOptionsStr(e.target.value)}
                      />
                    </div>
                  )}

                  <button type="button" className="btn btn-secondary" onClick={handleAddField} style={{ marginTop: '8px' }}>
                    <PlusCircle size={16} />
                    <span>Inserir na Ficha</span>
                  </button>
                </form>
              </div>

              {/* Lado Direito: Preview da Ficha Montada */}
              <div className="creator-right-panel">
                <div className="preview-container card">
                  <span className="preview-label">Visualização do Modelo</span>
                  
                  <div className="preview-header-block">
                    <h3>{formTitle || 'Título da sua Ficha'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                      {formDesc || 'Descrição do formulário...'}
                    </p>
                  </div>

                  {fields.length === 0 ? (
                    <div className="preview-empty-state">
                      <HelpCircle size={32} style={{ color: 'var(--border-color-hover)' }} />
                      <p>Adicione perguntas usando o painel à esquerda para montar a estrutura do formulário.</p>
                    </div>
                  ) : (
                    <div className="preview-fields-list">
                      {fields.map((f, i) => (
                        <div key={f.id} className="preview-field-item">
                          <div className="preview-field-meta">
                            <span>Questão {i + 1} ({f.type}) {f.required && '*'}</span>
                            <button className="remove-field-btn" onClick={() => handleRemoveField(f.id)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="preview-field-content">
                            <label className="form-label" style={{ marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                              {f.label}
                            </label>
                            {f.type === 'text' && <input type="text" className="form-control" disabled placeholder="Resposta curta..." />}
                            {f.type === 'textarea' && <textarea className="form-control" disabled rows={2} placeholder="Resposta longa..." />}
                            {f.type === 'select' && (
                              <select className="form-control" disabled>
                                <option>Selecione uma opção...</option>
                                {f.options?.map(opt => <option key={opt}>{opt}</option>)}
                              </select>
                            )}
                            {f.type === 'checkbox' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input type="checkbox" disabled />
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Marcação</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreatorModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSaveTemplate} disabled={fields.length === 0}>
                Salvar Modelo de Formulário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VISUALIZAR MODELO EXISTENTE */}
      {viewingTemplate && (
        <div className="modal-overlay">
          <div className="modal-content animate-slide-up" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Visualização de Modelo</h3>
              <button className="close-modal-btn" onClick={() => setViewingTemplate(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="preview-header-block" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.3rem' }}>{viewingTemplate.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  {viewingTemplate.description || 'Sem descrição cadastrada.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {viewingTemplate.fields.map((f, idx) => (
                  <div key={f.id} className="form-group" style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <label className="form-label" style={{ color: 'var(--text-main)', fontSize: '0.9rem', marginBottom: '8px' }}>
                      {idx + 1}. {f.label} {f.required && <span style={{ color: 'var(--error)' }}>*</span>}
                    </label>
                    
                    {f.type === 'text' && (
                      <input type="text" className="form-control" disabled placeholder="Espaço para resposta curta..." />
                    )}

                    {f.type === 'textarea' && (
                      <textarea className="form-control" disabled rows={2} placeholder="Espaço para resposta longa..." />
                    )}

                    {f.type === 'select' && (
                      <select className="form-control" disabled>
                        <option>Opções de resposta:</option>
                        {f.options?.map(opt => <option key={opt}>{opt}</option>)}
                      </select>
                    )}

                    {f.type === 'checkbox' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" disabled />
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Confirmar / Assinalar</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewingTemplate(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

