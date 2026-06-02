from flask import Blueprint, request, jsonify, current_app
from models import *
from utils import token_requerido
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import re
import os


sessao_bp = Blueprint('sessao', __name__)

@sessao_bp.route("/historico", methods=["GET"])
@token_requerido
def get_historico(usuario_atual):
    # Se o usuário for paciente, retorna apenas o histórico dele
    if usuario_atual.tipo == "paciente":
        sessoes = Sessao.query.filter_by(paciente_id=usuario_atual.id).order_by(Sessao.data_criacao.desc()).all()
    # Se o usuário for psicólogo, ele deve fornecer o paciente_id na query
    elif usuario_atual.tipo == "psicologo":
        paciente_id = request.args.get("paciente_id")
        if not paciente_id:
            return jsonify({"erro": "paciente_id é obrigatório para psicólogos"}), 400
        
        # Validar se o paciente de fato pertence ao psicólogo
        vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
        if not vinculo:
            return jsonify({"erro": "Este paciente não está sob seus cuidados"}), 403
            
        sessoes = Sessao.query.filter_by(paciente_id=paciente_id).order_by(Sessao.data_criacao.desc()).all()
    else:
        return jsonify({"erro": "Tipo de usuário não autorizado"}), 403

    lista = []
    for s in sessoes:
        lista.append({
            "id": s.id,
            "transcricao": s.transcricao,
            "exercicio": s.exercicio,
            "sentimento": s.sentimento,
            "data": s.data_criacao.strftime("%d/%m/%Y %H:%M")
        })
    return jsonify(lista)

@sessao_bp.route("/sessao/<int:id>", methods=["DELETE"])
@token_requerido
def delete_sessao(usuario_atual, id):
    sessao = Sessao.query.get(id)
    if not sessao:
        return jsonify({"erro": "Sessão não encontrada"}), 404
    
    # Validar autoridade para deletar
    if usuario_atual.tipo == "paciente" and sessao.paciente_id != usuario_atual.id:
        return jsonify({"erro": "Não autorizado"}), 403
    elif usuario_atual.tipo == "psicologo":
        # Verificar se o paciente da sessão pertence ao psicólogo
        vinculo = Paciente.query.filter_by(usuario_id=sessao.paciente_id, psicologo_id=usuario_atual.id).first()
        if not vinculo:
            return jsonify({"erro": "Não autorizado"}), 403
            
    try:
        db.session.delete(sessao)
        db.session.commit()
        return jsonify({"sucesso": True})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ROTAS DO MÓDULO DE AGENDA E CONSULTAS (Fase 3)

