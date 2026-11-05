// Vista Sofá / Cama del catálogo, telas del banner de la portada y barra fija de compra en móvil.
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

  // Banner de la portada: el Rubí en la misma sala y en 4 telas. Empieza cerrado (sofá)
  // y se abre (cama) al pasar el mouse; en pantallas táctiles, al tocar la foto.
  const escena = document.querySelector('.escena');
  if (escena) {
    const RUBI = 'gid://shopify/Product/15461604098182';
    const marco = escena.querySelector('.escena-marco');
    const sofa = marco.querySelector('.escena-sofa');
    const cama = marco.querySelector('.escena-cama');
    const estado = escena.querySelector('.escena-estado');
    const telas = [...escena.querySelectorAll('.escena-tela')];
    const quieto = matchMedia('(prefers-reduced-motion: reduce)');
    const tactil = matchMedia('(hover: none)');
    const ruta = (tela, vista) => `./assets/portada/rubi-${tela}-${vista}.webp`;
    const cargadas = new Map();
    const cargar = src => {
      if (!cargadas.has(src)) { const img = new Image(); img.src = src; cargadas.set(src, img.decode().catch(() => {})); }
      return cargadas.get(src);
    };
    const elegida = () => telas.find(b => b.getAttribute('aria-pressed') === 'true');
    const nombre = boton => boton.getAttribute('aria-label').toLowerCase();
    const abierto = () => marco.classList.contains('abierto') || escena.matches(':hover');
    marco.addEventListener('click', () => { if (tactil.matches) marco.classList.toggle('abierto'); });
    let turno = 0;
    telas.forEach(boton => {
      const precargar = () => { cargar(ruta(boton.dataset.tela, 'sofa')); cargar(ruta(boton.dataset.tela, 'cama')); };
      boton.addEventListener('pointerenter', precargar);
      boton.addEventListener('focus', precargar);
      boton.addEventListener('click', async () => {
        if (boton === elegida()) return;
        telas.forEach(b => b.setAttribute('aria-pressed', String(b === boton)));
        estado.textContent = `Rubí en ${nombre(boton)}.`;
        const mio = ++turno;
        const tela = boton.dataset.tela;
        await Promise.all([cargar(ruta(tela, 'sofa')), cargar(ruta(tela, 'cama'))]);
        if (mio !== turno) return; // otro clic llegó después
        if (!quieto.matches) {
          // Fundido: una copia de la foto visible se desvanece sobre la nueva.
          const salida = (abierto() ? cama : sofa).cloneNode();
          salida.className = 'escena-salida';
          salida.alt = '';
          salida.removeAttribute('fetchpriority');
          marco.append(salida);
          requestAnimationFrame(() => requestAnimationFrame(() => salida.classList.add('fuera')));
          setTimeout(() => salida.remove(), 500);
        }
        sofa.src = ruta(tela, 'sofa');
        cama.src = ruta(tela, 'cama');
        sofa.alt = `Sofacama Rubí en ${nombre(boton)}, en una sala`;
      });
    });
    // "Ver el Rubí" abre su ficha con la tela elegida; sin catálogo cargado, baja a los modelos.
    escena.querySelector('[data-abrir-rubi]')?.addEventListener('click', event => {
      const rubi = typeof shopifyLiveProducts !== 'undefined' && shopifyLiveProducts.find(p => p.id === RUBI);
      if (!rubi || typeof openDialog !== 'function' || !liveDialog) return;
      event.preventDefault();
      const variante = rubi.variants.find(v => v.id.endsWith('/' + elegida().dataset.variante));
      if (variante) liveSelections.set(rubi.id, variante.id);
      liveSelectedId = rubi.id;
      livePhotoIndex = 0;
      renderLiveDetail();
      openDialog(liveDialog);
    });
    // El encabezado va transparente sobre la foto mientras la página está arriba (ver tienda.css).
    const cabecera = document.querySelector('body.landing .header');
    if (cabecera) {
      const sobreFoto = () => cabecera.classList.toggle('sobre-foto', scrollY < 24);
      sobreFoto();
      addEventListener('scroll', sobreFoto, {passive: true});
    }
  }

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
