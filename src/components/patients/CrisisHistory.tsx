import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2, ShieldAlert, Calendar, Smile, AudioLines, Sparkles } from 'lucide-react';

interface CrisisCheckIn {
  id: string;
  mood_score: number;
  ideation_flag: boolean;
  has_plan: boolean;
  transcript: string | null;
  audio_url: string | null;
  ai_risk_assessment: string | null;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  created_at: string;
}

interface CrisisHistoryProps {
  patientId: string;
  patientName: string;
}

export const CrisisHistory: React.FC<CrisisHistoryProps> = ({ patientId }) => {
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<CrisisCheckIn[]>([]);

  useEffect(() => {
    if (!patientId) return;

    const fetchCrisisHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('patient_crisis_checkins')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Erro ao buscar histórico de crise:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCrisisHistory();
  }, [patientId]);

  const getRiskBadgeStyles = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600 text-white border-red-700';
      case 'high':
        return 'bg-orange-500 text-white border-orange-600';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskLabel = (level: string) => {
    switch (level) {
      case 'critical':
        return 'CRÍTICO';
      case 'high':
        return 'ALTO';
      case 'moderate':
        return 'MODERADO';
      default:
        return 'BAIXO';
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodEmoji = (score: number) => {
    const emojis = ['😢', '🙁', '😐', '🙂', '😊'];
    return emojis[score - 1] || '😐';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#4a7c59]" />
        <p className="text-sm text-gray-500 mt-2">Carregando histórico de monitoramento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título de Controle */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h4 className="font-extrabold text-[#2b3a30] text-base">Check-ins Diários de Crise</h4>
          <p className="text-xs text-gray-500">Histórico de humor, ideação e gravações de áudio analisadas por IA.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed">
          <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-600">Nenhum check-in de crise respondido ainda.</p>
          <p className="text-xs text-gray-400 mt-1">Envie o link de check-in diário para iniciar o monitoramento.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((checkin) => (
            <div
              key={checkin.id}
              className={`p-5 rounded-2xl border bg-white shadow-sm transition-all ${
                checkin.risk_level === 'critical' || checkin.risk_level === 'high'
                  ? 'border-red-200 bg-red-50/10'
                  : 'border-gray-200'
              }`}
            >
              {/* Topo do Check-in */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDateTime(checkin.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${getRiskBadgeStyles(checkin.risk_level)}`}>
                    Risco: {getRiskLabel(checkin.risk_level)}
                  </span>
                </div>
              </div>

              {/* Informações Clínicas Rápidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Humor */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <Smile className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Estado de Humor</span>
                    <span className="text-sm font-bold text-gray-700">
                      {getMoodEmoji(checkin.mood_score)} Pontuação {checkin.mood_score}/5
                    </span>
                  </div>
                </div>

                {/* Ideação Suicida */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <ShieldAlert className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Ideação Recente</span>
                    <span className={`text-sm font-bold ${checkin.ideation_flag ? 'text-red-600' : 'text-green-600'}`}>
                      {checkin.ideation_flag ? '⚠️ Sim (Identificada)' : '✅ Não'}
                    </span>
                  </div>
                </div>

                {/* Tem Plano Ativo */}
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border">
                  <ShieldAlert className="w-5 h-5 text-gray-400" />
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase">Plano Estruturado</span>
                    <span className={`text-sm font-bold ${checkin.has_plan ? 'text-red-700 font-extrabold animate-pulse' : 'text-green-600'}`}>
                      {checkin.has_plan ? '🚨 SIM (Risco de Tentativa)' : '✅ Não'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Player do Áudio de Desabafo */}
              {checkin.audio_url && (
                <div className="mb-4 bg-[#f4f7f5] p-3 rounded-xl border border-[#e2ede5]">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#4a7c59] mb-2">
                    <AudioLines className="w-4 h-4" /> <span>Depoimento em Áudio Gravado pelo Paciente:</span>
                  </div>
                  <audio controls src={checkin.audio_url} className="w-full h-8"></audio>
                </div>
              )}

              {/* Transcrição de Voz */}
              {checkin.transcript && (
                <div className="mb-4 bg-gray-50 p-3 rounded-xl border">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Transcrição do Desabafo:</span>
                  <p className="text-sm text-gray-700 italic">"{checkin.transcript}"</p>
                </div>
              )}

              {/* Análise de Sentimento da IA */}
              {checkin.ai_risk_assessment && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <span className="block text-[10px] font-bold text-blue-600 uppercase">Parecer de Triagem da IA (Gemini):</span>
                    <p className="text-xs text-blue-900 mt-0.5 leading-relaxed">{checkin.ai_risk_assessment}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default CrisisHistory;
