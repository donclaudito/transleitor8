import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeft, Search, ShieldAlert, Activity, Stethoscope, ClipboardList, FlaskConical, HeartPulse, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import CustomPanelItems from './CustomPanelItems';
import PanelFavoritesBlock from './PanelFavoritesBlock';
import FavoriteStar from './FavoriteStar';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';

const UTI_DATA = {
  ferida: {
    label: 'Ferida Operatória e Sítio Cirúrgico',
    icon: Stethoscope,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    ring: 'ring-orange-400/40',
    groups: [
      {
        label: 'Inspeção da Ferida',
        items: [
          'Ferida limpa e seca', 'Eritema de bordas', 'Calor local', 'Edema excessivo', 'Abertura de pontos/grampo', 'Necrose de bordas', 'Deiscência parcial', 'Deiscência total', 'Evisceração', 'Bom aspecto de portais (videolap)',
        ],
      },
      {
        label: 'Drenos (débito)',
        items: [
          'Dreno sem débito', 'Débito seroso', 'Débito serossanguinolento', 'Débito sanguinolento persistente', 'Débito purulento', 'Débito bilioso', 'Débito entérico', 'Débito com odor fétido', 'Sangramento ativo pelo dreno', 'Dreno retirado',
        ],
      },
      {
        label: 'Palpação Abdominal',
        items: [
          'Abdome flácido e indolor', 'Tensão abdominal aumentada', 'Crepitação subcutânea', 'Massa palpável', 'Coleção suspeita', 'Sinal de Blumberg positivo', 'Dor à palpação localizada', 'Dor à palpação difusa',
        ],
      },
      {
        label: 'Curativos Especiais',
        items: [
          'Abdome aberto (Open Abdomen)', 'Sistema de pressão negativa íntegro', 'Exposição de vísceras', 'Fístula enteroatmosférica', 'Curativo oclusivo simples', 'Curativo com cobre', 'Troca de curativo programada',
        ],
      },
    ],
  },
  anatomia: {
    label: 'Anatomia e Fisiologia da Cirurgia',
    icon: Activity,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    ring: 'ring-violet-400/40',
    groups: [
      {
        label: 'Anastomoses',
        items: [
          'Sem sinais de vazamento anastomótico', 'Taquicardia inexplicada (alerta)', 'Febre sem foco (alerta)', 'Dor abdominal nova', 'Alteração do débito de dreno (alerta)',
        ],
      },
      {
        label: 'Vascularização',
        items: [
          'Estoma com boa perfusão (róseo, quente)', 'Estoma com turgor preservado', 'Estoma pálido (suspeita de isquemia)', 'Estoma escurecido (isquemia)', 'Retalho com boa perfusão', 'Retalho com doppler presente', 'Retalho com doppler ausente', 'Membro reimplantado bem perfundido', 'Membro com perfusão reduzida',
        ],
      },
      {
        label: 'Compartimentos',
        items: [
          'Sem sinais de síndrome compartimental', 'Pressão intravesical elevada (síndrome compartimental abdominal)', 'Tensão de membro aumentada (síndrome compartimental de extremidade)', 'Dor refratária à analgesia em membro (alerta)',
        ],
      },
      {
        label: 'Órgãos Adjacentes',
        items: [
          'Sem lesão iatrogênica aparente', 'Suspeita de lesão ureteral', 'Suspeita de lesão de vias biliares', 'Suspeita de lesão nervosa', 'Débito urinário alterado (alerta lesão)',
        ],
      },
    ],
  },
  dor: {
    label: 'Controle de Dor e Analgesia',
    icon: HeartPulse,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    ring: 'ring-sky-400/40',
    groups: [
      {
        label: 'Caráter da Dor',
        items: [
          'Dor controlada (EVA 0–3/10)', 'Dor moderada (EVA 4–6/10)', 'Dor intensa (EVA 7–10/10)', 'Dor com padrão alterado (alerta)', 'Dor contínua refratária a opioides (alerta isquemia/abscesso/vazamento)', 'Dor em ferida operatória', 'Dor abdominal difusa',
        ],
      },
      {
        label: 'Bloqueios e Cateteres',
        items: [
          'Cateter peridural funcionante', 'Cateter peridural sem débito/alteração', 'Bloqueio de plano funcional', 'Bloqueio de plano com falha', 'Bomba de analgesia em uso',
        ],
      },
      {
        label: 'Impacto Respiratório',
        items: [
          'Expansibilidade torácica preservada', 'Expansibilidade torácica reduzida pela dor', 'Tosse ineficaz por dor', 'Atelectasia associada à dor', 'Necessita ajuste de analgesia para ventilação',
        ],
      },
    ],
  },
  nutricao: {
    label: 'Nutrição e Função Gastrointestinal',
    icon: UtensilsCrossed,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ring: 'ring-emerald-400/40',
    groups: [
      {
        label: 'Trânsito e Íleo',
        items: [
          'RHA presentes e normais', 'RHA diminuídos', 'RHA ausentes (íleo paralítico)', 'Eliminação de flatus', 'Sem eliminação de flatus (íleo pós-operatório)', 'Eliminação de fezes', 'Constipação', 'Diarreia', 'Suspeita de obstrução mecânica precoce',
        ],
      },
      {
        label: 'Tolerância à Dieta',
        items: [
          'Em jejum', 'Dieta hídrica com boa tolerância', 'Dieta oral com boa aceitação', 'Distensão pós-dieta', 'Vômitos após dieta', 'Resíduo gástrico elevado', 'Intolerância à dieta enteral',
        ],
      },
      {
        label: 'Acesso Enteral',
        items: [
          'SNG em drenagem', 'SND posicionada (confirmada por RX)', 'SND posicionada (confirmada por pH)', 'SND com posicionamento a confirmar', 'Dieta enteral em andamento', 'Dieta parenteral em andamento', 'Avaliação nutricional solicitada',
        ],
      },
      {
        label: 'Controle Glicêmico',
        items: [
          'Glicemia controlada (140–180 mg/dL)', 'Glicemia elevada (hiperglicemia)', 'Glicemia baixa (hipoglicemia)', 'Necessita protocolo de insulina ajustado',
        ],
      },
    ],
  },
  profilaxia: {
    label: 'Profilaxia e Prevenção Sistêmica',
    icon: ShieldAlert,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
    border: 'border-teal-500/20',
    ring: 'ring-teal-400/40',
    groups: [
      {
        label: 'Tromboprofilaxia',
        items: [
          'Anticoagulação profilática iniciada (enoxaparina)', 'Anticoagulação profilática suspensa (risco de sangramento)', 'Meias compressivas em uso', 'Compressão pneumática intermitente em uso', 'Risco de sangramento vs. trombose em avaliação',
        ],
      },
      {
        label: 'Antibioticoterapia',
        items: [
          'Antibiótico profilático mantido', 'Antibiótico profilático suspenso (descalonagem)', 'Antibiótico ampliado por foco cirúrgico', 'Necessita descalonagem', 'Uso prolongado injustificado (revisar)',
        ],
      },
      {
        label: 'Mobilização Precoce',
        items: [
          'Paciente deambulando', 'Paciente senta no leito', 'Mobilização no leito', 'Contraindicação ortopédica à mobilização', 'Contraindicação vascular à mobilização', 'Fisioterapia motora em andamento',
        ],
      },
    ],
  },
  exames: {
    label: 'Exames com Olhar Cirúrgico',
    icon: FlaskConical,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    ring: 'ring-cyan-400/40',
    groups: [
      {
        label: 'Imagens (área operada)',
        items: [
          'TC de abdome sem coleções', 'TC de abdome com coleção', 'TC com pneumoperitônio residual', 'TC com novo pneumoperitônio (alerta)', 'Ultrassom sem coleções', 'Ultrassom com coleção', 'Posição de dreno confirmada', 'Radiografia de tórax',
        ],
      },
      {
        label: 'Laboratório (tendências)',
        items: [
          'Hemoglobina estável', 'Queda progressiva de hemoglobina (alerta sangramento)', 'PCR elevado e em ascenso após 3º PO (alerta)', 'PCR em queda (resposta favorável)', 'Procalcitonina elevada (alerta sepse)', 'Lactato elevado (alerta isquemia)', 'Acidose metabólica (alerta)',
        ],
      },
    ],
  },
  comunicacao: {
    label: 'Comunicação e Planejamento',
    icon: ClipboardList,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/40',
    groups: [
      {
        label: 'Alinhamento com Intensivista',
        items: [
          'Metas diárias discutidas com intensivista', 'Critérios de extubação em avaliação', 'Planejamento de transferência discutido', 'Divergência de conduta com intensivista registrada',
        ],
      },
      {
        label: 'Família e Documentação',
        items: [
          'Evolução cirúrgica explicada à família', 'Prognóstico funcional discutido', 'Possibilidade de reabordagem informada', 'Achados físicos da ferida registrados', 'Decisões sobre drenos/dieta documentadas', 'Plano cirúrgico futuro registrado',
        ],
      },
    ],
  },
  redflags: {
    label: '🚩 Red Flags — Ação Imediata',
    icon: AlertTriangle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    ring: 'ring-red-400/40',
    groups: [
      {
        label: 'Sinais de Alerta Cirúrgico',
        items: [
          'Taquicardia persistente (>100–110 bpm) sem causa óbvia (vazamento/sepsa)', 'Alteração súbita no débito ou aspecto de drenos', 'Abdômen tenso/rígido', 'Isquemia de estoma', 'Isquemia de extremidade', 'Sangramento ativo não responsivo a correção de coagulopatia',
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
    if (t[ti] === q[ti]) qi++;
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

export default function UTIPanel({ onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite } = usePanelFavorites('uti');

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
        title="Visita Cirúrgica em UTI"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-l-xl border border-r-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <PanelLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl' }}>
          UTI Cirúrgica
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
                      <HeartPulse className="w-4 h-4 text-red-400" /> Visita Cirúrgica em UTI
                    </h2>
                    <p className="text-xs text-muted-foreground">Foco na integridade da cirurgia, evolução anatômica e detecção precoce de complicações técnicas</p>
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
                    placeholder="Buscar itens da visita cirúrgica..."
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
                <PanelFavoritesBlock panel="uti" onToggle={handleToggle} selectedItems={selected} />
                {Object.entries(UTI_DATA).map(([key, section]) => (
                  <SectionAccordion
                    key={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    searchTerm={searchTerm}
                    defaultOpen={key === 'ferida'}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    isGroupFavorite={isGroupFavorite}
                    toggleGroupFavorite={toggleGroupFavorite}
                  />
                ))}
                <CustomPanelItems panel="uti" title="UTI Cirúrgica" onAppend={onAppend}
                  groups={Object.values(UTI_DATA).flatMap(s => s.groups.map(g => g.label))} />
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