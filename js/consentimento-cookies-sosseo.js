/**
 * Consentimento de cookies + Consent Mode v2 - SOSSEO (sosseo.com.br)
 * GA4: G-ZZMDPL7644
 *
 * Regras:
 * - Sem escolha salva: medicao anonima ativa (analytics_storage granted),
 *   publicidade bloqueada. O banner e exibido para registrar a preferencia.
 * - Aceitar: libera os 4 sinais via gtag('consent','update') e grava 'granted'.
 * - Recusar / so o essencial: bloqueia os 4 sinais e grava 'denied'.
 * - Nunca reemite gtag('config') nem dispara page_view manual.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'sosseo_consent_v1';
  var BANNER_ID = 'sosseoCookieConsent';
  var STYLE_ID = 'sosseoCookieConsentStyles';

  function lerEscolha() {
    try { return window.localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function gravarEscolha(valor) {
    try { window.localStorage.setItem(STORAGE_KEY, valor); } catch (e) {}
  }

  function aplicarConsentimento(aceito) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage: aceito ? 'granted' : 'denied',
      ad_storage: aceito ? 'granted' : 'denied',
      ad_user_data: aceito ? 'granted' : 'denied',
      ad_personalization: aceito ? 'granted' : 'denied'
    });
  }

  function injetarEstilos() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '#' + BANNER_ID + '{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;padding:12px;box-sizing:border-box;font-family:"Lato","Segoe UI",Arial,sans-serif;}' +
      '#' + BANNER_ID + ' .sosseo-consent-box{max-width:1080px;margin:0 auto;background:#031146;color:#e2e8f0;border:1px solid rgba(10,61,145,0.85);border-left:5px solid #FCB900;border-radius:14px;padding:18px 20px;box-shadow:0 24px 60px rgba(3,17,70,0.55);}' +
      '#' + BANNER_ID + ' .sosseo-consent-title{display:block;color:#ffffff;font-size:15px;font-weight:800;margin:0 0 6px;line-height:1.35;}' +
      '#' + BANNER_ID + ' .sosseo-consent-text{margin:0;font-size:13px;line-height:1.55;color:#c7d2e4;}' +
      '#' + BANNER_ID + ' .sosseo-consent-text a{color:#FCB900;text-decoration:underline;font-weight:600;}' +
      '#' + BANNER_ID + ' .sosseo-consent-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;align-items:center;}' +
      '#' + BANNER_ID + ' .sosseo-consent-actions button{border-radius:8px;padding:11px 20px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1;}' +
      '#' + BANNER_ID + ' #sosseoConsentAccept{background:#0E6606;border:1px solid #0E6606;color:#ffffff;}' +
      '#' + BANNER_ID + ' #sosseoConsentAccept:hover{background:#0b5205;}' +
      '#' + BANNER_ID + ' #sosseoConsentReject{background:transparent;border:1px solid #7c8db5;color:#ffffff;}' +
      '#' + BANNER_ID + ' #sosseoConsentReject:hover{border-color:#ffffff;}' +
      '#' + BANNER_ID + ' #sosseoConsentClose{background:transparent;border:1px solid transparent;color:#9fb0cf;padding:11px 6px;}' +
      '#' + BANNER_ID + ' #sosseoConsentClose:hover{color:#ffffff;}' +
      '@media (max-width:640px){#' + BANNER_ID + '{padding:8px;}#' + BANNER_ID + ' .sosseo-consent-box{padding:16px;border-radius:12px;}#' + BANNER_ID + ' .sosseo-consent-actions button{flex:1 1 100%;padding:13px 16px;}}';
    document.head.appendChild(style);
  }

  function esconderBanner() {
    var banner = document.getElementById(BANNER_ID);
    if (banner) banner.style.display = 'none';
  }

  function montarBanner(revisao) {
    injetarEstilos();
    var banner = document.getElementById(BANNER_ID);

    if (!banner) {
      banner = document.createElement('div');
      banner.id = BANNER_ID;
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-live', 'polite');
      banner.setAttribute('aria-label', 'Preferencias de cookies e privacidade');
      banner.innerHTML =
        '<div class="sosseo-consent-box">' +
          '<strong class="sosseo-consent-title">Sua privacidade e os cookies deste site</strong>' +
          '<p class="sosseo-consent-text">' +
            'A medicao anonima de acessos funciona por padrao: registramos pagina visitada, origem, dispositivo e cidade aproximada, com <strong>IP anonimizado</strong>, via Google Analytics 4 com Consent Mode v2, sem identificar voce. ' +
            'Cookies e sinais de publicidade so sao liberados apos o aceite. Ao recusar, a medicao analitica tambem e desativada. ' +
            'Detalhes na <a href="/politica-de-privacidade/">Politica de Privacidade</a>.' +
          '</p>' +
          '<div class="sosseo-consent-actions">' +
            '<button type="button" id="sosseoConsentAccept">Aceitar todos</button>' +
            '<button type="button" id="sosseoConsentReject">S&oacute; o essencial</button>' +
            '<button type="button" id="sosseoConsentClose">Fechar</button>' +
          '</div>' +
        '</div>';

      banner.querySelector('#sosseoConsentAccept').addEventListener('click', function () {
        gravarEscolha('granted');
        aplicarConsentimento(true);
        esconderBanner();
      });

      banner.querySelector('#sosseoConsentReject').addEventListener('click', function () {
        gravarEscolha('denied');
        aplicarConsentimento(false);
        esconderBanner();
      });

      banner.querySelector('#sosseoConsentClose').addEventListener('click', esconderBanner);

      document.body.appendChild(banner);
    }

    banner.style.display = 'block';
    var closeBtn = banner.querySelector('#sosseoConsentClose');
    if (closeBtn) closeBtn.style.display = revisao ? 'inline-block' : 'none';
  }

  function revisarPreferencias() {
    montarBanner(true);
  }

  window.sosseoAbrirPreferenciasCookies = revisarPreferencias;
  window.sosseoConsentState = lerEscolha;

  function iniciar() {
    var revisarBtn = document.getElementById('sosseoRevisarCookies');
    if (revisarBtn) revisarBtn.addEventListener('click', revisarPreferencias);

    if (lerEscolha() === null) {
      montarBanner(false);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();
