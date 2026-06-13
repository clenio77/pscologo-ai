import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { ysqLabels, ysqDomains } from '../../utils/ysqQuestions';

interface YsqResultsProps {
  isOpen: boolean;
  onClose: () => void;
  submissionId: string;
  patientName: string;
}

export const YsqResults: React.FC<YsqResultsProps> = ({ isOpen, onClose, submissionId, patientName }) => {
  const [loading, setLoading] = useState(true);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [scores, setScores] = useState<any>(null);
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);

  const fetchResults = async () => {
    setLoading(true);
    try {
      // 1. Busca scores
      const { data: scoreData, error: scoreError } = await supabase
        .from('ysq_scores')
        .select('*')
        .eq('submission_id', submissionId)
        .single();

      if (scoreError) throw scoreError;
      setScores(scoreData);

      // 2. Busca interpretação na submissão
      const { data: subData } = await supabase
        .from('ysq_submissions')
        .select('ai_interpretation')
        .eq('id', submissionId)
        .single();

      if (subData) {
        setAiInterpretation(subData.ai_interpretation);
      }
    } catch (err) {
      console.error('Erro ao buscar resultados do YSQ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && submissionId) {
      fetchResults();
    }
  }, [isOpen, submissionId]);

  const handleGenerateAiInterpretation = async () => {
    setGeneratingAi(true);
    try {
      // Chama a Edge Function gemini para interpretar os resultados do YSQ
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'interpret-ysq',
          token: submissionId
        })
      });

      if (!response.ok) throw new Error('Falha ao acionar a IA.');

      const result = await response.json();
      // O Gemini salva automaticamente na submissão, mas retorna também
      // Se não retornar diretamente, fazemos o fetch do banco novamente
      setTimeout(async () => {
        const { data } = await supabase
          .from('ysq_submissions')
          .select('ai_interpretation')
          .eq('id', submissionId)
          .single();
        if (data && data.ai_interpretation) {
          setAiInterpretation(data.ai_interpretation);
        } else {
          // Fallback se demorar a trigger
          setAiInterpretation(result.text || 'Análise gerada com sucesso! Atualize a tela para ver.');
        }
        setGeneratingAi(false);
      }, 3000);

    } catch (err) {
      console.error(err);
      alert('Erro ao acionar a inteligência artificial para interpretação.');
      setGeneratingAi(false);
    }
  };

  if (!isOpen) return null;

  // Lista ordenada de siglas para o Gráfico Radar
  const eids = ['pe', 'ab', 'da', 'is', 'dv', 'fr', 'de', 'vu', 'em', 'sb', 'as', 'ie', 'pi', 'me', 'ai', 'ba', 'np', 'pu'];

  // Função para renderizar o Gráfico Radar (Spider Chart) nativo em SVG
  const renderRadarChart = () => {
    if (!scores) return null;

    const width = 320;
    const height = 320;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = 110;
    const numPoints = eids.length;

    // 1. Gera caminhos dos círculos concêntricos de escala (1 a 6)
    const scaleCircles = [1, 2, 3, 4, 5, 6].map((scale) => {
      const r = (scale / 6) * maxRadius;
      return (
        <circle
          key={scale}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="1"
          strokeDasharray={scale === 6 ? '0' : '3,3'}
        />
      );
    });

    // 2. Gera os raios e rótulos de texto
    const spokes: React.ReactNode[] = [];
    const polygonPoints: string[] = [];

    eids.forEach((eid, idx) => {
      const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
      const score = parseFloat(scores[`${eid}_score`] || 1);

      // Coordenadas da borda externa
      const xOuter = cx + maxRadius * Math.cos(angle);
      const yOuter = cy + maxRadius * Math.sin(angle);

      // Coordenadas do ponto do escore do paciente
      const rVal = (score / 6) * maxRadius;
      const xVal = cx + rVal * Math.cos(angle);
      const yVal = cy + rVal * Math.sin(angle);
      polygonPoints.push(`${xVal},${yVal}`);

      // Coordenadas de posicionamento do rótulo (afastado da borda)
      const rLabel = maxRadius + 15;
      const xLabel = cx + rLabel * Math.cos(angle);
      const yLabel = cy + rLabel * Math.sin(angle);

      spokes.push(
        <line
          key={`line-${eid}`}
          x1={cx}
          y1={cy}
          x2={xOuter}
          y2={yOuter}
          stroke="#e5e7eb"
          strokeWidth="1"
        />
      );

      // Selo de cor para pontuações críticas no rótulo
      const isCritical = score >= 4.0;

      spokes.push(
        <text
          key={`text-${eid}`}
          x={xLabel}
          y={yLabel}
          textAnchor="middle"
          dominantBaseline="middle"
          className={`text-[9px] font-bold ${isCritical ? 'fill-red-600 font-extrabold' : 'fill-gray-500'}`}
        >
          {eid.toUpperCase()}
        </text>
      );
    });

    return (
      <svg width={width} height={height} className="mx-auto select-none">
        {/* Círculos concêntricos */}
        {scaleCircles}

        {/* Linhas dos raios */}
        {spokes}

        {/* Polígono preenchido do paciente */}
        {polygonPoints.length > 0 && (
          <polygon
            points={polygonPoints.join(' ')}
            fill="rgba(74, 124, 89, 0.25)"
            stroke="#4a7c59"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}

        {/* Marcadores de escore por eixo */}
        {eids.map((eid, idx) => {
          const angle = (idx * 2 * Math.PI) / numPoints - Math.PI / 2;
          const score = parseFloat(scores[`${eid}_score`] || 1);
          const rVal = (score / 6) * maxRadius;
          const xVal = cx + rVal * Math.cos(angle);
          const yVal = cy + rVal * Math.sin(angle);
          const isCritical = score >= 4.0;

          return (
            <circle
              key={`dot-${eid}`}
              cx={xVal}
              cy={yVal}
              r="4.5"
              fill={isCritical ? '#dc2626' : '#4a7c59'}
              stroke="white"
              strokeWidth="1.5"
            >
              <title>{`${ysqLabels[eid]}: ${score}`}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-[#f4f7f5] rounded-t-2xl">
          <div>
            <h3 className="font-extrabold text-[#2b3a30] text-lg">Resultados Clinicos — YSQ-L3</h3>
            <p className="text-xs text-gray-500 mt-1">Escores de Esquemas e Formulação de Caso para **{patientName}**</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">×</button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin text-[#4a7c59]" />
              <p className="text-sm text-gray-500 mt-2">Buscando escores do questionário...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Coluna 1: Gráfico Radar e Escores Rápidos */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#2b3a30] mb-4 text-center border-b pb-2">
                    Teia de Ativação dos 18 Esquemas
                  </h4>
                  {renderRadarChart()}
                </div>

                <div className="mt-4 p-3 bg-red-50/50 border border-red-100 rounded-xl flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-red-800 block">Identificação de Alertas</span>
                    <span className="text-red-700">
                      Siglas em vermelho representam escores clínicos severos ($\ge 4.0$).
                    </span>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Detalhes por Domínio de Esquemas e IA */}
              <div className="lg:col-span-7 space-y-6">
                {/* Visualizador de Escores e Domínios */}
                <div className="bg-white p-5 rounded-2xl border">
                  <h4 className="font-bold text-sm text-[#2b3a30] mb-4 border-b pb-2">Escores Consolidados por Domínio</h4>
                  <div className="space-y-4">
                    {Object.entries(ysqDomains).map(([domainKey, domain]) => (
                      <div key={domainKey} className="space-y-2">
                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {domain.label}
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {domain.EIDs.map((eid) => {
                            const val = scores ? parseFloat(scores[`${eid}_score`] || 1) : 1;
                            const isCritical = val >= 4.0;
                            return (
                              <div
                                key={eid}
                                className={`p-2 rounded-lg border text-xs flex justify-between items-center ${
                                  isCritical ? 'bg-red-50 border-red-200 text-red-700 font-extrabold' : 'bg-white text-gray-700'
                                }`}
                              >
                                <span title={ysqLabels[eid]}>{eid.toUpperCase()}</span>
                                <span className="font-mono text-xs">{val.toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relatório Analítico do Gemini */}
                <div className="bg-white p-5 rounded-2xl border">
                  <div className="flex items-center justify-between border-b pb-3 mb-4">
                    <div className="flex items-center gap-1.5 text-[#4a7c59]">
                      <Sparkles className="w-5 h-5 fill-current" />
                      <h4 className="font-extrabold text-sm text-[#2b3a30]">Interpretação Clínica com IA</h4>
                    </div>
                    
                    <button
                      onClick={handleGenerateAiInterpretation}
                      disabled={generatingAi}
                      className="text-xs text-[#4a7c59] hover:text-[#3d664a] border border-[#4a7c59]/20 hover:bg-[#4a7c59]/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-semibold"
                    >
                      {generatingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      Regenerar Relatório
                    </button>
                  </div>

                  {generatingAi ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-[#4a7c59]" />
                      <p className="text-xs text-gray-500 mt-2">O Gemini está ouvindo seus dados para estruturar o caso...</p>
                    </div>
                  ) : aiInterpretation ? (
                    <div className="text-xs text-gray-700 leading-relaxed space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {aiInterpretation.split('\n').map((line, idx) => {
                        if (line.startsWith('#')) {
                          return <h5 key={idx} className="font-extrabold text-gray-800 text-sm mt-3 mb-1">{line.replace(/#+\s*/, '')}</h5>;
                        }
                        if (line.startsWith('*') || line.startsWith('-')) {
                          return <li key={idx} className="list-disc ml-4 mt-0.5">{line.replace(/^[*-\s]+/, '')}</li>;
                        }
                        return <p key={idx} className="mb-2 whitespace-pre-wrap">{line}</p>;
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-4">Ainda não há conceituação gerada pela IA para esta submissão.</p>
                      <button
                        onClick={handleGenerateAiInterpretation}
                        className="px-4 py-2 bg-[#4a7c59] hover:bg-[#3d664a] text-white text-xs font-bold rounded-lg shadow-sm"
                      >
                        Gerar Análise com Gemini
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-[#f9faf9] rounded-b-2xl flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50 text-gray-600"
          >
            Fechar Resultados
          </button>
        </div>
      </div>
    </div>
  );
};
export default YsqResults;
