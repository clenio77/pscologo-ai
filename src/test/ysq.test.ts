import { describe, it, expect } from 'vitest';
import { ysqMapping } from '../utils/ysqQuestions';

describe('YSQ-L3 Cálculo de Escores', () => {
  it('deve possuir mapeamento consistente para os 18 esquemas', () => {
    const schemas = Object.keys(ysqMapping);
    expect(schemas).toHaveLength(18);
    
    // Todos os esquemas devem ter listas de perguntas associadas
    schemas.forEach(schema => {
      expect(ysqMapping[schema]).toBeInstanceOf(Array);
      expect(ysqMapping[schema].length).toBeGreaterThan(0);
    });
  });

  it('deve calcular médias e criticidade de forma exata para mock de respostas uniformes', () => {
    // Simulando que o paciente respondeu "6" (Descreve perfeitamente) para todas as perguntas do EID Privação Emocional
    const mockResponses: Record<number, number> = {};
    const peIndices = ysqMapping['pe'];
    
    peIndices.forEach(idx => {
      mockResponses[idx] = 6;
    });

    let sum = 0;
    let criticalCount = 0;
    
    peIndices.forEach(idx => {
      const val = mockResponses[idx];
      sum += val;
      if (val === 5 || val === 6) {
        criticalCount++;
      }
    });

    const average = sum / peIndices.length;

    expect(average).toBe(6.00);
    expect(criticalCount).toBe(peIndices.length);
  });

  it('deve contar corretamente respostas severas (apenas 5 e 6)', () => {
    const mockResponses: Record<number, number> = {
      0: 6, // Crítico
      1: 5, // Crítico
      2: 4, // Não crítico
      3: 3, // Não crítico
      4: 2, // Não crítico
      5: 1, // Não crítico
      6: 6, // Crítico
      7: 4, // Não crítico
      8: 5  // Crítico
    };

    const peIndices = ysqMapping['pe']; // Possui 9 perguntas (índices 0 a 8)
    
    let sum = 0;
    let criticalCount = 0;
    
    peIndices.forEach(idx => {
      const val = mockResponses[idx] || 1;
      sum += val;
      if (val === 5 || val === 6) {
        criticalCount++;
      }
    });

    const average = sum / peIndices.length;

    // Soma = 6 + 5 + 4 + 3 + 2 + 1 + 6 + 4 + 5 = 36
    // Média = 36 / 9 = 4
    // Críticos (5 ou 6) = 0, 1, 6, 8 -> 4 itens
    expect(average).toBe(4.00);
    expect(criticalCount).toBe(4);
  });
});
