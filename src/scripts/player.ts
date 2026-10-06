// Bascule 9:16 / 16:9 du lecteur quand les deux versions existent. Sans JavaScript : la version par défaut seule.
for (const player of document.querySelectorAll<HTMLElement>('[data-player]')) {
  const video = player.querySelector<HTMLVideoElement>('video');
  const frame = player.querySelector<HTMLElement>('.player__frame');
  const sw = player.querySelector<HTMLElement>('[data-switch]');
  if (!video || !frame || !sw) continue;
  sw.hidden = false;
  const boutons = [...sw.querySelectorAll<HTMLButtonElement>('button')];
  for (const b of boutons) {
    b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      const o = b.dataset.orientation!;
      const l1080 = b.dataset.l1080!, l720 = b.dataset.l720!, poster = b.dataset.poster!;
      const t = video.currentTime, playing = !video.paused;
      video.pause();
      video.innerHTML = `<source src="${l1080}" type="video/mp4" media="(min-width: 700px)"><source src="${l720}" type="video/mp4">`;
      video.poster = poster;
      video.load();
      frame.classList.toggle('player__frame--wide', o === '16:9');
      video.currentTime = t;
      if (playing) video.play().catch(() => {});
      for (const x of boutons) x.setAttribute('aria-pressed', String(x === b));
    });
  }
}
