import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

const PlanoTerapeuticoView = ({ usuario, API_BASE_URL, pacienteSelecionado }) => {
  const [planoTerapeutico, setPlanoTerapeutico] = useState({ id: null, objetivos: '', intervencoes: '', frequencia: 'Semanal', data_criacao: null });
  const [editandoPlano, setEditandoPlano] = useState(false);

  const fetchPlanoTerapeutico = async () => {
    if (!usuario || !pacienteSelecionado) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/plano`, {
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.id) {
          setPlanoTerapeutico(data);
        } else {
          setPlanoTerapeutico({ id: null, objetivos: '', intervencoes: '', frequencia: 'Semanal', data_criacao: null });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPlanoTerapeutico();
    setEditandoPlano(false);
  }, [pacienteSelecionado, usuario]);

  const salvarPlanoTerapeutico = async (e) => {
    e.preventDefault();
    if (!pacienteSelecionado) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/plano`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${usuario.token}` },
        body: JSON.stringify(planoTerapeutico)
      });
      if (resp.ok) {
        alert('Plano terapêutico salvo!');
        setEditandoPlano(false);
        fetchPlanoTerapeutico();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Plus size={24} color="var(--accent)" /> Plano Terapêutico</h2>
      <p style={{ color: 'var(--text-secondary)' }}>Defina os objetivos principais, intervenções e frequência das sessões para este paciente.</p>
      
      <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '12px' }}>
        <form onSubmit={salvarPlanoTerapeutico} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label>Objetivos Principais:</label>
            <textarea
              value={planoTerapeutico.objetivos}
              onChange={(e) => setPlanoTerapeutico({ ...planoTerapeutico, objetivos: e.target.value })}
              rows={4}
              placeholder="Ex: Redução da ansiedade social, melhoria no sono..."
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', resize: 'vertical' }}
              disabled={!editandoPlano && planoTerapeutico.id}
            />
          </div>
          <div>
            <label>Intervenções e Estratégias (TCC, Psicanálise, etc):</label>
            <textarea
              value={planoTerapeutico.intervencoes}
              onChange={(e) => setPlanoTerapeutico({ ...planoTerapeutico, intervencoes: e.target.value })}
              rows={4}
              placeholder="Ex: Reestruturação cognitiva, diário de emoções..."
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px', resize: 'vertical' }}
              disabled={!editandoPlano && planoTerapeutico.id}
            />
          </div>
          <div>
            <label>Frequência Sugerida:</label>
            <select
              value={planoTerapeutico.frequencia}
              onChange={(e) => setPlanoTerapeutico({ ...planoTerapeutico, frequencia: e.target.value })}
              style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '8px' }}
              disabled={!editandoPlano && planoTerapeutico.id}
            >
              <option value="Semanal">Semanal</option>
              <option value="Quinzenal">Quinzenal</option>
              <option value="Mensal">Mensal</option>
              <option value="Sob demanda">Sob demanda</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            {(!planoTerapeutico.id || editandoPlano) ? (
              <button type="submit" className="btn-primary">Salvar Plano Terapêutico</button>
            ) : (
              <button type="button" className="btn-secondary" onClick={() => setEditandoPlano(true)} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', cursor: 'pointer' }}>Editar Plano</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanoTerapeuticoView;
