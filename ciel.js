/* ============ C3D · Le site suit le ciel de Toulouse ============
   4 ambiances calculées avec les heures réelles de lever et de coucher du soleil à Toulouse :
   aube, jour, crépuscule, nuit. Le visiteur peut aussi choisir son ambiance (bouton en bas à gauche). */
(function(){
  var LAT = 43.6047, LON = 1.4442;          // Toulouse
  var AVANT = 40 * 6e4, APRES = 50 * 6e4;   // durée de l'aube et du crépuscule autour du lever/coucher
  function svg(d){ return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>'; }
  var SOLEIL_BAS = '<path d="M3 18h18M7 18a5 5 0 0 1 10 0"/><path d="M12 7v2M5.6 10.6l1.4 1.4M18.4 10.6 17 12"/>';
  var PHASES = {
    auto:       { nom: 'Auto · ciel de Toulouse', ic: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3 2"/>') },
    aube:       { nom: 'Aube',       ic: svg(SOLEIL_BAS + '<path d="m10 4 2-2 2 2"/>') },
    jour:       { nom: 'Jour',       ic: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>') },
    crepuscule: { nom: 'Crépuscule', ic: svg(SOLEIL_BAS + '<path d="m10 2 2 2 2-2"/>') },
    nuit:       { nom: 'Nuit',       ic: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>') }
  };
  var ORDRE = ['aube', 'jour', 'crepuscule', 'nuit'];
  var root = document.documentElement;

  // Heures de lever / coucher du soleil (équation du lever du soleil, précision ~1-2 min)
  function soleil(date){
    var rad = Math.PI / 180;
    var midi = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12);
    var n = Math.round(midi / 864e5 + 2440587.5 - 2451545.0 + 0.0008);
    var Js = n - LON / 360;
    var M = (357.5291 + 0.98560028 * Js) % 360;
    var C = 1.9148 * Math.sin(M * rad) + 0.02 * Math.sin(2 * M * rad) + 0.0003 * Math.sin(3 * M * rad);
    var L = (M + C + 180 + 102.9372) % 360;
    var Jt = 2451545.0 + Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * L * rad);
    var dec = Math.asin(Math.sin(L * rad) * Math.sin(23.4397 * rad));
    var cosw = (Math.sin(-0.833 * rad) - Math.sin(LAT * rad) * Math.sin(dec)) / (Math.cos(LAT * rad) * Math.cos(dec));
    var w = Math.acos(Math.max(-1, Math.min(1, cosw))) / rad;
    function versDate(j){ return new Date((j - 2440587.5) * 864e5); }
    return { lever: versDate(Jt - w / 360), coucher: versDate(Jt + w / 360) };
  }
  function phaseA(t){
    var s = soleil(t), T = +t, L = +s.lever, C = +s.coucher;
    if (T >= L - AVANT && T < L + APRES) return 'aube';
    if (T >= L + APRES && T < C - APRES) return 'jour';
    if (T >= C - APRES && T < C + AVANT) return 'crepuscule';
    return 'nuit';
  }
  function heure(d){ return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).replace(':', 'h'); }

  // Préférence du visiteur (mémorisée sur son navigateur)
  var mode = 'auto';
  try { mode = localStorage.getItem('c3d-ciel') || 'auto'; } catch (e) {}
  if (!PHASES[mode]) mode = 'auto';
  var demo = null, info = null, bouton = null, menu = null;
  // Ambiance posée tout de suite (le script est chargé dans <head>) : pas de flash au chargement
  root.setAttribute('data-ciel', mode === 'auto' ? phaseA(new Date()) : mode);

  function appliquer(p, anime){
    if (root.getAttribute('data-ciel') === p) return;
    if (anime) { root.classList.add('ciel-anim'); clearTimeout(appliquer.t); appliquer.t = setTimeout(function(){ root.classList.remove('ciel-anim'); }, 1700); }
    root.setAttribute('data-ciel', p);
  }
  function maj(anime){
    var t = new Date(), p = demo ? demo.p : (mode === 'auto' ? phaseA(t) : mode);
    appliquer(p, anime);
    if (info) { var reel = phaseA(t); info.innerHTML = '<span class="ic">' + PHASES[reel].ic + '</span><span></span>'; info.lastChild.textContent = texteInfo(reel, t); }
    if (bouton) bouton.innerHTML = '<span class="ic">' + PHASES[p].ic + '</span>' + PHASES[p].nom + (mode === 'auto' && !demo ? ' · auto' : '');
    if (menu) [].forEach.call(menu.querySelectorAll('[data-m]'), function(b){ b.setAttribute('aria-checked', String(b.getAttribute('data-m') === mode)); });
  }
  function texteInfo(p, t){
    var s = soleil(t);
    if (p === 'aube') return 'Le soleil se lève sur Toulouse · ' + heure(s.lever);
    if (p === 'jour') return 'Il fait jour à Toulouse · coucher du soleil à ' + heure(s.coucher);
    if (p === 'crepuscule') return 'Le soleil se couche sur Toulouse · ' + heure(s.coucher);
    var lever = t > s.coucher ? soleil(new Date(+t + 864e5)).lever : s.lever;
    return 'Nuit sur Toulouse · lever du soleil à ' + heure(lever);
  }

  function init(){
  // Voile de couleur léger sur le haut de la photo d'accueil
  var hero = document.querySelector('.mhero');
  if (hero) {
    var voile = document.createElement('div'); voile.className = 'ciel-voile'; voile.setAttribute('aria-hidden', 'true');
    voile.innerHTML = '<i data-p="aube"></i><i data-p="jour"></i><i data-p="crepuscule"></i><i data-p="nuit"></i><i data-p="crepuscule" class="lune"></i><i data-p="nuit" class="lune lune-nuit"></i>';
    hero.insertBefore(voile, hero.querySelector('.fade'));
  }

  // Bouton de choix de l'ambiance
  var ctrl = document.createElement('div'); ctrl.className = 'ciel-ctrl';
  ctrl.innerHTML = '<button class="ciel-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="Choisir l’ambiance du site"></button>' +
    '<div class="ciel-menu" role="menu" hidden><p class="ciel-info"></p>' +
    ['auto'].concat(ORDRE).map(function(m){ return '<button type="button" role="menuitemradio" data-m="' + m + '"><span class="ic">' + PHASES[m].ic + '</span>' + PHASES[m].nom + '</button>'; }).join('') +
    '<button type="button" role="menuitem" data-demo><span class="ic">' + svg('<path d="M8 5.5v13l10-6.5z"/>') + '</span>Voir défiler la journée</button></div>';
  document.body.appendChild(ctrl);
  bouton = ctrl.querySelector('.ciel-btn'); menu = ctrl.querySelector('.ciel-menu'); info = menu.querySelector('.ciel-info');
  function ouvrir(o){ menu.hidden = !o; bouton.setAttribute('aria-expanded', String(o)); }
  bouton.addEventListener('click', function(e){ e.stopPropagation(); ouvrir(menu.hidden); });
  document.addEventListener('click', function(e){ if (!ctrl.contains(e.target)) ouvrir(false); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && !menu.hidden) { ouvrir(false); bouton.focus(); } });
  menu.addEventListener('click', function(e){
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-demo')) { lancerDemo(); ouvrir(false); return; }
    arreterDemo(); mode = b.getAttribute('data-m');
    try { localStorage.setItem('c3d-ciel', mode); } catch (err) {}
    ouvrir(false); maj(true);
  });

  // Démo : les 4 ambiances défilent, puis retour au réglage du visiteur
  function lancerDemo(){
    arreterDemo(); var i = 0;
    demo = { p: ORDRE[0] }; maj(true);
    demo.timer = setInterval(function(){
      i++; if (i >= ORDRE.length * 2) { arreterDemo(); maj(true); return; }
      demo.p = ORDRE[i % ORDRE.length]; maj(true);
    }, 2600);
  }
  function arreterDemo(){ if (demo) { clearInterval(demo.timer); demo = null; } }

  maj(false);
  setInterval(function(){ if (!demo) maj(true); }, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.CielC3D = { soleil: soleil, phase: phaseA };
})();
