import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle } from 'lucide-react';
import type { Patient, Evolution } from '../../services/api';
import { generateSentimentAnalysis } from '../../services/aiService';
import type { SessionSentiment, EmotionScores } from '../../services/aiService';

interface SentimentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  evolutions: Evolution[];
}

const EMOTION_LABELS: Record<keyof EmotionScores, { label: string; color: string; emoji: string }> = {
  ansiedade: { label: 'Ansiedade', color: '#f59e0b', emoji: '😰' },
  tristeza: { label: 'Tristeza', color: '#6366f1', emoji: '😢' },
  raiva: { label: 'Raiva', color: '#ef4444', emoji: '😠' },
  medo: { label: 'Medo', color: '#8b5cf6', emoji: '😨' },
  alegria: { label: 'Alegria', color: '#22c55e', emoji: '😊' },
  esperanca: { label: 'Esperança', color: '#06b6d4', emoji: '🌟' },
  culpa: { label: 'Culpa', color: '#f97316', emoji: '😔' },
  autoestima: { label: 'Autoestima', color: '#ec4899', emoji: '💪' },
};

const EMOTION_KEYS = Object.keys(EMOTION_LABELS) as (keyof EmotionScores)[];

// SVG Radar Chart Component
const RadarChart: React.FC<{ emotions: EmotionScores; size?: number }> = ({ emotions, size = 280 }) => {
  const center = size / 2;
  const maxRadius = size / 2 - 40;
  const levels = 5;
  const angleStep = (2 * Math.PI) / EMOTION_KEYS.length;

  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (value / 10) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  // Create polygon points for the data
  const dataPoints = EMOTION_KEYS.map((key, i) => getPoint(i, emotions[key]));
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid circles */}
      {Array.from({ length: levels }).map((_, i) => {
        const r = ((i + 1) / levels) * maxRadius;
        const gridPoints = EMOTION_KEYS.map((_, j) => {
          const angle = j * angleStep - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        }).join(' ');
        return (
          <polygon
            key={i}
            points={gridPoints}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {EMOTION_KEYS.map((_, i) => {
        const endPoint = getPoint(i, 10);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={endPoint.x}
            y2={endPoint.y}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        );
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints}
        fill="rgba(108, 154, 117, 0.25)"
        stroke="#6c9a75"
        strokeWidth="2.5"
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#6c9a75" stroke="white" strokeWidth="2" />
      ))}

      {/* Labels */}
      {EMOTION_KEYS.map((key, i) => {
        const labelPoint = getPoint(i, 12.5);
        const meta = EMOTION_LABELS[key];
        return (
          <text
            key={key}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
          >
            {meta.emoji} {meta.label}
          </text>
        );
      })}
    </svg>
  );
};

// Bar for emotion value
const EmotionBar: React.FC<{ emotionKey: keyof EmotionScores; value: number }> = ({ emotionKey, value }) => {
  const meta = EMOTION_LABELS[emotionKey];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
      <span style={{ width: '100px', fontWeight: 600, color: '#334155' }}>{meta.emoji} {meta.label}</span>
      <div style={{ flex: 1, height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{
          width: `${value * 10}%`,
          height: '100%',
          backgroundColor: meta.color,
          borderRadius: '5px',
          transition: 'width 0.6s ease'
        }} />
      </div>
      <span style={{ width: '30px', textAlign: 'right', fontWeight: 700, color: meta.color }}>{value}</span>
    </div>
  );
};

// Timeline chart (horizontal bars for each session)
const TimelineChart: React.FC<{ sentiments: SessionSentiment[] }> = ({ sentiments }) => {
  if (sentiments.length === 0) return null;

  const sorted = [...sentiments].sort((a, b) => a.session_date.localeCompare(b.session_date));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {sorted.map((s, idx) => {
        const dominantMeta = EMOTION_LABELS[s.dominant_emotion as keyof EmotionScores];
        return (
          <div key={idx} style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                  Sessão {idx + 1} — {new Date(s.session_date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748b' }}>{s.summary}</p>
              </div>
              {dominantMeta && (
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  backgroundColor: `${dominantMeta.color}18`,
                  color: dominantMeta.color,
                  border: `1px solid ${dominantMeta.color}40`,
                  whiteSpace: 'nowrap'
                }}>
                  {dominantMeta.emoji} {dominantMeta.label}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {EMOTION_KEYS.map(key => (
                <EmotionBar key={key} emotionKey={key} value={s.emotions[key] || 0} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const SentimentModal: React.FC<SentimentModalProps> = ({
  isOpen,
  onClose,
  patient,
  evolutions
}) => {
  const [sentiments, setSentiments] = useState<SessionSentiment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'radar' | 'timeline'>('radar');
  const [selectedSessionIdx, setSelectedSessionIdx] = useState(0);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateSentimentAnalysis(patient, evolutions);
      setSentiments(results);
      setSelectedSessionIdx(results.length - 1); // Mostra a sessão mais recente
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar análise de sentimento.');
    } finally {
      setIsGenerating(false);
    }
  };

  const currentSentiment = sentiments[selectedSessionIdx];

  // Average emotions for overall radar
  const averageEmotions: EmotionScores | null = sentiments.length > 0
    ? EMOTION_KEYS.reduce((acc, key) => {
        acc[key] = Math.round(sentiments.reduce((sum, s) => sum + (s.emotions[key] || 0), 0) / sentiments.length * 10) / 10;
        return acc;
      }, {} as EmotionScores)
    : null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="modal-header">
          <h2>Análise de Sentimento</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Aviso CFP */}
          <div style={{ background: '#f8f5ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', fontSize: '0.88rem', color: '#4c1d95', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Atenção (CFP):</strong> A análise de sentimento é gerada por IA como ferramenta auxiliar de reflexão clínica. 
              Os valores numéricos são estimativas baseadas no texto das evoluções e <strong>não substituem</strong> a avaliação clínica profissional.
            </div>
          </div>

          {sentiments.length === 0 ? (
            /* Estado inicial — sem dados */
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧠</div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>Mapa Emocional via Inteligência Artificial</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                A IA analisará o conteúdo de todas as {evolutions.length} sessão(ões) registradas e mapeará as emoções predominantes em cada uma, 
                gerando um radar emocional e uma linha do tempo de evolução.
              </p>
              {error && (
                <div className="message-alert message-error" style={{ margin: '0 auto 16px', maxWidth: '500px' }}>{error}</div>
              )}
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating || evolutions.length === 0}
                style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', padding: '10px 24px' }}
              >
                <Sparkles size={18} />
                {isGenerating ? 'Analisando sessões...' : evolutions.length === 0 ? 'Nenhuma sessão para analisar' : 'Analisar Sessões com IA'}
              </button>
            </div>
          ) : (
            /* Com dados — mostra os resultados */
            <>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '0' }}>
                <button
                  onClick={() => setView('radar')}
                  style={{
                    padding: '8px 20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: view === 'radar' ? '#6c9a75' : '#94a3b8',
                    borderBottom: view === 'radar' ? '2px solid #6c9a75' : '2px solid transparent',
                    marginBottom: '-2px',
                    transition: 'all 0.2s'
                  }}
                >
                  🎯 Radar Emocional
                </button>
                <button
                  onClick={() => setView('timeline')}
                  style={{
                    padding: '8px 20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: view === 'timeline' ? '#6c9a75' : '#94a3b8',
                    borderBottom: view === 'timeline' ? '2px solid #6c9a75' : '2px solid transparent',
                    marginBottom: '-2px',
                    transition: 'all 0.2s'
                  }}
                >
                  📈 Evolução por Sessão
                </button>
              </div>

              {view === 'radar' ? (
                <div>
                  {/* Seletor de sessão ou média geral */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <button
                      onClick={() => setSelectedSessionIdx(-1)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: selectedSessionIdx === -1 ? '2px solid #6c9a75' : '1px solid #cbd5e1',
                        background: selectedSessionIdx === -1 ? '#6c9a7515' : 'white',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: selectedSessionIdx === -1 ? 700 : 500,
                        color: selectedSessionIdx === -1 ? '#6c9a75' : '#64748b'
                      }}
                    >
                      Média Geral
                    </button>
                    {sentiments.map((_s, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedSessionIdx(i)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '20px',
                          border: selectedSessionIdx === i ? '2px solid #6c9a75' : '1px solid #cbd5e1',
                          background: selectedSessionIdx === i ? '#6c9a7515' : 'white',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: selectedSessionIdx === i ? 700 : 500,
                          color: selectedSessionIdx === i ? '#6c9a75' : '#64748b'
                        }}
                      >
                        Sessão {i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Radar */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 280px', minWidth: '280px' }}>
                      <RadarChart
                        emotions={selectedSessionIdx === -1 ? averageEmotions! : currentSentiment?.emotions || averageEmotions!}
                      />
                    </div>
                    <div style={{ flex: '1 1 280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ fontSize: '0.95rem', color: '#1e293b', marginBottom: '4px' }}>
                        {selectedSessionIdx === -1 ? 'Perfil Emocional Médio' : `Sessão ${selectedSessionIdx + 1}`}
                      </h4>
                      {selectedSessionIdx !== -1 && currentSentiment && (
                        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '8px' }}>{currentSentiment.summary}</p>
                      )}
                      {EMOTION_KEYS.map(key => (
                        <EmotionBar
                          key={key}
                          emotionKey={key}
                          value={selectedSessionIdx === -1 ? (averageEmotions?.[key] || 0) : (currentSentiment?.emotions[key] || 0)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <TimelineChart sentiments={sentiments} />
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          {sentiments.length > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Sparkles size={16} />
              {isGenerating ? 'Reanalisando...' : 'Reanalisar com IA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
