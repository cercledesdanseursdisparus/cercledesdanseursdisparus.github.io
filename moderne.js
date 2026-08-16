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

  // Popup rentrée
  var modal = document.getElementById('rentree');
  if(modal){
    function closeModal(){ modal.setAttribute('hidden',''); document.body.style.overflow=''; }
    function openModal(){ modal.removeAttribute('hidden'); document.body.style.overflow='hidden'; }
    setTimeout(openModal, 650);
    modal.querySelectorAll('[data-close]').forEach(function(el){
      el.addEventListener('click', closeModal);
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && !modal.hasAttribute('hidden')) closeModal();
    });
  }
})();
