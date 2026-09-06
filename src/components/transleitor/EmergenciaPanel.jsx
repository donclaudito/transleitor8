import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeft, Search, Stethoscope, Activity, ClipboardList, FlaskConical, Ambulance, AlertTriangle, Wrench, FileSpreadsheet } from 'lucide-react';
import CustomPanelItems from './CustomPanelItems';
import PanelFavoritesBlock from './PanelFavoritesBlock';
import FavoriteStar from './FavoriteStar';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';

const EMERGENCIA_DATA = {
  cincoW: {
    label: '5 Ws — Anamnese por DPO',
    icon: Activity,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'ring-violet-400/40',
    groups: [
      { label: 'Wind (Vento/Pulmão — DPO 1–2)', items: ['Atelectasia', 'Pneumonia', 'TEP', 'Falta de ar referida', 'Tosse', 'Dor para respirar fundo'] },
      { label: 'Water (Água/Urina — DPO 3–5)', items: ['Infecção do trato urinário (ITUs)', 'Sonda vesical de demora previa', 'Ardência ao urinar', 'Urina escura/turva'] },
      { label: 'Wound (Ferida — DPO 5–7)', items: ['Infecção de sítio cirúrgico (ISC)', 'Dor na ferida piorando', 'Ferida quente', 'Eritema na ferida'] },
      { label: 'Walking (Caminhada/Pernas — DPO 7+)', items: ['Trombose venosa profunda (TVP)', 'Panturrilha inchada', 'Panturrilha dolorida', 'Edema assimétrico em MMII'] },
      { label: 'Wonder Drugs (Drogas — qualquer DPO)', items: ['Febre por medicamento', 'Reação a antibiótico', 'Reação a heparina', 'Farmacoderme'] },
    ],
  },
  bedside: {
    label: 'Exame Físico "Mão na Massa"',
    icon: Stethoscope,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    ring: 'ring-orange-400/40',
    groups: [
      { label: 'Regra de Ouro da Ferida (tire o curativo)', items: ['Curativo removido e ferida examinada', 'Flutuação (abscesso/seroma infectado)', 'Eritema além das bordas (celulite/erisipela)', 'Saída de pus pela ferida', 'Saída de fezes pela ferida (fístula/deiscência)', 'Deiscência parcial', 'Deiscência de aponeurose', 'Evisceração'] },
      { label: 'Teste do Abdome', items: ['Abdome flácido e indolor', 'Distensão + vômitos + ausência de gases (obstrução por bridas/íleo)', 'Dor à descompressão brusca (Blumberg) — PERITONITE', 'Defesa abdominal', 'Abdome em tábua', 'Massa palpável'] },
      { label: 'Avaliação de Drenos', items: ['Drenos pérvios', 'Dreno obstruído', 'Dreno arrancado acidentalmente', 'Líquido mudou de cor', 'Débito aumentou', 'Débito purulento/bilioso/entérico'] },
    ],
  },
  procedimentos: {
    label: 'Pequenos Procedimentos à Beira-Leito',
    icon: Wrench,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    ring: 'ring-teal-400/40',
    groups: [
      { label: 'Resolutivos na própria sala', items: ['Abertura de pontos/retirada de grampos (drenar abscesso superficial)', 'Lavagem da ferida + curativo', 'Punção de seroma (técnica estéril)', 'Retirada de corpo estranho (fio não absorvível/granuloma)', 'Drenagem de hematoma infectado', 'Alta com curativos diários no posto de saúde'] },
    ],
  },
  exames: {
    label: 'POCUS e Imagem Rápida',
    icon: FlaskConical,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    ring: 'ring-cyan-400/40',
    groups: [
      { label: 'Ultrassom Bedside (POCUS)', items: ['Coleção na ferida (líquido vs flegmão)', 'Doppler de MMII (TVP)', 'Via biliar (colecistectomia com dor residual)', 'Via renal (nefrectomia com dor residual)'] },
      { label: 'Imagem Rápida', items: ['RX abdome em pé (níveis hidroaéreos — obstrução)', 'RX abdome em pé (pneumoperitônio — perfuração)', 'TC abdome/pelve com contraste (definitivo)', 'TC com abscesso intra-abdominal', 'TC com fístula anastomótica'] },
    ],
  },
  decisao: {
    label: 'Matriz de Decisão (Destino)',
    icon: ClipboardList,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/40',
    groups: [
      { label: '🟢 Alta Imediata', items: ['Seroma não infectado', 'Dor muscular residual', 'Constipação leve', 'ISC superficial drenada na sala', 'Prescrição oral + curativo + return precautions'] },
      { label: '🟡 Internação Enfermaria', items: ['Celulite extensa (ATB EV)', 'Íleo paralítico prolongado (SNG + hidratação)', 'Abscesso intra-abdominal pequeno (ATB/drenagem percutânea RI)'] },
      { label: '🟠 Internação UTI', items: ['Sepse de foco abdominal', 'Idoso com comorbidades descompensando', 'Fístula digestiva de alto débito', 'Ressuscitação volêmica + ATB amplo espectro'] },
      { label: '🔴 Centro Cirúrgico Imediato', items: ['Deiscência de aponeurose com evisceração', 'Sangramento ativo com instabilidade', 'Peritonite generalizada', 'Isquemia intestinal', 'Jejum + acesso calibroso + avisar CC'] },
    ],
  },
  armadilhas: {
    label: '⚠️ Armadilhas na Sala de Avaliação',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-400/40',
    groups: [
      { label: 'Pegadinhas que matam', items: ['Dor "diferente"/desproporcional no DPO 3 = isquemia de alça/trombose de enxerto', 'Idoso/imunossuprimido sem febre e sem abdome rígido (taquicardia + confusão = catástrofe)', 'Alta no DPO 5 (vazamento de anastomose) sem return precautions', 'Não ler boletim cirúrgico / não ligar para cirurgião original'] },
    ],
  },
};

const EXAMES_DATA = {
  labBasico: {
    label: 'Lab Básico (Kit Sepse/Sangramento)',
    icon: FlaskConical,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    ring: 'ring-rose-400/40',
    groups: [
      { label: 'Ponto de partida para quase todo pós-op sintomático', items: [
        'Hemograma — Sangrando? (queda Hb/Ht em série) · Infectado? (leucocitose + desvio)',
        'PCR — A curva está correta? Deve cair após DPO 2–3; segunda elevação = complicação até prova em contrário',
        'Procalcitonina — Sepse bacteriana vs. inflamação pós-cirúrgica; guia início/suspensão de ATB',
        'Lactato — Perfusão tecidual · isquemia intestinal · gravidade da sepse (tendência pós-ressuscitação)',
        'Ureia/Creatinina + Eletrólitos (Na, K) — Desidratação · IRA séptica/pré-renal · hipocalemia perpetuando íleo',
        'Coagulograma (TAP/INR, TTPa, fibrinogênio) — Sangramento ativo · coagulopatia · segurança pré-procedimento',
        'Glicemia capilar — Controle glicêmico (cicatrização e risco de infecção)',
      ] },
    ],
  },
  labDirigido: {
    label: 'Lab Dirigido pela Suspeita',
    icon: FlaskConical,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'ring-violet-400/40',
    groups: [
      { label: 'Só peça se houver contexto', items: [
        'EAS + Urocultura — Febre + sonda vesical recente (foco urinário, DPO 3–5)',
        'Hemoculturas (2 amostras, antes do ATB) — Febre ≥38°C, calafrios ou sinais de sepse',
        'AST/ALT, FA, GGT, Bilirrubinas — Pós-colecistectomia/hepática (lesão de via biliar, cálculos residuais)',
        'Amilase/Lipase — Cirurgia gástrica/bariátrica/pancreática ou dor epigástrica (fístula pancreática, pancreatite)',
        'Troponina + BNP — Dor torácica, idosos, cardiopatas (IAM tipo 2 e sobrecarga hídrica são comuns)',
        'Gasometria (venosa ou arterial) — Dispneia, acidose metabólica, choque',
        'β-HCG — Mulher em idade fértil antes de imagem com radiação',
      ] },
    ],
  },
  drenos: {
    label: 'Análise de Drenos e Secreções',
    icon: FlaskConical,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    ring: 'ring-teal-400/40',
    groups: [
      { label: 'Dosar o líquido fecha o diagnóstico na hora', items: [
        'Bilirrubina no dreno > 3× a sérica → fístula biliar',
        'Amilase no dreno > 3× a sérica → fístula pancreática',
        'Creatinina no dreno >> sérica → fístula urinária',
        'Triglicerídeos no dreno > 110 mg/dL → quilo (lesão linfática)',
        'Aspecto entérico/fecaloide → fístula digestiva (não precisa dosar, o olho diagnostica)',
      ] },
    ],
  },
  imagem: {
    label: 'Imagem — da simples à complexa',
    icon: Stethoscope,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    ring: 'ring-cyan-400/40',
    groups: [
      { label: 'POCUS / Ultrassom à beira-leito (extensão do exame físico)', items: [
        'POCUS parede/fossa cirúrgica: coleção líquida (abscesso/seroma) vs flegmão',
        'FAST: líquido livre intra-abdominal (sangramento)',
        'Doppler de MMII: TVP (panturrilha dolorida/inchada)',
        'POCUS tórax: derrame pleural, consolidação',
        'POCUS vias biliares: dilatação de colédoco, coleções peri-hepáticas',
      ] },
      { label: 'Radiografias simples (rápidas e baratas)', items: [
        'Rx tórax (em pé se possível): atelectasia, pneumonia, derrame, pneumotórax, posição de sondas',
        'Rx abdome em pé + decúbito: níveis hidroaéreos (obstrução), pneumoperitônio, distensão de alças',
      ] },
      { label: 'Tomografia — padrão-ouro da sala de avaliação', items: [
        'TC abdome/pelve com contraste IV ± oral/retal hidrossolúvel: coleções, vazamento anastomótico, isquemia, obstrução, hematoma',
        'Contraste oral/retal OBRIGATÓRIO se a dúvida é fístula anastomótica',
        'Angio-TC de tórax: suspeita de TEP (taquipneia + taquicardia + hipoxia sem foco pulmonar claro)',
      ] },
      { label: 'Trânsito com contraste hidrossolúvel (Rx seriado)', items: [
        'Alternativa/complemento para fístula esofágica/gástrica/cólica quando TC não é conclusiva',
      ] },
    ],
  },
  outros: {
    label: 'Outros',
    icon: Activity,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/40',
    groups: [
      { label: 'Complementares', items: [
        'ECG de 12 derivações — Taquicardia inexplicada, dor torácica, distúrbio de K⁺/Mg²⁺',
      ] },
    ],
  },
  resumo: {
    label: 'Suspeita → Exame de Escolha',
    icon: ClipboardList,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ring: 'ring-emerald-400/40',
    groups: [
      { label: 'Quadro clínico → exames', items: [
        'Febre + dor abdominal (DPO 5–7) → Hg, PCR, lactato, hemoculturas → TC abdome c/ contraste IV + oral/retal',
        'Ferida com sinais flogísticos/flutuação → Hg, PCR → POCUS de parede (muitas vezes abre-se à beira-leito)',
        'Pálido, taquicárdico, queda de Hb → Hg em série, coagulograma → POCUS/FAST → TC c/ contraste se estável',
        'Vômitos + distensão + sem gases → Eletrólitos, ureia/creat → Rx abdome em pé → TC se dúvida',
        'Dispneia + taquicardia + hipoxia → Gasometria, ECG, Rx tórax → Doppler MMII → Angio-TC de tórax',
        'Icterícia/dor no HCD pós-colecistectomia → Bilirrubinas, FA, GGT → USG ou TC de vias biliares',
        'Febre + sonda vesical recente → EAS + urocultura',
        'Dor torácica / arritmia → ECG, troponina, K⁺/Mg²⁺',
      ] },
    ],
  },
  armadilhasLab: {
    label: '⚠️ Armadilhas de Interpretação PO',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-400/40',
    groups: [
      { label: 'Pegadinhas na interpretação pós-operatória', items: [
        'Pneumoperitônio pode ser NORMAL até ~5–7 dias após laparotomia (e após VL). Só vale se peritonite/sepse',
        'Leucocitose leve é esperada nos primeiros DPOs. Alarma: desvio à esquerda ou curva ascendente tardia',
        'D-dímero NÃO serve no pós-op recente — estará elevado pela cirurgia. Suspeitou TEP? Doppler/Angio-TC',
        'PCR isolada não diagnostica nada — o valor está na tendência (comparar com exames da internação anterior)',
        'Idoso/imunossuprimido pode ter sepse grave com exames "normais". Confie no estado clínico, lactato e PCR/PCT',
        'Compare sempre com exames da alta hospitalar — a delta (Δ) vale mais que o número absoluto',
      ] },
    ],
  },
};

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function fuzzyMatch(text, query) {
  if (!query) return true;
  const q = normalize(query);
  const t = normalize(text);
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function AccordionGroup({ group, selectedItems, onToggle, colorClasses, searchTerm, isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite }) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.items.filter(i => selectedItems.includes(i)).length;
  const filteredItems = group.items.filter(item => fuzzyMatch(item, searchTerm));
  if (filteredItems.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors">
        <span className="text-xs font-bold text-foreground/80 flex items-center">
          <FavoriteStar active={isGroupFavorite(group.label)} onToggle={() => toggleGroupFavorite(group.label)} />
          {group.label}
        </span>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colorClasses.bg} ${colorClasses.color}`}>
              {selectedCount}
            </span>
          )}
          {open ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-1.5 border-t border-border bg-muted/20">
          {filteredItems.map(item => {
            const active = selectedItems.includes(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left transition-all ${
                  active
                    ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.color} ring-1 ${colorClasses.ring}`
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                }`}>
                <FavoriteStar active={isFavorite(item)} onToggle={() => toggleFavorite(item, group.label)} />
                {active && <span className="mr-1">✓</span>}
                {item}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionAccordion({ section, selectedItems, onToggle, searchTerm, defaultOpen, isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const totalSelected = section.groups.flatMap(g => g.items).filter(i => selectedItems.includes(i)).length;
  const hasMatches = !searchTerm || section.groups.some(g => g.items.some(item => fuzzyMatch(item, searchTerm)));
  const effectiveOpen = searchTerm ? (hasMatches || open) : open;
  const Icon = section.icon;

  return (
    <div className={`rounded-xl border ${section.border} overflow-hidden`}>
      <button onClick={() => setOpen(!effectiveOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${section.bg} transition-colors`}>
        <span className={`text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 ${section.color}`}>
          <Icon className="w-4 h-4" /> {section.label}
        </span>
        <div className="flex items-center gap-2">
          {totalSelected > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 ${section.color}`}>
              {totalSelected} selecionado{totalSelected !== 1 ? 's' : ''}
            </span>
          )}
          {effectiveOpen ? <ChevronDown className={`w-4 h-4 ${section.color}`} /> : <ChevronRight className={`w-4 h-4 ${section.color}`} />}
        </div>
      </button>
      {effectiveOpen && (
        <div className="p-2 space-y-1.5 bg-card/40">
          {[...section.groups].sort((a, b) => (isGroupFavorite(b.label) ? 1 : 0) - (isGroupFavorite(a.label) ? 1 : 0)).map(g => (
            <AccordionGroup key={g.label} group={g} selectedItems={selectedItems} onToggle={onToggle}
              colorClasses={{ bg: section.bg, border: section.border, color: section.color, ring: section.ring }}
              searchTerm={searchTerm} isFavorite={isFavorite} toggleFavorite={toggleFavorite}
              isGroupFavorite={isGroupFavorite} toggleGroupFavorite={toggleGroupFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function EmergenciaPanel({ onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('roteiro');
  const { isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite } = usePanelFavorites('emergencia');

  const handleToggle = (item) => {
    setSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleClearAll = () => {
    setSelected([]);
    setSearchTerm('');
  };

  const handleInsertSelected = () => {
    if (selected.length === 0) return;
    if (activeTab === 'exames') {
      const examNames = selected.map(item => {
        const part = item.split(/[—–-]| → | \u2192 /)[0].trim();
        return part || item;
      });
      onAppend(`Solicito ${examNames.join(', ')}.`);
    } else {
      onAppend(selected.join('; '));
    }
    setSelected([]);
    setSearchTerm('');
    setOpen(false);
  };

  const currentData = activeTab === 'roteiro' ? EMERGENCIA_DATA : EXAMES_DATA;

  return (
    <>
      <button onClick={() => setOpen(true)}
        title="Sala de Avaliação Cirúrgica (Fast-Track)"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-l-xl border border-r-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <PanelLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl' }}>
          Avaliação Cirúrgica
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex-shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold flex items-center gap-2">
                      <Ambulance className="w-4 h-4 text-amber-400" /> Sala de Avaliação Cirúrgica
                    </h2>
                    <p className="text-xs text-muted-foreground">Fast-Track cirúrgico — todo exame deve responder a uma pergunta clínica e mudar a conduta</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                    ×
                  </button>
                </div>

                <div className="flex gap-1 bg-muted rounded-xl p-1">
                  <button
                    onClick={() => { setActiveTab('roteiro'); setSearchTerm(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'roteiro' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                    <Stethoscope className="w-3.5 h-3.5" /> Roteiro Clínico
                  </button>
                  <button
                    onClick={() => { setActiveTab('exames'); setSearchTerm(''); }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'exames' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}>
                    <FileSpreadsheet className="w-3.5 h-3.5" /> Solicitação de Exames
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-8 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:border-primary/50 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <PanelFavoritesBlock panel="emergencia" onToggle={handleToggle} selectedItems={selected} />
                {Object.entries(currentData).map(([key, section], idx) => (
                  <SectionAccordion
                    key={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    searchTerm={searchTerm}
                    defaultOpen={idx === 0}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    isGroupFavorite={isGroupFavorite}
                    toggleGroupFavorite={toggleGroupFavorite}
                  />
                ))}
                <CustomPanelItems panel="emergencia" title="Avaliação Cirúrgica" onAppend={onAppend}
                  groups={[...Object.values(EMERGENCIA_DATA), ...Object.values(EXAMES_DATA)].flatMap(s => s.groups.map(g => g.label))} />
              </div>

              <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {selected.length > 0
                      ? <><span className="font-bold text-primary">{selected.length}</span> item(s) selecionado(s)</>
                      : 'Clique nos itens para selecionar'}
                  </p>
                  {selected.length > 0 && (
                    <button onClick={handleClearAll}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors font-semibold">
                      Limpar seleção
                    </button>
                  )}
                </div>
                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {selected.map(item => (
                      <span key={item}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={handleInsertSelected} disabled={selected.length === 0}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Inserir selecionados ({selected.length})
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}