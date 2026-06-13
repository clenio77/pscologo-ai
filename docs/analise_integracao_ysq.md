# 🧠 Análise Técnica e Conceitual: Integração do YSQ-L3 (Young Schema Questionnaire)

Este documento apresenta a análise teórica e a especificação técnica para a inclusão do **YSQ-L3 (Forma Longa, 3ª Edição)** no ecossistema da plataforma **Agenda Clinical**.

---

## 📑 1. Origem e Aplicabilidade do YSQ-L3

### Origem
O **Young Schema Questionnaire (YSQ)** foi desenvolvido por **Jeffrey Young**, Ph.D., o criador da **Terapia do Esquema (TE)**. A Terapia do Esquema surgiu na década de 1990 como uma resposta integrativa para pacientes que não respondiam satisfatoriamente à Terapia Cognitivo-Comportamental (TCC) tradicional (especialmente aqueles com transtornos de personalidade ou padrões de sofrimento crônicos e rígidos).

O YSQ-L3 é a terceira revisão da forma longa do inventário, amplamente validado internacionalmente e no Brasil por pesquisadores e clínicos da área de psicologia cognitivo-comportamental.

### Aplicabilidade
*   **Identificação de EIDs (Esquemas Iniciais Desadaptativos)**: Avalia a presença e a severidade de 18 padrões emocionais e cognitivos autoderrotantes que se originam de necessidades emocionais não atendidas na infância.
*   **Conceitualização Clínica**: Auxilia o terapeuta a traçar o perfil de vulnerabilidade do paciente, mapeando as crenças profundas subjacentes aos sintomas apresentados (ex: depressão, ansiedade, dificuldades interpessoais).
*   **Formulação de Caso e Estratégia de Mudança**: Orienta o plano terapêutico para a reestruturação cognitiva, técnicas vivenciais (como imaginação e diálogo de cadeiras) e a quebra de padrões comportamentais disfuncionais.

---

## 🗂️ 2. Mapeamento Clínico de Itens e Esquemas

O questionário é composto por **232 itens**, avaliados em uma escala Likert de 1 a 6:
*   **1** = Inteiramente falsa
*   **2** = Em grande parte falsa
*   **3** = Levemente mais verdadeira do que falsa
*   **4** = Moderadamente verdadeira
*   **5** = Em grande parte verdadeira
*   **6** = Descreve perfeitamente

Os itens são mapeados nos **18 Esquemas Iniciais Desadaptativos (EIDs)**, que por sua vez são agrupados em **5 Grandes Domínios** de necessidades emocionais básicas insatisfeitas:

### Domínio I: Desconexão e Rejeição
*Expectativa de que as necessidades de segurança, estabilidade, carinho, empatia e aceitação não serão satisfeitas de forma consistente.*
*   **PE — Privação Emocional** (Itens 1 a 9)
*   **AB — Abandono / Instabilidade** (Itens 10 a 26)
*   **DA — Desconfiança / Abuso** (Itens 27 a 43)
*   **IS — Isolamento Social / Alienação** (Itens 44 a 53)
*   **DV — Defectividade / Vergonha** (Itens 54 a 68)

### Domínio II: Autonomia e Desempenho Prejudicados
*Expectativas sobre si mesmo e o ambiente que interferem na capacidade de se separar, sobreviver, funcionar independentemente e ter bom desempenho.*
*   **FR — Fracasso** (Itens 69 a 77)
*   **DE — Dependência / Incompetência** (Itens 78 a 92)
*   **VU — Vulnerabilidade ao Dano ou Doença** (Itens 93 a 104)
*   **EM — Emaranhamento / Self Subdesenvolvido** (Itens 105 a 115)

### Domínio III: Limites Prejudicados
*Deficiência nos limites internos, responsabilidade com os outros ou orientação para metas a longo prazo, gerando dificuldades de respeitar os direitos alheios ou cooperar.*
*   **ME — Merecimento / Grandiosidade** (Itens 168 a 178)
*   **AI — Autocontrole / Autodisciplina Insuficientes** (Itens 179 a 193)

### Domínio IV: Orientação para o Outro
*Foco excessivo nos desejos, sentimentos e respostas dos outros, em detrimento das próprias necessidades, para obter aprovação ou evitar retaliação.*
*   **SB — Subjugação** (Itens 116 a 125)
*   **AS — Autossacrifício** (Itens 126 a 142)
*   **BA — Busca de Aprovação / Reconhecimento** (Itens 194 a 207)

### Domínio V: Supervigilância e Inibição
*Supressão excessiva de sentimentos espontâneos ou obediência a regras rígidas internalizadas sobre desempenho e comportamento ético, em detrimento da felicidade ou saúde.*
*   **IE — Inibição Emocional** (Itens 143 a 151)
*   **PI — Padrões Inflexíveis / Postura Crítica** (Itens 152 a 167)
*   **NP — Negativismo / Pessimismo** (Itens 208 a 218)
*   **PU — Punibilidade** (Itens 219 a 232)

---

## 🗄️ 3. Modelo Físico de Dados (Supabase/PostgreSQL)

Para incluir o YSQ-L3 no sistema de forma escalável e integrada com o Supabase, propõe-se a criação das seguintes tabelas com Row Level Security (RLS) habilitado.

```sql
-- Habilita extensão para gerar UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Submissões do YSQ-L3
CREATE TABLE public.ysq_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    current_page INT DEFAULT 1,
    responses JSONB DEFAULT '{}'::jsonb, -- Ex: {"1": 5, "2": 2, ..., "232": 6}
    ai_interpretation TEXT, -- Guarda o relatório analítico gerado pela IA
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Escores Consolidados (Média aritmética e Severidade)
CREATE TABLE public.ysq_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES public.ysq_submissions(id) ON DELETE CASCADE,
    
    -- Escores médios (1 a 6) por esquema
    pe_score NUMERIC(3,2), ab_score NUMERIC(3,2), da_score NUMERIC(3,2), is_score NUMERIC(3,2),
    dv_score NUMERIC(3,2), fr_score NUMERIC(3,2), de_score NUMERIC(3,2), vu_score NUMERIC(3,2),
    em_score NUMERIC(3,2), sb_score NUMERIC(3,2), as_score NUMERIC(3,2), ie_score NUMERIC(3,2),
    pi_score NUMERIC(3,2), me_score NUMERIC(3,2), ai_score NUMERIC(3,2), ba_score NUMERIC(3,2),
    np_score NUMERIC(3,2), pu_score NUMERIC(3,2),
    
    -- Quantidade de itens com resposta severa (5 ou 6) por esquema
    pe_critical_count INT, ab_critical_count INT, da_critical_count INT, is_critical_count INT,
    dv_critical_count INT, fr_critical_count INT, de_critical_count INT, vu_critical_count INT,
    em_critical_count INT, sb_critical_count INT, as_critical_count INT, ie_critical_count INT,
    pi_critical_count INT, me_critical_count INT, ai_critical_count INT, ba_critical_count INT,
    np_critical_count INT, pu_critical_count INT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar RLS
ALTER TABLE public.ysq_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ysq_scores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Profissionais acessam submissoes de seus pacientes"
    ON public.ysq_submissions FOR ALL
    USING (professional_id = auth.uid())
    WITH CHECK (professional_id = auth.uid());

CREATE POLICY "Profissionais acessam escores de seus pacientes"
    ON public.ysq_scores FOR ALL
    USING (
        submission_id IN (SELECT id FROM public.ysq_submissions WHERE professional_id = auth.uid())
    );
```

---

## 📈 4. Regras Matemáticas de Cálculo de Escores

Para cada submissão completada, o back-end (ou uma função de banco de dados/API) calculará:

1.  **Escore Médio do Esquema ($E_{score}$)**:
    $$E_{score} = \frac{\sum_{i \in I_E} R_i}{|I_E|}$$
    Onde $I_E$ é o conjunto de índices das perguntas pertencentes ao esquema $E$, e $R_i$ é a resposta do paciente (1 a 6) para a pergunta $i$.
2.  **Contagem de Itens Críticos ($C_{count}$)**:
    Soma das ocorrências de respostas iguais a **5** ou **6** nas perguntas do respectivo esquema. Notas 5 e 6 representam a presença de esquemas muito salientes.
3.  **Média do Domínio ($D_{score}$)**:
    Média ponderada ou aritmética dos escores médios dos esquemas que pertencem àquele domínio.

---

## 🤖 5. Integração com IA (Gemini) e Formulação Conceitual

A inteligência artificial (Gemini) atuará como assistente do terapeuta na consolidação diagnóstica.

### Fluxo de Dados:
1.  O paciente finaliza o questionário.
2.  O sistema calcula os escores e seleciona:
    *   Os 3 esquemas com maiores médias.
    *   Os itens específicos respondidos com nota 6 (dor emocional aguda).
3.  O sistema busca os prontuários das últimas 5 sessões (evoluções clínicas) e dados de queixa principal do paciente.
4.  O sistema envia essas informações à Edge Function `gemini` da plataforma.

### Prompt de Interpretação IA:
```text
Você é um psicólogo clínico sênior especialista em Terapia do Esquema de Jeffrey Young.
Analise os resultados quantitativos do YSQ-L3 do paciente abaixo cruzando com as queixas e histórico clínico:

[DADOS CLÍNICOS]
Queixa Principal: ${complaint}
Evoluções Recentes: ${evolutions}

[RESULTADOS QUANTITATIVOS DO YSQ-L3]
Maiores Pontuações de Esquemas (Escala 1-6):
- Privação Emocional: ${pe_score} (Itens críticos: ${pe_critical_count})
- Abandono: ${ab_score} (Itens críticos: ${ab_critical_count})
- Padrões Inflexíveis: ${pi_score} (Itens críticos: ${pi_critical_count})

Itens Individuais de Dor Aguda (Nota 6):
- "As pessoas não conseguiram satisfazer as minhas necessidades emocionais."
- "No final, acabarei só."

Gere uma formulação conceitual do caso estruturada em:
1. ANÁLISE DINÂMICA: Como os EIDs ativos explicam e mantêm os sintomas da queixa principal.
2. ESTILOS DE ENFRENTAMENTO PROVÁVEIS: Identifique sinais de Resignação (ex: aceitar relações frias), Evitação (ex: isolar-se) ou Hipercompensação (ex: buscar perfeccionismo e autocobrança extrema).
3. ESTRATÉGIAS TERAPÊUTICAS SUGERIDAS: Indique técnicas vivenciais (ex: reparentalização na imaginação) e cognitivo-comportamentais adequadas para enfraquecer os esquemas primários identificados.
```

---

## 🎨 6. Especificação de UI/UX (Interface Humana)

### Interface de Preenchimento (Paciente)
Para mitigar a fadiga do paciente ao responder 232 itens:
*   **Layout Limpo e Focado**: Exibição de progresso percentual claro, com salvamento em tempo real a cada clique.
*   **Paginação**: Divisão do questionário em 15 páginas contendo de 15 a 16 perguntas cada.
*   **Visual Laranja/Verde Suave (Likert)**: Botões circulares grandes para facilitar o clique em telas de celulares (Mobile First).

### Interface do Painel Clínico (Terapeuta)
*   **Visualização Gráfica**:
    *   **Gráfico Radar (Spider Chart)**: Os 18 esquemas dispostos em círculo para identificação visual rápida de picos e desequilíbrios.
    *   **Indicadores de Risco**: Destaque vermelho em esquemas com média $> 4.0$ ou com mais de 3 itens críticos (nota 5/6).
*   **Linha do Tempo de Testes**: Histórico de aplicações na ficha do paciente para monitorar a eficácia da psicoterapia ao longo dos meses.

---

## 🚨 7. Módulo de Monitoramento de Crise e Prevenção de Suicídio (Crisis Monitor)

Para dar suporte a pacientes identificados com alto risco de ideação suicida ou em situações de vulnerabilidade extrema (identificáveis inclusive pelos picos nos esquemas de **Abandono/Instabilidade**, **Defectividade/Vergonha** e **Vulnerabilidade ao Dano**), o sistema contará com um módulo preventivo de check-in ágil.

### A. Fluxo de Funcionamento no WhatsApp
1.  **Envio do Gatilho**: O terapeuta ativa o monitoramento de crise na ficha do paciente. O sistema disponibiliza um botão rápido para disparar uma mensagem automatizada no WhatsApp do paciente (ou agenda um disparo diário/periódico) que puxa dinamicamente o nome da profissional correspondente.
    *   *Exemplo de mensagem*: *"Olá, aqui é a/o [Nome da Psicóloga/Profissional]. Passando para fazer seu check-in diário. Como você está se sentindo hoje? Acesse este link rápido para responder em 30 segundos (você pode digitar ou apenas gravar um áudio): https://clinic.app/crise/token-seguro"*
2.  **Interface do Paciente (Responsiva & Leve)**:
    *   **Escala de Humor**: Uma pergunta simples com escala visual de 1 a 5 (Muito Mal, Mal, Neutro, Bem, Muito Bem).
    *   **Check-in Clínico (Columbia C-SSRS Adaptado)**: Três perguntas sim/não opcionais sobre presença de ideação ("Pensou em desistir?", "Pensou em fazer algo contra si?", "Tem um plano de segurança à mão?").
    *   **Diário de Desabafo (Texto ou Áudio)**: Um gravador de áudio simples integrado na tela onde o paciente pode falar livremente como está se sentindo, ou uma caixa de texto livre.

### B. Modelo Físico de Dados no Supabase
Adição de tabelas para controle de check-ins e o Plano de Segurança Individual (Safety Plan):

```sql
-- Migração: ysq_crisis_monitor.sql

-- 1. Tabela para o Plano de Segurança de Emergência do Paciente
CREATE TABLE public.patient_safety_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    -- Passos do plano de segurança padrão da Terapia Cognitivo-Comportamental
    internal_strategies TEXT, -- Coisas que posso fazer sozinho para me distrair/acalmar
    reasons_for_living TEXT, -- Razões para viver
    trusted_contacts JSONB, -- Contatos de confiança (Nome, Telefone, Relação)
    professional_contacts JSONB, -- Contatos profissionais de emergência (Nome, Telefone)
    emergency_services TEXT DEFAULT 'CVV: 188, SAMU: 192, Bombeiros: 193',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- 2. Tabela para registrar cada Check-in de Crise respondido pelo paciente
CREATE TABLE public.patient_crisis_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 5), -- 1: Muito Mal, 5: Muito Bem
    ideation_flag BOOLEAN DEFAULT FALSE, -- Indica se respondeu Sim a pensamentos autolesivos
    has_plan BOOLEAN DEFAULT FALSE, -- Indica se tem plano de tentativa ativo
    transcript TEXT, -- Transcrição do áudio gravado (feita pela IA)
    audio_url TEXT, -- Link do arquivo de áudio no Supabase Storage
    ai_risk_assessment TEXT, -- Avaliação analítica gerada pela IA (Gemini)
    risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'moderate', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.patient_safety_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_crisis_checkins ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Profissionais acessam planos de segurança"
    ON public.patient_safety_plans FOR ALL USING (professional_id = auth.uid());

CREATE POLICY "Profissionais acessam checkins de crise"
    ON public.patient_crisis_checkins FOR ALL USING (professional_id = auth.uid());
```

### C. Processamento Multimodal do Áudio com Gemini
Quando o paciente grava um áudio de desabafo:
1.  O áudio é enviado para o bucket `crisis-audios` no Supabase Storage.
2.  A Edge Function `gemini` é chamada contendo a URL do áudio.
3.  O Gemini processa o áudio nativamente (entrada multimodal) e executa a transcrição e a classificação de risco clínico de forma estruturada.

#### Prompt de Análise de Risco no Gemini:
```text
Você é um sistema especialista em triagem psicológica de crise e prevenção de suicídio.
Ouça o áudio em anexo do paciente e analise a transcrição de forma ultra-precisa.

Analise os seguintes pontos e retorne um objeto JSON estrito com os campos:
{
  "transcription": "transcrição literal e exata do áudio em português",
  "risk_level": "low" | "moderate" | "high" | "critical",
  "triggers_detected": ["gatilho 1", "gatilho 2"],
  "clinical_justification": "justificativa clínica breve da classificação de risco baseada no tom de voz, velocidade da fala e conteúdo verbal (explicando desesperança, ideação implícita ou plano ativo)"
}

Critérios de Classificação de Risco:
- LOW: Paciente relata sentimentos difíceis, mas mantém perspectivas positivas, sem ideação.
- MODERATE: Presença de desesperança ou ideação passiva ("queria sumir", "não aguento mais"), mas sem planejamento ativo de autolesão.
- HIGH: Ideação ativa de suicídio explícita, sentimentos intensos de dor sem saída, mas sem menção a métodos ou datas.
- CRITICAL: Menção a planos ativos de suicídio, despedidas, acesso a métodos, ou tom de voz de crise aguda com ideação severa.
```

### D. Ações Imediatas de Proteção e Notificação
*   **Para o Paciente (Ação na Tela)**:
    Se a resposta do paciente indicar `HIGH` ou `CRITICAL` (seja pelas perguntas diretas ou pela análise de áudio do Gemini):
    *   A tela do paciente exibe imediatamente de forma acolhedora o **Plano de Segurança Personalizado** cadastrado pelo terapeuta.
    *   Apresenta botões com destaque visual para discagem telefônica direta para o terapeuta, para o familiar de apoio e para o **CVV (188)**.
*   **Para o Terapeuta (Alerta Proativo)**:
    *   O sistema dispara uma notificação imediata via WhatsApp e SMS para o celular do terapeuta: *"ALERTA DE CRISE: O paciente [Nome] acabou de responder ao check-in diário com classificação de risco CRÍTICO. Acesse o painel para ouvir o áudio e acionar o protocolo de emergência: https://clinic.app/pacientes/id"*
    *   No Dashboard do Agenda Clinical, um card vermelho fixo e vibrante é exibido no topo da tela com um sinal sonoro leve (opcional), exigindo a leitura e a marcação de ciente pelo terapeuta.

