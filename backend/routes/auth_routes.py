from flask import Blueprint, request, jsonify, current_app
from services.auth_service import cadastro_service, login_service

auth_bp = Blueprint('auth', __name__)

@auth_bp.route("/cadastro", methods=["POST"])
def cadastro():
    data = request.get_json()
    nome = data.get("nome")
    email = data.get("email")
    senha = data.get("senha")
    tipo = data.get("tipo")
    psicologo_id = data.get("psicologo_id")

    try:
        cadastro_service(nome, email, senha, tipo, psicologo_id)
        return jsonify({"sucesso": True, "mensagem": "Usuário cadastrado com sucesso"}), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 409

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    senha = data.get("senha")

    try:
        response_data = login_service(email, senha, current_app.config['SECRET_KEY'])
        return jsonify(response_data)
    except ValueError as e:
        return jsonify({"erro": str(e)}), 401
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
