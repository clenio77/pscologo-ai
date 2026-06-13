import { describe, it, expect } from 'vitest';
import { formatPhone, calculateAge } from '../utils/formatters';

describe('formatPhone', () => {
  it('deve retornar apenas os digitos se forem menores ou iguais a 2', () => {
    expect(formatPhone('11')).toBe('11');
  });

  it('deve formatar o prefixo DDD se tiver entre 3 e 6 digitos', () => {
    expect(formatPhone('1199')).toBe('(11) 99');
  });

  it('deve formatar telefone fixo com 10 digitos', () => {
    expect(formatPhone('1133445566')).toBe('(11) 3344-5566');
  });

  it('deve formatar celular com 11 digitos', () => {
    expect(formatPhone('11998877665')).toBe('(11) 99887-7665');
  });
});

describe('calculateAge', () => {
  it('deve retornar "Idade não informada" se nenhuma data for fornecida', () => {
    expect(calculateAge()).toBe('Idade não informada');
  });

  it('deve calcular corretamente a idade com base na data de nascimento', () => {
    const today = new Date();
    const birthYear = today.getFullYear() - 25;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const birthDateStr = `${birthYear}-${month}-${day}`;
    
    expect(calculateAge(birthDateStr)).toBe('25 anos');
  });
});
