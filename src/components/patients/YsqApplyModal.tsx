import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Copy, Send, Calendar, Eye, ClipboardCheck } from 'lucide-react';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-[#f4f7f5] rounded-t-2xl">
          <div>
            <h3 className="font-extrabold text-[#2b3a30] text-lg">Questionário de Esquemas de Young (YSQ-L3)</h3>
            <p className="text-xs text-gray-500 mt-1">Aplicação e monitoramento de testes para **{patientName}**</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Botão de gerar nova aplicação */}
          <div className="bg-[#fdfefd] p-4 rounded-xl border border-[#4a7c59]/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <h4 className="font-bold text-sm text-[#2b3a30]">Gerar Nova Aplicação</h4>
              <p className="text-xs text-gray-500">Cria um link criptografado e exclusivo para o paciente responder.</p>
            </div>
            <button
              onClick={handleCreateSubmission}
              disabled={creating}
              className="px-5 py-2.5 bg-[#4a7c59] hover:bg-[#3d664a] disabled:opacity-50 text-white rounded-lg font-bold text-sm flex items-center gap-1.5 shadow-sm transition-colors w-full md:w-auto justify-center"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
              Gerar Link do Teste
            </button>
          </div>

          {/* Histórico */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Aplicações Realizadas</h4>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#4a7c59]" />
                <p className="text-xs text-gray-500 mt-2">Buscando histórico...</p>
              </div>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhum teste gerado ainda.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <div key={sub.id} className="p-4 rounded-xl border bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-gray-700">Criado em: {formatDate(sub.created_at)}</span>
                        <span className="text-xs text-gray-400">
                          {sub.completed_at ? `Concluído em ${formatDate(sub.completed_at)}` : `Página atual: ${sub.current_page}`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(sub.status)}`}>
                        {getStatusLabel(sub.status)}
                      </span>

                      {sub.status === 'completed' ? (
                        <button
                          onClick={() => onViewResults(sub.id)}
                          className="px-3 py-1.5 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver Resultados
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleCopyLink(sub.id)}
                            className="p-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-lg"
                            title="Copiar Link"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSendWhatsApp(sub.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Send className="w-3 h-3" /> WhatsApp
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-[#f9faf9] rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
export default YsqApplyModal;
