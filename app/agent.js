/**
 * VoceGuidata — agent.js
 * Intelligenza contestuale: Claude API (claude-haiku-4-5-20251001) + fallback statico.
 * Supporta due flussi: attestato di rischio e apertura sinistro.
 */

const AgentHelper = (() => {
  'use strict';

  const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL = 'claude-haiku-4-5-20251001';
  const DEFAULT_STUCK_THRESHOLD_MS = 15000;

  // ── Istruzioni statiche per fallback (no API key) ──────────────────────
  const STATIC_INSTRUCTIONS = {
    // ─ Comuni
    login: {
      normal: { text: 'Sei nella pagina di accesso. Inserisci il nome utente e la password, poi premi Accedi.', shortcut: 'Alt+A', shortcutLabel: 'Accedere al portale' },
      stuck1: { text: 'Usa il tasto Tab per spostarti tra i campi. Quando sei sul pulsante Accedi, premi Invio.', shortcut: 'Alt+A', shortcutLabel: 'Accedere al portale' },
      stuck2: { text: 'Scorciatoia: premi Alt+A per accedere automaticamente con le credenziali di demo.', shortcut: 'Alt+A', shortcutLabel: 'Accedere al portale' }
    },
    dashboard: {
      normal: { text: 'Sei nella tua area personale. Scegli cosa vuoi fare tra le opzioni disponibili.', shortcut: '', shortcutLabel: '' },
      stuck1: { text: 'Per scaricare l\'attestato scegli "Attestato di Rischio". Per segnalare un incidente scegli "Apertura Sinistro".', shortcut: '', shortcutLabel: '' },
      stuck2: { text: 'Usa il tasto Tab per spostarti tra le opzioni e Invio per selezionare quella desiderata.', shortcut: '', shortcutLabel: '' }
    },

    // ─ Flusso Attestato di Rischio
    att_docs: {
      normal: { text: 'Vedi la lista dei tuoi documenti. Cerca e seleziona Attestato di Rischio RC Auto.', shortcut: 'Alt+R', shortcutLabel: 'Selezionare l\'Attestato di Rischio' },
      stuck1: { text: 'L\'Attestato di Rischio è il primo documento evidenziato in blu nella tabella. Clicca su "Apri".', shortcut: 'Alt+R', shortcutLabel: 'Selezionare l\'Attestato di Rischio' },
      stuck2: { text: 'Scorciatoia: premi Alt+R per selezionare automaticamente l\'Attestato di Rischio RC Auto.', shortcut: 'Alt+R', shortcutLabel: 'Selezionare l\'Attestato di Rischio' }
    },
    att_polizza: {
      normal: { text: 'Scegli il veicolo per cui vuoi l\'attestato, poi premi Genera attestato.', shortcut: 'Alt+C', shortcutLabel: 'Confermare la selezione' },
      stuck1: { text: 'Clicca su una polizza per selezionarla (si evidenzia in blu). Poi premi Genera attestato.', shortcut: 'Alt+C', shortcutLabel: 'Confermare la selezione' },
      stuck2: { text: 'Scorciatoia: premi Alt+C per procedere con la polizza EF 482 GH già selezionata.', shortcut: 'Alt+C', shortcutLabel: 'Confermare la selezione' }
    },
    att_download: {
      normal: { text: 'Il tuo attestato è pronto. Premi Scarica PDF per salvarlo sul tuo computer.', shortcut: 'Alt+S', shortcutLabel: 'Scaricare il PDF' },
      stuck1: { text: 'Il pulsante blu Scarica PDF è al centro della pagina. Premi Tab per raggiungerlo.', shortcut: 'Alt+S', shortcutLabel: 'Scaricare il PDF' },
      stuck2: { text: 'Scorciatoia: premi Alt+S per scaricare immediatamente il PDF dell\'attestato.', shortcut: 'Alt+S', shortcutLabel: 'Scaricare il PDF' }
    },

    // ─ Flusso Sinistro
    sin_tipo: {
      normal: { text: 'Sei nell\'apertura sinistro. Seleziona il tipo di evento tra le quattro opzioni proposte.', shortcut: 'Alt+T', shortcutLabel: 'Confermare il tipo di sinistro' },
      stuck1: { text: 'Clicca su uno dei riquadri per selezionare il tipo. Per un incidente auto scegli "Incidente stradale".', shortcut: 'Alt+T', shortcutLabel: 'Confermare il tipo di sinistro' },
      stuck2: { text: 'Scorciatoia: premi Alt+T per confermare il tipo già selezionato e andare avanti.', shortcut: 'Alt+T', shortcutLabel: 'Confermare il tipo di sinistro' }
    },
    sin_dati: {
      normal: { text: 'Inserisci la data, l\'ora e il luogo del sinistro. Poi descrivi brevemente cosa è successo.', shortcut: 'Alt+P', shortcutLabel: 'Proseguire con i dati inseriti' },
      stuck1: { text: 'Compila i campi uno alla volta: data, ora, città, via. La descrizione può essere molto breve.', shortcut: 'Alt+P', shortcutLabel: 'Proseguire con i dati inseriti' },
      stuck2: { text: 'Scorciatoia: premi Alt+P per salvare i dati e passare allo step successivo.', shortcut: 'Alt+P', shortcutLabel: 'Proseguire con i dati inseriti' }
    },
    sin_veicoli: {
      normal: { text: 'Indica se c\'erano altri veicoli e descrivi i danni al tuo veicolo.', shortcut: 'Alt+P', shortcutLabel: 'Proseguire con i dati inseriti' },
      stuck1: { text: 'Se eri solo, scegli "Nessun altro veicolo". Poi scrivi i danni al campo di testo.', shortcut: 'Alt+P', shortcutLabel: 'Proseguire con i dati inseriti' },
      stuck2: { text: 'Scorciatoia: premi Alt+P per salvare le informazioni e andare avanti.', shortcut: 'Alt+P', shortcutLabel: 'Proseguire con i dati inseriti' }
    },
    sin_allegati: {
      normal: { text: 'Puoi allegare le foto dei danni. Non è obbligatorio: puoi anche saltare questo passo.', shortcut: 'Alt+A', shortcutLabel: 'Procedere senza allegati' },
      stuck1: { text: 'Premi "Seleziona file" accanto a Foto dei danni per caricare immagini. Oppure usa "Salta".', shortcut: 'Alt+A', shortcutLabel: 'Procedere senza allegati' },
      stuck2: { text: 'Scorciatoia: premi Alt+A per proseguire senza allegati. Li puoi aggiungere in un secondo momento.', shortcut: 'Alt+A', shortcutLabel: 'Procedere senza allegati' }
    },
    sin_conferma: {
      normal: { text: 'Controlla il riepilogo della tua segnalazione. Se è tutto corretto, premi Invia segnalazione.', shortcut: 'Alt+I', shortcutLabel: 'Inviare la segnalazione' },
      stuck1: { text: 'Scorri verso il basso per vedere tutti i dati. Poi premi il pulsante rosso Invia segnalazione.', shortcut: 'Alt+I', shortcutLabel: 'Inviare la segnalazione' },
      stuck2: { text: 'Scorciatoia: premi Alt+I per inviare la segnalazione e aprire ufficialmente la pratica sinistro.', shortcut: 'Alt+I', shortcutLabel: 'Inviare la segnalazione' }
    },
  };

  // ── System prompt per Claude ───────────────────────────────────────────
  const SYSTEM_PROMPT = `Sei VoceGuidata, un assistente vocale accessibile per portali assicurativi italiani.
Aiuti Mario, 68 anni, con difficoltà visive e tremore alle mani, a completare operazioni online.

REGOLE FONDAMENTALI:
- Usa SOLO frasi brevi: massimo 2 frasi per risposta
- Tono calmo, rassicurante, diretto. Mai gergo tecnico
- Privilegia sempre le istruzioni con la tastiera (shortcut) rispetto al mouse
- Rispondi SOLO in italiano
- Output: JSON con i campi "text", "shortcut" (es. "Alt+A"), "shortcutLabel" (es. "Accedere")

FLUSSO ATTESTATO DI RISCHIO:
- login: accesso con e-mail e password (shortcut: Alt+A)
- dashboard: scelta scenario (attestato o sinistro)
- att_docs: lista documenti, seleziona Attestato di Rischio (shortcut: Alt+R)
- att_polizza: selezione polizza RC Auto (shortcut: Alt+C)
- att_download: scarica il PDF (shortcut: Alt+S)

FLUSSO APERTURA SINISTRO:
- sin_tipo: seleziona tipo di sinistro tra 4 opzioni (shortcut: Alt+T)
- sin_dati: inserisci data, ora, luogo, dinamica (shortcut: Alt+P)
- sin_veicoli: altri veicoli, descrizione danni, feriti (shortcut: Alt+P)
- sin_allegati: allega foto/CID/verbale (facoltativi) (shortcut: Alt+A)
- sin_conferma: riepilogo e invio segnalazione (shortcut: Alt+I)`;

  // ── detectStuck(lastActionTime, thresholdMs) ──────────────────────────
  function detectStuck(lastActionTime, thresholdMs = DEFAULT_STUCK_THRESHOLD_MS) {
    return (Date.now() - lastActionTime) > thresholdMs;
  }

  // ── getContextualHelp(stepId, stuckCount, apiKey) ─────────────────────
  /**
   * Genera istruzione contestuale per lo step corrente.
   * @param {string} stepId    ID dello step (es. 'att_docs', 'sin_tipo')
   * @param {number} stuckCount  Quante volte l'utente si è bloccato (0-2)
   * @param {string} apiKey    Claude API key (opzionale)
   * @returns {Promise<{text: string, shortcut: string, shortcutLabel: string}>}
   */
  async function getContextualHelp(stepId, stuckCount, apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      return _staticInstruction(stepId, stuckCount);
    }
    try {
      const msg    = _buildUserMessage(stepId, stuckCount);
      const result = await _callClaude(msg, apiKey.trim());
      return _parseClaudeResponse(result, stepId);
    } catch (err) {
      console.warn('[AgentHelper] Fallback statico (errore API):', err.message);
      return _staticInstruction(stepId, stuckCount);
    }
  }

  // ── Privati ────────────────────────────────────────────────────────────

  function _staticInstruction(stepId, stuckCount) {
    const data = STATIC_INSTRUCTIONS[stepId];
    if (!data) return { text: 'Segui le istruzioni sullo schermo.', shortcut: '', shortcutLabel: '' };
    if (stuckCount === 0) return data.normal;
    if (stuckCount === 1) return data.stuck1;
    return data.stuck2;
  }

  function _buildUserMessage(stepId, stuckCount) {
    const stepNames = {
      login:        'Accesso al portale (e-mail + password)',
      dashboard:    'Dashboard — scelta dello scenario',
      att_docs:     'Lista documenti — seleziona Attestato di Rischio RC Auto',
      att_polizza:  'Selezione polizza RC Auto',
      att_download: 'Download PDF attestato',
      sin_tipo:     'Selezione tipo sinistro (incidente, furto, evento atmosferico, danni a terzi)',
      sin_dati:     'Inserimento dati evento (data, ora, luogo, dinamica)',
      sin_veicoli:  'Veicoli coinvolti e descrizione danni',
      sin_allegati: 'Allegati facoltativi (foto, CID, verbale)',
      sin_conferma: 'Riepilogo e invio segnalazione sinistro',
    };

    const nome = stepNames[stepId] || stepId;
    const ctx  = `L'utente si trova allo step "${stepId}": "${nome}".`;
    let diff = '';
    if (stuckCount === 0) diff = 'È appena arrivato. Fornisci un\'istruzione di orientamento iniziale.';
    else if (stuckCount === 1) diff = 'Ha chiesto aiuto una volta. Sii più dettagliato.';
    else diff = `È bloccato (${stuckCount} richieste). Dai prima la scorciatoia da tastiera, poi spiega cosa fare.`;

    return `${ctx} ${diff} Rispondi con JSON: {"text":"...","shortcut":"Alt+X","shortcutLabel":"..."}`;
  }

  async function _callClaude(userMessage, apiKey) {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-calls': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(err?.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) throw new Error('Risposta Claude vuota');
    return text;
  }

  function _parseClaudeResponse(raw, stepId) {
    try {
      const match = raw.match(/\{[\s\S]*?\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.text) return {
          text: parsed.text,
          shortcut: parsed.shortcut || STATIC_INSTRUCTIONS[stepId]?.normal?.shortcut || '',
          shortcutLabel: parsed.shortcutLabel || STATIC_INSTRUCTIONS[stepId]?.normal?.shortcutLabel || '',
        };
      }
    } catch (_) { /* usa testo grezzo */ }
    return {
      text: raw.substring(0, 200),
      shortcut: STATIC_INSTRUCTIONS[stepId]?.normal?.shortcut || '',
      shortcutLabel: STATIC_INSTRUCTIONS[stepId]?.normal?.shortcutLabel || '',
    };
  }

  return { getContextualHelp, detectStuck };

})();
