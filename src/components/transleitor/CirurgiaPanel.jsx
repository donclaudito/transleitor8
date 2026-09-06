import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelLeft, Search, Scissors, Activity, Stethoscope, ClipboardList, FlaskConical } from 'lucide-react';
import CustomPanelItems from './CustomPanelItems';
import PanelFavoritesBlock from './PanelFavoritesBlock';
import FavoriteStar from './FavoriteStar';
import { usePanelFavorites } from '@/hooks/usePanelFavorites';

const CIRURGIA_DATA = {
  identificacao: {
    label: 'Identificação e PO',
    icon: Scissors,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    ring: 'ring-orange-400/40',
    groups: [
      {
        label: 'Tempo Pós-Operatório',
        items: [
          'PO imediato (1º PO)', '2º PO', '3º PO', '4º PO', '5º PO', '6º PO', '7º PO', 'PO tardio (>7º dia)', 'PO de complications (reoperação)',
        ],
      },
      {
        label: 'Tipo de Procedimento',
        items: [
          'Cirurgia abdominal eletiva', 'Cirurgia abdominal de urgência', 'Videolaparoscopia', 'Laparotomia exploradora', 'Colecistectomia', 'Apendicectomia', 'Hernioplastia inguinal', 'Hernioplastia incisional', 'Ressecção intestinal com anastomose', 'Ressecção intestinal com estomia', 'Colectomia', 'Enterectomia', 'Hemorroidectomia', 'Fistulectomia anal', 'Drenagem de abscesso', 'Esfincterotomia anal', 'Esofagectomia', 'Gastrectomia', 'Pancreatectomia', 'Cirurgia de urgência — abdome agudo',
        ],
      },
    ],
  },
  subjetivo: {
    label: 'Subjetivo (Sinais/Sintomas PO)',
    icon: Activity,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
    ring: 'ring-sky-400/40',
    groups: [
      {
        label: 'Aceitação Alimentar / Dieta',
        items: [
          'Em jejum', 'Dieta hídrica', 'Dieta líquida restrita', 'Dieta pastosa', 'Dieta oral com boa aceitação', 'Dieta oral com baixa aceitação', 'Náuseas referidas', 'Vômitos referidos', 'Plenitude pós-prandial', 'Dispepsia referida',
        ],
      },
      {
        label: 'Dor',
        items: [
          'EVA 0/10 (sem dor)', 'EVA 1–3/10 (leve)', 'EVA 4–6/10 (moderada)', 'EVA 7–10/10 (intensa)', 'Dor em ferida operatória', 'Dor abdominal difusa', 'Dor abdominal localizada', 'Dor à mobilização', 'Solicita analgesia de resgate',
        ],
      },
      {
        label: 'Trânsito e Mobilidade',
        items: [
          'Eliminação de flatus', 'Eliminação de fezes', 'Sem eliminação de flatus (íleo pós-operatório)', 'Constipação', 'Diarreia', 'Ruídos hidroaéreos referidos', 'Diurese espontânea preservada', 'Diurese diminuída', 'Deambulação assistida', 'Deambulação livre', 'Mobilização no leito', 'Repouso no leito',
        ],
      },
    ],
  },
  objetivo: {
    label: 'Objetivo (Exame e Dispositivos)',
    icon: Stethoscope,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ring: 'ring-emerald-400/40',
    groups: [
      {
        label: 'Sinais Vitais',
        items: [
          'Afebril', 'Febril (T > 37,8°C)', 'Normotenso', 'Hipertenso', 'Hipotenso', 'Taquicárdico', 'Bradicárdico', 'Eupneico', 'Taquipneico', 'SpO₂ adequada (>94%)', 'SpO₂ reduzida',
        ],
      },
      {
        label: 'Exame Abdominal',
        items: [
          'RHA presentes e normais', 'RHA ausentes (íleo)', 'RHA diminuídos', 'Abdome flácido e indolor', 'Abdome distendido', 'Dor à palpação difusa', 'Dor à palpação localizada', 'Sinal de Blumberg positivo', 'Macicez à percussão', 'Sinal de piparote positivo', 'Massa palpável',
        ],
      },
      {
        label: 'Ferida Cirúrgica',
        items: [
          'Ferida limpa e seca', 'Ferida com secreção serosa', 'Ferida com secreção purulenta', 'Ferida com secreção serossanguinolenta', 'Sinais flogísticos presentes', 'Deiscência parcial', 'Deiscência total', 'Evisceração', 'Hematoma de ferida', 'Equimose periférica', 'Bom aspecto de portais (videolap)',
        ],
      },
      {
        label: 'Drenos e Sondas',
        items: [
          'Dreno de sucção fechado (Jackson-Pratt)', 'Dreno de Penrose', 'Dreno com débito seroso', 'Dreno com débito serossanguinolento', 'Dreno com débito purulento', 'Dreno com débito bilioso', 'Dreno com débito entérico', 'Dreno sem débito', 'Dreno retirado', 'SNG em drenagem', 'SNG retirada', 'SVD pérvia e funcionante', 'SVD retirada', 'CVC em posição', 'AVP pérvio',
        ],
      },
    ],
  },
  condutas: {
    label: 'Plano e Condutas',
    icon: ClipboardList,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/40',
    groups: [
      {
        label: 'Cuidados de Enfermagem',
        items: [
          'Curativo simples diário', 'Curativo com solução salina', 'Curativo com cobre', 'Curativo oclusivo', 'Balanço hídrico rigoroso', 'Controle rigoroso de diurese', 'Mudança de decúbito de 2/2h', 'Cabeceira elevada 30–45°', 'Estímulo à deambulação', 'Fisioterapia motora', 'Fisioterapia respiratória',
        ],
      },
      {
        label: 'Dietoterapia',
        items: [
          'Manter dieta atual', 'Progressão de dieta', 'Pausa na dieta', 'Dieta oral livre', 'Dieta enteral em andamento', 'Dieta parenteral', 'Avaliação nutricional solicitada',
        ],
      },
      {
        label: 'Solicitação de Exames',
        items: [
          'Hemograma de controle', 'PCR de controle', 'Função renal (ureia/creatinina)', 'Eletrólitos (Na, K, Cl)', 'Gasometria arterial', 'Coagulograma', 'TC de abdome', 'Ultrassonografia de abdome', 'Radiografia de tórax', 'RX simples de abdome', 'Hemoculturas', 'Urocultura',
        ],
      },
      {
        label: 'Pareceres / Interconsultas',
        items: [
          'Interconsulta com Cardiologia', 'Interconsulta com Infectologia', 'Interconsulta com Nutrição', 'Avaliação de Fisioterapia', 'Interconsulta com Nefrologia', 'Interconsulta com Anestesiologia (dor aguda)', 'Avaliação de Serviço Social',
        ],
      },
      {
        label: 'Planejamento de Alta',
        items: [
          'Critérios de alta pendentes', 'Aguarda trânsito intestinal', 'Aguarda aceitação de dieta oral', 'Aguarda desmame de medicação EV', 'Parâmetros de alta atingidos', 'Alta hospitalar hoje', 'Orientações de alta fornecidas', 'Retorno ambulatorial agendado', 'Prescrição de saída',
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

export default function CirurgiaPanel({ onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { isFavorite, toggleFavorite, isGroupFavorite, toggleGroupFavorite } = usePanelFavorites('cirurgia');

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
        title="Cirurgia Geral / Aparelho Digestivo"
        className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-r-xl border border-l-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <PanelLeft className="w-4 h-4" />
        <span className="text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl' }}>
          Cirurgia
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
                      <Scissors className="w-4 h-4 text-orange-400" /> Cirurgia Geral & Aparelho Digestivo
                    </h2>
                    <p className="text-xs text-muted-foreground">Evolução pós-operatória — selecione itens para inserir na descrição</p>
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
                    placeholder="Buscar itens pós-operatórios..."
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
                <PanelFavoritesBlock panel="cirurgia" onToggle={handleToggle} selectedItems={selected} />
                {Object.entries(CIRURGIA_DATA).map(([key, section]) => (
                  <SectionAccordion
                    key={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    searchTerm={searchTerm}
                    defaultOpen={key === 'identificacao'}
                    isFavorite={isFavorite}
                    toggleFavorite={toggleFavorite}
                    isGroupFavorite={isGroupFavorite}
                    toggleGroupFavorite={toggleGroupFavorite}
                  />
                ))}
                <CustomPanelItems panel="cirurgia" title="Cirurgia" onAppend={onAppend}
                  groups={Object.values(CIRURGIA_DATA).flatMap(s => s.groups.map(g => g.label))} />
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