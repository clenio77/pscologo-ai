# 🏥 Agenda Clinical

O **Agenda Clinical** é uma plataforma web SaaS desenvolvida sob medida para **psicólogos e profissionais de saúde mental**. A solução integra a gestão de consultas e prontuários eletrônicos com um módulo de **Prontuário Inteligente baseado em Inteligência Artificial (Google Gemini)**, capaz de gerar hipóteses clínicas de forma ética e rascunhos de documentos em conformidade com as diretrizes do Conselho Federal de Psicologia (CFP).

---

## 🚀 Principais Funcionalidades

### 📅 Gestão Integrada de Agenda
*   **Calendário Visual**: Visualização mensal interativa para agendamentos de sessões.
*   **Prevenção de Conflitos**: Bloqueio inteligente contra sobreposição de horários.
*   **Lembretes de WhatsApp**: Envio unificado de mensagens de confirmação de consultas direto pelo navegador.

### 👥 Prontuário Eletrônico Completo (PEP)
*   **Cadastro Avançado**: Gestão de fichas de pacientes e prontuários.
*   **Evoluções Clínicas**: Histórico cronológico das sessões.
*   **Voice Dictation**: Gravação e transcrição de evolução clínica via Web Speech API integrada.
*   **Rascunho Automático**: Salvamento automático local (`localStorage`) para prevenir perda de dados.

### 🧠 Prontuário Inteligente com IA (Gemini)
*   **Análises Multiteóricas**: Hipóteses baseadas em abordagens Psicanalíticas (Freud), Cognitivo-Comportamentais (TCC / Beck) e Humanistas (Rogers).
*   **Síntese Clínica**: Resumo integrado do prontuário para visualização rápida.
*   **Radar de Progresso**: Avaliação evolutiva em 6 dimensões psicológicas estruturadas.
*   **Análise de Sentimentos**: Identificação de padrões emocionais dominantes nas sessões.
*   **Rascunho de Documentos (Res. CFP nº 06/2019)**: Auxilia na estruturação de declarações, atestados, relatórios e laudos psicológicos.

### 📋 Formulários e Anamnese Dinâmica
*   **Criador de Templates**: Roteiros e formulários de anamnese customizados.
*   **Aplicação Rápida**: Preenchimento ágil com suporte a respostas por terceiros (familiares/responsáveis).

### 📱 Experiência e Infraestrutura
*   **PWA (Progressive Web App)**: Plataforma instalável no celular ou desktop, com suporte a cache inteligente.
*   **Acessibilidade e Layout**: Interface responsiva de alta fidelidade com suporte a Dark Mode.
*   **Row Level Security (RLS)**: Proteção rigorosa de acesso no banco de dados.

---

## 🛠️ Stack Tecnológica

*   **Frontend**: React 19, TypeScript 6, Vite 8, Lucide React (Ícones).
*   **Estilos**: CSS modularizado e responsivo.
*   **Banco de Dados & Autenticação**: Supabase (PostgreSQL + RLS).
*   **Módulo de Inteligência Artificial**: Google Gemini API (`@google/genai`).
*   **Controle de Versão**: Git.

---

## 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes visuais da plataforma
│   ├── calendar/        # AppointmentModal, AppointmentDetailModal
│   ├── patients/        # PatientCard, PatientDetail, PatientModal, etc.
│   ├── common/          # Componentes genéricos reutilizáveis
│   └── Portal.tsx       # Utilitário React Portal para renderização de modais
├── context/             # Provedores de contexto globais (Auth, Toast)
├── hooks/               # Hooks customizados (useSpeechToText)
├── pages/               # Páginas compostas (Agenda, Dashboard, Patients, Forms, Login)
├── services/            # Integração com APIs externas (Supabase, Gemini)
│   ├── api.ts           # Requisições principais e tipagem de banco
│   ├── aiService.ts     # Integração com a API do Google Gemini
│   └── supabaseClient.ts # Inicialização do cliente Supabase
└── utils/               # Funções auxiliares (formatters, whatsapp)
```

---

## ⚙️ Configuração do Ambiente

### 1. Pré-requisitos
*   [Node.js](https://nodejs.org/) (v18+)
*   [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

### 2. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com base no arquivo `.env.example`:

```env
VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-supabase
VITE_GEMINI_API_KEY=sua-chave-api-google-gemini
```

> [!WARNING]  
> A chave `VITE_GEMINI_API_KEY` é consumida diretamente no frontend. Em produção real, recomenda-se migrar estas chamadas para uma Supabase Edge Function ou backend intermediário para evitar a exposição da API Key no bundle client-side.

### 3. Instalação e Execução Local

```bash
# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Executar testes unitários
npm run test
```

---

## 🔒 Segurança & Compliance LGPD/CFP

A plataforma preza pela proteção e anonimização de dados de saúde:
*   **Rigor Ético**: A IA gera hipóteses e rascunhos de hipóteses diagnósticas para apoio do terapeuta; ela **nunca** fornece diagnósticos médicos/psiquiátricos finais.
*   **Anonimização de Prompt**: Todos os prompts enviados para a API do Google Gemini passam por um processo automático de anonimização no frontend que remove o primeiro nome do paciente e informações nominativas diretas, substituindo-os pela marcação genérica `[PACIENTE]`.
*   **Row Level Security (RLS)**: Garante que os dados de pacientes e agendas pertencentes a um terapeuta sejam inacessíveis para qualquer outro usuário do banco de dados.
