import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/transleitor/Header';
import FormView from '@/components/transleitor/FormView';
import ResultView from '@/components/transleitor/ResultView';
import HistoryView from '@/components/transleitor/HistoryView';
import ManagementView from '@/components/transleitor/ManagementView';
import SettingsPanel from '@/components/transleitor/SettingsPanel';
import { useSettings } from '@/hooks/useSettings';
import ReactMarkdown from 'react-markdown';

const DEFAULT_SECTORS = ["UTI Adulto", "UTI Pediátrica", "Enfermaria Clínica", "Enfermaria Cirúrgica", "Pronto Socorro", "Consultório"];
const DEFAULT_COMORBIDITIES = ["HAS", "DM2", "Dislipidemia", "Tabagismo", "DRC", "ICC", "DPOC", "Obesidade"];

const DEFAULT_FORM = {
  sector: '', bed: '', patientInitials: '', comorbidities: '', labs: '', clinicalDescription: '',
  consultorioType: null, previousConsult: '', previousEvolution: '', nursingEvolution: '',
};

export default function Transleitor() {
  const [view, setView] = useState('form');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentSOAP, setCurrentSOAP] = useState(null);
  const [newSectorName, setNewSectorName] = useState('');
  const [newComorbidityName, setNewComorbidityName] = useState('');
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const { settings, setTheme, addCustomChip, removeCustomChip } = useSettings();
  const queryClient = useQueryClient();

  const { data: evolutions = [] } = useQuery({
    queryKey: ['evolutions'],
    queryFn: () => base44.entities.Evolution.list('-created_date', 50),
  });

  const { data: customSectors = [] } = useQuery({
    queryKey: ['sectors'],
    queryFn: () => base44.entities.Sector.list(),
  });

  const { data: customComorbidities = [] } = useQuery({
    queryKey: ['comorbidities'],
    queryFn: () => base44.entities.Comorbidity.list(),
  });

  const { data: llmProviders = [] } = useQuery({
    queryKey: ['llm-configs'],
    queryFn: () => base44.entities.LLMConfig.filter({ is_active: true }, 'provider_name', 20),
  });

  const [selectedLLMId, setSelectedLLMId] = useState('');

  const activeLLMName = selectedLLMId
    ? llmProviders.find(p => p.id === selectedLLMId)?.provider_name || 'Desconhecido'
    : 'Gemini Flash';

  const allSectors = [...new Set([...DEFAULT_SECTORS, ...customSectors.map(s => s.name)])];
  const allComorbidities = [...new Set([...DEFAULT_COMORBIDITIES, ...customComorbidities.map(c => c.name)])];

  const createEvolutionMutation = useMutation({
    mutationFn: (data) => base44.entities.Evolution.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evolutions'] }),
  });

  const addSectorMutation = useMutation({
    mutationFn: (data) => base44.entities.Sector.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sectors'] }),
  });

  const deleteSectorMutation = useMutation({
    mutationFn: (id) => base44.entities.Sector.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sectors'] }),
  });

  const addComorbidityMutation = useMutation({
    mutationFn: (data) => base44.entities.Comorbidity.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comorbidities'] }),
  });

  const deleteComorbidityMutation = useMutation({
    mutationFn: (id) => base44.entities.Comorbidity.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comorbidities'] }),
  });

  const deleteEvolutionMutation = useMutation({
    mutationFn: (id) => base44.entities.Evolution.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evolutions'] }),
  });

  const toggleComorbidityInForm = useCallback((name) => {
    const current = formData.comorbidities.split(',').map(s => s.trim()).filter(s => s !== '');
    if (current.includes(name)) {
      setFormData(prev => ({ ...prev, comorbidities: current.filter(s => s !== name).join(', ') }));
    } else {
      setFormData(prev => ({ ...prev, comorbidities: [...current, name].join(', ') }));
    }
  }, [formData.comorbidities]);

  const handleAddSector = async (e) => {
    e.preventDefault();
    if (!newSectorName.trim()) return;
    await addSectorMutation.mutateAsync({ name: newSectorName.trim() });
    setNewSectorName('');
  };

  const handleAddComorbidity = async (e) => {
    e.preventDefault();
    if (!newComorbidityName.trim()) return;
    await addComorbidityMutation.mutateAsync({ name: newComorbidityName.trim() });
    setNewComorbidityName('');
  };

  const getSectorHint = (sector) => {
    const s = (sector || '').toLowerCase();
    if (s.includes('pronto') || s.includes('ps')) return 'Setor PS: foco em exclusão de diagnósticos fatais.';
    if (s.includes('uti') || s.includes('intensiva')) return 'Setor UTI: estruture o Plano por sistemas.';
    if (s.includes('enfermaria')) return 'Setor Enfermaria: foco em evolução longitudinal e planejamento de alta.';
    return '';
  };

  const simulateStream = (fullText, onChunk, onDone) => {
    const words = fullText.split(' ');
    let i = 0, accumulated = '';
    const tick = () => {
      if (i >= words.length) { onDone(accumulated); return; }
      const slice = words.slice(i, i + 4).join(' ');
      accumulated += (accumulated ? ' ' : '') + slice;
      i += 4;
      onChunk(accumulated);
      setTimeout(tick, 18);
    };
    tick();
  };

  const generateSOAP = async () => {
    if (!formData.clinicalDescription) return;
    setLoading(true);
    setStreamingText('');
    setCurrentSOAP(null);

    const sectorHint = getSectorHint(formData.sector);
    const isConsultorio = ['consultório', 'consultorio'].includes(formData.sector?.toLowerCase());
    const consultorioLine = isConsultorio && formData.consultorioType
      ? `Contexto: consulta ambulatorial (${formData.consultorioType === 'retorno' ? 'retorno' : 'primeira consulta'}).${formData.consultorioType === 'retorno' && formData.previousConsult?.trim() ? `\nConsulta anterior:\n${formData.previousConsult.trim()}` : ''}`
      : '';

    const prompt = `Você é um assistente médico especialista em documentação clínica brasileira.
Gere uma evolução SOAP em Markdown, técnica, precisa, pronta para prontuário. NÃO invente dados. Comece diretamente com ## S — Subjetivo.
${sectorHint ? `\nFoco de setor: ${sectorHint}` : ''}${consultorioLine ? `\n${consultorioLine}` : ''}

Dados do paciente:
- Paciente: ${formData.patientInitials || '—'}
- Leito: ${formData.bed || '—'} | Setor: ${formData.sector || '—'}
- Comorbidades: ${formData.comorbidities || '—'}
- Exames complementares: ${formData.labs || '—'}
${formData.previousEvolution?.trim() ? `\nEvolução médica anterior (use para comparar a progressão clínica):\n${formData.previousEvolution.trim()}` : ''}
${formData.nursingEvolution?.trim() ? `\nEvolução de enfermagem (integre as informações ao contexto):\n${formData.nursingEvolution.trim()}` : ''}

Descrição clínica atual:
${formData.clinicalDescription}

Formato obrigatório:
## S — Subjetivo
## O — Objetivo
## A — Avaliação
## P — Plano

Use terminologia médica brasileira formal. Compare com a evolução anterior quando disponível e destaque mudanças clínicas relevantes.`;

    // Usa backend function se provedor externo selecionado, senão usa InvokeLLM padrão
    let result;
    if (selectedLLMId) {
      const res = await base44.functions.invoke('generateSOAP', { prompt, llm_config_id: selectedLLMId });
      if (res.data?.error) throw new Error(res.data.error);
      result = res.data.text;
    } else {
      result = await base44.integrations.Core.InvokeLLM({ prompt, model: 'gemini_3_flash' });
    }

    const evolutionData = {
      sector: formData.sector, bed: formData.bed, patient_initials: formData.patientInitials,
      comorbidities: formData.comorbidities, labs: formData.labs,
      clinical_description: formData.clinicalDescription, soap_text: result,
    };

    const createdPromise = createEvolutionMutation.mutateAsync(evolutionData);
    setLoading(false);

    simulateStream(result,
      (chunk) => setStreamingText(chunk),
      async (final) => {
        const created = await createdPromise;
        setStreamingText('');
        setCurrentSOAP({ ...evolutionData, id: created.id, created_date: new Date().toISOString() });
      }
    );
  };

  const handleNewEvolution = () => {
    setFormData(DEFAULT_FORM);
    setCurrentSOAP(null);
    setStreamingText('');
    setView('form');
  };

  const renderContent = () => {
    if (view === 'history') {
      return <HistoryView evolutions={evolutions}
        onSelect={(ev) => { setCurrentSOAP(ev); setView('result'); }}
        onDelete={(id) => deleteEvolutionMutation.mutate(id)} />;
    }
    if (view === 'result') {
      return <ResultView currentSOAP={currentSOAP} setView={setView} />;
    }
    if (view === 'settings') {
      return <SettingsPanel settings={settings} setTheme={setTheme}
        addCustomChip={addCustomChip} removeCustomChip={removeCustomChip} onBack={() => setView('form')} />;
    }
    if (view === 'manage-sectors') {
      return <ManagementView title="Gerenciar Setores" placeholder="Nome do setor"
        value={newSectorName} onChange={e => setNewSectorName(e.target.value)}
        onAdd={handleAddSector} items={customSectors} onDelete={(id) => deleteSectorMutation.mutate(id)}
        onBack={() => setView('form')} />;
    }
    if (view === 'manage-comorbidities') {
      return <ManagementView title="Gerenciar Comorbidades" placeholder="Nome da comorbidade"
        value={newComorbidityName} onChange={e => setNewComorbidityName(e.target.value)}
        onAdd={handleAddComorbidity} items={customComorbidities} onDelete={(id) => deleteComorbidityMutation.mutate(id)}
        onBack={() => setView('form')} />;
    }
    if (view === 'scores' || view === 'tools') {
      return (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-sm">Módulo de {view === 'scores' ? 'Escores Clínicos' : 'Ferramentas'} — em breve.</p>
        </div>
      );
    }

    // Default: split form + result
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
        <div className="overflow-y-auto border-r border-border">
          <FormView
            formData={formData} setFormData={setFormData}
            allSectors={allSectors} allComorbidities={allComorbidities}
            setView={setView} toggleComorbidityInForm={toggleComorbidityInForm}
            generateSOAP={generateSOAP} loading={loading}
            customChips={settings.customChips} theme={settings.theme}
            llmProviders={llmProviders} selectedLLMId={selectedLLMId} setSelectedLLMId={setSelectedLLMId}
          />
        </div>
        <div className="overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Gerando evolução SOAP...</p>
            </div>
          ) : streamingText ? (
            <div className="glass-card rounded-2xl p-6">
              <span className="text-xs font-bold text-primary mb-3 block">Gerando...</span>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{streamingText}</ReactMarkdown>
              </div>
            </div>
          ) : currentSOAP ? (
            <ResultView currentSOAP={currentSOAP} setView={setView} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="font-bold mb-1">Evolução SOAP</h3>
              <p className="text-sm max-w-xs">Preencha os dados clínicos e clique em <strong className="text-primary">Gerar Evolução SOAP</strong></p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header view={view} setView={setView} theme={settings.theme} setTheme={setTheme} onNewEvolution={handleNewEvolution} activeLLMName={activeLLMName} />
      {renderContent()}
    </div>
  );
}