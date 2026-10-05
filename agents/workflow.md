# VoceGuidata — Flusso Agentico (Workflow)

> Hagenthon – Accenture Application Engineering | Tema 03: Educazione Digitale Inclusiva

---

## Architettura del Flusso

```
TRIGGER
   │
   ├─── Cambio step (Portal.advance())
   │       └── onStepChange(step, stepName)
   │               └── loadStepInstruction(step, stuckCount=0)
   │
   ├─── Inattività rilevata (> 15 secondi)
   │       └── _checkStuck()
   │               └── Messaggio passivo + suggerimento shortcut
   │
   └─── Pulsante "Sono bloccato"
           └── requestHelp()
                   └── stuckCount++
                           └── getContextualHelp(step, stuckCount, apiKey)
```

---

## Decision Tree Principale

```
getContextualHelp(step, stuckCount, apiKey)
        │
        ├── apiKey presente?
        │       ├── SÌ  → Chiamata Claude API (claude-haiku-4-5-20251001)
        │       │           ├── Risposta valida → parse JSON → output adattivo
        │       │           └── Errore API       → fallback statico (silent)
        │       │
        │       └── NO  → Istruzioni statiche predefinite
        │
        └── stuckCount determina il livello di escalation
                ├── 0 → Istruzione standard (orientamento)
                ├── 1 → Istruzione espansa (dettaglio + alternativa)
                └── ≥2 → Shortcut da tastiera in primo piano
```

---

## Selezione Canale Output (Adaptive Output)

L'agente seleziona il canale di output in base allo stato dell'utente:

| Condizione | Canale primario | Canale secondario |
|---|---|---|
| Arrivo nuovo step | Voce (TTS) | Testo nel pannello |
| Inattività 15s | Voce (TTS) | Testo + hint shortcut |
| 1 richiesta aiuto | Voce (TTS) | Testo espanso |
| 2+ richieste aiuto | Testo grande in primo piano | Voce shortcut specifico |
| TTS non supportato | Solo testo (accessibile) | — |

**Principio:** Se l'utente è molto bloccato, la voce potrebbe non essere sufficiente. Il testo grande nel pannello diventa il canale primario con la shortcut come âncora di salvataggio.

---

## Step-by-Step: Ciclo di Vita di una Sessione

### FASE 1 — Inizializzazione
```
[Utente] Premi "Avvia VoceGuidata"
    ↓
[Sistema] VoiceGuide.isSupported() ?
    ├── SÌ  → updateStatus('Pronto', true)
    │         _speakWelcome() → carica step 1
    └── NO  → updateStatus('TTS non supportato', false)
              showInstruction(testo alternativo)
              carica step 1 solo testo
```

### FASE 2 — Navigazione step-by-step
```
[Portal] step cambia (advance() o shortcut)
    ↓
[VoceGuidata] onStepChange(step, name)
    ↓ reset stuckCount=0, aggiorna UI step indicator
    ↓
[AgentHelper] getContextualHelp(step, 0, apiKey)
    ↓ (async)
[VoceGuidata] showInstruction(text) + speak(text)
    ↓ (dopo delay proporzionale alla lunghezza testo)
[VoiceGuide] speakKeyboardShortcut(label, shortcut)
```

### FASE 3 — Rilevamento blocco
```
[Interval 5s] _checkStuck()
    ↓
AgentHelper.detectStuck(lastActionTime) → true se > 15s
    ↓
[VoceGuidata] Messaggio passivo:
    "Hai bisogno di aiuto? Premi il pulsante Aiuto oppure usa Alt+X."
    ↓ reset lastActionTime (evita spam)
```

### FASE 4 — Aiuto esplicito
```
[Utente] Premi "Sono bloccato"
    ↓
stuckCount++ (max tracciato: illimitato)
    ↓
getContextualHelp(step, stuckCount, apiKey)
    ├── stuckCount=1 → istruzione espansa
    └── stuckCount≥2 → shortcut in primo piano + annuncio vocale dedicato
```

### FASE 5 — Completamento
```
[Portal] step 5 → _triggerDownload() → download simulato
    ↓
[VoiceGuide] speak("Download completato! Missione compiuta, Mario!")
    ↓
[VoceGuidata] showInstruction(messaggio di successo)
    ↓
[Sistema] clearInterval(_stuckInterval) — fine sessione guidata
```

---

## Gestione Errori

| Errore | Comportamento |
|---|---|
| API key assente | Fallback silenzioso su istruzioni statiche |
| Errore HTTP dall'API | Catch → fallback statico, warn in console |
| TTS non supportato | Solo testo, nessun errore visibile |
| JSON non valido da Claude | Parse raw text, shortcut dal fallback statico |
| Step fuori range | Clamp tra 1 e 5, nessun crash |

---

## Metriche di Successo (per valutazione hackathon)

- **Tasso di completamento:** % sessioni che raggiungono step 5
- **Richieste aiuto medie:** numero medio di click su "Sono bloccato"
- **Tempo di blocco:** secondi di inattività per step (rilevati dal timer)
- **Utilizzo shortcut:** % azioni completate via Alt+[tasto] vs. click
- **Accessibilità:** contrasto WCAG AA, font ≥18px, navigazione Tab completa
