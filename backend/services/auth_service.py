import re
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from extensions import db
from models import Usuario, Paciente

def cadastro_service(nome, email, senha, tipo, psicologo_id=None):
    if not nome or not email or not senha or not tipo:
        raise ValueError("Dados obrigatórios ausentes")

    if tipo not in ["psicologo", "paciente"]:
        raise ValueError("Tipo de usuário inválido")

    email_regex = r"^[\w\.\+\-]+@[a-zA-Z0-9\-]+\.[a-zA-Z0-9\-\.]+$"
    if not re.match(email_regex, email):
        raise ValueError("Formato de e-mail inválido")

    if len(senha) < 8 or not any(char.isdigit() for char in senha) or not any(not char.isalnum() for char in senha):
        raise ValueError("A senha deve ter pelo menos 8 caracteres, contendo 1 número e 1 caractere especial")

    if Usuario.query.filter_by(email=email).first():
        raise Exception("E-mail já cadastrado")

    senha_hash = generate_password_hash(senha)
    
    novo_usuario = Usuario(nome=nome, email=email, senha_hash=senha_hash, tipo=tipo)
    db.session.add(novo_usuario)
    db.session.flush()

    if tipo == "paciente":
        novo_paciente = Paciente(usuario_id=novo_usuario.id, psicologo_id=psicologo_id)
        db.session.add(novo_paciente)

    db.session.commit()
    return novo_usuario

def login_service(email, senha, secret_key):
    if not email or not senha:
        raise ValueError("E-mail e senha são obrigatórios")

    usuario = Usuario.query.filter_by(email=email).first()

    if not usuario or not check_password_hash(usuario.senha_hash, senha):
        raise ValueError("E-mail ou senha incorretos")

    token = jwt.encode({
        "id": usuario.id,
        "tipo": usuario.tipo,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, secret_key, algorithm="HS256")

    response_data = {
        "token": token,
        "nome": usuario.nome,
        "email": usuario.email,
        "tipo": usuario.tipo,
        "id": usuario.id
    }

    if usuario.tipo == "paciente":
        paciente = Paciente.query.filter_by(usuario_id=usuario.id).first()
        if paciente:
            response_data["psicologo_id"] = paciente.psicologo_id

    return response_data
