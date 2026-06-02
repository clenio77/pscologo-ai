import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';
import { SCALES_DATA } from './escalas';

const AvaliacoesView = ({ usuario, API_BASE_URL, pacienteSelecionado }) => {
  const [novaAvaliacaoTipo, setNovaAvaliacaoTipo] = useState('PHQ-9');
  const [respostasAvaliacao, setRespostasAvaliacao] = useState({});
  const [listaAvaliacoes, setListaAvaliacoes] = useState([]);
  const [carregandoAvaliacoes, setCarregandoAvaliacoes] = useState(false);

  const fetchAvaliacoes = async () => {
    if (!usuario || !pacienteSelecionado) return;
    setCarregandoAvaliacoes(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/avaliacoes`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setListaAvaliacoes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCarregandoAvaliacoes(false);
    }
  };

  useEffect(() => {
    fetchAvaliacoes();
    setNovaAvaliacaoTipo('PHQ-9');
    setRespostasAvaliacao({});
  }, [pacienteSelecionado, usuario]);

  const handleSalvarAvaliacao = async (escore_total, classificacao) => {
    if (!usuario || !pacienteSelecionado) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/avaliacoes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({
          tipo_escala: novaAvaliacaoTipo,
          respostas_json: JSON.stringify(respostasAvaliacao),
          escore_total: escore_total,
          classificacao: classificacao
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setRespostasAvaliacao({});
        fetchAvaliacoes();
        alert('Avaliação salva com sucesso!');
      } else {
        alert(data.erro);
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar avaliação');
    }
  };

  const currentScale = SCALES_DATA[novaAvaliacaoTipo] || SCALES_DATA['PHQ-9'];
  const perguntas = currentScale.perguntas;
  const opcoes = currentScale.opcoes;
  const valores = currentScale.valores;

  const handleOpcaoChange = (index, valor) => {
    setRespostasAvaliacao({ ...respostasAvaliacao, [index]: valor });
  };

  const calcularEscore = () => {
    let total = 0;
    perguntas.forEach((_, i) => {
      if (respostasAvaliacao[i] !== undefined) total += respostasAvaliacao[i];
    });
    return total;
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BarChart3 size={24} color="var(--accent)" />
        Avaliações Psicométricas
      </h2>
      <p style={{ color: 'var(--text-secondary)' }}>Aplique e acompanhe mais de 10 escalas padronizadas para monitoramento clínico de ponta.</p>

      <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
        <div style={{ flex: 1 }}>
          <div className="glass-card">
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>Nova Avaliação</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Selecione a Escala Clínica:</label>
              <select 
                value={novaAvaliacaoTipo} 
                onChange={(e) => { setNovaAvaliacaoTipo(e.target.value); setRespostasAvaliacao({}); }}
                style={{ width: '100%', padding: '12px', marginTop: '8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem' }}
              >
                {Object.entries(SCALES_DATA).map(([key, data]) => (
                  <option key={key} value={key}>{data.nome}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {perguntas.map((p, index) => (
                <div key={index} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', borderLeft: '3px solid var(--accent)' }}>
                  <p style={{ marginBottom: '12px', color: '#e2e8f0' }}><strong>{index + 1}.</strong> {p}</p>
                  <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    {opcoes.map((op, v) => (
                      <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: respostasAvaliacao[index] === valores[v] ? 'rgba(139, 92, 246, 0.2)' : 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '6px', border: respostasAvaliacao[index] === valores[v] ? '1px solid #8b5cf6' : '1px solid transparent', transition: 'all 0.2s' }}>
                        <input 
                          type="radio" 
                          name={`pergunta-${index}`} 
                          value={valores[v]} 
                          checked={respostasAvaliacao[index] === valores[v]}
                          onChange={() => handleOpcaoChange(index, valores[v])}
                          style={{ accentColor: '#8b5cf6' }}
                        />
                        {op}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '25px', padding: '1rem', fontSize: '1.1rem' }}
              onClick={() => {
                if (Object.keys(respostasAvaliacao).length < perguntas.length) {
                  alert("Por favor, responda a todas as perguntas para um cálculo preciso.");
                  return;
                }
                const score = calcularEscore();
                const cls = currentScale.classificar(score);
                handleSalvarAvaliacao(score, cls);
              }}
            >
              Calcular Escore e Salvar no Prontuário
            </button>
          </div>
        </div>

        <div style={{ width: '400px' }}>
          <div className="glass-card" style={{ position: 'sticky', top: '20px' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>Histórico do Paciente</h3>
            {carregandoAvaliacoes ? <p style={{ color: 'var(--text-muted)' }}>Buscando laudos...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '70vh', overflowY: 'auto', paddingRight: '5px' }}>
                {listaAvaliacoes.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Nenhuma avaliação registrada ainda.</p> : null}
                {listaAvaliacoes.map(av => (
                  <div key={av.id} style={{ padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: 'white', fontSize: '1.1rem' }}>{av.tipo_escala}</strong>
                      <span style={{ fontSize: '0.85em', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px' }}>{av.data}</span>
                    </div>
                    <h2 style={{ margin: '8px 0', color: 'var(--accent)', fontSize: '1.8rem' }}>Escore: {av.escore_total}</h2>
                    <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem' }}>Diagnóstico: <strong style={{ color: '#fff' }}>{av.classificacao}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvaliacoesView;
