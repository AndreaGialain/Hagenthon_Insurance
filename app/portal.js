/**
 * VoceGuidata — portal.js
 * Portale assicurativo simulato in stile realistico (ispirato ad area clienti italiana).
 * 5 step con HTML iniettato, shortcut Alt+[tasto] e timer di inattività.
 *
 * Step:
 *  1. Login         → Alt+A  ("Accedi")
 *  2. Dashboard     → Alt+D  ("Documenti")
 *  3. Documenti     → Alt+R  ("Attestato di Rischio")
 *  4. Selezione     → Alt+C  ("Continua")
 *  5. Download      → Alt+S  ("Scarica PDF")
 */

const Portal = (() => {
  'use strict';

  let _currentStep = 1;
  let _inactivityTimer = null;

  // ── Shared nav HTML (appare negli step 2–5) ──────────────────────
  function _navBar(activeSection = 'documenti') {
    const tabs = [
      { id: 'polizze',    label: 'Le mie polizze',  icon: '📋' },
      { id: 'documenti',  label: 'Documenti',         icon: '📁' },
      { id: 'sinistri',   label: 'Sinistri',          icon: '🔔' },
      { id: 'pagamenti',  label: 'Pagamenti',          icon: '💳' },
      { id: 'assistenza', label: 'Assistenza',         icon: '💬' },
    ];
    return `
      <nav class="p-nav" role="navigation" aria-label="Menu portale">
        <div class="p-nav-brand">
          <div class="p-nav-logo">
            <span class="p-nav-logo-icon">🛡️</span>
            <span class="p-nav-logo-name">AssicuraMi</span>
            <span class="p-nav-logo-tag">Area Clienti</span>
          </div>
          <div class="p-nav-user">
            <span class="p-nav-avatar">MR</span>
            <span class="p-nav-name">Mario Rossi</span>
            <button class="p-nav-logout" onclick="Portal._notifyAction()" aria-label="Esci dall'area clienti">Esci</button>
          </div>
        </div>
        <div class="p-nav-tabs" role="tablist">
          ${tabs.map(t => `
            <button class="p-nav-tab ${t.id === activeSection ? 'active' : ''}"
                    role="tab" aria-selected="${t.id === activeSection}"
                    onclick="${t.id === 'documenti' ? 'Portal.advance()' : 'Portal._notifyAction()'}"
                    aria-label="${t.label}">
              <span class="p-nav-tab-icon" aria-hidden="true">${t.icon}</span>
              ${t.label}
            </button>
          `).join('')}
        </div>
      </nav>`;
  }

  // ── Template HTML per ogni step ──────────────────────────────────
  const STEPS = {

    // ─────────────────────── STEP 1: LOGIN ───────────────────────────
    1: {
      name: 'Login',
      shortcut: 'Alt+A',
      shortcutKey: 'A',
      shortcutLabel: 'Accedere al portale',
      render() {
        return `
          <div class="p-login-page">
            <header class="p-login-header">
              <span class="p-nav-logo-icon" aria-hidden="true">🛡️</span>
              <span class="p-login-brand">AssicuraMi</span>
            </header>

            <div class="p-login-split">
              <div class="p-login-left">
                <h1 class="p-login-title">Accedi all'Area Clienti</h1>
                <p class="p-login-sub">Gestisci polizze, documenti e sinistri in un unico posto.</p>
                <ul class="p-login-features">
                  <li>✔ Scarica attestato di rischio</li>
                  <li>✔ Visualizza le tue polizze</li>
                  <li>✔ Apri e segui pratiche sinistro</li>
                  <li>✔ Paga e rinnova online</li>
                </ul>
              </div>

              <div class="p-login-card">
                <h2 class="p-login-card-title">Accedi</h2>
                <div class="p-form-group">
                  <label class="p-form-label" for="p-user">Codice fiscale o e-mail</label>
                  <input class="p-form-input" id="p-user" type="text"
                         placeholder="RSSMRA60A01H501U"
                         value="mario.rossi@email.it"
                         autocomplete="username"
                         aria-label="Codice fiscale o indirizzo e-mail">
                </div>
                <div class="p-form-group">
                  <label class="p-form-label" for="p-pass">
                    Password
                    <a href="#" class="p-link" onclick="return false" tabindex="-1">Password dimenticata?</a>
                  </label>
                  <input class="p-form-input" id="p-pass" type="password"
                         placeholder="••••••••"
                         value="demo1234"
                         autocomplete="current-password"
                         aria-label="Password di accesso">
                </div>
                <label class="p-check-row">
                  <input type="checkbox" checked aria-label="Ricordami su questo dispositivo"> Ricordami
                </label>
                <button class="p-btn-primary" id="btn-login" onclick="Portal.advance()">
                  Accedi
                </button>
                <p class="p-form-note">
                  🔒 Connessione protetta SSL · <a href="#" class="p-link" onclick="return false" tabindex="-1">Privacy policy</a>
                </p>
                <div class="p-shortcut-row">
                  <span class="p-key">Alt</span>+<span class="p-key">A</span> per accedere
                </div>
              </div>
            </div>
          </div>`;
      }
    },

    // ─────────────────────── STEP 2: DASHBOARD ───────────────────────
    2: {
      name: 'Dashboard',
      shortcut: 'Alt+D',
      shortcutKey: 'D',
      shortcutLabel: 'Andare alla sezione Documenti',
      render() {
        const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
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
                    <div class="p-summary-val">Via Roma 14, Milano</div>
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

              <div class="p-alert-box">
                <span class="p-alert-icon">💡</span>
                <div>
                  <strong>Hai bisogno dell'attestato di rischio?</strong>
                  <p>Puoi scaricarlo in qualsiasi momento dalla sezione <strong>Documenti</strong>.</p>
                </div>
                <button class="p-btn-ghost" onclick="Portal.advance()">Vai ai Documenti →</button>
              </div>

              <div class="p-shortcut-row" style="margin-top:1rem;">
                <span class="p-key">Alt</span>+<span class="p-key">D</span> per aprire Documenti
              </div>
            </div>
          </div>`;
      }
    },

    // ─────────────────────── STEP 3: DOCUMENTI ───────────────────────
    3: {
      name: 'Documenti',
      shortcut: 'Alt+R',
      shortcutKey: 'R',
      shortcutLabel: "Selezionare l'Attestato di Rischio",
      render() {
        return `
          <div class="p-page">
            ${_navBar('documenti')}
            <div class="p-content">
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

              <table class="p-doc-table" role="grid" aria-label="Lista documenti disponibili">
                <thead>
                  <tr>
                    <th scope="col">Documento</th>
                    <th scope="col">Polizza</th>
                    <th scope="col">Data</th>
                    <th scope="col">Stato</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="p-doc-row highlighted" tabindex="0" role="row"
                      onclick="Portal.advance()"
                      onkeydown="if(event.key==='Enter'||event.key===' ')Portal.advance()"
                      aria-label="Attestato di Rischio RC Auto — apri">
                    <td>
                      <span class="p-doc-icon">🚗</span>
                      <div>
                        <div class="p-doc-name">Attestato di Rischio RC Auto</div>
                        <div class="p-doc-type">Documento obbligatorio</div>
                      </div>
                    </td>
                    <td class="p-doc-pol">RC-2024-00847<br><small>EF 482 GH · Fiat Panda</small></td>
                    <td class="p-doc-date">05/10/2025</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation();Portal.advance()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td>
                      <span class="p-doc-icon">📄</span>
                      <div>
                        <div class="p-doc-name">Contratto RC Auto 2025</div>
                        <div class="p-doc-type">Contratto</div>
                      </div>
                    </td>
                    <td class="p-doc-pol">RC-2024-00847<br><small>EF 482 GH</small></td>
                    <td class="p-doc-date">01/01/2025</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td>
                      <span class="p-doc-icon">🏠</span>
                      <div>
                        <div class="p-doc-name">Contratto Casa Plus</div>
                        <div class="p-doc-type">Contratto</div>
                      </div>
                    </td>
                    <td class="p-doc-pol">CA-2024-00213<br><small>Via Roma 14</small></td>
                    <td class="p-doc-date">15/03/2025</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td>
                      <span class="p-doc-icon">📋</span>
                      <div>
                        <div class="p-doc-name">Quietanza rinnovo 2025</div>
                        <div class="p-doc-type">Ricevuta pagamento</div>
                      </div>
                    </td>
                    <td class="p-doc-pol">RC-2024-00847<br><small>EF 482 GH</small></td>
                    <td class="p-doc-date">28/11/2024</td>
                    <td><span class="p-chip active">Disponibile</span></td>
                    <td><button class="p-btn-ghost" onclick="event.stopPropagation()">Apri →</button></td>
                  </tr>
                  <tr class="p-doc-row" tabindex="0" onclick="Portal._notifyAction()">
                    <td>
                      <span class="p-doc-icon">❤️</span>
                      <div>
                        <div class="p-doc-name">Contratto Salute Famiglia</div>
                        <div class="p-doc-type">Contratto</div>
                      </div>
                    </td>
                    <td class="p-doc-pol">SA-2023-00456<br><small>Piano Famiglia</small></td>
                    <td class="p-doc-date">01/09/2024</td>
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

    // ─────────────────────── STEP 4: SELEZIONE POLIZZA ───────────────
    4: {
      name: 'Selezione polizza',
      shortcut: 'Alt+C',
      shortcutKey: 'C',
      shortcutLabel: 'Confermare la selezione',
      render() {
        return `
          <div class="p-page">
            ${_navBar('documenti')}
            <div class="p-content">
              <nav class="p-breadcrumb" aria-label="Percorso di navigazione">
                <span>Documenti</span> <span class="p-bc-sep">›</span>
                <span class="p-bc-active">Attestato di Rischio</span>
              </nav>

              <div class="p-welcome-bar">
                <div>
                  <h1 class="p-page-title">Attestato di Rischio RC Auto</h1>
                  <p class="p-page-sub">Seleziona il veicolo per cui generare l'attestato</p>
                </div>
              </div>

              <div class="p-info-strip">
                ℹ️ L'attestato di rischio certifica la tua classe bonus-malus (CU) e viene richiesto al momento del rinnovo o cambio compagnia.
              </div>

              <div class="p-policy-grid" id="policy-list" role="radiogroup" aria-label="Seleziona veicolo">
                <div class="p-policy-card selected" id="pol-1" tabindex="0"
                     role="radio" aria-checked="true"
                     onclick="Portal._selectPolicy(1)"
                     onkeydown="if(event.key==='Enter'||event.key===' ')Portal._selectPolicy(1)"
                     aria-label="Fiat Panda targa EF 482 GH, selezionata">
                  <div class="p-policy-sel-indicator" aria-hidden="true">✔</div>
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
                     onkeydown="if(event.key==='Enter'||event.key===' ')Portal._selectPolicy(2)"
                     aria-label="Renault Clio targa AB 371 CD">
                  <div class="p-policy-sel-indicator" aria-hidden="true">✔</div>
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
                <button class="p-btn-primary" id="btn-continua" onclick="Portal.advance()">
                  Genera attestato →
                </button>
              </div>

              <div class="p-shortcut-row">
                <span class="p-key">Alt</span>+<span class="p-key">C</span> per confermare e generare
              </div>
            </div>
          </div>`;
      }
    },

    // ─────────────────────── STEP 5: DOWNLOAD ────────────────────────
    5: {
      name: 'Download attestato',
      shortcut: 'Alt+S',
      shortcutKey: 'S',
      shortcutLabel: 'Scaricare il PDF',
      render() {
        const oggi = new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `
          <div class="p-page">
            ${_navBar('documenti')}
            <div class="p-content">
              <nav class="p-breadcrumb" aria-label="Percorso di navigazione">
                <span>Documenti</span> <span class="p-bc-sep">›</span>
                <span>Attestato di Rischio</span> <span class="p-bc-sep">›</span>
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
                  <div class="p-pdf-icon" aria-hidden="true">📄</div>
                  <div class="p-pdf-meta">
                    <div class="p-pdf-name">Attestato_Rischio_EF482GH_2025.pdf</div>
                    <table class="p-pdf-table" aria-label="Dettagli documento">
                      <tr><td>Intestatario</td><td><strong>Mario Rossi</strong></td></tr>
                      <tr><td>Veicolo</td><td><strong>Fiat Panda 1.2 — EF 482 GH</strong></td></tr>
                      <tr><td>N° polizza</td><td><strong>RC-2024-00847</strong></td></tr>
                      <tr><td>Compagnia cedente</td><td><strong>AssicuraMi S.p.A.</strong></td></tr>
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
                  <button class="p-btn-ghost" onclick="Portal._notifyAction()">
                    ✉️ Invia per e-mail
                  </button>
                  <div class="p-download-success" id="download-success" aria-live="polite">
                    ✅ Download completato!
                  </div>
                </div>

                <div class="p-shortcut-row">
                  <span class="p-key">Alt</span>+<span class="p-key">S</span> per scaricare il PDF
                </div>
              </div>

              <div class="p-success-banner" id="success-banner" style="display:none;">
                🎉 <strong>Mario ha completato l'operazione in autonomia</strong> grazie a VoceGuidata.
              </div>
            </div>
          </div>`;
      }
    }
  };

  // ── API ──────────────────────────────────────────────────────────

  function init() {
    _currentStep = 1;
    _renderStep(1);
    _initProgressLabels();
  }

  function advance() {
    if (_currentStep >= 5) return;
    _notifyAction();
    _currentStep++;
    _renderStep(_currentStep);
    _notifyStepChange(_currentStep);
  }

  function goTo(step) {
    const s = Math.max(1, Math.min(5, step));
    _notifyAction();
    _currentStep = s;
    _renderStep(s);
    _notifyStepChange(s);
  }

  // ── Privati ──────────────────────────────────────────────────────

  function _renderStep(step) {
    const container = document.getElementById('portal-screen');
    if (!container) return;

    const stepDef = STEPS[step];
    if (!stepDef) return;

    container.style.opacity = '0';
    container.style.transition = 'opacity 0.2s ease';

    setTimeout(() => {
      container.innerHTML = stepDef.render();
      container.style.opacity = '1';

      KeyboardNav.unregisterAll();
      KeyboardNav.register(stepDef.shortcutKey, stepDef.shortcutLabel, () => advance());

      setTimeout(() => {
        const first = container.querySelector('input:not([type=checkbox]), button, [tabindex="0"]');
        if (first) first.focus();
      }, 300);

      _startInactivityTimer();
    }, 220);
  }

  function _notifyStepChange(step) {
    if (window.VoceGuidata) VoceGuidata.onStepChange(step, STEPS[step]?.name || '');
    _updateProgressBar(step);
  }

  function _notifyAction() {
    if (window.VoceGuidata) {
      VoceGuidata.lastActionTime = Date.now();
      VoceGuidata.stuckCount = 0;
    }
  }

  function _selectPolicy(id) {
    _notifyAction();
    document.querySelectorAll('.p-policy-card').forEach((el, i) => {
      const sel = i + 1 === id;
      el.classList.toggle('selected', sel);
      el.setAttribute('aria-checked', sel.toString());
    });
  }

  function _triggerDownload() {
    _notifyAction();
    const btn     = document.getElementById('btn-download');
    const success = document.getElementById('download-success');
    const banner  = document.getElementById('success-banner');

    if (btn) { btn.textContent = '⏳ Generazione PDF…'; btn.disabled = true; }

    setTimeout(() => {
      if (btn)     { btn.style.display = 'none'; }
      if (success) { success.style.display = 'flex'; }
      if (banner)  { banner.style.display = 'block'; }

      if (window.VoiceGuide) VoiceGuide.speak('Ottimo, Mario! Hai scaricato l\'attestato di rischio. Missione completata!');
      if (window.VoceGuidata) VoceGuidata.showInstruction('Download completato! Hai scaricato il tuo attestato di rischio in autonomia.');
    }, 1800);
  }

  function _startInactivityTimer() {
    if (_inactivityTimer) clearTimeout(_inactivityTimer);
    const threshold = window.VoceGuidata?.stuckThresholdMs ?? 15000;

    _inactivityTimer = setTimeout(() => {
      if (window.VoceGuidata && VoceGuidata.started && _currentStep < 5) {
        VoceGuidata.stuckCount = Math.min(VoceGuidata.stuckCount + 1, 2);
        const hint = `Posso aiutarti? Premi il tasto Aiuto oppure usa ${STEPS[_currentStep]?.shortcut} per procedere.`;
        VoceGuidata.showInstruction(hint);
        if (window.VoiceGuide) VoiceGuide.speak(hint);
      }
    }, threshold);
  }

  function _updateProgressBar(step) {
    const bar = document.getElementById('progress-bar');
    if (bar) {
      const pct = ((step - 1) / 4) * 100;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', pct);
    }
    document.querySelectorAll('.step-label').forEach((el, i) => {
      el.classList.toggle('active', i + 1 === step);
      el.classList.toggle('done',   i + 1 < step);
    });
  }

  function _initProgressLabels() {
    const container = document.getElementById('step-labels');
    if (!container) return;
    const names = ['Login', 'Dashboard', 'Documenti', 'Polizza', 'Download'];
    container.innerHTML = names.map((n, i) =>
      `<span class="step-label ${i === 0 ? 'active' : ''}" data-step="${i+1}">${n}</span>`
    ).join('');
  }

  return {
    init, advance, goTo,
    _selectPolicy, _triggerDownload, _notifyAction,
    get currentStep() { return _currentStep; }
  };

})();

// ── Stili portale realistico ──────────────────────────────────────
;(function () {
  const s = document.createElement('style');
  s.textContent = `
    /* Step label progress */
    .step-label { font-size:0.7rem; color:rgba(255,255,255,0.35); transition:color .3s; }
    .step-label.active { color:#A100FF; font-weight:600; }
    .step-label.done   { color:#00e676; }

    /* ── Portal wrapper ── */
    #portal-screen { padding:0 !important; overflow-y:auto; }

    /* ── Login page ── */
    .p-login-page { background:#fff; min-height:100%; display:flex; flex-direction:column; }
    .p-login-header {
      background:#1a2e6e; color:#fff; padding:14px 28px;
      display:flex; align-items:center; gap:10px; font-size:1.1rem; font-weight:700;
    }
    .p-login-split { display:flex; flex:1; }
    .p-login-left {
      background:#f0f4ff; padding:48px 36px; flex:1;
      display:flex; flex-direction:column; justify-content:center;
    }
    .p-login-title { font-size:1.7rem; font-weight:700; color:#1a2e6e; margin-bottom:.5rem; letter-spacing:-.02em; }
    .p-login-sub   { color:#555; margin-bottom:1.5rem; }
    .p-login-features { list-style:none; padding:0; display:flex; flex-direction:column; gap:.5rem; color:#333; font-size:.95rem; }
    .p-login-card { background:#fff; padding:36px 32px; width:360px; flex-shrink:0; display:flex; flex-direction:column; gap:0; box-shadow:-4px 0 16px rgba(0,0,0,.06); }
    .p-login-card-title { font-size:1.3rem; font-weight:700; color:#1a2e6e; margin-bottom:1.25rem; }

    /* ── Shared form elements (light portal) ── */
    .p-form-group  { margin-bottom:1rem; }
    .p-form-label  { display:flex; justify-content:space-between; align-items:center; font-size:.82rem; font-weight:600; color:#444; margin-bottom:.35rem; }
    .p-form-input  {
      width:100%; padding:.65rem .85rem; border:1.5px solid #d0d5e8;
      border-radius:6px; font-size:.95rem; color:#1a1a2e; background:#fff;
      font-family:inherit; transition:border-color .2s, box-shadow .2s;
    }
    .p-form-input:focus { border-color:#1a2e6e; box-shadow:0 0 0 3px rgba(26,46,110,.12); outline:none; }
    .p-check-row   { display:flex; align-items:center; gap:.4rem; font-size:.85rem; color:#555; cursor:pointer; margin-bottom:1rem; }
    .p-form-note   { font-size:.75rem; color:#888; text-align:center; margin-top:.75rem; }
    .p-link        { color:#1a2e6e; text-decoration:none; font-size:.78rem; }
    .p-link:hover  { text-decoration:underline; }

    /* ── Buttons (light portal) ── */
    .p-btn-primary {
      display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.72rem 1.5rem; background:#1a2e6e; color:#fff; border:none;
      border-radius:6px; font-size:.95rem; font-weight:600; cursor:pointer;
      font-family:inherit; transition:background .2s, box-shadow .2s; width:100%;
    }
    .p-btn-primary:hover  { background:#243d8f; box-shadow:0 4px 14px rgba(26,46,110,.35); }
    .p-btn-primary:active { background:#1a2e6e; }
    .p-btn-ghost {
      display:inline-flex; align-items:center; justify-content:center; gap:.4rem;
      padding:.55rem 1.1rem; background:transparent; color:#1a2e6e;
      border:1.5px solid #c0cce8; border-radius:6px; font-size:.88rem;
      font-weight:500; cursor:pointer; font-family:inherit; transition:all .2s;
    }
    .p-btn-ghost:hover { background:#f0f4ff; border-color:#1a2e6e; }

    /* ── Nav bar ── */
    .p-nav { background:#1a2e6e; color:#fff; }
    .p-nav-brand {
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 24px; border-bottom:1px solid rgba(255,255,255,.12);
    }
    .p-nav-logo   { display:flex; align-items:center; gap:8px; }
    .p-nav-logo-icon { font-size:1.2rem; }
    .p-nav-logo-name { font-size:1rem; font-weight:700; letter-spacing:-.01em; }
    .p-nav-logo-tag  { font-size:.7rem; background:rgba(255,255,255,.15); padding:2px 8px; border-radius:999px; color:rgba(255,255,255,.8); }
    .p-nav-user  { display:flex; align-items:center; gap:10px; font-size:.85rem; color:rgba(255,255,255,.85); }
    .p-nav-avatar { width:30px; height:30px; border-radius:50%; background:rgba(255,255,255,.25); display:flex; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; }
    .p-nav-logout { background:transparent; border:1px solid rgba(255,255,255,.3); color:rgba(255,255,255,.8); padding:3px 10px; border-radius:4px; font-size:.75rem; cursor:pointer; }
    .p-nav-tabs { display:flex; padding:0 16px; gap:2px; overflow-x:auto; }
    .p-nav-tab {
      display:flex; align-items:center; gap:6px; padding:10px 16px;
      background:transparent; border:none; color:rgba(255,255,255,.65);
      font-size:.82rem; font-weight:500; cursor:pointer; border-bottom:3px solid transparent;
      font-family:inherit; transition:all .2s; white-space:nowrap;
    }
    .p-nav-tab:hover  { color:#fff; background:rgba(255,255,255,.07); }
    .p-nav-tab.active { color:#fff; border-bottom-color:#60a0ff; font-weight:600; }
    .p-nav-tab-icon   { font-size:1rem; }

    /* ── Page content ── */
    .p-page    { background:#fff; min-height:100%; display:flex; flex-direction:column; }
    .p-content { padding:24px 28px; flex:1; overflow-y:auto; }
    .p-welcome-bar { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:.5rem; margin-bottom:20px; }
    .p-page-title  { font-size:1.4rem; font-weight:700; color:#1a1a2e; letter-spacing:-.02em; }
    .p-page-sub    { font-size:.82rem; color:#888; margin-top:2px; }
    .p-badge-green { background:#e6f9f0; color:#1a7a4a; border:1px solid #a3d9bc; padding:4px 12px; border-radius:999px; font-size:.75rem; font-weight:600; white-space:nowrap; align-self:flex-start; }

    /* Dashboard cards */
    .p-cards-row    { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .p-summary-card { display:flex; align-items:flex-start; gap:12px; flex:1; min-width:160px; background:#f8f9fe; border:1px solid #e0e6f4; border-radius:10px; padding:14px; }
    .p-summary-icon { font-size:1.6rem; }
    .p-summary-body { flex:1; }
    .p-summary-label { font-size:.72rem; color:#888; text-transform:uppercase; letter-spacing:.08em; font-weight:600; }
    .p-summary-val   { font-size:.95rem; font-weight:700; color:#1a1a2e; margin-top:2px; }
    .p-summary-meta  { font-size:.75rem; color:#888; margin-top:2px; }
    .p-chip { font-size:.7rem; font-weight:600; padding:2px 8px; border-radius:999px; white-space:nowrap; align-self:flex-start; }
    .p-chip.active { background:#e6f9f0; color:#1a7a4a; border:1px solid #a3d9bc; }
    .p-alert-box {
      display:flex; align-items:flex-start; gap:12px; background:#fffbf0;
      border:1px solid #fde68a; border-left:4px solid #f59e0b; border-radius:8px; padding:14px 16px;
    }
    .p-alert-icon { font-size:1.2rem; flex-shrink:0; }
    .p-alert-box p { font-size:.85rem; color:#555; margin-top:4px; }
    .p-alert-box strong { color:#333; }

    /* Filter row */
    .p-filter-row { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
    .p-filter-label { font-size:.8rem; color:#888; }
    .p-filter-chip { padding:4px 12px; border-radius:999px; border:1px solid #d0d5e8; background:#fff; font-size:.78rem; cursor:pointer; color:#555; transition:all .15s; }
    .p-filter-chip.active, .p-filter-chip:hover { background:#1a2e6e; color:#fff; border-color:#1a2e6e; }

    /* Document table */
    .p-doc-table { width:100%; border-collapse:collapse; font-size:.85rem; }
    .p-doc-table thead tr { border-bottom:2px solid #e8ecf4; }
    .p-doc-table th { padding:8px 10px; text-align:left; font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:#888; font-weight:600; }
    .p-doc-row { border-bottom:1px solid #f0f2f8; cursor:pointer; transition:background .15s; }
    .p-doc-row:hover    { background:#f5f8ff; }
    .p-doc-row.highlighted { background:#f0f4ff; }
    .p-doc-row.highlighted:hover { background:#e8eeff; }
    .p-doc-row td { padding:12px 10px; vertical-align:middle; }
    .p-doc-row td:first-child { display:flex; align-items:center; gap:10px; }
    .p-doc-icon { font-size:1.4rem; }
    .p-doc-name { font-weight:600; color:#1a1a2e; }
    .p-doc-type { font-size:.72rem; color:#888; margin-top:2px; }
    .p-doc-pol  { font-size:.78rem; color:#555; }
    .p-doc-date { font-size:.82rem; color:#555; white-space:nowrap; }

    /* Breadcrumb */
    .p-breadcrumb { font-size:.78rem; color:#888; margin-bottom:14px; display:flex; gap:4px; align-items:center; }
    .p-bc-sep  { color:#ccc; }
    .p-bc-active { color:#1a2e6e; font-weight:600; }

    /* Info strip */
    .p-info-strip { background:#f0f4ff; border-left:3px solid #1a2e6e; padding:10px 14px; font-size:.82rem; color:#444; border-radius:0 6px 6px 0; margin-bottom:18px; }

    /* Policy grid */
    .p-policy-grid { display:flex; gap:14px; flex-wrap:wrap; margin-bottom:20px; }
    .p-policy-card { flex:1; min-width:180px; border:2px solid #d0d5e8; border-radius:10px; padding:16px; cursor:pointer; transition:all .2s; position:relative; background:#fff; }
    .p-policy-card:hover { border-color:#1a2e6e; background:#f5f8ff; }
    .p-policy-card.selected { border-color:#1a2e6e; background:#f0f4ff; box-shadow:0 0 0 3px rgba(26,46,110,.1); }
    .p-policy-sel-indicator { position:absolute; top:10px; right:10px; width:20px; height:20px; border-radius:50%; background:#1a2e6e; color:#fff; display:none; align-items:center; justify-content:center; font-size:.75rem; font-weight:700; }
    .p-policy-card.selected .p-policy-sel-indicator { display:flex; }
    .p-policy-targa  { font-size:1.2rem; font-weight:800; color:#1a2e6e; letter-spacing:.08em; margin-bottom:4px; }
    .p-policy-car    { font-size:.88rem; color:#333; margin-bottom:6px; }
    .p-policy-detail { font-size:.78rem; color:#666; background:#f0f4ff; display:inline-block; padding:2px 8px; border-radius:999px; margin-bottom:10px; }
    .p-policy-meta   { display:flex; flex-direction:column; gap:3px; font-size:.78rem; color:#555; }

    /* Action row */
    .p-action-row { display:flex; justify-content:flex-end; gap:10px; margin-bottom:12px; }
    .p-action-row .p-btn-primary { width:auto; }

    /* Download */
    .p-download-area { background:#f8f9fe; border:1px solid #e0e6f4; border-radius:12px; padding:24px; margin-bottom:16px; }
    .p-pdf-preview   { display:flex; gap:20px; align-items:flex-start; margin-bottom:20px; }
    .p-pdf-icon      { font-size:3rem; }
    .p-pdf-meta      { flex:1; }
    .p-pdf-name      { font-weight:700; color:#1a1a2e; font-size:1rem; margin-bottom:12px; }
    .p-pdf-table     { border-collapse:collapse; width:100%; font-size:.82rem; }
    .p-pdf-table td  { padding:4px 0; color:#555; }
    .p-pdf-table td:first-child { width:160px; color:#888; }
    .p-download-actions { display:flex; gap:10px; flex-wrap:wrap; }
    .p-btn-download      { width:auto; }
    .p-download-success  { display:none; align-items:center; gap:.5rem; color:#1a7a4a; font-weight:600; font-size:1rem; padding:.5rem 0; }
    .p-success-banner { background:#e6f9f0; border:1px solid #a3d9bc; border-radius:8px; padding:14px 18px; font-size:.9rem; color:#1a4a2a; margin-top:12px; }

    /* Shortcut row */
    .p-shortcut-row { display:flex; align-items:center; gap:4px; font-size:.75rem; color:#999; margin-top:8px; flex-wrap:wrap; }
    .p-key { display:inline-block; padding:1px 7px; background:#fff; border:1px solid #ccc; border-bottom:2px solid #aaa; border-radius:4px; font-family:monospace; font-size:.78rem; color:#444; }

    /* Login brand icon color */
    .p-nav-logo-icon { filter:drop-shadow(0 0 4px rgba(255,255,255,.3)); }
  `;
  document.head.appendChild(s);
})();
