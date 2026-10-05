# VoceGuidata

Companion audio-first per utenti con difficoltà visive o motorie.  
Hagenthon – Tema 03: Educazione Digitale Inclusiva – Accenture Application Engineering

---

## Descrizione

VoceGuidata è un companion accessibile che si affianca ai portali assicurativi per guidare utenti con difficoltà visive o motorie attraverso procedure digitali complesse.

**Persona target:** Mario, 68 anni, ipovedente lieve e con tremore alle mani. Deve scaricare il suo attestato di rischio RC Auto ma non riesce a navigare il portale da solo.

**Soluzione:** Un pannello laterale audio-first che legge le istruzioni ad alta voce (TTS), suggerisce shortcut da tastiera alternativi al mouse, e adatta automaticamente il livello di dettaglio in base alle difficoltà incontrate dall'utente.

---

## Come avviare

1. Aprire `app/index.html` in un browser moderno (Chrome o Edge consigliati per il supporto TTS)
2. Opzionale: inserire una API key Claude nel pannello VoceGuidata per istruzioni AI-generative
3. Cliccare **"Avvia VoceGuidata"** e seguire le istruzioni vocali passo per passo

> Nessun server locale richiesto. Nessuna dipendenza npm. Funziona aprendo il file HTML direttamente.

---

## Shortcut da tastiera (demo)

| Tasto | Azione | Step |
|---|---|---|
| `Alt + A` | Accedi al portale | 1 - Login |
| `Alt + D` | Vai a Documenti | 2 - Dashboard |
| `Alt + R` | Seleziona Attestato di Rischio | 3 - Documenti |
| `Alt + C` | Continua con la polizza | 4 - Selezione polizza |
| `Alt + S` | Scarica PDF | 5 - Download |
| `Esc` | Ferma la voce | Qualsiasi |
| `Tab` | Naviga tra gli elementi | Qualsiasi |

---

## Struttura del progetto

```
voceguidata/
├── app/
│   ├── index.html        — Prototipo funzionante (entry point)
│   ├── style.css         — Dark theme WCAG AA, Inter, #A100FF accent
│   ├── voice-guide.js    — Modulo TTS (Web Speech API, it-IT)
│   ├── agent.js          — Intelligenza contestuale (Claude API + fallback statico)
│   ├── keyboard-nav.js   — Shortcut Alt+[tasto], Tab focus highlight
│   └── portal.js         — Portale simulato a 5 step con timer inattività
├── agents/
│   ├── system-prompt.md  — System prompt completo per Claude
│   ├── workflow.md       — Flusso agentico e decision tree
│   └── skills.md         — 5 capability agentiche documentate
├── presentation/
│   └── index.html        — Presentazione HTML Accenture-branded (standalone)
└── README.md
```

---

## Capability agentiche

1. **Block Detection** — Timer 15s + check ogni 5s per rilevare inattività
2. **Adaptive Output** — Selezione canale (voce / testo / shortcut) in base a `stuckCount`
3. **Contextual Generation** — Claude API per istruzioni personalizzate (fallback statico se assente)
4. **Context Maintenance** — Stato sessione: step corrente, stuckCount, lastActionTime
5. **Progressive Escalation** — standard → espanso → shortcut in primo piano

---

## Tecnologie

- Vanilla HTML5 / CSS3 / JavaScript (ES6+)
- Web Speech API (TTS nativa del browser)
- Claude claude-haiku-4-5-20251001 via Anthropic API (opzionale)
- Google Fonts (Inter)
- Zero dipendenze npm / build step

---

## Accessibilità

- WCAG AA: contrasto ≥ 4.5:1
- Font base: 18px
- Focus visible con outline viola 4px
- aria-live per aggiornamenti dinamici
- aria-label su tutti i controlli interattivi
- Navigazione completa via Tab

---

## Team

- andrea.loris.gialain@accenture.com

---

*Hagenthon 2025 · Accenture Application Engineering · Tema 03: Educazione Digitale Inclusiva*
