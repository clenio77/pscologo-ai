from extensions import db
from models import (
    Usuario, Paciente, Sessao, NotaClinica, TarefaClinica,
    Anamnese, AvaliacaoPsicometrica, DiarioEmocional, TermoConsentimento, PlanoTerapeutico
)
from werkzeug.security import generate_password_hash
from datetime import datetime

def cadastrar_paciente_service(usuario_atual, nome, email, senha):
    if Usuario.query.filter_by(email=email).first():
        raise ValueError("E-mail de paciente já cadastrado")
        
    senha_hash = generate_password_hash(senha)
    novo_usuario = Usuario(nome=nome, email=email, senha_hash=senha_hash, tipo="paciente")
    db.session.add(novo_usuario)
    db.session.flush()
    
    novo_paciente = Paciente(usuario_id=novo_usuario.id, psicologo_id=usuario_atual.id)
    db.session.add(novo_paciente)
    db.session.commit()
    return novo_paciente

def get_pacientes_service(usuario_atual):
    pacientes_relacionados = Paciente.query.filter_by(psicologo_id=usuario_atual.id).all()
    lista = []
    for p in pacientes_relacionados:
        usuario_paciente = Usuario.query.get(p.usuario_id)
        if usuario_paciente:
            ultima_sessao = Sessao.query.filter_by(paciente_id=usuario_paciente.id).order_by(Sessao.data_criacao.desc()).first()
            lista.append({
                "id": usuario_paciente.id,
                "nome": usuario_paciente.nome,
                "email": usuario_paciente.email,
                "ultima_atividade": ultima_sessao.data_criacao.strftime("%d/%m/%Y %H:%M") if ultima_sessao else "Nenhuma atividade"
            })
    return lista

def get_notas_clinicas_service(usuario_atual, paciente_id):
    notas = NotaClinica.query.filter_by(paciente_id=paciente_id, psicologo_id=usuario_atual.id).order_by(NotaClinica.data_criacao.desc()).all()
    return [{"id": n.id, "conteudo": n.conteudo, "data": n.data_criacao.strftime("%d/%m/%Y %H:%M")} for n in notas]

def criar_nota_clinica_service(usuario_atual, paciente_id, conteudo):
    if not conteudo:
        raise ValueError("Conteúdo da nota é obrigatório")
        
    nova_nota = NotaClinica(paciente_id=paciente_id, psicologo_id=usuario_atual.id, conteudo=conteudo)
    db.session.add(nova_nota)
    db.session.commit()
    return nova_nota

def deletar_nota_clinica_service(usuario_atual, id):
    nota = NotaClinica.query.get(id)
    if not nota or nota.psicologo_id != usuario_atual.id:
        raise ValueError("Nota não encontrada")
    db.session.delete(nota)
    db.session.commit()

def get_tarefas_service(paciente_id):
    tarefas = TarefaClinica.query.filter_by(paciente_id=paciente_id).order_by(TarefaClinica.data_criacao.desc()).all()
    return [{
        "id": t.id,
        "titulo": t.titulo,
        "descricao": t.descricao,
        "concluida": t.concluida,
        "data_conclusao": t.data_conclusao.strftime("%d/%m/%Y %H:%M") if t.data_conclusao else None,
        "data_criacao": t.data_criacao.strftime("%d/%m/%Y")
    } for t in tarefas]

def criar_tarefa_service(usuario_atual, paciente_id, titulo, descricao):
    if not titulo or not descricao:
        raise ValueError("Título e descrição são obrigatórios")
        
    nova_tarefa = TarefaClinica(
        paciente_id=paciente_id,
        psicologo_id=usuario_atual.id,
        titulo=titulo,
        descricao=descricao
    )
    db.session.add(nova_tarefa)
    db.session.commit()
    return nova_tarefa

def concluir_tarefa_service(id, concluida):
    tarefa = TarefaClinica.query.get(id)
    if not tarefa:
        raise ValueError("Tarefa não encontrada")
        
    tarefa.concluida = concluida
    tarefa.data_conclusao = datetime.utcnow() if concluida else None
    db.session.commit()
    return tarefa

def deletar_tarefa_service(usuario_atual, id):
    tarefa = TarefaClinica.query.get(id)
    if not tarefa or tarefa.psicologo_id != usuario_atual.id:
        raise ValueError("Tarefa não encontrada")
    db.session.delete(tarefa)
    db.session.commit()

def get_anamnese_service(paciente_id):
    anamnese = Anamnese.query.filter_by(paciente_id=paciente_id).first()
    if not anamnese:
        return {
            "queixa_principal": "", "historico_sintomas": "", "historico_familiar": "",
            "historico_medico": "", "relacionamentos_sociais": "", "expectativas_terapia": "",
            "observacoes_gerais": ""
        }
    return {
        "queixa_principal": anamnese.queixa_principal or "",
        "historico_sintomas": anamnese.historico_sintomas or "",
        "historico_familiar": anamnese.historico_familiar or "",
        "historico_medico": anamnese.historico_medico or "",
        "relacionamentos_sociais": anamnese.relacionamentos_sociais or "",
        "expectativas_terapia": anamnese.expectativas_terapia or "",
        "observacoes_gerais": anamnese.observacoes_gerais or "",
        "data_atualizacao": anamnese.data_atualizacao.strftime("%d/%m/%Y %H:%M")
    }

def salvar_anamnese_service(usuario_atual, paciente_id, data):
    anamnese = Anamnese.query.filter_by(paciente_id=paciente_id).first()
    if not anamnese:
        anamnese = Anamnese(paciente_id=paciente_id, psicologo_id=usuario_atual.id)
        db.session.add(anamnese)
        
    anamnese.queixa_principal = data.get("queixa_principal")
    anamnese.historico_sintomas = data.get("historico_sintomas")
    anamnese.historico_familiar = data.get("historico_familiar")
    anamnese.historico_medico = data.get("historico_medico")
    anamnese.relacionamentos_sociais = data.get("relacionamentos_sociais")
    anamnese.expectativas_terapia = data.get("expectativas_terapia")
    anamnese.observacoes_gerais = data.get("observacoes_gerais")
    anamnese.data_atualizacao = datetime.utcnow()
    
    db.session.commit()
    return anamnese

def get_avaliacoes_service(paciente_id):
    avaliacoes = AvaliacaoPsicometrica.query.filter_by(paciente_id=paciente_id).order_by(AvaliacaoPsicometrica.data.desc()).all()
    return [{
        "id": a.id, "tipo_escala": a.tipo_escala, "escore_total": a.escore_total,
        "classificacao": a.classificacao, "data": a.data.strftime("%d/%m/%Y %H:%M")
    } for a in avaliacoes]

def salvar_avaliacao_service(usuario_atual, paciente_id, data):
    tipo_escala = data.get("tipo_escala")
    respostas_json = data.get("respostas_json", "{}")
    escore_total = data.get("escore_total", 0)
    classificacao = data.get("classificacao", "")

    if not tipo_escala:
        raise ValueError("Tipo de escala obrigatório")
        
    nova_avaliacao = AvaliacaoPsicometrica(
        paciente_id=paciente_id,
        psicologo_id=usuario_atual.id,
        tipo_escala=tipo_escala,
        respostas_json=str(respostas_json),
        escore_total=escore_total,
        classificacao=classificacao
    )
    db.session.add(nova_avaliacao)
    db.session.commit()
    return nova_avaliacao

def get_diarios_service(paciente_id):
    diarios = DiarioEmocional.query.filter_by(paciente_id=paciente_id).order_by(DiarioEmocional.data.desc()).all()
    return [{
        "id": d.id, "humor": d.humor, "emocoes": d.emocoes, "nota": d.nota,
        "fator_desencadeante": d.fator_desencadeante, "alerta_crise": d.alerta_crise,
        "data": d.data.strftime("%d/%m/%Y %H:%M")
    } for d in diarios]

def salvar_diario_service(usuario_atual, data):
    humor = data.get("humor", 3)
    emocoes = data.get("emocoes", "")
    nota = data.get("nota", "")
    fator = data.get("fator_desencadeante", "")
    
    palavras_crise = ['suicídio', 'morte', 'não aguento mais', 'me matar', 'desespero', 'acabar com tudo']
    alerta = any(palavra in nota.lower() for palavra in palavras_crise)
    
    novo_diario = DiarioEmocional(
        paciente_id=usuario_atual.id,
        humor=humor,
        emocoes=emocoes,
        nota=nota,
        fator_desencadeante=fator,
        alerta_crise=alerta
    )
    db.session.add(novo_diario)
    db.session.commit()
    return novo_diario, alerta

def get_resumo_pre_sessao_service(paciente_id, current_app):
    diarios = DiarioEmocional.query.filter_by(paciente_id=paciente_id).order_by(DiarioEmocional.data.desc()).limit(7).all()
    if not diarios:
        return "Não há registros suficientes no diário do paciente nos últimos dias."
        
    texto_diario = "\n".join([f"Data: {d.data.strftime('%d/%m')} - Humor: {d.humor}/5 - Emoções: {d.emocoes} - Nota: {d.nota}" for d in diarios])
    prompt = f"Atue como assistente clínico. Com base nos registros do diário do paciente dos últimos dias:\n\n{texto_diario}\n\nFaça um resumo de 1 parágrafo focando em padrões emocionais, gatilhos recorrentes e assuntos prioritários para o psicólogo abordar na sessão de hoje."
    
    client = current_app.config['gemini_client']
    model_name = current_app.config.get('gemini_model_name', 'gemini-2.5-flash')
    response = client.models.generate_content(model=model_name, contents=prompt)
    return response.text if hasattr(response, 'text') else str(response)

def get_tcle_service(paciente_id):
    termo = TermoConsentimento.query.filter_by(paciente_id=paciente_id).first()
    if not termo:
        return {"assinado": False, "data_assinatura": None}
    return {
        "assinado": termo.assinado,
        "data_assinatura": termo.data_assinatura.strftime("%d/%m/%Y %H:%M") if termo.data_assinatura else None
    }

def assinar_tcle_service(paciente_id, ip_assinatura):
    termo = TermoConsentimento.query.filter_by(paciente_id=paciente_id).first()
    if not termo:
        termo = TermoConsentimento(paciente_id=paciente_id)
        db.session.add(termo)
        
    termo.assinado = True
    termo.data_assinatura = datetime.utcnow()
    termo.ip_assinatura = ip_assinatura
    db.session.commit()

def get_plano_service(paciente_id):
    plano = PlanoTerapeutico.query.filter_by(paciente_id=paciente_id).first()
    if not plano:
        return {}
    return {
        "id": plano.id,
        "objetivos": plano.objetivos,
        "intervencoes": plano.intervencoes,
        "frequencia": plano.frequencia,
        "data_criacao": plano.data_criacao.strftime("%d/%m/%Y")
    }

def salvar_plano_service(usuario_atual, paciente_id, data):
    plano = PlanoTerapeutico.query.filter_by(paciente_id=paciente_id).first()
    if not plano:
        plano = PlanoTerapeutico(
            paciente_id=paciente_id,
            psicologo_id=usuario_atual.id,
            objetivos=data.get("objetivos", ""),
            intervencoes=data.get("intervencoes", ""),
            frequencia=data.get("frequencia", "Semanal")
        )
        db.session.add(plano)
    else:
        plano.objetivos = data.get("objetivos", plano.objetivos)
        plano.intervencoes = data.get("intervencoes", plano.intervencoes)
        plano.frequencia = data.get("frequencia", plano.frequencia)
        
    db.session.commit()
