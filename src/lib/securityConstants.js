// Rótulos, estilos e relatório do módulo de Segurança — compartilhados entre página e modais.

export const SEVERITY_RANK = { critica: 0, alta: 1, media: 2, baixa: 3 };
export const STATUS_RANK = { aberto: 0, revisao: 1, corrigido: 2, falso_positivo: 2 };

export const SEVERITY_LABELS = { critica: '🚨 Crítica', alta: '⚠️ Alta', media: '🟡 Média', baixa: '🔵 Baixa' };
export const SEVERITY_STYLES = {
  critica: 'bg-red-500/15 text-red-500 border-red-500/30',
  alta: 'bg-orange-500/15 text-orange-500 border-orange-500/30',
  media: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
  baixa: 'bg-sky-500/15 text-sky-500 border-sky-500/30',
};
export const STATUS_LABELS = { aberto: 'Aberto', revisao: 'Em revisão', corrigido: 'Corrigido', falso_positivo: 'Falso positivo' };
export const VECTOR_LABELS = { red: '🎯 Red Team', blue: '🛡️ Blue Team' };

export function buildReportMarkdown(findings = [], runs = []) {
  const date = new Date().toLocaleString('pt-BR');
  const open = findings.filter(f => f.status === 'aberto' || f.status === 'revisao');
  const lines = [
    '# Relatório de Segurança — Transleitor',
    '',
    `Gerado em ${date}`,
    '',
    '## Resumo',
    `- Achados registrados: ${findings.length}`,
    `- Abertos / em revisão: ${open.length}`,
    `- Críticos: ${findings.filter(f => f.severity === 'critica').length}`,
    `- Altos: ${findings.filter(f => f.severity === 'alta').length}`,
    `- Red Team: ${findings.filter(f => f.vector === 'red').length}`,
    `- Blue Team: ${findings.filter(f => f.vector === 'blue').length}`,
    `- Corrigidos: ${findings.filter(f => f.status === 'corrigido').length}`,
    '',
    '## Achados',
  ];
  findings.forEach(f => {
    lines.push(
      '',
      `### [${(f.severity || '').toUpperCase()}] ${f.title}`,
      `- Vector: ${f.vector === 'red' ? 'Red Team' : 'Blue Team'}`,
      `- Categoria: ${f.category || '—'}`,
      `- Status: ${STATUS_LABELS[f.status] || f.status || '—'}`,
      `- Evidência: ${f.evidence || '—'}`,
      `- Correção: ${f.fix || '—'}`
    );
  });
  lines.push('', '## Histórico de varreduras');
  runs.forEach(r => {
    const d = r.created_date ? new Date(r.created_date).toLocaleString('pt-BR') : '—';
    lines.push(`- ${d} — ${r.total_findings ?? 0} achado(s), ${r.new_findings ?? 0} novo(s), ${((r.duration_ms ?? 0) / 1000).toFixed(1)}s`);
  });
  if (runs.length === 0) lines.push('- Nenhuma varredura registrada');
  return lines.join('\n');
}