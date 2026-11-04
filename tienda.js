// Vista Sofá / Cama y comparador de la portada.
(function(){
  const esCama = url => /abiert|cama-abierta|-cama\.|extension-frente/.test(new URL(url).pathname.split('/').pop());
  function fotoCama(product, variant){
    const fotos = liveVariantPhotos(product, variant);
    return fotos.find(f => esCama(f.url)) || product.photos.find(f => esCama(f.url));
  }
  function agregar(marco, product, variant){
    if (!marco || marco.querySelector('.foto-cama')) return;
    const foto = fotoCama(product, variant);
    if (!foto) return;
    const img = new Image();
    img.className = 'foto-cama'; img.alt = ''; img.loading = 'lazy';
    img.src = liveImageUrl(product, foto.url, 900);
    marco.append(img);
  }
  function decorar(){
    document.querySelectorAll('[data-live-product]').forEach(card => {
      const product = shopifyLiveProducts.find(p => p.id === card.dataset.liveProduct);
      if (product) agregar(card.querySelector('.product-image, .line-image, button'), product, selectedLiveVariant(product));
    });
    const destacados = shopifyLiveProducts.filter(p => p.line === 'sofacamas').slice(0, 8);
    document.querySelectorAll('.featured-card').forEach((card, i) => {
      if (destacados[i]) agregar(card.querySelector('.featured-image'), destacados[i], destacados[i].variants[0]);
    });
  }
  ['#products', '#featured-grid'].forEach(sel => {
    const grid = document.querySelector(sel);
    if (grid) new MutationObserver(decorar).observe(grid, {childList:true});
  });
  window.addEventListener('shopify:updated', decorar);
  decorar();

  document.querySelectorAll('.vista button').forEach(boton => boton.addEventListener('click', () => {
    const cama = boton.dataset.vista === 'cama';
    document.body.classList.toggle('vista-cama', cama);
    document.querySelectorAll('.vista button').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.vista === 'cama') === cama)));
  }));

  const comparador = document.querySelector('.comparador');
  if (comparador) {
    const rango = comparador.querySelector('input');
    const poner = v => comparador.style.setProperty('--pos', v + '%');
    rango.addEventListener('input', () => poner(rango.value));
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const inicio = performance.now();
      let tocado = false;
      rango.addEventListener('pointerdown', () => { tocado = true; }, {once:true});
      rango.addEventListener('keydown', () => { tocado = true; }, {once:true});
      (function paso(t){
        if (tocado) return;
        const p = Math.min((t - inicio) / 1800, 1);
        const v = 50 - 22 * Math.sin(p * Math.PI);
        poner(v); rango.value = v;
        if (p < 1) requestAnimationFrame(paso);
      })(inicio + 400);
    }
  }
})();
