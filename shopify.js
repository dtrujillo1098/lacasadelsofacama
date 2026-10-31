// Conexión con la tienda Shopify. Cambia shopifyEnabled a true cuando los
// productos tengan precio real y estén activos en Shopify.
const shopifyStore = 'xxwsyt-j3.myshopify.com';
const shopifyEnabled = true || new URLSearchParams(window.location.search).get('shopify') === '1';
const shopifyVariants = {
  'sofacama-brisa-original': '67848184955014', 'sofacama-brisa-lino': '67848184987782', 'sofacama-brisa-terciopelo': '67848185020550', 'sofacama-brisa-chenilla': '67848185053318',
  'sofacama-olivo-original': '67848189739142', 'sofacama-olivo-lino': '67848189771910', 'sofacama-olivo-terciopelo': '67848189804678', 'sofacama-olivo-chenilla': '67848189837446',
  'sofacama-terracota-original': '67848189870214', 'sofacama-terracota-lino': '67848189902982', 'sofacama-terracota-terciopelo': '67848189935750', 'sofacama-terracota-chenilla': '67848189968518',
  'sofacama-nordico-original': '67848191344774', 'sofacama-nordico-lino': '67848191377542', 'sofacama-nordico-terciopelo': '67848191410310', 'sofacama-nordico-chenilla': '67848191443078',
  'sofacama-bahia-original': '67848194392198', 'sofacama-bahia-lino': '67848194424966', 'sofacama-bahia-terciopelo': '67848194457734', 'sofacama-bahia-chenilla': '67848194490502',
  'sofacama-luna-original': '67848194523270', 'sofacama-luna-lino': '67848194556038', 'sofacama-luna-terciopelo': '67848194588806', 'sofacama-luna-chenilla': '67848194621574',
  'sofacama-nube-original': '67848194719878', 'sofacama-nube-lino': '67848194752646', 'sofacama-nube-terciopelo': '67848194785414', 'sofacama-nube-chenilla': '67848194818182',
  'sofacama-moka-original': '67848194850950', 'sofacama-moka-lino': '67848194883718', 'sofacama-moka-terciopelo': '67848194916486', 'sofacama-moka-chenilla': '67848194949254',
  'sofacama-rio-original': '67848194982022', 'sofacama-rio-lino': '67848195014790', 'sofacama-rio-terciopelo': '67848195047558', 'sofacama-rio-chenilla': '67848195080326',
  'sofacama-duna-original': '67848197636230', 'sofacama-duna-lino': '67848197668998', 'sofacama-duna-terciopelo': '67848197701766', 'sofacama-duna-chenilla': '67848197734534',
  'sofacama-bosque-original': '67848198455430', 'sofacama-bosque-lino': '67848198488198', 'sofacama-bosque-terciopelo': '67848198520966', 'sofacama-bosque-chenilla': '67848198553734',
  'sofacama-aurora-original': '67848198586502', 'sofacama-aurora-lino': '67848198619270', 'sofacama-aurora-terciopelo': '67848198652038', 'sofacama-aurora-chenilla': '67848198684806',
  'sofacama-origen-original': '67848198750342', 'sofacama-origen-lino': '67848198783110', 'sofacama-origen-terciopelo': '67848198815878', 'sofacama-origen-chenilla': '67848198848646',
  'sofacama-miel-original': '67848198914182', 'sofacama-miel-lino': '67848198946950', 'sofacama-miel-terciopelo': '67848198979718', 'sofacama-miel-chenilla': '67848199012486',
  'sofacama-alba-original': '67848201797766', 'sofacama-alba-lino': '67848201830534', 'sofacama-alba-terciopelo': '67848201863302', 'sofacama-alba-chenilla': '67848201896070',
  'sala-siena': '67848202911878', 'sala-verona': '67848202944646', 'sala-toscana': '67848202977414',
  'silla-aura': '67848203042950', 'silla-nara': '67848203108486', 'silla-vega': '67848203141254',
  'cama-serena': '67848203174022', 'cama-cala': '67848203960454', 'cama-noche': '67848203993222'
};
// Los precios viven en precios.json, que se sincroniza desde el admin de Shopify.
let shopifyPrices = {};
const priceSelector = '.product-price, .line-meta strong';
function applyPrice(container) {
  const label = container.querySelector(priceSelector);
  const price = shopifyPrices[container.dataset.sku];
  if(label && price !== undefined) label.textContent = '$' + Number(price).toLocaleString('es-CO') + ' COP';
}
fetch('./precios.json').then(response => response.json()).then(prices => {
  shopifyPrices = prices;
  document.querySelectorAll('[data-sku]').forEach(applyPrice);
}).catch(() => {});
// Agrega o actualiza el botón "Agregar al carrito" de un producto: agrega la
// variante al carrito de Shopify y abre el carrito. `before` es el selector del
// elemento antes del cual se inserta; sin él, el botón va al final del contenedor.
function updateBuyButton(container, sku, before) {
  if(!container) return;
  container.dataset.sku = sku;
  applyPrice(container);
  let link = container.querySelector('.buy-link');
  const variant = shopifyVariants[sku];
  if(!shopifyEnabled || !variant) { link?.remove(); return; }
  if(!link) {
    link = document.createElement('a');
    link.className = 'button buy-link';
    link.target = '_blank';
    link.rel = 'noopener';
    link.innerHTML = 'Agregar al carrito <span>↗</span>';
    const anchor = before && container.querySelector(before);
    if(anchor) anchor.before(link); else container.append(link);
  }
  link.href = 'https://' + shopifyStore + '/cart/' + variant + ':1';
}
