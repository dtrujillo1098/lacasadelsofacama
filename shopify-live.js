// Public Storefront access only. Never use an Admin/private token here.
const shopifyStore = 'xxwsyt-j3.myshopify.com';
const storefrontPublicToken = '1358b690d0a770c83182224058f1dc9e';
const shopifyVariants = {};
let shopifyPrices = {};
let shopifyLiveProducts = [];
let shopifyCatalogLoaded = false;
let shopifySyncing = false;
let shopifyFresh = false;
const liveCatalogQuery = "query LiveCatalog($after: String) {\n products(first: 100, after: $after) {\n  nodes { id handle title description productType tags\n   images(first: 100) { nodes { url altText } }\n   variants(first: 250) { nodes { id sku title availableForSale price { amount currencyCode } image { url altText } selectedOptions { name value } } pageInfo { hasNextPage } }\n  }\n  pageInfo { hasNextPage endCursor }\n }\n}";
function shopifyLine(product) {
  const value = (product.productType + ' ' + product.tags.join(' ')).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/sofa.?cama/.test(value)) return 'sofacamas';
  if (/silla|poltrona/.test(value)) return 'sillas-auxiliares';
  if (/sala|sofa/.test(value)) return 'salas';
  if (/cama|cabecero/.test(value)) return 'camas';
  return null;
}
const shopifyLineNames = {sofacamas:'Sofacamas', salas:'Salas', 'sillas-auxiliares':'Sillas auxiliares', camas:'Camas'};
function shopifyStatus(message) {
  let status = document.querySelector('#shopify-sync-status');
  if (!status) {
    const host = document.querySelector('.catalog-toolbar, .line-search-toolbar');
    if (!host) return;
    status = document.createElement('p');
    status.id = 'shopify-sync-status';
    status.setAttribute('role', 'status');
    host.after(status);
  }
  status.textContent = message;
}
function applyPrice(container) {
  const label = container.querySelector('.product-price, .line-meta strong');
  const price = shopifyPrices[container.dataset.sku];
  if (label) label.textContent = price ? new Intl.NumberFormat('es-CO', {style:'currency', currency:price.currencyCode, maximumFractionDigits:2}).format(Number(price.amount)) + ' ' + price.currencyCode : 'Consultar precio';
}
function updateBuyButton(container, sku, before) {
  if (!container) return;
  container.dataset.sku = sku;
  applyPrice(container);
  let link = container.querySelector('.buy-link');
  const variant = shopifyVariants[sku];
  if (!shopifyFresh || !variant || !variant.availableForSale) {
    link?.remove();
    if (variant && !variant.availableForSale) {
      const label = container.querySelector('.product-price, .line-meta strong');
      if (label) label.textContent += ' · Agotado';
    }
    return;
  }
  if (!link) {
    link = document.createElement('a');
    link.className = 'button buy-link';
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Agregar al carrito ↗';
    const anchor = before && container.querySelector(before);
    if (anchor) anchor.before(link); else container.append(link);
  }
  link.href = 'https://' + shopifyStore + '/cart/' + variant.id.split('/').pop() + ':1';
}
async function fetchShopifyCatalog() {
  const catalog = [];
  let after = null;
  do {
    const response = await fetch('https://' + shopifyStore + '/api/2026-07/graphql.json', {
      method:'POST', cache:'no-store', signal:AbortSignal.timeout(15000),
      headers:{'Content-Type':'application/json', 'X-Shopify-Storefront-Access-Token':storefrontPublicToken},
      body:JSON.stringify({query:liveCatalogQuery, variables:{after}})
    });
    if (!response.ok) throw new Error('Shopify HTTP ' + response.status);
    const result = await response.json();
    if (result.errors?.length || !result.data?.products) throw new Error('Catálogo no disponible');
    const page = result.data.products;
    if (page.nodes.some(product => product.variants.pageInfo.hasNextPage)) throw new Error('Demasiadas variantes para sincronizar');
    catalog.push(...page.nodes);
    if (page.pageInfo.hasNextPage && (!page.pageInfo.endCursor || page.pageInfo.endCursor === after)) throw new Error('Paginación inválida');
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return catalog;
}
async function syncShopifyCatalog() {
  if (shopifySyncing || document.hidden) return;
  shopifySyncing = true;
  try {
    const catalog = await fetchShopifyCatalog();
    const nextVariants = {}, nextPrices = {};
    const nextProducts = catalog.map(product => {
      const line = shopifyLine(product);
      const id = line === 'sofacamas' ? product.handle.replace(/^sofa-cama-/, '') : product.handle;
      const variants = product.variants.nodes.map(variant => {
        const key = 'variant-' + variant.id.split('/').pop();
        nextVariants[key] = variant;
        nextPrices[key] = variant.price;
        return {...variant, key};
      });
      return {...product, line, lineName:shopifyLineNames[line], localId:id,
        variants, photos:product.images.nodes, image:product.images.nodes[0]?.url || null};
    }).filter(product => product.line && product.variants.length);
    Object.keys(shopifyVariants).forEach(key => delete shopifyVariants[key]);
    Object.assign(shopifyVariants, nextVariants);
    shopifyPrices = nextPrices;
    shopifyLiveProducts = nextProducts;
    shopifyCatalogLoaded = true;
    shopifyFresh = true;
    window.dispatchEvent(new Event('shopify:updated'));
    shopifyStatus('Catálogo actualizado desde Shopify.');
  } catch (error) {
    shopifyFresh = false;
    shopifyStatus(shopifyCatalogLoaded
      ? 'No pudimos actualizar. Mostramos la última consulta; reintentaremos automáticamente.'
      : 'No pudimos cargar el catálogo. Reintentaremos automáticamente.');
    document.querySelectorAll('.buy-link').forEach(link => link.remove());
  } finally { shopifySyncing = false; }
}
shopifyStatus('Cargando catálogo de Shopify…');
syncShopifyCatalog();
setInterval(syncShopifyCatalog, 30000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) syncShopifyCatalog(); });
window.addEventListener('online', syncShopifyCatalog);

