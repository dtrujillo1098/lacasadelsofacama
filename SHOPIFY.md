# Catálogo de Shopify

El sitio consulta Storefront API 2026-07 con un token público en shopify-live.js.
Nunca se debe introducir un token privado o de Admin API en archivos del sitio.

Consulta al abrir la página, cada 30 segundos mientras está visible, al volver
a la pestaña y al recuperar la conexión. No es una conexión instantánea por
webhooks. Los productos deben estar publicados en el canal Headless asociado
al token. Un producto activo sin publicación en ese canal no será visible.

Los títulos, descripciones, fotos, variantes, precios y disponibilidad se leen
directamente de Shopify. Las altas y retiradas también se reflejan. La categoría
de navegación se determina por el tipo de producto o sus etiquetas: sofacama,
sala/sofá, silla/poltrona y cama/cabecero. Las etiquetas compacto, amplio y color
alimentan los filtros de sofacamas. Productos de otras categorías no se muestran.

Los archivos catalog.js, new-lines.js y precios.json quedan como material
anterior; el catálogo visible y la búsqueda ya no utilizan sus datos.
El botón de cada variante disponible abre el carrito de Shopify.

Si falla una consulta se conserva la última consulta en memoria, se muestra un
aviso y se desactivan los enlaces de compra hasta la siguiente consulta correcta.
No se almacena un catálogo persistente en el navegador.

Cada producto admite hasta 100 imágenes y 250 variantes en esta implementación.
Si se supera el límite de variantes se rechaza la actualización completa para
evitar mostrar un catálogo parcial. Los productos se paginan automáticamente.

Verificación: consulta real de los 24 productos; validación GraphQL; pruebas de
DOM con catálogo real y respuestas simuladas para altas, cambios, retiradas,
variantes, detalles, desconexión y catálogo vacío. Estas pruebas no sustituyen
una revisión visual en navegador tras la publicación.
