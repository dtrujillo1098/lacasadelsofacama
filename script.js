const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');
const form = document.querySelector('.contact-form');
const note = document.querySelector('.form-note');

menu?.addEventListener('click', () => {
  const isOpen = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!isOpen));
  nav.classList.toggle('is-open', !isOpen);
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menu?.setAttribute('aria-expanded', 'false');
  nav?.classList.remove('is-open');
}));

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const name = data.get('name');
  note.textContent = `Gracias, ${name}. Recibimos tu mensaje y te contactaremos muy pronto.`;
  form.reset();
});
