import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import type { Appointment, Patient } from '../services/api';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  MessageSquare,
  X,
  Phone,
  Trash2
} from 'lucide-react';
import './Agenda.css';
import { Portal } from '../components/Portal';

export const Agenda: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Data de referência do calendário
  const [currentDate, setCurrentDate] = useState(new Date());
  // Dia atualmente selecionado para exibição lateral
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modais
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // States de Formulário de Nova Consulta
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [appDate, setAppDate] = useState('');
  const [appTime, setAppTime] = useState('08:00');
  const [appDuration, setAppDuration] = useState(50);
  const [appNotes, setAppNotes] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    await Promise.resolve();
    setLoading(true);
    try {
      const [appData, patientData] = await Promise.all([
        api.getAppointments(user.id),
        api.getPatients(user.id)
      ]);
      setAppointments(appData);
      setPatients(patientData);
      if (patientData.length > 0) {
        setSelectedPatientId(patientData[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da agenda:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);


  // Funções de navegação do calendário
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Lógica para montar os dias do mês
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primeiro dia do mês
    const firstDayIndex = new Date(year, month, 1).getDay();
    // Quantidade de dias no mês
    const totalDays = new Date(year, month + 1, 0).getDate();
    // Quantidade de dias no mês anterior
    const prevTotalDays = new Date(year, month, 0).getDate();

    const days = [];

    // Preencher dias do mês anterior para alinhar a grade (cinza)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevTotalDays - i),
        isCurrentMonth: false,
      });
    }

    // Preencher dias do mês atual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    // Preencher dias do mês seguinte para completar o grid (geralmente 42 células)
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // Filtra consultas de uma data específica
  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter((app) => {
      const appDateObj = new Date(app.date_time);
      return (
        appDateObj.getFullYear() === date.getFullYear() &&
        appDateObj.getMonth() === date.getMonth() &&
        appDateObj.getDate() === date.getDate()
      );
    });
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedPatientId) return;

    try {
      const dateTimeString = `${appDate}T${appTime}:00`;
      const newStart = new Date(dateTimeString);
      const newEnd = new Date(newStart.getTime() + appDuration * 60000);

      // Verifica colisão de horários
      const hasOverlap = appointments.some(app => {
        // Ignora os agendamentos que foram cancelados
        if (app.status === 'canceled') return false;

        const appStart = new Date(app.date_time);
        const appEnd = new Date(appStart.getTime() + (app.duration_minutes || 50) * 60000);

        return newStart < appEnd && newEnd > appStart;
      });

      if (hasOverlap) {
        addToast('Conflito de horário! Você já possui uma consulta agendada que sobrepõe este período.', 'error');
        return;
      }

      await api.createAppointment({
        professional_id: user.id,
        patient_id: selectedPatientId,
        date_time: newStart.toISOString(),
        duration_minutes: appDuration,
        status: 'scheduled',
        notes: appNotes || undefined,
      });
      setIsAppointmentModalOpen(false);
      setAppNotes('');
      addToast('Consulta agendada com sucesso!', 'success');
      loadData();
    } catch (err) {
      console.error('Erro ao agendar consulta:', err);
      addToast('Erro ao agendar consulta. Tente novamente.', 'error');
    }
  };

  const handleUpdateStatus = async (appointmentId: string, status: Appointment['status']) => {
    try {
      await api.updateAppointmentStatus(appointmentId, status);
      setIsDetailModalOpen(false);
      addToast('Status da consulta atualizado!', 'success');
      loadData();
    } catch (err) {
      console.error('Erro ao atualizar status da consulta:', err);
      addToast('Erro ao atualizar status da consulta.', 'error');
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este agendamento?')) return;
    try {
      await api.deleteAppointment(appointmentId);
      setIsDetailModalOpen(false);
      addToast('Agendamento excluído!', 'success');
      loadData();
    } catch (err) {
      console.error('Erro ao deletar consulta:', err);
      addToast('Erro ao excluir agendamento.', 'error');
    }
  };

  // Abre modal com detalhes da consulta
  const handleOpenDetail = (app: Appointment) => {
    setSelectedAppointment(app);
    setIsDetailModalOpen(true);
  };

  // Função para abrir o WhatsApp Web para enviar o lembrete
  const handleSendWhatsAppReminder = (app: Appointment) => {
    if (!app.patient) return;
    const phoneDigits = app.patient.phone?.replace(/\D/g, '') || '';
    if (!phoneDigits) {
      addToast('Este paciente não possui telefone cadastrado.', 'warning');
      return;
    }

    const appDateObj = new Date(app.date_time);
    const dateFormatted = appDateObj.toLocaleDateString('pt-BR');
    const timeFormatted = appDateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const message = `Olá, ${app.patient.name}! Confirmamos a sua consulta com ${user?.name} no dia ${dateFormatted} às ${timeFormatted}. Se precisar remarcar, por favor nos avise. Até breve!`;
    const encodedText = encodeURIComponent(message);
    
    window.open(`https://web.whatsapp.com/send?phone=55${phoneDigits}&text=${encodedText}`, '_blank');
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return <span className="badge badge-info">Agendado</span>;
      case 'completed':
        return <span className="badge badge-success">Realizado</span>;
      case 'canceled':
        return <span className="badge badge-error">Cancelado</span>;
      case 'no_show':
        return <span className="badge badge-warning">Falta</span>;
      default:
        return null;
    }
  };

  const days = getDaysInMonth();
  const selectedDateAppointments = getAppointmentsForDate(selectedDate);

  return (
    <div className="agenda-page">
      <div className="agenda-grid">
        {/* Coluna Principal: O Calendário */}
        <div className="calendar-main card">
          <div className="calendar-header">
            <div className="calendar-title-nav">
              <h2 className="calendar-month-year">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="nav-buttons">
                <button onClick={prevMonth} className="btn-icon"><ChevronLeft size={20} /></button>
                <button onClick={nextMonth} className="btn-icon"><ChevronRight size={20} /></button>
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => {
              setAppDate(selectedDate.toISOString().split('T')[0]);
              setIsAppointmentModalOpen(true);
            }}>
              <Plus size={18} />
              <span>Agendar Sessão</span>
            </button>
          </div>

          <div className="calendar-grid-header">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="calendar-grid-body">
            {days.map((dayItem, index) => {
              const isToday = new Date().toDateString() === dayItem.date.toDateString();
              const isSelected = selectedDate.toDateString() === dayItem.date.toDateString();
              const dayApps = getAppointmentsForDate(dayItem.date);

              return (
                <div 
                  key={index} 
                  className={`calendar-cell ${dayItem.isCurrentMonth ? '' : 'outside-month'} ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
                  onClick={() => setSelectedDate(dayItem.date)}
                >
                  <span className="day-number">{dayItem.date.getDate()}</span>
                  
                  <div className="cell-appointments">
                    {dayApps.slice(0, 3).map((app) => (
                      <div 
                        key={app.id} 
                        className={`cell-app-bullet app-${app.status}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(app);
                        }}
                        title={`${app.patient?.name} - ${new Date(app.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                      >
                        {new Date(app.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} {app.patient?.name.split(' ')[0]}
                      </div>
                    ))}
                    {dayApps.length > 3 && (
                      <span className="more-apps-indicator">+{dayApps.length - 3} mais</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Lateral: Consultas do Dia Selecionado */}
        <div className="agenda-day-details card">
          <div className="day-header">
            <h3>Consultas do Dia</h3>
            <span className="selected-day-lbl">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <span className="spinner"></span>
            </div>
          ) : selectedDateAppointments.length === 0 ? (
            <div className="empty-day-state">
              <CalendarIcon size={32} className="empty-day-icon" />
              <p>Nenhuma consulta agendada para este dia.</p>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                setAppDate(selectedDate.toISOString().split('T')[0]);
                setIsAppointmentModalOpen(true);
              }}>
                Agendar para hoje
              </button>
            </div>
          ) : (
            <div className="day-appointments-list">
              {selectedDateAppointments.map((app) => {
                const appTimeStr = new Date(app.date_time).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div 
                    key={app.id} 
                    className={`day-app-card status-border-${app.status}`}
                    onClick={() => handleOpenDetail(app)}
                  >
                    <div className="day-app-time">
                      <Clock size={14} />
                      <span>{appTimeStr} ({app.duration_minutes} min)</span>
                    </div>
                    <div className="day-app-patient">
                      <User size={16} className="patient-avatar-icon" />
                      <h4>{app.patient?.name || 'Paciente'}</h4>
                    </div>
                    <div className="day-app-footer">
                      {getStatusBadge(app.status)}
                      <div className="day-app-actions">
                        <button 
                          className="action-icon-btn whatsapp-color"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendWhatsAppReminder(app);
                          }}
                          title="Enviar lembrete pelo WhatsApp"
                        >
                          <MessageSquare size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: MARCAR CONSULTA */}
      {isAppointmentModalOpen && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal-content animate-slide-up">
              <div className="modal-header">
                <h3>Marcar Consulta / Sessão</h3>
                <button className="close-modal-btn" onClick={() => setIsAppointmentModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateAppointment}>
                <div className="modal-body">
                  {patients.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                        É necessário ter pelo menos um paciente cadastrado para realizar agendamentos.
                      </p>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        Cadastre o paciente primeiro na aba de Pacientes!
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className="form-group">
                        <label className="form-label">Selecione o Paciente</label>
                        <select 
                          className="form-control"
                          value={selectedPatientId}
                          onChange={(e) => setSelectedPatientId(e.target.value)}
                          required
                        >
                          <option value="">Selecione...</option>
                          {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-2 gap-4">
                        <div className="form-group">
                          <label className="form-label">Data da Consulta</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            value={appDate}
                            onChange={(e) => setAppDate(e.target.value)}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Horário de Início</label>
                          <input 
                            type="time" 
                            className="form-control" 
                            value={appTime}
                            onChange={(e) => setAppTime(e.target.value)}
                            required
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Duração Estimada (minutos)</label>
                        <select 
                          className="form-control"
                          value={appDuration}
                          onChange={(e) => setAppDuration(Number(e.target.value))}
                        >
                          <option value={30}>30 minutos</option>
                          <option value={45}>45 minutos</option>
                          <option value={50}>50 minutos (Padrão)</option>
                          <option value={60}>60 minutos / 1 hora</option>
                          <option value={90}>90 minutos</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Queixas Clínicas / Notas do Agendamento</label>
                        <textarea 
                          className="form-control" 
                          rows={3} 
                          placeholder="Ex: Primeira consulta, alinhar metas..."
                          value={appNotes}
                          onChange={(e) => setAppNotes(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setIsAppointmentModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={patients.length === 0}>
                    Salvar Consulta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL: DETALHES E AÇÕES DA CONSULTA */}
      {isDetailModalOpen && selectedAppointment && (
        <Portal>
          <div className="modal-overlay">
            <div className="modal-content animate-slide-up" style={{ maxWidth: '450px' }}>
              <div className="modal-header">
                <h3>Detalhes da Consulta</h3>
                <button className="close-modal-btn" onClick={() => setIsDetailModalOpen(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-profile-block">
                  <div className="avatar-circle">
                    {selectedAppointment.patient?.name.charAt(0).toUpperCase()}
                  </div>
                  <h4>{selectedAppointment.patient?.name}</h4>
                  {getStatusBadge(selectedAppointment.status)}
                </div>

                <div className="detail-list" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                    <Clock size={16} />
                    <span style={{ fontSize: '0.9rem' }}>
                      {new Date(selectedAppointment.date_time).toLocaleDateString('pt-BR')} às {new Date(selectedAppointment.date_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ({selectedAppointment.duration_minutes} min)
                    </span>
                  </div>
                  {selectedAppointment.patient?.phone && (
                    <div style={{ display: 'flex', gap: '8px', color: 'var(--text-muted)' }}>
                      <Phone size={16} />
                      <span style={{ fontSize: '0.9rem' }}>{selectedAppointment.patient.phone}</span>
                    </div>
                  )}
                  {selectedAppointment.notes && (
                    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-muted)', borderLeft: '3px solid var(--primary-light)' }}>
                      <strong>Observações:</strong>
                      <p style={{ marginTop: '4px' }}>{selectedAppointment.notes}</p>
                    </div>
                  )}
                </div>

                <hr style={{ margin: '20px 0', borderColor: 'var(--border-color)' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Alterar Status do Atendimento</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'completed')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--success)' }}
                    >
                      <CheckCircle size={14} /> Realizado
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'no_show')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--warning)' }}
                    >
                      <AlertTriangle size={14} /> Falta / No-Show
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'canceled')}
                      className="btn btn-secondary btn-sm"
                      style={{ color: 'var(--error)' }}
                    >
                      <XCircle size={14} /> Cancelar
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(selectedAppointment.id, 'scheduled')}
                      className="btn btn-secondary btn-sm"
                    >
                      Agendado
                    </button>
                  </div>

                  <hr style={{ margin: '10px 0', borderColor: 'var(--border-color)' }} />

                  <button 
                    onClick={() => handleSendWhatsAppReminder(selectedAppointment)}
                    className="btn btn-primary"
                    style={{ width: '100%', backgroundColor: '#25d366', borderColor: '#25d366', color: 'white', boxShadow: 'none' }}
                  >
                    <MessageSquare size={16} /> Lembrete WhatsApp
                  </button>
                  
                  <button 
                    onClick={() => handleDeleteAppointment(selectedAppointment.id)}
                    className="btn btn-danger"
                    style={{ width: '100%' }}
                  >
                    <Trash2 size={16} /> Excluir Agendamento
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <style>{`
        .agenda-page {
          width: 100%;
        }

        .agenda-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 32px;
          align-items: start;
        }

        /* Calendário Principal */
        .calendar-main {
          padding: 24px;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .calendar-title-nav {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .calendar-month-year {
          font-size: 1.4rem;
          font-weight: 700;
          text-transform: capitalize;
        }

        .nav-buttons {
          display: flex;
          gap: 4px;
        }

        .btn-icon {
          background: transparent;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-sm);
          padding: 6px;
          cursor: pointer;
          color: var(--text-muted);
          transition: var(--transition-fast);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon:hover {
          background-color: var(--bg-hover);
          color: var(--primary);
          border-color: var(--primary-light);
        }

        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          font-weight: 600;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .calendar-grid-body {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-auto-rows: minmax(110px, auto);
          border-left: 1px solid var(--border-color);
          border-top: 1px solid var(--border-color);
        }

        .calendar-cell {
          background-color: var(--bg-card);
          border-right: 1px solid var(--border-color);
          border-bottom: 1px solid var(--border-color);
          padding: 8px;
          cursor: pointer;
          transition: var(--transition-fast);
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }

        .calendar-cell:hover {
          background-color: var(--bg-hover);
        }

        .calendar-cell.outside-month {
          background-color: #fafbfb;
          color: #c3cfc7;
        }

        .calendar-cell.selected {
          box-shadow: inset 0 0 0 2px var(--primary);
          z-index: 10;
        }

        .calendar-cell.today {
          background-color: #f1f7f2;
        }

        .calendar-cell.today .day-number {
          background-color: var(--primary);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .day-number {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-main);
          align-self: flex-start;
        }

        .outside-month .day-number {
          color: #c3cfc7;
        }

        .cell-appointments {
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex: 1;
          overflow-y: hidden;
        }

        .cell-app-bullet {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 3px 6px;
          border-radius: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          border-left: 3px solid transparent;
        }

        .cell-app-bullet.app-scheduled {
          background-color: var(--info-bg);
          color: var(--info);
          border-left-color: var(--info);
        }

        .cell-app-bullet.app-completed {
          background-color: var(--success-bg);
          color: var(--success);
          border-left-color: var(--success);
        }

        .cell-app-bullet.app-canceled {
          background-color: var(--error-bg);
          color: var(--error);
          border-left-color: var(--error);
        }

        .cell-app-bullet.app-no_show {
          background-color: var(--warning-bg);
          color: var(--warning);
          border-left-color: var(--warning);
        }

        .more-apps-indicator {
          font-size: 0.65rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-top: 2px;
          align-self: center;
        }

        /* Consultas do Dia (Lado Direito) */
        .agenda-day-details {
          padding: 24px;
          min-height: 480px;
        }

        .day-header {
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .day-header h3 {
          font-size: 1.15rem;
        }

        .selected-day-lbl {
          font-size: 0.82rem;
          color: var(--primary);
          font-weight: 600;
          text-transform: capitalize;
        }

        .empty-day-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          text-align: center;
          color: var(--text-muted);
          gap: 12px;
        }

        .empty-day-icon {
          color: var(--border-color-hover);
        }

        .day-appointments-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .day-app-card {
          padding: 16px;
          background-color: var(--bg-main);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--border-color);
          cursor: pointer;
          transition: var(--transition-smooth);
        }

        .day-app-card:hover {
          transform: translateX(3px);
          background-color: #ebf1ec;
        }

        .status-border-scheduled { border-left-color: var(--info); }
        .status-border-completed { border-left-color: var(--success); }
        .status-border-canceled { border-left-color: var(--error); }
        .status-border-no_show { border-left-color: var(--warning); }

        .day-app-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .day-app-patient {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .patient-avatar-icon {
          color: var(--primary);
        }

        .day-app-patient h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .day-app-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .day-app-actions {
          display: flex;
          gap: 8px;
        }

        .action-icon-btn {
          border: 1px solid var(--border-color);
          background-color: white;
          padding: 6px;
          border-radius: var(--radius-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          transition: var(--transition-fast);
        }

        .action-icon-btn:hover {
          color: var(--primary);
          border-color: var(--primary-light);
          background-color: var(--bg-hover);
        }

        .action-icon-btn.whatsapp-color:hover {
          background-color: #eafbee;
          color: #25d366;
          border-color: rgba(37, 211, 102, 0.3);
        }

        .detail-profile-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }

        @media (max-width: 992px) {
          .agenda-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
