from functools import wraps
from flask import request, jsonify, current_app
import jwt
from models import Usuario

def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]
            except IndexError:
                return jsonify({'erro': 'Token de autorização malformado'}), 401

        if not token:
            return jsonify({'erro': 'Token de acesso ausente'}), 401

        try:
            dados = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            usuario_atual = Usuario.query.filter_by(id=dados['id']).first()
            if not usuario_atual:
                return jsonify({'erro': 'Usuário correspondente ao token não existe'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'erro': 'O Token expirou'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'erro': 'Token inválido'}), 401

        return f(usuario_atual, *args, **kwargs)
    return decorador
