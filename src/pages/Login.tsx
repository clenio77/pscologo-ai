import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Heart, ShieldAlert } from 'lucide-react';
import './Login.css';

export const Login: React.FC = () => {
  const { login, signUp, isDemoMode } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  
  // States do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('Psicologia');
  
  // Status de carregamento e mensagens
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (isSignUp) {
        // Fluxo de Cadastro
        if (!name.trim()) {
          setErrorMsg('Por favor, informe seu nome.');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, name, specialty);
        if (error) {
          setErrorMsg(error);
        } else {
          setSuccessMsg('Cadastro realizado com sucesso!');
        }
      } else {
        // Fluxo de Login
        const { error } = await login(email, password);
        if (error) {
          setErrorMsg(error);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Ocorreu um erro inesperado.';
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrorMsg(null);
    setSuccessMsg(null);
    setEmail('');
    setPassword('');
    setName('');
    setSpecialty('Psicologia');
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper animate-slide-up">
        {/* Lado Esquerdo - Info/Apresentação */}
        <div className="login-info-section">
          <div className="login-logo-brand">
            <Heart className="brand-icon" size={32} />
            <span>Agenda Clinical</span>
          </div>
          <div className="login-info-content">
            <h2>Cuide da sua agenda, enquanto cuida de quem importa.</h2>
            <p>
              Uma plataforma integrada e relaxante projetada especificamente para terapeutas, 
              psicólogos e profissionais de saúde mental.
            </p>
          </div>
          <div className="login-footer-credits">
            Desenvolvido com carinho para profissionais de saúde.
          </div>
        </div>

        {/* Lado Direito - Formulário */}
        <div className="login-form-section">
          <div className="form-header">
            <h3>{isSignUp ? 'Criar sua conta profissional' : 'Bem-vindo de volta'}</h3>
            <p>{isSignUp ? 'Comece a gerenciar seu consultório hoje' : 'Acesse seus pacientes e consultas'}</p>
          </div>

          {/* Banner de Modo Demo se ativado */}
          {isDemoMode && (
            <div className="demo-banner">
              <ShieldAlert className="demo-banner-icon" size={20} />
              <div>
                <strong>Modo de Demonstração Ativo</strong>
                <p>
                  Supabase não configurado. Use o login abaixo ou registre uma conta simulada:
                  <br />
                  <code style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.05)', padding: '2px 4px', borderRadius: '4px' }}>
                    demo@agenda.com / 123456
                  </code>
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="message-alert message-error">
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="message-alert message-success">
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-body">
            {isSignUp && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="name">Seu Nome Completo</label>
                  <input
                    type="text"
                    id="name"
                    className="form-control"
                    placeholder="Ex: Dra. Clarice Lispector"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="specialty">Especialidade / Profissão</label>
                  <select
                    id="specialty"
                    className="form-control"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  >
                    <option value="Psicologia">Psicologia</option>
                    <option value="Odontologia">Odontologia</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                    <option value="Terapia Ocupacional">Terapia Ocupacional</option>
                    <option value="Outro Autônomo">Outro Autônomo</option>
                  </select>
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail Profissional</label>
              <input
                type="email"
                id="email"
                className="form-control"
                placeholder="nome@consultorio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                className="form-control"
                placeholder="Sua senha de acesso"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? (
                <span className="spinner"></span>
              ) : isSignUp ? (
                'Criar Minha Conta'
              ) : (
                'Entrar no Painel'
              )}
            </button>
          </form>

          <div className="form-toggle-footer">
            <span>
              {isSignUp ? 'Já possui uma conta?' : 'Novo por aqui?'}
            </span>
            <button onClick={toggleMode} className="btn-text-link">
              {isSignUp ? 'Faça login' : 'Cadastre-se gratuitamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

