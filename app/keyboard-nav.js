/**
 * VoceGuidata — keyboard-nav.js
 * Gestione navigazione da tastiera: Alt+[tasto], Tab focus, overlay visivo
 */

const KeyboardNav = (() => {
  'use strict';

  let initialized = false;
  let overlayTimeout = null;

  // Mappa dei tasti registrati: 'A' → { action, callback }
  const registeredShortcuts = {};

  /**
   * init() — Attiva l'ascolto globale dei tasti Alt+[lettera]
   * e abilita il focus highlight per navigazione Tab
   */
  function init() {
    if (initialized) return;
    initialized = true;

    document.addEventListener('keydown', _handleKeyDown);
    document.addEventListener('focusin', _handleFocusIn);

    _injectFocusStyles();
  }

  /**
   * register(key, action, callback)
   * Registra uno shortcut Alt+[key]
   * @param {string}   key      Lettera singola (es. 'A')
   * @param {string}   action   Etichetta leggibile (es. 'Accedi')
   * @param {Function} callback Funzione da eseguire
   */
  function register(key, action, callback) {
    registeredShortcuts[key.toUpperCase()] = { action, callback };
  }

  /**
   * unregisterAll() — Rimuove tutti gli shortcut registrati
   */
  function unregisterAll() {
    Object.keys(registeredShortcuts).forEach(k => delete registeredShortcuts[k]);
  }

  /**
   * showOverlay(message) — Mostra overlay visivo temporaneo (2s)
   * @param {string} message  Testo da mostrare
   */
  function showOverlay(message) {
    const overlay = document.getElementById('shortcut-overlay');
    if (!overlay) return;

    overlay.textContent = message;
    overlay.classList.add('visible');

    if (overlayTimeout) clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => {
      overlay.classList.remove('visible');
    }, 2000);
  }

  // ── Handlers privati ──────────────────────────────────────────────

  function _handleKeyDown(e) {
    // Shortcut Alt+[lettera]
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      const key = e.key.toUpperCase();
      const shortcut = registeredShortcuts[key];

      if (shortcut) {
        e.preventDefault();
        e.stopPropagation();

        // Feedback visivo
        showOverlay(`✓  ${shortcut.action} attivata`);

        // Aggiorna lastActionTime
        if (window.VoceGuidata) {
          VoceGuidata.lastActionTime = Date.now();
        }

        // Esegui l'azione
        shortcut.callback();
        return;
      }
    }

    // Tab: aggiorna timer inattività
    if (e.key === 'Tab') {
      if (window.VoceGuidata) {
        VoceGuidata.lastActionTime = Date.now();
      }
    }

    // Escape: ferma la sintesi vocale
    if (e.key === 'Escape') {
      VoiceGuide.stopSpeaking();
    }
  }

  /**
   * Focus highlight per navigazione Tab
   * Evidenzia l'elemento con focus con un outline viola spesso
   */
  function _handleFocusIn(e) {
    // Rimuove highlight precedente
    document.querySelectorAll('.kb-focused').forEach(el => el.classList.remove('kb-focused'));

    const el = e.target;
    if (el && el !== document.body && el.tagName !== 'HTML') {
      el.classList.add('kb-focused');
    }

    // Aggiorna timer inattività
    if (window.VoceGuidata) {
      VoceGuidata.lastActionTime = Date.now();
    }
  }

  /**
   * Inietta stili CSS dinamici per il focus highlight
   * (evita dipendenza da style.css per questo comportamento JS-driven)
   */
  function _injectFocusStyles() {
    if (document.getElementById('kb-focus-style')) return;

    const style = document.createElement('style');
    style.id = 'kb-focus-style';
    style.textContent = `
      .kb-focused {
        outline: 4px solid #A100FF !important;
        outline-offset: 4px !important;
        border-radius: 6px !important;
        box-shadow: 0 0 0 6px rgba(161, 0, 255, 0.22) !important;
        transition: outline 0.12s ease, box-shadow 0.12s ease !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ── API pubblica ──────────────────────────────────────────────────
  return { init, register, unregisterAll, showOverlay };

})();
