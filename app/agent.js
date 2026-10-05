/**
 * VoceGuidata — agent.js
 * Modulo intelligenza contestuale: chiamate a Claude API + fallback statico
 * Model: claude-haiku-4-5-20251001
 */

const AgentHelper = (() => {
  'use strict';

  const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-haiku-4-5-20251001';
  const DEFAULT_STUCK_THRESHOLD_MS = 15000;

  // ── Istruzioni statiche per fallback (no API key) ──────────────────
  const STATIC_INSTRUCTIONS = {
    1: {
      normal: {
        text: 'Sei nella pagina di accesso. Inserisci il nome utente e la password, poi premi il pulsante Accedi.',
        shortcut: 'Alt+A',
        shortcutLabel: 'Accedere al portale'
      },
      stuck1: {
        text: 'Puoi usare la tastiera: premi Tab per spostarti tra i campi. Quando sei sul pulsante Accedi, premi Invio.',
        shortcut: 'Alt+A',
        shortcutLabel: 'Accedere al portale'
      },
      stuck2: {
        text: 'Scorciatoia rapida: premi insieme Alt e la lettera A. Il sistema farà accesso automaticamente con le credenziali di demo.',
        shortcut: 'Alt+A',
        shortcutLabel: 'Accedere al portale'
      }
    },
    2: {
      normal: {
        text: 'Sei nella tua area personale. Per vedere i documenti, cerca il pulsante Documenti nella barra di navigazione.',
        shortcut: 'Alt+D',
        shortcutLabel: 'Andare ai Documenti'
      },
      stuck1: {
        text: 'Premi Tab per spostarti nella pagina. Il pulsante Documenti si trova nel menu principale in alto.',
        shortcut: 'Alt+D',
        shortcutLabel: 'Andare ai Documenti'
      },
      stuck2: {
        text: 'Scorciatoia rapida: premi Alt e la lettera D per aprire direttamente la sezione Documenti.',
        shortcut: 'Alt+D',
        shortcutLabel: 'Andare ai Documenti'
      }
    },
    3: {
      normal: {
        text: 'Vedi la lista dei tuoi documenti. Cerca e seleziona Attestato di Rischio RC Auto.',
        shortcut: 'Alt+R',
        shortcutLabel: 'Selezionare l\'Attestato di Rischio'
      },
      stuck1: {
        text: 'L\'Attestato di Rischio è il primo documento della lista. Clicca su di esso o premi Tab per raggiungerlo.',
        shortcut: 'Alt+R',
        shortcutLabel: 'Selezionare l\'Attestato di Rischio'
      },
      stuck2: {
        text: 'Scorciatoia: premi Alt e la lettera R per selezionare automaticamente l\'Attestato di Rischio RC Auto.',
        shortcut: 'Alt+R',
        shortcutLabel: 'Selezionare l\'Attestato di Rischio'
      }
    },
    4: {
      normal: {
        text: 'Scegli la tua polizza RC Auto dall\'elenco. Poi premi il pulsante Continua.',
        shortcut: 'Alt+C',
        shortcutLabel: 'Continuare alla fase successiva'
      },
      stuck1: {
        text: 'Clicca su una polizza per selezionarla. Poi cerca il pulsante Continua in fondo alla pagina.',
        shortcut: 'Alt+C',
        shortcutLabel: 'Continuare alla fase successiva'
      },
      stuck2: {
        text: 'Scorciatoia: premi Alt e la lettera C per procedere direttamente con la polizza selezionata.',
        shortcut: 'Alt+C',
        shortcutLabel: 'Continuare alla fase successiva'
      }
    },
    5: {
      normal: {
        text: 'Il tuo attestato è pronto. Premi il pulsante Scarica PDF per salvarlo sul tuo computer.',
        shortcut: 'Alt+S',
        shortcutLabel: 'Scaricare il PDF'
      },
      stuck1: {
        text: 'Il pulsante Scarica PDF è ben visibile al centro della pagina. Puoi premere Tab per raggiungerlo.',
        shortcut: 'Alt+S',
        shortcutLabel: 'Scaricare il PDF'
      },
      stuck2: {
        text: 'Scorciatoia: premi Alt e la lettera S per scaricare subito il PDF dell\'attestato di rischio.',
        shortcut: 'Alt+S',
        shortcutLabel: 'Scaricare il PDF'
      }
    }
  };

  // ── System prompt per Claude ───────────────────────────────────────
  const SYSTEM_PROMPT = `Sei VoceGuidata, un assistente vocale accessibile per portali assicurativi.
Aiuti Mario, 68 anni, con difficoltà visive e tremore alle mani, a completare operazioni online.

REGOLE FONDAMENTALI:
- Usa SOLO frasi brevi: massimo 2 frasi per risposta
- Tono calmo, rassicurante, diretto. Mai gergo tecnico
- Privilegia sempre le istruzioni con la tastiera (shortcut) rispetto al mouse
- Rispondi SOLO in italiano
- Output: JSON con i campi "text", "shortcut" (es. "Alt+A"), "shortcutLabel" (es. "Accedere")

Step del portale:
1 = Login (shortcut: Alt+A)
2 = Dashboard/Documenti (shortcut: Alt+D)
3 = Lista documenti - Attestato Rischio (shortcut: Alt+R)
4 = Selezione polizza (shortcut: Alt+C)
5 = Download PDF (shortcut: Alt+S)`;

  // ── detectStuck(lastActionTime) ───────────────────────────────────
  /**
   * Rileva inattività prolungata dell'utente
   * @param {number} lastActionTime  Timestamp (ms) dell'ultima azione
   * @returns {boolean}  true se l'utente è inattivo da > STUCK_THRESHOLD_MS
   */
  function detectStuck(lastActionTime, thresholdMs = DEFAULT_STUCK_THRESHOLD_MS) {
    return (Date.now() - lastActionTime) > thresholdMs;
  }

  // ── getContextualHelp(currentStep, stuckCount, apiKey) ────────────
  /**
   * Genera un'istruzione contestuale per il passo corrente.
   * Se stuckCount >= 2: messaggio più dettagliato con alternativa tastiera.
   * Se apiKey assente: usa istruzioni statiche predefinite.
   *
   * @param {number} currentStep  Step corrente (1-5)
   * @param {number} stuckCount   Quante volte l'utente si è bloccato
   * @param {string} apiKey       Claude API key (opzionale)
   * @returns {Promise<{text: string, shortcut: string, shortcutLabel: string}>}
   */
  async function getContextualHelp(currentStep, stuckCount, apiKey) {
    const step = Math.max(1, Math.min(5, currentStep));

    // ── Fallback statico (no API key) ──────────────────────────────
    if (!apiKey || apiKey.trim() === '') {
      return _staticInstruction(step, stuckCount);
    }

    // ── Chiamata Claude API ────────────────────────────────────────
    try {
      const userMessage = _buildUserMessage(step, stuckCount);
      const result = await _callClaude(userMessage, apiKey.trim());
      return _parseClaudeResponse(result, step);
    } catch (err) {
      console.warn('[AgentHelper] Fallback statico (errore API):', err.message);
      return _staticInstruction(step, stuckCount);
    }
  }

  // ── Privati ────────────────────────────────────────────────────────

  function _staticInstruction(step, stuckCount) {
    const stepData = STATIC_INSTRUCTIONS[step];
    if (!stepData) return { text: 'Segui le istruzioni sullo schermo.', shortcut: '', shortcutLabel: '' };

    if (stuckCount === 0) return stepData.normal;
    if (stuckCount === 1) return stepData.stuck1;
    return stepData.stuck2;
  }

  function _buildUserMessage(step, stuckCount) {
    const stepNames = {
      1: 'Login / accesso al portale',
      2: 'Dashboard — navigazione ai documenti',
      3: 'Lista documenti — selezione Attestato di Rischio RC Auto',
      4: 'Selezione polizza RC Auto e conferma',
      5: 'Download PDF dell\'attestato di rischio'
    };

    const context = `L'utente si trova allo step ${step}: "${stepNames[step]}".`;
    let difficulty = '';

    if (stuckCount === 0) {
      difficulty = 'È appena arrivato su questa schermata. Fornisci un\'istruzione di orientamento iniziale.';
    } else if (stuckCount === 1) {
      difficulty = 'L\'utente ha chiesto aiuto una volta. Fornisci un\'istruzione più dettagliata.';
    } else {
      difficulty = `L'utente è bloccato (${stuckCount} richieste). Fornisci l'alternativa da tastiera come prima cosa. Sii molto specifico.`;
    }

    return `${context} ${difficulty} Rispondi con JSON: {"text":"...","shortcut":"Alt+X","shortcutLabel":"..."}`;
  }

  async function _callClaude(userMessage, apiKey) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [
          { role: 'user', content: userMessage }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(err?.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    const content = data?.content?.[0]?.text;
    if (!content) throw new Error('Risposta Claude vuota');
    return content;
  }

  function _parseClaudeResponse(raw, step) {
    // Estrae JSON dalla risposta Claude (che potrebbe contenere testo extra)
    try {
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.text) return {
          text: parsed.text,
          shortcut: parsed.shortcut || STATIC_INSTRUCTIONS[step]?.normal?.shortcut || '',
          shortcutLabel: parsed.shortcutLabel || STATIC_INSTRUCTIONS[step]?.normal?.shortcutLabel || ''
        };
      }
    } catch (e) {
      // JSON non valido: usa il testo grezzo come istruzione
    }

    // Fallback: usa il testo grezzo se non è JSON
    return {
      text: raw.substring(0, 200),
      shortcut: STATIC_INSTRUCTIONS[step]?.normal?.shortcut || '',
      shortcutLabel: STATIC_INSTRUCTIONS[step]?.normal?.shortcutLabel || ''
    };
  }

  // ── API pubblica ──────────────────────────────────────────────────
  return { getContextualHelp, detectStuck };

})();
