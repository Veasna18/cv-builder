const safeName = (t) => (t || 'resume').replace(/[\\/:*?"<>|]+/g, '').trim().slice(0, 80) || 'resume';

/** One-click download: renders #resume-paper to an A4 PDF file. */
export async function downloadPdf(title) {
  const paper = document.getElementById('resume-paper');
  if (!paper) throw new Error('The preview is not ready yet.');
  const { default: html2pdf } = await import('html2pdf.js');
  if (document.fonts?.ready) await document.fonts.ready;

  await html2pdf()
    .set({
      margin: 0,
      filename: `${safeName(title)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], avoid: '.avoid-break' },
    })
    .from(paper)
    .save();
}

/** Browser print dialog → "Save as PDF". Keeps text selectable (better for ATS parsers). */
export function printResume() {
  const paper = document.getElementById('resume-paper');
  if (!paper) return;

  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((n) => n.outerHTML).join('');
  const doc = iframe.contentDocument;
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8">${styles}
     <style>@page{size:A4;margin:0} body{margin:0;background:#fff} .no-export{display:none!important}
     *{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
     </head><body>${paper.outerHTML}</body></html>`
  );
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  }, 500);
}
