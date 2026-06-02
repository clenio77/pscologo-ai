import React, { useState, useEffect } from 'react';

const LoginView = ({ setUsuario, API_BASE_URL }) => {
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'cadastro'
  const [authTipo, setAuthTipo] = useState('paciente'); // 'paciente' or 'psicologo'
  const [authNome, setAuthNome] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authSenha, setAuthSenha] = useState('');
  const [authPsicologoId, setAuthPsicologoId] = useState('');
  const [listaPsicologos, setListaPsicologos] = useState([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (authMode === 'cadastro' && authTipo === 'paciente') {
      const fetchPsicologos = async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/psicologos`);
          const data = await resp.json();
          setListaPsicologos(data);
          if (data.length > 0) {
            setAuthPsicologoId(data[0].id);
          }
        } catch (err) {
          console.error("Erro ao buscar psicólogos:", err);
        }
      };
      fetchPsicologos();
    }
  }, [authMode, authTipo, API_BASE_URL]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, senha: authSenha, tipo: authTipo })
      });
      const data = await resp.json();
      
      if (resp.ok) {
        localStorage.setItem('usuario', JSON.stringify(data));
        setUsuario(data);
      } else {
        alert(data.erro || "Login inválido");
      }
    } catch (err) {
      console.error("Erro ao fazer login", err);
      alert("Erro de conexão");
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setCarregando(true);
    try {
      const payload = {
        nome: authNome,
        email: authEmail,
        senha: authSenha,
        tipo: authTipo
      };
      if (authTipo === 'paciente') {
        if (!authPsicologoId) {
          alert("Por favor, selecione um psicólogo");
          setCarregando(false);
          return;
        }
        payload.psicologo_id = authPsicologoId;
      }

      const resp = await fetch(`${API_BASE_URL}/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (resp.ok) {
        alert("Cadastro realizado com sucesso! Faça login.");
        setAuthMode('login');
      } else {
        alert(data.erro || "Erro no cadastro");
      }
    } catch (err) {
      console.error("Erro ao cadastrar", err);
      alert("Erro de conexão");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Psicólogo IA</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {authMode === 'login' ? 'Entre na sua conta clínica' : 'Crie sua conta clínica'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            className={`auth-tab ${authTipo === 'paciente' ? 'active' : ''}`}
            onClick={() => setAuthTipo('paciente')}
          >
            Paciente
          </button>
          <button
            className={`auth-tab ${authTipo === 'psicologo' ? 'active' : ''}`}
            onClick={() => setAuthTipo('psicologo')}
          >
            Psicólogo
          </button>
        </div>

        <form className="auth-form" onSubmit={authMode === 'login' ? handleLogin : handleCadastro}>
          {authMode === 'cadastro' && (
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={authNome}
                onChange={(e) => setAuthNome(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>E-mail</label>
            <input
              type="email"
              placeholder="seuemail@exemplo.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Senha</label>
            <input
              type="password"
              placeholder="Sua senha"
              value={authSenha}
              onChange={(e) => setAuthSenha(e.target.value)}
              required
            />
          </div>

          {authMode === 'cadastro' && authTipo === 'paciente' && (
            <div className="form-group">
              <label>Selecione o Psicólogo</label>
              <select
                value={authPsicologoId}
                onChange={(e) => setAuthPsicologoId(e.target.value)}
                required
              >
                {listaPsicologos.length === 0 && (
                  <option value="">Nenhum psicólogo cadastrado</option>
                )}
                {listaPsicologos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={carregando}>
            {carregando ? 'Aguarde...' : authMode === 'login' ? 'Entrar' : 'Cadastrar'}
          </button>
        </form>

        <div className="auth-switch-prompt">
          {authMode === 'login' ? (
            <>
              Não tem uma conta?
              <button type="button" className="auth-switch-link" onClick={() => setAuthMode('cadastro')}>
                Cadastre-se
              </button>
            </>
          ) : (
            <>
              Já tem uma conta?
              <button type="button" className="auth-switch-link" onClick={() => setAuthMode('login')}>
                Faça login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginView;
