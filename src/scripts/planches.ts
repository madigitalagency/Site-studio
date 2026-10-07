// Lecteur de planches : défilement horizontal avec accroche (CSS), boutons et clavier (JS), compteur.
// Sans JavaScript, la piste se fait défiler au doigt ou à la molette, et le texte des bulles reste lisible.
for (const bloc of document.querySelectorAll<HTMLElement>('[data-planches]')) {
  const piste = bloc.querySelector<HTMLElement>('[data-piste]');
  const nav = bloc.querySelector<HTMLElement>('[data-nav]');
  const prev = bloc.querySelector<HTMLButtonElement>('[data-prev]');
  const next = bloc.querySelector<HTMLButtonElement>('[data-next]');
  const compteur = bloc.querySelector<HTMLElement>('[data-compteur]');
  if (!piste || !nav || !prev || !next || !compteur) continue;
  const items = [...piste.querySelectorAll<HTMLElement>('[data-planche]')];
  const n = items.length;
  nav.hidden = false;
  let courant = 0;
  const aller = (i: number) => {
    courant = Math.max(0, Math.min(n - 1, i));
    items[courant].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };
  const maj = () => {
    const centre = piste.scrollLeft + piste.clientWidth / 2;
    let best = 0, dist = Infinity;
    items.forEach((it, i) => { const c = it.offsetLeft + it.offsetWidth / 2; const d = Math.abs(c - centre); if (d < dist) { dist = d; best = i; } });
    courant = best;
    compteur.textContent = `${courant + 1} / ${n}`;
    prev.disabled = courant === 0;
    next.disabled = courant === n - 1;
  };
  prev.addEventListener('click', () => aller(courant - 1));
  next.addEventListener('click', () => aller(courant + 1));
  piste.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); aller(courant + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); aller(courant - 1); }
    if (e.key === 'Home') { e.preventDefault(); aller(0); }
    if (e.key === 'End') { e.preventDefault(); aller(n - 1); }
  });
  let t: number | undefined;
  piste.addEventListener('scroll', () => { window.clearTimeout(t); t = window.setTimeout(maj, 80); }, { passive: true });
  maj();
}
