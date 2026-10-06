// Recherche dans le Lexique : filtre les notions au fil de la frappe. Sans JavaScript, toute la liste est visible.
const champ = document.querySelector<HTMLInputElement>('[data-lex-filtre]');
if (champ) {
  champ.hidden = false;
  const items = [...document.querySelectorAll<HTMLElement>('[data-lex-item]')];
  const familles = [...document.querySelectorAll<HTMLElement>('[data-lex-famille]')];
  const vide = document.querySelector<HTMLElement>('[data-lex-vide]');
  const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  champ.addEventListener('input', () => {
    const q = normaliser(champ.value.trim());
    let n = 0;
    for (const it of items) {
      const ok = !q || normaliser(it.dataset.texte ?? '').includes(q);
      it.hidden = !ok;
      if (ok) n++;
    }
    for (const f of familles) f.hidden = !f.querySelector('[data-lex-item]:not([hidden])');
    if (vide) vide.hidden = n > 0;
  });
}
