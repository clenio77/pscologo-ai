import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Copy, Send, Calendar, Eye, ClipboardCheck, X } from 'lucide-react';

interface Submission {
  id: string;
  status: 'pending' | 'in_progress' | 'completed';
  current_page: number;
  completed_at: string | null;
  created_at: string;
}

interface YsqApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  onViewResults: (submissionId: string) => void;
}

export const YsqApplyModal: React.FC<YsqApplyModalProps> = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  patientPhone,
  onViewResults
}) => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  // Carrega histórico de aplicações
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ysq_submissions')
        .select('id, status, current_page, completed_at, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (err) {
      console.error('Erro ao buscar submissões do YSQ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      fetchSubmissions();
    }
  }, [isOpen, patientId]);

  // Cria um novo link de aplicação do YSQ
  const handleCreateSubmission = async () => {
    setCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');

      const { error } = await supabase
        .from('ysq_submissions')
        .insert({
          patient_id: patientId,
          professional_id: user.id,
          status: 'pending',
          current_page: 1
        })
        .select('id')
        .single();

      if (error) throw error;
      
      alert('Link do questionário YSQ-L3 gerado com sucesso!');
      fetchSubmissions();
    } catch (err) {
      console.error('Erro ao criar submissão YSQ:', err);
      alert('Não foi possível gerar a aplicação.');
    } finally {
      setCreating(false);
    }
  };

  const getLinkUrl = (id: string) => {
    return `${window.location.origin}/responder-ysq/${id}`;
  };

  const handleCopyLink = (id: string) => {
    const url = getLinkUrl(id);
    navigator.clipboard.writeText(url);
    alert('Link copiado para a área de transferência!');
  };

  const handleSendWhatsApp = (id: string) => {
    const url = getLinkUrl(id);
    const text = encodeURIComponent(
      `Olá, ${patientName}! Gostaria de te pedir para preencher o Questionário de Esquemas de Young (YSQ-L3). Ele servirá de apoio para nossa psicoterapia. Você pode responder aos poucos acessando este link seguro: ${url}`
    );
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${patientPhone ? patientPhone.replace(/\D/g, '') : ''}&text=${text}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'in_progress':
        return 'Em Andamento';
      default:
        return 'Pendente';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ maxWidth: '650px', width: '95%', display: 'flex', flexDirection: 'column', maxHeight: '85vh', background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
              <ClipboardCheck size={20} style={{ color: '#4a7c59' }} />
              Questionário de Esquemas de Young
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Gerenciamento do YSQ-L3 para **{patientName}**
            </p>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '60vh' }}>
          
          {/* Gerar Nova Aplicação */}
          <div style={{ background: 'linear-gradient(135deg, #f4fbf6 0%, #eefcf0 100%)', border: '1px solid #bbf7d0', padding: '18px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', boxShadow: '0 2px 8px rgba(74, 124, 89, 0.05)' }}>
            <div style={{ textAlign: 'left', flex: 1, minWidth: '200px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 'bold', color: '#14532d' }}>Aplicar Questionário</h4>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                Gere um link criptografado e de uso único para o paciente responder diretamente no celular ou computador.
              </p>
            </div>
            <button
              onClick={handleCreateSubmission}
              disabled={creating}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '0.85rem', fontWeight: 'bold', background: '#4a7c59', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(74, 124, 89, 0.2)' }}
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <ClipboardCheck size={16} />}
              Gerar Link do Teste
            </button>
          </div>

          {/* Histórico */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ margin: '8px 0 4px', fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
              Aplicações Realizadas
            </h4>
            
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px 0' }}>
                <Loader2 size={32} className="animate-spin" style={{ color: '#4a7c59' }} />
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>Carregando histórico do YSQ...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ padding: '32px', border: '2px dashed #e2e8f0', borderRadius: '12px', textAlign: 'center', background: '#f8fafc' }}>
                <ClipboardCheck size={32} style={{ color: '#cbd5e1', margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>Nenhum teste foi gerado para este paciente ainda.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {submissions.map((sub) => (
                  <div key={sub.id} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid #e2e8f0', borderRadius: '12px', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'transform 0.15s, box-shadow 0.15s' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
                      <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '8px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155' }}>
                          Gerado em {formatDate(sub.created_at)}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          {sub.completed_at ? `Concluído em ${formatDate(sub.completed_at)}` : `Progresso: Página ${sub.current_page}`}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '0.72rem', 
                        padding: '3px 8px', 
                        borderRadius: '999px',
                        fontWeight: 'bold',
                        border: '1px solid',
                        background: sub.status === 'completed' ? '#f0fdf4' : sub.status === 'in_progress' ? '#fef9c3' : '#f1f5f9',
                        color: sub.status === 'completed' ? '#166534' : sub.status === 'in_progress' ? '#854d0e' : '#475569',
                        borderColor: sub.status === 'completed' ? '#bbf7d0' : sub.status === 'in_progress' ? '#fef08a' : '#cbd5e1'
                      }}>
                        {getStatusLabel(sub.status)}
                      </span>

                      {sub.status === 'completed' ? (
                        <button
                          onClick={() => onViewResults(sub.id)}
                          className="btn btn-primary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', background: '#4a7c59', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          <Eye size={14} /> Ver Resultados
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleCopyLink(sub.id)}
                            className="btn"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', cursor: 'pointer' }}
                            title="Copiar Link"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(sub.id)}
                            className="btn"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#25d366', color: 'white', display: 'flex', alignItems: 'center', gap: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            <Send size={12} /> WhatsApp
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'end', background: '#f8fafc' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 16px', fontSize: '0.85rem', borderRadius: '6px', cursor: 'pointer', border: '1px solid #cbd5e1', background: 'white', color: '#475569' }}>
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YsqApplyModal;
