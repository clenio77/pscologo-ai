export const SCALES_DATA = {
  "PHQ-9": {
    nome: "PHQ-9 (Depressão)",
    opcoes: ["Nenhuma vez", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"],
    valores: [0, 1, 2, 3],
    perguntas: [
      "Pouco interesse ou pouco prazer em fazer as coisas",
      "Se sentir para baixo, deprimido ou sem esperança",
      "Problemas para pegar no sono ou manter o sono, ou dormir mais do que o costume",
      "Se sentir cansado ou com pouca energia",
      "Falta de apetite ou comendo demais",
      "Sentir-se mal consigo mesmo, achar que é um fracasso ou que decepcionou sua família ou a você mesmo",
      "Problemas para se concentrar nas coisas (ex: ler jornal, ver TV)",
      "Mover-se ou falar tão devagar que outras pessoas notaram. Ou estar tão agitado/inquieto que você tem se movido mais do que o costume",
      "Pensamentos de que você estaria melhor morto ou de machucar a si mesmo de alguma forma"
    ],
    classificar: (total) => {
      if (total <= 4) return "Depressão Mínima";
      if (total <= 9) return "Depressão Leve";
      if (total <= 14) return "Depressão Moderada";
      if (total <= 19) return "Depressão Moderadamente Grave";
      return "Depressão Grave";
    }
  },
  "GAD-7": {
    nome: "GAD-7 (Ansiedade)",
    opcoes: ["Nenhuma vez", "Vários dias", "Mais da metade dos dias", "Quase todos os dias"],
    valores: [0, 1, 2, 3],
    perguntas: [
      "Sentir-se nervoso, ansioso ou muito tenso",
      "Não ser capaz de parar ou controlar a preocupação",
      "Preocupar-se muito com coisas diferentes",
      "Dificuldade para relaxar",
      "Ficar tão agitado que é difícil ficar sentado",
      "Tornar-se facilmente aborrecido ou irritável",
      "Sentir medo como se algo terrível fosse acontecer"
    ],
    classificar: (total) => {
      if (total <= 4) return "Ansiedade Mínima";
      if (total <= 9) return "Ansiedade Leve";
      if (total <= 14) return "Ansiedade Moderada";
      return "Ansiedade Grave";
    }
  },
  "ISI": {
    nome: "ISI (Gravidade de Insônia)",
    opcoes: ["Nenhuma/Muito Leve", "Leve", "Moderada", "Grave", "Muito Grave"],
    valores: [0, 1, 2, 3, 4],
    perguntas: [
      "Dificuldade para pegar no sono",
      "Dificuldade para manter o sono",
      "Problema de acordar muito cedo",
      "Insatisfação com o padrão atual de sono",
      "Interferência do problema de sono nas funções diárias",
      "Percepção do problema de sono por outros",
      "Preocupação com o problema de sono"
    ],
    classificar: (total) => {
      if(total <= 7) return "Ausência de insônia";
      if(total <= 14) return "Insônia leve";
      if(total <= 21) return "Insônia moderada";
      return "Insônia grave";
    }
  },
  "BAI": {
    nome: "BAI (Ansiedade de Beck)",
    opcoes: ["Absolutamente não", "Levemente", "Moderadamente", "Gravemente"],
    valores: [0, 1, 2, 3],
    perguntas: [
      "Dormência ou formigamento", "Sensação de calor", "Tremores nas pernas", "Incapaz de relaxar", 
      "Medo que o pior aconteça", "Tonto ou atordoado", "Palpitações no coração", "Sem equilíbrio", 
      "Aterrorizado", "Nervoso", "Sensação de sufoco", "Tremores nas mãos", "Trêmulo", 
      "Medo de perder o controle", "Dificuldade de respirar", "Medo de morrer", "Assustado", 
      "Indigestão ou desconforto no abdômen", "Sensação de desmaio", "Rosto afogueado", "Suores (não devidos ao calor)"
    ],
    classificar: (total) => {
      if (total <= 7) return "Ansiedade Mínima";
      if (total <= 15) return "Ansiedade Leve";
      if (total <= 25) return "Ansiedade Moderada";
      return "Ansiedade Grave";
    }
  },
  "ASRS-18": {
    nome: "ASRS-18 (TDAH Adultos)",
    opcoes: ["Nunca", "Raramente", "Algumas vezes", "Frequentemente", "Muito frequentemente"],
    valores: [0, 1, 2, 3, 4],
    perguntas: [
      "Com que frequência você comete erros por falta de atenção a detalhes?",
      "Com que frequência você tem dificuldade para manter a atenção no que está fazendo?",
      "Com que frequência você parece não escutar quando falam diretamente com você?",
      "Com que frequência você não consegue terminar tarefas ou seguir instruções até o fim?",
      "Com que frequência você tem dificuldade para organizar tarefas e atividades?",
      "Com que frequência você evita ou reluta em se envolver em tarefas que exijam esforço mental contínuo?",
      "Com que frequência você perde coisas necessárias para tarefas ou atividades?",
      "Com que frequência você se distrai facilmente com estímulos externos?",
      "Com que frequência você é esquecido em relação a atividades cotidianas?",
      "Com que frequência você mexe as mãos ou os pés ou se contorce na cadeira?",
      "Com que frequência você sai do seu lugar em situações em que se espera que fique sentado?",
      "Com que frequência você corre ou sobe nas coisas em situações em que isso é inadequado?",
      "Com que frequência você tem dificuldade em brincar ou se envolver silenciosamente em atividades de lazer?",
      "Com que frequência você se sente 'a mil por hora' ou como se estivesse 'movido a motor'?",
      "Com que frequência você fala demais?",
      "Com que frequência você deixa escapar uma resposta antes que a pergunta tenha sido concluída?",
      "Com que frequência você tem dificuldade para esperar a sua vez?",
      "Com que frequência você interrompe ou se intromete nos assuntos dos outros?"
    ],
    classificar: (total) => {
      if (total < 36) return "Pouco provável TDAH";
      return "Sintomas sugestivos de TDAH - Requer avaliação clínica";
    }
  },
  "EPDS": {
    nome: "EPDS (Depressão Pós-Parto)",
    opcoes: ["Nunca (0)", "Raramente (1)", "Bastante (2)", "Na maioria das vezes (3)"],
    valores: [0, 1, 2, 3],
    perguntas: [
      "Tenho sido capaz de rir e ver o lado divertido das coisas",
      "Tenho me sentido animada com as coisas que estão para acontecer",
      "Tenho me culpado sem necessidade quando as coisas dão errado",
      "Tenho me sentido ansiosa ou preocupada sem uma boa razão",
      "Tenho sentido medo ou pânico sem um motivo muito forte",
      "As coisas têm se acumulado e me deixado sobrecarregada",
      "Tenho me sentido tão infeliz que tenho dificuldade para dormir",
      "Tenho me sentido triste ou infeliz",
      "Tenho estado tão infeliz que tenho chorado",
      "O pensamento de fazer mal a mim mesma tem passado pela minha cabeça"
    ],
    classificar: (total) => {
      if (total >= 10) return "Possível depressão pós-parto. Atenção clínica.";
      return "Sem indicativos fortes de depressão pós-parto";
    }
  },
  "PCL-5": {
    nome: "PCL-5 (TEPT)",
    opcoes: ["Nada", "Um pouco", "Moderadamente", "Muito", "Extremamente"],
    valores: [0, 1, 2, 3, 4],
    perguntas: [
      "Lembranças perturbadoras repetidas, indesejadas e repentinas da experiência estressante?",
      "Sonhos perturbadores repetidos da experiência estressante?",
      "Sentir repentinamente ou agir como se a experiência estressante estivesse acontecendo novamente?",
      "Sentir-se muito perturbado quando algo o lembrava da experiência estressante?",
      "Ter fortes reações físicas quando algo o lembrava da experiência estressante?",
      "Evitar lembranças, pensamentos ou sentimentos relacionados à experiência?",
      "Evitar lembranças externas (pessoas, lugares, conversas) da experiência?",
      "Dificuldade em lembrar partes importantes da experiência estressante?",
      "Ter crenças muito negativas sobre si mesmo, outras pessoas ou o mundo?",
      "Culpar a si mesmo ou outras pessoas pela experiência estressante ou pelo que aconteceu depois?",
      "Ter sentimentos negativos fortes (medo, pavor, raiva, culpa, vergonha)?",
      "Perder o interesse em atividades que costumava gostar?",
      "Sentir-se distante ou isolado de outras pessoas?",
      "Dificuldade em vivenciar sentimentos positivos (alegria, amor)?",
      "Comportamento irritável, explosões de raiva, ou agir de forma agressiva?",
      "Envolver-se em comportamentos de risco ou destrutivos?",
      "Estar 'superalerta' ou vigilante e de sobreaviso?",
      "Assustar-se facilmente?",
      "Dificuldade para se concentrar?",
      "Dificuldade para adormecer ou manter o sono?"
    ],
    classificar: (total) => {
      if (total >= 33) return "Indicativo provável de TEPT";
      return "Abaixo do ponto de corte para TEPT";
    }
  },
  "MDQ": {
    nome: "MDQ (Transtorno Bipolar)",
    opcoes: ["Não", "Sim"],
    valores: [0, 1],
    perguntas: [
      "Você já se sentiu tão bem ou tão 'para cima' que outras pessoas achavam que você não era o seu 'eu' normal?",
      "Você já esteve tão irritável que gritou com as pessoas ou começou brigas ou discussões?",
      "Você já se sentiu muito mais autoconfiante que o normal?",
      "Você já precisou de muito menos sono que o normal e não se sentiu cansado?",
      "Você já falou muito mais ou muito mais rápido do que o normal?",
      "Os pensamentos passavam muito rápido na sua cabeça e você não conseguia acompanhá-los?",
      "Você se distraía tão facilmente por coisas ao redor que não conseguia se concentrar?",
      "Você tinha muito mais energia do que o normal?",
      "Você era muito mais ativo ou fazia muito mais coisas do que de costume?",
      "Você era muito mais sociável ou extrovertido do que o normal?",
      "Você estava muito mais interessado em sexo do que o normal?",
      "Você fez coisas que não eram do seu feitio ou que os outros achariam excessivas, tolas ou arriscadas?",
      "Passar por essas situações causou problemas reais em sua vida?"
    ],
    classificar: (total) => {
      if (total >= 7) return "Triagem positiva para Transtorno do Espectro Bipolar";
      return "Triagem negativa";
    }
  },
  "BDI-II": {
    nome: "BDI-II (Depressão de Beck)",
    opcoes: ["Ausente/Mínimo (0)", "Leve (1)", "Moderado (2)", "Grave (3)"],
    valores: [0, 1, 2, 3],
    perguntas: [
      "Tristeza", "Pessimismo", "Fracasso passado", "Perda de prazer", 
      "Sentimento de culpa", "Sentimento de punição", "Auto-aversão", 
      "Auto-acusações", "Ideias suicidas", "Choro", "Agitação", 
      "Perda de interesse", "Indecisão", "Desvalorização", "Falta de energia", 
      "Mudanças no sono", "Irritabilidade", "Mudanças de apetite", 
      "Dificuldade de concentração", "Cansaço ou fadiga", "Perda de interesse sexual"
    ],
    classificar: (total) => {
      if (total <= 13) return "Mínima Depressão";
      if (total <= 19) return "Depressão Leve";
      if (total <= 28) return "Depressão Moderada";
      return "Depressão Grave";
    }
  },
  "DASS-21": {
    nome: "DASS-21 (Depressão, Ansiedade, Estresse)",
    opcoes: ["Não se aplicou a mim", "Aplicou-se em algum grau", "Aplicou-se em grau considerável", "Aplicou-se muito"],
    valores: [0, 1, 2, 3],
    perguntas: [
      "Achei difícil me acalmar",
      "Senti minha boca seca",
      "Não consegui vivenciar nenhum sentimento positivo",
      "Tive dificuldade em respirar (ex: respiração rápida, falta de ar)",
      "Achei difícil tomar iniciativa para fazer as coisas",
      "Tendi a reagir de forma exagerada às situações",
      "Senti tremores (ex: nas mãos)",
      "Senti que estava sempre nervoso",
      "Preocupei-me com situações em que eu pudesse entrar em pânico",
      "Senti que não tinha nada a desejar",
      "Senti-me agitado",
      "Achei difícil relaxar",
      "Senti-me deprimido e sem ânimo",
      "Fui intolerante com as coisas que me impediam de continuar o que estava fazendo",
      "Senti que ia entrar em pânico",
      "Não consegui me entusiasmar com nada",
      "Senti que não tinha muito valor como pessoa",
      "Senti que estava muito emotivo / sensível",
      "Senti as batidas do meu coração (sem ter feito esforço físico)",
      "Senti medo sem motivo justificado",
      "Senti que a vida não tinha sentido"
    ],
    classificar: (total) => {
      return "Avaliação multi-fatorial. Escore geral alto indica sofrimento mental agudo.";
    }
  }
};
