import { GoogleGenAI } from '@google/genai';
import type { Patient, Evolution, PatientForm, PatientTest } from './api';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// AVISO DE SEGURANÇA: Chaves de API expostas no client-side podem ser extraídas do bundle.
// Em ambiente de produção, esta chamada é feita via Supabase Edge Function ('gemini') para máxima segurança.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

// Inicializa o GenAI apenas se a chave estiver presente para uso como fallback em dev
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Tipos de Análise
export type AnalysisType = 'freud' | 'tcc' | 'rogers' | 'synthesis';

interface AnonymizedData {
  anamnesis: string;
  clinicalHistory: string;
  age: number | string;
}

// Helpers de Anonimização
const anonymizeData = (patient: Patient, forms: PatientForm[], evolutions: Evolution[]): AnonymizedData => {
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

const getPromptForType = (type: AnalysisType, data: AnonymizedData): string => {
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

/**
 * Helper centralizado para chamar a API da Gemini.
 * Tenta primeiro via Supabase Edge Function (método seguro de produção).
 * Se o Supabase não estiver configurado ou ocorrer algum erro, tenta usar a chave local do client-side como fallback de dev.
 */
const callGemini = async (
  prompt: string, 
  options: { model?: string; temperature?: number; responseMimeType?: string }
): Promise<string> => {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('gemini', {
        body: {
          prompt,
          model: options.model,
          temperature: options.temperature,
          responseMimeType: options.responseMimeType
        }
      });

      if (error) {
        throw error;
      }

      if (data && typeof data.text === 'string') {
        return data.text;
      }
      
      throw new Error('A Edge Function retornou um payload sem o campo "text".');
    } catch (edgeError) {
      console.warn('Erro ao chamar Supabase Edge Function. Tentando fallback local com VITE_GEMINI_API_KEY...', edgeError);
      if (ai) {
        return await callGeminiLocal(prompt, options);
      }
      throw new Error('Falha na comunicação com a Edge Function do Supabase e nenhum fallback local configurado.');
    }
  }

  if (ai) {
    return await callGeminiLocal(prompt, options);
  }

  throw new Error('Nenhum método de comunicação com a IA configurado (Supabase ausente e VITE_GEMINI_API_KEY não informada).');
};

const callGeminiLocal = async (
  prompt: string, 
  options: { model?: string; temperature?: number; responseMimeType?: string }
): Promise<string> => {
  if (!ai) {
    throw new Error('Cliente local do Gemini não está inicializado.');
  }

  const response = await ai.models.generateContent({
    model: options.model || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: options.temperature ?? 0.2,
      responseMimeType: options.responseMimeType,
    }
  });

  if (!response.text) {
    throw new Error('Resposta vazia do modelo local da Gemini.');
  }

  return response.text;
};

export const generateAnalysis = async (
  type: AnalysisType,
  patient: Patient,
  forms: PatientForm[],
  evolutions: Evolution[]
): Promise<string> => {
  const anonymizedData = anonymizeData(patient, forms, evolutions);
  const prompt = getPromptForType(type, anonymizedData);

  try {
    return await callGemini(prompt, { model: 'gemini-2.5-flash', temperature: 0.3 });
  } catch (error) {
    console.error('Erro ao gerar análise com IA:', error);
    throw new Error('Falha ao comunicar com a IA. Verifique as configurações de chave e rede.');
  }
};

// ==========================================
// MÓDULO 4 — RADAR DE PROGRESSO
// ==========================================

export interface ProgressDimension {
  dimension: string;
  initialScore: number;
  currentScore: number;
  explanation: string;
}

export const generateProgressRadar = async (
  patient: Patient,
  evolutions: Evolution[]
): Promise<ProgressDimension[]> => {
  if (evolutions.length < 2) {
    throw new Error('São necessárias pelo menos 2 sessões para avaliar o progresso.');
  }

  // Sort evolutions chronologically
  const sorted = [...evolutions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  
  // Anonimização do nome do paciente nas sessões
  const firstName = patient.name.split(' ')[0];
  const regexName = new RegExp(firstName, 'gi');

  const firstSessions = sorted.slice(0, 2).map(e => {
    const content = e.content.replace(regexName, '[PACIENTE]');
    return `Data: ${e.session_date}\nConteúdo: ${content}`;
  }).join('\n\n');

  const recentSessions = sorted.slice(-2).map(e => {
    const content = e.content.replace(regexName, '[PACIENTE]');
    return `Data: ${e.session_date}\nConteúdo: ${content}`;
  }).join('\n\n');

  const prompt = `
Você é um assistente de inteligência artificial atuando como psicólogo clínico.
O objetivo é avaliar o progresso terapêutico do paciente ([PACIENTE]) comparando as primeiras sessões com as sessões mais recentes.

PRIMEIRAS SESSÕES:
${firstSessions}

SESSÕES MAIS RECENTES:
${recentSessions}

Avalie o paciente nas seguintes 6 dimensões psicológicas:
1. Autoconhecimento
2. Regulação Emocional
3. Resiliência
4. Relações Interpessoais
5. Autoestima
6. Engajamento Terapêutico

Para cada dimensão, atribua uma nota de 0 a 10 para o estado inicial (primeiras sessões) e para o estado atual (sessões mais recentes).
Adicione uma breve explicação (1-2 frases) justificando as notas.

Responda EXCLUSIVAMENTE em formato JSON (array de objetos).
Formato esperado:
[
  {
    "dimension": "Nome da Dimensão",
    "initialScore": 4,
    "currentScore": 7,
    "explanation": "Breve justificativa..."
  }
]
  `;

  try {
    const responseText = await callGemini(prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(responseText) as ProgressDimension[];
    return parsed;
  } catch (error) {
    console.error('Erro ao gerar radar de progresso:', error);
    throw new Error('Falha ao gerar radar de progresso.');
  }
};

// ==========================================
// MÓDULO 3 — ANÁLISE DE SENTIMENTO
// ==========================================

export interface EmotionScores {
  ansiedade: number;
  tristeza: number;
  raiva: number;
  medo: number;
  alegria: number;
  esperanca: number;
  culpa: number;
  autoestima: number;
}

export interface SessionSentiment {
  session_date: string;
  emotions: EmotionScores;
  dominant_emotion: string;
  summary: string;
}

export const generateSentimentAnalysis = async (
  patient: Patient,
  evolutions: Evolution[]
): Promise<SessionSentiment[]> => {
  if (evolutions.length === 0) {
    throw new Error('Nenhuma sessão registrada para análise de sentimento.');
  }

  const firstName = patient.name.split(' ')[0];
  const regexName = new RegExp(firstName, 'gi');

  const sessionsText = evolutions.map((evo, i) => {
    const content = evo.content.replace(regexName, '[PACIENTE]');
    return `SESSÃO ${i + 1} (Data: ${evo.session_date}):\n${content}`;
  }).join('\n\n---\n\n');

  const prompt = `
Você é um assistente de inteligência artificial especializado em psicologia clínica.
Analise as sessões terapêuticas abaixo e identifique as emoções predominantes em cada uma.

REGRAS:
- Responda EXCLUSIVAMENTE no formato JSON, sem markdown, sem explicações extras.
- Para cada sessão, atribua valores de 0 a 10 para cada emoção (onde 0 = ausente e 10 = muito intenso).
- Identifique a emoção dominante de cada sessão.
- Escreva um resumo emocional curto (1 frase) para cada sessão.
- O paciente é anônimo. Use "[PACIENTE]" para referências.

EMOÇÕES A AVALIAR: ansiedade, tristeza, raiva, medo, alegria, esperanca, culpa, autoestima

SESSÕES:
${sessionsText}

FORMATO DE RESPOSTA (JSON array):
[
  {
    "session_date": "YYYY-MM-DD",
    "emotions": { "ansiedade": 0, "tristeza": 0, "raiva": 0, "medo": 0, "alegria": 0, "esperanca": 0, "culpa": 0, "autoestima": 0 },
    "dominant_emotion": "nome_da_emocao",
    "summary": "Resumo emocional da sessão em 1 frase."
  }
]
`;

  try {
    const responseText = await callGemini(prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(responseText) as SessionSentiment[];
    return parsed;
  } catch (error) {
    console.error('Erro ao gerar análise de sentimento:', error);
    throw new Error('Falha ao gerar análise de sentimento.');
  }
};

// ==========================================
// MÓDULO 4 — GERADOR DE DOCUMENTOS OFICIAIS (CFP)
// ==========================================

export type CFPDocumentType = 'declaracao' | 'atestado' | 'relatorio' | 'laudo';

export interface CFPDocumentDraft {
  procedimento?: string;
  analise?: string;
  conclusao?: string;
}

export const generateCFPDocument = async (
  type: CFPDocumentType,
  patient: Patient,
  evolutions: Evolution[],
  tests: PatientTest[]
): Promise<CFPDocumentDraft> => {
  if (type === 'declaracao') {
    return {};
  }

  const sorted = [...evolutions].sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());
  
  // Anonimização do nome do paciente nas sessões e testes
  const firstName = patient.name.split(' ')[0];
  const regexName = new RegExp(firstName, 'gi');

  const sessionsContext = sorted.map((e, i) => {
    const content = e.content.replace(regexName, '[PACIENTE]');
    return `Sessão ${i+1} (${e.session_date}): ${content}`;
  }).join('\n\n');

  const testsContext = tests.map(t => {
    const objective = (t.objective || '').replace(regexName, '[PACIENTE]');
    const resultsSummary = (t.results_summary || '').replace(regexName, '[PACIENTE]');
    return `Teste: ${t.test_name} (Data: ${t.application_date})\nObjetivo: ${objective}\nResultados: ${resultsSummary}`;
  }).join('\n\n');

  let prompt = `
Você é um psicólogo clínico elaborando um documento oficial baseado na Resolução CFP nº 06/2019.
O paciente é referenciado como [PACIENTE].
Você deve redigir os campos solicitados de forma estritamente profissional, impessoal e técnica.
NUNCA transcreva as sessões literalmente. Agrupe as informações em uma síntese clínica sistêmica.

CONTEXTO DAS SESSÕES:
${sessionsContext || 'Nenhuma sessão registrada.'}

TESTES PSICOLÓGICOS (FONTES FUNDAMENTAIS):
${testsContext || 'Nenhum teste registrado.'}
`;

  if (type === 'atestado') {
    prompt += `
Documento: ATESTADO PSICOLÓGICO
Gere apenas o texto para a "Descrição das condições psicológicas" e a conclusão do documento.
Foque em atestar um estado psicológico atual com base nas sessões. 
Seja muito breve e objetivo.
Retorne um JSON: { "conclusao": "texto gerado..." }`;
  } else if (type === 'relatorio') {
    prompt += `
Documento: RELATÓRIO PSICOLÓGICO
Gere os textos para "Procedimento", "Análise" e "Conclusão".
- Procedimento: Descreva de forma genérica como os atendimentos ocorreram, número de sessões e abordagens técnicas utilizadas. (Incorpore os testes aplicados, se houver).
- Análise: Síntese da evolução do caso, principais construtos observados. Baseado nos dados coletados, sem expor intimidades desnecessárias.
- Conclusão: Encaminhamentos e orientações sugeridas.
Retorne um JSON: { "procedimento": "...", "analise": "...", "conclusao": "..." }`;
  } else if (type === 'laudo') {
    prompt += `
Documento: LAUDO PSICOLÓGICO
Gere os textos para "Procedimento", "Análise" e "Conclusão".
Este documento requer fundamentação mais técnica, focado nos resultados da avaliação psicológica (testes) e hipótese diagnóstica.
- Procedimento: Descreva as técnicas e testes utilizados detalhadamente.
- Análise: Análise cruzada das sessões com os testes aplicados, apresentando fundamentação técnica.
- Conclusão: Diagnóstico, prognóstico, hipótese diagnóstica e sugestão terapêutica.
Retorne um JSON: { "procedimento": "...", "analise": "...", "conclusao": "..." }`;
  }

  try {
    const responseText = await callGemini(prompt, {
      model: 'gemini-2.5-flash',
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    return JSON.parse(responseText) as CFPDocumentDraft;
  } catch (error) {
    console.error('Erro ao gerar rascunho de documento:', error);
    throw new Error('Falha ao gerar documento oficial.');
  }
};
