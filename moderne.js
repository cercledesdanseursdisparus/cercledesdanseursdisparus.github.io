// C3D · Proposition Moderne — interactions partagées
(function(){
  // sticky nav
  var nav = document.querySelector('.mnav');
  function onScroll(){ if(nav) nav.classList.toggle('solid', window.scrollY > 30); }
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});

  // mobile menu
  var burger = document.querySelector('.mburger');
  var menu = document.querySelector('.mmenu');
  if(burger && menu){
    burger.addEventListener('click', function(){
      menu.classList.toggle('open');
      burger.textContent = menu.classList.contains('open') ? '✕' : '☰';
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); burger.textContent='☰'; });
    });
  }

  // reveal on scroll
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold:.12, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });

  // FAQ — single open at a time
  var faqs = document.querySelectorAll('.faq details');
  faqs.forEach(function(d){
    d.addEventListener('toggle', function(){
      if(d.open){ faqs.forEach(function(o){ if(o!==d) o.open=false; }); }
    });
  });

  // Lightbox galerie
  var lb = document.getElementById('lightbox');
  if(lb){
    var lbImg = lb.querySelector('img');
    document.querySelectorAll('.pg-item img').forEach(function(img){
      img.addEventListener('click', function(){
        lbImg.src = img.src; lbImg.alt = img.alt;
        lb.removeAttribute('hidden'); document.body.style.overflow='hidden';
      });
    });
    function closeLb(){ lb.setAttribute('hidden',''); document.body.style.overflow=''; }
    lb.addEventListener('click', function(e){ if(e.target===lb || e.target.classList.contains('lb-close')) closeLb(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !lb.hasAttribute('hidden')) closeLb(); });
  }

  // Visite 360° : la visite s'ouvre dans la page, au clic seulement (fichier lourd)
  document.querySelectorAll('[data-visite]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var box = btn.closest('.visite360');
      if(!box || box.classList.contains('on')) return;
      var f = document.createElement('iframe');
      f.src = btn.getAttribute('data-visite');
      f.title = 'Visite 360° de la salle';
      f.setAttribute('allow', 'fullscreen; autoplay; encrypted-media; picture-in-picture');
      f.setAttribute('allowfullscreen', '');
      box.appendChild(f); box.classList.add('on'); f.focus();
    });
  });
})();
