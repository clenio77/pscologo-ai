import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { ysqQuestions, ysqMapping } from '../utils/ysqQuestions';
import { Heart, CheckCircle2, ChevronLeft, ChevronRight, Loader2, CloudLightning, Check } from 'lucide-react';

const QUESTIONS_PER_PAGE = 15;

const lickersDesc = [
  { val: 1, text: 'Inteiramente falsa' },
  { val: 2, text: 'Em grande parte falsa' },
  { val: 3, text: 'Levemente mais verdadeira que falsa' },
  { val: 4, text: 'Moderadamente verdadeira' },
  { val: 5, text: 'Em grande parte verdadeira' },
  { val: 6, text: 'Descreve perfeitamente' }
];

export const YsqForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<number, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
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
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('ysq_submissions')
        .update({
          responses: updatedResponses,
          current_page: page,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', token);

      if (error) throw error;
      setSaveStatus('saved');
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
      setSaveStatus('error');
    }
  };

  const handleSelectAnswer = (questionIndex: number, score: number) => {
    // Atualização imediata do estado para resposta visual instantânea no clique
    const nextResponses = { ...responses, [questionIndex]: score };
    setResponses(nextResponses);
    saveProgress(nextResponses, currentPage);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      saveProgress(responses, nextPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      saveProgress(responses, prevPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Algoritmo de cálculo de escores e finalização
  const handleFinalize = async () => {
    const unanswered = [];
    for (let i = 0; i < totalQuestions; i++) {
      if (responses[i] === undefined) {
        unanswered.push(i + 1);
      }
    }

    if (unanswered.length > 0) {
      alert(`Por favor, responda a todas as perguntas antes de finalizar. Faltam ${unanswered.length} perguntas.`);
      const firstUnansweredIndex = unanswered[0] - 1;
      const targetPage = Math.floor(firstUnansweredIndex / QUESTIONS_PER_PAGE) + 1;
      setCurrentPage(targetPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setSaveStatus('saving');
    try {
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

      const { error: scoresError } = await supabase
        .from('ysq_scores')
        .insert({
          submission_id: token,
          ...scoresPayload
        });

      if (scoresError) throw scoresError;

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

      // Dispara IA em background
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
        }).catch(err => console.warn(err));
      } catch (e) {
        console.warn(e);
      }

      setSaveStatus('saved');
      setCompleted(true);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
      alert('Erro ao finalizar o questionário. Verifique sua conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <Loader2 size={40} className="animate-spin" style={{ color: '#4a7c59' }} />
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>Carregando questionário de esquemas...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', padding: '16px' }}>
        <div style={{ background: 'white', padding: '32px', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '400px', width: '100%', textAlign: 'center', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>Link Indisponível</h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.5 }}>{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            style={{ width: '100%', padding: '10px 16px', background: '#4a7c59', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.88rem' }}
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#eaf2eb', padding: '16px' }}>
        <div style={{ background: 'white', padding: '40px 32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.6)', maxWidth: '480px', width: '100%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)' }}>
          <div style={{ width: '64px', height: '64px', background: '#eaf2eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={36} style={{ color: '#4a7c59' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2b3a30', marginBottom: '12px' }}>Respostas Enviadas!</h2>
          <p style={{ color: '#5e6f64', fontSize: '0.92rem', marginBottom: '24px', lineHeight: 1.6 }}>
            Obrigado pelo seu preenchimento. Seus escores foram consolidados e enviados com segurança para a conceituação clínica do seu terapeuta.
          </p>
          <div style={{ padding: '12px 16px', background: '#f4f8f5', borderRadius: '12px', border: '1px solid #e2ede5', color: '#4a7c59', fontSize: '0.82rem', fontWeight: 'bold' }}>
            Inventário YSQ-L3 concluído com sucesso.
          </div>
        </div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const pageQuestions = ysqQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  const progressPercent = Math.round((Object.keys(responses).length / totalQuestions) * 100);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f1f5f2 0%, #f8faf9 100%)', paddingBottom: '48px', fontFamily: 'inherit' }}>
      
      {/* 🥞 HEADER FLUTUANTE FIXO COM PROGRESSO (GLASSMORPHISM) */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(74, 124, 89, 0.12)',
        padding: '12px 20px',
        boxShadow: '0 4px 20px rgba(43, 58, 48, 0.04)'
      }}>
        <div style={{ maxWidth: '750px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '32px', height: '32px', background: '#4a7c59', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
              <Heart size={16} fill="white" />
            </div>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2b3a30', display: 'block', textAlign: 'left' }}>Agenda Clinical</span>
              <span style={{ fontSize: '0.65rem', color: '#5e6f64', display: 'block', textAlign: 'left' }}>Formulário do Paciente</span>
            </div>
          </div>

          {/* Salvamento Status e Porcentagem */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            
            {/* Status do Salvamento */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', color: '#64748b' }}>
              {saveStatus === 'saving' && (
                <>
                  <Loader2 size={12} className="animate-spin" style={{ color: '#4a7c59' }} />
                  <span>Salvando progresso...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <Check size={12} style={{ color: '#10b981' }} />
                  <span style={{ color: '#10b981', fontWeight: 600 }}>Alterações salvas</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <CloudLightning size={12} style={{ color: '#ef4444' }} />
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>Erro de conexão</span>
                </>
              )}
            </div>

            {/* Contador de Porcentagem */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '100px', height: '8px', background: '#cbd5e1', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #4a7c59 0%, #689f78 100%)', borderRadius: '999px', transition: 'width 0.3s ease-out' }}></div>
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#4a7c59', minWidth: '35px', textAlign: 'right' }}>
                {progressPercent}%
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* 📚 CORPO DO FORMULÁRIO */}
      <main style={{ maxWidth: '750px', margin: '32px auto 0', padding: '0 16px' }}>
        
        {/* Intro Card */}
        <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '16px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.02)', textAlign: 'left' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2b3a30', margin: '0 0 8px' }}>
            Questionário de Esquemas de Young (YSQ-L3)
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
            Por favor, responda a cada pergunta avaliando o quanto a frase descreve o que você **sente na maior parte do tempo**. 
            Tente não racionalizar e responda com base no seu sentimento íntimo.
            Utilize a escala de **1** (Inteiramente Falso) a **6** (Descreve Perfeitamente).
          </p>
        </div>

        {/* Lista de Perguntas da Página */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {pageQuestions.map((question, index) => {
            const questionIndex = startIndex + index;
            const currentAnswer = responses[questionIndex];

            return (
              <div 
                key={questionIndex} 
                style={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '16px', 
                  padding: '24px', 
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.01)',
                  transition: 'border-color 0.2s',
                  textAlign: 'left'
                }}
              >
                {/* Texto da Pergunta */}
                <p style={{ margin: '0 0 20px', fontSize: '0.98rem', fontWeight: 700, color: '#1e293b', display: 'flex', gap: '8px', lineHeight: 1.5 }}>
                  <span style={{ color: '#4a7c59', fontWeight: 800 }}>{questionIndex + 1}.</span>
                  <span>{question}</span>
                </p>

                {/* Opções de Resposta (1 a 6) Dispostas Horizontalmente */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '480px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '6px', width: '100%' }}>
                    {[1, 2, 3, 4, 5, 6].map((score) => {
                      const isSelected = currentAnswer === score;
                      return (
                        <button
                          key={score}
                          type="button"
                          onClick={() => handleSelectAnswer(questionIndex, score)}
                          style={{
                            flex: 1,
                            height: '42px',
                            borderRadius: '10px',
                            border: '1px solid',
                            borderColor: isSelected ? '#4a7c59' : '#cbd5e1',
                            background: isSelected ? '#4a7c59' : 'white',
                            color: isSelected ? 'white' : '#475569',
                            fontWeight: 'bold',
                            fontSize: '0.92rem',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            boxShadow: isSelected ? '0 4px 10px rgba(74, 124, 89, 0.25)' : 'none',
                            transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                            outline: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Legenda Didática das 6 Opções com Realce de Seleção */}
                  <div style={{
                    marginTop: '14px',
                    padding: '12px',
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    borderRadius: '10px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '8px 12px'
                  }}>
                    {lickersDesc.map((item) => {
                      const isItemChosen = currentAnswer === item.val;
                      return (
                        <div 
                          key={item.val} 
                          style={{ 
                            fontSize: '0.74rem', 
                            color: isItemChosen ? '#1b4328' : '#64748b', 
                            fontWeight: isItemChosen ? 'bold' : 'normal',
                            transition: 'color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span style={{ 
                            width: '16px', 
                            height: '16px', 
                            borderRadius: '4px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontSize: '0.68rem',
                            fontWeight: 'bold',
                            background: isItemChosen ? '#4a7c59' : '#cbd5e1',
                            color: isItemChosen ? 'white' : '#64748b',
                            transition: 'all 0.2s'
                          }}>
                            {item.val}
                          </span>
                          <span>{item.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

        {/* BOTOES DE NAVEGAÇÃO DE PÁGINA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #cbd5e1' }}>
          
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage === 1 || saving}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '10px 18px', 
              background: 'white', 
              border: '1px solid #cbd5e1', 
              borderRadius: '8px', 
              color: '#475569', 
              fontWeight: 'bold', 
              fontSize: '0.82rem', 
              cursor: 'pointer',
              opacity: currentPage === 1 ? 0.5 : 1,
              transition: 'background 0.2s'
            }}
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>
            Página {currentPage} de {totalPages}
          </span>

          {currentPage === totalPages ? (
            <button
              type="button"
              onClick={handleFinalize}
              disabled={saving}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '10px 22px', 
                background: '#4a7c59', 
                border: 'none', 
                borderRadius: '8px', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: '0.82rem', 
                cursor: 'pointer',
                transition: 'background 0.2s',
                boxShadow: '0 4px 10px rgba(74, 124, 89, 0.2)'
              }}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : 'Finalizar e Enviar'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNextPage}
              disabled={saving}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '10px 18px', 
                background: 'white', 
                border: '1px solid #cbd5e1', 
                borderRadius: '8px', 
                color: '#475569', 
                fontWeight: 'bold', 
                fontSize: '0.82rem', 
                cursor: 'pointer',
                transition: 'background 0.2s'
              }}
            >
              Próximo <ChevronRight size={16} />
            </button>
          )}

        </div>

      </main>

    </div>
  );
};

export default YsqForm;
