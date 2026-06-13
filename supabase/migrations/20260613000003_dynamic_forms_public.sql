-- Migração: 20260613000003_dynamic_forms_public.sql
-- Habilita que formulários dinâmicos (patient_forms) possam ser preenchidos de forma remota/anônima por pacientes.

-- 1. Adiciona as colunas de controle na tabela public.patient_forms
ALTER TABLE public.patient_forms ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE public.patient_forms ADD COLUMN IF NOT EXISTS current_page INTEGER DEFAULT 1;
ALTER TABLE public.patient_forms ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- 2. Habilita RLS na tabela form_templates (caso não esteja ativado)
ALTER TABLE public.form_templates ENABLE ROW LEVEL SECURITY;

-- Política RLS pública para form_templates:
-- Permite que um paciente anônimo leia as perguntas e detalhes do template APENAS se ele estiver respondendo ativamente
-- a uma ficha pendente associada a este template.
DROP POLICY IF EXISTS "Permitir select publico anonimo de templates associados a forms pendentes" ON public.form_templates;
CREATE POLICY "Permitir select publico anonimo de templates associados a forms pendentes"
    ON public.form_templates FOR SELECT
    USING (
        id IN (SELECT template_id FROM public.patient_forms WHERE status != 'completed')
    );

-- 3. Habilita RLS na tabela patient_forms (caso não esteja ativado)
ALTER TABLE public.patient_forms ENABLE ROW LEVEL SECURITY;

-- Política RLS pública para select em patient_forms:
-- Permite que usuários anônimos (pacientes) leiam dados da ficha pendente enviada a eles pelo ID/token.
DROP POLICY IF EXISTS "Permitir select anonimo de form pendente" ON public.patient_forms;
CREATE POLICY "Permitir select anonimo de form pendente"
    ON public.patient_forms FOR SELECT
    USING (status != 'completed');

-- Política RLS pública para update em patient_forms:
-- Permite que o paciente atualize as respostas e status de sua ficha pendente.
DROP POLICY IF EXISTS "Permitir update anonimo de form pendente" ON public.patient_forms;
CREATE POLICY "Permitir update anonimo de form pendente"
    ON public.patient_forms FOR UPDATE
    USING (status != 'completed')
    WITH CHECK (true);

-- 4. Atualiza a política pública da tabela patients para incluir formulários pendentes
DROP POLICY IF EXISTS "Permitir select anonimo de paciente envolvido em YSQ ou crise" ON public.patients;
CREATE POLICY "Permitir select anonimo de paciente envolvido em YSQ ou crise"
    ON public.patients FOR SELECT
    USING (
        id IN (SELECT patient_id FROM public.ysq_submissions WHERE status != 'completed')
        OR
        id IN (SELECT patient_id FROM public.patient_safety_plans)
        OR
        id IN (SELECT patient_id FROM public.patient_forms WHERE status != 'completed')
    );

