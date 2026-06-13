import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendWhatsAppReminder } from '../utils/whatsapp';
import type { Appointment } from '../services/api';

describe('sendWhatsAppReminder', () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  it('deve retornar false se o agendamento não possuir dados do paciente', () => {
    const mockApp = {
      id: '1',
      date_time: new Date().toISOString(),
      duration_minutes: 50,
      status: 'scheduled'
    } as Appointment;

    const result = sendWhatsAppReminder(mockApp);
    expect(result).toBe(false);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('deve retornar false se o paciente não possuir telefone', () => {
    const mockApp = {
      id: '1',
      date_time: new Date().toISOString(),
      duration_minutes: 50,
      status: 'scheduled',
      patient: {
        id: 'p1',
        name: 'Maria Clara',
        phone: ''
      }
    } as unknown as Appointment;

    const result = sendWhatsAppReminder(mockApp);
    expect(result).toBe(false);
    expect(window.open).not.toHaveBeenCalled();
  });

  it('deve chamar window.open com a URL correta e retornar true se dados forem válidos', () => {
    const date = new Date();
    date.setDate(date.getDate() + 1); // Dia de amanhã
    
    const mockApp = {
      id: '1',
      date_time: date.toISOString(),
      duration_minutes: 50,
      status: 'scheduled',
      patient: {
        id: 'p1',
        name: 'Maria Clara',
        phone: '(11) 99999-8888'
      }
    } as unknown as Appointment;

    const result = sendWhatsAppReminder(mockApp, 'Dr. Clênio');
    expect(result).toBe(true);
    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://web.whatsapp.com/send?phone=5511999998888&text='),
      '_blank'
    );
  });
});
