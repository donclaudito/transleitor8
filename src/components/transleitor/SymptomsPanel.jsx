import React, { useState } from 'react';
import { ChevronDown, ChevronRight, PanelRight, PanelRightClose, Plus } from 'lucide-react';

const SYMPTOMS_DATA = {
  subjetivo: {
    label: 'S — Subjetivo',
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    ring: 'ring-blue-400/40',
    groups: [
      {
        label: 'Queixa Principal',
        items: ['Dor torácica', 'Dispneia', 'Palpitações', 'Síncope / pré-síncope', 'Cefaleia', 'Tontura', 'Náuseas / vômitos', 'Dor abdominal', 'Febre', 'Calafrios', 'Astenia / fraqueza', 'Perda de peso', 'Edema de MMII', 'Tosse', 'Expectoração', 'Hemoptise', 'Disfagia', 'Hematêmese', 'Hematoquezia', 'Melena', 'Disúria', 'Hematúria', 'Alteração do nível de consciência'],
      },
      {
        label: 'Caracterização da Dor',
        items: ['Dor em aperto', 'Dor em queimação', 'Dor em facada', 'Dor em cólica', 'Dor em peso', 'Dor irradiada para MSE', 'Dor irradiada para mandíbula', 'Dor pleurítica (piora à inspiração)', 'Dor postural', 'Início súbito', 'Início gradual', 'Melhora com repouso', 'Piora ao esforço', 'Piora ao decúbito', 'Melhora com posição fetal'],
      },
      {
        label: 'Sintomas Associados',
        items: ['Sudorese fria', 'Palidez relatada', 'Cianose', 'Ortopneia', 'DPN (dispneia paroxística noturna)', 'Intolerância ao exercício', 'Hiporexia / anorexia', 'Polidipsia', 'Poliúria', 'Constipação', 'Diarreia', 'Icterícia', 'Prurido', 'Artralgia', 'Mialgia', 'Rash cutâneo', 'Confusão mental / desorientação', 'Afasia'],
      },
      {
        label: 'Evolução (retorno)',
        items: ['Melhora dos sintomas', 'Piora dos sintomas', 'Sem alteração clínica', 'Novo sintoma desde última consulta', 'Boa adesão medicamentosa', 'Baixa adesão medicamentosa', 'Efeitos adversos referidos'],
      },
    ],
  },
  objetivo: {
    label: 'O — Objetivo',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    ring: 'ring-emerald-400/40',
    groups: [
      {
        label: 'Estado Geral',
        items: ['BEG (bom estado geral)', 'REG (regular estado geral)', 'MEG (mau estado geral)', 'Consciente e orientado (4/4)', 'Sonolento', 'Torporoso', 'Agitado', 'Glasgow 15', 'Cooperativo', 'Eupneico', 'Taquipneico', 'Bradipneico', 'Em uso de O₂'],
      },
      {
        label: 'Sinais Vitais',
        items: ['Afebril', 'Febril (T > 37,8°C)', 'Hipotenso', 'Normotenso', 'Hipertenso', 'Taquicárdico', 'Bradicárdico', 'FC regular', 'FC irregular', 'SpO₂ adequada', 'SpO₂ reduzida', 'FR aumentada', 'Dor EVA 0/10', 'Dor EVA moderada', 'Dor EVA intensa'],
      },
      {
        label: 'Exame Cardiovascular',
        items: ['RCR 2T sem sopros', 'RCR 2T com sopro sistólico', 'RCR 3T', 'B3 presente', 'B4 presente', 'Turgência jugular (TJ) ausente', 'TJ presente (+/++/+++)', 'Pulsos periféricos cheios', 'Pulsos periféricos finos', 'Perfusão capilar < 2s', 'Perfusão capilar > 3s', 'Edema MMII (+/++/++/++++)', 'Ausência de edema', 'Pressão de pulso convergente', 'Pressão de pulso divergente'],
      },
      {
        label: 'Exame Respiratório',
        items: ['MV universalmente presente', 'MV diminuído à direita', 'MV diminuído à esquerda', 'Crepitantes bibasais', 'Crepitantes à direita', 'Crepitantes à esquerda', 'Sibilos difusos', 'Roncos', 'Egofonia presente', 'FTV aumentado', 'FTV diminuído', 'Submacicez à percussão', 'Macicez à percussão', 'Taquipneia (FR > 20 irpm)', 'Uso de musculatura acessória', 'Tiragem intercostal'],
      },
      {
        label: 'Exame Abdominal',
        items: ['Abdome plano', 'Abdome globoso', 'Abdome escavado', 'RHA presentes e normais', 'RHA aumentados', 'RHA ausentes', 'Flácido e indolor à palpação', 'Dor à palpação em FID', 'Dor à palpação em HD', 'Dor à palpação em epigástrio', 'Sinal de Blumberg positivo', 'Sinal de Murphy positivo', 'Hepatomegalia palpável', 'Esplenomegalia palpável', 'Macicez de flancos', 'Sinal do piparote positivo', 'Peristaltismo visível'],
      },
      {
        label: 'Exame Neurológico',
        items: ['Pupilas isocóricas e fotorreagentes', 'Anisocoria', 'Força preservada em 4 membros', 'Hemiparesia direita', 'Hemiparesia esquerda', 'Paraparesia', 'Reflexos presentes e simétricos', 'Babinski ausente', 'Babinski presente à direita', 'Babinski presente à esquerda', 'Sensibilidade preservada', 'Rigidez de nuca ausente', 'Rigidez de nuca presente', 'Ataxia presente', 'Disdiadococinesia'],
      },
    ],
  },
  observacoes: {
    label: 'P — Observações de Visita',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    ring: 'ring-amber-400/40',
    groups: [
      {
        label: 'Drenos',
        items: [
          'Dreno em sítio cirúrgico — funcionante', 'Dreno com débito seroso', 'Dreno com débito serossanguinolento', 'Dreno com débito sanguinolento', 'Dreno com débito bilioso', 'Dreno com débito purulento', 'Dreno com débito reduzido', 'Dreno sem débito nas últimas 24h', 'Dreno retirado sem intercorrências', 'Dreno de tórax (dreno pleural) — funcionante', 'Dreno de tórax — borbulhamento presente', 'Dreno de tórax — sem borbulhamento', 'Dreno de tórax retirado — RX solicitado',
        ],
      },
      {
        label: 'Sondas',
        items: [
          'SVD (sonda vesical de demora) — pervie e funcionante', 'SVD com diurese clara', 'SVD com diurese turva', 'SVD com hematúria', 'SVD retirada', 'SNE (sonda nasoenteral) — em posição e funcionante', 'SNE com dieta em andamento', 'SNE com resíduo gástrico aumentado', 'SNE retirada', 'SNG (sonda nasogástrica) — em posição', 'SNG em drenagem', 'SNG com débito bilioso', 'SNG retirada',
        ],
      },
      {
        label: 'Curativos',
        items: [
          'Curativo realizado — ferida limpa e seca', 'Curativo realizado — ferida com secreção serosa', 'Curativo realizado — ferida com secreção purulenta', 'Curativo realizado — ferida com deiscência parcial', 'Curativo realizado — ferida com deiscência total', 'Curativo realizado — sinais flogísticos presentes', 'Ferida cirúrgica com bom aspecto', 'Ferida com necrose presente', 'Ferida com tecido de granulação', 'Ferida com epitelização em curso', 'Úlcera por pressão — avaliada e tratada', 'Curativo de acesso vascular periférico — sem sinais flogísticos', 'Curativo de CVC — sem sinais de infecção',
        ],
      },
      {
        label: 'Retirada de Pontos',
        items: [
          'Retirada de pontos realizada — ferida com boa cicatrização', 'Retirada de pontos parcial', 'Retirada de pontos adiada — ferida com deiscência', 'Retirada de pontos adiada — sinais flogísticos presentes', 'Retirada de grampos cirúrgicos realizada', 'Pontos mantidos por mais 48h', 'Pontos retirados sem intercorrências',
        ],
      },
      {
        label: 'Fisioterapia',
        items: [
          'Fisioterapia motora realizada', 'Fisioterapia respiratória realizada', 'Paciente em deambulação assistida', 'Paciente deambulando sem auxílio', 'Paciente em uso de bipap para fisioterapia', 'Paciente realizando exercícios ativos', 'Paciente realizando exercícios passivos', 'Sem condições de fisioterapia no momento', 'Fisioterapia suspensa por piora clínica', 'Transferência de leito realizada com auxílio',
        ],
      },
      {
        label: 'Interconsultas',
        items: [
          'Interconsulta com Cardiologia — solicitada', 'Interconsulta com Cardiologia — realizada', 'Interconsulta com Neurologia — solicitada', 'Interconsulta com Neurologia — realizada', 'Interconsulta com Nefrologia — solicitada', 'Interconsulta com Infectologia — solicitada', 'Interconsulta com Infectologia — realizada', 'Interconsulta com Cirurgia — solicitada', 'Interconsulta com Cirurgia — realizada', 'Interconsulta com Gastroenterologia — solicitada', 'Interconsulta com Psiquiatria — solicitada', 'Interconsulta com Nutrição — realizada', 'Interconsulta com Serviço Social — realizada', 'Aguardando retorno de interconsulta',
        ],
      },
      {
        label: 'Alta Hospitalar',
        items: [
          'Critérios de alta preenchidos', 'Alta prevista para hoje', 'Alta adiada — aguardando resultado de exame', 'Alta adiada — instabilidade clínica', 'Alta com encaminhamento para UBS', 'Alta com retorno ambulatorial agendado', 'Alta com prescrição domiciliar realizada', 'Orientações de alta fornecidas ao paciente e familiar', 'Paciente transferido para enfermaria', 'Paciente transferido para UTI', 'Paciente transferido para outro serviço', 'Solicitação de vaga em outro hospital em andamento',
        ],
      },
      {
        label: 'Acesso Vascular',
        items: [
          'AVP (acesso venoso periférico) — pérvio', 'AVP trocado por flebite', 'CVC (cateter venoso central) — em posição e pérvio', 'CVC com sinais de infecção — reavaliado', 'CVC retirado sem intercorrências', 'PICC em posição e funcionante', 'PAI (pressão arterial invasiva) — monitorando', 'PAI retirada', 'Acesso arterial — coletado gasometria',
        ],
      },
      {
        label: 'Dieta e Nutrição',
        items: [
          'Dieta oral liberada', 'Dieta oral suspensa — risco de broncoaspiração', 'Dieta enteral em andamento', 'Dieta parenteral em andamento', 'Paciente em jejum', 'Jejum pré-operatório', 'Paciente com boa aceitação da dieta', 'Paciente com baixa aceitação da dieta', 'Nutrição parenteral total iniciada', 'Avaliação nutricional realizada pela equipe',
        ],
      },
    ],
  },
};

function AccordionGroup({ group, selectedItems, onToggle, colorClasses }) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.items.filter(i => selectedItems.includes(i)).length;

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
          {group.items.map(item => {
            const active = selectedItems.includes(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  active
                    ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.color} ring-1 ${colorClasses.ring}`
                    : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                }`}>
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

function SectionAccordion({ sectionKey, section, selectedItems, onToggle }) {
  const [open, setOpen] = useState(sectionKey === 'subjetivo');
  const totalSelected = section.groups.flatMap(g => g.items).filter(i => selectedItems.includes(i)).length;

  return (
    <div className={`rounded-xl border ${section.border} overflow-hidden`}>
      <button onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${section.bg} transition-colors`}>
        <span className={`text-xs font-extrabold uppercase tracking-wider ${section.color}`}>{section.label}</span>
        <div className="flex items-center gap-2">
          {totalSelected > 0 && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 ${section.color}`}>
              {totalSelected} selecionado{totalSelected !== 1 ? 's' : ''}
            </span>
          )}
          {open ? <ChevronDown className={`w-4 h-4 ${section.color}`} /> : <ChevronRight className={`w-4 h-4 ${section.color}`} />}
        </div>
      </button>
      {open && (
        <div className="p-2 space-y-1.5 bg-card/40">
          {section.groups.map(g => (
            <AccordionGroup key={g.label} group={g} selectedItems={selectedItems} onToggle={onToggle}
              colorClasses={{ bg: section.bg, border: section.border, color: section.color, ring: section.ring }} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SymptomsPanel({ onAppend }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);

  const handleToggle = (item) => {
    const isRemoving = selected.includes(item);
    setSelected(prev => isRemoving ? prev.filter(i => i !== item) : [...prev, item]);
    if (!isRemoving) {
      onAppend(item);
    }
  };

  const handleClearAll = () => {
    setSelected([]);
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(!open)}
        title={open ? 'Fechar painel de sintomas' : 'Sinais e Sintomas'}
        className={`fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-l-xl border border-r-0 border-border shadow-lg transition-all duration-300 ${
          open ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground hover:text-foreground hover:bg-accent'
        }`}>
        <span className="writing-mode-vertical text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          Sintomas
        </span>
        {open ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
      </button>

      {/* Panel */}
      <div className={`fixed right-0 top-0 h-full z-20 flex flex-col transition-all duration-300 ease-in-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`} style={{ width: '320px' }}>
        <div className="h-full flex flex-col bg-card border-l border-border shadow-2xl mt-[64px]">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-sm font-extrabold">Sinais & Sintomas</h2>
              <p className="text-xs text-muted-foreground">Selecione para inserir na descrição</p>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {Object.entries(SYMPTOMS_DATA).map(([key, section]) => (
              <SectionAccordion
                key={key}
                sectionKey={key}
                section={section}
                selectedItems={selected}
                onToggle={handleToggle}
              />
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {selected.length > 0
                  ? <><span className="font-bold text-primary">{selected.length}</span> item(s) inserido(s)</>
                  : 'Clique nos itens para inserir'}
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
                  <span key={item} onClick={() => handleToggle(item)}
                    className="cursor-pointer px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all">
                    {item} ×
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {open && <div className="fixed inset-0 z-10 bg-black/20 backdrop-blur-sm" onClick={() => setOpen(false)} />}
    </>
  );
}