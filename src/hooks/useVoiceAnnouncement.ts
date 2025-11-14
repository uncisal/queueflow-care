import { useEffect, useState } from "react";

interface VoiceSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
  voice: string | null;
}

export const useVoiceAnnouncement = () => {
  const [settings, setSettings] = useState<VoiceSettings>({
    enabled: true,
    volume: 1,
    rate: 0.9,
    pitch: 1,
    voice: null,
  });
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const portugueseVoices = voices.filter(voice => 
        voice.lang.startsWith('pt') || voice.lang.startsWith('br')
      );
      setAvailableVoices(portugueseVoices.length > 0 ? portugueseVoices : voices);
      
      // Selecionar voz portuguesa por padrão
      if (!settings.voice && portugueseVoices.length > 0) {
        setSettings(prev => ({ ...prev, voice: portugueseVoices[0].name }));
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text: string) => {
    if (!settings.enabled || !text) return;

    // Cancelar qualquer fala anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = settings.volume;
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;

    // Selecionar voz configurada
    if (settings.voice) {
      const selectedVoice = availableVoices.find(v => v.name === settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else if (availableVoices.length > 0) {
      utterance.voice = availableVoices[0];
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const announceTicket = (ticketNumber: string, counterLocation: string) => {
    // Se counterLocation já contém "guichê" ou "Guichê", não adicionar novamente
    const locationText = counterLocation.toLowerCase().includes('guichê') 
      ? counterLocation 
      : `Guichê ${counterLocation}`;
    
    const announcement = `Senha ${formatTicketForSpeech(ticketNumber)}. ${locationText}`;
    speak(announcement);
  };

  const formatTicketForSpeech = (ticketNumber: string) => {
    // Formata para falar letra por letra do prefixo e número separado
    // Ex: "A001" -> "A, zero, zero, um"
    const prefix = ticketNumber.match(/[A-Z]+/)?.[0] || '';
    const number = ticketNumber.match(/\d+/)?.[0] || '';
    
    const prefixSpeech = prefix.split('').join(', ');
    const numberSpeech = number.split('').map(digit => {
      const digitNames: { [key: string]: string } = {
        '0': 'zero', '1': 'um', '2': 'dois', '3': 'três', '4': 'quatro',
        '5': 'cinco', '6': 'seis', '7': 'sete', '8': 'oito', '9': 'nove'
      };
      return digitNames[digit] || digit;
    }).join(', ');

    return `${prefixSpeech}, ${numberSpeech}`;
  };

  const testVoice = () => {
    speak("Testando sistema de voz. Senha A, zero, zero, um. Guichê 1.");
  };

  return {
    settings,
    setSettings,
    availableVoices,
    isSpeaking,
    speak,
    announceTicket,
    testVoice,
  };
};
