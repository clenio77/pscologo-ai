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
  X,
  Sparkles
} from 'lucide-react';
import './Forms.css';
import { Portal } from '../components/Portal';

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

  const loadPredefinedTemplate = (type: 'adulto' | 'infantil' | 'idoso' | 'tcc') => {
    if (fields.length > 0 && !window.confirm('Carregar este modelo irá substituir todas as perguntas atuais do rascunho. Deseja continuar?')) {
      return;
    }

    const generateId = (idx: number) => `field-${type}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;

    if (type === 'adulto') {
      setFormTitle('Anamnese Geral Adulto (Diretrizes CFP)');
      setFormDesc('Roteiro padrão de anamnese clínica focado no próprio paciente adulto, estruturado conforme as diretrizes de registro documental exigidas pelo Conselho Federal de Psicologia (CFP).');
      setFields([
        {
          id: generateId(1),
          label: 'Dados de Identificação: Nome completo, idade, escolaridade, profissão e estado civil.',
          type: 'text',
          required: true
        },
        {
          id: generateId(2),
          label: 'Queixa Principal: Qual é o motivo principal que levou você a buscar atendimento psicológico neste momento?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(3),
          label: 'Histórico do Problema Atual (HDA): Descreva quando e como esses sintomas ou conflitos começaram e de que forma afetam sua vida no cotidiano.',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(4),
          label: 'Histórico Médico e Psiquiátrico: Possui alguma condição de saúde física/mental ativa ou faz uso de medicamentos psicotrópicos?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(5),
          label: 'Histórico e Dinâmica Familiar: Descreva brevemente sua estrutura familiar atual e se há histórico de transtornos na família.',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(6),
          label: 'Histórico Social e Ocupacional: Como é sua rotina de trabalho/estudo, atividades de lazer e seu círculo de relações sociais?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(7),
          label: 'Expectativas e Objetivos: O que você espera alcançar com o início do acompanhamento psicoterapêutico?',
          type: 'textarea',
          required: false
        }
      ]);
      addToast('Template de Anamnese Adulto (Diretrizes CFP) carregado! Você pode alterar ou adicionar perguntas livremente.', 'success');
    } else if (type === 'infantil') {
      setFormTitle('Anamnese de Desenvolvimento Infantil');
      setFormDesc('Roteiro baseado em marcos de neurodesenvolvimento e sociabilidade, ideal para ser respondido pelos pais ou responsáveis legais do menor.');
      setFields([
        {
          id: generateId(1),
          label: 'Gestação e Pré-natal: Como foi o período de gestação? Ocorreu alguma intercorrência física ou emocional de relevância?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(2),
          label: 'Condições de Parto: Como foi o parto (normal, cesárea)? O bebê nasceu a termo e necessitou de UTI neonatal ou oxigênio?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(3),
          label: 'Marcos de Neurodesenvolvimento: Com que idade a criança engatinhou, andou, falou as primeiras palavras e obteve o desfralde?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(4),
          label: 'Sono e Alimentação: Descreva a rotina de sono e alimentação atual da criança (há insônia, pesadelos, recusa ou seletividade alimentar)?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(5),
          label: 'Comportamento e Socialização: Como a criança interage com outras crianças e adultos? Do que prefere brincar no dia a dia?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(6),
          label: 'Dinâmica Escolar: Apresenta dificuldades na escola? Como foi o processo de adaptação escolar?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(7),
          label: 'Histórico de Saúde Geral: Apresenta alergias, doenças crônicas ou toma alguma medicação de uso contínuo?',
          type: 'textarea',
          required: false
        }
      ]);
      addToast('Template Infantil carregado! Você pode alterar ou adicionar perguntas livremente.', 'success');
    } else if (type === 'idoso') {
      setFormTitle('Anamnese Psicossocial e Autonomia');
      setFormDesc('Roteiro clínico focado na perda de funções cognitivas, capacidade funcional e suporte de cuidadores. Indicado para ser respondido por filhos ou responsáveis.');
      setFields([
        {
          id: generateId(1),
          label: 'Queixa Principal da Família: Quais foram as primeiras alterações de memória, comportamento ou orientação que chamaram a atenção?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(2),
          label: 'Independência Funcional (AVDs): O paciente consegue realizar de forma autônoma atividades diárias (comer, tomar banho, vestir-se)?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(3),
          label: 'Gestão e Remédios: O paciente consegue tomar suas medicações de forma independente e gerenciar finanças ou compras?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(4),
          label: 'Alterações Comportamentais: Apresenta episódios de agressividade, desorientação temporal/espacial, agitação noturna ou alucinações?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(5),
          label: 'Histórico Clínico e Riscos: Apresenta histórico de quedas frequentes, esquecimentos que geram riscos (ex. gás ligado) ou saídas sem rumo?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(6),
          label: 'Rede de Apoio e Cuidados: Quem é o cuidador principal do paciente e qual é a rotina atual de assistência familiar?',
          type: 'textarea',
          required: false
        }
      ]);
      addToast('Template de Idoso/Cuidador carregado! Você pode alterar ou adicionar perguntas livremente.', 'success');
    } else if (type === 'tcc') {
      setFormTitle('Anamnese e Formulação Cognitiva (TCC)');
      setFormDesc('Roteiro estruturado segundo a abordagem cognitivo-comportamental de Aaron e Judith Beck. Respondido pelo próprio paciente.');
      setFields([
        {
          id: generateId(1),
          label: 'Queixa Principal e Objetivos: Quais são os principais problemas que motivaram a busca por psicoterapia e o que deseja alcançar?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(2),
          label: 'Histórico da Queixa (HDA): Quando as principais queixas começaram e em quais contextos elas costumam se intensificar?',
          type: 'textarea',
          required: true
        },
        {
          id: generateId(3),
          label: 'Pensamentos Automáticos Recorrentes: Quais pensamentos negativos ou autocríticos costumam passar pela sua mente em momentos de sofrimento?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(4),
          label: 'Reações Emocionais e Fisiológicas: Quais emoções (ansiedade, tristeza, raiva) e sensações no corpo você mais experimenta nessas situações?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(5),
          label: 'Comportamentos e Estratégias Compensatórias: O que você costuma fazer para aliviar o sofrimento ou evitar as situações que geram mal-estar?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(6),
          label: 'Histórico Psiquiátrico e Terapêutico: Já realizou tratamento psiquiátrico ou psicoterapêutico anteriormente? Se sim, quais foram os resultados?',
          type: 'textarea',
          required: false
        },
        {
          id: generateId(7),
          label: 'Medicamentos Psicotrópicos: Faz uso de alguma medicação psiquiátrica atual? Se sim, qual o nome, dosagem e tempo de uso?',
          type: 'text',
          required: false
        }
      ]);
      addToast('Template de TCC carregado! Você pode alterar ou adicionar perguntas livremente.', 'success');
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
        <Portal>
          <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '850px', width: '90%', maxHeight: '90vh' }}>
              <div className="modal-header">
                <h3>Criador de Fichas e Formulários</h3>
                <button className="close-modal-btn" onClick={() => setIsCreatorModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              
              <div className="creator-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', flex: 1, overflow: 'hidden' }}>
                {/* Lado Esquerdo: Metadados e adicionar campos */}
                <div className="creator-left-panel" style={{ padding: '24px', overflowY: 'auto', borderRight: '1px solid var(--border-color)' }}>
                  <div className="template-quick-loaders" style={{ marginBottom: '16px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600 }}>
                      <Sparkles size={16} />
                      <span>Modelos Clínicos Clássicos</span>
                    </label>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                      Importe um roteiro clínico clássico para editar ou monte um modelo do zero.
                    </span>
                    <div className="quick-loader-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button type="button" className="btn-quick-loader" style={{ borderLeft: '4px solid var(--primary)' }} onClick={() => loadPredefinedTemplate('adulto')}>
                        <span>📝 Anamnese Geral Adulto (CFP)</span>
                      </button>
                      <button type="button" className="btn-quick-loader" onClick={() => loadPredefinedTemplate('tcc')}>
                        <span>🧠 Formulação Cognitiva (TCC)</span>
                      </button>
                      <button type="button" className="btn-quick-loader" onClick={() => loadPredefinedTemplate('infantil')}>
                        <span>👶 Infantil / Desenvolvimento (CFP)</span>
                      </button>
                      <button type="button" className="btn-quick-loader" onClick={() => loadPredefinedTemplate('idoso')}>
                        <span>🧓 Idoso / Cuidador (CFP)</span>
                      </button>
                    </div>
                  </div>

                  <hr style={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />

                  <div className="form-group">
                    <label className="form-label">Título do Modelo de Ficha</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Ex: Anamnese Geral Adulto, Ficha de Triagem..." 
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Descrição / Instruções do Modelo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Instruções de preenchimento ou foco do formulário..." 
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                    />
                  </div>

                  <hr style={{ margin: '8px 0', borderColor: 'var(--border-color)' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-main)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>Adicionar Pergunta Personalizada</span>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Pergunta / Rótulo do Campo</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Ex: Quais pensamentos negativos costumam passar pela sua mente?" 
                        value={tempLabel}
                        onChange={(e) => setTempLabel(e.target.value)}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Tipo de Resposta</label>
                      <select 
                        className="form-control" 
                        value={tempType} 
                        onChange={(e) => setTempType(e.target.value as any)}
                      >
                        <option value="text">Texto Curto</option>
                        <option value="textarea">Texto Longo</option>
                        <option value="select">Múltipla Escolha (Select)</option>
                        <option value="checkbox">Confirmação (Checkbox)</option>
                      </select>
                    </div>
                    {tempType === 'select' && (
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Opções (separadas por vírgula)</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Ex: Sim, Não, Às vezes" 
                          value={tempOptionsStr}
                          onChange={(e) => setTempOptionsStr(e.target.value)}
                        />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input 
                        type="checkbox" 
                        id="tempRequired"
                        checked={tempRequired} 
                        onChange={(e) => setTempRequired(e.target.checked)}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                      />
                      <label htmlFor="tempRequired" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>Pergunta Obrigatória</label>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={handleAddField} style={{ width: '100%' }}>
                      <PlusCircle size={16} />
                      Adicionar Pergunta
                    </button>
                  </div>
                </div>

                {/* Lado Direito: Preview das Perguntas */}
                <div className="creator-right-panel" style={{ padding: '24px', overflowY: 'auto', background: 'var(--bg-main)' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>Pré-visualização do Formulário</h4>
                    {formTitle && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                        {formTitle}
                      </p>
                    )}
                  </div>

                  {fields.length === 0 ? (
                    <div className="preview-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', color: 'var(--text-muted)', gap: '12px', textAlign: 'center' }}>
                      <HelpCircle size={32} style={{ color: 'var(--border-color-hover)' }} />
                      <p>Adicione perguntas usando o painel à esquerda para montar a estrutura do formulário.</p>
                    </div>
                  ) : (
                    <div className="preview-fields-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {fields.map((f, i) => (
                        <div key={f.id} className="preview-field-item" style={{ background: 'white', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                          <div className="preview-field-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Questão {i + 1} ({f.type}) {f.required && '*'}</span>
                            <button className="remove-field-btn" onClick={() => handleRemoveField(f.id)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px' }}>
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

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreatorModalOpen(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveTemplate} disabled={fields.length === 0 || !formTitle.trim()}>
                  Salvar Modelo de Formulário
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL: VISUALIZAR MODELO EXISTENTE */}
      {viewingTemplate && (
        <Portal>
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
        </Portal>
      )}
    </div>
  );
};

