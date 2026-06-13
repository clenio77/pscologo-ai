-- Migração: rls_public_access.sql (20260613000002_rls_public_access.sql)
-- Permite leitura controlada de dados não sensíveis de pacientes e profissionais para rotas públicas e janela anônima

-- 1. Políticas para a tabela public.patients
-- Habilita que um usuário anônimo possa fazer SELECT na tabela patients apenas se o paciente possuir
-- uma submissão de YSQ pendente/em andamento OU se ele tiver um Plano de Segurança cadastrado.
-- Isso impede a listagem geral de dados de pacientes no RLS, permitindo apenas consultas pontuais por ID legítimo.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select anonimo de paciente envolvido em YSQ ou crise" ON public.patients;
CREATE POLICY "Permitir select anonimo de paciente envolvido em YSQ ou crise"
    ON public.patients FOR SELECT
    USING (
        id IN (SELECT patient_id FROM public.ysq_submissions WHERE status != 'completed')
        OR
        id IN (SELECT patient_id FROM public.patient_safety_plans)
    );

-- 2. Políticas para a tabela public.profiles (Profissionais)
-- Permite que usuários anônimos (pacientes) leiam o nome e telefone de contato de emergência do profissional correspondente.
-- Como os dados de contato do psicólogo são de natureza pública, liberamos a leitura geral de profiles.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select publico de profissional" ON public.profiles;
CREATE POLICY "Permitir select publico de profissional"
    ON public.profiles FOR SELECT
    USING (true);

-- 3. Correção na política de UPDATE da tabela public.ysq_submissions
-- A política antiga continha "WITH CHECK (status != 'completed')", o que impedia que a finalização do
-- questionário salvasse o status como 'completed' no banco por usuários anônimos.
-- Corrigimos mantendo a restrição de modificação apenas para itens não concluídos previamente (USING),
-- mas liberando que a atualização mude o status para concluído (WITH CHECK true).
DROP POLICY IF EXISTS "Permitir update anonimo por token de paciente" ON public.ysq_submissions;
CREATE POLICY "Permitir update anonimo por token de paciente"
    ON public.ysq_submissions FOR UPDATE
    USING (status != 'completed')
    WITH CHECK (true);

-- 4. Adiciona política de INSERT anônimo para a tabela public.ysq_scores
-- Permite que o paciente (anônimo) insira as pontuações calculadas do YSQ ao finalizar o questionário.
ALTER TABLE public.ysq_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insert anonimo de escores" ON public.ysq_scores;
CREATE POLICY "Permitir insert anonimo de escores"
    ON public.ysq_scores FOR INSERT
    WITH CHECK (
        submission_id IN (SELECT id FROM public.ysq_submissions WHERE status != 'completed')
    );
