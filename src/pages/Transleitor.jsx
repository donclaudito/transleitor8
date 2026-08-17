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

const DEFAULT_SECTORS = ["UTI Adulto", "UTI Pediátrica", "Enfermaria Clínica", "Enfermaria Cirúrgica", "Pronto Socorro", "Emergência", "Consultório"];
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
  const [evolutionMode, setEvolutionMode] = useState('free'); // 'soap' | 'free'

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
    if (s.includes('consult')) return 'Ambulatorial: atue como especialista em Gastroenterologia e Coloproctologia. Foque em queixas digestivas, rastreio de câncer colorretal, doenças inflamatórias intestinais, distúrbios funcionais e afecções anorretais. Sugira condutas ambulatoriais e exames complementares pertinentes (endoscopia, colonoscopia, imagem abdominal, laboratório).';
    if (s.includes('emerg') || s.includes('avalia') || s.includes('fast')) return 'Setor Emergência (Sala de Avaliação Cirúrgica / Fast-Track): atue como CIRURGIÃO FILTRO de alto nível. O paciente NÃO está morrendo naquele segundo, mas tem queixa cirúrgica que precisa de diagnóstico rápido e decisão de destino. Objetivo: resolver na hora (pequenos procedimentos), internar para tratamento clínico ou encaminhar ao CC imediato. Estruture OBRIGATORIAMENTE: 1) Anamnese dirigida pelos 5 Ws por DPO (Wind DPO 1–2 atelectasia/pneumonia/TEP; Water DPO 3–5 ITU; Wound DPO 5–7 ISC; Walking DPO 7+ TVP; Wonder Drugs febre medicamentosa); 2) Exame físico "mão na massa" bedside — TIRE O CURATIVO (flutuação, eritema além das bordas, saída de pus/fezes), teste do abdome (distensão+vômitos+sem gases=obstrução/íleo; Blumberg=peritonite), avaliação de drenos; 3) Pequenos procedimentos à beira-leito (abertura de pontos, punção de seroma, retirada de corpo estranho); 4) Exames point-of-care (POCUS de ferida/Doppler/RX abdome em pé/TC com contraste); 5) Matriz de decisão: 🟢 Alta imediata com return precautions, 🟡 Internação enfermaria, 🟠 Internação UTI, 🔴 CC imediato. SINALE armadilhas: dor desproporcional no DPO 3 (isquemia/trombose de enxerto), idoso/imunossuprimido sem febre e sem abdome rígido, alta no DPO 5 sem return precautions, não ler boletim cirúrgico. Seja cético, prático e use as mãos. NÃO invente dados.';
    if (s.includes('pronto') || s.includes('ps')) return 'Setor Pronto Socorro (paciente pós-operatório): atue como CIRURGIÃO em avaliação no PS. O paciente chega de forma NÃO programada (alta com complicação ou transferência). Mude a mentalidade de "acompanhamento de evolução" para TRIAGEM RÁPIDA, RESSUSCITAÇÃO e DECISÃO DE REABORDAGEM IMEDIATA. Estruture OBRIGATORIAMENTE: 1) ABCDE com olhar cirúrgico (TEP, pneumotórax, choque hipovolêmico/séptico, alteração de consciência, e EXPOSIÇÃO — tire o curativo e examine a ferida); 2) Anamnese cirúrgica relâmpago (qual cirurgia, DPO — dita a suspeita: DPO 1–2 sangramento, DPO 5–7 vazamento/infecção, DPO 30+ obstrução/aderências; sintoma sentinela; parou de eliminar gases/fezes); 3) Exame físico focado em catástrofes cirúrgicas (deiscência/evisceração, peritonite, isquemia de estoma, ISC profunda, hematoma expansivo); 4) Exames para decisão rápida (RX abdome em pé, TC com contraste, lactato/PCR/ função renal); 5) A grande decisão: CC imediato vs internação vs alta com retorno. No PS olhe o MOMENTO ATUAL e o RISCO DE MORTE, não tendências. SINALE red flags: evisceração, sangramento ativo instável, isquemia de estoma/alça, peritonite generalizada. Recomende contatar o cirurgião original. NÃO invente dados.';
    if (s.includes('uti') || s.includes('intensiva')) return 'Setor UTI (paciente pós-operatório): atue como CIRURGIÃO em visita à UTI. O foco é a integridade da cirurgia, a evolução anatômica e a detecção precoce de complicações técnicas — distinto do intensivista. Estruture OBRIGATORIAMENTE: 1) Avaliação da ferida operatória e sítio cirúrgico (inspeção, drenos, palpação, curativos especiais) — prioridade máxima; 2) Anatomia/fisiologia específica da cirurgia (anastomoses, vascularização de estomas/retalhos, compartimentos, órgãos adjacentes); 3) Controle de dor e analgesia (dor de padrão alterado como sinal de alerta); 4) Nutrição e função gastrointestinal (íleo vs. obstrução, tolerância à dieta, acesso enteral, controle glicêmico); 5) Profilaxia e prevenção sistêmica (tromboprofilaxia, antibioticoterapia, mobilização precoce); 6) Exames com olhar cirúrgico (tendências laboratoriais e imagens da área operada); 7) Comunicação e planejamento (alinhamento com intensivista, família, documentação). SINALE explicitamente red flags: taquicardia persistente sem causa óbvia, alteração súbita de drenos, abdômen tenso/rígido, isquemia de estoma/extremidade, sangramento ativo não responsivo. NÃO invente dados.';
    if (s.includes('cirúrg') || s.includes('cirurg')) return 'Cirurgia Geral e do Aparelho Digestivo: atue como especialista. Gere uma Evolução Diária Pós-Operatória formal, técnica e direta. Estruture OBRIGATORIAMENTE: 1) Identificação e tempo PO; 2) Subjetivo (aceitação alimentar/dieta, EVA, náuseas/vômitos, febre, eliminação de flatus/fezes, diurese, deambulação); 3) Objetivo (sinais vitais, exame físico e abdominal detalhado, ferida cirúrgica/portais, drenos/sondas/acessos, exames complementares); 4) Avaliação/Impressão clínica; 5) Plano e Condutas (cuidados de enfermagem, dietoterapia, solicitação de exames, pareceres/interconsultas, planejamento de alta). NÃO invente dados.';
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

      // Mescla medicamentos crônicos das comorbidades selecionadas à prescrição atual (somente para o prompt)
      const selectedComorbidities = formData.comorbidities.split(',').map(s => s.trim()).filter(s => s && !s.startsWith('Alergia'));
      const chronicMeds = selectedComorbidities
        .map(c => comorbidityMeds.find(m => m.comorbidity_name === c))
        .filter(Boolean)
        .map(m => m.medications)
        .filter(Boolean);
      const mergedPrescription = chronicMeds.length > 0
        ? `${formData.prescription?.trim() || ''}${formData.prescription?.trim() ? '\n' : ''}--- Medicamentos crônicos (uso contínuo) ---\n${chronicMeds.join('\n')}`
        : (formData.prescription?.trim() || '');

      // RAG: constrói a Base de Conhecimento APENAS com os campos preenchidos.
      // Campos ausentes são omitidos (não viram "—" para não virar dado ambíguo).
      const kbEntries = [
        ['Paciente (iniciais)', formData.patientInitials?.trim()],
        ['Leito', formData.bed?.trim()],
        ['Setor', formData.sector?.trim()],
        ['Comorbidades', formData.comorbidities?.trim()],
        ['Exames complementares', formData.labs?.trim()],
        ['Evoluções médicas anteriores', formData.previousEvolution?.trim()],
        ['Evolução de enfermagem', formData.nursingEvolution?.trim()],
        ['Prescrição atual', mergedPrescription?.trim()],
        ['Descrição clínica atual', formData.clinicalDescription?.trim()],
      ];
      const kbText = kbEntries
        .filter(([, v]) => v)
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n');

      const patientData = `BASE DE CONHECIMENTO (FONTE ÚNICA DE VERDADE):
${kbText || '(nenhum dado adicional)'}

REGRAS RAG (OBRIGATÓRIAS):
1. Use ESTRITAMENTE os dados da BASE DE CONHECIMENTO acima. É a única fonte permitida.
2. NÃO use conhecimento externo, treinamento ou inferência para preencher lacunas clínicas.
3. Se uma informação não está na base acima, escreva "Não informado" — nunca invente.
4. É PROIBIDO fabricar: exames, medicamentos, posologias, sinais vitais, achados de exame físico, CID-10 não justificado, datas ou condutas não descritas.
5. Você organiza e formata os dados fornecidos — não diagnostica nem completa além do input.`;

      const correlationBlock = formData.previousEvolution?.trim() ? `\n\nÂNCORA DE CORRELAÇÃO CRUZADA (use TODAS as Evoluções Médicas Anteriores como referência obrigatória):
1. ANÁLISE CRONOLÓGICA: ordene as evoluções anteriores por data/tempo e reconstrua a LINHA DO TEMPO clínica do paciente. Destaque a progressão dia a dia — melhora, piora ou estabilidade de sintomas, sinais vitais e estado geral entre as evoluções.
2. Ao descrever a Descrição Clínica Atual, CONSIDERE OBRIGATORIAMENTE as últimas evoluções médicas — o quadro atual deve ser interpretado como continuação da tendência mais recente, não孤立mente. Se a última evolução já relatava melhora/piora de X, indique se a tendência se mantém, reverteu ou agravou.
3. Cruze com a Evolução de Enfermagem: identifique divergências ou confirmações relevantes. Se houver divergência entre o relato médico anterior e a evolução de enfermagem, SINALE explicitamente no texto gerado (ex: "Divergência identificada: enfermagem relata febre às 02h, não mencionada na evolução médica anterior.").
4. ANÁLISE CRONOLÓGICA DOS EXAMES: nos Exames Complementares, organize os resultados por data e identifique TENDÊNCIAS laboratoriais ao longo do tempo (ex: PCR caindo dia a dia, leucocitose melhorando, hemoglobina estável), citando os valores de comparação. Não relate apenas o valor isolado mais recente.
5. Correlacione com a Prescrição Atual para avaliar a resposta terapêutica no tempo.` : '';

      const soapPrompt = `Você é um assistente médico especialista em documentação clínica brasileira.
Gere uma evolução SOAP em formato HTML (tags semânticas), técnica, precisa, pronta para prontuário. NÃO invente dados.
${sectorHint ? `\nFoco de setor: ${sectorHint}` : ''}${consultorioLine ? `\n${consultorioLine}` : ''}

${patientData}${correlationBlock}

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
IMPORTANTE: Na seção P — Plano, analise a Prescrição Atual do paciente: liste os medicamentos vigentes em <strong>negrito</strong> com posologia, avalie pertinência ao quadro, sinalize ajustes necessários e potenciais interações/alertas de segurança. NÃO inclua medicamentos de uso contínuo (já descritos em HPP/Comorbidades) — inclua apenas a prescrição aguda vigente, ajustes e novas condutas planejadas.
Use <p> para parágrafos, <strong> para negrito, <ul>/<li> para listas, <br> para quebras. NÃO use Markdown (sem ##, **, -, \`\`\`).`;

      const freePrompt = `Você é um assistente médico especialista em documentação clínica brasileira.
Gere uma evolução clínica em formato HTML (tags semânticas) NARRATIVA, concisa e profissional, pronta para prontuário. NÃO invente dados.
${sectorHint ? `\nFoco de setor: ${sectorHint}` : ''}${consultorioLine ? `\n${consultorioLine}` : ''}

${patientData}${correlationBlock}

Estruture a evolução clínica OBRIGATORIAMENTE nesta ordem exata (use APENAS tags HTML, sem Markdown):

<p><strong>Hipótese(s) Diagnóstica(s):</strong> ...</p>
<code><strong>CID-10 sugerido:</strong> X00.0 — Nome resumido da condição</code>
(se houver mais de uma hipótese, liste até 3 códigos CID-10 por ordem de probabilidade)

<p><strong>HPP (História Patológica Pregressa) / Comorbidades:</strong> (liste as comorbidades do paciente e seu impacto no quadro atual) ...</p>

<p><strong>Uso de Medicação Contínua:</strong> (liste cada medicamento de uso crônico em <strong>negrito</strong>, descrevendo posologia e relação com o quadro atual. Ex: <strong>Losartana 50mg/dia</strong>, <strong>Metformina XR 1g/dia</strong>) ...</p>

<p><strong>Alergias:</strong> (liste as alergias conhecidas do paciente. Se houver alguma alergia cadastrada, inclua um alerta no formato: ⚠️ <strong>ALERTA:</strong> Paciente alérgico a [substância]. Atenção redobrada na prescrição.) ...</p>

<p><strong>Exames Complementares:</strong> (analise os exames de forma CRONOLÓGICA — organize por data, identifique tendências ao longo do tempo e correlacione com o quadro clínico; não relate apenas o valor mais recente isolado) ...</p>

<p><strong>Prescrição Atual:</strong> (analise a prescrição vigente do paciente: liste os medicamentos em <strong>negrito</strong> com posologia, avalie a pertinência ao quadro clínico, identifique ajustes necessários, potenciais interações medicamentosas e alertas de segurança. Diferencie claramente dos medicamentos de uso contínuo já descritos em seção própria) ...</p>

<p><strong>Conduta:</strong> (descreva a conduta médica adotada — procedimentos realizados, interconsultas solicitadas, ajustes terapêuticos) ...</p>

<p><strong>Plano Terapêutico:</strong> (descreva o plano de tratamento e os próximos passos planejados) ...</p>

Use terminologia médica brasileira formal. Compare com a evolução anterior quando disponível e destaque mudanças clínicas relevantes.
IMPORTANTE: Na seção de Conduta/Plano Terapêutico, NÃO inclua medicamentos de uso contínuo (já descritos em seção própria). Inclua apenas ajustes agudos da prescrição atual e novas condutas. Os medicamentos contínuos não devem aparecer no plano, apenas na seção "Uso de Medicação Contínua".
Use <p> para parágrafos, <strong> para negrito, <ul>/<li> para listas dentro dos parágrafos, <br> para quebras. NÃO use <h2> ou cabeçalhos. Texto corrido, profissional, como uma evolução de prontuário real.
NÃO use Markdown (sem ##, **, -, \`\`\`).`;

      const simplePrompt = `Você é um assistente médico especialista em documentação clínica brasileira.
Gere uma evolução clínica ULTRACONCISA, objetiva e telegráfica em formato HTML, para leitura RÁPIDA pelo médico que assumirá o plantão. NÃO invente dados.
${sectorHint ? `\nFoco de setor: ${sectorHint}` : ''}${consultorioLine ? `\n${consultorioLine}` : ''}

${patientData}${correlationBlock}

Mantenha a MESMA sequência abaixo, mas seja EXTREMAMENTE breve em cada campo (máximo 1-2 linhas, frases curtas e diretas, sem floreios):

<p><strong>Hipótese(s) Diagnóstica(s):</strong> ...</p>
<code><strong>CID-10 sugerido:</strong> X00.0 — Nome resumido</code>
(se houver mais de uma hipótese, liste até 3 códigos CID-10 por ordem de probabilidade)

<p><strong>HPP/Comorbidades:</strong> (liste apenas as comorbidades relevantes, separadas por vírgula) ...</p>

<p><strong>Uso de Medicação Contínua:</strong> (liste apenas nome + dose, um por linha, em <strong>negrito</strong>) ...</p>

<p><strong>Alergias:</strong> (liste apenas as substâncias; se nenhuma, escreva "Sem alergias conhecidas") ...</p>

<p><strong>Exames Complementares:</strong> (apenas alterações relevantes e TENDÊNCIAS cronológicas, sem valores detalhados) ...</p>

<p><strong>Prescrição Atual:</strong> (liste os medicamentos vigentes em <strong>negrito</strong> com posologia; sinalize apenas ajustes ou alertas de segurança relevantes, sem repetir os de uso contínuo) ...</p>

<p><strong>Conduta:</strong> (apenas o que foi feito, telegráfico) ...</p>

<p><strong>Plano Terapêutico:</strong> (próximos passos em tópicos curtos) ...</p>

REGRAS: Seja objetivo, sem repetir informações. Priorize velocidade de leitura. Não inclua medicamentos contínuos no plano, apenas na seção própria.
Use <p>, <strong>, <ul>/<li>, <br>. NÃO use <h2> nem Markdown (sem ##, **, -, \`\`\`).`;

      const finalPrompt = evolutionMode === 'free' ? freePrompt : evolutionMode === 'simple' ? simplePrompt : soapPrompt;

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
        form_data: formData,
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

  const loadEvolutionToForm = (ev) => {
    const saved = ev.form_data || {};
    setFormData({
      ...DEFAULT_FORM,
      sector: ev.sector || saved.sector || '',
      bed: ev.bed || saved.bed || '',
      patientInitials: ev.patient_initials || saved.patientInitials || '',
      comorbidities: ev.comorbidities || saved.comorbidities || '',
      labs: ev.labs || saved.labs || '',
      prescription: ev.prescription || saved.prescription || '',
      clinicalDescription: ev.clinical_description || saved.clinicalDescription || '',
      consultorioType: saved.consultorioType ?? null,
      previousConsult: saved.previousConsult || '',
      previousEvolution: saved.previousEvolution || '',
      nursingEvolution: saved.nursingEvolution || '',
    });
    setCurrentSOAP(ev);
    setStreamingText('');
    setView('form');
  };

  const renderContent = () => {
    if (view === 'history') {
      return <HistoryView evolutions={evolutions}
        onSelect={(ev) => loadEvolutionToForm(ev)}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[calc(100vh-64px)]">
          <div className="overflow-y-auto border-b lg:border-b-0 lg:border-r border-border">
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
          <div className={`overflow-y-auto p-4 md:p-6 transition-colors duration-500 ${currentSOAP && !loading && !streamingText ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Gerando evolução{evolutionMode === 'soap' ? ' SOAP' : evolutionMode === 'simple' ? ' simples' : ' livre'}...</p>
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
                <h3 className="font-bold mb-1">Evolução{evolutionMode === 'soap' ? ' SOAP' : evolutionMode === 'simple' ? ' Simples' : ' Livre'}</h3>
                <p className="text-sm max-w-xs">Preencha os dados clínicos e clique em <strong className="text-primary">Gerar Evolução{evolutionMode === 'soap' ? ' SOAP' : evolutionMode === 'simple' ? ' Simples' : ' Livre'}</strong></p>
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