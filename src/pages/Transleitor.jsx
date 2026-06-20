import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/transleitor/Header';
import FormView from '@/components/transleitor/FormView';
import ResultView from '@/components/transleitor/ResultView';
import HistoryView from '@/components/transleitor/HistoryView';
import ManagementView from '@/components/transleitor/ManagementView';
import SettingsPanel from '@/components/transleitor/SettingsPanel';
import AllergyPopover from '@/components/transleitor/AllergyPopover';
import { useSettings } from '@/hooks/useSettings';

const DEFAULT_SECTORS = ["UTI Adulto", "UTI Pediátrica", "Enfermaria Clínica", "Enfermaria Cirúrgica", "Pronto Socorro", "Consultório"];
const DEFAULT_COMORBIDITIES = ["HAS", "DM2", "Dislipidemia", "Tabagismo", "DRC", "ICC", "DPOC", "Obesidade", "Alergia"];

const DEFAULT_FORM = {
  sector: '', bed: '', patientInitials: '', comorbidities: '', labs: '', clinicalDescription: '',
  consultorioType: null, previousConsult: '', previousEvolution: '', nursingEvolution: '', prescription: '',
};

export default function Transleitor() {
  const [view, setView] = useState('form');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [currentSOAP, setCurrentSOAP] = useState(null);
  const [newSectorName, setNewSectorName] = useState('');
  const [newComorbidityName, setNewComorbidityName] = useState('');
  const [newComorbidityMeds, setNewComorbidityMeds] = useState('');
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
  const [activeComorbidity, setActiveComorbidity] = useState(null);
  const [showAllergyPopover, setShowAllergyPopover] = useState(false);
  const [evolutionMode, setEvolutionMode] = useState('soap'); // 'soap' | 'free'

  const activeLLMName = selectedLLMId
    ? llmProviders.find(p => p.id === selectedLLMId)?.provider_name || 'Desconhecido'
    : 'Gemini Flash';

  const { data: comorbidityMeds = [] } = useQuery({
    queryKey: ['comorbidity-meds'],
    queryFn: () => base44.entities.ComorbidityMedication.list(),
  });

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

  const updateEvolutionMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Evolution.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['evolutions'] }),
  });

  const updateEvolution = async (id, data) => {
    const updated = await updateEvolutionMutation.mutateAsync({ id, data });
    setCurrentSOAP(prev => prev?.id === id ? { ...prev, ...data } : prev);
    return updated;
  };

  const toggleComorbidityInForm = useCallback((name) => {
    const current = formData.comorbidities.split(',').map(s => s.trim()).filter(s => s !== '');
    if (current.includes(name)) {
      setFormData(prev => ({ ...prev, comorbidities: current.filter(s => s !== name).join(', ') }));
    } else {
      setFormData(prev => ({ ...prev, comorbidities: [...current, name].join(', ') }));
      if (name === 'Alergia') {
        setShowAllergyPopover(true);
      } else {
        const med = comorbidityMeds.find(m => m.comorbidity_name === name);
        if (med) setActiveComorbidity(med);
      }
    }
  }, [formData.comorbidities, comorbidityMeds]);

  const addAllergiesToComorbidities = useCallback((allergyText) => {
    setFormData(prev => {
      const current = prev.comorbidities.split(',').map(s => s.trim()).filter(s => s !== '' && s !== 'Alergia');
      return { ...prev, comorbidities: [...current, `Alergia: ${allergyText}`].join(', ') };
    });
    setShowAllergyPopover(false);
  }, []);

  const addToPrescription = useCallback((text) => {
    setFormData(prev => ({
      ...prev,
      prescription: prev.prescription ? prev.prescription + '\n' + text : text,
    }));
  }, []);

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
    if (newComorbidityMeds.trim()) {
      await base44.entities.ComorbidityMedication.create({
        comorbidity_name: newComorbidityName.trim(),
        medications: newComorbidityMeds.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['comorbidity-meds'] });
    }
    setNewComorbidityName('');
    setNewComorbidityMeds('');
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

    try {
      const sectorHint = getSectorHint(formData.sector);
      const isConsultorio = ['consultório', 'consultorio'].includes(formData.sector?.toLowerCase());
      const consultorioLine = isConsultorio && formData.consultorioType
        ? `Contexto: consulta ambulatorial (${formData.consultorioType === 'retorno' ? 'retorno' : 'primeira consulta'}).${formData.consultorioType === 'retorno' && formData.previousConsult?.trim() ? `\nConsulta anterior:\n${formData.previousConsult.trim()}` : ''}`
        : '';

      const patientData = `Dados do paciente:
- Paciente: ${formData.patientInitials || '—'}
- Leito: ${formData.bed || '—'} | Setor: ${formData.sector || '—'}
- Comorbidades: ${formData.comorbidities || '—'}
- Exames complementares: ${formData.labs || '—'}
${formData.previousEvolution?.trim() ? `\nEvolução médica anterior (use para comparar a progressão clínica):\n${formData.previousEvolution.trim()}` : ''}
${formData.nursingEvolution?.trim() ? `\nEvolução de enfermagem (integre as informações ao contexto):\n${formData.nursingEvolution.trim()}` : ''}
${formData.prescription?.trim() ? `\nPrescrição atual do paciente (integre ao contexto clínico e ao plano):\n${formData.prescription.trim()}` : ''}

Descrição clínica atual:
${formData.clinicalDescription}`;

      const soapPrompt = `Você é um assistente médico especialista em documentação clínica brasileira.
Gere uma evolução SOAP em formato HTML (tags semânticas), técnica, precisa, pronta para prontuário. NÃO invente dados.
${sectorHint ? `\nFoco de setor: ${sectorHint}` : ''}${consultorioLine ? `\n${consultorioLine}` : ''}

${patientData}

Formato obrigatório (use APENAS tags HTML, sem Markdown):
<h2>S — Subjetivo</h2>
<p>...</p>
<h2>O — Objetivo</h2>
<p>...</p>
<h2>A — Avaliação</h2>
<p>...</p>
<h2>P — Plano</h2>
<p>...</p>

CID-10 sugerido: Na seção Avaliação, após a análise clínica, sugira o código CID-10 mais provável com base no quadro descrito, no formato:
<code><strong>CID-10 sugerido:</strong> X00.0 — Nome resumido da condição</code>
Se houver mais de uma hipótese, liste até 3 códigos por ordem de probabilidade.

Use terminologia médica brasileira formal. Compare com a evolução anterior quando disponível e destaque mudanças clínicas relevantes.
Use <p> para parágrafos, <strong> para negrito, <ul>/<li> para listas, <br> para quebras. NÃO use Markdown (sem ##, **, -, \`\`\`).`;

      const freePrompt = `Você é um assistente médico especialista em documentação clínica brasileira.
Gere uma evolução clínica em formato HTML (tags semânticas) NARRATIVA, concisa e profissional, pronta para prontuário. NÃO invente dados.
${sectorHint ? `\nFoco de setor: ${sectorHint}` : ''}${consultorioLine ? `\n${consultorioLine}` : ''}

${patientData}

Estruture a evolução clínica OBRIGATORIAMENTE nesta ordem exata (use APENAS tags HTML, sem Markdown):

<p><strong>Hipótese(s) Diagnóstica(s):</strong> ...</p>
<code><strong>CID-10 sugerido:</strong> X00.0 — Nome resumido da condição</code>
(se houver mais de uma hipótese, liste até 3 códigos CID-10 por ordem de probabilidade)

<p><strong>HPP (História Patológica Pregressa) / Comorbidades:</strong> (liste as comorbidades do paciente e seu impacto no quadro atual) ...</p>

<p><strong>Uso de Medicação Contínua:</strong> (descreva os medicamentos de uso crônico do paciente e sua relação com o quadro atual) ...</p>

<p><strong>Alergias:</strong> (liste as alergias conhecidas do paciente) ...</p>

<p><strong>Exames Complementares:</strong> (descreva e analise os exames laboratoriais e de imagem disponíveis, correlacionando com o quadro clínico) ...</p>

<p><strong>Conduta:</strong> (descreva a conduta médica adotada — procedimentos realizados, interconsultas solicitadas, ajustes terapêuticos) ...</p>

<p><strong>Plano Terapêutico:</strong> (descreva o plano de tratamento e os próximos passos planejados) ...</p>

Use terminologia médica brasileira formal. Compare com a evolução anterior quando disponível e destaque mudanças clínicas relevantes.
Use <p> para parágrafos, <strong> para negrito, <ul>/<li> para listas dentro dos parágrafos, <br> para quebras. NÃO use <h2> ou cabeçalhos. Texto corrido, profissional, como uma evolução de prontuário real.
NÃO use Markdown (sem ##, **, -, \`\`\`).`;

      const finalPrompt = evolutionMode === 'free' ? freePrompt : soapPrompt;

      let result;
      if (selectedLLMId) {
        const res = await base44.functions.invoke('generateSOAP', { prompt: finalPrompt, llm_config_id: selectedLLMId });
        if (res.data?.error) throw new Error(res.data.error);
        result = res.data.text;
      } else {
        result = await base44.integrations.Core.InvokeLLM({ prompt: finalPrompt, model: 'gemini_3_flash' });
      }

      const evolutionData = {
        sector: formData.sector, bed: formData.bed, patient_initials: formData.patientInitials,
        comorbidities: formData.comorbidities, labs: formData.labs, prescription: formData.prescription,
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
    } catch (err) {
      setLoading(false);
      alert('Erro ao gerar evolução: ' + (err?.response?.data?.error || err.message || 'Erro desconhecido'));
    }
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
      return <ResultView currentSOAP={currentSOAP} onUpdate={updateEvolution} />;
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
        onBack={() => setView('form')}
        extraPlaceholder="Medicamentos crônicos (separados por vírgula)..."
        extraValue={newComorbidityMeds} onExtraChange={e => setNewComorbidityMeds(e.target.value)} />;
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
      <>
        {showAllergyPopover && (
          <AllergyPopover
            onAdd={addAllergiesToComorbidities}
            onClose={() => setShowAllergyPopover(false)}
          />
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-64px)]">
          <div className="overflow-y-auto border-r border-border">
            <FormView
              formData={formData} setFormData={setFormData}
              allSectors={allSectors} allComorbidities={allComorbidities}
              setView={setView} toggleComorbidityInForm={toggleComorbidityInForm}
              generateSOAP={generateSOAP} loading={loading}
              customChips={settings.customChips} theme={settings.theme}
              llmProviders={llmProviders} selectedLLMId={selectedLLMId} setSelectedLLMId={setSelectedLLMId}
              activeComorbidity={activeComorbidity} onCloseComorbidity={() => setActiveComorbidity(null)} onAddToPrescription={addToPrescription}
              evolutionMode={evolutionMode} setEvolutionMode={setEvolutionMode}
            />
          </div>
          <div className="overflow-y-auto p-4 md:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Gerando evolução{evolutionMode === 'free' ? ' livre' : ' SOAP'}...</p>
              </div>
            ) : streamingText ? (
              <div className="glass-card rounded-2xl p-6">
                <span className="text-xs font-bold text-primary mb-3 block">Gerando...</span>
                <div className="prose prose-sm dark:prose-invert max-w-none [&_code]:bg-amber-500/10 [&_code]:text-amber-600 [&_code]:dark:text-amber-400 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_code]:font-bold" dangerouslySetInnerHTML={{ __html: streamingText }} />
              </div>
            ) : currentSOAP ? (
              <ResultView currentSOAP={currentSOAP} onUpdate={updateEvolution} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="font-bold mb-1">Evolução{evolutionMode === 'free' ? ' Livre' : ' SOAP'}</h3>
                <p className="text-sm max-w-xs">Preencha os dados clínicos e clique em <strong className="text-primary">Gerar Evolução{evolutionMode === 'free' ? ' Livre' : ' SOAP'}</strong></p>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header view={view} setView={setView} theme={settings.theme} setTheme={setTheme} onNewEvolution={handleNewEvolution} activeLLMName={activeLLMName} llmProviders={llmProviders} selectedLLMId={selectedLLMId} setSelectedLLMId={setSelectedLLMId} />
      {renderContent()}
    </div>
  );
}