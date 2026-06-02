from extensions import db
from models import Financeiro, Pacote, Usuario

def get_financeiro_service(usuario_atual):
    if usuario_atual.tipo == "paciente":
        lancamentos = Financeiro.query.filter_by(paciente_id=usuario_atual.id).order_by(Financeiro.data.desc()).all()
        return [
            {
                "id": l.id,
                "tipo": l.tipo,
                "categoria": l.categoria,
                "valor": l.valor,
                "data": l.data.strftime("%d/%m/%Y"),
                "descricao": l.descricao,
                "status": l.status
            }
            for l in lancamentos
        ]
        
    elif usuario_atual.tipo == "psicologo":
        lancamentos = Financeiro.query.filter_by(psicologo_id=usuario_atual.id).order_by(Financeiro.data.desc()).all()
        lista = []
        total_receitas = 0
        total_despesas = 0
        
        for l in lancamentos:
            paciente = Usuario.query.get(l.paciente_id) if l.paciente_id else None
            if l.tipo == 'receita':
                if l.status == 'pago':
                    total_receitas += l.valor
            else:
                if l.status == 'pago':
                    total_despesas += l.valor
                
            lista.append({
                "id": l.id,
                "tipo": l.tipo,
                "categoria": l.categoria,
                "valor": l.valor,
                "data": l.data.strftime("%d/%m/%Y"),
                "descricao": l.descricao,
                "status": l.status,
                "paciente_nome": paciente.nome if paciente else None
            })
            
        return {
            "lancamentos": lista,
            "resumo": {
                "total_receitas": total_receitas,
                "total_despesas": total_despesas,
                "lucro_liquido": total_receitas - total_despesas
            }
        }
    return None

def criar_lancamento_service(usuario_atual, data):
    tipo = data.get("tipo")
    categoria = data.get("categoria")
    valor = data.get("valor")
    descricao = data.get("descricao", "")
    status = data.get("status", "pago")
    paciente_id = data.get("paciente_id")
    
    if not tipo or not categoria or not valor:
        raise ValueError("Campos obrigatórios ausentes")
        
    if tipo not in ['receita', 'despesa']:
        raise ValueError("Tipo inválido")
        
    novo_lancamento = Financeiro(
        tipo=tipo,
        categoria=categoria,
        valor=float(valor),
        descricao=descricao,
        status=status,
        paciente_id=paciente_id,
        psicologo_id=usuario_atual.id
    )
    db.session.add(novo_lancamento)
    db.session.commit()
    return novo_lancamento

def alterar_lancamento_service(usuario_atual, id, status):
    lancamento = Financeiro.query.get(id)
    if not lancamento or lancamento.psicologo_id != usuario_atual.id:
        raise ValueError("Lançamento não encontrado")
        
    if status and status not in ['pago', 'pendente', 'atrasado']:
        raise ValueError("Status inválido")
        
    if status:
        lancamento.status = status
    db.session.commit()
    return lancamento

def deletar_lancamento_service(usuario_atual, id):
    lancamento = Financeiro.query.get(id)
    if not lancamento or lancamento.psicologo_id != usuario_atual.id:
        raise ValueError("Lançamento não encontrado")
        
    db.session.delete(lancamento)
    db.session.commit()

def get_pacotes_service(usuario_atual, paciente_id=None):
    if usuario_atual.tipo == "paciente":
        pacotes = Pacote.query.filter_by(paciente_id=usuario_atual.id).order_by(Pacote.data_criacao.desc()).all()
    elif usuario_atual.tipo == "psicologo":
        if not paciente_id:
            raise ValueError("paciente_id é obrigatório para psicólogos")
        pacotes = Pacote.query.filter_by(psicologo_id=usuario_atual.id, paciente_id=paciente_id).order_by(Pacote.data_criacao.desc()).all()
    else:
        return []

    return [
        {
            "id": p.id,
            "total_sessoes": p.total_sessoes,
            "sessoes_restantes": p.sessoes_restantes,
            "valor_total": p.valor_total,
            "status": p.status,
            "data_criacao": p.data_criacao.strftime("%d/%m/%Y")
        }
        for p in pacotes
    ]

def criar_pacote_service(usuario_atual, paciente_id, total_sessoes, valor_total):
    if not paciente_id or not total_sessoes or not valor_total:
        raise ValueError("Campos obrigatórios ausentes")
        
    novo_pacote = Pacote(
        paciente_id=paciente_id,
        psicologo_id=usuario_atual.id,
        total_sessoes=int(total_sessoes),
        sessoes_restantes=int(total_sessoes),
        valor_total=float(valor_total)
    )
    db.session.add(novo_pacote)
    
    paciente_usuario = Usuario.query.get(paciente_id)
    nome_paciente = paciente_usuario.nome if paciente_usuario else "Paciente"
    
    novo_lancamento = Financeiro(
        tipo="receita",
        categoria="sessao",
        valor=float(valor_total),
        descricao=f"Venda de pacote de {total_sessoes} sessões para {nome_paciente}",
        status="pendente",
        paciente_id=paciente_id,
        psicologo_id=usuario_atual.id
    )
    db.session.add(novo_lancamento)
    db.session.commit()
    return novo_pacote
