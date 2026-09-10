// Impressão em leiaute de PDF moderno: o documento é montado num iframe
// isolado (A4, cabeçalho com marca e data, tipografia limpa, rodapé) —
// totalmente independente do CSS da tela, que era o que deixava a
// impressão desalinhada e "mediana".

const escapar = (s = '') => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

// Texto puro -> parágrafos HTML (preserva quebras de linha).
export const textoParaHtml = (texto = '') =>
  texto
    .split(/\n{2,}/)
    .filter((p) => p.trim())
    .map((p) => `<p>${escapar(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');

const dataHoje = () =>
  new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

// corpoHtml entra como está (HTML de confiança gerado pelo app);
// textos puros devem passar por textoParaHtml antes.
export function imprimirDocumento({ titulo, subtitulo = '', corpoHtml, marca = 'Transleitor' }) {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escapar(titulo)}</title>
<style>
  @page { size: A4; margin: 18mm 17mm 16mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #111827; font-size: 10.5pt; line-height: 1.6;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cabecalho {
    display: flex; justify-content: space-between; align-items: baseline;
    padding-bottom: 6px; margin-bottom: 22px;
    border-bottom: 2px solid #111827;
  }
  .marca { font-size: 9pt; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #111827; }
  .data { font-size: 8.5pt; color: #6b7280; }
  h1 { font-size: 14.5pt; margin: 0 0 4px; line-height: 1.3; }
  .subtitulo { font-size: 9.5pt; color: #4b5563; margin: 0 0 20px; }
  .conteudo p { margin: 7px 0; text-align: justify; }
  .conteudo h2 {
    font-size: 11.5pt; margin: 16px 0 6px; padding-bottom: 3px;
    border-bottom: 1px solid #d1d5db;
  }
  .conteudo h2:first-child { margin-top: 0; }
  .conteudo strong { font-weight: 700; }
  .conteudo ul, .conteudo ol { margin: 7px 0 7px 18px; padding: 0; }
  .conteudo li { margin: 3px 0; }
  .conteudo code {
    font-family: Consolas, Menlo, monospace; font-size: 9.5pt;
    background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 3px;
    padding: 2px 8px; display: inline-block; margin: 4px 0;
  }
  .conteudo table { border-collapse: collapse; width: 100%; margin: 8px 0; }
  .conteudo th, .conteudo td { border: 1px solid #d1d5db; padding: 4px 8px; font-size: 9.5pt; text-align: left; }
  .conteudo th { background: #f3f4f6; }
  .receita { font-family: Consolas, Menlo, monospace; font-size: 9.5pt; white-space: pre-wrap; }
  .rodape {
    margin-top: 26px; padding-top: 6px;
    border-top: 1px solid #e5e7eb;
    font-size: 8pt; color: #9ca3af;
    display: flex; justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="cabecalho">
    <span class="marca">${escapar(marca)}</span>
    <span class="data">${dataHoje()}</span>
  </div>
  <h1>${escapar(titulo)}</h1>
  ${subtitulo ? `<p class="subtitulo">${escapar(subtitulo)}</p>` : ''}
  <div class="conteudo">${corpoHtml}</div>
  <div class="rodape">
    <span>Documento gerado eletronicamente pelo ${escapar(marca)}</span>
    <span>${dataHoje()}</span>
  </div>
</body>
</html>`;

  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 1000);
    }, 200);
  };
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}