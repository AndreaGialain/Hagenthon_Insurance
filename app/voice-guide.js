/**
 * VoceGuidata — voice-guide.js
 * TTS: preferisce "Google italiano" (neurale) in Chrome.
 * Opzionalmente usa OpenAI TTS (tts-1-hd, voce "nova") per qualità massima.
 */

const VoiceGuide = (() => {
  'use strict';

  let lastSpokenText  = '';
  let speaking        = false;
  let supported       = false;
  let _openAiKey      = '';
  let _currentAudio   = null; // HTMLAudioElement per OpenAI TTS

  // ── Init ─────────────────────────────────────────────────────────
  function _init() {
    supported = ('speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined');
    if (!supported) console.warn('[VoiceGuide] Web Speech API non supportata.');

    // Chrome: carica le voci in modo asincrono
    if (supported && speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = () => {};
    }
    return supported;
  }

  // ── Selezione voce italiana migliore disponibile ─────────────────
  function _pickBestItalianVoice() {
    const voices = speechSynthesis.getVoices();
    if (!voices.length) return null;

    // Priorità: 1) Google neurale  2) altra neurale/cloud  3) qualsiasi it-IT
    return (
      voices.find(v => /it/i.test(v.lang) && /google/i.test(v.name)) ||
      voices.find(v => /it/i.test(v.lang) && !v.localService)        ||
      voices.find(v => v.lang === 'it-IT')                            ||
      voices.find(v => v.lang.startsWith('it'))
    );
  }

  // ── OpenAI TTS (tts-1-hd, voce "nova") ──────────────────────────
  async function _speakOpenAI(text) {
    try {
      _setSpeakingUI(true);
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${_openAiKey}`,
          'Content-Type':  'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1-hd',
          input: text,
          voice: 'nova',    // naturale, neutro, ottimo per l'italiano
          speed: 0.95,
        }),
      });

      if (!res.ok) throw new Error(`OpenAI TTS HTTP ${res.status}`);

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);

      if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }

      _currentAudio = new Audio(url);
      speaking = true;

      _currentAudio.onended = () => {
        speaking = false;
        _currentAudio = null;
        URL.revokeObjectURL(url);
        _setSpeakingUI(false);
      };
      _currentAudio.onerror = () => {
        speaking = false;
        _currentAudio = null;
        _setSpeakingUI(false);
      };

      await _currentAudio.play();
    } catch (err) {
      console.warn('[VoiceGuide] OpenAI TTS fallback:', err.message);
      _openAiKey = ''; // disabilita per questo turno se errore
      _setSpeakingUI(false);
      _speakBrowser(text); // fallback al browser
    }
  }

  // ── Web Speech API (fallback) ────────────────────────────────────
  function _speakBrowser(text, opts = {}) {
    if (!supported) return;
    stopSpeaking();

    const utterance    = new SpeechSynthesisUtterance(text);
    utterance.lang     = 'it-IT';
    utterance.rate     = opts.rate   ?? 0.92;
    utterance.pitch    = opts.pitch  ?? 1.0;
    utterance.volume   = opts.volume ?? 1.0;

    const voice = _pickBestItalianVoice();
    if (voice) utterance.voice = voice;

    utterance.onstart  = () => { speaking = true;  _setSpeakingUI(true);  };
    utterance.onend    = () => { speaking = false; _setSpeakingUI(false); };
    utterance.onerror  = (e) => {
      speaking = false;
      _setSpeakingUI(false);
      if (e.error !== 'interrupted') console.warn('[VoiceGuide] TTS error:', e.error);
    };

    setTimeout(() => {
      if (speechSynthesis.paused) speechSynthesis.resume();
      speechSynthesis.speak(utterance);
    }, 80);
  }

  // ── API pubblica: speak() ────────────────────────────────────────
  function speak(text, opts = {}) {
    if (!text) return;
    lastSpokenText = text;

    if (_openAiKey) {
      _speakOpenAI(text);
    } else {
      _speakBrowser(text, opts);
    }
  }

  function speakKeyboardShortcut(action, shortcut) {
    if (!supported && !_openAiKey) return;
    const spoken = shortcut
      .replace(/\+/g, ' più ')
      .replace(/Ctrl/g, 'Controllo')
      .replace(/Shift/g, 'Maiuscolo')
      .replace(/Enter/g, 'Invio');
    speak(`Per ${action}, premi ${spoken} sulla tastiera.`, { rate: 0.88 });
  }

  function stopSpeaking() {
    if (_currentAudio) { _currentAudio.pause(); _currentAudio = null; }
    if (supported && (speechSynthesis.speaking || speechSynthesis.pending)) {
      speechSynthesis.cancel();
    }
    speaking = false;
    _setSpeakingUI(false);
  }

  function repeatLast() {
    if (lastSpokenText) speak(lastSpokenText);
  }

  function setOpenAiKey(key) {
    _openAiKey = key ? key.trim() : '';
  }

  function isSupported()  { return supported || !!_openAiKey; }
  function isSpeaking()   { return speaking; }
  function getLastText()  { return lastSpokenText; }

  // ── UI feedback ──────────────────────────────────────────────────
  function _setSpeakingUI(active) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    const panel = document.getElementById('guide-panel');
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

  _init();

  return { speak, speakKeyboardShortcut, stopSpeaking, repeatLast,
           isSpeaking, isSupported, getLastText, setOpenAiKey };

})();
