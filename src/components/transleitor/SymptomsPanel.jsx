import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, PanelRight, Search, Sparkles } from 'lucide-react';

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
      {
        label: 'Solicitação de Exames Laboratoriais',
        items: [
          'Hemograma completo', 'PCR (proteína C reativa)', 'VHS', 'Procalcitonina', 'Lactato sérico', 'Hemocultura — 2 amostras coletadas', 'Urocultura com antibiograma', 'Cultura de secreção de ferida', 'Gasometria arterial', 'Gasometria venosa', 'Eletrólitos (Na, K, Cl, Mg, Ca, P)', 'Função renal (ureia e creatinina)', 'TFGe calculada', 'Função hepática (TGO, TGP, GGT, FA, bilirrubinas)', 'Coagulograma (TP, TTPA, INR)', 'Fibrinogênio', 'D-dímero', 'Troponina I / T', 'CK e CK-MB', 'BNP / NT-proBNP', 'TSH e T4 livre', 'Glicemia de jejum', 'HbA1c', 'Lipidograma completo', 'Ácido úrico', 'Albumina sérica', 'Proteínas totais e frações', 'Amilase e lipase', 'Urina rotina (EAS)', 'β-HCG sérico', 'Sorologias (HIV, HBsAg, HCV, VDRL)', 'Nível sérico de medicamento (digoxina, fenitoína, vancomicina)', 'Toxicológico sérico e urinário',
        ],
      },
      {
        label: 'Solicitação de Exames de Imagem',
        items: [
          'Radiografia de tórax PA e perfil', 'Radiografia de tórax portátil (AP)', 'Radiografia de abdome em pé e deitado', 'Radiografia de osso — especificar região', 'Ultrassonografia de abdome total', 'Ultrassonografia de vias urinárias', 'Ultrassonografia Doppler venoso de MMII', 'Ultrassonografia Doppler arterial', 'Ultrassonografia à beira do leito (POCUS)', 'Ecocardiograma transtorácico', 'Ecocardiograma transesofágico', 'TC de crânio sem contraste', 'TC de crânio com contraste', 'TC de tórax sem contraste', 'TC de tórax com contraste (angiotomografia)', 'TC de abdome e pelve com contraste', 'TC de coluna (cervical / torácica / lombar)', 'Angiotomografia de aorta', 'RM de crânio / encéfalo', 'RM de coluna', 'RM de abdome', 'Cintilografia óssea', 'PET-CT solicitado', 'ECG de 12 derivações', 'Holter 24h', 'MAPA 24h', 'Endoscopia digestiva alta (EDA)', 'Colonoscopia', 'Broncoscopia',
        ],
      },
      {
        label: 'Procedimentos Administrativos',
        items: [
          'Solicitação de transferência para hospital de referência', 'Inserção no sistema CROSS — solicitada', 'Inserção no CROSS — aguardando vaga', 'Vaga no CROSS confirmada — aguardando transporte', 'Solicitação de vaga em UTI', 'Solicitação de vaga em enfermaria especializada', 'Regulação médica acionada', 'Transporte médico solicitado (SAMU / regulação)', 'Guia de internação emitida', 'Resumo de alta / Declaração de internação elaborada', 'Solicitação de autorização de procedimento (OPME)', 'Solicitação de autorização de medicamento de alto custo', 'Solicitação de segunda opinião / telemetria', 'Comunicação com plano de saúde realizada', 'Declaração de óbito emitida', 'Comunicado ao NÚCLEO (NIS / Regulação interna)', 'Solicitação de cirurgia agendada / eletiva', 'Cirurgia de urgência agendada', 'Notificação compulsória realizada (SINAN)', 'Comunicação ao MP / conselho tutelar (vulnerabilidade)', 'Avaliação de Serviço Social solicitada', 'Alta a pedido — termo assinado', 'Recusa de procedimento — TCLE documentado',
        ],
      },
      {
        label: 'Orientações de Enfermagem',
        items: [
          'Troca de curativo diária — com registro fotográfico', 'Troca de curativo em dias alternados', 'Curativo oclusivo — manter até nova avaliação', 'Controle de sinais vitais de 4/4h', 'Controle de sinais vitais de 6/6h', 'Controle de sinais vitais de 8/8h', 'Controle de sinais vitais contínuo (monitorização)', 'Controle rigoroso de diurese — medir e anotar', 'Balanço hídrico rigoroso', 'Controle de débito de drenos — anotar volume e aspecto', 'Deambulação assistida 2x ao dia', 'Deambulação livre liberada', 'Repouso relativo no leito', 'Repouso absoluto no leito', 'Mudança de decúbito de 2/2h — prevenção de UPP', 'Elevação do membro inferior para controle de edema', 'Cabeceira elevada a 30–45°', 'Higiene oral rigorosa — 3x ao dia', 'Cuidados com acesso venoso — observar sinais de flebite', 'Aspiração de vias aéreas superiores se necessário', 'Oxigenoterapia conforme saturação — alvo SpO₂ > 94%', 'Glicemia capilar de 6/6h', 'Glicemia capilar pré e pós-prandial', 'Controle de temperatura — antitérmico se T > 37,8°C', 'Comunicar equipe médica se PA < 90x60 ou > 180x110 mmHg', 'Comunicar equipe médica se FC < 50 ou > 120 bpm', 'Comunicar equipe médica se SpO₂ < 92%', 'Comunicar equipe médica se débito urinário < 0,5 mL/kg/h', 'Manter prescrição vigente — sem alterações', 'Administrar medicações conforme prescrição',
        ],
      },
    ],
  },
};

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
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

// Sinônimos: termos leigos → termos médicos
const SYNONYM_MAP = {
  'coracao': ['cardíaco', 'cardiovascular', 'cardio', 'cardíaca', 'sopro', 'FC', 'RCR', 'B3', 'B4', 'jugular', 'pulso', 'perfusão', 'edema', 'ECG', 'Holter', 'MAPA', 'ecocardiograma', 'troponina', 'CK', 'BNP'],
  'corazón': ['cardíaco', 'cardiovascular', 'cardio', 'cardíaca', 'sopro', 'FC', 'RCR', 'B3', 'B4', 'jugular', 'pulso', 'perfusão', 'edema', 'ECG', 'Holter', 'MAPA', 'ecocardiograma', 'troponina', 'CK', 'BNP'],
  'cabeça': ['cefaleia', 'crânio', 'encefálico', 'Glasgow', 'pupila', 'anisocoria', 'consciência', 'desorientação', 'neurológico', 'TC de crânio', 'RM de crânio'],
  'cabeza': ['cefaleia', 'crânio', 'encefálico', 'Glasgow', 'pupila', 'anisocoria', 'consciência', 'desorientação', 'neurológico', 'TC de crânio', 'RM de crânio'],
  'respirar': ['dispneia', 'taquipneia', 'bradipneia', 'eupneico', 'tosse', 'expectoração', 'sibilo', 'crepitante', 'MV', 'FTV', 'oxigenoterapia', 'SpO₂', 'saturação', 'gasometria', 'FR', 'tiragem', 'broncoscopia'],
  'barriga': ['abdome', 'abdominal', 'RHA', 'FID', 'epigástrio', 'Blumberg', 'Murphy', 'hepatomegalia', 'esplenomegalia', 'ascite', 'náusea', 'vômito', 'diarreia', 'constipação', 'dieta', 'jejum', 'nutrição', 'endoscopia', 'colonoscopia', 'USG'],
  'panza': ['abdome', 'abdominal', 'RHA', 'FID', 'epigástrio', 'Blumberg', 'Murphy', 'hepatomegalia', 'esplenomegalia', 'ascite', 'náusea', 'vômito', 'diarreia', 'constipação', 'dieta', 'jejum', 'nutrição', 'endoscopia', 'colonoscopia'],
  'rim': ['renal', 'nefrologia', 'DRC', 'creatinina', 'ureia', 'TFGe', 'diurese', 'SVD', 'hematúria', 'disúria', 'EAS', 'poliúria', 'eletrólitos', 'Na', 'K', 'dialítico'],
  'riñón': ['renal', 'nefrologia', 'DRC', 'creatinina', 'ureia', 'TFGe', 'diurese', 'SVD', 'hematúria', 'disúria', 'EAS', 'poliúria', 'eletrólitos', 'Na', 'K', 'dialítico'],
  'figado': ['hepático', 'TGO', 'TGP', 'GGT', 'FA', 'bilirrubina', 'icterícia', 'hepatomegalia', 'cirrose', 'albumina', 'ascite', 'coagulograma', 'INR', 'TP'],
  'hígado': ['hepático', 'TGO', 'TGP', 'GGT', 'FA', 'bilirrubina', 'icterícia', 'hepatomegalia', 'cirrose', 'albumina', 'ascite', 'coagulograma', 'INR', 'TP'],
  'pulmao': ['pulmonar', 'dispneia', 'tosse', 'expectoração', 'MV', 'crepitante', 'sibilo', 'derrame pleural', 'dreno de tórax', 'gasometria', 'SpO₂', 'broncoscopia', 'TC de tórax', 'RX tórax'],
  'pulmón': ['pulmonar', 'dispneia', 'tosse', 'expectoração', 'MV', 'crepitante', 'sibilo', 'derrame pleural', 'dreno de tórax', 'gasometria', 'SpO₂', 'broncoscopia', 'TC de tórax', 'RX tórax'],
  'pressao': ['PA', 'hipotenso', 'normotenso', 'hipertenso', 'PAI', 'MAPA', 'sinais vitais'],
  'presión': ['PA', 'hipotenso', 'normotenso', 'hipertenso', 'PAI', 'MAPA', 'sinais vitais'],
  'açucar': ['glicemia', 'glicose', 'HGT', 'dextro', 'hipoglicemia', 'hiperglicemia', 'HbA1c', 'DM', 'diabetes', 'polidipsia', 'poliúria'],
  'azúcar': ['glicemia', 'glicose', 'HGT', 'dextro', 'hipoglicemia', 'hiperglicemia', 'HbA1c', 'DM', 'diabetes', 'polidipsia', 'poliúria'],
  'sangue': ['hemograma', 'hematêmese', 'hematoquezia', 'melena', 'hemoptise', 'hemorrágico', 'sangramento', 'equimose', 'anemia', 'coagulograma', 'INR', 'TP', 'TTPA', 'plaqueta', 'hemocultura'],
  'sangre': ['hemograma', 'hematêmese', 'hematoquezia', 'melena', 'hemoptise', 'hemorrágico', 'sangramento', 'equimose', 'anemia', 'coagulograma', 'INR', 'TP', 'TTPA', 'plaqueta', 'hemocultura'],
  'pele': ['rash', 'icterícia', 'palidez', 'cianose', 'prurido', 'ferida', 'curativo', 'deiscência', 'necrose', 'granulação', 'úlcera', 'UPP'],
  'piel': ['rash', 'icterícia', 'palidez', 'cianose', 'prurido', 'ferida', 'curativo', 'deiscência', 'necrose', 'granulação', 'úlcera', 'UPP'],
  'remedio': ['medicação', 'prescrição', 'adesão medicamentosa', 'antibiótico', 'ceftriaxona', 'vancomicina', 'meropenem', 'nível sérico'],
  'perna': ['MMII', 'edema', 'deambulação', 'panturrilha', 'TVP', 'Doppler'],
  'pierna': ['MMII', 'edema', 'deambulação', 'panturrilha', 'TVP', 'Doppler'],
  'cancer': ['oncológico', 'tumor', 'neoplasia', 'quimioterapia', 'radioterapia', 'metástase', 'cuidados paliativos', 'PET-CT', 'biópsia'],
  'cáncer': ['oncológico', 'tumor', 'neoplasia', 'quimioterapia', 'radioterapia', 'metástase', 'cuidados paliativos', 'PET-CT', 'biópsia'],
  'visita': ['dreno', 'sonda', 'curativo', 'fisioterapia', 'interconsulta', 'alta', 'dieta', 'acesso vascular', 'CVC', 'AVP', 'enfermagem'],
};

function expandSearchTerm(term) {
  if (!term) return [];
  const n = normalize(term);
  // Busca exata no mapa
  if (SYNONYM_MAP[n]) return SYNONYM_MAP[n];
  // Busca parcial: se o termo digitado é substring de alguma chave
  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    if (key.includes(n) || n.includes(key)) return synonyms;
  }
  return [];
}

// Mapeamento de palavras-chave para itens do painel
const KEYWORD_MAP = {
  febre: ['Febre', 'Febril', 'Afebril', 'Calafrios', 'Temperatura', 'Hipotermia', 'antitérmico'],
  dor: ['Dor', 'EVA', 'analgesia', 'Álgico', 'Dolorosa'],
  tosse: ['Tosse', 'Expectoração', 'Hemoptise', 'Broncoespasmo', 'Sibilos'],
  dispneia: ['Dispneia', 'Taquipneia', 'Bradipneia', 'Eupneico', 'Oxigenoterapia', 'O₂', 'SpO₂', 'Saturação', 'Gasometria'],
  edema: ['Edema', 'MMII', 'Ascite', 'Anasarca'],
  dreno: ['Dreno', 'Drenagem', 'Débito'],
  sonda: ['Sonda', 'SVD', 'SNE', 'SNG', 'Vesical', 'Nasoenteral', 'Nasogástrica'],
  curativo: ['Curativo', 'Ferida', 'Cicatrização', 'Deiscência', 'Necrose', 'Granulação'],
  dieta: ['Dieta', 'Jejum', 'Nutrição', 'Aceitação'],
  infecção: ['Infecciosa', 'Séptico', 'Sepse', 'Antibiótico', 'Cultura', 'Hemocultura', 'PCR', 'Procalcitonina'],
  sangramento: ['Hemorragia', 'Sangramento', 'Hematúria', 'Hematêmese', 'Hematoquezia', 'Melena', 'Equimose'],
  síncope: ['Síncope', 'Desmaio', 'Lipitimia', 'Pré-síncope'],
  palidez: ['Palidez', 'Cianose', 'Sudorese', 'Perfusão'],
  náusea: ['Náusea', 'Vômito', 'Êmese', 'Hematêmese'],
  exame: ['Radiografia', 'Tomografia', 'Ultrassonografia', 'Hemograma', 'Gasometria', 'Ecocardiograma', 'TC', 'RM', 'RX'],
  cirurgia: ['Cirúrgico', 'Cirurgia', 'Pós-operatório', 'PO', 'Laparotomia', 'Colecistectomia', 'Apendicectomia'],
  transferência: ['Transferência', 'CROSS', 'Vaga', 'Regulação', 'SAMU', 'Transporte'],
  alta: ['Alta', 'Transferido', 'Encaminhamento', 'Ambulatorial'],
  glicemia: ['Glicemia', 'Glicose', 'HGT', 'Dextro', 'Hipoglicemia', 'Hiperglicemia'],
  antibiótico: ['Antibiótico', 'Ceftriaxona', 'Vancomicina', 'Meropenem', 'Cultura', 'Hemocultura'],
};

function getSuggestedItems(clinicalText) {
  if (!clinicalText) return new Set();
  const text = clinicalText.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const suggestions = new Set();
  Object.entries(KEYWORD_MAP).forEach(([keyword, relatedTerms]) => {
    if (text.includes(keyword)) {
      relatedTerms.forEach(term => suggestions.add(term));
    }
  });
  return suggestions;
}

function AccordionGroup({ group, selectedItems, onToggle, colorClasses, searchTerm, suggestedItems }) {
  const [open, setOpen] = useState(false);
  const selectedCount = group.items.filter(i => selectedItems.includes(i)).length;

  const synonyms = expandSearchTerm(searchTerm);
  const filteredItems = group.items.filter(item => {
    if (fuzzyMatch(item, searchTerm)) return true;
    if (synonyms.length > 0) return synonyms.some(syn => fuzzyMatch(item, syn));
    return false;
  });
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
            const suggested = !active && suggestedItems.has(item);
            return (
              <button key={item} onClick={() => onToggle(item)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  active
                    ? `${colorClasses.bg} ${colorClasses.border} ${colorClasses.color} ring-1 ${colorClasses.ring}`
                    : suggested
                      ? 'border-amber-400/60 text-amber-600 bg-amber-500/10 ring-1 ring-amber-400/30 animate-pulse'
                      : 'border-border text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground'
                }`}>
                {active && <span className="mr-1">✓</span>}
                {suggested && !active && <Sparkles className="w-3 h-3 inline mr-1 text-amber-400" />}
                {item}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SectionAccordion({ sectionKey, section, selectedItems, onToggle, searchTerm, suggestedItems, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || sectionKey === 'subjetivo');
  const totalSelected = section.groups.flatMap(g => g.items).filter(i => selectedItems.includes(i)).length;

  // Se tem busca ativa, expande automaticamente se houver matches (com sinônimos)
  const searchSynonyms = expandSearchTerm(searchTerm);
  const matchesItem = (item) => fuzzyMatch(item, searchTerm) || searchSynonyms.some(syn => fuzzyMatch(item, syn));
  const hasMatches = searchTerm && section.groups.some(g => g.items.some(matchesItem));
  const isOpen = open || (searchTerm && hasMatches);

  // Auto-open when search finds matches
  const effectiveOpen = searchTerm ? (hasMatches || open) : open;

  return (
    <div className={`rounded-xl border ${section.border} overflow-hidden`}>
      <button onClick={() => setOpen(!effectiveOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left ${section.bg} transition-colors`}>
        <span className={`text-xs font-extrabold uppercase tracking-wider ${section.color}`}>{section.label}</span>
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
              searchTerm={searchTerm} suggestedItems={suggestedItems} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SymptomsPanel({ onAppend, clinicalDescription = '' }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const suggestedItems = useMemo(() => getSuggestedItems(clinicalDescription), [clinicalDescription]);

  const handleToggle = (item) => {
    const isRemoving = selected.includes(item);
    setSelected(prev => isRemoving ? prev.filter(i => i !== item) : [...prev, item]);
    if (!isRemoving) {
      onAppend(item);
    }
  };

  const handleClearAll = () => {
    setSelected([]);
    setSearchTerm('');
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(true)}
        title="Sinais e Sintomas"
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1.5 px-2 py-4 rounded-l-xl border border-r-0 border-border shadow-lg bg-card text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
        <span className="writing-mode-vertical text-[10px] font-bold tracking-wider uppercase"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          Sintomas
        </span>
        <PanelRight className="w-4 h-4" />
      </button>

      {/* Popover */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg max-h-[85vh] flex flex-col bg-card rounded-2xl border border-border shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="px-5 py-4 border-b border-border flex-shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-extrabold">Sinais & Sintomas</h2>
                    <p className="text-xs text-muted-foreground">Selecione para inserir na descrição</p>
                  </div>
                  <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
                    ×
                  </button>
                </div>
                {/* Busca inteligente */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar sintomas..."
                    className="w-full pl-8 pr-8 py-2 rounded-lg bg-muted border border-border text-xs focus:outline-none focus:border-primary/50 transition-all"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      ×
                    </button>
                  )}
                </div>
                {/* Indicador de sugestões contextuais */}
                {suggestedItems.size > 0 && !searchTerm && (
                  <div className="flex items-center gap-1.5 text-[10px] text-amber-500">
                    <Sparkles className="w-3 h-3" />
                    <span>{suggestedItems.size} sugestões detectadas no texto clínico</span>
                  </div>
                )}
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {Object.entries(SYMPTOMS_DATA).map(([key, section]) => (
                  <SectionAccordion
                    key={key}
                    sectionKey={key}
                    section={section}
                    selectedItems={selected}
                    onToggle={handleToggle}
                    searchTerm={searchTerm}
                    suggestedItems={suggestedItems}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
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
        </>
      )}
    </>
  );
}