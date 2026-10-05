/**
 * VoceGuidata — portal.js
 * Portale AssicuraMi: due scenari (Attestato di Rischio / Apertura Sinistro).
 * Shortcut Alt+[tasto] e timer di inattività per ogni step.
 *
 * Flussi:
 *  attestato → docs → polizza → download
 *  sinistro  → tipo → dati   → veicoli → allegati → conferma
 */

var Portal = (() => {
  'use strict';

  let _steps   = [];   // array di stepId per il flusso corrente
  let _stepIdx = 0;    // posizione nell'array
  let _flow    = null; // 'attestato' | 'sinistro'
  let _inactivityTimer = null;
  let _formData = {};  // dati raccolti dai form durante la navigazione

  // ── Sequenze per flusso ─────────────────────────────────────────
  const FLOW_STEPS = {
    attestato: ['login', 'dashboard', 'att_docs', 'att_polizza', 'att_download'],
    sinistro:  ['login', 'dashboard', 'sin_tipo', 'sin_dati', 'sin_veicoli', 'sin_allegati', 'sin_conferma'],
  };

  const FLOW_LABELS = {
    attestato: ['Login', 'Dashboard', 'Documenti', 'Polizza', 'Download'],
    sinistro:  ['Login', 'Dashboard', 'Tipo', 'Evento', 'Veicoli', 'Allegati', 'Conferma'],
  };

  // ── Nav bar (step 2+) ────────────────────────────────────────────
  function _navBar(active = 'dashboard') {
    const tabs = [
      { id: 'polizze',    label: 'Le mie polizze',  icon: '📋', action: "Portal.goTo('dashboard')" },
      { id: 'documenti',  label: 'Documenti',         icon: '📁', action: "Portal.startFlow('attestato')" },
      { id: 'sinistri',   label: 'Sinistri',          icon: '🔔', action: "Portal.startFlow('sinistro')" },
      { id: 'pagamenti',  label: 'Pagamenti',          icon: '💳', action: "Portal._notifyAction()" },
      { id: 'assistenza', label: 'Assistenza',         icon: '💬', action: "Portal._notifyAction()" },
    ];
    return `
      <nav class="p-nav">
        <div class="p-nav-brand">
          <div class="p-nav-logo">
            <span class="p-nav-logo-icon">🛡️</span>
            <span class="p-nav-logo-name">AssicuraMi</span>
            <span class="p-nav-logo-tag">Area Clienti</span>
          </div>
          <div class="p-nav-user">
            <span class="p-nav-avatar">MR</span>
            <span class="p-nav-name">Mario Rossi</span>
            <button class="p-nav-logout" onclick="Portal.goTo('dashboard')">Esci</button>
          </div>
        </div>
        <div class="p-nav-tabs" role="tablist">
          ${tabs.map(t => `
            <button class="p-nav-tab ${t.id === active ? 'active' : ''}"
                    role="tab" aria-selected="${t.id === active}"
                    onclick="${t.action}"
                    aria-label="${t.label}">
              <span class="p-nav-tab-icon">${t.icon}</span>${t.label}
            </button>`).join('')}
        </div>
      </nav>`;
  }

  // ════════════════════════════════════════════════════════════════
  // STEP DEFINITIONS
  // ════════════════════════════════════════════════════════════════
  const STEP_DEFS = {

    // ── LOGIN ──────────────────────────────────────────────────────
    login: {
      name: 'Login', shortcutKey: 'A', shortcutLabel: 'Accedere al portale',
      render() {
        return `
          <div class="p-login-page">
            <header class="p-login-header">
              <span>🛡️</span>
              <span>AssicuraMi</span>
            </header>
            <div class="p-login-split">
              <div class="p-login-left">
                <h1 class="p-login-title">Accedi all'Area Clienti</h1>
                <p class="p-login-sub">Gestisci polizze, documenti e sinistri in un unico posto.</p>
                <ul class="p-login-features">
                  <li>✔ Scarica attestato di rischio</li>
                  <li>✔ Apri e segui pratiche sinistro</li>
                  <li>✔ Visualizza e paga le tue polizze</li>
                  <li>✔ Contatta la tua agenzia</li>
                </ul>
              </div>
              <div class="p-login-card">
                <h2 class="p-login-card-title">Accedi</h2>
                <div class="p-form-group">
                  <label class="p-form-label" for="p-user">Codice fiscale o e-mail</label>
                  <input class="p-form-input" id="p-user" type="text"
                         value="mario.rossi@email.it" autocomplete="username">
                </div>
                <div class="p-form-group">
                  <label class="p-form-label" for="p-pass">
                    Password
                    <a href="#" class="p-link" onclick="return false">Password dimenticata?</a>
                  </label>
                  <input class="p-form-input" id="p-pass" type="password"
                         value="demo1234" autocomplete="current-password">
                </div>
                <label class="p-check-row">
                  <input type="checkbox" checked> Ricordami
                </label>
                <button class="p-btn-primary" onclick="Portal.advance()">Accedi</button>
                <p class="p-form-note">🔒 Connessione protetta SSL</p>
                <div class="p-shortcut-row">
                  <span class="p-key">Alt</span>+<span class="p-key">A</span> per accedere
                </div>
              </div>
            </div>
          </div>`;
      }
    },

    // ── DASHBOARD (scelta scenario) ────────────────────────────────
    dashboard: {
      name: 'Dashboard', shortcutKey: null, shortcutLabel: null,
      render() {
        const oggi = new Date().toLocaleDateString('it-IT',
          { weekday:'long', day:'numeric', month:'long', year:'numeric' });
        return `
          <div class="p-page">
            ${_navBar('polizze')}
            <div class="p-content">
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Buongiorno, Mario</h1>
                  <p class="p-page-sub">${oggi}</p>
                </div>
                <span class="p-badge-green">✔ Tutte le polizze attive</span>
              </div>

              <div class="p-cards-row">
                <div class="p-summary-card">
                  <div class="p-summary-icon">🚗</div>
                  <div class="p-summary-body">
                    <div class="p-summary-label">RC Auto</div>
                    <div class="p-summary-val">EF 482 GH</div>
                    <div class="p-summary-meta">Scadenza: 31/12/2025</div>
                  </div>
                  <span class="p-chip active">Attiva</span>
                </div>
                <div class="p-summary-card">
                  <div class="p-summary-icon">🏠</div>
                  <div class="p-summary-body">
                    <div class="p-summary-label">Casa Plus</div>
                    <div class="p-summary-val">Via Roma 14</div>
                    <div class="p-summary-meta">Scadenza: 15/03/2026</div>
                  </div>
                  <span class="p-chip active">Attiva</span>
                </div>
                <div class="p-summary-card">
                  <div class="p-summary-icon">❤️</div>
                  <div class="p-summary-body">
                    <div class="p-summary-label">Salute</div>
                    <div class="p-summary-val">Piano Famiglia</div>
                    <div class="p-summary-meta">Scadenza: 01/09/2026</div>
                  </div>
                  <span class="p-chip active">Attiva</span>
                </div>
              </div>

              <h2 class="p-section-title">Cosa vuoi fare oggi?</h2>
              <div class="p-scenario-grid">
                <button class="p-scenario-card" onclick="Portal.startFlow('attestato')"
                        aria-label="Scarica l'attestato di rischio RC Auto">
                  <div class="p-scenario-icon">📄</div>
                  <div class="p-scenario-body">
                    <div class="p-scenario-name">Attestato di Rischio</div>
                    <div class="p-scenario-desc">Scarica il documento per il rinnovo o cambio compagnia</div>
                  </div>
                  <span class="p-scenario-arrow">›</span>
                </button>
                <button class="p-scenario-card" onclick="Portal.startFlow('sinistro')"
                        aria-label="Apri una pratica sinistro">
                  <div class="p-scenario-icon">🔔</div>
                  <div class="p-scenario-body">
                    <div class="p-scenario-name">Apertura Sinistro</div>
                    <div class="p-scenario-desc">Segnala un incidente, un furto o un danno alla tua polizza</div>
                  </div>
                  <span class="p-scenario-arrow">›</span>
                </button>
                <button class="p-scenario-card" onclick="Portal._notifyAction()"
                        aria-label="Effettua un pagamento">
                  <div class="p-scenario-icon">💳</div>
                  <div class="p-scenario-body">
                    <div class="p-scenario-name">Pagamento</div>
                    <div class="p-scenario-desc">Paga o rinnova le tue polizze online</div>
                  </div>
                  <span class="p-scenario-arrow">›</span>
                </button>
                <button class="p-scenario-card" onclick="Portal._notifyAction()"
                        aria-label="Contatta l'assistenza">
                  <div class="p-scenario-icon">💬</div>
                  <div class="p-scenario-body">
                    <div class="p-scenario-name">Assistenza</div>
                    <div class="p-scenario-desc">Parla con un operatore o trova la tua agenzia</div>
                  </div>
                  <span class="p-scenario-arrow">›</span>
                </button>
              </div>
            </div>
          </div>`;
      }
    },

    // ══════════════ FLUSSO ATTESTATO ══════════════

    att_docs: {
      name: 'Documenti', shortcutKey: 'R', shortcutLabel: "Selezionare l'Attestato di Rischio",
      render() {
        return `
          <div class="p-page">
            ${_navBar('documenti')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Dashboard</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Documenti</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">I tuoi documenti</h1>
                  <p class="p-page-sub">Visualizza e scarica i documenti delle tue polizze</p>
                </div>
              </div>
              <div class="p-filter-row">
                <span class="p-filter-label">Filtra per:</span>
                <button class="p-filter-chip active" onclick="Portal._notifyAction()">Tutti</button>
                <button class="p-filter-chip" onclick="Portal._notifyAction()">RC Auto</button>
                <button class="p-filter-chip" onclick="Portal._notifyAction()">Casa</button>
                <button class="p-filter-chip" onclick="Portal._notifyAction()">Salute</button>
              </div>
              <table class="p-doc-table">
                <thead>
                  <tr>
                    <th>Documento</th><th>Polizza</th><th>Data</th><th>Stato</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="p-doc-row highlighted" tabindex="0"
                      onclick="Portal.advance()"
                      onkeydown="if(event.key==='Enter'||event.key===' ')Portal.advance()">
                    <td><span class="p-doc-icon">🚗</span><div>
                      <div class="p-doc-name">Attestato di Rischio RC Auto</div>
                      <div class="p-doc-type">Documento obbligatorio</div>
                    </div></td>
                    <td class="p-doc-pol">RC-2024-00847<br><small>EF 482 GH · Fiat Panda</small></td>
                    <td class="p-doc-date">05/10/2025</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation();Portal.advance()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td><span class="p-doc-icon">📄</span><div>
                      <div class="p-doc-name">Contratto RC Auto 2025</div>
                      <div class="p-doc-type">Contratto</div>
                    </div></td>
                    <td class="p-doc-pol">RC-2024-00847<br><small>EF 482 GH</small></td>
                    <td class="p-doc-date">01/01/2025</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td><span class="p-doc-icon">🏠</span><div>
                      <div class="p-doc-name">Contratto Casa Plus</div>
                      <div class="p-doc-type">Contratto</div>
                    </div></td>
                    <td class="p-doc-pol">CA-2024-00213<br><small>Via Roma 14</small></td>
                    <td class="p-doc-date">15/03/2025</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td><span class="p-doc-icon">📋</span><div>
                      <div class="p-doc-name">Quietanza rinnovo 2025</div>
                      <div class="p-doc-type">Ricevuta pagamento</div>
                    </div></td>
                    <td class="p-doc-pol">RC-2024-00847<br><small>EF 482 GH</small></td>
                    <td class="p-doc-date">28/11/2024</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation()">Apri →</button></td>
                  </tr>
                </tbody>
              </table>
              <div class="p-shortcut-row" style="margin-top:1rem;">
                <span class="p-key">Alt</span>+<span class="p-key">R</span> per aprire l'Attestato di Rischio
              </div>
            </div>
          </div>`;
      }
    },

    att_polizza: {
      name: 'Selezione polizza', shortcutKey: 'C', shortcutLabel: 'Confermare la selezione',
      render() {
        return `
          <div class="p-page">
            ${_navBar('documenti')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Documenti</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Attestato di Rischio</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Attestato di Rischio RC Auto</h1>
                  <p class="p-page-sub">Seleziona il veicolo per cui generare l'attestato</p>
                </div>
              </div>
              <div class="p-info-strip">
                ℹ️ L'attestato certifica la tua classe bonus-malus (CU). Viene richiesto al rinnovo o cambio compagnia.
              </div>
              <div class="p-policy-grid" id="policy-list" role="radiogroup">
                <div class="p-policy-card selected" id="pol-1" tabindex="0"
                     role="radio" aria-checked="true"
                     onclick="Portal._selectPolicy(1)"
                     onkeydown="if(event.key==='Enter'||event.key===' ')Portal._selectPolicy(1)">
                  <div class="p-policy-sel-indicator">✔</div>
                  <div class="p-policy-targa">EF 482 GH</div>
                  <div class="p-policy-car">🚗 Fiat Panda 1.2</div>
                  <div class="p-policy-detail">RC Auto + Furto/Incendio</div>
                  <div class="p-policy-meta">
                    <div>N° polizza: <strong>RC-2024-00847</strong></div>
                    <div>Classe CU: <strong>14</strong></div>
                    <div>Scadenza: <strong>31/12/2025</strong></div>
                  </div>
                </div>
                <div class="p-policy-card" id="pol-2" tabindex="0"
                     role="radio" aria-checked="false"
                     onclick="Portal._selectPolicy(2)"
                     onkeydown="if(event.key==='Enter'||event.key===' ')Portal._selectPolicy(2)">
                  <div class="p-policy-sel-indicator">✔</div>
                  <div class="p-policy-targa">AB 371 CD</div>
                  <div class="p-policy-car">🚙 Renault Clio 1.5 dCi</div>
                  <div class="p-policy-detail">Solo RC Auto</div>
                  <div class="p-policy-meta">
                    <div>N° polizza: <strong>RC-2023-00312</strong></div>
                    <div>Classe CU: <strong>11</strong></div>
                    <div>Scadenza: <strong>28/02/2026</strong></div>
                  </div>
                </div>
              </div>
              <div class="p-action-row">
                <button class="p-btn-ghost" onclick="Portal._notifyAction()">← Annulla</button>
                <button class="p-btn-primary" style="width:auto" onclick="Portal.advance()">
                  Genera attestato →
                </button>
              </div>
              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">C</span> per confermare
              </div>
            </div>
          </div>`;
      }
    },

    att_download: {
      name: 'Download attestato', shortcutKey: 'S', shortcutLabel: 'Scaricare il PDF',
      render() {
        const oggi = new Date().toLocaleDateString('it-IT',
          { day:'2-digit', month:'2-digit', year:'numeric' });
        return `
          <div class="p-page">
            ${_navBar('documenti')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Documenti</span><span class="p-bc-sep">›</span>
                <span>Attestato di Rischio</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">EF 482 GH</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Attestato di Rischio</h1>
                  <p class="p-page-sub">Documento pronto — generato il ${oggi}</p>
                </div>
                <span class="p-badge-green">✔ Valido</span>
              </div>
              <div class="p-download-area">
                <div class="p-pdf-preview">
                  <div class="p-pdf-icon">📄</div>
                  <div class="p-pdf-meta">
                    <div class="p-pdf-name">Attestato_Rischio_EF482GH_2025.pdf</div>
                    <table class="p-pdf-table">
                      <tr><td>Intestatario</td><td><strong>Mario Rossi</strong></td></tr>
                      <tr><td>Veicolo</td><td><strong>Fiat Panda 1.2 — EF 482 GH</strong></td></tr>
                      <tr><td>N° polizza</td><td><strong>RC-2024-00847</strong></td></tr>
                      <tr><td>Classe CU</td><td><strong>14</strong></td></tr>
                      <tr><td>Validità</td><td><strong>01/01/2025 – 31/12/2025</strong></td></tr>
                      <tr><td>Sinistri ultimo biennio</td><td><strong>0</strong></td></tr>
                    </table>
                  </div>
                </div>
                <div class="p-download-actions">
                  <button class="p-btn-primary p-btn-download" id="btn-download" onclick="Portal._triggerDownload()">
                    📥 Scarica PDF
                  </button>
                  <button class="p-btn-ghost" onclick="Portal._notifyAction()">✉️ Invia per e-mail</button>
                  <div class="p-download-success" id="download-success">✅ Download completato!</div>
                </div>
                <div class="p-shortcut-row">
                  <span class="p-key">Alt</span>+<span class="p-key">S</span> per scaricare il PDF
                </div>
              </div>
              <div class="p-success-banner" id="success-banner" style="display:none;">
                🎉 <strong>Mario ha scaricato l'attestato in autonomia</strong> grazie a VoceGuidata.
              </div>
            </div>
          </div>`;
      }
    },

    // ══════════════ FLUSSO SINISTRO ══════════════

    sin_tipo: {
      name: 'Tipo sinistro', shortcutKey: 'T', shortcutLabel: 'Selezionare il tipo di sinistro',
      render() {
        return `
          <div class="p-page">
            ${_navBar('sinistri')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Dashboard</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Apertura sinistro</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Apertura sinistro</h1>
                  <p class="p-page-sub">Passo 1 di 5 — Seleziona il tipo di evento</p>
                </div>
              </div>
              <div class="p-info-strip">
                ℹ️ La segnalazione non costituisce automaticamente apertura di una pratica.
                Un nostro operatore la contatterà entro 24 ore per confermare.
              </div>
              <div class="p-tipo-grid" id="tipo-grid" role="radiogroup" aria-label="Tipo di sinistro">
                <button class="p-tipo-card selected" id="tipo-1" tabindex="0"
                        role="radio" aria-checked="true"
                        onclick="Portal._selectTipo(1)">
                  <span class="p-tipo-icon">🚗💥</span>
                  <div class="p-tipo-name">Incidente stradale</div>
                  <div class="p-tipo-desc">Collisione con altri veicoli o danni da incidente</div>
                </button>
                <button class="p-tipo-card" id="tipo-2" tabindex="0"
                        role="radio" aria-checked="false"
                        onclick="Portal._selectTipo(2)">
                  <span class="p-tipo-icon">🌧️⚡</span>
                  <div class="p-tipo-name">Evento atmosferico</div>
                  <div class="p-tipo-desc">Grandine, alluvione, vento forte, fulmini</div>
                </button>
                <button class="p-tipo-card" id="tipo-3" tabindex="0"
                        role="radio" aria-checked="false"
                        onclick="Portal._selectTipo(3)">
                  <span class="p-tipo-icon">🔒🚨</span>
                  <div class="p-tipo-name">Furto o tentativo</div>
                  <div class="p-tipo-desc">Furto del veicolo o di parti di esso</div>
                </button>
                <button class="p-tipo-card" id="tipo-4" tabindex="0"
                        role="radio" aria-checked="false"
                        onclick="Portal._selectTipo(4)">
                  <span class="p-tipo-icon">🏗️🔧</span>
                  <div class="p-tipo-name">Danni a cose / terzi</div>
                  <div class="p-tipo-desc">Danni causati ad altri veicoli o proprietà</div>
                </button>
              </div>
              <div class="p-action-row" style="margin-top:1.5rem;">
                <button class="p-btn-ghost" onclick="Portal.goTo('dashboard')">← Torna alla dashboard</button>
                <button class="p-btn-primary" style="width:auto" onclick="Portal.advance()">
                  Continua →
                </button>
              </div>
              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">T</span> per confermare il tipo selezionato
              </div>
            </div>
          </div>`;
      }
    },

    sin_dati: {
      name: 'Dati evento', shortcutKey: 'P', shortcutLabel: 'Proseguire con i dati inseriti',
      render() {
        const oggi = new Date().toISOString().split('T')[0];
        const ora  = new Date().toTimeString().slice(0,5);
        return `
          <div class="p-page">
            ${_navBar('sinistri')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Sinistro</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Dati dell'evento</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Dati dell'evento</h1>
                  <p class="p-page-sub">Passo 2 di 5 — Quando e dove è avvenuto</p>
                </div>
              </div>
              <div class="p-sin-form">
                <div class="p-sin-row">
                  <div class="p-form-group" style="flex:1">
                    <label class="p-form-label" for="sin-data">Data dell'evento *</label>
                    <input class="p-form-input" id="sin-data" type="date" value="${oggi}"
                           aria-label="Data del sinistro">
                  </div>
                  <div class="p-form-group" style="flex:0 0 120px">
                    <label class="p-form-label" for="sin-ora">Ora *</label>
                    <input class="p-form-input" id="sin-ora" type="time" value="${ora}"
                           aria-label="Ora del sinistro">
                  </div>
                </div>
                <div class="p-sin-row">
                  <div class="p-form-group" style="flex:1">
                    <label class="p-form-label" for="sin-citta">Città *</label>
                    <input class="p-form-input" id="sin-citta" type="text"
                           placeholder="es. Milano" value="Milano"
                           aria-label="Città dove è avvenuto il sinistro">
                  </div>
                  <div class="p-form-group" style="flex:2">
                    <label class="p-form-label" for="sin-via">Via / Località *</label>
                    <input class="p-form-input" id="sin-via" type="text"
                           placeholder="es. Via Torino 45"
                           aria-label="Via o località del sinistro">
                  </div>
                </div>
                <div class="p-form-group">
                  <label class="p-form-label" for="sin-dinamica">
                    Descrizione dell'accaduto *
                    <span class="p-form-hint">max 500 caratteri</span>
                  </label>
                  <textarea class="p-form-input p-textarea" id="sin-dinamica" rows="4"
                            placeholder="Descrivi brevemente cosa è successo: dinamica dell'incidente, condizioni stradali, visibilità..."
                            aria-label="Descrizione della dinamica del sinistro"></textarea>
                </div>
                <div class="p-form-group">
                  <label class="p-form-label">Veicolo coinvolto *</label>
                  <div class="p-sin-veicolo-display" aria-label="Veicolo selezionato">
                    <span class="p-sin-veicolo-icon">🚗</span>
                    <div>
                      <div class="p-sin-veicolo-targa">EF 482 GH</div>
                      <div class="p-sin-veicolo-desc">Fiat Panda 1.2 — Polizza RC-2024-00847</div>
                    </div>
                    <span class="p-chip active" style="margin-left:auto">RC Auto attiva</span>
                  </div>
                </div>
              </div>
              <div class="p-action-row">
                <button class="p-btn-ghost" onclick="Portal.back()">← Indietro</button>
                <button class="p-btn-primary" style="width:auto" onclick="Portal.advance()">
                  Prosegui →
                </button>
              </div>
              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">P</span> per proseguire
              </div>
            </div>
          </div>`;
      }
    },

    sin_veicoli: {
      name: 'Veicoli e danni', shortcutKey: 'P', shortcutLabel: 'Proseguire con i dati inseriti',
      render() {
        return `
          <div class="p-page">
            ${_navBar('sinistri')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Sinistro</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Veicoli e danni</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Veicoli e danni</h1>
                  <p class="p-page-sub">Passo 3 di 5 — Controparti e descrizione danni</p>
                </div>
              </div>
              <div class="p-sin-form">
                <div class="p-form-group">
                  <label class="p-form-label">Erano coinvolti altri veicoli? *</label>
                  <div class="p-radio-group" role="radiogroup" id="altri-veicoli-group">
                    <label class="p-radio-row">
                      <input type="radio" name="altri" value="si" id="altri-si"
                             onchange="Portal._toggleTerzo(true)">
                      <span>Sì, c'era almeno un altro veicolo</span>
                    </label>
                    <label class="p-radio-row">
                      <input type="radio" name="altri" value="no" id="altri-no" checked
                             onchange="Portal._toggleTerzo(false)">
                      <span>No, sinistro con solo il mio veicolo</span>
                    </label>
                  </div>
                </div>
                <div id="terzo-block" style="display:none;">
                  <div class="p-sin-section-title">Dati del veicolo della controparte</div>
                  <div class="p-sin-row">
                    <div class="p-form-group" style="flex:1">
                      <label class="p-form-label" for="terzo-targa">Targa</label>
                      <input class="p-form-input" id="terzo-targa" type="text"
                             placeholder="XX 000 YY" style="text-transform:uppercase"
                             aria-label="Targa veicolo controparte">
                    </div>
                    <div class="p-form-group" style="flex:2">
                      <label class="p-form-label" for="terzo-compagnia">Compagnia assicuratrice</label>
                      <input class="p-form-input" id="terzo-compagnia" type="text"
                             placeholder="es. Allianz, Generali, AXA..."
                             aria-label="Compagnia assicuratrice del veicolo terzo">
                    </div>
                  </div>
                  <label class="p-check-row">
                    <input type="checkbox" id="cid-check">
                    <span>Ho il <strong>CID</strong> (Constatazione Amichevole) firmato da entrambe le parti</span>
                  </label>
                </div>
                <div class="p-form-group" style="margin-top:1rem;">
                  <label class="p-form-label" for="sin-danni">Descrizione danni al tuo veicolo *</label>
                  <textarea class="p-form-input p-textarea" id="sin-danni" rows="3"
                            placeholder="Indica le parti danneggiate: es. paraurti anteriore, fanale sinistro, cofano..."
                            aria-label="Descrizione dei danni subiti"></textarea>
                </div>
                <div class="p-form-group">
                  <label class="p-form-label">Presenza di feriti?</label>
                  <div class="p-radio-group" role="radiogroup">
                    <label class="p-radio-row">
                      <input type="radio" name="feriti" value="no" checked>
                      <span>No, nessun ferito</span>
                    </label>
                    <label class="p-radio-row">
                      <input type="radio" name="feriti" value="si">
                      <span>Sì, ci sono stati feriti (sarà necessario allegare referto medico)</span>
                    </label>
                  </div>
                </div>
                <label class="p-check-row">
                  <input type="checkbox" id="forze-check">
                  <span>Sono intervenute le forze dell'ordine (Polizia/Carabinieri)</span>
                </label>
              </div>
              <div class="p-action-row">
                <button class="p-btn-ghost" onclick="Portal.back()">← Indietro</button>
                <button class="p-btn-primary" style="width:auto" onclick="Portal.advance()">
                  Prosegui →
                </button>
              </div>
              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">P</span> per proseguire
              </div>
            </div>
          </div>`;
      }
    },

    sin_allegati: {
      name: 'Allegati', shortcutKey: 'A', shortcutLabel: 'Procedere senza allegati',
      render() {
        return `
          <div class="p-page">
            ${_navBar('sinistri')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Sinistro</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Allegati</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Allega i documenti</h1>
                  <p class="p-page-sub">Passo 4 di 5 — Facoltativi ma utili per velocizzare la pratica</p>
                </div>
              </div>
              <div class="p-allegati-list">
                <div class="p-allegato-row">
                  <div class="p-allegato-info">
                    <div class="p-allegato-icon">📷</div>
                    <div>
                      <div class="p-allegato-name">Foto dei danni</div>
                      <div class="p-allegato-desc">Fotografie del veicolo danneggiato · JPG, PNG · max 10 MB ciascuna</div>
                    </div>
                  </div>
                  <div class="p-allegato-actions">
                    <div class="p-upload-sim" onclick="Portal._simulaUpload(this, 'foto')">
                      <span class="p-upload-icon">⬆️</span>
                      <span>Seleziona file</span>
                    </div>
                    <div class="p-upload-done" style="display:none">✅ 2 foto caricate</div>
                  </div>
                </div>
                <div class="p-allegato-row">
                  <div class="p-allegato-info">
                    <div class="p-allegato-icon">📝</div>
                    <div>
                      <div class="p-allegato-name">CID — Constatazione Amichevole</div>
                      <div class="p-allegato-desc">Se firmato dalla controparte · PDF, JPG · max 5 MB</div>
                    </div>
                  </div>
                  <div class="p-allegato-actions">
                    <div class="p-upload-sim" onclick="Portal._simulaUpload(this, 'cid')">
                      <span class="p-upload-icon">⬆️</span>
                      <span>Seleziona file</span>
                    </div>
                    <div class="p-upload-done" style="display:none">✅ CID caricato</div>
                  </div>
                </div>
                <div class="p-allegato-row">
                  <div class="p-allegato-info">
                    <div class="p-allegato-icon">🚓</div>
                    <div>
                      <div class="p-allegato-name">Verbale forze dell'ordine</div>
                      <div class="p-allegato-desc">Se presente sul posto · PDF · max 5 MB</div>
                    </div>
                  </div>
                  <div class="p-allegato-actions">
                    <div class="p-upload-sim" onclick="Portal._simulaUpload(this, 'verbale')">
                      <span class="p-upload-icon">⬆️</span>
                      <span>Seleziona file</span>
                    </div>
                    <div class="p-upload-done" style="display:none">✅ Verbale caricato</div>
                  </div>
                </div>
              </div>
              <div class="p-info-strip" style="margin-top:1rem;">
                💡 Puoi aggiungere allegati anche in un secondo momento, direttamente dalla pratica sinistro.
              </div>
              <div class="p-action-row">
                <button class="p-btn-ghost" onclick="Portal.back()">← Indietro</button>
                <button class="p-btn-ghost" onclick="Portal.advance()">Salta →</button>
                <button class="p-btn-primary" style="width:auto" onclick="Portal.advance()">
                  Prosegui →
                </button>
              </div>
              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">A</span> per procedere senza allegati
              </div>
            </div>
          </div>`;
      }
    },

    sin_conferma: {
      name: 'Conferma', shortcutKey: 'I', shortcutLabel: 'Inviare la segnalazione',
      render() {
        const numSin = 'SIN-' + new Date().getFullYear() + '-' +
          String(Math.floor(Math.random() * 90000) + 10000);
        return `
          <div class="p-page">
            ${_navBar('sinistri')}
            <div class="p-content">
              <nav class="p-breadcrumb">
                <span>Sinistro</span><span class="p-bc-sep">›</span>
                <span class="p-bc-active">Riepilogo e conferma</span>
              </nav>
              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Riepilogo segnalazione</h1>
                  <p class="p-page-sub">Passo 5 di 5 — Controlla e invia</p>
                </div>
              </div>
              <div class="p-riepilogo-card">
                <div class="p-riepilogo-row"><span>Tipo sinistro</span><strong>${_formData.tipo || '—'}</strong></div>
                <div class="p-riepilogo-row"><span>Data evento</span><strong>${_fmtData(_formData.data)} ore ${_formData.ora || '—'}</strong></div>
                <div class="p-riepilogo-row"><span>Luogo</span><strong>${_formData.citta || '—'} — ${_formData.via || '—'}</strong></div>
                <div class="p-riepilogo-row"><span>Veicolo</span><strong>${_formData.veicolo || '—'}</strong></div>
                <div class="p-riepilogo-row"><span>Altri veicoli</span><strong>${_formData.altriVeicoli || 'No'}</strong></div>
                <div class="p-riepilogo-row"><span>Feriti</span><strong>${_formData.feriti || 'No'}</strong></div>
                <div class="p-riepilogo-row"><span>Allegati</span><strong>${_formData.allegati || 'Nessuno'}</strong></div>
              </div>
              <div class="p-info-strip" style="margin-top:1rem;">
                ⚠️ Verificare che tutti i dati siano corretti prima di inviare. Una volta inviata, la segnalazione
                non può essere modificata autonomamente.
              </div>
              <div class="p-conferma-actions">
                <button class="p-btn-ghost" onclick="Portal.back()">← Modifica</button>
                <button class="p-btn-primary" style="width:auto; background:#c0392b;"
                        id="btn-invia" onclick="Portal._triggerSinistro('${numSin}')">
                  📨 Invia segnalazione
                </button>
              </div>
              <div class="p-download-success" id="sin-success" style="display:none; margin-top:1rem; color:#1a7a4a; font-size:1rem; font-weight:600; gap:.5rem; align-items:center;">
                ✅ Segnalazione inviata correttamente
              </div>
              <div class="p-sin-esito" id="sin-esito" style="display:none;"></div>
              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">I</span> per inviare la segnalazione
              </div>
            </div>
          </div>`;
      }
    },
  };

  // ════════════════════════════════════════════════════════════════
  // API PUBBLICA
  // ════════════════════════════════════════════════════════════════

  function init() {
    _flow    = null;
    _steps   = ['login', 'dashboard'];
    _stepIdx = 0;
    _renderStep();
  }

  function advance() {
    if (_stepIdx < _steps.length - 1) {
      _collectFormData(_steps[_stepIdx]); // salva dati prima di cambiare step
      _notifyAction();
      _stepIdx++;
      _renderStep();
      _notifyStepChange();
    }
  }

  function back() {
    if (_stepIdx > 0) {
      _notifyAction();
      _stepIdx--;
      _renderStep();
      _notifyStepChange();
    }
  }

  function startFlow(flowName) {
    _flow     = flowName;
    _steps    = FLOW_STEPS[flowName];
    _stepIdx  = 2; // salta login + dashboard
    _formData = {}; // reset dati form per il nuovo flusso
    _notifyAction();
    _renderStep();
    _notifyStepChange();
    _initProgressLabels();
  }

  function goTo(stepId) {
    const idx = _steps.indexOf(stepId);
    if (idx !== -1) {
      _notifyAction();
      _stepIdx = idx;
      _renderStep();
      _notifyStepChange();
    }
  }

  // ════════════════════════════════════════════════════════════════
  // PRIVATI
  // ════════════════════════════════════════════════════════════════

  function _fmtData(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
  }

  function _collectFormData(stepId) {
    const g = (id) => document.getElementById(id)?.value?.trim() || '';
    const r = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
    const c = (id) => document.getElementById(id)?.checked || false;
    const t = (sel) => document.querySelector(sel)?.textContent?.trim() || '';

    if (stepId === 'sin_tipo') {
      _formData.tipo = t('.p-tipo-card.selected .p-tipo-name') || 'Incidente stradale';
    }
    if (stepId === 'sin_dati') {
      _formData.data     = g('sin-data');
      _formData.ora      = g('sin-ora');
      _formData.citta    = g('sin-citta');
      _formData.via      = g('sin-via');
      _formData.dinamica = g('sin-dinamica');
      _formData.veicolo  = 'EF 482 GH — Fiat Panda 1.2';
    }
    if (stepId === 'sin_veicoli') {
      const altriSi = r('altri') === 'si';
      _formData.altriVeicoli = altriSi ? 'Sì' : 'No';
      _formData.targaTerzo   = altriSi ? (g('terzo-targa') || '—') : '—';
      _formData.hasCid       = c('cid-check') ? 'Sì' : 'No';
      _formData.danni        = g('sin-danni') || '—';
      _formData.feriti       = r('feriti') === 'si' ? 'Sì' : 'No';
      _formData.forze        = c('forze-check') ? 'Sì' : 'No';
    }
    if (stepId === 'sin_allegati') {
      const fotos   = document.querySelector('.p-allegato-row:nth-child(1) .p-upload-done');
      const cid     = document.querySelector('.p-allegato-row:nth-child(2) .p-upload-done');
      const verbale = document.querySelector('.p-allegato-row:nth-child(3) .p-upload-done');
      const parts = [];
      if (fotos?.style.display !== 'none' && fotos)   parts.push('Foto danni');
      if (cid?.style.display   !== 'none' && cid)     parts.push('CID');
      if (verbale?.style.display !== 'none' && verbale) parts.push('Verbale');
      _formData.allegati = parts.length ? parts.join(', ') : 'Nessuno';
    }
  }

  function _renderStep() {
    const container = document.getElementById('portal-screen');
    if (!container) return;

    const stepId  = _steps[_stepIdx];
    const stepDef = STEP_DEFS[stepId];
    if (!stepDef) return;

    container.style.opacity = '0';
    setTimeout(() => {
      container.innerHTML = stepDef.render();
      container.style.opacity = '1';

      KeyboardNav.unregisterAll();
      if (stepDef.shortcutKey) {
        KeyboardNav.register(stepDef.shortcutKey, stepDef.shortcutLabel, () => advance());
      }
      // Shortcut speciali per sinistro
      if (stepId === 'sin_tipo')     KeyboardNav.register('T', 'Tipo sinistro', () => advance());
      if (stepId === 'sin_conferma') KeyboardNav.register('I', 'Inviare', () => _triggerSinistro(_lastSinNum));

      setTimeout(() => {
        const first = container.querySelector('input:not([type=checkbox]):not([type=radio]), button.p-btn-primary, [tabindex="0"]');
        if (first) first.focus();
      }, 300);

      _startInactivityTimer();
    }, 200);
  }

  function _notifyStepChange() {
    const stepId   = _steps[_stepIdx];
    const stepDef  = STEP_DEFS[stepId];
    const stepName = stepDef?.name || '';
    const total    = _steps.length;
    const num      = _stepIdx + 1;

    if (window.VoceGuidata) VoceGuidata.onStepChange(stepId, stepName, num, total);
    _updateProgressBar();
  }

  function _notifyAction() {
    if (window.VoceGuidata) {
      VoceGuidata.lastActionTime = Date.now();
      VoceGuidata.stuckCount     = 0;
    }
  }

  function _selectPolicy(id) {
    _notifyAction();
    document.querySelectorAll('.p-policy-card').forEach((el, i) => {
      const sel = i + 1 === id;
      el.classList.toggle('selected', sel);
      el.setAttribute('aria-checked', String(sel));
    });
  }

  function _selectTipo(id) {
    _notifyAction();
    document.querySelectorAll('.p-tipo-card').forEach((el, i) => {
      const sel = i + 1 === id;
      el.classList.toggle('selected', sel);
      el.setAttribute('aria-checked', String(sel));
    });
  }

  function _toggleTerzo(show) {
    _notifyAction();
    const block = document.getElementById('terzo-block');
    if (block) block.style.display = show ? 'block' : 'none';
  }

  function _simulaUpload(btn, tipo) {
    _notifyAction();
    btn.textContent = '⏳ Caricamento…';
    btn.style.pointerEvents = 'none';
    setTimeout(() => {
      const done = btn.nextElementSibling;
      btn.style.display = 'none';
      if (done) done.style.display = 'block';
    }, 1200);
  }

  let _lastSinNum = '';
  function _triggerSinistro(numSin) {
    _lastSinNum = numSin || _lastSinNum;
    _notifyAction();
    const btn  = document.getElementById('btn-invia');
    if (btn) { btn.textContent = '⏳ Invio in corso…'; btn.disabled = true; }

    setTimeout(() => {
      if (btn) btn.style.display = 'none';
      const succ  = document.getElementById('sin-success');
      const esito = document.getElementById('sin-esito');
      if (succ)  succ.style.display  = 'flex';
      if (esito) {
        esito.style.display = 'block';
        esito.innerHTML = `
          <div class="p-esito-card">
            <div class="p-esito-head">
              <span class="p-esito-check">✅</span>
              <div>
                <div class="p-esito-title">Segnalazione inviata</div>
                <div class="p-esito-num">Numero pratica: <strong>${_lastSinNum}</strong></div>
              </div>
            </div>
            <div class="p-esito-steps">
              <strong>Prossimi passi:</strong>
              <ol>
                <li>Un perito la contatterà entro <strong>24 ore</strong> per la valutazione dei danni.</li>
                <li>Riceverà una e-mail di conferma a <strong>mario.rossi@email.it</strong>.</li>
                <li>Può seguire la pratica in questa sezione con il numero <strong>${_lastSinNum}</strong>.</li>
              </ol>
            </div>
          </div>`;
      }
      if (window.VoiceGuide) VoiceGuide.speak(
        'Ottimo, Mario! La segnalazione è stata inviata. Il numero della tua pratica è ' +
        _lastSinNum.split('-').join(' ') + '. Un perito ti contatterà entro ventiquattro ore.'
      );
      if (window.VoceGuidata) VoceGuidata.showInstruction(
        'Segnalazione inviata! Numero pratica: ' + _lastSinNum + '. Riceverai conferma via e-mail.'
      );
    }, 2000);
  }

  function _triggerDownload() {
    _notifyAction();
    const btn    = document.getElementById('btn-download');
    const succ   = document.getElementById('download-success');
    const banner = document.getElementById('success-banner');
    if (btn) { btn.textContent = '⏳ Generazione…'; btn.disabled = true; }
    setTimeout(() => {
      if (btn)    btn.style.display = 'none';
      if (succ)   succ.style.display = 'flex';
      if (banner) banner.style.display = 'block';
      if (window.VoiceGuide) VoiceGuide.speak('Ottimo Mario, hai scaricato l\'attestato di rischio in autonomia!');
      if (window.VoceGuidata) VoceGuidata.showInstruction('Download completato! Hai scaricato il tuo attestato.');
    }, 1800);
  }

  function _startInactivityTimer() {
    if (_inactivityTimer) clearTimeout(_inactivityTimer);
    if (window.VoceGuidata?.autoHelp === false) return;
    const threshold = window.VoceGuidata?.stuckThresholdMs ?? 15000;
    _inactivityTimer = setTimeout(() => {
      const stepId = _steps[_stepIdx];
      if (window.VoceGuidata && VoceGuidata.started && VoceGuidata.autoHelp !== false && stepId !== 'att_download' && stepId !== 'sin_conferma') {
        VoceGuidata.stuckCount = Math.min(VoceGuidata.stuckCount + 1, 2);
        const sc = STEP_DEFS[stepId]?.shortcutKey;
        const hint = sc
          ? `Posso aiutarti? Usa Alt+${sc} per procedere, oppure premi il tasto Aiuto.`
          : 'Posso aiutarti? Premi il tasto Aiuto per un suggerimento.';
        VoceGuidata.showInstruction(hint);
        if (window.VoiceGuide) VoiceGuide.speak(hint);
      }
    }, threshold);
  }

  function _updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    const total = _steps.length;
    if (bar && total > 1) {
      const pct = (_stepIdx / (total - 1)) * 100;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', Math.round(pct));
    }
    document.querySelectorAll('.step-label').forEach((el, i) => {
      el.classList.toggle('active', i === _stepIdx);
      el.classList.toggle('done',   i <  _stepIdx);
    });
  }

  function _initProgressLabels() {
    const container = document.getElementById('step-labels');
    if (!container || !_flow) return;
    const names = FLOW_LABELS[_flow] || [];
    container.innerHTML = names.map((n, i) =>
      `<span class="step-label ${i === _stepIdx ? 'active' : i < _stepIdx ? 'done' : ''}">${n}</span>`
    ).join('');
  }

  const _api = {
    init, advance, back, startFlow, goTo,
    _selectPolicy, _selectTipo, _toggleTerzo,
    _simulaUpload, _triggerDownload, _triggerSinistro,
    _notifyAction,
  };

  Object.defineProperties(_api, {
    currentStepId:  { get: () => _steps[_stepIdx] || 'login', enumerable: true },
    currentStepNum: { get: () => _stepIdx + 1,                 enumerable: true },
    totalSteps:     { get: () => _steps.length,                enumerable: true },
    currentFlow:    { get: () => _flow,                        enumerable: true },
    currentStep:    { get: () => _stepIdx + 1,                 enumerable: true },
  });

  return _api;

})();

// ── Stili portale realistico ──────────────────────────────────────
;(function () {
  const s = document.createElement('style');
  s.textContent = `
    .step-label { font-size:.7rem; color:rgba(255,255,255,.35); transition:color .3s; }
    .step-label.active { color:#A100FF; font-weight:600; }
    .step-label.done   { color:#00e676; }

    #portal-screen { padding:0 !important; overflow-y:auto; }

    /* Login */
    .p-login-page { background:#fff; min-height:100%; display:flex; flex-direction:column; }
    .p-login-header { background:#1a2e6e; color:#fff; padding:14px 28px; display:flex; align-items:center; gap:10px; font-size:1.1rem; font-weight:700; }
    .p-login-split  { display:flex; flex:1; }
    .p-login-left   { background:#f0f4ff; padding:48px 36px; flex:1; display:flex; flex-direction:column; justify-content:center; }
    .p-login-title  { font-size:1.7rem; font-weight:700; color:#1a2e6e; margin-bottom:.5rem; letter-spacing:-.02em; }
    .p-login-sub    { color:#555; margin-bottom:1.5rem; }
    .p-login-features { list-style:none; padding:0; display:flex; flex-direction:column; gap:.5rem; color:#333; font-size:.95rem; }
    .p-login-card   { background:#fff; padding:36px 32px; width:360px; flex-shrink:0; display:flex; flex-direction:column; gap:0; box-shadow:-4px 0 16px rgba(0,0,0,.06); }
    .p-login-card-title { font-size:1.3rem; font-weight:700; color:#1a2e6e; margin-bottom:1.25rem; }

    /* Form */
    .p-form-group { margin-bottom:1rem; }
    .p-form-label { display:flex; justify-content:space-between; align-items:center; font-size:.82rem; font-weight:600; color:#444; margin-bottom:.35rem; }
    .p-form-hint  { font-size:.72rem; color:#999; font-weight:400; }
    .p-form-input { width:100%; padding:.65rem .85rem; border:1.5px solid #d0d5e8; border-radius:6px; font-size:.95rem; color:#1a1a2e; background:#fff; font-family:inherit; transition:border-color .2s, box-shadow .2s; }
    .p-form-input:focus { border-color:#1a2e6e; box-shadow:0 0 0 3px rgba(26,46,110,.12); outline:none; }
    .p-textarea   { resize:vertical; min-height:90px; }
    .p-check-row  { display:flex; align-items:center; gap:.4rem; font-size:.85rem; color:#555; cursor:pointer; margin-bottom:1rem; }
    .p-form-note  { font-size:.75rem; color:#888; text-align:center; margin-top:.75rem; }
    .p-link       { color:#1a2e6e; text-decoration:none; font-size:.78rem; }
    .p-radio-group { display:flex; flex-direction:column; gap:.5rem; }
    .p-radio-row  { display:flex; align-items:center; gap:.6rem; font-size:.88rem; color:#444; cursor:pointer; }

    /* Buttons */
    .p-btn-primary { display:inline-flex; align-items:center; justify-content:center; gap:.4rem; padding:.72rem 1.5rem; background:#1a2e6e; color:#fff; border:none; border-radius:6px; font-size:.95rem; font-weight:600; cursor:pointer; font-family:inherit; transition:background .2s, box-shadow .2s; width:100%; }
    .p-btn-primary:hover  { background:#243d8f; box-shadow:0 4px 14px rgba(26,46,110,.35); }
    .p-btn-ghost  { display:inline-flex; align-items:center; justify-content:center; gap:.4rem; padding:.55rem 1.1rem; background:transparent; color:#1a2e6e; border:1.5px solid #c0cce8; border-radius:6px; font-size:.88rem; font-weight:500; cursor:pointer; font-family:inherit; transition:all .2s; }
    .p-btn-ghost:hover { background:#f0f4ff; border-color:#1a2e6e; }

    /* Nav */
    .p-nav { background:#1a2e6e; color:#fff; }
    .p-nav-brand  { display:flex; align-items:center; justify-content:space-between; padding:10px 24px; border-bottom:1px solid rgba(255,255,255,.12); }
    .p-nav-logo   { display:flex; align-items:center; gap:8px; }
    .p-nav-logo-icon { font-size:1.2rem; }
    .p-nav-logo-name { font-size:1rem; font-weight:700; }
    .p-nav-logo-tag  { font-size:.7rem; background:rgba(255,255,255,.15); padding:2px 8px; border-radius:999px; color:rgba(255,255,255,.8); }
    .p-nav-user   { display:flex; align-items:center; gap:10px; font-size:.85rem; color:rgba(255,255,255,.85); }
    .p-nav-avatar { width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,.25); display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; }
    .p-nav-name   { font-size:.85rem; }
    .p-nav-logout { background:transparent; border:1px solid rgba(255,255,255,.3); color:rgba(255,255,255,.8); padding:3px 10px; border-radius:4px; font-size:.75rem; cursor:pointer; }
    .p-nav-tabs   { display:flex; padding:0 16px; gap:2px; overflow-x:auto; }
    .p-nav-tab    { display:flex; align-items:center; gap:6px; padding:10px 16px; background:transparent; border:none; color:rgba(255,255,255,.65); font-size:.82rem; font-weight:500; cursor:pointer; border-bottom:3px solid transparent; font-family:inherit; transition:all .2s; white-space:nowrap; }
    .p-nav-tab:hover  { color:#fff; background:rgba(255,255,255,.07); }
    .p-nav-tab.active { color:#fff; border-bottom-color:#60a0ff; font-weight:600; }
    .p-nav-tab-icon   { font-size:1rem; }

    /* Page */
    .p-page    { background:#fff; min-height:100%; display:flex; flex-direction:column; }
    .p-content { padding:20px 24px; flex:1; }
    .p-welcome-bar { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:.5rem; margin-bottom:16px; }
    .p-page-title  { font-size:1.3rem; font-weight:700; color:#1a1a2e; letter-spacing:-.02em; }
    .p-page-sub    { font-size:.8rem; color:#888; margin-top:2px; }
    .p-badge-green { background:#e6f9f0; color:#1a7a4a; border:1px solid #a3d9bc; padding:4px 12px; border-radius:999px; font-size:.75rem; font-weight:600; white-space:nowrap; }
    .p-section-title { font-size:.9rem; font-weight:700; color:#1a2e6e; margin:20px 0 12px; text-transform:uppercase; letter-spacing:.06em; }

    /* Dashboard cards */
    .p-cards-row   { display:flex; gap:10px; margin-bottom:16px; flex-wrap:wrap; }
    .p-summary-card { display:flex; align-items:flex-start; gap:10px; flex:1; min-width:140px; background:#f8f9fe; border:1px solid #e0e6f4; border-radius:10px; padding:12px; }
    .p-summary-icon { font-size:1.4rem; }
    .p-summary-body { flex:1; }
    .p-summary-label { font-size:.68rem; color:#888; text-transform:uppercase; letter-spacing:.08em; font-weight:600; }
    .p-summary-val   { font-size:.9rem; font-weight:700; color:#1a1a2e; margin-top:2px; }
    .p-summary-meta  { font-size:.72rem; color:#888; }
    .p-chip { font-size:.68rem; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; }
    .p-chip.active { background:#e6f9f0; color:#1a7a4a; border:1px solid #a3d9bc; }

    /* Scenario cards */
    .p-scenario-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .p-scenario-card { display:flex; align-items:center; gap:14px; padding:16px 18px; background:#f8f9fe; border:1.5px solid #e0e6f4; border-radius:10px; cursor:pointer; text-align:left; font-family:inherit; transition:all .2s; }
    .p-scenario-card:hover { border-color:#1a2e6e; background:#f0f4ff; box-shadow:0 2px 12px rgba(26,46,110,.1); }
    .p-scenario-icon { font-size:1.8rem; flex-shrink:0; }
    .p-scenario-body { flex:1; }
    .p-scenario-name { font-size:.95rem; font-weight:700; color:#1a1a2e; }
    .p-scenario-desc { font-size:.78rem; color:#666; margin-top:3px; }
    .p-scenario-arrow { font-size:1.4rem; color:#1a2e6e; font-weight:700; flex-shrink:0; }

    /* Filters */
    .p-filter-row { display:flex; align-items:center; gap:8px; margin-bottom:12px; flex-wrap:wrap; }
    .p-filter-label { font-size:.78rem; color:#888; }
    .p-filter-chip { padding:4px 12px; border-radius:999px; border:1px solid #d0d5e8; background:#fff; font-size:.75rem; cursor:pointer; color:#555; transition:all .15s; font-family:inherit; }
    .p-filter-chip.active, .p-filter-chip:hover { background:#1a2e6e; color:#fff; border-color:#1a2e6e; }

    /* Doc table */
    .p-doc-table { width:100%; border-collapse:collapse; font-size:.83rem; }
    .p-doc-table thead tr { border-bottom:2px solid #e8ecf4; }
    .p-doc-table th { padding:7px 10px; text-align:left; font-size:.7rem; text-transform:uppercase; letter-spacing:.08em; color:#888; font-weight:600; }
    .p-doc-row { border-bottom:1px solid #f0f2f8; cursor:pointer; transition:background .15s; }
    .p-doc-row:hover { background:#f5f8ff; }
    .p-doc-row.highlighted { background:#f0f4ff; }
    .p-doc-row.highlighted:hover { background:#e8eeff; }
    .p-doc-row td { padding:10px; vertical-align:middle; }
    .p-doc-row td:first-child { display:flex; align-items:center; gap:10px; }
    .p-doc-icon { font-size:1.3rem; }
    .p-doc-name { font-weight:600; color:#1a1a2e; }
    .p-doc-type { font-size:.7rem; color:#888; margin-top:2px; }
    .p-doc-pol  { font-size:.75rem; color:#555; }
    .p-doc-date { font-size:.8rem; color:#555; white-space:nowrap; }

    /* Breadcrumb */
    .p-breadcrumb { font-size:.75rem; color:#888; margin-bottom:12px; display:flex; gap:4px; align-items:center; }
    .p-bc-sep    { color:#ccc; }
    .p-bc-active { color:#1a2e6e; font-weight:600; }

    /* Info strip */
    .p-info-strip { background:#f0f4ff; border-left:3px solid #1a2e6e; padding:9px 12px; font-size:.8rem; color:#444; border-radius:0 6px 6px 0; margin-bottom:14px; }

    /* Policy grid */
    .p-policy-grid { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .p-policy-card { flex:1; min-width:170px; border:2px solid #d0d5e8; border-radius:10px; padding:14px; cursor:pointer; transition:all .2s; position:relative; background:#fff; text-align:left; font-family:inherit; }
    .p-policy-card:hover   { border-color:#1a2e6e; background:#f5f8ff; }
    .p-policy-card.selected { border-color:#1a2e6e; background:#f0f4ff; box-shadow:0 0 0 3px rgba(26,46,110,.1); }
    .p-policy-sel-indicator { position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%; background:#1a2e6e; color:#fff; display:none; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; }
    .p-policy-card.selected .p-policy-sel-indicator { display:flex; }
    .p-policy-targa  { font-size:1.15rem; font-weight:800; color:#1a2e6e; letter-spacing:.08em; margin-bottom:4px; }
    .p-policy-car    { font-size:.85rem; color:#333; margin-bottom:5px; }
    .p-policy-detail { font-size:.75rem; color:#666; background:#f0f4ff; display:inline-block; padding:2px 8px; border-radius:999px; margin-bottom:8px; }
    .p-policy-meta   { display:flex; flex-direction:column; gap:3px; font-size:.76rem; color:#555; }

    /* Tipo sinistro */
    .p-tipo-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:8px; }
    .p-tipo-card { border:2px solid #d0d5e8; border-radius:10px; padding:16px 14px; cursor:pointer; background:#fff; text-align:left; font-family:inherit; transition:all .2s; }
    .p-tipo-card:hover   { border-color:#1a2e6e; background:#f5f8ff; }
    .p-tipo-card.selected { border-color:#1a2e6e; background:#f0f4ff; box-shadow:0 0 0 3px rgba(26,46,110,.1); }
    .p-tipo-icon { font-size:1.8rem; display:block; margin-bottom:8px; }
    .p-tipo-name { font-size:.92rem; font-weight:700; color:#1a1a2e; margin-bottom:4px; }
    .p-tipo-desc { font-size:.75rem; color:#666; }

    /* Sinistro form */
    .p-sin-form { display:flex; flex-direction:column; gap:0; }
    .p-sin-row  { display:flex; gap:12px; }
    .p-sin-section-title { font-size:.78rem; font-weight:700; color:#1a2e6e; text-transform:uppercase; letter-spacing:.06em; margin:12px 0 8px; border-top:1px solid #e8ecf4; padding-top:12px; }
    .p-sin-veicolo-display { display:flex; align-items:center; gap:12px; background:#f0f4ff; border:1.5px solid #b0c4e8; border-radius:8px; padding:12px 16px; }
    .p-sin-veicolo-icon { font-size:1.5rem; }
    .p-sin-veicolo-targa { font-size:1rem; font-weight:800; color:#1a2e6e; letter-spacing:.06em; }
    .p-sin-veicolo-desc { font-size:.75rem; color:#666; margin-top:2px; }

    /* Allegati */
    .p-allegati-list { display:flex; flex-direction:column; gap:12px; }
    .p-allegato-row  { display:flex; align-items:center; justify-content:space-between; gap:12px; background:#f8f9fe; border:1px solid #e0e6f4; border-radius:10px; padding:14px 16px; flex-wrap:wrap; }
    .p-allegato-info { display:flex; align-items:center; gap:12px; }
    .p-allegato-icon { font-size:1.6rem; }
    .p-allegato-name { font-size:.88rem; font-weight:600; color:#1a1a2e; }
    .p-allegato-desc { font-size:.75rem; color:#888; margin-top:2px; }
    .p-upload-sim    { display:flex; align-items:center; gap:6px; padding:.45rem 1rem; background:#fff; border:1.5px dashed #c0cce8; border-radius:6px; font-size:.82rem; color:#1a2e6e; cursor:pointer; font-family:inherit; transition:all .2s; }
    .p-upload-sim:hover { background:#f0f4ff; border-color:#1a2e6e; }
    .p-upload-icon   { font-size:1rem; }
    .p-upload-done   { font-size:.85rem; color:#1a7a4a; font-weight:600; }

    /* Riepilogo */
    .p-riepilogo-card { background:#f8f9fe; border:1px solid #e0e6f4; border-radius:10px; overflow:hidden; margin-bottom:8px; }
    .p-riepilogo-row  { display:flex; justify-content:space-between; align-items:center; padding:10px 16px; border-bottom:1px solid #edf0f8; font-size:.85rem; }
    .p-riepilogo-row:last-child { border-bottom:none; }
    .p-riepilogo-row span { color:#666; }
    .p-conferma-actions { display:flex; gap:10px; margin:12px 0 8px; flex-wrap:wrap; }

    /* Esito sinistro */
    .p-sin-esito { margin-top:12px; }
    .p-esito-card { background:#e6f9f0; border:1px solid #a3d9bc; border-radius:10px; padding:16px 20px; }
    .p-esito-head { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
    .p-esito-check { font-size:1.8rem; }
    .p-esito-title { font-size:1rem; font-weight:700; color:#1a4a2a; }
    .p-esito-num   { font-size:.85rem; color:#1a7a4a; margin-top:4px; }
    .p-esito-steps { font-size:.85rem; color:#1a4a2a; }
    .p-esito-steps ol { margin:.6rem 0 0 1rem; display:flex; flex-direction:column; gap:.4rem; }

    /* Download */
    .p-download-area    { background:#f8f9fe; border:1px solid #e0e6f4; border-radius:12px; padding:20px; margin-bottom:12px; }
    .p-pdf-preview      { display:flex; gap:18px; align-items:flex-start; margin-bottom:16px; }
    .p-pdf-icon         { font-size:2.8rem; }
    .p-pdf-meta         { flex:1; }
    .p-pdf-name         { font-weight:700; color:#1a1a2e; font-size:.95rem; margin-bottom:10px; }
    .p-pdf-table        { border-collapse:collapse; width:100%; font-size:.8rem; }
    .p-pdf-table td     { padding:3px 0; color:#555; }
    .p-pdf-table td:first-child { width:150px; color:#888; }
    .p-download-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
    .p-download-success { display:none; align-items:center; gap:.5rem; color:#1a7a4a; font-weight:600; font-size:.95rem; }
    .p-success-banner   { background:#e6f9f0; border:1px solid #a3d9bc; border-radius:8px; padding:12px 16px; font-size:.88rem; color:#1a4a2a; margin-top:10px; }

    /* Action row */
    .p-action-row { display:flex; justify-content:flex-end; gap:10px; margin-top:12px; flex-wrap:wrap; }

    /* Shortcut row */
    .p-shortcut-row { display:flex; align-items:center; gap:4px; font-size:.72rem; color:#999; margin-top:8px; flex-wrap:wrap; }
    .p-key { display:inline-block; padding:1px 7px; background:#fff; border:1px solid #ccc; border-bottom:2px solid #aaa; border-radius:4px; font-family:monospace; font-size:.75rem; color:#444; }
  `;
  document.head.appendChild(s);
})();
