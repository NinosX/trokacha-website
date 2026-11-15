'use client';

// lib/pro/shared/printDocument.ts
// =============================================================================
// Imprimer un document du pro depuis le bureau : la page HTML (déjà échappée
// par le cœur partagé) va dans un cadre caché (`srcdoc`, même origine, aucune
// fenêtre qui s'ouvre), puis la boîte d'impression du navigateur, où le pro
// choisit son imprimante ou « Enregistrer au format PDF ». Le cadre part après.
// =============================================================================

const FRAME_ID = 'trk-pro-print-frame';

export function printDocumentHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    document.getElementById(FRAME_ID)?.remove();
    const frame = document.createElement('iframe');
    frame.id = FRAME_ID;
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;';
    let done = false;
    const cleanup = () => window.setTimeout(() => frame.remove(), 1000);
    frame.onload = () => {
      if (done) return;
      done = true;
      const win = frame.contentWindow;
      if (!win) {
        frame.remove();
        reject(new Error('print-frame'));
        return;
      }
      win.addEventListener('afterprint', cleanup, { once: true });
      try {
        win.focus();
        win.print();
        resolve();
      } catch (e) {
        frame.remove();
        reject(e);
      }
      // Navigateurs sans `afterprint` : le cadre part quand même.
      window.setTimeout(() => frame.remove(), 120000);
    };
    frame.srcdoc = html;
    document.body.appendChild(frame);
  });
}
