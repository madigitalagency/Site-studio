// Filtres du catalogue : sans JavaScript, toutes les cartes sont visibles et les filtres sont cachés.
const bloc = document.querySelector<HTMLElement>('[data-filtres]');
if (bloc) {
  bloc.hidden = false;
  const cases = [...bloc.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')];
  const pieces = [...document.querySelectorAll<HTMLElement>('[data-piece]')];
  const compte = document.querySelector<HTMLElement>('[data-filtres-compte]');
  const vide = document.querySelector<HTMLElement>('[data-filtres-vide]');
  const reset = bloc.querySelector<HTMLButtonElement>('[data-filtres-reset]');
  const appliquer = () => {
    const actifs: Record<string, string[]> = {};
    for (const c of cases) if (c.checked) (actifs[c.name] ??= []).push(c.value);
    let n = 0;
    for (const p of pieces) {
      const ok = Object.entries(actifs).every(([cle, valeurs]) => {
        const v = (p.dataset[cle] ?? '').split(' ');
        return valeurs.some((x) => v.includes(x));
      });
      p.hidden = !ok;
      if (ok) n++;
    }
    if (compte) compte.textContent = String(n);
    if (vide) vide.hidden = n > 0;
  };
  for (const c of cases) c.addEventListener('change', appliquer);
  reset?.addEventListener('click', () => { for (const c of cases) c.checked = false; appliquer(); });
}
