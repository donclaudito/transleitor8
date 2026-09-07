import React, { useState } from 'react';
import { Activity, Wand2, Settings2, FlaskConical, User, Cpu } from 'lucide-react';
import SymptomsPanel from './SymptomsPanel';
import ComorbidityPopover from './ComorbidityPopover';
import GastroPanel from './GastroPanel';
import CirurgiaPanel from './CirurgiaPanel';
import UTIPanel from './UTIPanel';
import PSPanel from './PSPanel';
import EmergenciaPanel from './EmergenciaPanel';
import IdCaptureButton from './IdCaptureButton';
import ConsultasPrevias from './ConsultasPrevias';
import PhraseSelector from './PhraseSelector';

const GASTRO_QUICK_COMORBS = ['HAS', 'DM2', 'Dislipidemia', 'Tabagismo', 'DRC', 'ICC', 'DPOC', 'Obesidade', 'Alergia', 'Hepatopatia', 'Diabetes Gestacional', 'Etilismo', 'Hipotireoidismo', 'Retocolite Ulcerativa', 'HIV'];

export default function FormView({
  formData, setFormData, allSectors, allComorbidities, setView,
  toggleComorbidityInForm, generateSOAP, loading, customChips = [], theme = 'dark',
  llmProviders = [], selectedLLMId = '', setSelectedLLMId = () => {},
  activeComorbidity = null, onCloseComorbidity = () => {}, onAddToPrescription = () => {},
  evolutionMode = 'free', setEvolutionMode = () => {},
}) {
  const [sectorError, setSectorError] = useState(false);
  const [showPrevias, setShowPrevias] = useState(false);
  const handleGenerate = () => {
    if (!formData.sector) { setSectorError(true); return; }
    generateSOAP();
  };
  const appendToClinical = (item) => {
    setFormData(prev => {
      const current = prev.clinicalDescription.trimEnd();
      // Se já termina com vírgula/ponto ou está vazio, adiciona adequadamente
      if (!current) return { ...prev, clinicalDescription: item };
      const lastChar = current.slice(-1);
      const separator = ['.', ';', '\n'].includes(lastChar) ? ' ' : ', ';
      return { ...prev, clinicalDescription: current + separator + item };
    });
  };
  const appendToPrescription = (item) => {
    setFormData(prev => {
      const current = prev.prescription.trimEnd();
      if (!current) return { ...prev, prescription: item };
      const lastChar = current.slice(-1);
      const separator = ['.', ';', '\n'].includes(lastChar) ? ' ' : ', ';
      return { ...prev, prescription: current + separator + item };
    });
  };
  const normalizedSector = (formData.sector || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const isGastro = normalizedSector.includes('gastro');
  const isConsultorio = normalizedSector.trim() === 'consultorio' || isGastro;
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const existingComorbSet = new Set(allComorbidities.map(norm));
  const gastroQuickComorbs = GASTRO_QUICK_COMORBS.filter(c => !existingComorbSet.has(norm(c)));
  const isCirurgia = (formData.sector?.toLowerCase() || '').includes('cirúrg') || (formData.sector?.toLowerCase() || '').includes('cirurg');
  const isUTI = ['uti adulto', 'uti', 'intensiva'].includes((formData.sector || '').toLowerCase().trim());
  const isPS = ['pronto socorro', 'ps', 'pronto-socorro'].includes((formData.sector || '').toLowerCase().trim());
  const isEmergencia = ['emergência', 'emergencia', 'sala de avaliação', 'sala de avaliacao', 'fast-track', 'fast track'].includes((formData.sector || '').toLowerCase().trim());

  return (
    <>
    <SymptomsPanel onAppend={appendToClinical} clinicalDescription={formData.clinicalDescription} />
    {isConsultorio && <GastroPanel onAppend={appendToClinical} />}
    {isCirurgia && <CirurgiaPanel onAppend={appendToClinical} />}
    {isUTI && <UTIPanel onAppend={appendToClinical} />}
    {isPS && <PSPanel onAppend={appendToClinical} />}
    {isEmergencia && <EmergenciaPanel onAppend={appendToClinical} />}
    {activeComorbidity && (
      <ComorbidityPopover
        comorbidityName={activeComorbidity.comorbidity_name}
        medications={activeComorbidity.medications}
        onAddToPrescription={(text) => onAddToPrescription(text)}
        onAddAll={(text) => { onAddToPrescription(text); onCloseComorbidity(); }}
        onClose={onCloseComorbidity}
      />
    )}
    <div className="space-y-6 p-4 md:p-6">
      {/* Identificação */}
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Identificação
          </h3>
          <IdCaptureButton
            onExtract={({ primeiro_nome, leito }) => setFormData(prev => ({
              ...prev,
              patientInitials: primeiro_nome || prev.patientInitials,
              bed: leito || prev.bed,
            }))}
          />
        </div>
        <div className="flex gap-3">
          <select
            value={formData.sector}
            onChange={e => { setFormData({ ...formData, sector: e.target.value, consultorioType: null }); setSectorError(false); }}
            className={`flex-1 px-4 py-3 rounded-xl bg-muted border text-sm focus:outline-none transition-all ${sectorError ? 'border-red-500' : 'border-border focus:border-primary/50'}`}
          >
            <option value="">Setor / Unidade...</option>
            {allSectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setView('manage-sectors')} className="px-3 rounded-xl border border-border text-primary hover:bg-accent transition-colors">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
        {sectorError && <p className="text-red-500 text-xs">Setor obrigatório</p>}

        {isConsultorio && (
          <div className="flex gap-2">
            <button onClick={() => setFormData({ ...formData, consultorioType: 'primeira_vez', previousConsult: '' })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${formData.consultorioType === 'primeira_vez' ? 'bg-blue-500/20 border-blue-400/60 text-blue-400' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>
              🆕 1ª Consulta
            </button>
            <button onClick={() => setFormData({ ...formData, consultorioType: 'retorno' })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${formData.consultorioType === 'retorno' ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-400' : 'border-border text-muted-foreground hover:border-muted-foreground/40'}`}>
              🔄 Retorno
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Leito / Sala" value={formData.bed} onChange={e => setFormData({ ...formData, bed: e.target.value })}
            className="px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
          <input placeholder="Iniciais Pac." value={formData.patientInitials} onChange={e => setFormData({ ...formData, patientInitials: e.target.value })}
            className="px-4 py-3 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all" />
        </div>
      </div>

      {isConsultorio && formData.consultorioType === 'retorno' && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">📋 Consulta Anterior</label>
            {isGastro && (
              <button onClick={() => setShowPrevias(true)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-border text-primary hover:bg-accent transition-all">
                Consultas Prévias
              </button>
            )}
          </div>
          <textarea rows={3} placeholder="Cole a consulta anterior para comparação..."
            value={formData.previousConsult || ''} onChange={e => setFormData({ ...formData, previousConsult: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
          {isGastro && showPrevias && (
            <ConsultasPrevias
              patientInitials={formData.patientInitials}
              onSelect={(text) => { setFormData({ ...formData, previousConsult: text }); setShowPrevias(false); }}
              onClose={() => setShowPrevias(false)}
            />
          )}
        </div>
      )}

      {/* Comorbidades */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Comorbidades</h3>
          <button onClick={() => setView('manage-comorbidities')} className="text-xs text-primary font-semibold hover:underline">Gerenciar</button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allComorbidities.map(c => {
            const selected = formData.comorbidities.split(',').map(s => s.trim()).includes(c);
            return (
              <button key={c} onClick={() => toggleComorbidityInForm(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selected ? 'bg-primary/15 border-primary/30 text-primary' : 'border-border text-muted-foreground hover:border-primary/20'}`}>
                {c}
              </button>
            );
          })}
          {customChips.map(c => {
            const selected = formData.comorbidities.split(',').map(s => s.trim()).includes(c);
            return (
              <button key={c} onClick={() => toggleComorbidityInForm(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selected ? 'bg-accent border-accent-foreground/20 text-accent-foreground' : 'border-border text-muted-foreground hover:border-accent-foreground/20'}`}>
                {c}
              </button>
            );
          })}
          {isGastro && gastroQuickComorbs.length > 0 && (
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-[11px] text-muted-foreground">Comorbidades frequentes (gastro):</p>
              <div className="flex flex-wrap gap-2">
                {gastroQuickComorbs.map(c => {
                  const selected = formData.comorbidities.split(',').map(s => s.trim()).includes(c);
                  return (
                    <button key={c} onClick={() => toggleComorbidityInForm(c)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selected ? 'bg-teal-500/15 border-teal-500/30 text-teal-500' : 'border-border text-muted-foreground hover:border-teal-500/30'}`}>
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {!isGastro && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>📋</span> Evoluções Médicas Anteriores
          </h3>
          <p className="text-[11px] text-muted-foreground -mt-1">Cole TODAS as evoluções médicas anteriores para a IA analisar a progressão de forma cronológica.</p>
          <textarea rows={4} placeholder="Cole aqui a evolução médica anterior..."
            value={formData.previousEvolution || ''} onChange={e => setFormData({ ...formData, previousEvolution: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
        </div>
      )}

      {!isGastro && (
        <div className="glass-card rounded-2xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <span>🩺</span> Evolução de Enfermagem
          </h3>
          <p className="text-[11px] text-muted-foreground -mt-1">Cole as anotações de enfermagem para enriquecer o contexto clínico.</p>
          <textarea rows={4} placeholder="Cole aqui a evolução de enfermagem..."
            value={formData.nursingEvolution || ''} onChange={e => setFormData({ ...formData, nursingEvolution: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
        </div>
      )}

      {/* Frases pré-definidas */}
      <PhraseSelector onInsert={{ clinical: appendToClinical, prescription: appendToPrescription }} />

      {/* Descrição Clínica */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" /> Descrição Clínica Atual
        </h3>
        <textarea rows={6} placeholder="Descreva o quadro clínico livremente..."
          value={formData.clinicalDescription} onChange={e => setFormData({ ...formData, clinicalDescription: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
      </div>

      {/* Exames */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5" /> Exames Complementares
        </h3>
        <p className="text-[11px] text-muted-foreground -mt-1">Cole todos os exames (dias anteriores + atuais) para a IA analisar a evolução cronológica dos valores.</p>
        <textarea rows={3} placeholder="Resultados de exames laboratoriais e de imagem (dias anteriores + atuais)..."
          value={formData.labs} onChange={e => setFormData({ ...formData, labs: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
      </div>

      {/* Prescrição */}
      <div className="glass-card rounded-2xl p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span>💊</span> Prescrição Atual
        </h3>
        <p className="text-[11px] text-muted-foreground -mt-1">Cole a prescrição vigente do paciente para a IA integrar ao contexto.</p>
        <textarea rows={4} placeholder="Cole aqui a prescrição atual..."
          value={formData.prescription || ''} onChange={e => setFormData({ ...formData, prescription: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-sm resize-none focus:outline-none focus:border-primary/50 transition-all" />
      </div>

      {/* Seletor de IA (visível quando há provedores cadastrados) */}
      {llmProviders.length > 0 && (
        <div className="glass-card rounded-2xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5" /> Modelo de IA
          </h3>
          <select
            value={selectedLLMId}
            onChange={e => setSelectedLLMId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 transition-all"
          >
            <option value="">Padrão (Gemini Flash)</option>
            {llmProviders.map(p => (
              <option key={p.id} value={p.id}>{p.provider_name} — {p.model_name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Modo de Evolução */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          <button
            onClick={() => setEvolutionMode('soap')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${evolutionMode === 'soap' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            📋 SOAP
          </button>
          <button
            onClick={() => setEvolutionMode('free')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${evolutionMode === 'free' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            📝 Livre
          </button>
          <button
            onClick={() => setEvolutionMode('simple')}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${evolutionMode === 'simple' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
          >
            ⚡ Simples
          </button>
        </div>
      </div>

      {/* Gerar */}
      <button onClick={handleGenerate} disabled={loading || !formData.clinicalDescription}
        className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg btn-press ${
          loading
            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40'
        }`}>
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-amber-500/40 border-t-amber-500 rounded-full animate-spin" />
            Gerando evolução...
          </>
        ) : (
          <><Wand2 className="w-4 h-4" /> Gerar Evolução {evolutionMode === 'soap' ? 'SOAP' : evolutionMode === 'simple' ? 'Simples' : 'Livre'}</>
        )}
      </button>
    </div>
    </>
  );
}