import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  LogOut, 
  User as UserIcon, 
  Heart, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isDemoMode, updateProfile } = useAuth();
  const { addToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

  // Estados de formulário do perfil
  const [profName, setProfName] = React.useState('');
  const [profSpecialty, setProfSpecialty] = React.useState('');
  const [profRegister, setProfRegister] = React.useState('');
  const [profPhone, setProfPhone] = React.useState('');

  const openProfileModal = () => {
    if (user) {
      setProfName(user.name);
      setProfSpecialty(user.specialty);
      setProfRegister(user.register_number || '');
      setProfPhone(user.phone || '');
    }
    setIsProfileModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await updateProfile(profName, profSpecialty, profRegister || undefined, profPhone || undefined);
      if (error) {
        addToast(error, 'error');
      } else {
        addToast('Perfil atualizado com sucesso!', 'success');
        setIsProfileModalOpen(false);
      }
    } catch (err) {
      console.error(err);
      addToast('Erro ao atualizar perfil.', 'error');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes & Prontuários', path: '/pacientes', icon: Users },
    { id: 'agenda', label: 'Agenda & Consultas', path: '/agenda', icon: CalendarIcon },
    { id: 'forms', label: 'Formulários / Anamnese', path: '/formularios', icon: ClipboardList },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const location = useLocation();
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Visão Geral';
      case '/pacientes': return 'Controle de Pacientes';
      case '/agenda': return 'Agenda de Atendimentos';
      case '/formularios': return 'Modelos e Anamneses';
      default: return 'Painel';
    }
  };

  return (
    <div className="app-layout">
      {/* Botão Hambúrguer Mobile */}
      <button className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <Heart className="brand-icon" size={24} />
            <span>Agenda Clinical</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={handleLinkClick}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div 
            className="professional-info" 
            onClick={openProfileModal} 
            style={{ cursor: 'pointer' }}
            title="Clique para editar perfil profissional"
          >
            <div className="pro-avatar">
              <UserIcon size={18} />
            </div>
            <div className="pro-details">
              <span className="pro-name" title={user?.name}>{user?.name}</span>
              <span className="pro-specialty">{user?.specialty}</span>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="main-wrapper">
        <header className="topbar">
          <div className="topbar-left">
            <h1>{getPageTitle()}</h1>
            <span className="current-date">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="topbar-right">
            {isDemoMode && (
              <div className="demo-badge">
                <Sparkles size={14} />
                <span>Modo de Demonstração</span>
              </div>
            )}
            <div className="user-profile-badge">
              <span className="welcome-text">Olá, {user?.name.split(' ')[0]}</span>
              <div className="avatar-circle">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="content-container">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* MODAL: EDITAR PERFIL PROFISSIONAL */}
      {isProfileModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content animate-slide-up" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3>Editar Perfil Profissional</h3>
              <button className="close-modal-btn" onClick={() => setIsProfileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleUpdateProfile}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profName}
                    onChange={(e) => setProfName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Especialidade / Profissão</label>
                  <input
                    type="text"
                    className="form-control"
                    value={profSpecialty}
                    onChange={(e) => setProfSpecialty(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Registro Profissional (Ex: CRP 06/12345)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Opcional. Exibe no cabeçalho de prontuários"
                    value={profRegister}
                    onChange={(e) => setProfRegister(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Telefone / WhatsApp Comercial</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Opcional. Exibe no rodapé/contato"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

