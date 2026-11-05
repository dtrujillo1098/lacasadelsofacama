// Vista Sofá / Cama del catálogo y barra fija de compra en móvil.
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
    img.src = liveImageUrl(product, foto.url, marco.closest('.destacado') ? 1400 : 900);
    marco.append(img);
  }
  function decorar(){
    if (typeof shopifyLiveProducts === 'undefined') return;
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

  // Barra fija de compra (solo se ve en móvil): aparece cuando no están en pantalla
  // los botones de la portada, el catálogo ni el bloque final, que ya llevan a comprar.
  const barra = document.querySelector('#barra-compra');
  if (barra && 'IntersectionObserver' in window) {
    const enPantalla = new Set();
    const observador = new IntersectionObserver(entradas => {
      entradas.forEach(e => e.isIntersecting ? enPantalla.add(e.target) : enPantalla.delete(e.target));
      const mostrar = enPantalla.size === 0;
      barra.hidden = !mostrar;
      document.body.classList.toggle('con-barra', mostrar);
    });
    ['.portada-acciones', '#modelos', '#comprar'].forEach(sel => {
      const el = document.querySelector(sel);
      if (el) observador.observe(el);
    });
  }
})();
