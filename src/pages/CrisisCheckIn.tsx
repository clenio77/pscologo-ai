import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Heart, Mic, Square, Loader2, Phone, ShieldAlert, CheckCircle2, User } from 'lucide-react';

export const CrisisCheckIn: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [patient, setPatient] = useState<any>(null);
  const [safetyPlan, setSafetyPlan] = useState<any>(null);

  // Estados de resposta
  const [mood, setMood] = useState<number | null>(null);
  const [ideation, setIdeation] = useState<boolean | null>(null);
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [textDesabafo, setTextDesabafo] = useState('');

  // Estados do gravador de áudio
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Estados do fluxo de envio e crise
  const [saving, setSaving] = useState(false);
  const [riskDetected, setRiskDetected] = useState<string>('low'); // low, moderate, high, critical
  const [completed, setCompleted] = useState(false);

  // Inicialização e busca dos dados
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!token) {
        setErrorMsg('Link de check-in inválido.');
        setLoading(false);
        return;
      }

      try {
        // Busca paciente pelo ID/Token (usamos o ID do paciente na URL)
        const { data: patientData, error: patientError } = await supabase
          .from('patients')
          .select('*, profiles(name, phone)')
          .eq('id', token)
          .single();

        if (patientError || !patientData) {
          setErrorMsg('Paciente não encontrado. Verifique se o link está correto.');
          setLoading(false);
          return;
        }

        setPatient(patientData);

        // Busca o Plano de Segurança associado
        const { data: planData } = await supabase
          .from('patient_safety_plans')
          .select('*')
          .eq('patient_id', token)
          .single();

        if (planData) {
          setSafetyPlan(planData);
        }
      } catch (err) {
        console.error(err);
        setErrorMsg('Erro ao carregar os dados de segurança.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [token]);

  // Controles de Gravação de Áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        // Libera a webcam/microfone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Erro ao acessar microfone:', err);
      alert('Não foi possível acessar o microfone. Certifique-se de dar as permissões necessárias.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // Converte Blob em Base64
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Envio do Check-in
  const handleSubmit = async () => {
    if (mood === null) {
      alert('Por favor, indique como você está se sentindo.');
      return;
    }
    if (ideation === null) {
      alert('Por favor, responda se teve pensamentos difíceis ou de desistir.');
      return;
    }

    setSaving(true);
    try {
      let audioUrl = null;
      let transcriptText = textDesabafo;
      let calculatedRisk = 'low';
      let aiAssessment = null;

      // 1. Processar o áudio com a Edge Function se houver gravação
      if (audioBlob) {
        try {
          const base64Audio = await blobToBase64(audioBlob);
          
          // Envia o áudio em base64 para a Edge Function analisar
          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
              action: 'analyzeAudio',
              audioBase64: base64Audio,
              audioMimeType: 'audio/webm',
              prompt: `Analise o áudio do paciente de alto risco de suicídio. Transcreva o conteúdo verbal e avalie a gravidade do risco clínico. Retorne um objeto JSON estrito com os campos: transcription (string), risk_level ("low", "moderate", "high", "critical"), clinical_justification (string).`,
              responseMimeType: 'application/json'
            })
          });

          if (response.ok) {
            const result = await response.json();
            const parsed = JSON.parse(result.text);
            transcriptText = parsed.transcription || textDesabafo;
            calculatedRisk = parsed.risk_level || 'low';
            aiAssessment = parsed.clinical_justification || '';
          }
        } catch (audioErr) {
          console.error('Erro ao analisar áudio com a IA:', audioErr);
        }

        // Tenta fazer upload do áudio para o bucket no Storage
        try {
          const fileName = `${patient.id}/${Date.now()}.webm`;
          const { data: uploadData } = await supabase.storage
            .from('crisis-audios')
            .upload(fileName, audioBlob, { contentType: 'audio/webm' });
          
          if (uploadData) {
            const { data: urlData } = supabase.storage.from('crisis-audios').getPublicUrl(fileName);
            audioUrl = urlData?.publicUrl;
          }
        } catch (storageErr) {
          console.warn('Erro ao salvar áudio no storage:', storageErr);
        }
      }

      // Se respondeu sim a ideação e plano direto, eleva o risco para critical ou high
      if (hasPlan) {
        calculatedRisk = 'critical';
      } else if (ideation && calculatedRisk === 'low') {
        calculatedRisk = 'high';
      } else if (mood <= 2 && calculatedRisk === 'low') {
        calculatedRisk = 'moderate';
      }

      setRiskDetected(calculatedRisk);

      // 2. Inserir o check-in na tabela do Supabase
      const { error: insertError } = await supabase
        .from('patient_crisis_checkins')
        .insert({
          patient_id: patient.id,
          professional_id: patient.professional_id,
          mood_score: mood,
          ideation_flag: ideation,
          has_plan: hasPlan || false,
          transcript: transcriptText,
          audio_url: audioUrl,
          ai_risk_assessment: aiAssessment,
          risk_level: calculatedRisk
        });

      if (insertError) throw insertError;

      // 3. Se o risco for high ou critical, o sistema tenta notificar o terapeuta (simulado)
      if (calculatedRisk === 'high' || calculatedRisk === 'critical') {
        console.log(`[Crisis Monitor] DISPARANDO ALERTA CRÍTICO PARA O TERAPEUTA ${patient.profiles?.name}`);
        // Em um ambiente real aqui acionaríamos uma Edge Function de SMS ou Whatsapp
      }

      setCompleted(true);
    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao enviar seu check-in. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#4a7c59]" />
        <p className="mt-4 text-gray-600 font-medium">Carregando formulário...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erro de Acesso</h2>
          <p className="text-gray-600 mb-6">{errorMsg}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-lg transition-colors font-medium"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    );
  }

  // TELA DE CONCLUÍDO (SE RISCO FOR BAIXO OU MODERADO)
  if (completed && riskDetected !== 'high' && riskDetected !== 'critical') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#eaf2eb] p-4 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg border border-white/60">
          <CheckCircle2 className="w-16 h-16 text-[#4a7c59] mx-auto mb-6" />
          <h2 className="text-2xl font-extrabold text-[#2b3a30] mb-3">Check-in Concluído</h2>
          <p className="text-gray-600 mb-6">
            Obrigado pelo seu check-in. Suas respostas foram salvas e enviadas com segurança para {patient.profiles?.name || 'sua psicóloga'}.
          </p>
          <div className="p-4 bg-[#f4f8f5] rounded-xl border border-[#e2ede5] text-[#4a7c59] text-sm font-medium">
            Continue cuidando de si e lembre-se do que conversam em sessão.
          </div>
        </div>
      </div>
    );
  }

  // TELA DO PLANO DE SEGURANÇA (SE RISCO FOR ALTO OU CRÍTICO)
  if (completed && (riskDetected === 'high' || riskDetected === 'critical')) {
    return (
      <div className="min-h-screen bg-red-50 py-12 px-4 flex flex-col items-center justify-center">
        <div className="bg-white w-full max-w-xl p-6 md:p-8 rounded-3xl shadow-2xl border-2 border-red-200">
          <div className="flex items-center gap-3 text-red-600 mb-4 border-b border-red-100 pb-4">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
            <div>
              <h2 className="text-xl md:text-2xl font-black">Estamos aqui com você</h2>
              <p className="text-xs text-red-500 font-medium">Detectamos que você está passando por um momento difícil.</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Olá, aqui é a/o **{patient.profiles?.name || 'sua psicóloga'}**. Percebi que você está passando por um momento muito difícil agora. Por favor, siga as estratégias do seu plano de segurança abaixo para cuidarmos de você:
          </p>

          {/* Plano de Segurança */}
          {safetyPlan ? (
            <div className="space-y-6">
              {safetyPlan.internal_strategies && (
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <h4 className="font-bold text-orange-800 text-sm mb-1">💡 Coisas que você pode fazer para se acalmar:</h4>
                  <p className="text-sm text-orange-950 whitespace-pre-wrap">{safetyPlan.internal_strategies}</p>
                </div>
              )}

              {safetyPlan.reasons_for_living && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <h4 className="font-bold text-green-800 text-sm mb-1">❤️ Suas razões para continuar firme:</h4>
                  <p className="text-sm text-green-950 whitespace-pre-wrap">{safetyPlan.reasons_for_living}</p>
                </div>
              )}

              {/* Botões Rápidos de Ligação */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <h4 className="font-bold text-[#2b3a30] text-sm mb-2">📞 Ligue para alguém agora:</h4>
                
                {/* CVV */}
                <a
                  href="tel:188"
                  className="flex items-center justify-between w-full p-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md"
                >
                  <span className="flex items-center gap-2 text-base">
                    <Phone className="w-5 h-5" /> CVV (Valorização da Vida)
                  </span>
                  <span className="text-lg bg-white/20 px-3 py-1 rounded-md">Ligar 188</span>
                </a>

                {/* Terapeuta */}
                {patient.profiles?.phone && (
                  <a
                    href={`tel:${patient.profiles.phone}`}
                    className="flex items-center justify-between w-full p-4 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-xl font-bold transition-all shadow-md"
                  >
                    <span className="flex items-center gap-2 text-base">
                      <User className="w-5 h-5" /> {patient.profiles.name} (Psicóloga)
                    </span>
                    <span className="text-lg bg-white/20 px-3 py-1 rounded-md">Ligar</span>
                  </a>
                )}

                {/* Contatos Confiáveis */}
                {safetyPlan.trusted_contacts && Array.isArray(safetyPlan.trusted_contacts) && 
                  safetyPlan.trusted_contacts.map((contact: any, idx: number) => (
                    <a
                      key={idx}
                      href={`tel:${contact.phone}`}
                      className="flex items-center justify-between w-full p-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-bold transition-all"
                    >
                      <span className="flex items-center gap-2 text-base">
                        <Phone className="w-5 h-5 text-[#4a7c59]" /> {contact.name} ({contact.relationship})
                      </span>
                      <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-md">Ligar</span>
                    </a>
                  ))
                }
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Nenhum plano de segurança cadastrado ainda. Por favor, utilize os serviços nacionais de emergência:</p>
              
              <a
                href="tel:188"
                className="flex items-center justify-between w-full p-4 bg-red-600 text-white rounded-xl font-bold"
              >
                <span className="flex items-center gap-2"><Phone className="w-5 h-5" /> CVV</span>
                <span>Ligar 188</span>
              </a>

              <a
                href="tel:192"
                className="flex items-center justify-between w-full p-4 bg-blue-600 text-white rounded-xl font-bold"
              >
                <span className="flex items-center gap-2"><Phone className="w-5 h-5" /> SAMU</span>
                <span>Ligar 192</span>
              </a>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#eaf2eb] to-[#f4f7f5] py-8 px-4 flex flex-col justify-center items-center">
      <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-xl border">
        {/* Header */}
        <div className="flex items-center gap-2 text-[#4a7c59] mb-4 border-b pb-4">
          <Heart className="w-8 h-8 fill-current" />
          <div>
            <h1 className="font-black text-lg text-[#2b3a30] leading-none">Como você está hoje?</h1>
            <p className="text-xs text-gray-500 mt-1">Check-in de segurança para {patient.profiles?.name || 'sua psicóloga'}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* 1. Humor */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">1. Como você se sente hoje?</label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((val) => {
                const labels = ['Muito Mal', 'Mal', 'Neutro', 'Bem', 'Muito Bem'];
                const emojis = ['😢', '🙁', '😐', '🙂', '😊'];
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMood(val)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-2xl transition-all ${
                      mood === val
                        ? 'bg-[#eaf2eb] border-[#4a7c59] scale-105 shadow-sm'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    title={labels[val - 1]}
                  >
                    <span>{emojis[val - 1]}</span>
                    <span className="text-[9px] font-bold text-gray-400 mt-1">{val}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Ideação (Columbia) */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">2. Teve pensamentos de desistir ou se machucar recentemente?</label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={val ? 'sim' : 'nao'}
                  type="button"
                  onClick={() => setIdeation(val)}
                  className={`flex-1 py-2.5 rounded-xl border font-bold transition-all ${
                    ideation === val
                      ? val 
                        ? 'bg-red-50 text-red-600 border-red-300' 
                        : 'bg-green-50 text-[#4a7c59] border-[#4a7c59]'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {val ? 'Sim' : 'Não'}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Plano ativo (exibido apenas se respondeu sim para ideação) */}
          {ideation === true && (
            <div className="animate-fadeIn">
              <label className="block text-sm font-bold text-red-600 mb-2">⚠️ Você chegou a pensar em algum método ou planejar como fazer isso?</label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={val ? 'sim-plano' : 'nao-plano'}
                    type="button"
                    onClick={() => setHasPlan(val)}
                    className={`flex-1 py-2.5 rounded-xl border font-bold transition-all ${
                      hasPlan === val
                        ? val 
                          ? 'bg-red-600 text-white border-red-600 scale-105 shadow-md shadow-red-600/30' 
                          : 'bg-green-50 text-[#4a7c59] border-[#4a7c59]'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {val ? 'Sim (Preciso de apoio)' : 'Não'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Áudio ou Texto de Desabafo */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">3. Desabafo (Grave um áudio ou digite):</label>
            
            {/* Gravador de áudio */}
            <div className="flex items-center gap-3 mb-3">
              {recording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold animate-pulse"
                >
                  <Square className="w-4 h-4 fill-current" /> Parar Gravação
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4a7c59] hover:bg-[#3d664a] text-white rounded-xl font-bold transition-all"
                >
                  <Mic className="w-4 h-4" /> Gravar Áudio
                </button>
              )}

              {audioBlob && !recording && (
                <span className="text-xs bg-green-100 text-[#4a7c59] px-3 py-1.5 rounded-lg font-bold">
                  🎙️ Áudio gravado com sucesso!
                </span>
              )}
            </div>

            {/* Alternativa em texto */}
            <textarea
              value={textDesabafo}
              onChange={(e) => setTextDesabafo(e.target.value)}
              placeholder="Se preferir não gravar, digite como está se sentindo..."
              rows={3}
              className="w-full p-3 border rounded-xl focus:ring-[#4a7c59] focus:border-[#4a7c59] text-sm"
            ></textarea>
          </div>

          {/* Botão de envio */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-4 bg-[#4a7c59] hover:bg-[#3d664a] disabled:opacity-50 text-white rounded-xl font-extrabold text-base transition-all shadow-md shadow-[#4a7c59]/20 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Processando dados...
              </>
            ) : (
              'Enviar Check-in'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default CrisisCheckIn;
