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
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
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
  {name:'Sillas auxiliares',file:'sillas-auxiliares.html'},
  {name:'Camas',file:'camas.html'}
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
const liveDialog = document.querySelector('#product-dialog, #line-dialog');
const liveCardTemplate = liveGrid?.querySelector('article')?.cloneNode(true);
function selectedLiveVariant(product) {
  return product.variants.find(variant => variant.id === liveSelections.get(product.id)) || product.variants[0];
}
function setLiveImage(image, url, alt) {
  if (!image) return;
  image.hidden = !url;
  if (url) image.src = url; else image.removeAttribute('src');
  image.alt = alt || '';
}
function liveVariantControls(product, host) {
  host.replaceChildren();
  const label = document.createElement('p');
  label.className = 'fabric-label';
  label.textContent = 'Elige una opción';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Opciones de ' + product.title);
  select.dataset.liveVariant = product.id;
  for (const variant of product.variants) {
    const option = document.createElement('option');
    option.value = variant.id;
    option.textContent = variant.title + (variant.availableForSale ? '' : ' · Agotado');
    option.selected = variant.id === selectedLiveVariant(product).id;
    select.append(option);
  }
  host.append(label, select);
}
function filterLiveCatalog() {
  if (!liveGrid) return;
  const search = document.querySelector('#search, #line-search');
  const query = normalize(search?.value.trim() || '');
  let count = 0;
  liveGrid.querySelectorAll('[data-live-product]').forEach(card => {
    const product = shopifyLiveProducts.find(item => item.id === card.dataset.liveProduct);
    card.hidden = !product || !(liveCategory === 'all' || product.tags.includes(liveCategory)) || !normalize([product.title, product.description, ...product.variants.map(variant => variant.title)].join(' ')).includes(query);
    if (!card.hidden) count++;
  });
  const empty = document.querySelector('#empty-results, #line-empty');
  if (empty) empty.hidden = count > 0;
  const countLabel = document.querySelector('#result-count, #line-search-status');
  if (countLabel) countLabel.textContent = count + (count === 1 ? ' modelo' : ' modelos');
}
function renderLiveCatalog() {
  if (!liveGrid || !liveCardTemplate) return;
  liveGrid.replaceChildren();
  const list = shopifyLiveProducts.filter(product => product.line === livePage);
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
    if (description) description.textContent = product.description;
    const variant = selectedLiveVariant(product);
    setLiveImage(card.querySelector('img'), variant.image?.url || product.image, product.title + ' · ' + variant.title);
    const choices = card.querySelector('.fabric-options');
    if (choices) liveVariantControls(product, choices);
    else if (product.variants.length > 1) {
      const host = document.createElement('div');
      liveVariantControls(product, host);
      card.querySelector('.line-meta').before(host);
    }
    const meta = card.querySelector('.product-meta span, .line-meta span');
    if (meta) meta.textContent = variant.title === 'Default Title' ? '' : variant.title;
    const type = card.querySelector('.line-type');
    if (type) type.textContent = product.productType;
    const photoCount = card.querySelector('.product-meta span + span');
    if (photoCount) photoCount.textContent = product.photos.length + ' fotos';
    const imageAction = card.querySelector('.view-product');
    if (imageAction) imageAction.textContent = 'Ver modelo ↗';
    updateBuyButton(card, variant.key);
    liveGrid.append(card);
  }
  const intro = document.querySelector('.page-intro-text');
  if (intro && liveSofa) intro.textContent = 'Explora los sofacamas de nuestra colección y sus opciones disponibles.';
  filterLiveCatalog();
}
function renderLiveDetail() {
  const product = shopifyLiveProducts.find(item => item.id === liveSelectedId);
  if (!product || product.line !== livePage) { liveDialog?.close(); liveSelectedId = null; return; }
  const variant = selectedLiveVariant(product);
  document.querySelector('#detail-title, #line-detail-title').textContent = product.title;
  document.querySelector('#detail-description, #line-detail-description').textContent = product.description;
  const color = document.querySelector('#detail-color, #line-detail-color');
  if (color) color.textContent = variant.title === 'Default Title' ? '' : variant.title;
  let controls = liveDialog.querySelector('#detail-fabric-options, .live-detail-options');
  if (!controls) {
    controls = document.createElement('div');
    controls.className = 'live-detail-options';
    color.after(controls);
  }
  liveVariantControls(product, controls);
  const photos = variant.image ? [variant.image, ...product.photos.filter(photo => photo.url !== variant.image.url)] : [...product.photos];
  if (livePhotoIndex >= photos.length) livePhotoIndex = 0;
  const photo = photos[livePhotoIndex];
  setLiveImage(liveDialog.querySelector('#detail-image, #line-detail-image'), photo?.url, photo?.altText || product.title);
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
      setLiveImage(image, item.url, '');
      button.append(image);
      thumbs.append(button);
    });
  }
  const caption = document.querySelector('#photo-caption');
  if (caption) caption.textContent = photos.length ? (livePhotoIndex + 1) + ' / ' + photos.length : 'Sin fotografías';
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
document.addEventListener('change', event => {
  if (!event.target.matches('[data-live-variant]')) return;
  liveSelections.set(event.target.dataset.liveVariant, event.target.value);
  livePhotoIndex = 0;
  renderLiveCatalog();
  if (liveDialog?.open) renderLiveDetail();
});
function moveLivePhoto(delta) {
  const product = shopifyLiveProducts.find(item => item.id === liveSelectedId);
  if (!product) return;
  const variant = selectedLiveVariant(product);
  const count = product.photos.length + (variant.image && !product.photos.some(photo => photo.url === variant.image.url) ? 1 : 0);
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
  const legacyPages = {coleccion:'sofacamas.html',salas:'salas.html','sillas-auxiliares':'sillas-auxiliares.html',camas:'camas.html',nosotros:'nosotros.html',guia:'sofacamas.html#guia',inspiracion:'blog/index.html',blog:'blog/index.html'};
  const destination = legacyPages[window.location.hash.slice(1)];
  if(destination) window.location.replace(siteUrl(destination));
}
