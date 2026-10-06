// Au survol d'une carte, l'affiche laisse place au teaser muet de 6 s.
// Rien si l'utilisateur préfère moins de mouvement, ou sur écran tactile.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hover = window.matchMedia('(hover: hover)').matches;
if (!reduce && hover) {
  for (const poster of document.querySelectorAll<HTMLElement>('[data-teaser]')) {
    const src = poster.dataset.teaser;
    if (!src) continue;
    let video: HTMLVideoElement | undefined;
    poster.closest('[data-card]')?.addEventListener('mouseenter', () => {
      if (!video) {
        video = document.createElement('video');
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none';
        video.setAttribute('aria-hidden', 'true');
        video.src = src;
        poster.appendChild(video);
      }
      video.play().then(() => video!.classList.add('is-playing')).catch(() => {});
    });
    poster.closest('[data-card]')?.addEventListener('mouseleave', () => {
      if (!video) return;
      video.pause();
      video.classList.remove('is-playing');
    });
  }
}
