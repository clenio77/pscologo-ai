import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { ysqQuestions, ysqMapping } from '../utils/ysqQuestions';
import { Heart, CheckCircle2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const QUESTIONS_PER_PAGE = 15;

export const YsqForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  const totalQuestions = ysqQuestions.length;
  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);

  // Inicialização e busca dos dados
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!token) {
        setErrorMsg('Token de acesso inválido.');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ysq_submissions')
          .select('*, patients(name)')
          .eq('id', token)
          .single();

        if (error || !data) {
          setErrorMsg('Não foi possível encontrar este questionário. Verifique o link.');
        } else if (data.status === 'completed') {
          setCompleted(true);
        } else {
          setResponses(data.responses || {});
          setCurrentPage(data.current_page || 1);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao carregar o questionário.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [token]);

  // Função para salvar progresso temporário
  const saveProgress = async (updatedResponses: Record<number, number>, page: number) => {
    if (!token) return;
    setSaving(true);
    try {
      await supabase
        .from('ysq_submissions')
        .update({
          responses: updatedResponses,
          current_page: page,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', token);
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAnswer = (questionIndex: number, score: number) => {
    const nextResponses = { ...responses, [questionIndex]: score };
    setResponses(nextResponses);
    saveProgress(nextResponses, currentPage);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      saveProgress(responses, nextPage);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      saveProgress(responses, prevPage);
      window.scrollTo(0, 0);
    }
  };

  // Algoritmo de cálculo de escores e finalização
  const handleFinalize = async () => {
    // Validação de preenchimento total
    const unanswered = [];
    for (let i = 0; i < totalQuestions; i++) {
      if (responses[i] === undefined) {
        unanswered.push(i + 1);
      }
    }

    if (unanswered.length > 0) {
      alert(`Por favor, responda a todas as perguntas antes de finalizar. Faltam ${unanswered.length} perguntas.`);
      // Encontra a página da primeira pergunta não respondida e pula para ela
      const firstUnansweredIndex = unanswered[0] - 1;
      const targetPage = Math.floor(firstUnansweredIndex / QUESTIONS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
      window.scrollTo(0, 0);
      return;
    }

    setSaving(true);
    try {
      // 1. Calcular médias e criticidade (notas 5 e 6) para cada um dos 18 esquemas
      const scoresPayload: Record<string, number> = {};
      
      Object.entries(ysqMapping).forEach(([esquema, indices]) => {
        let sum = 0;
        let criticalCount = 0;
        indices.forEach((index) => {
          const val = responses[index] || 1;
          sum += val;
          if (val === 5 || val === 6) {
            criticalCount++;
          }
        });
        const average = sum / indices.length;
        scoresPayload[`${esquema}_score`] = parseFloat(average.toFixed(2));
        scoresPayload[`${esquema}_critical_count`] = criticalCount;
      });

      // 2. Inserir os scores consolidados no Supabase
      const { error: scoresError } = await supabase
        .from('ysq_scores')
        .insert({
          submission_id: token,
          ...scoresPayload
        });

      if (scoresError) throw scoresError;

      // 3. Atualizar a submissão para concluída
      const { error: subError } = await supabase
        .from('ysq_submissions')
        .update({
          status: 'completed',
          responses,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', token);

      if (subError) throw subError;

      // 4. Solicitar interpretação do YSQ em segundo plano pela IA (Gemini)
      // Dispara a Edge Function silenciosamente
      try {
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            action: 'interpret-ysq',
            token
          })
        }).catch(err => console.warn('Erro ao disparar IA em background:', err));
      } catch (e) {
        console.warn('Falha no disparo da Edge Function:', e);
      }

      setCompleted(true);
    } catch (err) {
      console.error('Erro ao finalizar questionário:', err);
      alert('Ocorreu um erro ao salvar suas respostas. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4a7c59]" />
        <p className="mt-4 text-gray-600 font-medium">Carregando questionário...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erro no Acesso</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-lg transition-colors font-medium"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#eaf2eb] p-4 text-center">
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl max-w-lg border border-white/60">
          <CheckCircle2 className="w-16 h-16 text-[#4a7c59] mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#2b3a30] mb-3">Muito Obrigado!</h2>
          <p className="text-gray-600 mb-6">
            Suas respostas foram enviadas com segurança para seu terapeuta. As informações servirão de apoio para sua conceituação clínica e planejamento das próximas sessões.
          </p>
          <div className="p-4 bg-[#f4f8f5] rounded-xl border border-[#e2ede5] text-[#4a7c59] font-medium text-sm">
            Questionário de Esquemas de Young (YSQ-L3) preenchido.
          </div>
        </div>
      </div>
    );
  }

  // Paginação de perguntas
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const pageQuestions = ysqQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  const progressPercent = Math.round((Object.keys(responses).length / totalQuestions) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eaf2eb] to-[#f4f7f5] pb-12">
      {/* Header Fixo */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b z-10 py-4 px-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-[#4a7c59]" />
            <h1 className="font-bold text-[#2b3a30] text-lg">Agenda Clinical</h1>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-500 font-medium">Progresso Geral</span>
            <div className="flex items-center gap-2">
              <div className="w-24 md:w-32 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#4a7c59] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-[#4a7c59]">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </header>

      {/* Container Principal */}
      <main className="max-w-3xl mx-auto px-4 mt-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border">
          <div className="mb-6 border-b pb-4">
            <h2 className="text-xl font-extrabold text-[#2b3a30] mb-2">Questionário de Esquemas de Young (YSQ-L3)</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Responda de acordo com o que você **sente emocionalmente**, e não necessariamente no que você racionaliza ser verdade. 
              Avalie de **1** (Inteiramente falsa) a **6** (Descreve perfeitamente).
            </p>
          </div>

          {/* Lista de perguntas */}
          <div className="space-y-8 my-6">
            {pageQuestions.map((question, index) => {
              const questionIndex = startIndex + index;
              const currentAnswer = responses[questionIndex];

              return (
                <div key={questionIndex} className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <p className="text-gray-800 font-medium text-base mb-4 flex gap-2">
                    <span className="text-[#4a7c59] font-bold">{questionIndex + 1}.</span>
                    <span>{question}</span>
                  </p>
                  
                  {/* Escala Likert de 1 a 6 */}
                  <div className="grid grid-cols-6 gap-2 max-w-md">
                    {[1, 2, 3, 4, 5, 6].map((score) => (
                      <button
                        key={score}
                        type="button"
                        onClick={() => handleSelectAnswer(questionIndex, score)}
                        className={`py-3 rounded-lg border font-bold text-sm transition-all ${
                          currentAnswer === score
                            ? 'bg-[#4a7c59] text-white border-[#4a7c59] shadow-sm shadow-[#4a7c59]/40 scale-105'
                            : 'bg-white hover:bg-[#eaf2eb] text-gray-600 hover:text-[#4a7c59] border-gray-200'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between max-w-md px-1 mt-1 text-[10px] text-gray-400 font-medium">
                    <span>Falso</span>
                    <span>Verdadeiro</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-between border-t pt-6 mt-8">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage === 1 || saving}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg transition-colors font-medium text-sm"
            >
              <ChevronLeft className="w-4 h-4" /> Anterior
            </button>

            <span className="text-xs text-gray-500 font-medium">
              Página {currentPage} de {totalPages}
            </span>

            {currentPage === totalPages ? (
              <button
                type="button"
                onClick={handleFinalize}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-lg transition-colors font-bold text-sm shadow-md"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Finalizar e Enviar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNextPage}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
              >
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
export default YsqForm;
