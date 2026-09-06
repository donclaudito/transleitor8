import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeft, Search, ShieldAlert, Activity, Stethoscope, ClipboardList, FlaskConical, Ambulance, AlertTriangle } from 'lucide-react';
import CustomPanelItems from './CustomPanelItems';
import PanelFavoritesBlock from './PanelFavoritesBlock';
import FavoriteStar from './FavoriteStar';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';

const PS_DATA = {
  abcde: {
    label: 'ABCDE com Olhar Cirúrgico',
    icon: Ambulance,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-400/40',
    groups: [
      {
        label: 'A/B — Vias Aéreas e Respiração',
        items: [
          'Vias aéreas pérvias', 'Risco de TEP (pós-op tardio)', 'Suspeita de pneumotórax', 'Suspeita de derrame pleural', 'SpO₂ adequada (>94%)', 'SpO₂ reduzida', 'Dispneia', 'Taquipneia',
        ],
      },
      {
        label: 'C — Circulação / Choque',
        items: [
          'Hemodinamicamente estável', 'Choque hipovolêmico/hemorrágico (sangramento tardio)', 'Choque séptico (vazamento/isquemia/infecção profunda)', 'Hipotenso', 'Taquicárdico', 'Extremidades frias', 'Tempo de reposição capilar prolongado',
        ],
      },
      {
        label: 'D — Neurológico',
        items: [
          'Lúcido e orientado', 'Alteração do nível de consciência (alerta sepse/hipóxia)', 'Confusão mental', 'Sedado/intubado', 'Suspeita de distúrbio hidroeletrolítico (hiponatremia)',
        ],
      },
      {
        label: 'E — Exposição (FERIDA)',
        items: [
          'Curativo removido e ferida examinada', 'Ferida aparentemente íntegra', 'Ferida com secreção', 'Curativo empapado', 'Necessita avaliação imediata da ferida',
        ],
      },
    ],
  },
  anamnese: {
    label: 'Anamnese Cirúrgica Relâmpago',
    icon: Activity,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'ring-violet-400/40',
    groups: [
      {
        label: 'DPO e Tipo de Cirurgia',
        items: [
          'DPO 1–2 (sangramento/infarto)', 'DPO 3–4', 'DPO 5–7 (vazamento anastomótico/infecção)', 'DPO 8–14', 'DPO 30+ (obstrução por bridas/aderências, hérnia incisional)', 'Cirurgia abdominal', 'Cirurgia torácica', 'Cirurgia vascular', 'Cirurgia ortopédica', 'Epicrise/boletim cirúrgico em mãos',
        ],
      },
      {
        label: 'Sintoma Sentinela',
        items: [
          'Dor que mudou de padrão', 'Febre nova', 'Vômitos biliosos', 'Vômitos fecaloides', 'Sangramento no curativo', 'Sangramento retal', 'Parou de eliminar gases', 'Parou de eliminar fezes', 'Distensão abdominal',
        ],
      },
    ],
  },
  catastrofas: {
    label: 'Catástrofes Cirúrgicas (Exame Físico)',
    icon: Stethoscope,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    ring: 'ring-orange-400/40',
    groups: [
      {
        label: 'Deiscência/Evisceração',
        items: [
          'Ferida íntegra', 'Deiscência parcial', 'Deiscência de aponeurose', 'Evisceração (alças expostas)', 'Secreção serossanguinolenta abundante ("sinal da água de carne")', 'Cobrir com soro fisiológico estéril → CC imediato',
        ],
      },
      {
        label: 'Peritonite / Abdome Agudo',
        items: [
          'Abdome flácido e indolor', 'Defesa abdominal', 'Sinal de Blumberg positivo', 'Dor à descompressão brusca', 'Abdome em tábua', 'Sinais sutis (idoso/imunossuprimido)',
        ],
      },
      {
        label: 'Estoma / Isquemia',
        items: [
          'Estoma róseo/vermelho (bom)', 'Estoma pálido', 'Estoma roxo/negro (isquemia)', 'Reabordagem urgente indicada',
        ],
      },
      {
        label: 'ISC Profunda / Hematoma',
        items: [
          'Febre alta', 'Dor intensa na ferida', 'Eritema de expansão rápida', 'Crepitação (gás nos tecidos)', 'Saída de pus/fezes pela ferida', 'Hematoma expansivo', 'Hematoma em pescoço (risco de via aérea)', 'Hematoma em cirurgia vascular',
        ],
      },
    ],
  },
  exames: {
    label: 'Exames para Decisão Rápida',
    icon: FlaskConical,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    ring: 'ring-cyan-400/40',
    groups: [
      {
        label: 'Imagem',
        items: [
          'RX abdome em pé (pneumoperitônio)', 'RX abdome em pé (níveis hidroaéreos/obstrução)', 'TC com contraste (padrão-ouro)', 'TC com coleção/abscesso', 'TC com vazamento', 'TC com isquemia de alça', 'TC com TVP/trombose mesentérica',
        ],
      },
      {
        label: 'Laboratório (agressão sistêmica)',
        items: [
          'Lactato elevado', 'Hemoglobina em queda', 'Leucocitose', 'PCR elevada', 'Função renal alterada', 'Gasometria com acidose',
        ],
      },
    ],
  },
  desfecho: {
    label: 'A Grande Decisão do PS',
    icon: ClipboardList,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/40',
    groups: [
      {
        label: 'Classificação de Risco',
        items: [
          'Emergência / Centro Cirúrgico imediato (evisceração, sangramento ativo instável, isquemia, peritonite generalizada)', 'Internação (enfermaria/UTI) — estável com complicação (ATB EV, NP, drenagem percutânea)', 'Alta com retorno garantido (complicação menor: infecção superficial, constipação leve)',
        ],
      },
      {
        label: 'Comunicação',
        items: [
          'Ligar para o cirurgião que operou (anatomia distorcida/pontos fracos)', 'Comunicar família sobre risco e conduta', 'Documentar achados e decisão',
        ],
      },
    ],
  },
  redflags: {
    label: '⚠️ Mentalidade PS (Momento Atual)',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-400/40',
    groups: [
      {
        label: 'Foco PS vs UTI',
        items: [
          'Olhar o MOMENTO ATUAL e risco de morte (não tendências)', 'Choque séptico agora? Precisa operar esta noite?', 'Não confiar no relato "ferida limpinha" — examinar',
        ],
      },
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

function AccordionGroup({ group, selectedItems, onToggle, colorClasses, searchTerm, isFavorite, toggleFavorite }) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.items.filter(i => selectedItems.includes(i)).length;
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
            const active = selectedItems.includes(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
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

function SectionAccordion({ section, selectedItems, onToggle, searchTerm, defaultOpen, isFavorite, toggleFavorite }) {
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
          {section.groups.map(g => (
            <AccordionGroup key={g.label} group={g} selectedItems={selectedItems} onToggle={onToggle}
              colorClasses={{ bg: section.bg, border: section.border, color: section.color, ring: section.ring }}
              searchTerm={searchTerm} isFavorite={isFavorite} toggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function PSPanel({ onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isFavorite, toggleFavorite } = usePanelFavorites('ps');

  const handleToggle = (item) => {
    setSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

  const handleClearAll = () => {
    setSelected([]);
    setSearchTerm('');
  };

  const handleInsertSelected = () => {
    if (selected.length === 0) return;
    onAppend(selected.join('; '));
    setSelected([]);
    setSearchTerm('');
    setOpen(false);
  };

  return (
    <>
      <button onClick={() => setOpen(true)}
        title="Visita Cirúrgica no Pronto Socorro"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-l-xl border border-r-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <PanelLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl' }}>
          PS Cirúrgico
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
                      <Ambulance className="w-4 h-4 text-red-400" /> Visita Cirúrgica no Pronto Socorro
                    </h2>
                    <p className="text-xs text-muted-foreground">Triagem rápida, ressuscitação e decisão de reabordagem imediata — paciente pós-operatório</p>
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
                    placeholder="Buscar itens da visita no PS..."
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
                <PanelFavoritesBlock panel="ps" onToggle={handleToggle} selectedItems={selected} />
                {Object.entries(PS_DATA).map(([key, section]) => (
                  <SectionAccordion
                    key={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    searchTerm={searchTerm}
                    defaultOpen={key === 'abcde'}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                  />
                ))}
                <CustomPanelItems panel="ps" title="PS Cirúrgico" onAppend={onAppend} />
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