from flask import Blueprint, request, jsonify
from utils import token_requerido
from services.financeiro_service import (
    get_financeiro_service,
    criar_lancamento_service,
    alterar_lancamento_service,
    deletar_lancamento_service,
    get_pacotes_service,
    criar_pacote_service
)

financeiro_bp = Blueprint('financeiro', __name__)

@financeiro_bp.route("/financeiro", methods=["GET"])
@token_requerido
def get_financeiro(usuario_atual):
    try:
        dados = get_financeiro_service(usuario_atual)
        if dados is None:
            return jsonify({"erro": "Não autorizado"}), 403
        return jsonify(dados)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@financeiro_bp.route("/financeiro", methods=["POST"])
@token_requerido
def criar_lancamento(usuario_atual):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem lançar transações financeiras"}), 403
        
    data = request.get_json()
    try:
        criar_lancamento_service(usuario_atual, data)
        return jsonify({"sucesso": True, "mensagem": "Transação lançada com sucesso"}), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 400

@financeiro_bp.route("/financeiro/<int:id>", methods=["PUT"])
@token_requerido
def alterar_lancamento(usuario_atual, id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas profissionais podem gerenciar pagamentos"}), 403
        
    data = request.get_json()
    status = data.get("status")
    
    try:
        alterar_lancamento_service(usuario_atual, id, status)
        return jsonify({"sucesso": True, "mensagem": "Lançamento updated"})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@financeiro_bp.route("/financeiro/<int:id>", methods=["DELETE"])
@token_requerido
def deletar_lancamento(usuario_atual, id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Não autorizado"}), 403
        
    try:
        deletar_lancamento_service(usuario_atual, id)
        return jsonify({"sucesso": True, "mensagem": "Lançamento financeiro removido"})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@financeiro_bp.route("/pacotes", methods=["GET"])
@token_requerido
def get_pacotes(usuario_atual):
    paciente_id = request.args.get("paciente_id")
    try:
        pacotes = get_pacotes_service(usuario_atual, paciente_id)
        return jsonify(pacotes)
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@financeiro_bp.route("/pacotes", methods=["POST"])
@token_requerido
def criar_pacote(usuario_atual):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem vender pacotes de sessões"}), 403
        
    data = request.get_json()
    paciente_id = data.get("paciente_id")
    total_sessoes = data.get("total_sessoes")
    valor_total = data.get("valor_total")
    
    try:
        criar_pacote_service(usuario_atual, paciente_id, total_sessoes, valor_total)
        return jsonify({"sucesso": True, "mensagem": "Pacote vendido e lançado no financeiro"}), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
