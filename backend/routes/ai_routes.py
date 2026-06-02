from flask import Blueprint, request, jsonify, current_app
from models import *
from utils import token_requerido
from extensions import db
from datetime import datetime
import os
import tempfile
from services.ai_service import (
    transcrever_audio_service,
    sugerir_exercicio_service,
    gerar_prontuario_service,
    gerar_insights_service
)

ai_bp = Blueprint('ai', __name__)

@ai_bp.route("/transcribe", methods=["POST"])
@token_requerido
def transcribe(usuario_atual):
    if usuario_atual.tipo != "paciente":
        return jsonify({'erro': 'Apenas pacientes podem registrar desabafos'}), 403

    if 'audio' not in request.files:
        return jsonify({'erro': 'Arquivo de áudio não enviado'}), 400
    audio_file = request.files['audio']

    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_audio:
        audio_file.save(temp_audio)
        temp_audio_path = temp_audio.name

    wav_path = temp_audio_path.replace('.mp3', '.wav')
    transcricao = transcrever_audio_service(temp_audio_path, wav_path)

    return jsonify({"transcricao": transcricao})

@ai_bp.route("/sugerir-exercicio", methods=["POST"])
@token_requerido
def sugerir_exercicio(usuario_atual):
    if usuario_atual.tipo != "paciente":
        return jsonify({'erro': 'Apenas pacientes podem realizar desabafos'}), 403

    data = request.get_json()
    transcricao = data.get("transcricao", "")
    contexto_anterior = data.get("contexto_anterior", "")
    
    if not transcricao or "Não foi possível" in transcricao:
        return jsonify({"exercicio": "Tente falar um pouco mais para que eu possa ajudar."})

    try:
        exercicio, sentimento = sugerir_exercicio_service(transcricao, contexto_anterior, current_app)
        
        nova_sessao = Sessao(
            paciente_id=usuario_atual.id,
            transcricao=transcricao,
            exercicio=exercicio,
            sentimento=sentimento
        )
        db.session.add(nova_sessao)
        db.session.commit()
        
        return jsonify({
            "exercicio": exercicio,
            "sessao_id": nova_sessao.id,
            "sentimento": sentimento
        })
    except Exception as e:
        return jsonify({"erro": f"Erro na IA: {str(e)}"}), 500

@ai_bp.route("/paciente/<int:paciente_id>/prontuario-ia", methods=["GET"])
@token_requerido
def get_prontuario_ia(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Acesso negado"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403
        
    prontuario = ProntuarioConsolidado.query.filter_by(paciente_id=paciente_id).first()
    if not prontuario:
        return jsonify({"conteudo": None})
        
    return jsonify({
        "conteudo": prontuario.conteudo,
        "data_atualizacao": prontuario.data_atualizacao.strftime("%d/%m/%Y %H:%M")
    })

@ai_bp.route("/paciente/<int:paciente_id>/prontuario-ia/gerar", methods=["POST"])
@token_requerido
def gerar_prontuario_ia(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Acesso negado"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403
        
    data = request.get_json() or {}
    abordagem = data.get("abordagem", "padrao")
        
    sessoes = Sessao.query.filter_by(paciente_id=paciente_id).order_by(Sessao.data_criacao.asc()).all()
    notas = NotaClinica.query.filter_by(paciente_id=paciente_id, psicologo_id=usuario_atual.id).order_by(NotaClinica.data_criacao.asc()).all()
    anamnese = Anamnese.query.filter_by(paciente_id=paciente_id).first()
    
    contexto_anamnese = "Nenhuma anamnese registrada para este paciente."
    if anamnese:
        contexto_anamnese = f"""
        - Queixa Principal: {anamnese.queixa_principal or 'Não registrada'}
        - Histórico de Sintomas: {anamnese.historico_sintomas or 'Não registrado'}
        - Histórico Familiar: {anamnese.historico_familiar or 'Não registrado'}
        - Histórico Médico: {anamnese.historico_medico or 'Não registrado'}
        - Relações Sociais: {anamnese.relacionamentos_sociais or 'Não registrado'}
        - Expectativas: {anamnese.expectativas_terapia or 'Não registrada'}
        - Observações Gerais: {anamnese.observacoes_gerais or 'Não registrada'}
        """
        
    if not sessoes and not notas:
        return jsonify({"erro": "Este paciente ainda não possui nenhum desabafo gravado ou nota clínica anotada para consolidação."}), 400
        
    historico_relatos = ""
    for s in sessoes:
        historico_relatos += f"Data: {s.data_criacao.strftime('%d/%m/%Y')} | Sentimento: {s.sentimento}\nRelato: {s.transcricao}\n\n"
        
    historico_notas = ""
    for n in notas:
        historico_notas += f"Data: {n.data_criacao.strftime('%d/%m/%Y')} | Observação:\n{n.conteudo}\n\n"
        
    try:
        conteudo = gerar_prontuario_service(contexto_anamnese, historico_relatos, historico_notas, abordagem, current_app)
        
        prontuario = ProntuarioConsolidado.query.filter_by(paciente_id=paciente_id).first()
        if prontuario:
            prontuario.conteudo = conteudo
            prontuario.data_atualizacao = datetime.utcnow()
        else:
            prontuario = ProntuarioConsolidado(
                paciente_id=paciente_id,
                psicologo_id=usuario_atual.id,
                conteudo=conteudo
            )
            db.session.add(prontuario)
            
        db.session.commit()
        return jsonify({
            "conteudo": prontuario.conteudo,
            "data_atualizacao": prontuario.data_atualizacao.strftime("%d/%m/%Y %H:%M")
        })
    except Exception as e:
        return jsonify({"erro": f"Erro ao gerar prontuário: {str(e)}"}), 500

@ai_bp.route("/paciente/<int:paciente_id>/insights", methods=["GET"])
@token_requerido
def get_insights_ia(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Acesso negado"}), 403

    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403

    sessoes = Sessao.query.filter_by(paciente_id=paciente_id).order_by(Sessao.data_criacao.desc()).limit(6).all()
    notas = NotaClinica.query.filter_by(paciente_id=paciente_id, psicologo_id=usuario_atual.id).order_by(NotaClinica.data_criacao.desc()).limit(3).all()
    anamnese = Anamnese.query.filter_by(paciente_id=paciente_id).first()
    contexto_queixa = anamnese.queixa_principal if (anamnese and anamnese.queixa_principal) else "Não registrada"

    if not sessoes and not notas:
        return jsonify({
            "alertas": ["Sem dados suficientes"],
            "foco": "Registre anotações clínicas ou oriente o paciente a gravar desabafos para gerar os insights de preparação.",
            "humor_trend": "Neutro ou Estável"
        })

    historico = ""
    for s in reversed(sessoes):
        historico += f"Data: {s.data_criacao.strftime('%d/%m/%Y')} | Humor: {s.sentimento}\nFala: {s.transcricao[:300]}...\n\n"
    for n in reversed(notas):
        historico += f"Data: {n.data_criacao.strftime('%d/%m/%Y')} | Nota:\n{n.conteudo[:300]}...\n\n"

    try:
        insights = gerar_insights_service(contexto_queixa, historico, current_app)
        return jsonify(insights)
    except Exception as e:
        print(f"Erro ao gerar insights IA: {e}")
        return jsonify({
            "alertas": ["Erro na análise de IA"],
            "foco": "Não foi possível carregar os insights rápidos neste momento.",
            "humor_trend": "Indeterminado"
        })
