(() => {
  const phone = '573208442629';
  const message = 'Hola, quiero más información sobre los productos de La Casa del Sofacama.';
  const link = document.createElement('a');
  link.className = 'whatsapp-float';
  link.href = 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', 'Escríbenos por WhatsApp');
  link.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.18 1.6 6L4 28l7.17-1.88a12 12 0 0 0 4.87 1.02h.01C22.68 27.14 28 21.74 28 15.1A12.03 12.03 0 0 0 16.04 3Zm0 21.9h-.01a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.73.98 1-3.64-.24-.37a9.87 9.87 0 0 1-1.52-5.25c0-5.46 4.45-9.9 9.92-9.9a9.9 9.9 0 0 1 9.9 9.91c0 5.46-4.45 9.86-9.92 9.86Zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.88.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35Z"/></svg><span>Escríbenos</span>';
  document.body.appendChild(link);
})();
