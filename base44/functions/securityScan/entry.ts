import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Varredura automática de segurança (somente admin):
// 1) Provedores de IA (LLMConfig): chave deve vir de variável de ambiente; URL deve usar TLS.
// 2) Links do app (AppLink): URLs devem usar https.
// Grava achados em SecurityFinding (sem duplicar abertos/em revisão), trilha em
// SecurityAuditLog e um registro da execução em SecurityScanRun.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const t0 = Date.now();
    const auditor = user.full_name || user.email || 'admin';
    const detected = [];

    // 1) Provedores de IA
    const providers = await base44.entities.LLMConfig.list();
    for (const p of providers) {
      const envVar = (p.api_key_env_var || '').trim();
      if (!envVar) {
        detected.push({
          title: 'Provedor de IA "' + p.provider_name + '" sem variável de ambiente para a chave de API',
          severity: p.is_active ? 'critica' : 'alta',
          category: 'configuracao',
          vector: 'red',
          evidence: 'LLMConfig "' + p.provider_name + '" (modelo ' + p.model_name + ') não define api_key_env_var' + (p.is_active ? ' e está ATIVO' : '') + '.',
          fix: 'Guarde a chave em uma variável de ambiente (dashboard de segredos) e informe o NOME dela em api_key_env_var — nunca a chave em si.'
        });
      } else if (envVar.length > 60 || /\s/.test(envVar)) {
        detected.push({
          title: 'Provedor de IA "' + p.provider_name + '" parece ter a chave gravada em vez do nome da variável',
          severity: 'critica',
          category: 'exposicao',
          vector: 'red',
          evidence: 'api_key_env_var de "' + p.provider_name + '" tem formato de segredo (muito longo ou com espaços).',
          fix: 'Substitua pelo NOME da variável de ambiente e remova o valor do cadastro.'
        });
      }
      const apiUrl = (p.api_url || '').toLowerCase();
      if (apiUrl && !apiUrl.startsWith('https://')) {
        detected.push({
          title: 'Provedor de IA "' + p.provider_name + '" com URL sem TLS (http)',
          severity: 'alta',
          category: 'criptografia',
          vector: 'blue',
          evidence: 'api_url = ' + p.api_url,
          fix: 'Use https:// — chamadas em http expõem a chave em trânsito.'
        });
      }
    }

    // 2) Links do app
    const links = await base44.entities.AppLink.list();
    for (const l of links) {
      const linkUrl = (l.url || '').toLowerCase();
      if (linkUrl.startsWith('http://')) {
        detected.push({
          title: 'Link "' + l.nome + '" com URL sem TLS (http)',
          severity: 'media',
          category: 'criptografia',
          vector: 'blue',
          evidence: 'url = ' + l.url,
          fix: 'Troque a URL do link para https://.'
        });
      }
    }

    // Deduplicação: não recria achado aberto/em revisão com o mesmo título.
    const existing = await base44.entities.SecurityFinding.list();
    const openTitles = new Set(existing.filter(f => f.status === 'aberto' || f.status === 'revisao').map(f => f.title));
    const created = [];
    for (const f of detected) {
      if (openTitles.has(f.title)) continue;
      const rec = await base44.entities.SecurityFinding.create({
        title: f.title, severity: f.severity, category: f.category,
        vector: f.vector, evidence: f.evidence, fix: f.fix, status: 'aberto'
      });
      created.push(rec);
      await base44.entities.SecurityAuditLog.create({
        finding_id: rec.id, finding_title: rec.title, action: 'criado',
        old_status: '', new_status: 'aberto', user_name: auditor,
        note: 'Varredura automática'
      });
    }

    // Alerta por e-mail ao admin quando a varredura registra achado crítico (best-effort).
    const criticosCriados = created.filter(rec => rec.severity === 'critica');
    let alertaEmail = false;
    if (criticosCriados.length > 0) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: user.email,
          subject: '🚨 Transleitor — ' + criticosCriados.length + ' achado(s) crítico(s) na varredura de segurança',
          body: '<p>A varredura automática de segurança encontrou <strong>' + criticosCriados.length +
            ' achado(s) de severidade crítica</strong>:</p><ul>' +
            criticosCriados.map(c => '<li>' + c.title + '</li>').join('') +
            '</ul><p>Acesse o painel de Segurança para revisar as evidências e as correções recomendadas.</p>'
        });
        alertaEmail = true;
      } catch { /* falha de e-mail nunca quebra a varredura */ }
    }

    const summary = {
      total: detected.length,
      novos: created.length,
      criticos: detected.filter(f => f.severity === 'critica').length,
      altos: detected.filter(f => f.severity === 'alta').length,
      red: detected.filter(f => f.vector === 'red').length,
      blue: detected.filter(f => f.vector === 'blue').length
    };
    const run = await base44.entities.SecurityScanRun.create({
      total_findings: detected.length,
      new_findings: created.length,
      duration_ms: Date.now() - t0,
      summary: { criticos: summary.criticos, altos: summary.altos, red: summary.red, blue: summary.blue }
    });
    return Response.json({ summary, novos: created.length, scan_run_id: run.id, alerta_email: alertaEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}