/* ============ C3D · « En ce moment au Cercle » ============
   Lit la page Planning et affiche le cours en cours, ou le prochain cours.
   - Accueil : une pastille à côté des boutons, qui renvoie vers le planning.
   - Page Planning : le cours en cours et le suivant sont mis en évidence.
   Le planning est lu directement sur la page Planning : il suffit de modifier
   cette page pour que l'info suive. Heure de Toulouse (Europe/Paris). */
(function(){
  /* Périodes sans cours (vacances, fermeture…). Exemple de format :
     { du: 'AAAA-MM-JJ', au: 'AAAA-MM-JJ', texte: 'Vacances : reprise des cours le …' } */
  var FERMETURES = [
  ];

  // Copie du planning affichée le temps de lire la page Planning (et si elle ne peut pas être lue)
  var SECOURS = [
    { nom: 'mardi', cours: [[1080,1140,'Hip-Hop Rookies','8 – 11 ans',''],[1140,1200,'House','Adulte',''],[1200,1260,'Hip-Hop','Adulte',''],[1260,1320,'Urban Jazz','Adulte','']] },
    { nom: 'mercredi', cours: [[1050,1110,'Break Rookies','8 – 10 ans','C.C des Mazades'],[1110,1170,'Break Teens','11 – 13 ans','C.C des Mazades']] },
    { nom: 'jeudi', cours: [[1050,1095,'Hip-Hop Éveil','4 – 6 ans',''],[1095,1140,'Hip-Hop Initiation','6 – 8 ans',''],[1140,1200,'Hip-Hop Boomers','Débutant',''],[1200,1260,'Urban Contempo','Débutant',''],[1260,1320,'Urban Contempo','Débutant','']] },
    { nom: 'vendredi', cours: [[1080,1140,'Hip-Hop Ados','12 – 16 ans',''],[1140,1200,'Floorwork','Débutant',''],[1200,1260,'Urban Contempo','Inter · Avancé',''],[1260,1320,'Floorwork','Inter · Avancé','']] },
    { nom: 'samedi', cours: [[840,960,'Concours et scènes','Tous niveaux','']] }
  ].map(function(j){ return { nom: j.nom, cours: j.cours.map(function(c){ return { debut: c[0], fin: c[1], nom: c[2], niveau: c[3], lieu: c[4] }; }) }; });

  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  var simulation = null; // pour tester : { jour: 'jeudi', min: 20*60+15 }

  function lirePlanning(doc){
    var jours = [];
    [].forEach.call(doc.querySelectorAll('.planning .day'), function(d){
      var dh = d.querySelector('.dh'); if (!dh) return;
      var t0 = dh.firstChild && dh.firstChild.nodeType === 3 ? dh.firstChild.textContent : dh.textContent;
      var ven = dh.querySelector('.ven'), cours = [];
      [].forEach.call(d.querySelectorAll('.slot'), function(s){
        if (s.classList.contains('empty')) return;
        var t = (s.querySelector('.time') || {}).textContent || '';
        var m = t.match(/(\d{1,2})h(\d{2})?\s*[–—-]\s*(\d{1,2})h(\d{2})?/); if (!m) return;
        var nm = '', nmEl = s.querySelector('.nm');
        if (nmEl) [].forEach.call(nmEl.childNodes, function(n){ if (n.nodeType === 3) nm += n.textContent; });
        cours.push({ debut: +m[1] * 60 + (+m[2] || 0), fin: +m[3] * 60 + (+m[4] || 0), nom: nm.trim(),
          niveau: ((s.querySelector('.chip') || {}).textContent || '').trim(),
          lieu: ven ? ven.textContent.trim() : (s.classList.contains('mz') ? 'C.C des Mazades' : ''), el: s });
      });
      jours.push({ nom: t0.trim().toLowerCase(), cours: cours });
    });
    return jours;
  }

  function maintenant(){
    if (simulation) return { jour: simulation.jour, min: simulation.min, date: '' };
    var p = {}, d = new Date();
    new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', weekday: 'long', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(d).forEach(function(x){ p[x.type] = x.value; });
    return { jour: p.weekday.toLowerCase(), min: (+p.hour % 24) * 60 + +p.minute,
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(d) };
  }

  function etat(jours){
    var n = maintenant();
    for (var f = 0; f < FERMETURES.length; f++) if (n.date && n.date >= FERMETURES[f].du && n.date <= FERMETURES[f].au) return { type: 'ferme', texte: FERMETURES[f].texte };
    var par = {}; jours.forEach(function(j){ par[j.nom] = j.cours.slice().sort(function(a, b){ return a.debut - b.debut; }); });
    var auj = par[n.jour] || [], idx = JOURS.indexOf(n.jour);
    var enCours = auj.filter(function(c){ return c.debut <= n.min && n.min < c.fin; });
    var prochain = null, dans = 0;
    for (var k = 0; k <= 7 && !prochain; k++) {
      var liste = par[JOURS[(idx + k) % 7]] || [];
      for (var i = 0; i < liste.length; i++) if (k > 0 || liste[i].debut > n.min) { prochain = liste[i]; dans = k; break; }
    }
    return { type: enCours.length ? 'live' : 'suivant', enCours: enCours, prochain: prochain, dans: dans, jour: prochain ? JOURS[(idx + dans) % 7] : '' };
  }

  function h(min){ var hh = Math.floor(min / 60), mm = min % 60; return hh + 'h' + (mm ? (mm < 10 ? '0' : '') + mm : ''); }
  function detail(c){ return c.nom + (c.niveau ? ' · ' + c.niveau : '') + (c.lieu ? ' · ' + c.lieu : ''); }
  function texte(e){
    if (e.type === 'ferme') return { titre: 'Pas de cours en ce moment', suite: e.texte };
    if (e.type === 'live') return { titre: 'En ce moment au Cercle', suite: e.enCours.map(function(c){ return detail(c) + ' · jusqu’à ' + h(c.fin); }).join(' + ') };
    if (!e.prochain) return null;
    var quand = e.dans === 0 ? 'aujourd’hui' : e.dans === 1 ? 'demain' : e.dans === 7 ? e.jour + ' prochain' : e.jour;
    return { titre: 'Prochain cours ' + quand + ' à ' + h(e.prochain.debut), suite: detail(e.prochain) };
  }

  // Les styles sont dans ciel.css (chargé dans <head>, pour un affichage sans décalage)

  var jours = null, pastille = null, surPlanning = !!document.querySelector('.planning .slot');

  function afficher(){
    if (!jours) return;
    var e = etat(jours), t = texte(e);
    if (pastille && t) {
      pastille.className = 'cercle-live' + (e.type === 'live' ? ' live' : '') + (surPlanning ? ' surpage' : '');
      pastille.innerHTML = '<span class="point"></span><span class="txt"><b></b><span class="sep"> · </span><span class="det"></span></span>';
      pastille.querySelector('b').textContent = t.titre; pastille.querySelector('.det').textContent = t.suite;
      pastille.hidden = false;
    } else if (pastille) pastille.hidden = true;
    if (surPlanning) {
      jours.forEach(function(j){ j.cours.forEach(function(c){
        if (!c.el) return;
        c.el.classList.remove('maintenant', 'prochain');
        var b = c.el.querySelector('.etat'); if (b) b.remove();
      }); });
      var marque = function(c, cl, label){ if (!c || !c.el) return; c.el.classList.add(cl); var b = document.createElement('div'); b.className = 'etat'; b.innerHTML = '<i></i>' + label; c.el.insertBefore(b, c.el.firstChild); };
      if (e.type === 'live') e.enCours.forEach(function(c){ marque(c, 'maintenant', 'En cours'); });
      if (e.type !== 'ferme') marque(e.prochain, 'prochain', e.dans === 0 ? 'Prochain cours' : 'Prochain · ' + (e.dans === 1 ? 'demain' : e.jour));
    }
  }

  function demarrer(){
    // Où afficher la pastille
    var acts = document.querySelector('.mhero .acts'), grille = document.querySelector('.planning');
    pastille = acts ? acts.querySelector('.cercle-live') : null;   // déjà présente dans la page d'accueil
    if (!pastille && (acts || (surPlanning && grille))) {
      pastille = document.createElement(surPlanning ? 'p' : 'a');
      if (!surPlanning) { pastille.href = '/planning#planning'; pastille.title = 'Voir le planning des cours'; }
      pastille.hidden = true;
      if (surPlanning) grille.parentNode.insertBefore(pastille, grille); else acts.insertBefore(pastille, acts.querySelector('.ciel-info'));
    }
    if (surPlanning) { jours = lirePlanning(document); afficher(); }
    else if (pastille) {
      // affichage immédiat (évite que le texte de l'accueil bouge), puis mise à jour avec la page Planning
      jours = SECOURS; afficher();
      fetch('/planning', { credentials: 'same-origin' })
        .then(function(r){ if (!r.ok) throw 0; return r.text(); })
        .then(function(html){ var j = lirePlanning(new DOMParser().parseFromString(html, 'text/html')); if (!j.length) throw 0; jours = j; })
        .catch(function(){ jours = SECOURS; })
        .then(afficher);
    }
    setInterval(afficher, 60000);
  }
  // Le script est placé en fin de page : on affiche tout de suite si la page est prête (évite que le contenu bouge)
  if (document.readyState !== 'loading' || document.querySelector('.mhero .acts') || document.querySelector('.planning .slot')) demarrer();
  else document.addEventListener('DOMContentLoaded', demarrer);

  // Pour tester : CercleLive.simuler('jeudi', 20*60+15) · CercleLive.simuler(null) pour revenir à l'heure réelle
  window.CercleLive = { simuler: function(jour, min){ simulation = jour ? { jour: jour, min: min } : null; afficher(); } };
})();
