const siteBase = document.body.dataset.siteBase || './';
const siteUrl = value => siteBase + value.replace(/^\.\//, '');
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
const allSearchProducts = [
  ...products.map(product => ({id:product.id,name:product.name,type:'Sofacama',category:'Sofacamas',file:'sofacamas.html',image:product.photos[0].src,terms:[product.name,'sofacama sofá cama sofacamas',product.color,...product.fabrics.map(f=>f.name+' '+f.color)].join(' ')})),
  ...newLineProducts.map(product => ({...product,category:product.lineName,file:product.line+'.html',terms:[product.name,product.type,product.color,product.lineName].join(' ')}))
];
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
    const note = document.createElement('span'); note.textContent = 'Modelo provisional · Ver detalles';
    copy.append(label,name,note); link.append(image,copy); globalSearchResults.appendChild(link);
  });
}
function openSearch() { closeMenu(); openDialog(searchDialog); renderGlobalSearch(); globalSearchInput.focus(); }
document.querySelectorAll('#search-toggle, #utility-search, #mobile-menu-search').forEach(button => button.addEventListener('click', openSearch));
globalSearchInput?.addEventListener('input', renderGlobalSearch);
document.querySelector('#global-search-form')?.addEventListener('submit', event => { event.preventDefault(); renderGlobalSearch(); });
const requestedProduct = new URLSearchParams(window.location.search).get('producto');

const sofaGrid = document.querySelector('#products');
const detail = document.querySelector('#product-dialog');
if(sofaGrid && detail) {
  const search = document.querySelector('#search');
  let category = 'all';
  function filterProducts() {
    let count = 0; const query = normalize(search.value.trim());
    sofaGrid.querySelectorAll('.product-card').forEach(card => { card.hidden = !((category === 'all' || card.dataset.category === category) && normalize(card.dataset.name).includes(query)); if(!card.hidden) count++; });
    document.querySelector('#empty-results').hidden = count > 0;
    document.querySelector('#empty-results').textContent = 'No encontramos ese sofacama. Prueba otro nombre o selecciona “Ver todos”.';
    document.querySelector('#result-count').textContent = count + ' sofacamas';
  }
  search.addEventListener('input',filterProducts);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click',()=>{category=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(other=>{const active=other===button;other.classList.toggle('active',active);other.setAttribute('aria-pressed',String(active));});filterProducts();}));
let selectedProduct = null;
let selectedProductIndex = -1;
let selectedPhoto = 0;
const fabricSelections = products.map(() => 0);
const detailImage = document.querySelector('#detail-image');
const thumbs = document.querySelector('#photo-thumbnails');
const detailFabricOptions = document.querySelector('#detail-fabric-options');
function chosenFabric(index) { return products[index].fabrics[fabricSelections[index]]; }
function showProductPhoto(index) {
  if (!selectedProduct) return;
  selectedPhoto = (index + selectedProduct.photos.length) % selectedProduct.photos.length;
  const fabric = chosenFabric(selectedProductIndex);
  const photo = selectedProduct.photos[selectedPhoto];
  detailImage.src = selectedPhoto === 0 ? fabric.image : photo.src;
  detailImage.alt = selectedPhoto === 0 ? 'Sofá cama ' + selectedProduct.name + ', ' + fabric.name + ', color ' + fabric.color : photo.alt;
  document.querySelector('#photo-caption').textContent = (selectedPhoto + 1) + ' / 4 · ' + photo.label + (selectedPhoto === 0 ? ' · ' + fabric.color : ' · Acabado original: ' + selectedProduct.color);
  thumbs.querySelectorAll('button').forEach((button,i) => button.setAttribute('aria-pressed', String(i === selectedPhoto)));
}
function updateFabricButtons(productIndex) {
  document.querySelectorAll('[data-fabric-product="' + productIndex + '"]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.fabricIndex) === fabricSelections[productIndex]));
  });
}
function selectFabric(productIndex, fabricIndex) {
  fabricSelections[productIndex] = fabricIndex;
  const product = products[productIndex];
  const fabric = chosenFabric(productIndex);
  const card = document.querySelectorAll('#products .product-card')[productIndex];
  const cardImage = card.querySelector('.product-image img');
  cardImage.src = fabric.image;
  cardImage.alt = 'Sofá cama ' + product.name + ', ' + fabric.name + ', color ' + fabric.color;
  card.querySelector('.fabric-selected').textContent = fabric.name + ' · ' + fabric.color;
  card.querySelector('.product-meta span').textContent = fabric.color;
  updateFabricButtons(productIndex);
  if(selectedProductIndex === productIndex) {
    document.querySelector('#detail-color').textContent = 'Tela elegida: ' + fabric.name + ' · ' + fabric.color;
    thumbs.querySelector('img').src = fabric.image;
    showProductPhoto(0);
  }
}
function bindFabricButtons(container) {
  container.querySelectorAll('[data-fabric-product]').forEach(button => button.addEventListener('click', () => {
    selectFabric(Number(button.dataset.fabricProduct), Number(button.dataset.fabricIndex));
  }));
}
bindFabricButtons(document.querySelector('#products'));
products.forEach((product,i) => {
  const card = document.querySelectorAll('#products .product-card')[i];
  card.dataset.name += ' ' + product.fabrics.map(f=>f.name + ' ' + f.color).join(' ');
});
document.querySelectorAll('[data-product]').forEach(button => button.addEventListener('click', () => {
  selectedProductIndex = Number(button.dataset.product);
  selectedProduct = products[selectedProductIndex];
  const fabric = chosenFabric(selectedProductIndex);
  document.querySelector('#detail-title').textContent = 'Sofá cama ' + selectedProduct.name;
  document.querySelector('#detail-description').textContent = selectedProduct.description;
  document.querySelector('#detail-color').textContent = 'Tela elegida: ' + fabric.name + ' · ' + fabric.color;
  detailFabricOptions.replaceChildren();
  const label = document.createElement('p');
  label.className = 'fabric-label';
  label.textContent = 'Elige tela y color';
  const group = document.createElement('div');
  group.className = 'fabric-choices';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Tela y color de ' + selectedProduct.name);
  selectedProduct.fabrics.forEach((option,i) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'fabric-choice';
    swatch.dataset.fabricProduct = selectedProductIndex;
    swatch.dataset.fabricIndex = i;
    swatch.style.setProperty('--swatch', option.hex);
    swatch.setAttribute('aria-label', option.name + ', ' + option.color);
    swatch.title = option.name + ' · ' + option.color;
    swatch.appendChild(document.createElement('span'));
    group.appendChild(swatch);
  });
  detailFabricOptions.append(label,group);
  bindFabricButtons(detailFabricOptions);
  updateFabricButtons(selectedProductIndex);
  thumbs.replaceChildren();
  selectedProduct.photos.forEach((photo,i) => {
    const thumb = document.createElement('button');
    thumb.type = 'button';
    thumb.setAttribute('aria-label', 'Ver ' + photo.label.toLowerCase());
    const image = document.createElement('img');
    image.src = i === 0 ? fabric.image : photo.src;
    image.alt = '';
    image.width = 100;
    image.height = 100;
    thumb.appendChild(image);
    thumb.addEventListener('click', () => showProductPhoto(i));
    thumbs.appendChild(thumb);
  });
  showProductPhoto(0);
  openDialog(detail);
  detail.scrollTop = 0;
}));
document.querySelector('#photo-prev').addEventListener('click', () => showProductPhoto(selectedPhoto - 1));
document.querySelector('#photo-next').addEventListener('click', () => showProductPhoto(selectedPhoto + 1));
detail.addEventListener('keydown', event => {
  if(event.target.closest('.fabric-choices')) return;
  if(event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    showProductPhoto(selectedPhoto + (event.key === 'ArrowLeft' ? -1 : 1));
  }
});

  document.querySelector('#back-to-catalog').addEventListener('click',()=>detail.close());
  if(requestedProduct) { const index = products.findIndex(product=>product.id===requestedProduct); if(index>=0) document.querySelector('[data-product="'+index+'"]').click(); }
}


const lineDialog = document.querySelector('#line-dialog');
if(lineDialog) {
  function openLineProduct(id) {
    const item = newLineProducts.find(product => product.id === id);
    if(!item || !document.querySelector('[data-line-product="'+id+'"]')) return;
    document.querySelector('#line-detail-title').textContent = item.name;
    document.querySelector('#line-detail-category').textContent = item.lineName + ' · ' + item.type;
    document.querySelector('#line-detail-description').textContent = item.description;
    document.querySelector('#line-detail-color').textContent = 'Color de referencia: ' + item.color;
    const image = document.querySelector('#line-detail-image'); image.src = siteUrl(item.image); image.alt = item.name + ', ' + item.color;
    openDialog(lineDialog); lineDialog.scrollTop = 0;
  }
  document.querySelectorAll('[data-line-product]').forEach(button => button.addEventListener('click', () => openLineProduct(button.dataset.lineProduct)));
  document.querySelector('#line-detail-close').addEventListener('click', () => lineDialog.close());
  if(requestedProduct) openLineProduct(requestedProduct);
}
const lineSearch = document.querySelector('#line-search');
if(lineSearch) lineSearch.addEventListener('input', () => {
  const query = normalize(lineSearch.value.trim()); let count = 0;
  document.querySelectorAll('.line-product').forEach(card => { card.hidden = !normalize(card.dataset.lineName).includes(query); if(!card.hidden) count++; });
  document.querySelector('#line-search-status').textContent = count + (count === 1 ? ' modelo' : ' modelos');
  document.querySelector('#line-empty').hidden = count > 0;
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
