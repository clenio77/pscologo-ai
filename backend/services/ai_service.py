import os
import speech_recognition as sr
from pydub import AudioSegment
import json

def transcrever_audio_service(temp_audio_path, wav_path):
    try:
        AudioSegment.from_file(temp_audio_path).export(wav_path, format='wav')
        
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            try:
                return recognizer.recognize_google(audio_data, language='pt-BR')
            except sr.UnknownValueError:
                return "Não foi possível entender o áudio."
            except Exception as e:
                return f"Erro na transcrição: {str(e)}"
    finally:
        if os.path.exists(temp_audio_path): os.remove(temp_audio_path)
        if os.path.exists(wav_path): os.remove(wav_path)

def sugerir_exercicio_service(transcricao, contexto_anterior, current_app):
    contexto_prompt = ""
    if contexto_anterior:
        contexto_prompt = f"\nCONTEXTO DA INTERAÇÃO ANTERIOR:\n{contexto_anterior}\n"

    prompt = f"""
    Você é um Psicólogo Clínico Senior com profundo conhecimento em diversas escolas de pensamento (Psicanálise, TCC, Humanismo, Existencialismo, Junguismo). 
    Seu objetivo é evoluir o atendimento clínico a cada interação. {contexto_prompt}
    
    Novo relato do usuário: "{transcricao}"
    
    Analise o relato e escolha a abordagem teórica que melhor se aplica a este momento (ex: Rogers se o usuário precisar de validação, Beck se houver distorções cognitivas, Freud ou Jung se houver padrões simbólicos/inconscientes).
    
    Estruture sua resposta rigorosamente assim:
    SENTIMENTO: [Uma palavra]
    ABORDAGEM: [Nome da abordagem e o autor principal utilizado]
    LAUDO: [Evolução clínica do caso, integrando o contexto anterior se houver]
    MAPA: [Fatos e Gatilhos identificados]
    ORIENTACAO: [Conduta terapêutica atualizada com base na teoria escolhida]
    SESSAO: [Tópicos para aprofundar na terapia presencial]
    """

    client = current_app.config['gemini_client']
    model_name = current_app.config.get('gemini_model_name', 'gemini-2.5-flash')
    response = client.models.generate_content(
        model=model_name,
        contents=prompt
    )
    full_text = response.text
    
    sentimento = "Neutro"
    if "SENTIMENTO:" in full_text:
        sentimento = full_text.split("SENTIMENTO:")[1].split("\n")[0].strip()
    
    return full_text, sentimento

def gerar_prontuario_service(contexto_anamnese, historico_relatos, historico_notas, abordagem, current_app):
    diretrizes_abordagem = ""
    if abordagem == "tcc":
        diretrizes_abordagem = """
        Você deve analisar o caso sob a ótica da **Terapia Cognitivo-Comportamental (TCC)**.
        Foque em mapear as distorções cognitivas, pensamentos automáticos disfuncionais, crenças intermediárias e centrais reveladas.
        
        Estruture sua resposta rigorosamente em markdown com os tópicos:
        ### 🧠 ANÁLISE COGNITIVA-COMPORTAMENTAL (TCC)
        ### ⚡ ANÁLISE DE ANTECEDENTES, RESPOSTAS E CONSEQUÊNCIAS
        ### 🎯 ESQUEMAS E CRENÇAS CENTRAIS
        ### 🧭 DIRETRIZES E INTERVENÇÕES DE TCC
        """
    elif abordagem == "psicanalise":
        diretrizes_abordagem = """
        Você deve analisar o caso sob a ótica **Psicodinâmica/Psicanalítica**.
        Foque na compreensão de conflitos inconscientes, angústia, estrutura de personalidade e expressão pulsional.
        
        Estruture sua resposta rigorosamente em markdown com os tópicos:
        ### 💬 ANÁLISE PSICODINÂMICA
        ### 🛡️ MECANISMOS DE DEFESA IDENTIFICADOS
        ### 🔗 NOTAS DE RELACIONAMENTO E DINÂMICA TRANSFERENCIAL
        ### 🧭 DIRETRIZES DE ASSOCIAÇÃO LIVRE E INVESTIGAÇÃO
        """
    elif abordagem == "humanista":
        diretrizes_abordagem = """
        Você deve analisar o caso sob a ótica **Humanista, Fenomenológica ou Gestalt-terapeuta**.
        Foque na experiência vivida pelo cliente no "aqui-agora", seu nível de autoconsciência e busca por autoatualização.
        
        Estruture sua resposta rigorosamente em markdown com os tópicos:
        ### 🌱 ANÁLISE FENOMENOLÓGICA E EXISTENCIAL
        ### ⏳ EXPERIÊNCIA DO AQUI-AGORA E CONTATO
        ### 🛡️ POTENCIALIDADES E BLOQUEIOS
        ### 🧭 DIRETRIZES DE ACOLHIMENTO E FACILITAÇÃO
        """
    elif abordagem == "psicopatologia":
        diretrizes_abordagem = """
        Você deve analisar o caso com foco em **Exame do Estado Mental e Psicopatologia**.
        
        Estruture sua resposta rigorosamente em markdown com os tópicos:
        ### 🔍 EXAME DO ESTADO MENTAL ATUAL
        ### 📊 AFETIVIDADE, HUMOR E CONDUTA
        ### 🎯 INDICADORES DE RISCO OU GRAVIDADE
        ### 🧭 DIRETRIZES CLÍNICAS E ENCAMINHAMENTOS
        """
    else:
        diretrizes_abordagem = """
        Você deve analisar o caso com base nas diretrizes éticas e técnicas do **Conselho Federal de Psicologia (CFP)**.
        
        Estruture sua resposta rigorosamente em markdown com os tópicos:
        ### 📋 SÍNTESE EVOLUTIVA (RESOLUÇÃO CFP Nº 01/2009)
        ### 🎯 TEMAS RECORRENTES E DEMANDAS EXPLORADAS
        ### 📈 COMPREENSÃO DE PADRÃO E EVOLUÇÃO
        ### 🧭 CONDUTA CLÍNICA E DIRETRIZES FUTURAS
        """

    prompt = f"""
    Você é um Psicólogo Supervisor Clínico Sênior encarregado de consolidar a evolução do paciente para o psicólogo responsável.
    Analise o contexto histórico (Anamnese), o histórico de relatos gravados pelo paciente e as observações clínicas anotadas pelo terapeuta abaixo, e crie um **Prontuário Evolutivo Inteligente Híbrido** de alta qualidade.
    
    CONTEXTO HISTÓRICO DO PACIENTE (ANAMNESE):
    {contexto_anamnese}
    
    RELATOS GRAVADOS PELO PACIENTE:
    {historico_relatos}
    
    OBSERVAÇÕES CLÍNICAS DO TERAPEUTA:
    {historico_notas}
    
    DIRETRIZES CLÍNICAS DA ANÁLISE:
    {diretrizes_abordagem}
    """
    
    client = current_app.config['gemini_client']
    model_name = current_app.config.get('gemini_model_name', 'gemini-2.5-flash')
    response = client.models.generate_content(
        model=model_name,
        contents=prompt
    )
    return response.text

def gerar_insights_service(contexto_queixa, historico, current_app):
    prompt = f"""
    Você é um co-terapeuta IA de triagem rápida.
    Analise o breve histórico de falas do paciente, notas clínicas e a Queixa Principal do paciente abaixo. Seu trabalho é extrair de forma sintética:
    1. Principais alertas ou sinais de risco ativos (ex: risco de pânico, ansiedade de trabalho, indícios de insônia grave, ideação suicida, conflito familiar, etc.). Máximo 3 alertas curtos em formato de tags de 2 a 4 palavras. Se não houver risco, indique 'Risco Clínico Baixo'.
    2. Uma recomendação rápida de foco de abertura da sessão de 10 segundos (ex: "Abordar o conflito que teve com o chefe na terça, que gerou alto nível de ansiedade.").
    3. Tendência geral de humor recente (Estável, Em Melhora, Em Declínio, Oscilante).

    Retorne a resposta rigorosamente em formato JSON com as chaves "alertas" (array de strings), "foco" (string) e "humor_trend" (string). Não adicione markdown ou blocos de código além do JSON puro.
    
    QUEIXA PRINCIPAL DO PACIENTE:
    {contexto_queixa}
    
    DADOS RECENTES:
    {historico}
    """

    client = current_app.config['gemini_client']
    model_name = current_app.config.get('gemini_model_name', 'gemini-2.5-flash')
    response = client.models.generate_content(
        model=model_name,
        contents=prompt
    )
    text = response.text.strip()
    
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()
        
    return json.loads(text)
