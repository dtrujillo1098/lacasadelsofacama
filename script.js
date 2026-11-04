const siteBase = document.body.dataset.siteBase || './';
const siteUrl = value => value && value.startsWith('https://') ? value : siteBase + (value || '').replace(/^\.\//, '');
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
function closeMenu() {
  menu?.setAttribute('aria-expanded', 'false');
  menu?.setAttribute('aria-label', 'Abrir menú');
  nav?.classList.remove('is-open');
}
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  nav.classList.toggle('is-open', open);
});
nav?.querySelectorAll('a:not(.nav-parent)').forEach(link => link.addEventListener('click', closeMenu));
// Celular: las subcategorías se despliegan al tocar la categoría.
const compactNav = window.matchMedia('(max-width:980px)');
nav?.querySelectorAll('.nav-item').forEach(item => {
  const parent = item.querySelector('.nav-parent');
  const sub = item.querySelector('.submenu-col');
  if(!parent || !sub) return;
  const setOpen = open => { item.classList.toggle('is-open', open); parent.setAttribute('aria-expanded', String(open)); };
  setOpen(compactNav.matches && parent.classList.contains('is-current'));
  parent.addEventListener('click', event => {
    if(!compactNav.matches) return;
    event.preventDefault();
    setOpen(!item.classList.contains('is-open'));
  });
});
document.addEventListener('keydown', event => {
  if(event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
document.addEventListener('click', event => {
  if(menu?.getAttribute('aria-expanded') === 'true' && !event.target.closest('.header')) closeMenu();
});
window.matchMedia('(max-width:960px)').addEventListener('change', event => { if(!event.matches) closeMenu(); });
function openDialog(dialog) { if(!dialog) return; dialog.showModal(); document.body.classList.add('modal-open'); }
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close')?.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { if(!document.querySelector('dialog[open]')) document.body.classList.remove('modal-open'); });
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if(event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});
const cart = document.querySelector('#cart-dialog');
document.querySelectorAll('#cart-toggle, #utility-cart').forEach(button => button.addEventListener('click', () => { closeMenu(); openDialog(cart); }));
document.querySelector('#cart-explore')?.addEventListener('click', () => {
  cart.close();
  const overview = document.querySelector('#categorias');
  if(overview) overview.scrollIntoView(); else window.location.assign(siteUrl('index.html#categorias'));
});

const categoryPages = [
  {name:'Sofacamas',file:'sofacamas.html'},
  {name:'Salas',file:'salas.html'},
  {name:'Camas',file:'camas.html'},
  {name:'Comedores',file:'comedores.html'},
  {name:'Aparadores y consolas',file:'aparadores.html'},
  {name:'Escritorios',file:'escritorios.html'},
  {name:'Piezas auxiliares',file:'piezas-auxiliares.html'},
  {name:'Tocadores',file:'tocadores.html'}
];
const allSearchProducts = [];
const searchDialog = document.querySelector('#search-dialog');
const globalSearchInput = document.querySelector('#global-search-input');
const globalSearchResults = document.querySelector('#global-search-results');
function renderGlobalSearch() {
  const query = normalize(globalSearchInput.value.trim());
  globalSearchResults.replaceChildren();
  const matches = query ? allSearchProducts.filter(product=>normalize(product.terms).includes(query)) : [];
  document.querySelector('#global-search-status').textContent = !query ? 'Escribe un nombre, tipo de mueble o color.' : matches.length ? matches.length + (matches.length === 1 ? ' producto encontrado' : ' productos encontrados') : 'No encontramos coincidencias. Prueba otro nombre o explora las categorías.';
  matches.forEach(product => {
    const link = document.createElement('a');
    link.className = 'global-search-result';
    link.href = siteUrl(product.file) + '?producto=' + encodeURIComponent(product.id);
    const image = document.createElement('img'); image.src = siteUrl(product.image); image.alt = ''; image.width = 70; image.height = 70;
    const copy = document.createElement('div');
    const label = document.createElement('small'); label.textContent = product.category;
    const name = document.createElement('strong'); name.textContent = product.name;
    const note = document.createElement('span'); note.textContent = 'Ver detalles';
    copy.append(label,name,note); link.append(image,copy); globalSearchResults.appendChild(link);
  });
}
function openSearch() { closeMenu(); openDialog(searchDialog); renderGlobalSearch(); globalSearchInput.focus(); }
document.querySelectorAll('#search-toggle, #utility-search, #mobile-menu-search').forEach(button => button.addEventListener('click', openSearch));
globalSearchInput?.addEventListener('input', renderGlobalSearch);
document.querySelector('#global-search-form')?.addEventListener('submit', event => { event.preventDefault(); renderGlobalSearch(); });
const requestedProduct = new URLSearchParams(window.location.search).get('producto');


const liveGrid = document.querySelector('#products, .line-grid');
const liveSofa = !!document.querySelector('#products');
const livePage = document.body.dataset.page;
const liveSelections = new Map();
let liveSelectedId = null, livePhotoIndex = 0, liveCategory = 'all';
// Subcategorías del menú: se filtran por el tipo de producto de Shopify (parámetro ?sub=).
const liveInPage = product => livePage === 'sale' ? product.tags.some(tag => /^(sale|oferta|ofertas)$/i.test(tag)) : product.line === livePage;
const liveSubcategories = {
  'sofas': {label:'Sofás', test:type => /puestos|(^|\s)sofas?(\s|$)/.test(type)},
  'en-l-y-modulares': {label:'Sofás en L y modulares', test:type => /modular|(^|\s)en l(\s|$)/.test(type)},
  'mesas-de-centro': {label:'Mesas de centro', test:type => /mesa/.test(type)},
  'sillas-auxiliares': {label:'Sillas auxiliares', test:type => /silla|poltrona/.test(type)},
  'comedor': {label:'Comedor', test:type => !/silla|taburete|banco/.test(type)},
  'sillas-de-comedor': {label:'Sillas de comedor', test:type => /silla/.test(type) && /comedor/.test(type)},
  'sillas-de-bar': {label:'Sillas de bar', test:type => /silla|taburete|banco/.test(type) && /bar|taburete|banco/.test(type)},
  'cama': {label:'Cama', test:type => !/noche|nochero|velador/.test(type)},
  'mesas-de-noche': {label:'Mesa de noche', test:type => /noche|nochero|velador/.test(type)}
};
const liveSub = liveGrid ? liveSubcategories[new URLSearchParams(window.location.search).get('sub')] : null;
let liveSubNote = null;
if(liveSub) {
  liveSubNote = document.createElement('p');
  liveSubNote.className = 'sub-filter-note';
  liveSubNote.innerHTML = '<span>Subcategoría: <strong></strong></span> <a href="' + window.location.pathname + '">Ver toda la categoría</a><span class="sub-filter-empty" hidden>Pronto tendremos productos en esta subcategoría.</span>';
  liveSubNote.querySelector('strong').textContent = liveSub.label;
  document.querySelector('.line-search-toolbar, .catalog-toolbar')?.insertAdjacentElement('afterend', liveSubNote);
}
document.querySelectorAll('.submenu a').forEach(link => {
  const target = new URL(link.href, window.location.href);
  if(target.pathname === window.location.pathname && target.search === window.location.search) link.setAttribute('aria-current', 'page');
});
const liveDialog = document.querySelector('#product-dialog, #line-dialog');
const liveCardTemplate = liveGrid?.querySelector('article')?.cloneNode(true);
function selectedLiveVariant(product) {
  return product.variants.find(variant => variant.id === liveSelections.get(product.id)) || product.variants[0];
}
function liveVariantLabel(product, variant) {
  if (product.id === 'gid://shopify/Product/15461604130950' && variant.id === 'gid://shopify/ProductVariant/67848189870214') return 'Bouclé Blanco';
  if (product.id === 'gid://shopify/Product/15461603836038' && variant.id === 'gid://shopify/ProductVariant/67848185053318') return 'Combinado';
  if (product.id === 'gid://shopify/Product/15461603836038' && variant.id === 'gid://shopify/ProductVariant/67848184955014') return 'Beige';
  return variant.title;
}
// Each product shares one Shopify media collection; colors keep separate galleries.
const livePhotoGroups = {
  "gid://shopify/Product/15461603836038": {
    "gid://shopify/ProductVariant/67848184955014": "sofacama-runa-premium-beige-ambientacion-",
    "gid://shopify/ProductVariant/67848184987782": "sofacama-runa-premium-gris-ambientacion-",
    "gid://shopify/ProductVariant/67848185020550": "sofacama-runa-premium-gris-raton-ambientacion-",
    "gid://shopify/ProductVariant/67848185053318": "sofacama-runa-premium-combinado-ambientacion-"
  },
  "gid://shopify/Product/15461604098182": {
    "gid://shopify/ProductVariant/67848189739142": "sofacama-rubi-beige-ambientacion-",
    "gid://shopify/ProductVariant/67848189771910": "sofacama-rubi-blanco-ambientacion-",
    "gid://shopify/ProductVariant/67848189804678": "sofacama-rubi-azul-cielo-ambientacion-",
    "gid://shopify/ProductVariant/67848189837446": "sofacama-rubi-azul-oscuro-ambientacion-"
  },
  "gid://shopify/Product/15461604130950": {
    "gid://shopify/ProductVariant/67848189870214": "sofa-cama-polar-boucle-blanco-ambientacion-"
  }
};
function liveVariantPhotos(product, variant) {
  const groups = livePhotoGroups[product.id];
  if (groups) {
    const prefix = groups[variant.id];
    if (!prefix) return variant.image ? [variant.image] : [];
    return product.photos.filter(photo => {
      const filename = new URL(photo.url).pathname.split('/').pop();
      return filename.startsWith(prefix);
    });
  }
  return variant.image
    ? [variant.image, ...product.photos.filter(photo => photo.url !== variant.image.url)]
    : [...product.photos];
}
// Se pide a Shopify cada foto al tamaño con el que se muestra (no la de 1254 px completa).
function liveImageUrl(product, url, width) {
  if (!url || !width || !url.startsWith('https://cdn.shopify.com/')) return url;
  const sized = new URL(url);
  sized.searchParams.set('width', width);
  return sized.toString();
}
function setLiveImage(image, url, alt) {
  if (!image) return;
  image.hidden = !url;
  if (url) image.src = url; else image.removeAttribute('src');
  image.alt = alt || '';
}
function liveVariantColor(product, variant) {
  if (product.id === 'gid://shopify/Product/15461604130950' && variant.id === 'gid://shopify/ProductVariant/67848189870214') return '#f1eee6';
  if (product.id === 'gid://shopify/Product/15461604098182') { const colors = {"gid://shopify/ProductVariant/67848189739142": "#c5bca8", "gid://shopify/ProductVariant/67848189771910": "#eeeae2", "gid://shopify/ProductVariant/67848189804678": "#7897ac", "gid://shopify/ProductVariant/67848189837446": "#293f66"}; if (colors[variant.id]) return colors[variant.id]; }
  if (product.id === 'gid://shopify/Product/15461603836038' && variant.id === 'gid://shopify/ProductVariant/67848185053318') return '#ac9b7d';
  if (product.id === 'gid://shopify/Product/15461603836038' && variant.id === 'gid://shopify/ProductVariant/67848185020550') return '#4c4d50';
  const title = normalize(variant.title);
  const known = products.flatMap(item => item.id === 'polar' ? [{"color": "Terracota", "hex": "#b16b4a"}, {"color": "Arena", "hex": "#cab99c"}, {"color": "Azul petróleo", "hex": "#2e6670"}, {"color": "Mostaza", "hex": "#bf923d"}] : item.fabrics).sort((a,b) => b.color.length - a.color.length);
  const color = known.find(fabric => title.includes(normalize(fabric.color)));
  if (color) return color.hex;
  const original = products.find(item => item.id === product.localId);
  return original?.fabrics.find(fabric => variant.sku === 'sofacama-' + product.localId + '-' + fabric.id)?.hex || '#cab99c';
}
function liveVariantControls(product, host) {
  host.replaceChildren();
  const label = document.createElement('p');
  label.className = 'fabric-label';
  label.textContent = 'Elige tela y color';
  const palette = document.createElement('div');
  palette.className = 'fabric-choices';
  palette.setAttribute('role', 'group');
  palette.setAttribute('aria-label', 'Tela y color de ' + product.title);
  for (const variant of product.variants) {
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'fabric-choice';
    option.dataset.liveVariant = product.id;
    option.dataset.variantId = variant.id;
    option.title = liveVariantLabel(product, variant) + (variant.availableForSale ? '' : ' · Agotado');
    option.setAttribute('aria-label', option.title);
    option.setAttribute('aria-pressed', String(variant.id === selectedLiveVariant(product).id));
    option.style.setProperty('--swatch', liveVariantColor(product, variant));
    option.append(document.createElement('span'));
    palette.append(option);
  }
  const selected = document.createElement('p');
  selected.className = 'fabric-selected';
  selected.setAttribute('aria-live', 'polite');
  selected.textContent = liveVariantLabel(product, selectedLiveVariant(product));
  host.append(label, palette, selected);
}
function filterLiveCatalog() {
  if (!liveGrid) return;
  const search = document.querySelector('#search, #line-search');
  const query = normalize(search?.value.trim() || '');
  let count = 0;
  liveGrid.querySelectorAll('[data-live-product]').forEach(card => {
    const product = shopifyLiveProducts.find(item => item.id === card.dataset.liveProduct);
    card.hidden = !product || (liveSub && !liveSub.test(normalize(product.productType || ''))) || (livePage === 'salas' && !liveSub && /mesa|silla|poltrona/.test(normalize(product.productType || ''))) ||!(liveCategory === 'all' || product.tags.includes(liveCategory)) || !normalize([product.title, product.description, ...product.variants.map(variant => variant.title)].join(' ')).includes(query);
    if (!card.hidden) count++;
  });
  liveSubNote?.querySelector('.sub-filter-empty')?.toggleAttribute('hidden', count > 0);
  const empty = document.querySelector('#empty-results, #line-empty');
  if (empty) empty.hidden = count > 0;
  const countLabel = document.querySelector('#result-count, #line-search-status');
  if (countLabel) countLabel.textContent = count + (count === 1 ? ' modelo' : ' modelos');
}
function renderLiveCatalog() {
  if (!liveGrid || !liveCardTemplate) return;
  liveGrid.replaceChildren();
  const list = shopifyLiveProducts.filter(liveInPage);
  for (const product of list) {
    const card = liveCardTemplate.cloneNode(true);
    card.dataset.liveProduct = product.id;
    card.querySelectorAll('.buy-link').forEach(link => link.remove());
    card.querySelectorAll('[data-product], [data-line-product]').forEach(button => {
      button.removeAttribute('data-product');
      button.removeAttribute('data-line-product');
      button.dataset.liveOpen = product.id;
      button.setAttribute('aria-label', 'Ver ' + product.title);
    });
    card.querySelector('h3').textContent = product.title;
    const description = card.querySelector('.line-description') || card.querySelector('.product-title + p');
    description?.remove();
    const variant = selectedLiveVariant(product);
    const photos = liveVariantPhotos(product, variant);
    setLiveImage(card.querySelector('img'), liveImageUrl(product, photos[0]?.url, 900), product.title + ' · ' + liveVariantLabel(product, variant));
    const choices = card.querySelector('.fabric-options');
    if (choices) liveVariantControls(product, choices);
    else if (product.variants.length > 1) {
      const host = document.createElement('div');
      liveVariantControls(product, host);
      card.querySelector('.line-meta').before(host);
    }
    const meta = card.querySelector('.product-meta span, .line-meta span');
    const hasColorPicker = Boolean(choices) || product.variants.length > 1;
    if (meta) meta.textContent = variant.title === 'Default Title' || hasColorPicker ? '' : liveVariantLabel(product, variant);
    const type = card.querySelector('.line-type');
    if (type) type.textContent = product.productType;
    card.querySelector('.product-meta')?.remove();
    card.querySelector('.product-link')?.remove(); // se abre el producto desde la imagen
    card.querySelector('.view-product')?.remove(); // al pasar el mouse solo hace zoom la imagen
    updateBuyButton(card, variant.key);
    card.querySelectorAll('.buy-link').forEach(link => link.remove()); // el botón de compra solo se muestra dentro del producto
    liveGrid.append(card);
  }
  const intro = document.querySelector('.page-intro-text');
  if (intro && liveSofa) intro.textContent = 'Explora los sofacamas de nuestra colección y sus opciones disponibles.';
  filterLiveCatalog();
}
function renderLiveDetail() {
  const product = shopifyLiveProducts.find(item => item.id === liveSelectedId);
  if (!product || !liveInPage(product)) { liveDialog?.close(); liveSelectedId = null; return; }
  const variant = selectedLiveVariant(product);
  document.querySelector('#detail-title, #line-detail-title').textContent = product.title;
  document.querySelector('#detail-description, #line-detail-description').textContent = product.description;
  const color = document.querySelector('#detail-color, #line-detail-color');
  if (color) color.textContent = variant.title === 'Default Title' ? '' : liveVariantLabel(product, variant);
  let controls = liveDialog.querySelector('#detail-fabric-options, .live-detail-options');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'live-detail-options';
    color.after(controls);
  }
  liveVariantControls(product, controls);
  const photos = liveVariantPhotos(product, variant);
  if (livePhotoIndex >= photos.length) livePhotoIndex = 0;
  const photo = photos[livePhotoIndex];
  setLiveImage(liveDialog.querySelector('#detail-image, #line-detail-image'), photo?.url, photo?.altText || product.title); // foto grande: archivo original, sin redimensionar
  const thumbs = liveDialog.querySelector('#photo-thumbnails');
  if (thumbs) {
    thumbs.replaceChildren();
    photos.forEach((item, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.livePhoto = index;
      button.setAttribute('aria-label', 'Ver foto ' + (index + 1));
      button.setAttribute('aria-pressed', String(index === livePhotoIndex));
      const image = document.createElement('img');
      setLiveImage(image, liveImageUrl(product, item.url, 320), '');
      button.append(image);
      thumbs.append(button);
    });
  }
  const caption = document.querySelector('#photo-caption');
  if (caption) caption.textContent = photos.length ? (livePhotoIndex + 1) + ' / ' + photos.length : 'Sin fotografías para esta variante';
  const note = document.querySelector('#fabric-view-note');
  if (note) note.hidden = true;
  const category = document.querySelector('#line-detail-category');
  if (category) category.textContent = product.lineName + ' · ' + product.productType;
  updateBuyButton(liveDialog.querySelector('.detail-copy'), variant.key, '.button.dark');
}
liveGrid?.replaceChildren(); // Do not present an old static catalog as live data.
document.querySelector('#search, #line-search')?.addEventListener('input', filterLiveCatalog);
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  liveCategory = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => {
    item.classList.toggle('active', item === button);
    item.setAttribute('aria-pressed', String(item === button));
  });
  filterLiveCatalog();
}));
document.addEventListener('click', event => {
  const option = event.target.closest('button[data-live-variant]');
  if (option) {
    const wasInDialog = !!option.closest('dialog');
    liveSelections.set(option.dataset.liveVariant, option.dataset.variantId);
    livePhotoIndex = 0;
    renderLiveCatalog();
    if (liveDialog?.open) renderLiveDetail();
    const scope = wasInDialog ? liveDialog : liveGrid;
    const replacement = [...scope.querySelectorAll('button[data-live-variant]')].find(button =>
      button.dataset.liveVariant === option.dataset.liveVariant && button.dataset.variantId === option.dataset.variantId);
    replacement?.focus({preventScroll:true});
  }
  const opener = event.target.closest('[data-live-open]');
  if (opener) {
    liveSelectedId = opener.dataset.liveOpen;
    livePhotoIndex = 0;
    renderLiveDetail();
    openDialog(liveDialog);
  }
  const photo = event.target.closest('[data-live-photo]');
  if (photo) { livePhotoIndex = Number(photo.dataset.livePhoto); renderLiveDetail(); }
});
function moveLivePhoto(delta) {
  const product = shopifyLiveProducts.find(item => item.id === liveSelectedId);
  if (!product) return;
  const variant = selectedLiveVariant(product);
  const count = liveVariantPhotos(product, variant).length;
  livePhotoIndex = count ? (livePhotoIndex + delta + count) % count : 0;
  renderLiveDetail();
}
document.querySelector('#photo-prev')?.addEventListener('click', () => moveLivePhoto(-1));
document.querySelector('#photo-next')?.addEventListener('click', () => moveLivePhoto(1));
liveDialog?.addEventListener('keydown', event => {
  if (event.target.matches('select, option')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault(); moveLivePhoto(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
document.querySelector('#back-to-catalog, #line-detail-close')?.addEventListener('click', () => liveDialog.close());
let liveOpenedRequested = false;
window.addEventListener('shopify:updated', () => {
  renderLiveCatalog();
  if (liveDialog?.open) renderLiveDetail();
  allSearchProducts.splice(0, allSearchProducts.length, ...shopifyLiveProducts.map(product => ({
    id:product.localId, name:product.title, category:product.lineName, file:product.line + '.html',
    image:product.image, terms:[product.title, product.description, product.productType, ...product.tags, ...product.variants.map(variant => variant.title)].join(' ')
  })));
  if (searchDialog?.open) renderGlobalSearch();
  if (requestedProduct && !liveOpenedRequested && liveDialog) {
    liveOpenedRequested = true;
    const product = shopifyLiveProducts.find(item => item.localId === requestedProduct && item.line === livePage);
    if (product) { liveSelectedId = product.id; renderLiveDetail(); openDialog(liveDialog); }
  }
});


const slides = Array.from(document.querySelectorAll('.hero-slide'));
if(slides.length) {
  const buttons = Array.from(document.querySelectorAll('[data-slide]'));
  let activeSlide = 0, timer;
  function showSlide(index) {
    activeSlide = (index + slides.length) % slides.length;
    slides.forEach((slide,i) => { slide.hidden = i !== activeSlide; });
    buttons.forEach((button,i) => { if(i === activeSlide) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current'); });
    document.querySelector('#banner-caption').textContent = slides[activeSlide].dataset.caption;
    document.querySelector('#banner-count').textContent = String(activeSlide+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0');
  }
  function startRotation() { clearInterval(timer); if(!document.hidden) timer = setInterval(() => showSlide(activeSlide+1),3500); }
  buttons.forEach(button=>button.addEventListener('click',()=>{showSlide(Number(button.dataset.slide));startRotation();}));
  document.querySelector('#banner-prev').addEventListener('click',()=>{showSlide(activeSlide-1);startRotation();});
  document.querySelector('#banner-next').addEventListener('click',()=>{showSlide(activeSlide+1);startRotation();});
  document.addEventListener('visibilitychange',startRotation); startRotation();
}
if(document.body.dataset.page === 'inicio') {
  const legacyPages = {coleccion:'sofacamas.html',salas:'salas.html','sillas-auxiliares':'salas.html?sub=sillas-auxiliares',camas:'camas.html',nosotros:'nosotros.html',guia:'sofacamas.html#guia',inspiracion:'blog/index.html',blog:'blog/index.html'};
  const destination = legacyPages[window.location.hash.slice(1)];
  if(destination) window.location.replace(siteUrl(destination));
}

// Guía de 3 pasos: aparece de izquierda a derecha cuando entra en pantalla
const stepsGuide = document.querySelector('.benefits');
if (stepsGuide && 'IntersectionObserver' in window) {
  stepsGuide.classList.add('steps-ready');
  new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting)) { stepsGuide.classList.add('is-visible'); observer.disconnect(); }
  }, {threshold:.4}).observe(stepsGuide);
}

// Tarjeta 1993 de Nosotros: la huella y la firma se dibujan al verla
const aboutYear = document.querySelector('.about-year');
if (aboutYear && 'IntersectionObserver' in window) {
  aboutYear.classList.add('anim-ready');
  new IntersectionObserver((entries, observer) => {
    if (entries.some(entry => entry.isIntersecting)) { aboutYear.classList.add('is-in'); observer.disconnect(); }
  }, {threshold:.6}).observe(aboutYear);
}

// Portada: el encabezado es transparente sobre la foto y se vuelve sólido al bajar
const homeHeader = document.querySelector('body.site-home .header');
if (homeHeader) {
  const syncHeader = () => homeHeader.classList.toggle('is-scrolled', window.scrollY > 40);
  syncHeader();
  window.addEventListener('scroll', syncHeader, {passive: true});
}

// Portada (escritorio): productos destacados tomados del catálogo en vivo de Shopify
const featuredGrid = document.querySelector('#featured-grid');
if (featuredGrid) {
  const money = new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0});
  window.addEventListener('shopify:updated', () => {
    const items = shopifyLiveProducts.filter(product => product.line === 'sofacamas').slice(0, 4);
    featuredGrid.replaceChildren();
    for (const product of items) {
      const variant = product.variants[0];
      const link = document.createElement('a');
      link.className = 'featured-card';
      link.href = siteUrl('sofacamas.html') + '?producto=' + encodeURIComponent(product.localId);
      const frame = document.createElement('div');
      frame.className = 'featured-image';
      const img = document.createElement('img');
      img.loading = 'lazy'; img.width = 900; img.height = 900;
      setLiveImage(img, liveImageUrl(product, liveVariantPhotos(product, variant)[0]?.url, 900), product.title);
      frame.append(img);
      const name = document.createElement('h3'); name.textContent = product.title;
      const price = document.createElement('p'); price.className = 'featured-price';
      price.textContent = Number(variant.price?.amount) > 0 ? money.format(Number(variant.price.amount)) + ' COP' : 'Consultar precio';
      link.append(frame, name, price);
      featuredGrid.append(link);
    }
    document.querySelector('#destacados').hidden = !items.length;
  });
}
