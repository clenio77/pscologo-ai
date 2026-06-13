import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../services/supabaseClient';
import { Loader2, Sparkles, RefreshCw, AlertCircle, Eye, X } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'scores' | 'ai'>('scores');

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
      setActiveTab('scores');
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

    const width = 300;
    const height = 300;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = 100;
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
          stroke="#e2e8f0"
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
      const rLabel = maxRadius + 14;
      const xLabel = cx + rLabel * Math.cos(angle);
      const yLabel = cy + rLabel * Math.sin(angle);

      spokes.push(
        <line
          key={`line-${eid}`}
          x1={cx}
          y1={cy}
          x2={xOuter}
          y2={yOuter}
          stroke="#f1f5f9"
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
          style={{
            fontSize: '8px',
            fontWeight: 'bold',
            fill: isCritical ? '#dc2626' : '#64748b'
          }}
        >
          {eid.toUpperCase()}
        </text>
      );
    });

    return (
      <svg width={width} height={height} style={{ margin: '0 auto', display: 'block', userSelect: 'none' }}>
        {/* Círculos concêntricos */}
        {scaleCircles}

        {/* Linhas dos raios */}
        {spokes}

        {/* Polígono preenchido do paciente */}
        {polygonPoints.length > 0 && (
          <polygon
            points={polygonPoints.join(' ')}
            fill="rgba(74, 124, 89, 0.22)"
            stroke="#4a7c59"
            strokeWidth="2"
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
              r="3.5"
              fill={isCritical ? '#dc2626' : '#4a7c59'}
              stroke="white"
              strokeWidth="1"
            >
              <title>{`${ysqLabels[eid]}: ${score}`}</title>
            </circle>
          );
        })}
      </svg>
    );
  };

  return createPortal(
    <div className="modal-overlay" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-content" style={{ maxWidth: '850px', width: '95%', display: 'flex', flexDirection: 'column', maxHeight: '90vh', background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid #f1f5f9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 800, color: '#1e293b' }}>
              <Eye size={20} style={{ color: '#4a7c59' }} />
              Resultados Clínicos — YSQ-L3
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Esquemas Iniciais Desadaptativos de **{patientName}**
            </p>
          </div>
          <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '65vh', background: '#f8fafc' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
              <Loader2 size={36} className="animate-spin" style={{ color: '#4a7c59' }} />
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '8px' }}>Carregando pontuações...</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Coluna 1: Radar Chart */}
              <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    Perfil Esquemático (Teia de 18 Esquemas)
                  </h4>
                  {renderRadarChart()}
                </div>

                <div style={{ display: 'flex', gap: '8px', background: '#fef2f2', border: '1px solid #fee2e2', padding: '12px', borderRadius: '8px', marginTop: '16px', textAlign: 'left' }}>
                  <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.75rem', color: '#991b1b' }}>
                    <span style={{ fontWeight: 'bold', display: 'block' }}>Esquemas em Alerta</span>
                    Siglas destacadas em vermelho indicam ativação clínica alta ou severa (média aritmética $\ge 4.0$).
                  </div>
                </div>
              </div>

              {/* Coluna 2: Lista e IA em Abas para melhor alinhamento visual */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Seletor de Abas */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '8px', paddingBottom: '2px' }}>
                  <button
                    onClick={() => setActiveTab('scores')}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'scores' ? '2px solid #4a7c59' : '2px solid transparent',
                      color: activeTab === 'scores' ? '#4a7c59' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    Pontuações por Domínio
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    style={{
                      padding: '8px 16px',
                      background: 'none',
                      border: 'none',
                      borderBottom: activeTab === 'ai' ? '2px solid #4a7c59' : '2px solid transparent',
                      color: activeTab === 'ai' ? '#4a7c59' : '#64748b',
                      fontWeight: 'bold',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}
                  >
                    <Sparkles size={14} style={{ color: activeTab === 'ai' ? '#4a7c59' : '#94a3b8' }} />
                    Formulação de Caso (IA)
                    {aiInterpretation && (
                      <span style={{
                        position: 'absolute',
                        top: '4px',
                        right: '0px',
                        width: '6px',
                        height: '6px',
                        background: '#10b981',
                        borderRadius: '50%'
                      }} />
                    )}
                  </button>
                </div>

                {/* Conteúdo da Aba Ativa */}
                {activeTab === 'scores' ? (
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', textAlign: 'left', overflowY: 'auto', maxHeight: '420px' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                      Pontuações por Domínio
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {Object.entries(ysqDomains).map(([domainKey, domain]) => (
                        <div key={domainKey} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {domain.label}
                          </span>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '6px' }}>
                            {domain.EIDs.map((eid) => {
                              const val = scores ? parseFloat(scores[`${eid}_score`] || 1) : 1;
                              const isCritical = val >= 4.0;
                              return (
                                <div
                                  key={eid}
                                  style={{
                                    padding: '6px 10px',
                                    borderRadius: '6px',
                                    border: '1px solid',
                                    fontSize: '0.78rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: isCritical ? '#fef2f2' : '#f8fafc',
                                    borderColor: isCritical ? '#fca5a5' : '#e2e8f0',
                                    color: isCritical ? '#991b1b' : '#334155',
                                    fontWeight: isCritical ? 'bold' : 'normal'
                                  }}
                                >
                                  <span title={ysqLabels[eid]}>{eid.toUpperCase()}</span>
                                  <span style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{val.toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', textAlign: 'left', overflowY: 'auto', maxHeight: '420px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px', marginBottom: '12px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} style={{ color: '#4a7c59' }} />
                        Formulação de Caso (IA)
                      </h4>
                      <button
                        onClick={handleGenerateAiInterpretation}
                        disabled={generatingAi}
                        className="btn"
                        style={{ fontSize: '0.7rem', padding: '4px 8px', border: '1px solid #4a7c59', background: 'white', color: '#4a7c59', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}
                      >
                        {generatingAi ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                        Regenerar
                      </button>
                    </div>

                    {generatingAi ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0' }}>
                        <Loader2 size={24} className="animate-spin" style={{ color: '#4a7c59' }} />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '6px' }}>O Gemini está estruturando o caso clínico...</p>
                      </div>
                    ) : aiInterpretation ? (
                      <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.5 }}>
                        {aiInterpretation.split('\n').map((line, idx) => {
                          if (line.startsWith('#')) {
                            return <h5 key={idx} style={{ margin: '12px 0 4px', fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b' }}>{line.replace(/#+\s*/, '')}</h5>;
                          }
                          if (line.startsWith('*') || line.startsWith('-')) {
                            return <li key={idx} style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc' }}>{line.replace(/^[*-\s]+/, '')}</li>;
                          }
                          return <p key={idx} style={{ margin: '0 0 8px' }}>{line}</p>;
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 12px' }}>Ainda não há conceituação gerada pela IA.</p>
                        <button
                          onClick={handleGenerateAiInterpretation}
                          style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#4a7c59', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          Gerar com Gemini
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
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

export default YsqResults;
