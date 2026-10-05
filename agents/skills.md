# VoceGuidata — Skills e Capabilities Agentiche

> Hagenthon – Accenture Application Engineering | Tema 03: Educazione Digitale Inclusiva

---

## Panoramica

VoceGuidata implementa 5 capability agentiche che lavorano in sinergia per offrire un'esperienza di navigazione adattiva e accessibile.

---

## 1. Block Detection (Rilevamento Blocco)

**Descrizione:** L'agente monitora continuamente il comportamento dell'utente e rileva automaticamente quando si blocca, senza che egli debba chiedere esplicitamente aiuto.

**Implementazione:**
- Timer di inattività (15 secondi) per ogni step
- `AgentHelper.detectStuck(lastActionTime)` — confronta timestamp
- `Portal._startInactivityTimer()` — timer resettato ad ogni azione
- Loop di controllo ogni 5 secondi in background

**Trigger di rilevamento:**
| Segnale | Soglia | Azione |
|---|---|---|
| Inattività timer | > 15s | Messaggio vocale passivo + suggerimento |
| Click "Sono bloccato" | Immediato | Escalation aiuto con stuckCount++ |
| Nessuna azione da Tab | Rilevato dal focusin handler | Reset timer inattività |

**Output adattivo:**
- Prima segnalazione: tono suggestivo ("Hai bisogno di aiuto?")
- Richiesta esplicita: istruzione diretta con shortcut

---

## 2. Adaptive Output (Output Adattivo)

**Descrizione:** L'agente seleziona il canale di output ottimale in base alla situazione dell'utente, alternando o combinando voce e testo a seconda del contesto.

**Canali disponibili:**
- **TTS vocale** — Web Speech API, lingua it-IT, rate 0.92 (leggermente lento per chiarezza)
- **Testo grande** — pannello VoceGuidata, font 1.2rem, alto contrasto
- **Hint shortcut** — badge tasto prominente nel pannello
- **Overlay visivo** — feedback schermata intera al momento dello shortcut

**Logica di selezione:**

```
stuckCount = 0  →  Voce primaria + testo pannello
stuckCount = 1  →  Voce + testo espanso + hint shortcut
stuckCount ≥ 2  →  Testo grande IN PRIMO PIANO + voce shortcut specifico
TTS assente     →  Solo testo, tutto il flusso resta funzionale
```

**Rationale:** Un utente molto bloccato potrebbe non riuscire a seguire una frase vocale. Il testo diventa il canale principale e la shortcut da tastiera diventa l'âncora di salvataggio.

---

## 3. Contextual Generation (Generazione Contestuale)

**Descrizione:** Quando disponibile una API key Claude, l'agente genera istruzioni personalizzate in tempo reale usando il modello LLM, arricchendo il fallback statico con messaggi contestuali.

**Stack tecnico:**
- Modello: `claude-haiku-4-5-20251001`
- Endpoint: `https://api.anthropic.com/v1/messages`
- Max tokens: 200 (risposte brevi, bassa latenza)
- Formato output: JSON strutturato `{ text, shortcut, shortcutLabel }`

**Prompt engineering:**
- System prompt dedicato (vedi `system-prompt.md`)
- Framing del contesto: step corrente + numero richieste aiuto
- Vincolo di formato: risposta SEMPRE in JSON parseable
- Fallback implicito: se JSON non valido → usa raw text

**Degradazione graziosa:**
```
API key assente  → Istruzioni statiche predefinite (nessun errore)
Errore HTTP      → Catch silenzioso → fallback statico
JSON non valido  → Parse raw text → fallback shortcut
```

---

## 4. Context Maintenance (Mantenimento del Contesto)

**Descrizione:** L'agente mantiene lo stato della sessione attraverso i 5 step, accumulando informazioni sul comportamento dell'utente per adattare le risposte successive.

**Stato mantenuto:**
| Variabile | Tipo | Significato |
|---|---|---|
| `Portal.currentStep` | number (1-5) | Step corrente nel percorso |
| `VoceGuidata.stuckCount` | number | Quante volte l'utente ha chiesto aiuto (in questo step) |
| `VoceGuidata.lastActionTime` | timestamp | Ultima azione dell'utente (per inactivity timer) |
| `VoceGuidata.apiKey` | string | API key salvata per la sessione |
| `VoiceGuide.lastSpokenText` | string | Ultima frase pronunciata (per "Ripeti") |

**Reset del contesto:**
- `stuckCount` viene azzerato ad ogni cambio step (ogni step è un nuovo capitolo)
- `lastActionTime` viene aggiornato ad ogni azione utente (click, Tab, shortcut)
- Il contesto dell'LLM viene ricostruito ad ogni chiamata (stateless API)

---

## 5. Progressive Escalation (Escalation Progressiva)

**Descrizione:** Le istruzioni aumentano progressivamente in dettaglio e specificità in base al numero di difficoltà incontrate dall'utente, senza mai sovraccaricare cognitivamente.

**Livelli:**

| Livello | stuckCount | Tipo istruzione | Esempio (step 3) |
|---|---|---|---|
| **Standard** | 0 | Orientamento: dove siamo, cosa fare | "Vedi la lista dei tuoi documenti. Cerca e seleziona Attestato di Rischio RC Auto." |
| **Espanso** | 1 | Dettaglio + percorso alternativo | "L'Attestato di Rischio è il primo documento della lista. Clicca su di esso o premi Tab per raggiungerlo." |
| **Shortcut** | ≥ 2 | Shortcut in primo piano come soluzione immediata | "Scorciatoia: premi Alt e la lettera R per selezionare automaticamente l'Attestato di Rischio RC Auto." |

**Principio:** Mai "rimproverare" l'utente. Ogni livello è più specifico, non più urgente.  
Lo shortcut è presentato come una **comodità**, non come l'ultima spiaggia.

---

## Interazione tra le Skills

```
[Block Detection]
      │ rilevato blocco
      ▼
[Adaptive Output] ←── seleziona canale in base a stuckCount
      │
      ├── stuckCount 0-1 → [Contextual Generation] (se API key)
      │                           │
      │                    risposta LLM
      │                           │
      └── stuckCount ≥ 2  → shortcut immediato
                │
                ▼
        [Context Maintenance] aggiorna lastActionTime, stuckCount
                │
                ▼
        [Progressive Escalation] determina livello per la prossima richiesta
```
