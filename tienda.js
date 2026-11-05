// Vista Sofá / Cama del catálogo, telas del banner de la portada y barra fija de compra en móvil.
(function(){
  // Portada editorial de cuatro slides: cada escena presenta un sofacama distinto.
  function montarPortadaEditorial(){
    const portada = document.querySelector('.portada');
    if (!portada) return;

    const slides = [
      {
        clase: 'hero-slide--day', imagen: './assets/portada/hero-magazine-ivory.png',
        alt: 'Sofacama bouclé marfil en una sala luminosa de estilo editorial', etiqueta: 'Colección Casa Atelier',
        titulo: 'Tu sala también puede ser una historia.', texto: 'Sofacamas que convierten cada rincón en el lugar favorito de la casa.', enlace: 'Ver modelos'
      },
      {
        clase: 'hero-slide--night', imagen: './assets/portada/hero-magazine-olive.png',
        alt: 'Sofacama verde oliva de terciopelo en un salón sofisticado al anochecer', etiqueta: 'Diseño para quedarse',
        titulo: 'Una pieza que cambia el ambiente.', texto: 'Texturas, proporciones y color para una casa con personalidad.', enlace: 'Descubrir la colección'
      },
      {
        clase: 'hero-slide--bed', imagen: './assets/portada/hero-magazine-terracotta.png', alinea: 'hero-slide--copy-right',
        alt: 'Sofacama terracota abierto como cama en un dormitorio de revista', etiqueta: 'Sofá de día. Cama de noche.',
        titulo: 'Cuando llega la noche, se transforma.', texto: 'Más espacio para descansar, recibir y vivir bonito todos los días.', enlace: 'Cómo elegir el tuyo'
      },
      {
        clase: 'hero-slide--apartment', imagen: './assets/portada/hero-magazine-monaco.png',
        alt: 'Sofacama Mónaco en un apartamento de lujo en Bogotá', etiqueta: 'Mónaco · Interiorismo bogotano',
        titulo: 'El confort también puede ser arquitectura.', texto: 'Una pieza que se integra al espacio y deja que la casa hable.', enlace: 'Ver el Mónaco'
      }
    ];

    portada.classList.add('portada-magazine');
    portada.innerHTML = `<div class="hero-slider" data-hero-slider tabindex="0" aria-roledescription="carrusel" aria-label="Inspiración de sofacamas">
      <div class="hero-slides">${slides.map((slide, index) => `<article class="hero-slide ${slide.clase} ${slide.alinea || ''}${index === 0 ? ' is-active' : ''}" data-hero-slide="${index}" aria-hidden="${index === 0 ? 'false' : 'true'}">
        <img class="hero-slide-image" src="${slide.imagen}" alt="${slide.alt}" ${index === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} width="2048" height="1152">
        <div class="hero-slide-shade" aria-hidden="true"></div>
        <div class="hero-slide-content">
          <p class="hero-slide-kicker">${slide.etiqueta}</p>
          <h1>${slide.titulo}</h1>
          <p class="hero-slide-text">${slide.texto}</p>
          <div class="hero-slide-actions portada-acciones"><a class="boton hero-slide-cta" href="#modelos">${slide.enlace}</a></div>
        </div>
      </article>`).join('')}</div>
    </div>`;

    const carrusel = portada.querySelector('[data-hero-slider]');
    const elementos = [...portada.querySelectorAll('[data-hero-slide]')];
    const puntos = [...portada.querySelectorAll('[data-hero-dot]')];
    const reducido = matchMedia('(prefers-reduced-motion: reduce)');
    let actual = 0;
    let pausado = reducido.matches;
    let temporizador;

    const mostrar = (indice, conTransicion = true) => {
      actual = (indice + elementos.length) % elementos.length;
      elementos.forEach((elemento, i) => {
        elemento.classList.toggle('is-active', i === actual);
        elemento.setAttribute('aria-hidden', String(i !== actual));
      });
      puntos.forEach((punto, i) => {
        punto.classList.toggle('is-active', i === actual);
        punto.setAttribute('aria-selected', String(i === actual));
      });
      if (!conTransicion) carrusel.classList.add('no-transition');
      requestAnimationFrame(() => carrusel.classList.remove('no-transition'));
    };

    const programar = () => {
      clearInterval(temporizador);
      if (!pausado) temporizador = setInterval(() => mostrar(actual + 1), 6500);
    };
    puntos.forEach((punto, i) => punto.addEventListener('click', () => { mostrar(i); programar(); }));
    carrusel.addEventListener('keydown', event => {
      if (event.key === 'ArrowLeft') { mostrar(actual - 1); programar(); }
      if (event.key === 'ArrowRight') { mostrar(actual + 1); programar(); }
    });
    let inicioX = 0;
    carrusel.addEventListener('touchstart', event => { inicioX = event.changedTouches[0].screenX; }, {passive: true});
    carrusel.addEventListener('touchend', event => {
      const distancia = event.changedTouches[0].screenX - inicioX;
      if (Math.abs(distancia) < 48) return;
      mostrar(actual + (distancia < 0 ? 1 : -1)); programar();
    }, {passive: true});
    mostrar(0, false); programar();
  }
  montarPortadaEditorial();
  document.querySelectorAll('.logo7-t3').forEach(elemento => { elemento.textContent = 'BY SHALOM CASA ATELIER'; });
  document.querySelector('#visitanos')?.remove();
  document.querySelector('#comprar')?.remove();

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
