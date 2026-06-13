import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [key: number]: {
      isFinal: boolean;
      [key: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

/**
 * Hook customizado para gerenciar reconhecimento de voz (Speech Recognition).
 * @param onTranscriptCallback Callback disparado quando um trecho final de fala é transcrito.
 */
export const useSpeechToText = (onTranscriptCallback: (text: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported] = useState(() => 
    typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Mantemos a referência atualizada do callback para evitar recriação do SpeechRecognition
  const callbackRef = useRef(onTranscriptCallback);
  useEffect(() => {
    callbackRef.current = onTranscriptCallback;
  }, [onTranscriptCallback]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const rec = new SpeechRecognitionClass() as SpeechRecognitionInstance;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'pt-BR';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          callbackRef.current(finalTranscript);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListen = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Erro ao iniciar reconhecimento de voz:', e);
      }
    }
  }, [isListening]);

  return {
    isListening,
    toggleListen,
    isSupported
  };
};
