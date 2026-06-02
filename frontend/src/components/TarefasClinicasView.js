import React, { useState } from 'react';
import { Plus, ClipboardList, Trash2 } from 'lucide-react';

const TarefasClinicasView = ({ usuario, API_BASE_URL, pacienteSelecionado, listaTarefas, carregandoTarefas, fetchTarefas }) => {
  const [novoTituloTarefa, setNovoTituloTarefa] = useState('');
  const [novaDescricaoTarefa, setNovaDescricaoTarefa] = useState('');

  const handleAdicionarTarefa = async (e) => {
    e.preventDefault();
    if (!usuario || usuario.tipo !== 'psicologo' || !pacienteSelecionado || !novoTituloTarefa.trim() || !novaDescricaoTarefa.trim()) return;
    
    try {
      const resp = await fetch(`${API_BASE_URL}/paciente/${pacienteSelecionado.id}/tarefas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({
          titulo: novoTituloTarefa,
          descricao: novaDescricaoTarefa
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setNovoTituloTarefa('');
        setNovaDescricaoTarefa('');
        alert("Tarefa prescrita e enviada ao paciente com sucesso!");
        fetchTarefas(pacienteSelecionado.id); // Reload list
      } else {
        alert(data.erro || "Erro ao prescrever tarefa");
      }
    } catch (err) {
      console.error("Erro de conexão ao criar tarefa:", err);
      alert("Erro ao conectar com o servidor.");
    }
  };

  const handleRemoverTarefa = async (tarefaId) => {
    if (!usuario || usuario.tipo !== 'psicologo') return;
    if (!window.confirm("Deseja mesmo remover esta tarefa prescrita? O paciente não a verá mais.")) return;
    
    try {
      const resp = await fetch(`${API_BASE_URL}/tarefas/${tarefaId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${usuario.token}`
        }
      });
      if (resp.ok) {
        fetchTarefas(pacienteSelecionado.id);
      } else {
        const data = await resp.json();
        alert(data.erro || "Erro ao remover tarefa");
      }
    } catch (err) {
      console.error("Erro de conexão ao remover tarefa:", err);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'stretch' }} className="tarefas-grid">
      
      {/* Painel Esquerdo: Prescrever Nova Tarefa */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <Plus size={20} style={{ color: 'var(--accent)' }} /> Prescrever Tarefa
        </h3>

        <form onSubmit={handleAdicionarTarefa} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
          <div className="form-group">
            <label>Título da Atividade</label>
            <input
              type="text"
              placeholder="Ex: Registro de Pensamentos Disfuncionais (RPD)"
              value={novoTituloTarefa}
              onChange={(e) => setNovoTituloTarefa(e.target.value)}
              required
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                borderRadius: '0.8rem',
                padding: '0.75rem'
              }}
            />
          </div>
          
          <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <label>Descrição / Instruções para o Paciente</label>
            <textarea
              placeholder="Ex: Sempre que sentir ansiedade acima de nível 5 esta semana, anote: 1. Situação, 2. Pensamentos automáticos, 3. Emoção sentida, 4. Resposta racional..."
              value={novaDescricaoTarefa}
              onChange={(e) => setNovaDescricaoTarefa(e.target.value)}
              required
              rows={6}
              style={{
                width: '100%',
                flex: 1,
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--glass-border)',
                color: 'white',
                borderRadius: '0.8rem',
                padding: '0.75rem',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            className="action-btn-success"
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: 'var(--accent)', color: 'white', borderColor: 'var(--accent)', cursor: 'pointer', padding: '0.8rem' }}
          >
            <Plus size={16} /> Prescrever Lição de Casa
          </button>
        </form>
      </div>

      {/* Painel Direito: Lista de Tarefas Prescritas e Monitoramento */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--glass-border)', padding: '2rem', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ margin: '0 0 1.5rem 0', fontFamily: 'Outfit, sans-serif', fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
          <ClipboardList size={20} style={{ color: 'var(--accent)' }} /> Lições e Atividades Prescritas
        </h3>

        <div style={{ flex: 1, overflowY: 'auto', maxHeight: '480px', paddingRight: '5px' }}>
          {carregandoTarefas ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>Carregando tarefas...</p>
          ) : listaTarefas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <ClipboardList size={40} style={{ color: 'var(--accent)', opacity: 0.3, marginBottom: '1rem', display: 'block', margin: '0 auto' }} />
              <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>Nenhuma tarefa prescrita</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '350px', margin: '0 auto', lineHeight: '1.5' }}>
                Use o painel esquerdo para registrar atividades ou lições de casa. O paciente verá as tarefas no painel dele e poderá marcá-las como concluídas.
              </p>
            </div>
          ) : (
            listaTarefas.map((tarefa) => (
              <div key={tarefa.id} style={{
                background: tarefa.concluida ? 'rgba(34, 197, 94, 0.03)' : 'rgba(255,255,255,0.02)',
                borderRadius: '1rem',
                padding: '1.25rem',
                marginBottom: '1rem',
                border: tarefa.concluida ? '1px solid rgba(34, 197, 94, 0.15)' : '1px solid rgba(255,255,255,0.05)',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {tarefa.titulo}
                      {tarefa.concluida ? (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.15)', color: '#4ade80', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Concluída</span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' }}>Em Aberto</span>
                      )}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Prescrito em: {tarefa.data_criacao}</span>
                    {tarefa.concluida && tarefa.data_conclusao && (
                      <div style={{ fontSize: '0.75rem', color: '#4ade80', marginTop: '2px' }}>Concluído em: {tarefa.data_conclusao}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoverTarefa(tarefa.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Excluir tarefa"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.5', background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: '0.5rem' }}>
                  {tarefa.descricao}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default TarefasClinicasView;
