/**
 * VoceGuidata — voice-guide.js
 * Modulo Web Speech API TTS (Text-to-Speech)
 * Lingua: it-IT | Fallback silenzioso se TTS non disponibile
 */

const VoiceGuide = (() => {
  'use strict';

  let lastSpokenText = '';
  let currentUtterance = null;
  let speaking = false;
  let supported = false;

  // ── Init: verifica supporto browser ──────────────────────────────
  function _init() {
    supported = ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');
    if (!supported) {
      console.warn('[VoiceGuide] Web Speech API non supportata da questo browser.');
    }
    return supported;
  }

  /**
   * isSupported() — true se il browser supporta la sintesi vocale
   * @returns {boolean}
   */
  function isSupported() {
    return supported;
  }

  /**
   * speak(text) — Legge il testo ad alta voce in italiano
   * Annulla qualsiasi sintesi in corso prima di iniziare
   * @param {string} text  Testo da leggere
   * @param {object} opts  Opzioni: rate, pitch, volume
   */
  function speak(text, opts = {}) {
    if (!supported || !text) return;

    stopSpeaking(); // cancella coda precedente

    lastSpokenText = text;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang    = 'it-IT';
    utterance.rate    = opts.rate   ?? 0.92;   // leggermente più lento per chiarezza
    utterance.pitch   = opts.pitch  ?? 1.0;
    utterance.volume  = opts.volume ?? 1.0;

    // Seleziona voce italiana se disponibile
    const voices = speechSynthesis.getVoices();
    const italianVoice = voices.find(v => v.lang === 'it-IT') ||
                         voices.find(v => v.lang.startsWith('it'));
    if (italianVoice) utterance.voice = italianVoice;

    utterance.onstart = () => {
      speaking = true;
      currentUtterance = utterance;
      _setSpeakingUI(true);
    };

    utterance.onend = () => {
      speaking = false;
      currentUtterance = null;
      _setSpeakingUI(false);
    };

    utterance.onerror = (e) => {
      speaking = false;
      currentUtterance = null;
      _setSpeakingUI(false);
      // Errore 'interrupted' è normale quando stopSpeaking() viene chiamato
      if (e.error !== 'interrupted') {
        console.warn('[VoiceGuide] Errore TTS:', e.error);
      }
    };

    currentUtterance = utterance;

    // Chrome workaround: speechSynthesis si blocca dopo ~15s inattività
    // Usa un piccolo ritardo per garantire l'avvio
    setTimeout(() => {
      if (speechSynthesis.paused) speechSynthesis.resume();
      speechSynthesis.speak(utterance);
    }, 80);
  }

  /**
   * speakKeyboardShortcut(action, shortcut)
   * Formula vocale per comunicare uno shortcut da tastiera
   * Es: "Per accedere, premi Alt più A"
   * @param {string} action    Azione (es. "Accedi")
   * @param {string} shortcut  Tasto combinato (es. "Alt+A")
   */
  function speakKeyboardShortcut(action, shortcut) {
    if (!supported) return;

    // Converte "Alt+A" → "Alt più A" per la lettura naturale in italiano
    const spoken = shortcut
      .replace(/\+/g, ' più ')
      .replace(/Alt/g, 'Alt')
      .replace(/Ctrl/g, 'Controllo')
      .replace(/Shift/g, 'Maiuscolo')
      .replace(/Enter/g, 'Invio')
      .replace(/Tab/g, 'Tab')
      .replace(/Escape/g, 'Escape');

    const text = `Per ${action}, premi ${spoken} sulla tastiera.`;
    speak(text, { rate: 0.88 });
  }

  /**
   * stopSpeaking() — Annulla tutta la coda di sintesi vocale
   */
  function stopSpeaking() {
    if (!supported) return;
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel();
    }
    speaking = false;
    currentUtterance = null;
    _setSpeakingUI(false);
  }

  /**
   * repeatLast() — Ripete l'ultima istruzione pronunciata
   */
  function repeatLast() {
    if (!lastSpokenText) return;
    speak(lastSpokenText);
  }

  /**
   * isSpeaking() — true se il motore TTS sta parlando
   * @returns {boolean}
   */
  function isSpeaking() {
    return speaking;
  }

  /**
   * getLastText() — Restituisce l'ultimo testo pronunciato
   * @returns {string}
   */
  function getLastText() {
    return lastSpokenText;
  }

  // ── Helpers privati ──────────────────────────────────────────────

  /**
   * Aggiorna lo stato visivo del pannello VoceGuidata durante la sintesi
   */
  function _setSpeakingUI(active) {
    const panel = document.getElementById('guide-panel');
    const dot   = document.getElementById('status-dot');
    const txt   = document.getElementById('status-text');

    if (active) {
      panel?.classList.add('speaking');
      if (dot) { dot.style.background = '#A100FF'; dot.style.boxShadow = '0 0 8px #A100FF'; }
      if (txt) txt.textContent = 'Sta parlando…';
    } else {
      panel?.classList.remove('speaking');
      if (dot) { dot.style.background = ''; dot.style.boxShadow = ''; dot.className = 'status-dot ok'; }
      if (txt) txt.textContent = 'Pronto';
    }
  }

  // ── Le voci potrebbero non essere disponibili subito (Chrome) ─────
  // speechSynthesis.getVoices() è async su Chrome; attende l'evento
  if (supported && speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = () => {
      // Trigger silenzioso: le voci sono ora disponibili
    };
  }

  // Init all'import
  _init();

  // ── API pubblica ──────────────────────────────────────────────────
  return { speak, speakKeyboardShortcut, stopSpeaking, repeatLast, isSpeaking, isSupported, getLastText };

})();
