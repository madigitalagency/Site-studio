// Menu sur téléphone : ouvert/fermé. Sans JavaScript, le menu est visible en entier.
const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
if (toggle && nav) {
  const mq = window.matchMedia('(max-width: 920px)');
  const apply = () => {
    if (mq.matches) {
      nav.hidden = toggle.getAttribute('aria-expanded') !== 'true';
    } else {
      nav.hidden = false;
    }
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    apply();
  });
  mq.addEventListener('change', apply);
  apply();
}
