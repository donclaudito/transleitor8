import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, ScanLine, History as HistoryIcon, ClipboardCopy, Printer, Bot } from 'lucide-react';
import FindingDetailModal from '@/components/security/FindingDetailModal';
import SecurityAgentChat from '@/components/security/SecurityAgentChat';
import ScanHistoryModal from '@/components/security/ScanHistoryModal';
import {
  SEVERITY_RANK, STATUS_RANK, SEVERITY_LABELS, SEVERITY_STYLES, STATUS_LABELS,
  VECTOR_LABELS, buildReportMarkdown,
} from '@/lib/securityConstants';

// Painel administrativo de Segurança: varredura automática, achados com trilha de
// auditoria, histórico de execuções e exportação do relatório (Markdown / PDF).
export default function Seguranca() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const { data: me, isLoading: loadingMe } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const isAdmin = me?.role === 'admin';

  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['security-findings'],
    queryFn: () => base44.entities.SecurityFinding.list('-created_date', 200),
    enabled: isAdmin,
  });
  const { data: runs = [] } = useQuery({
    queryKey: ['security-scanruns'],
    queryFn: () => base44.entities.SecurityScanRun.list('-created_date', 50),
    enabled: isAdmin,
  });
  const { data: logs = [] } = useQuery({
    queryKey: ['security-auditlogs'],
    queryFn: () => base44.entities.SecurityAuditLog.list('-created_date', 300),
    enabled: isAdmin,
  });

  const userName = me?.full_name || me?.email || '—';
  const refresh = () => {
    ['security-findings', 'security-auditlogs', 'security-findings-header'].forEach(k =>
      queryClient.invalidateQueries({ queryKey: [k] }));
  };

  const runScan = async () => {
    setScanning(true);
    try {
      const res = await base44.functions.invoke('securityScan', {});
      if (res.data?.error) throw new Error(res.data.error);
      setScanResult(res.data);
      refresh();
      queryClient.invalidateQueries({ queryKey: ['security-scanruns'] });
    } catch (e) {
      alert('Erro na varredura: ' + (e?.response?.data?.error || e.message || 'erro desconhecido'));
    }
    setScanning(false);
  };

  const onSetStatus = async (finding, newStatus, action, note) => {
    try {
      await base44.entities.SecurityFinding.update(finding.id, { status: newStatus });
      await base44.entities.SecurityAuditLog.create({
        finding_id: finding.id, finding_title: finding.title, action,
        old_status: finding.status, new_status: newStatus, user_name: userName, note: note || '',
      });
      refresh();
      setSelectedFinding(prev => (prev?.id === finding.id ? { ...prev, status: newStatus } : prev));
    } catch (e) {
      alert('Erro ao atualizar o achado: ' + (e?.response?.data?.error || e.message));
    }
  };

  const handleFix = (f) => {
    if (window.confirm('Deseja corrigir este achado? Ele será movido para "Em revisão" com registro na trilha de auditoria.')) {
      onSetStatus(f, 'revisao', 'revisao', 'Corrigir? — movido para revisão');
    }
  };

  const handleFalsePositive = (f) => {
    if (window.confirm('Marcar este achado como falso positivo?')) {
      onSetStatus(f, 'falso_positivo', 'falso_positivo', '');
    }
  };

  const handleDelete = async (f) => {
    if (!window.confirm('Excluir este achado? A ação fica registrada na trilha de auditoria.')) return;
    try {
      await base44.entities.SecurityAuditLog.create({
        finding_id: f.id, finding_title: f.title, action: 'excluido',
        old_status: f.status, new_status: '', user_name: userName, note: '',
      });
      await base44.entities.SecurityFinding.delete(f.id);
      refresh();
      setSelectedFinding(null);
    } catch (e) {
      alert('Erro ao excluir: ' + (e?.response?.data?.error || e.message));
    }
  };

  const exportReport = async () => {
    try {
      await navigator.clipboard.writeText(buildReportMarkdown(sortedFindings, runs));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Não foi possível copiar o relatório.');
    }
  };

  const printReport = () => {
    const md = buildReportMarkdown(sortedFindings, runs);
    const w = window.open('', '_blank');
    if (!w) { alert('Permita pop-ups para gerar o PDF.'); return; }
    const escaped = md.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    w.document.write('<html><head><title>Relatório de Segurança</title></head><body style="font-family: Arial, sans-serif;"><pre style="white-space: pre-wrap; font-size: 12px;">' + escaped + '</pre></body></html>');
    w.document.close();
    w.focus();
    w.print();
  };

  const sortedFindings = [...findings].sort((a, b) =>
    (SEVERITY_RANK[a.severity] ?? 9) - (SEVERITY_RANK[b.severity] ?? 9) ||
    (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9));

  if (loadingMe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="glass-card rounded-2xl p-6 text-center max-w-sm">
          <ShieldAlert className="w-8 h-8 text-destructive mx-auto mb-2" />
          <p className="text-sm font-bold">Acesso restrito</p>
          <p className="text-xs text-muted-foreground mt-1">Esta área é exclusiva para administradores.</p>
        </div>
      </div>
    );
  }

  const openCount = findings.filter(f => f.status === 'aberto' || f.status === 'revisao').length;
  const stats = [
    { label: 'Total', value: findings.length, color: 'text-foreground' },
    { label: 'Abertos', value: openCount, color: 'text-red-500' },
    { label: 'Críticos', value: findings.filter(f => f.severity === 'critica').length, color: 'text-red-500' },
    { label: 'Altos', value: findings.filter(f => f.severity === 'alta').length, color: 'text-orange-500' },
    { label: 'Red Team', value: findings.filter(f => f.vector === 'red').length, color: 'text-red-400' },
    { label: 'Blue Team', value: findings.filter(f => f.vector === 'blue').length, color: 'text-sky-400' },
    { label: 'Corrigidos', value: findings.filter(f => f.status === 'corrigido').length, color: 'text-emerald-500' },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-primary" />
          </span>
          <div>
            <h1 className="text-base font-extrabold">Segurança</h1>
            <p className="text-xs text-muted-foreground">Varredura, achados e trilha de auditoria</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={runScan} disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all">
            <ScanLine className={`w-3.5 h-3.5 ${scanning ? 'animate-pulse' : ''}`} />
            {scanning ? 'Varrendo...' : 'Executar Varredura'}
          </button>
          <button onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <HistoryIcon className="w-3.5 h-3.5" /> Histórico
          </button>
          <button onClick={() => setShowAgent(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <Bot className="w-3.5 h-3.5" /> Agente
          </button>
          <button onClick={exportReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <ClipboardCopy className="w-3.5 h-3.5" /> {copied ? 'Copiado!' : 'Relatório'}
          </button>
          <button onClick={printReport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-accent hover:text-foreground transition-all">
            <Printer className="w-3.5 h-3.5" /> PDF
          </button>
        </div>
      </div>

      {scanResult && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3 text-xs">
          <span className="font-bold">Última varredura:</span>{' '}
          {scanResult.summary?.total ?? 0} achado(s) verificado(s), {scanResult.novos ?? 0} novo(s)
          {scanResult.summary?.criticos ? ` — ${scanResult.summary.criticos} crítico(s) 🚨` : ''}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-xl p-3 text-center">
            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {loadingFindings ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : sortedFindings.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <ShieldAlert className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-bold">Nenhum achado registrado</p>
            <p className="text-xs text-muted-foreground mt-1">Execute a varredura para analisar o app.</p>
          </div>
        ) : (
          sortedFindings.map(f => (
            <div key={f.id} className="glass-card rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <button onClick={() => setSelectedFinding(f)} className="text-left flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_STYLES[f.severity] || ''}`}>
                      {SEVERITY_LABELS[f.severity] || f.severity}
                    </span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{VECTOR_LABELS[f.vector] || ''}</span>
                    <span className="text-[10px] text-muted-foreground">· {STATUS_LABELS[f.status] || f.status}</span>
                  </div>
                  <p className="text-xs font-bold mt-1">{f.title}</p>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{f.evidence}</p>
                </button>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {f.status === 'aberto' && (
                    <button onClick={() => handleFix(f)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 transition-all">
                      Corrigir?
                    </button>
                  )}
                  {(f.status === 'aberto' || f.status === 'revisao') && (
                    <button onClick={() => onSetStatus(f, 'corrigido', 'corrigido', '')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/25 hover:bg-emerald-500/20 transition-all">
                      Marcar corrigido
                    </button>
                  )}
                  {(f.status === 'aberto' || f.status === 'revisao') && (
                    <button onClick={() => handleFalsePositive(f)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted text-muted-foreground border border-border hover:bg-accent transition-all">
                      Falso positivo
                    </button>
                  )}
                  {(f.status === 'corrigido' || f.status === 'falso_positivo') && (
                    <button onClick={() => onSetStatus(f, 'aberto', 'reaberto', '')}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 hover:bg-amber-500/20 transition-all">
                      Reabrir
                    </button>
                  )}
                  <button onClick={() => handleDelete(f)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive/20 transition-all">
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedFinding && (
        <FindingDetailModal finding={selectedFinding} logs={logs}
          onClose={() => setSelectedFinding(null)}
          onSetStatus={onSetStatus} onDelete={handleDelete} />
      )}
      {showHistory && <ScanHistoryModal runs={runs} onClose={() => setShowHistory(false)} />}

      {showAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAgent(false)} />
          <div className="relative w-full max-w-2xl h-[85vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-extrabold flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> Agente de Segurança
              </h2>
              <button onClick={() => setShowAgent(false)} className="p-1 rounded-lg hover:bg-accent text-muted-foreground">×</button>
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <SecurityAgentChat />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}