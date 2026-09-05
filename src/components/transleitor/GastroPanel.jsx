import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeft, Search, Stethoscope, FlaskConical } from 'lucide-react';

const GASTRO_DATA = {
  patologias: {
    label: 'Patologias Comuns',
    icon: Stethoscope,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    ring: 'ring-teal-400/40',
    groups: [
      {
        label: 'Esôfago e Estômago',
        items: [
          'Doença do Refluxo Gastroesofágico (DRGE)', 'Esofagite erosiva', 'Esofagite eosinofílica', 'Acalasia', 'Hérnia hiatal', 'Úlcera péptica gástrica', 'Úlcera péptica duodenal', 'Gastrite aguda', 'Gastrite crônica atrófica', 'Infecção por Helicobacter pylori', 'Dispepsia funcional', 'Gastroparesia', 'Sangramento digestivo alto — úlcera', 'Sangramento digestivo alto — varizes',
        ],
      },
      {
        label: 'Intestino Delgado e Grosso',
        items: [
          'Doença de Crohn', 'Retocolite Ulcerativa (RCU)', 'Síndrome do Intestino Irritável (SII)', 'Constipação crônica', 'Diarreia aguda infecciosa', 'Diarreia crônica', 'Doença celíaca', 'Intolerância à lactose', 'SIBO (supercrecimento bacteriano)', 'Diverticulose / diverticulite', 'Pólipo colorretal', 'Câncer colorretal', 'Colite isquêmica', 'Megacólon tóxico', 'Sangramento digestivo baixo — hemorroidas', 'Sangramento digestivo baixo — pólipo',
        ],
      },
      {
        label: 'ânus e Reto',
        items: [
          'Hemorroidas', 'Fissura anal', 'Fístula anal', 'Abscesso perianal', 'Prolapso retal', 'Plicoma anal', 'Prurido anal', 'Incontinência anal', 'Doença pilonidal', 'Condiloma anal (HPV)', 'Câncer anal',
        ],
      },
      {
        label: 'Fígado, Vias Biliares e Pâncreas',
        items: [
          'Esteatose hepática não alcoólica (DHGNA/NAFLD)', 'Hepatite viral (B/C)', 'Cirrose hepática', 'Hipertensão portal', 'Colelitíase', 'Colecistite aguda', 'Colangite', 'Pancreatite aguda', 'Pancreatite crônica', 'Colangiocarcinoma', 'Câncer de pâncreas', 'Tumor de Klatskin',
        ],
      },
    ],
  },
  exames: {
    label: 'Exames — Anexados e Solicitados',
    icon: FlaskConical,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'ring-violet-400/40',
    groups: [
      {
        label: 'Endoscopia',
        items: [
          'Endoscopia digestiva alta (EDA)', 'Endoscopia com biópsia', 'Endoscopia terapêutica (mucosectomia)', 'Retossigmoidoscopia', 'Colonoscopia', 'Colonoscopia com polipectomia', 'Cromoscopia com índigo carmim', 'CPRE (colangiopancreatografia retrógrada endoscópica)', 'EUS (ultrassonografia endoscópica)', 'pHmetria esofágica de 24h', 'Manometria esofágica', 'Manometria anorretal',
        ],
      },
      {
        label: 'Imagem',
        items: [
          'Ultrassonografia de abdome total', 'Ultrassonografia com Doppler de veia porta', 'Tomografia de abdome e pelve', 'Ressonância de abdome', 'Colangio-RM (ressonância das vias biliares)', 'Tomografia de fígado com contraste', 'RX simples de abdome', 'Enema opaco', 'Trânsito intestinal', 'Defecografia',
        ],
      },
      {
        label: 'Laboratoriais',
        items: [
          'Hemograma completo', 'Função hepática (TGO, TGP, GGT, FA, bilirrubinas)', 'Coagulograma (TP, TTPA, INR)', 'Amilase e lipase séricas', 'Função renal (ureia e creatinina)', 'Glicemia de jejum e HbA1c', 'Albumina e proteínas totais', 'Ferro, ferritina e saturação', 'Sorologia para H. pylori (antígeno fecal)', 'Sorologias virais (HBsAg, Anti-HCV)', 'Alfa-fetoproteína (AFP)', 'CA 19-9', 'CEA (antígeno carcinoembrionário)', 'Calprotectina fecal', 'Pesquisa de sangue oculto nas fezes', 'Coprocultura e coproparasitológico', 'Pesquisa de gordura nas fezes', 'Teste respiratório de ureia (C13)', 'Teste de intolerância à lactose (H2)',
        ],
      },
    ],
  },
};

const EXAM_ITEMS = new Set(GASTRO_DATA.exames.groups.flatMap(g => g.items));

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

function AccordionGroup({ group, selectedItems, onToggle, onToggleType, allowTypeToggle, colorClasses, searchTerm }) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.items.filter(i => selectedItems[i]).length;
  const filteredItems = group.items.filter(item => fuzzyMatch(item, searchTerm));
  if (filteredItems.length === 0) return null;

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-muted/50 transition-colors">
        <span className="text-xs font-bold text-foreground/80">{group.label}</span>
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
        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1.5 border-t border-border bg-muted/20">
          {filteredItems.map(item => {
            const active = !!selectedItems[item];
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  active
                    ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.color} ring-1 ${colorClasses.ring}`
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                }`}>
                {active && <span className="mr-1">✓</span>}
                {item}
                {active && allowTypeToggle && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggleType(item); }}
                    className={`ml-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase border transition-colors ${
                      selectedItems[item] === 'anexado'
                        ? 'bg-violet-500/25 border-violet-400/40 text-violet-300'
                        : 'bg-amber-500/20 border-amber-400/40 text-amber-400'
                    }`}>
                    {selectedItems[item] === 'anexado' ? 'Anexado' : 'Solicitado'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionAccordion({ section, selectedItems, onToggle, onToggleType, allowTypeToggle, searchTerm, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const totalSelected = section.groups.flatMap(g => g.items).filter(i => selectedItems[i]).length;
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
          {section.groups.map(g => (
            <AccordionGroup key={g.label} group={g} selectedItems={selectedItems} onToggle={onToggle}
              onToggleType={onToggleType} allowTypeToggle={allowTypeToggle}
              colorClasses={{ bg: section.bg, border: section.border, color: section.color, ring: section.ring }}
              searchTerm={searchTerm} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GastroPanel({ onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (item) => {
    setSelected(prev => {
      if (prev[item]) { const next = { ...prev }; delete next[item]; return next; }
      return { ...prev, [item]: EXAM_ITEMS.has(item) ? 'solicitado' : 'patologia' };
    });
  };

  const handleToggleExamType = (item) => {
    setSelected(prev => prev[item] === 'anexado'
      ? { ...prev, [item]: 'solicitado' }
      : prev[item] === 'solicitado' ? { ...prev, [item]: 'anexado' } : prev);
  };

  const handleClearAll = () => {
    setSelected({});
    setSearchTerm('');
  };

  const handleInsertSelected = () => {
    const entries = Object.entries(selected);
    if (entries.length === 0) return;
    const patologias = entries.filter(([, t]) => t === 'patologia').map(([item]) => item);
    const anexados = entries.filter(([, t]) => t === 'anexado').map(([item]) => item);
    const solicitados = entries.filter(([, t]) => t === 'solicitado').map(([item]) => item);
    const parts = [];
    if (patologias.length) parts.push(patologias.join('; '));
    if (anexados.length) parts.push(`Exames anexados: ${anexados.join('; ')}`);
    if (solicitados.length) parts.push(`Exames solicitados: ${solicitados.join('; ')}`);
    onAppend(parts.join('; '));
    setSelected({});
    setSearchTerm('');
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        title="Gastroenterologia / Coloproctologia"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-r-xl border border-l-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <PanelLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl' }}>
          Gastro
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
                      <Stethoscope className="w-4 h-4 text-teal-400" /> Gastroenterologia & Coloproctologia
                    </h2>
                    <p className="text-xs text-muted-foreground">Selecione patologias e exames; classifique cada exame como Anexado ou Solicitado</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                    ×
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar patologias e exames..."
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
                {Object.entries(GASTRO_DATA).map(([key, section]) => (
                  <SectionAccordion
                    key={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    onToggleType={handleToggleExamType}
                    allowTypeToggle={key === 'exames'}
                    searchTerm={searchTerm}
                    defaultOpen={key === 'patologias'}
                  />
                ))}
              </div>

              <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {Object.keys(selected).length > 0
                      ? <><span className="font-bold text-primary">{Object.keys(selected).length}</span> item(s) selecionado(s)</>
                      : 'Clique nos itens para selecionar'}
                  </p>
                  {Object.keys(selected).length > 0 && (
                    <button onClick={handleClearAll}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors font-semibold">
                      Limpar seleção
                    </button>
                  )}
                </div>
                {Object.keys(selected).length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {Object.entries(selected).map(([item, type]) => (
                      <span key={item}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          type === 'anexado'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/25'
                            : type === 'solicitado'
                              ? 'bg-amber-500/10 text-amber-500 border-amber-500/25'
                              : 'bg-primary/10 text-primary border-primary/20'
                        }`}>
                        {type === 'anexado' ? '📄 ' : type === 'solicitado' ? '🆕 ' : ''}{item}
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={handleInsertSelected} disabled={Object.keys(selected).length === 0}
                  className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  Inserir selecionados ({Object.keys(selected).length})
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}