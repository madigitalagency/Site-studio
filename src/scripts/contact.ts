// Formulaire de contact : préremplissage depuis ?piece=, horodatage anti-robot, envoi en arrière-plan.
// Sans JavaScript, le formulaire s'envoie normalement et nginx/n8n redirigent vers la page de remerciement.
const form = document.querySelector<HTMLFormElement>('[data-contact]');
if (form) {
  const piece = form.querySelector<HTMLInputElement>('[data-piece]');
  const horodatage = form.querySelector<HTMLInputElement>('[data-horodatage]');
  const etat = form.querySelector<HTMLElement>('[data-etat]');
  const p = new URLSearchParams(location.search).get('piece');
  if (piece && p) piece.value = p.slice(0, 80);
  if (horodatage) horodatage.value = String(Date.now());
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const bouton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    if (bouton) bouton.disabled = true;
    try {
      const rep = await fetch(form.action, { method: 'POST', body: new URLSearchParams(new FormData(form) as any), headers: { Accept: 'application/json' } });
      if (!rep.ok) throw new Error(String(rep.status));
      form.reset();
      if (etat) { etat.hidden = false; etat.textContent = form.dataset.merci ?? document.documentElement.lang === 'en' ? 'Thank you. Your message has been sent; we reply within two working days.' : 'Merci. Votre message est envoyé ; nous répondons sous deux jours ouvrés.'; }
    } catch {
      if (etat) { etat.hidden = false; etat.textContent = document.documentElement.lang === 'en' ? 'The message could not be sent. Write to contact@madigitalagency.net instead.' : 'Le message n’a pas pu partir. Écrivez directement à contact@madigitalagency.net.'; }
    } finally {
      if (bouton) bouton.disabled = false;
    }
  });
}
