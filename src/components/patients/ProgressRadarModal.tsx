import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Patient, Evolution } from '../../services/api';
import { generateProgressRadar } from '../../services/aiService';
import type { ProgressDimension } from '../../services/aiService';

interface ProgressRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  evolutions: Evolution[];
}

const RadarChart: React.FC<{ data: ProgressDimension[]; size?: number }> = ({ data, size = 320 }) => {
  const center = size / 2;
  const maxRadius = size / 2 - 50;
  const levels = 5;
  const angleStep = (2 * Math.PI) / data.length;

  const getPoint = (index: number, value: number): { x: number; y: number } => {
    const angle = index * angleStep - Math.PI / 2;
    const radius = (value / 10) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const initialPoints = data.map((d, i) => getPoint(i, d.initialScore));
  const initialPolygonPoints = initialPoints.map(p => `${p.x},${p.y}`).join(' ');

  const currentPoints = data.map((d, i) => getPoint(i, d.currentScore));
  const currentPolygonPoints = currentPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Grid circles */}
      {Array.from({ length: levels }).map((_, i) => {
        const r = ((i + 1) / levels) * maxRadius;
        const gridPoints = data.map((_, j) => {
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
      {data.map((_, i) => {
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

      {/* Initial state polygon */}
      <polygon
        points={initialPolygonPoints}
        fill="rgba(148, 163, 184, 0.2)"
        stroke="#94a3b8"
        strokeWidth="2"
        strokeDasharray="4 4"
      />

      {/* Current state polygon */}
      <polygon
        points={currentPolygonPoints}
        fill="rgba(108, 154, 117, 0.3)"
        stroke="#6c9a75"
        strokeWidth="2.5"
      />

      {/* Initial data points */}
      {initialPoints.map((p, i) => (
        <circle key={`init-${i}`} cx={p.x} cy={p.y} r="3" fill="#94a3b8" />
      ))}

      {/* Current data points */}
      {currentPoints.map((p, i) => (
        <circle key={`curr-${i}`} cx={p.x} cy={p.y} r="4" fill="#6c9a75" stroke="white" strokeWidth="1.5" />
      ))}

      {/* Labels */}
      {data.map((d, i) => {
        const labelPoint = getPoint(i, 12); // Pushed out for labels
        return (
          <text
            key={i}
            x={labelPoint.x}
            y={labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            fontWeight="600"
            fill="#475569"
          >
            {d.dimension}
          </text>
        );
      })}
    </svg>
  );
};

export const ProgressRadarModal: React.FC<ProgressRadarModalProps> = ({
  isOpen,
  onClose,
  patient,
  evolutions
}) => {
  const [data, setData] = useState<ProgressDimension[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const results = await generateProgressRadar(patient, evolutions);
      setData(results);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar radar de progresso.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content animate-slide-up" style={{ maxWidth: '900px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h3>Radar de Progresso — {patient.name}</h3>
          <button className="close-modal-btn" onClick={onClose} aria-label="Fechar modal">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ background: '#f8f5ff', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #8b5cf6', fontSize: '0.88rem', color: '#4c1d95', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Atenção (CFP):</strong> O radar compara as sessões iniciais com as mais recentes utilizando IA. 
              Serve para reflexão clínica e tangibilização do progresso, não substituindo a avaliação clínica formal.
            </div>
          </div>

          {data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}><TrendingUp size={48} color="#6c9a75" style={{ margin: '0 auto' }} /></div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: '#1e293b' }}>Radar Comparativo de Progresso</h3>
              <p style={{ color: '#64748b', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
                A IA analisará as primeiras sessões vs. as sessões mais recentes para gerar um gráfico de radar avaliando 6 dimensões psicológicas, demonstrando visualmente o avanço do paciente.
              </p>
              
              {evolutions.length < 2 && (
                <div className="message-alert message-error" style={{ margin: '0 auto 16px', maxWidth: '500px' }}>
                  São necessárias pelo menos 2 sessões registradas para poder comparar o progresso inicial com o atual.
                </div>
              )}
              {error && (
                <div className="message-alert message-error" style={{ margin: '0 auto 16px', maxWidth: '500px' }}>{error}</div>
              )}
              
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={isGenerating || evolutions.length < 2}
                style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', padding: '10px 24px' }}
              >
                <Sparkles size={18} />
                {isGenerating ? 'Analisando sessões e gerando radar...' : 'Gerar Radar de Progresso'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', alignItems: 'flex-start' }}>
              <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#94a3b8' }}></div>
                    Estado Inicial
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6c9a75' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#6c9a75' }}></div>
                    Estado Atual
                  </div>
                </div>

                <RadarChart data={data} />
              </div>

              <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '4px' }}>Detalhamento das Dimensões</h4>
                {data.map((d, i) => (
                  <div key={i} style={{ background: 'white', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.95rem', color: '#334155' }}>{d.dimension}</strong>
                      <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span style={{ color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>Início: {d.initialScore}</span>
                        <span style={{ color: '#6c9a75', background: '#f2fcf5', padding: '2px 8px', borderRadius: '12px' }}>Atual: {d.currentScore}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>{d.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          {data.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Sparkles size={16} />
              Reanalisar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
