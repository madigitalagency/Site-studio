/** Mise en forme minimale des textes de coulisses : paragraphes et **gras**.
 *  Les textes viennent de nos fichiers de contenu, pas de l'extérieur. */
export function marked(src: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return src
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      // « **L'idée.** texte » devient un titre de temps + paragraphe (bloc Coulisses en trois temps)
      const m = p.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
      if (m) return `<div><h3>${esc(m[1])}</h3><p>${esc(m[2]).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p></div>`;
      return `<p>${esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`;
    })
    .join('');
}
