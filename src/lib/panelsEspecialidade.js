// Config-driven: pestanas de itens por ESPECIALIDADE (padrão CirurgiaPanel).
// Cada especialidade tem as SUAS seções (grupos + itens clicáveis) coerentes com a
// área — são OPÇÕES para o médico clicar e inserir, nunca achados do paciente.
// Especialidades criadas pelo médico NÃO têm config: usam a pestana genérica
// (Meus itens + favoritos) sem conteúdo clínico fabricado.

import { Activity, Stethoscope, FlaskConical, ClipboardList } from 'lucide-react';

// Paleta padrão das seções (mesmo padrão visual do CirurgiaPanel).
const SECAO_QUEIXA = { icon: Activity, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', ring: 'ring-sky-400/40' };
const SECAO_EXAME = { icon: Stethoscope, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', ring: 'ring-emerald-400/40' };
const SECAO_EXAMES = { icon: FlaskConical, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', ring: 'ring-violet-400/40' };
const SECAO_CONDUTA = { icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', ring: 'ring-amber-400/40' };

const secao = (label, base, groups) => ({ label, ...base, groups });

export const PANELS_ESPECIALIDADE = {
  urologia: {
    nome: 'Urologia',
    secoes: {
      queixa: secao('Queixa e Sintomas Urinários', SECAO_QUEIXA, [
        { label: 'LUTS — Armazenamento', items: ['Polaciúria', 'Nictúria', 'Urgência miccional', 'Urgência incontinência', 'Dor suprapúbica'] },
        { label: 'LUTS — Esvaziamento', items: ['Hesitação miccional', 'Jato fraco', 'Gotejamento terminal', 'Esforço miccional', 'Sensação de esvaziamento incompleto', 'Retenção urinária referida'] },
        { label: 'Dor', items: ['Dor lombar em cólica', 'Dor hipogástrica', 'Dor perineal', 'Dor testicular', 'Dor irradiada para bolsa escrotal'] },
        { label: 'Outras Queixas', items: ['Hematúria', 'Disúria', 'Piúria', 'Perda urinária aos esforços', 'Jato progressivamente fraco', 'Eliminação de cálculo referida'] },
      ]),
      exame: secao('Exame Físico Dirigido', SECAO_EXAME, [
        { label: 'Exame Urológico', items: ['Abdome flácido e indolor', 'Massa renal palpável', 'Globo vesical', 'Dor à palpação hipogástrica', 'Edema de escroto/pênis', 'Linfonodos inguinais palpáveis', 'Hérnia inguinal associada'] },
        { label: 'Toque Retal (quando realizado)', items: ['Próstata de tamanho normal', 'Próstata aumentada', 'Próstata de consistência fibroelástica', 'Próstata de consistência pétrea', 'Nódulo prostático palpável', 'Toque retal sem alterações', 'SVD pérvia'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Laboratório', items: ['EAS sem alterações', 'EAS com piúria', 'EAS com hematúria', 'Urocultura negativa', 'Urocultura positiva', 'PSA normal', 'PSA elevado', 'Creatinina normal', 'Creatinina elevada'] },
        { label: 'Imagem e Urodinâmica', items: ['USG de vias urinárias sem alterações', 'Hidronefrose à USG', 'Litíase renal à USG', 'Litíase ureteral à TC', 'Bexiga de paredes espessadas', 'Resíduo pós-miccional aumentado', 'Urofluxometria com fluxo reduzido'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Condutas', items: ['Antibioticoterapia conforme urocultura', 'Analgesia para cólica renal', 'Orientar ingestão hídrica abundante', 'Alfa-bloqueador para LUTS', 'Programar retirada de SVD', 'Solicitar EAS de controle'] },
        { label: 'Retorno e Encaminhamento', items: ['Retorno com urocultura', 'Retorno com resultado de PSA', 'Retorno com USG de vias urinárias', 'Retorno em 30 dias para reavaliação de PSA', 'Sinais de alarme: febre, hematúria, retenção aguda', 'Encaminhar à urgência: dor intensa com febre', 'Interconsulta com Nefrologia'] },
      ]),
    },
  },

  cardiologia: {
    nome: 'Cardiologia',
    secoes: {
      queixa: secao('Queixa e Sintomas', SECAO_QUEIXA, [
        { label: 'Dor Torácica', items: ['Dor precordial em aperto', 'Dor torácica irradiada para MSE', 'Dor torácica de esforço', 'Dor torácica prolongada (>20 min)', 'Dor torácica atípica', 'Dor aliviada com repouso'] },
        { label: 'Congestão / Dispneia', items: ['Dispneia aos esforços', 'Ortopneia', 'Dispneia paroxística noturna', 'Edema de MMII', 'Ganho ponderal rápido', 'Fadiga'] },
        { label: 'Outros', items: ['Palpitações', 'Síncope', 'Pré-síncope', 'Tosse noturna', 'Intolerância ao decúbito', 'Claudicação intermitente'] },
      ]),
      exame: secao('Exame Cardiovascular', SECAO_EXAME, [
        { label: 'Geral', items: ['Normotenso', 'Hipertenso', 'PA bem controlada', 'PA descontrolada', 'Pulsos cheios e simétricos', 'Turgência jugular', 'Pulsos filiformes'] },
        { label: 'Ausculta', items: ['Ritmo cardíaco regular', 'Ritmo irregular (FA)', 'Sopro sistólico em foco aórtico', 'Sopro sistólico em foco mitral', 'Sopro diastólico', 'B3 (galope)', 'Click de ejeção'] },
        { label: 'Extremidades', items: ['Sem edema', 'Edema de MMII Godet +', 'Edema de MMII Godet ++/+++', 'Extremidades frias', 'Cianose periférica'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Eletrocardiografia', items: ['ECG em ritmo sinusal', 'ECG sem alterações', 'ECG com fibrilação atrial', 'ECG com alterações de repolarização', 'ECG com sobrecarga de VE', 'ECG com bloqueio de ramo', 'ECG com padrão isquêmico'] },
        { label: 'Outros Exames', items: ['Ecocardiograma com FE preservada', 'Ecocardiograma com FE reduzida', 'Eco com disfunção diastólica', 'Troponina negativa', 'Troponina elevada', 'NT-proBNP elevado', 'Holter sem arritmias', 'Teste ergométrico negativo', 'Perfil lipídico solicitado'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Anti-hipertensivos', items: ['Manter esquema atual', 'Ajuste de anti-hipertensivo', 'Otimização de diurético', 'Iniciar/ajustar IECA ou BRA', 'Otimizar betabloqueador'] },
        { label: 'Condutas', items: ['Revisar anticoagulação', 'Ecocardiograma de controle', 'Solicitar Holter', 'Estratificar risco cardiovascular'] },
        { label: 'Retorno', items: ['Retorno em 30 dias para controle de PA', 'Retorno com Holter', 'Retorno com ecocardiograma', 'Sinais de alarme: dor torácica >20 min, síncope, dispneia de repouso'] },
      ]),
    },
  },

  pneumologia: {
    nome: 'Pneumologia',
    secoes: {
      queixa: secao('Tosse e Sintomas Respiratórios', SECAO_QUEIXA, [
        { label: 'Tosse', items: ['Tosse seca', 'Tosse produtiva', 'Tosse noturna', 'Tosse crônica (>8 semanas)', 'Tosse com expectoração purulenta', 'Hemoptóico'] },
        { label: 'Dispneia e Sibilância', items: ['Dispneia aos esforços', 'Dispneia de repouso', 'Sibilância', 'Tiragem intercostal', 'Uso de musculatura acessória', 'Chiado noturno'] },
        { label: 'Outros / Tabagismo', items: ['Febre', 'Rinite associada', 'Tabagista ativo (carga informada)', 'Ex-tabagista', 'Exacerbação recente referida'] },
      ]),
      exame: secao('Exame Respiratório', SECAO_EXAME, [
        { label: 'Ausculta', items: ['Murmúrio vesicular presente e simétrico', 'Sibilos difusos', 'Sibilos expiratórios prolongados', 'Estertores em bases', 'Murmúrio vesicular diminuído', 'Atrito pleural'] },
        { label: 'Geral', items: ['SpO₂ 95–98% em ar ambiente', 'SpO₂ reduzida', 'Expansibilidade preservada', 'Expansibilidade diminuída', 'Percussão com macicez'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Função Pulmonar', items: ['Espirometria sem alterações', 'Espirometria com padrão obstrutivo', 'Espirometria com padrão restritivo', 'Teste broncodilatador positivo', 'VEF1/CVF reduzido'] },
        { label: 'Imagem e Laboratório', items: ['RX de tórax sem alterações', 'RX com infiltrado', 'RX com consolidação', 'TC de tórax com enfisema', 'TC com bronquiectasias', 'PCR elevado', 'Leucocitose'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Inalatórios', items: ['Revisar técnica de inalador', 'Iniciar/ajustar corticoide inalatório', 'Broncodilatador de resgate', 'Oxigenoterapia domiciliar (conforme dados)'] },
        { label: 'Condutas', items: ['Vacinação antipneumocócica', 'Vacinação contra gripe', 'Orientar cessação do tabagismo', 'Reabilitação pulmonar'] },
        { label: 'Retorno', items: ['Retorno com espirometria', 'Retorno com TC de tórax', 'Sinais de alarme: dispneia de repouso, febre, SpO₂ baixa'] },
      ]),
    },
  },

  dermatologia: {
    nome: 'Dermatologia',
    secoes: {
      queixa: secao('Lesão e História', SECAO_QUEIXA, [
        { label: 'Queixa', items: ['Lesão pruriginosa', 'Lesão dolorosa', 'Lesão que cresceu', 'Lesão pigmentada', 'Lesão descamativa', 'Lesão que sangra', 'Alopecia', 'Lesão de unhas'] },
        { label: 'Evolução', items: ['Início há dias', 'Início há meses', 'Crescimento lento', 'Crescimento rápido', 'Recorrência da lesão', 'Exposição solar intensa', 'Múltiplas lesões'] },
      ]),
      exame: secao('Exame Dermatológico', SECAO_EXAME, [
        { label: 'Morfologia', items: ['Mácula', 'Pápula', 'Placa', 'Vesícula', 'Bolha', 'Pústula', 'Nódulo', 'Crosta', 'Escama'] },
        { label: 'Distribuição', items: ['Distribuição simétrica', 'Localizada', 'Em áreas fotoexpostas', 'Em dobras', 'Em couro cabeludo', 'Em mucosas', 'Bordas bem delimitadas', 'Bordas mal definidas'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Complementares', items: ['Dermatoscopia realizada (achados informados)', 'Biópsia de pele indicada', 'Resultado anatomopatológico anexado', 'Exame micológico solicitado'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Tópicos', items: ['Corticoide tópico (potência conforme dados)', 'Emoliente', 'Antifúngico tópico', 'Antibiótico tópico', 'Fotoproteção orientada'] },
        { label: 'Condutas e Retorno', items: ['Crioterapia', 'Curetagem', 'Excisão completa', 'Retorno com resultado de biópsia', 'Sinais de alarme: mudança da lesão, ulceração, sangramento, crescimento rápido'] },
      ]),
    },
  },

  ortopedia: {
    nome: 'Ortopedia e Traumatologia',
    secoes: {
      queixa: secao('Queixa e Trauma', SECAO_QUEIXA, [
        { label: 'Dor', items: ['Dor articular', 'Dor mecânica (ao esforço)', 'Dor noturna', 'Dor após trauma', 'Dor lombar irradiada', 'Rigidez matinal', 'Dor em ombro'] },
        { label: 'Trauma / Mecanismo', items: ['Queda da própria altura', 'Mecanismo de torção', 'Entorse de tornozelo', 'Contusão direta', 'Transferência de peso', 'Hiperflexão forçada'] },
        { label: 'Limitação', items: ['Limitação de abdução', 'Limitação de flexão de joelho', 'Claudicação', 'Incapacidade de apoio de peso', 'Bloqueio articular'] },
      ]),
      exame: secao('Exame Ortopédico', SECAO_EXAME, [
        { label: 'Inspeção e Palpação', items: ['Sem deformidade aparente', 'Edema articular', 'Equimose', 'Dor à palpação localizada', 'Crepitação', 'Derrame articular (sinal da tecla)'] },
        { label: 'AMR e Testes', items: ['Amplitude preservada', 'Amplitude limitada', 'Teste de Lachman positivo', 'Gaveta anterior positiva', 'McMurray positivo', 'Compressão radicular positiva'] },
        { label: 'Neurovascular', items: ['Pulsos distais presentes', 'Sensibilidade preservada', 'Déficit sensitivo', 'Reflexos preservados'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Imagem', items: ['RX sem alterações', 'RX com fratura', 'RX com artrose', 'RX em 2 incidências solicitado', 'RM de joelho solicitada', 'RM com lesão de menisco', 'TC com fratura', 'RM com hérnia de disco'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Imobilização', items: ['Imobilização gessada', 'Tipoia', 'Bota ortopédica', 'Tala imobilizadora', 'Órtese de uso orientado'] },
        { label: 'Condutas', items: ['Repouso relativo orientado', 'Gelo local 3x/dia', 'Anti-inflamatório por 5 dias', 'Suspensão de apoio de peso', 'Encaminhar à fisioterapia'] },
        { label: 'Retorno', items: ['Retorno com RX', 'Retorno para retirada de imobilização', 'Retorno com RM', 'Sinais de alarme: déficit neurológico, dor não controlada, palidez/ausência de pulso'] },
      ]),
    },
  },

  pediatria: {
    nome: 'Pediatria',
    secoes: {
      queixa: secao('Queixa e História', SECAO_QUEIXA, [
        { label: 'Sintomas', items: ['Febre', 'Tosse', 'Coriza', 'Vômitos', 'Diarreia', 'Choro irritável', 'Recusa alimentar', 'Sibilância'] },
        { label: 'História', items: ['Início há 24h', 'Início há 3 dias', 'Contato com doentes em casa', 'Vacinação em dia (informado)', 'Alimentação adequada para a idade'] },
        { label: 'Puericultura', items: ['Peso adequado para idade (informado)', 'Crescimento adequado na curva', 'Desenvolvimento esperado para a idade', 'Introdução alimentar em andamento'] },
      ]),
      exame: secao('Exame Pediátrico', SECAO_EXAME, [
        { label: 'Geral', items: ['Paciente ativo', 'Letárgico', 'Hidratado', 'Desidratação leve', 'Desidratação moderada', 'Fontanela normotensa', 'Fontanela deprimida', 'Febre mensurada (valor informado)'] },
        { label: 'Dirigido', items: ['Orofaringe hiperemiada', 'Otoscopia sem alterações', 'Otoscopia com hiperemia', 'Sibilância difusa', 'Tiragem subcostal', 'Rales crepitantes', 'Abdome sem alterações'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Condutas', items: ['Antitérmico conforme peso (informado)', 'Hidratação oral orientada', 'Inaloterapia', 'Dieta de consistência adequada', 'Antibioticoterapia conforme quadro (dados)'] },
        { label: 'Orientações', items: ['Sinais de alerta: vômitos persistentes, letargia, recusa de líquidos', 'Retorno em 24–48h', 'Retorno para reavaliação em 7 dias', 'Puericultura mensal', 'Calendário vacinal revisado'] },
      ]),
    },
  },

  oftalmologia: {
    nome: 'Oftalmologia',
    secoes: {
      queixa: secao('Queixa Ocular', SECAO_QUEIXA, [
        { label: 'Sintomas', items: ['Baixa de acuidade visual', 'Baixa progressiva', 'Baixa súbita', 'Dor ocular', 'Vermelhidão ocular', 'Secreção', 'Prurido', 'Fotofobia', 'Fotopsias', 'Moscas volantes', 'Halos coloridos'] },
        { label: 'História', items: ['Uso de colírio (informado)', 'Trauma ocular referido', 'Cirurgia ocular prévia (informada)', 'DM em tratamento', 'HAS em tratamento'] },
      ]),
      exame: secao('Exame Oftalmológico', SECAO_EXAME, [
        { label: 'Acuidade e Segmento Anterior', items: ['AV 20/20', 'AV reduzida (informada)', 'AV com correção', 'Conjuntiva hiperemiada', 'Córnea transparente', 'Córnea com lesão', 'Pupila isocórica e reativa', 'Pupila midriática', 'Catarata observada'] },
        { label: 'Fundo e PIO', items: ['Fundo de olho sem alterações', 'Fundo com alterações (descritas)', 'PIO normal (informada)', 'PIO elevada (informada)', 'PIO não aferida'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Complementares', items: ['Tonometria realizada', 'Mapeamento de retina solicitado', 'Biomicroscopia (achados informados)', 'USG ocular solicitado'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Condutas', items: ['Colírio lubrificante', 'Colírio antibiótico (conforme dados)', 'Óculos novos prescritos', 'Cirurgia de catarata indicada', 'Controle glicêmico reforçado (conforme dados)'] },
        { label: 'Retorno', items: ['Retorno com mapeamento de retina', 'Retorno em 30 dias', 'Urgência se dor intensa ou baixa súbita da visão'] },
      ]),
    },
  },

  endocrino: {
    nome: 'Endocrinologia',
    secoes: {
      queixa: secao('Queixa e Sintomas', SECAO_QUEIXA, [
        { label: 'Sintomas', items: ['Polúria', 'Polidipsia', 'Perda ponderal', 'Ganho ponderal', 'Astenia', 'Calores', 'Sudorese', 'Tremor fino', 'Queda de cabelo', 'Intolerância ao calor', 'Amenorreia'] },
        { label: 'Adesão', items: ['Medicação em uso regular (informado)', 'Esquece doses', 'Uso irregular (informado)'] },
      ]),
      exame: secao('Exame Físico', SECAO_EXAME, [
        { label: 'Geral', items: ['PA normal', 'IMC informado', 'Circunferência abdominal aumentada', 'Bócio não palpável', 'Bócio palpável difuso', 'Nódulo tireoidiano palpável', 'Tremor de extremidades', 'Pele seca'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Glicêmicos', items: ['Glicemia de jejum normal', 'Glicemia elevada', 'HbA1c dentro da meta', 'HbA1c acima da meta', 'Hipoglicemias relatadas'] },
        { label: 'Tireoidianos e Outros', items: ['TSH normal', 'TSH elevado', 'TSH suprimido', 'T4 livre alterado', 'Anti-TPO positivo', 'Lipidograma alterado', 'Vitamina D baixa', 'Densitometria com osteopenia', 'Densitometria com osteoporose'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Condutas', items: ['Ajuste de metformina', 'Iniciar/ajustar insulina (conforme dados)', 'Iniciar levotiroxina', 'Suplementação de vitamina D', 'Metas glicêmicas revisadas', 'Orientação nutricional'] },
        { label: 'Retorno', items: ['Retorno com HbA1c em 3 meses', 'Retorno com TSH em 6–8 semanas', 'Retorno com densitometria', 'Sinais de alerta: hipoglicemias graves, descompensação'] },
      ]),
    },
  },

  ginecologia: {
    nome: 'Ginecologia',
    secoes: {
      queixa: secao('Queixa e Ciclo', SECAO_QUEIXA, [
        { label: 'Ciclo Menstrual', items: ['Ciclo menstrual regular', 'Ciclo irregular', 'Amenorreia', 'Sangramento abundante', 'Sangramento intermenstrual', 'Dismenorreia', 'Atraso menstrual (informado)'] },
        { label: 'Corrimento e Outros', items: ['Corrimento incolor', 'Corrimento branco grumoso', 'Corrimento com odor', 'Prurido vulvar', 'Dispareunia', 'Nódulo mamário palpado', 'Dor pélvica crônica', 'Ondas de calor (climatério)', 'Planejamento de contracepção'] },
      ]),
      exame: secao('Exame Ginecológico', SECAO_EXAME, [
        { label: 'Dirigido', items: ['Inspeção sem alterações', 'Exame especular sem alterações', 'Toque sem alterações', 'Massa pélvica palpável', 'Dor à mobilização uterina', 'Colposcopia (achados informados)'] },
        { label: 'Mamas', items: ['Sem nódulos palpáveis', 'Nódulo mamário palpável', 'Linfonodos axilares não palpáveis', 'Linfonodo axilar palpável'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Rastreio e Labs', items: ['Citologia cervical normal', 'Citologia com ASC-US', 'Exame de HPV (resultado informado)', 'Mamografia normal', 'Mamografia com nódulo (BI-RADS informado)', 'USG mamária', 'USG transvaginal', 'Beta-hCG negativo', 'Beta-hCG positivo (informado)'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Contracepção', items: ['Revisar método contraceptivo', 'ACO combinado prescrito', 'DIU orientado', 'Preservativo orientado'] },
        { label: 'Condutas e Retorno', items: ['Tratamento do corrimento conforme quadro', 'Repetir citologia', 'Retorno com mamografia', 'Retorno em 6 meses com citologia', 'Sinais de alarme: sangramento anormal, nódulo endurecido, febre'] },
      ]),
    },
  },

  'clinica-medica': {
    nome: 'Clínica Médica',
    secoes: {
      queixa: secao('Queixa e Sintomas', SECAO_QUEIXA, [
        { label: 'Gerais', items: ['Febre', 'Astenia', 'Emagrecimento', 'Cefaleia', 'Tontura', 'Insônia'] },
        { label: 'Cardio-metabólico', items: ['Controle pressórico em meta', 'PA elevada na consulta', 'Glicemias capilares elevadas (informado)', 'Edema de MMII'] },
        { label: 'Digestivo / Urinário / Respiratório', items: ['Dor epigástrica', 'Náuseas', 'Obstipação', 'Diarreia', 'Disúria', 'Tosse', 'Coriza', 'Dor de garganta'] },
      ]),
      exame: secao('Exame Físico', SECAO_EXAME, [
        { label: 'Geral', items: ['Bom estado geral', 'Regular estado geral', 'Hidratado', 'Afebril', 'Orientado', 'PA e FC informadas'] },
        { label: 'Dirigido', items: ['Murmúrio vesicular presente', 'Abdome flácido e indolor', 'Sem edema', 'Edema Godet +', 'Sinais de desidratação'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Rotina', items: ['Hemograma normal', 'Hemograma alterado', 'PCR elevado', 'Ureia/creatinina normais', 'TSH normal', 'HbA1c solicitada', 'Lipidograma solicitado'] },
        { label: 'Imagem', items: ['RX de tórax sem alterações', 'USG de abdome sem alterações', 'ECG normal'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Condutas', items: ['Ajuste de medicação de uso contínuo', 'Solicitar exames de rotina', 'Atualizar caderneta de vacinação', 'Orientação de estilo de vida (dieta/atividade)', 'Revisar adesão medicamentosa'] },
        { label: 'Retorno', items: ['Retorno em 30 dias com exames', 'Retorno com resultado de exames', 'Sinais de alarme: dor precordial, dispneia, febre persistente'] },
      ]),
    },
  },

  'cirurgia-ambulatorial': {
    nome: 'Cirurgia (Ambulatório)',
    secoes: {
      queixa: secao('Pré e Pós-Operatório', SECAO_QUEIXA, [
        { label: 'Pré-Operatório', items: ['Cirurgia eletiva programada', 'Risco cirúrgico avaliado', 'Exames pré-operatórios em dia', 'Anticoagulante em uso (informado)', 'Suspensão de anticoagulante orientada', 'Jejum pré-operatório orientado', 'Consentimento informado assinado'] },
        { label: 'Pós-Operatório', items: ['Tolerando dieta oral', 'Dor controlada com analgesia simples', 'Deambulando', 'Eliminações fisiológicas presentes', 'Febre referida', 'Ferida operatória com bom aspecto'] },
      ]),
      exame: secao('Exame Dirigido', SECAO_EXAME, [
        { label: 'Ferida e Abdome', items: ['Abdome flácido e indolor', 'Ferida com bordas aproximadas', 'Sem sinais inflamatórios', 'Eritema perilesional', 'Secreção serosa', 'Secreção purulenta', 'Deiscência parcial referida', 'Hematoma de ferida', 'Sem dreno em uso', 'Dreno com débito decrescente'] },
      ]),
      exames: secao('Exames', SECAO_EXAMES, [
        { label: 'Laboratório e Imagem', items: ['Hemograma normal', 'Hemograma com anemia', 'Coagulograma normal', 'PCR em queda', 'Função renal normal', 'USG sem coleções', 'TC com coleção (informado)', 'RX de tórax sem alterações'] },
      ]),
      conduta: secao('Conduta e Orientações', SECAO_CONDUTA, [
        { label: 'Condutas', items: ['Retirada de pontos realizada', 'Agendar retirada de pontos', 'Manter curativo', 'Revisar prescrição analgésica', 'Alta ambulatorial', 'Retorno cirúrgico programado'] },
        { label: 'Alertas', items: ['Sinais de alarme orientados: febre, secreção purulenta, sangramento', 'Procurar urgência com dor intensa/saída de secreção'] },
      ]),
    },
  },
};