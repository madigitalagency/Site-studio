// Comparateur avant / après : sans JavaScript, les deux images sont côte à côte.
// Avec, un curseur (souris, doigt, clavier) découvre l'image « après ».
for (const el of document.querySelectorAll<HTMLElement>('[data-compare]')) {
  const range = el.querySelector<HTMLInputElement>('.compare__range');
  const handle = el.querySelector<HTMLElement>('.compare__handle');
  const pair = el.querySelector<HTMLElement>('.compare__pair');
  if (!range || !handle || !pair) continue;
  el.classList.add('is-js');
  range.hidden = false;
  handle.hidden = false;
  const set = (v: number) => pair.style.setProperty('--cut', `${v}%`);
  set(Number(range.value));
  range.addEventListener('input', () => set(Number(range.value)));
}
