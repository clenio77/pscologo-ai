import React, { useState } from 'react';
import { Download, CheckCircle, Clock } from 'lucide-react';

const FinanceiroView = ({ usuario, API_BASE_URL, pacienteSelecionado, financeiroData, setFinanceiroData, listaPacotes, fetchFinanceiro, fetchPacotes }) => {
  const [finTipo, setFinTipo] = useState('receita');
  const [finCategoria, setFinCategoria] = useState('sessao');
  const [finValor, setFinValor] = useState('');
  const [finDescricao, setFinDescricao] = useState('');
  const [finStatus, setFinStatus] = useState('pago');
  
  const [pacSessoes, setPacSessoes] = useState('4');
  const [pacValorTotal, setPacValorTotal] = useState('');

  const handleLancarTransacao = async (e) => {
    e.preventDefault();
    if (!usuario) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/financeiro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({
          tipo: finTipo,
          categoria: finCategoria,
          valor: parseFloat(finValor),
          descricao: finDescricao,
          status: finStatus,
          paciente_id: pacienteSelecionado ? pacienteSelecionado.id : null
        })
      });
      if (resp.ok) {
        alert("Lançamento registrado!");
        setFinValor('');
        setFinDescricao('');
        fetchFinanceiro();
      } else {
        alert("Erro ao registrar");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVenderPacote = async (e) => {
    e.preventDefault();
    if (!usuario || !pacienteSelecionado) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/pacotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${usuario.token}`
        },
        body: JSON.stringify({
          paciente_id: pacienteSelecionado.id,
          quantidade_sessoes: parseInt(pacSessoes),
          valor_total: parseFloat(pacValorTotal)
        })
      });
      if (resp.ok) {
        alert("Pacote vendido com sucesso!");
        setPacValorTotal('');
        fetchPacotes(pacienteSelecionado.id);
        fetchFinanceiro();
      } else {
        alert("Erro ao vender pacote");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegistrarUsoPacote = async (pacoteId) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/pacotes/${pacoteId}/usar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${usuario.token}` }
      });
      if (resp.ok) {
        fetchPacotes(pacienteSelecionado.id);
      } else {
        alert("Erro ao registrar sessão");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {usuario.tipo === 'psicologo' && !pacienteSelecionado && (
        <div className="finance-summary">
          <div className="finance-summary-card receitas">
            <h4>Faturamento (Recebido)</h4>
            <span className="finance-summary-value">R$ {financeiroData.resumo?.total_receitas.toFixed(2)}</span>
          </div>
          <div className="finance-summary-card despesas">
            <h4>Despesas Clínicas</h4>
            <span className="finance-summary-value">R$ {financeiroData.resumo?.total_despesas.toFixed(2)}</span>
          </div>
          <div className="finance-summary-card lucro">
            <h4>Lucro Líquido</h4>
            <span className="finance-summary-value">R$ {financeiroData.resumo?.lucro_liquido.toFixed(2)}</span>
          </div>
        </div>
      )}

      <div className="finance-layout">
        {usuario.tipo === 'psicologo' && (
          <div className="finance-form-side">
            {!pacienteSelecionado ? (
              <>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', marginBottom: '1.25rem' }}>Lançar Transação</h3>
                <form onSubmit={handleLancarTransacao} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select value={finTipo} onChange={(e) => { setFinTipo(e.target.value); setFinCategoria(e.target.value === 'receita' ? 'sessao' : 'aluguel'); }}>
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Categoria</label>
                    {finTipo === 'receita' ? (
                      <select value={finCategoria} onChange={(e) => setFinCategoria(e.target.value)}>
                        <option value="sessao">Sessão / Consulta</option>
                        <option value="outros">Outra Receita</option>
                      </select>
                    ) : (
                      <select value={finCategoria} onChange={(e) => setFinCategoria(e.target.value)}>
                        <option value="aluguel">Aluguel da Sala</option>
                        <option value="sistemas">Softwares e Sistemas</option>
                        <option value="marketing">Publicidade / Marketing</option>
                        <option value="impostos">Impostos / Taxas</option>
                        <option value="outros">Outros Custos</option>
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Valor (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" value={finValor} onChange={(e) => setFinValor(e.target.value)} required />
                  </div>

                  <div className="form-group">
                    <label>Descrição</label>
                    <input type="text" placeholder="Ex: Pagamento da consulta..." value={finDescricao} onChange={(e) => setFinDescricao(e.target.value)} />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select value={finStatus} onChange={(e) => setFinStatus(e.target.value)}>
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </div>

                  <button type="submit" className="action-btn-success" style={{ padding: '0.8rem', marginTop: '0.5rem', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '0.8rem' }}>
                    Registrar Lançamento
                  </button>
                </form>
              </>
            ) : (
              <>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', marginBottom: '1.25rem' }}>Vender Pacote de Sessões</h3>
                <form onSubmit={handleVenderPacote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="form-group">
                    <label>Qtd. de Sessões</label>
                    <select value={pacSessoes} onChange={(e) => setPacSessoes(e.target.value)}>
                      <option value="4">4 Sessões</option>
                      <option value="8">8 Sessões</option>
                      <option value="12">12 Sessões</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Valor Total (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" value={pacValorTotal} onChange={(e) => setPacValorTotal(e.target.value)} required />
                  </div>
                  <button type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>Registrar Venda</button>
                </form>

                {listaPacotes.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.1rem', marginBottom: '1rem' }}>Pacotes Ativos</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {listaPacotes.map(pac => (
                        <div key={pac.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '0.8rem', border: '1px solid var(--glass-border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 'bold' }}>{pac.sessoes_restantes} sessões restantes</span>
                            <span style={{ color: 'var(--text-muted)' }}>de {pac.quantidade_sessoes} totais</span>
                          </div>
                          {pac.sessoes_restantes > 0 ? (
                            <button 
                              onClick={() => handleRegistrarUsoPacote(pac.id)}
                              style={{ width: '100%', padding: '6px', background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '6px', cursor: 'pointer', marginTop: '8px' }}
                            >
                              Deduzir 1 Sessão
                            </button>
                          ) : (
                            <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', marginTop: '8px' }}>Pacote Esgotado</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="finance-list-side">
          <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '1.3rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Histórico de Transações
            {usuario.tipo === 'psicologo' && (
              <button className="icon-btn" title="Exportar Relatório"><Download size={18} /></button>
            )}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {financeiroData.lancamentos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Nenhum lançamento encontrado.</p>
            ) : (
              financeiroData.lancamentos.map((item) => (
                <div key={item.id} className="finance-item">
                  <div className="finance-item-info">
                    <span className="finance-item-title">{item.descricao || item.categoria}</span>
                    <span className="finance-item-date">{item.data} • {item.paciente_nome || 'Clínica'}</span>
                  </div>
                  <div className="finance-item-status">
                    <span className={`finance-item-value ${item.tipo}`}>
                      {item.tipo === 'receita' ? '+' : '-'} R$ {item.valor.toFixed(2)}
                    </span>
                    <span className={`status-badge ${item.status}`}>
                      {item.status === 'pago' ? <CheckCircle size={12} /> : <Clock size={12} />}
                      {item.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceiroView;
