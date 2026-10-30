const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  nav.classList.toggle('is-open', open);
});
nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Abrir menú');
  nav.classList.remove('is-open');
}));
const search = document.querySelector('#search');
let category = 'all';
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function filterProducts() {
  let count = 0;
  const query = normalize(search.value.trim());
  document.querySelectorAll('.product-card').forEach(card => {
    const visible = (category === 'all' || card.dataset.category === category) && normalize(card.dataset.name).includes(query);
    card.hidden = !visible;
    if (visible) count++;
  });
  document.querySelector('#empty-results').hidden = count > 0;
  document.querySelector('#result-count').textContent = `${count} ${count === 1 ? 'modelo' : 'modelos'}`;
}
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  filterProducts();
}));
search.addEventListener('input', filterProducts);
document.querySelector('#search-toggle').addEventListener('click', () => {
  document.querySelector('#coleccion').scrollIntoView();
  search.focus({ preventScroll: true });
});
const detail = document.querySelector('#product-dialog');
function openDialog(dialog) { dialog.showModal(); document.body.classList.add('modal-open'); }
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
  const card = document.querySelectorAll('.product-card')[productIndex];
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
  const card = document.querySelectorAll('.product-card')[i];
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
const cart = document.querySelector('#cart-dialog');
document.querySelector('#cart-toggle').addEventListener('click', () => openDialog(cart));
document.querySelector('#back-to-catalog').addEventListener('click', () => detail.close());
document.querySelector('#cart-explore').addEventListener('click', () => {
  cart.close(); document.querySelector('#coleccion').scrollIntoView();
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
});

// Carousel rotates every 3.5 seconds; manual controls restart the interval.
const slides = Array.from(document.querySelectorAll('.hero-slide'));
const slideButtons = Array.from(document.querySelectorAll('[data-slide]'));
const captions = ['SALA PRINCIPAL', 'APARTAMENTO COMPACTO', 'HABITACIÓN DE INVITADOS'];
let activeSlide = 0;
function showSlide(index) {
  activeSlide = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => { slide.hidden = i !== activeSlide; });
  slideButtons.forEach((button, i) => {
    if (i === activeSlide) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  document.querySelector('#banner-caption').textContent = captions[activeSlide];
  document.querySelector('#banner-count').textContent = `${String(activeSlide + 1).padStart(2, '0')} / 03`;
}
slideButtons.forEach(button => button.addEventListener('click', () => showSlide(Number(button.dataset.slide))));
document.querySelector('#banner-prev').addEventListener('click', () => showSlide(activeSlide - 1));
document.querySelector('#banner-next').addEventListener('click', () => showSlide(activeSlide + 1));
document.querySelector('[data-banner-filter]').addEventListener('click', () => {
  search.value = '';
  document.querySelector('[data-filter="compacto"]').click();
});

let bannerTimer;
function startBannerRotation() {
  clearInterval(bannerTimer);
  if (!document.hidden) {
    bannerTimer = setInterval(() => showSlide(activeSlide + 1), 3500);
  }
}
document.querySelectorAll('[data-slide], #banner-prev, #banner-next').forEach(button => {
  button.addEventListener('click', startBannerRotation);
});
document.addEventListener('visibilitychange', startBannerRotation);
startBannerRotation();
