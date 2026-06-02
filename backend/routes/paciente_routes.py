from flask import Blueprint, request, jsonify, current_app
from models import Paciente
from utils import token_requerido
from services.paciente_service import (
    cadastrar_paciente_service, get_pacientes_service, get_notas_clinicas_service,
    criar_nota_clinica_service, deletar_nota_clinica_service, get_tarefas_service,
    criar_tarefa_service, concluir_tarefa_service, deletar_tarefa_service,
    get_anamnese_service, salvar_anamnese_service, get_avaliacoes_service,
    salvar_avaliacao_service, get_diarios_service, salvar_diario_service,
    get_resumo_pre_sessao_service, get_tcle_service, assinar_tcle_service,
    get_plano_service, salvar_plano_service
)

paciente_bp = Blueprint('paciente', __name__)

@paciente_bp.route("/psicologo/cadastrar-paciente", methods=["POST"])
@token_requerido
def psicologo_cadastrar_paciente(usuario_atual):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem cadastrar pacientes"}), 403
        
    data = request.get_json()
    nome = data.get("nome")
    email = data.get("email")
    senha = data.get("senha")
    
    if not nome or not email or not senha:
        return jsonify({"erro": "Dados obrigatórios ausentes"}), 400
        
    try:
        cadastrar_paciente_service(usuario_atual, nome, email, senha)
        return jsonify({"sucesso": True, "mensagem": "Paciente cadastrado e vinculado com sucesso"}), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 409
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/pacientes", methods=["GET"])
@token_requerido
def get_pacientes(usuario_atual):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem acessar a lista de pacientes"}), 403

    try:
        lista = get_pacientes_service(usuario_atual)
        return jsonify(lista)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/notas", methods=["GET"])
@token_requerido
def get_notas_clinicas(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas terapeutas podem acessar notas clínicas"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403
        
    try:
        lista = get_notas_clinicas_service(usuario_atual, paciente_id)
        return jsonify(lista)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/notas", methods=["POST"])
@token_requerido
def criar_nota_clinica(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas terapeutas podem criar notas clínicas"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403
        
    data = request.get_json()
    try:
        nova_nota = criar_nota_clinica_service(usuario_atual, paciente_id, data.get("conteudo"))
        return jsonify({
            "sucesso": True, 
            "nota": {
                "id": nova_nota.id,
                "conteudo": nova_nota.conteudo,
                "data": nova_nota.data_criacao.strftime("%d/%m/%Y %H:%M")
            }
        }), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/notas/<int:id>", methods=["DELETE"])
@token_requerido
def deletar_nota_clinica(usuario_atual, id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Não autorizado"}), 403
        
    try:
        deletar_nota_clinica_service(usuario_atual, id)
        return jsonify({"sucesso": True, "mensagem": "Nota clínica removida"})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 404
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/tarefas", methods=["GET"])
@token_requerido
def get_tarefas(usuario_atual, paciente_id):
    if usuario_atual.tipo == "paciente" and usuario_atual.id != paciente_id:
        return jsonify({"erro": "Acesso não autorizado"}), 403
    elif usuario_atual.tipo == "psicologo":
        vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
        if not vinculo:
            return jsonify({"erro": "Paciente não vinculado a você"}), 403

    try:
        lista = get_tarefas_service(paciente_id)
        return jsonify(lista)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/tarefas", methods=["POST"])
@token_requerido
def criar_tarefa(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem prescrever tarefas"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403

    data = request.get_json() or {}
    try:
        nova_tarefa = criar_tarefa_service(usuario_atual, paciente_id, data.get("titulo"), data.get("descricao"))
        return jsonify({
            "sucesso": True,
            "tarefa": {
                "id": nova_tarefa.id,
                "titulo": nova_tarefa.titulo,
                "descricao": nova_tarefa.descricao,
                "concluida": nova_tarefa.concluida,
                "data_criacao": nova_tarefa.data_criacao.strftime("%d/%m/%Y")
            }
        }), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/tarefas/<int:id>/concluir", methods=["PUT"])
@token_requerido
def concluir_tarefa(usuario_atual, id):
    data = request.get_json() or {}
    try:
        tarefa = concluir_tarefa_service(id, data.get("concluida", True))
        return jsonify({
            "sucesso": True,
            "concluida": tarefa.concluida,
            "data_conclusao": tarefa.data_conclusao.strftime("%d/%m/%Y %H:%M") if tarefa.data_conclusao else None
        })
    except ValueError as e:
        return jsonify({"erro": str(e)}), 404
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/tarefas/<int:id>", methods=["DELETE"])
@token_requerido
def deletar_tarefa(usuario_atual, id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Não autorizado"}), 403

    try:
        deletar_tarefa_service(usuario_atual, id)
        return jsonify({"sucesso": True, "mensagem": "Tarefa excluída"})
    except ValueError as e:
        return jsonify({"erro": str(e)}), 404
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/anamnese", methods=["GET"])
@token_requerido
def get_anamnese(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem acessar a anamnese"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403

    try:
        return jsonify(get_anamnese_service(paciente_id))
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/anamnese", methods=["POST"])
@token_requerido
def salvar_anamnese(usuario_atual, paciente_id):
    if usuario_atual.tipo != "psicologo":
        return jsonify({"erro": "Apenas psicólogos podem registrar anamnese"}), 403
        
    vinculo = Paciente.query.filter_by(usuario_id=paciente_id, psicologo_id=usuario_atual.id).first()
    if not vinculo:
        return jsonify({"erro": "Paciente não vinculado a você"}), 403

    data = request.get_json() or {}
    try:
        anamnese = salvar_anamnese_service(usuario_atual, paciente_id, data)
        return jsonify({
            "sucesso": True,
            "mensagem": "Anamnese salva com sucesso!",
            "data_atualizacao": anamnese.data_atualizacao.strftime("%d/%m/%Y %H:%M")
        })
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/avaliacoes", methods=["GET"])
@token_requerido
def get_avaliacoes(usuario_atual, paciente_id):
    if usuario_atual.tipo != 'psicologo':
        return jsonify({"erro": "Apenas psicólogos podem acessar"}), 403
    try:
        return jsonify(get_avaliacoes_service(paciente_id)), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/avaliacoes", methods=["POST"])
@token_requerido
def salvar_avaliacao(usuario_atual, paciente_id):
    if usuario_atual.tipo != 'psicologo':
        return jsonify({"erro": "Apenas psicólogos podem registrar"}), 403
    
    data = request.get_json()
    try:
        salvar_avaliacao_service(usuario_atual, paciente_id, data)
        return jsonify({"sucesso": True, "mensagem": "Avaliação salva com sucesso!"}), 201
    except ValueError as e:
        return jsonify({"erro": str(e)}), 400
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/diario", methods=["GET"])
@token_requerido
def get_diarios(usuario_atual, paciente_id):
    if usuario_atual.tipo == 'paciente' and usuario_atual.id != paciente_id:
        return jsonify({"erro": "Acesso não autorizado"}), 403
    try:
        return jsonify(get_diarios_service(paciente_id)), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/diario", methods=["POST"])
@token_requerido
def salvar_diario(usuario_atual):
    if usuario_atual.tipo != 'paciente':
        return jsonify({"erro": "Apenas pacientes podem criar diário"}), 403
        
    data = request.get_json()
    try:
        _, alerta = salvar_diario_service(usuario_atual, data)
        return jsonify({"sucesso": True, "mensagem": "Diário salvo com sucesso", "alerta_crise": alerta}), 201
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/resumo_pre_sessao", methods=["GET"])
@token_requerido
def get_resumo_pre_sessao(usuario_atual, paciente_id):
    if usuario_atual.tipo != 'psicologo':
        return jsonify({"erro": "Apenas psicólogos podem acessar"}), 403
        
    try:
        resumo = get_resumo_pre_sessao_service(paciente_id, current_app)
        return jsonify({"resumo": resumo}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/tcle", methods=["GET"])
@token_requerido
def get_tcle(usuario_atual, paciente_id):
    if usuario_atual.tipo == 'paciente' and usuario_atual.id != paciente_id:
        return jsonify({"erro": "Acesso não autorizado"}), 403
    try:
        return jsonify(get_tcle_service(paciente_id)), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/tcle", methods=["POST"])
@token_requerido
def assinar_tcle(usuario_atual, paciente_id):
    if usuario_atual.tipo != 'paciente' or usuario_atual.id != paciente_id:
        return jsonify({"erro": "Acesso não autorizado"}), 403
    try:
        assinar_tcle_service(paciente_id, request.remote_addr)
        return jsonify({"sucesso": True, "mensagem": "Termo assinado com sucesso"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/plano", methods=["GET"])
@token_requerido
def get_plano(usuario_atual, paciente_id):
    if usuario_atual.tipo == 'paciente' and usuario_atual.id != paciente_id:
        return jsonify({"erro": "Acesso não autorizado"}), 403
    try:
        return jsonify(get_plano_service(paciente_id)), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@paciente_bp.route("/paciente/<int:paciente_id>/plano", methods=["POST", "PUT"])
@token_requerido
def salvar_plano(usuario_atual, paciente_id):
    if usuario_atual.tipo != 'psicologo':
        return jsonify({"erro": "Apenas psicólogos podem editar o plano"}), 403
        
    data = request.get_json()
    try:
        salvar_plano_service(usuario_atual, paciente_id, data)
        return jsonify({"sucesso": True, "mensagem": "Plano salvo com sucesso"}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
