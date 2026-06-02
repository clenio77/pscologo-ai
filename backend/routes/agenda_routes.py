from flask import Blueprint, request, jsonify, current_app
from models import *
from utils import token_requerido
from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import re
import os


agenda_bp = Blueprint('agenda', __name__)

@agenda_bp.route("/horarios-disponiveis", methods=["GET"])
@token_requerido
def get_horarios_disponiveis(usuario_atual):
    psicologo_id = request.args.get("psicologo_id")
    data_str = request.args.get("data") # Formato: YYYY-MM-DD
    
    # Se o psicólogo fizer a requisição para si próprio
    if usuario_atual.tipo == "psicologo" and not psicologo_id:
        psicologo_id = usuario_atual.id
        
    if not psicologo_id or not data_str:
        return jsonify({"erro": "psicologo_id e data são obrigatórios"}), 400
        
    try:
        data_consulta = datetime.strptime(data_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"erro": "Data no formato inválido. Use YYYY-MM-DD"}), 400

    # Horários padrão de atendimento da clínica
    horarios_padrao = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"]
    
    # Buscar consultas agendadas para o psicólogo nesse dia
    consultas_dia = Consulta.query.filter(
        Consulta.psicologo_id == psicologo_id,
        Consulta.status == 'agendada'
    ).all()
    
    horarios_ocupados = []
    for c in consultas_dia:
        if c.data_hora.date() == data_consulta:
            horarios_ocupados.append(c.data_hora.strftime("%H:%M"))
            
    horarios_livres = [h for h in horarios_padrao if h not in horarios_ocupados]
    
    return jsonify(horarios_livres)

@agenda_bp.route("/consultas", methods=["POST"])
@token_requerido
def criar_consulta(usuario_atual):
    data = request.get_json()
    data_hora_str = data.get("data_hora") # Formato: YYYY-MM-DD HH:MM
    observacoes = data.get("observacoes", "")
    
    if usuario_atual.tipo == "paciente":
        # Pegar o psicólogo do paciente
        paciente_perfil = Paciente.query.filter_by(usuario_id=usuario_atual.id).first()
        if not paciente_perfil or not paciente_perfil.psicologo_id:
            return jsonify({"erro": "Você não tem um psicólogo vinculado para agendar consultas"}), 400
        psicologo_id = paciente_perfil.psicologo_id
        paciente_id = usuario_atual.id
    elif usuario_atual.tipo == "psicologo":
        paciente_id = data.get("paciente_id")
        if not paciente_id:
            return jsonify({"erro": "paciente_id é obrigatório para psicólogos"}), 400
            
        # Validar vinculo
        vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
        if not vinculo:
            return jsonify({"erro": "Este paciente não está vinculado a você"}), 403
        psicologo_id = usuario_atual.id
        paciente_id = int(paciente_id)
    else:
        return jsonify({"erro": "Perfil inválido"}), 403
        
    try:
        data_hora = datetime.strptime(data_hora_str, "%Y-%m-%d %H:%M")
    except ValueError:
        return jsonify({"erro": "Formato de data e hora inválido. Use YYYY-MM-DD HH:MM"}), 400
        
    # Verificar colisão
    colisao = Consulta.query.filter_by(
        psicologo_id=psicologo_id,
        data_hora=data_hora,
        status='agendada'
    ).first()
    
    if colisao:
        return jsonify({"erro": "Este horário já está ocupado"}), 409
        
    try:
        nova_consulta = Consulta(
            paciente_id=paciente_id,
            psicologo_id=psicologo_id,
            data_hora=data_hora,
            observacoes=observacoes
        )
        db.session.add(nova_consulta)
        db.session.commit()
        return jsonify({"sucesso": True, "mensagem": "Consulta agendada com sucesso"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@agenda_bp.route("/consultas", methods=["GET"])
@token_requerido
def get_consultas(usuario_atual):
    if usuario_atual.tipo == "paciente":
        consultas = Consulta.query.filter_by(paciente_id=usuario_atual.id).order_by(Consulta.data_hora.asc()).all()
        lista = []
        for c in consultas:
            psicologo = Usuario.query.get(c.psicologo_id)
            lista.append({
                "id": c.id,
                "data_hora": c.data_hora.strftime("%d/%m/%Y %H:%M"),
                "status": c.status,
                "observacoes": c.observacoes,
                "psicologo_nome": psicologo.nome if psicologo else "Desconhecido"
            })
    elif usuario_atual.tipo == "psicologo":
        paciente_id = request.args.get("paciente_id")
        if paciente_id:
            vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
            if not vinculo:
                return jsonify({"erro": "Paciente não vinculado"}), 403
            consultas = Consulta.query.filter_by(psicologo_id=usuario_atual.id, paciente_id=paciente_id).order_by(Consulta.data_hora.asc()).all()
        else:
            consultas = Consulta.query.filter_by(psicologo_id=usuario_atual.id).order_by(Consulta.data_hora.asc()).all()
            
        lista = []
        for c in consultas:
            paciente = Usuario.query.get(c.paciente_id)
            lista.append({
                "id": c.id,
                "data_hora": c.data_hora.strftime("%d/%m/%Y %H:%M"),
                "status": c.status,
                "observacoes": c.observacoes,
                "paciente_nome": paciente.nome if paciente else "Desconhecido",
                "paciente_id": c.paciente_id
            })
    else:
        return jsonify({"erro": "Perfil inválido"}), 403
        
    return jsonify(lista)

@agenda_bp.route("/consultas/<int:id>", methods=["PUT"])
@token_requerido
def alterar_consulta(usuario_atual, id):
    consulta = Consulta.query.get(id)
    if not consulta:
        return jsonify({"erro": "Consulta não encontrada"}), 404
        
    # Verificar autoridade
    if usuario_atual.tipo == "paciente" and consulta.paciente_id != usuario_atual.id:
        return jsonify({"erro": "Não autorizado"}), 403
    elif usuario_atual.tipo == "psicologo" and consulta.psicologo_id != usuario_atual.id:
        return jsonify({"erro": "Não autorizado"}), 403
        
    data = request.get_json()
    novo_status = data.get("status") # 'agendada', 'concluida', 'cancelada'
    novas_obs = data.get("observacoes")
    
    if novo_status and novo_status not in ['agendada', 'concluida', 'cancelada']:
        return jsonify({"erro": "Status inválido"}), 400
        
    try:
        if novo_status:
            consulta.status = novo_status
            
            # Automação Financeira (Conclusão de Consulta)
            if novo_status == 'concluida':
                # 1. Verificar pacotes ativos do paciente
                pacote_ativo = Pacote.query.filter_by(
                    paciente_id=consulta.paciente_id,
                    status='ativo'
                ).order_by(Pacote.data_criacao.asc()).first()
                
                if pacote_ativo:
                    pacote_ativo.sessoes_restantes -= 1
                    consulta.observacoes = (consulta.observacoes or "") + f" [Consumida do Pacote ID: {pacote_ativo.id}]"
                    if pacote_ativo.sessoes_restantes <= 0:
                        pacote_ativo.status = 'concluido'
                else:
                    # 2. Caso contrário, gera cobrança financeira avulsa automaticamente (R$ 150 padrão)
                    novo_lancamento = Financeiro(
                        tipo="receita",
                        categoria="sessao",
                        valor=150.0,
                        descricao=f"Sessão avulsa concluída em {consulta.data_hora.strftime('%d/%m/%Y %H:%M')}",
                        status="pendente",
                        paciente_id=consulta.paciente_id,
                        psicologo_id=consulta.psicologo_id,
                        consulta_id=consulta.id
                    )
                    db.session.add(novo_lancamento)
                    
        if novas_obs is not None:
            consulta.observacoes = novas_obs
            
        db.session.commit()
        return jsonify({"sucesso": True, "mensagem": "Consulta atualizada com sucesso"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 500

@agenda_bp.route("/consultas/<int:id>", methods=["DELETE"])
@token_requerido
def deletar_consulta(usuario_atual, id):
    consulta = Consulta.query.get(id)
    if not consulta:
        return jsonify({"erro": "Consulta não encontrada"}), 404
        
    if usuario_atual.tipo == "paciente" and consulta.paciente_id != usuario_atual.id:
        return jsonify({"erro": "Não autorizado"}), 403
    elif usuario_atual.tipo == "psicologo" and consulta.psicologo_id != usuario_atual.id:
        return jsonify({"erro": "Não autorizado"}), 403
        
    try:
        db.session.delete(consulta)
        db.session.commit()
        return jsonify({"sucesso": True, "mensagem": "Consulta cancelada e removida"})
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

# ROTAS DO MÓDULO FINANCEIRO (Fase 4)

