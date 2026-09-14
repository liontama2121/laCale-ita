/* landing.js — interacciones de la landing pública */
(function () {
  'use strict';

  var nav = document.getElementById('nav');

  // Sombra en nav al hacer scroll
  function alScroll() {
    if (!nav) return;
    nav.classList.toggle('con-sombra', window.scrollY > 10);
  }
  window.addEventListener('scroll', alScroll, { passive: true });
  alScroll();

  // Logo: si images/logo.png no existe, mostrar placeholder circular
  var logo = document.getElementById('heroLogo');
  var placeholder = document.getElementById('heroLogoPlaceholder');
  if (logo && placeholder) {
    var mostrarPlaceholder = function () {
      logo.hidden = true;
      placeholder.hidden = false;
    };
    logo.addEventListener('error', mostrarPlaceholder);
    // Si ya falló antes de enganchar el listener
    if (logo.complete && logo.naturalWidth === 0) mostrarPlaceholder();
  }

  // Scroll suave para anclas internas
  document.querySelectorAll('a[href^="#"]').forEach(function (enlace) {
    enlace.addEventListener('click', function (e) {
      var destino = enlace.getAttribute('href');
      if (destino === '#') { e.preventDefault(); return; }
      var el = document.querySelector(destino);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
})();
