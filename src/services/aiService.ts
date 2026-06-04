import { GoogleGenAI } from '@google/genai';
import type { Patient, Evolution, PatientForm } from './api';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializa o GenAI apenas se a chave estiver presente
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Tipos de Análise
export type AnalysisType = 'freud' | 'tcc' | 'rogers' | 'synthesis';

// Helpers de Anonimização
const anonymizeData = (patient: Patient, forms: PatientForm[], evolutions: Evolution[]) => {
  // Substitui nome real por "[PACIENTE]"
  const clinicalHistory = evolutions.map(e => `Data: ${new Date(e.session_date).toLocaleDateString()} - Relato: ${e.content}`).join('\n\n');
  
  const anamnesis = forms.map(f => {
    const answersStr = Object.entries(f.answers)
      .map(([key, val]) => `${key}: ${val}`)
      .join('\n');
    return `Formulário respondido em ${new Date(f.filled_at).toLocaleDateString()}:\n${answersStr}`;
  }).join('\n\n');

  // Removendo possíveis menções diretas ao primeiro nome do paciente
  const firstName = patient.name.split(' ')[0];
  const regexName = new RegExp(firstName, 'gi');

  return {
    anamnesis: anamnesis.replace(regexName, '[PACIENTE]'),
    clinicalHistory: clinicalHistory.replace(regexName, '[PACIENTE]'),
    age: patient.birth_date ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear() : 'Não informada',
  };
};

const getPromptForType = (type: AnalysisType, data: any): string => {
  const baseContext = `
Você é um assistente de inteligência artificial atuando como um Supervisor Clínico em Psicologia.
Sua função é auxiliar o terapeuta (psicólogo) analisando dados clínicos de forma reflexiva e teórica.
DIRETRIZES ÉTICAS (CFP - Conselho Federal de Psicologia):
- Você NÃO PODE dar diagnósticos médicos ou psiquiátricos definitivos (CID/DSM).
- Você DEVE sugerir hipóteses clínicas e correlações teóricas apenas.
- Sua linguagem deve ser técnica, neutra e profissional.
- O paciente é anônimo. Refira-se a ele como "o paciente" ou "[PACIENTE]".

DADOS CLÍNICOS DO PACIENTE (Idade: ${data.age} anos):
--- ANAMNESE ---
${data.anamnesis || 'Nenhum formulário de anamnese disponível.'}

--- EVOLUÇÕES (SESSÕES) ---
${data.clinicalHistory || 'Nenhum registro de sessão disponível.'}

---
`;

  switch (type) {
    case 'freud':
      return `${baseContext}
TAREFA: Com base nos dados acima, elabore uma ANÁLISE PSICODINÂMICA (Baseada em Sigmund Freud e Psicanálise).
Foque em:
1. Possíveis mecanismos de defesa evidenciados no discurso ou comportamento.
2. Dinâmica pulsional e conflitos inconscientes latentes.
3. Aspectos da transferência ou resistências iniciais sugeridas.
Seja conciso (máximo 3 parágrafos) e escreva em formato de "Rascunho de Hipótese" para o terapeuta validar.`;
    
    case 'tcc':
      return `${baseContext}
TAREFA: Com base nos dados acima, elabore uma ANÁLISE COGNITIVO-COMPORTAMENTAL (Baseada em Aaron Beck / TCC).
Foque em:
1. Hipóteses sobre Crenças Centrais (Desamparo, Desamor, Desvalor) e Crenças Intermediárias.
2. Identificação de Pensamentos Automáticos e Distorções Cognitivas prevalentes no relato.
3. Estratégias compensatórias e possíveis alvos de reestruturação cognitiva.
Seja conciso (máximo 3 parágrafos) e escreva em formato de "Rascunho de Hipótese" para o terapeuta validar.`;

    case 'rogers':
      return `${baseContext}
TAREFA: Com base nos dados acima, elabore uma ANÁLISE HUMANISTA-FENOMENOLÓGICA (Baseada em Carl Rogers / Abordagem Centrada na Pessoa).
Foque em:
1. Incongruências entre o "Self Real" (como o paciente se vê) e o "Self Ideal" (como gostaria de ser).
2. Condições de valor introjetadas e nível de autoaceitação/consideração positiva incondicional de si.
3. Tendência atualizante: áreas onde o paciente mostra potencial para crescimento e autonomia.
Seja conciso (máximo 3 parágrafos) e escreva em formato de "Rascunho de Hipótese" para o terapeuta validar.`;

    case 'synthesis':
      return `${baseContext}
TAREFA: Com base nos dados acima, elabore uma SÍNTESE CLÍNICA INTEGRADA.
Foque em:
1. Resumo do quadro geral do paciente.
2. Principais pontos de atenção ou risco relatados.
3. Objetivos terapêuticos sugeridos a curto e médio prazo.
Esta síntese serve como um resumo executivo para o prontuário. Seja conciso e evite repetições teóricas, focando na utilidade prática.`;
  }
};

export const generateAnalysis = async (
  type: AnalysisType,
  patient: Patient,
  forms: PatientForm[],
  evolutions: Evolution[]
): Promise<string> => {
  if (!ai) {
    throw new Error('Chave da API do Gemini (VITE_GEMINI_API_KEY) não configurada no .env.local');
  }

  const anonymizedData = anonymizeData(patient, forms, evolutions);
  const prompt = getPromptForType(type, anonymizedData);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.3, // Menos alucinação, respostas mais precisas/teóricas
      }
    });

    if (!response.text) {
      throw new Error('Resposta vazia da IA.');
    }
    
    return response.text;
  } catch (error) {
    console.error('Erro ao gerar análise com IA:', error);
    throw new Error('Falha ao comunicar com o Google Gemini. Verifique sua chave de API e a conexão de rede.');
  }
};
