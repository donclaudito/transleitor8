# 🩺 Transleitor — Plataforma de Documentação Clínica com IA

> Assistente inteligente para geração de evoluções médicas SOAP/narrativas e interpretação de exames laboratoriais, com segurança jurídica e conformidade ética.

---

## 📋 Visão Geral

O **Transleitor** é uma plataforma clínica que utiliza Inteligência Artificial para transformar dados brutos de atendimento (descrição clínica, comorbidades, exames, prescrições) em **documentação médica estruturada, técnica e pronta para prontuário**.

### Problemas que resolve
- **Sobrecarga documental:** médicos gastam horas digitando evoluções e prontuários.
- **Inconsistência:** registros variam em qualidade conforme o profissional ou cansaço.
- **Risco jurídico:** documentação incompleta ou ambígua expõe o profissional a litígios.
- **Erros de interpretação de exames:** leitura manual de laudos é lenta e propensa a falhas.

### Solução
IA clínica adaptativa que contextualiza por setor (UTI, Enfermaria, PS, Consultório), gera evoluções em terminologia médica formal e interpreta laudos laboratoriais com validação de plausibilidade biológica.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18 + Vite + JavaScript (JSX) |
| **Estilização** | Tailwind CSS + shadcn/ui + Design Tokens (CSS custom properties) |
| **Roteamento** | React Router DOM v6 |
| **Estado/Dados** | TanStack React Query (cache, mutations, invalidação) |
| **Animações** | Framer Motion |
| **Ícones** | Lucide React |
| **Datas** | date-fns (locale pt-BR) |
| **Markdown** | react-markdown + marked (backend) |
| **Backend (BaaS)** | Base44 Platform (auth, database, functions, hosting) |
| **Funções serverless** | Deno Deploy (TypeScript) |
| **IA (padrão)** | Gemini 3 Flash (via `Core.InvokeLLM`) |
| **IA (avançada)** | Claude Sonnet 4.6 (interpretação de exames) |
| **IA (customizável)** | Provedores externos OpenAI-compatible via `generateSOAP` |

---

## ✅ Funcionalidades Implementadas

### 1. Geração de Evoluções Clínicas
- **Modo SOAP:** estrutura Subjetivo → Objetivo → Avaliação → Plano, em HTML semântico.
- **Modo Livre (Narrativa):** evolução corrida com ordem obrigatória (Hipótese/CID-10 → HPP → Medicações → Alergias → Exames → Conduta → Plano).
- **Sugestão de CID-10:** até 3 códigos por ordem de probabilidade na seção de Avaliação.
- **Adaptação por setor:** foco clínico automático (UTI = plano por sistemas; PS = exclusão de diagnósticos fatais; Enfermaria = planejamento de alta).
- **Comparação temporal:** integra evolução médica anterior e de enfermagem para destacar progressão.
- **Exclusão de medicação crônica do Plano:** medicamentos contínuos não são repetidos na conduta.
- **Streaming simulado:** exibição progressiva do texto gerado para feedback visual.
- **Edição inline:** o médico pode editar o resultado gerado antes de salvar.

### 2. Interpretação de Exames Laboratoriais
- **Extração por IA (Claude Sonnet):** processa laudos colados de PDF com precisão.
- **Pré-processamento:** remove cabeçalhos/rodapés administrativos repetidos de cada página.
- **Validação de plausibilidade biológica:** descarta valores absurdos (ex: Sódio < 100 ou > 170).
- **Distinção sangue vs. urina:** "Leucócitos" do hemograma vs. "Leucócitos (Urina)" são tratados separadamente.
- **Hemograma inteligente:** extrai valor percentual (não absoluto) para diferenciais.
- **Deduplicação:** cada exame aparece uma única vez.
- **Filtro de exames sempre-zero:** ignora Blastos, Promielócitos, Mielócitos, etc.
- **Saída estruturada:** tabela HTML com status visual (✅ Normal, 🔵 Baixo, 🔴 Alto) + relatório analítico.
- **Cópia para área de transferência:** HTML limpo (sem classes Tailwind) compatível com editores rich text externos.

### 3. Gestão de Dados Clínicos
- **Comorbidades:** chips inteligentes com popover de medicamentos associados.
- **Alergias:** registro via multi-select com persistência para reuso.
- **Medicamentos crônicos:** vinculados a comorbidades, com adição personalizada.
- **Setores e Comorbidades customizáveis:** CRUD completo pelo painel administrativo.
- **Prescrição atual:** campo dedicado para colar prescrição vigente e integrar ao contexto.

### 4. Histórico e Persistência
- **Evoluções salvas:** histórico completo com busca e seleção.
- **Edição de evoluções passadas:** atualização inline de qualquer registro.
- **Exclusão de registros:** remoção segura com confirmação.

### 5. Painel Administrativo
- **AdminLLMs:** gestão de provedores de IA (URL, modelo, variável de chave API, ativação).
- **GerenciarApps:** links externos categorizados com ícones e ordenação.
- **DevDocs:** documentação visual do schema do banco de dados.
- **TemplatesSOAP:** dashboard de templates por especialidade médica.

### 6. Autenticação e Segurança
- Login com email/senha, Google OAuth, OTP, recuperação de senha.
- Proteção de rotas via `ProtectedRoute`.
- Row-Level Security (RLS) em todas as entidades (usuário vê apenas seus dados; admin vê tudo).

---

## 🗄️ Entidades (Banco de Dados)

| Entidade | Descrição | Campos Principais |
|---|---|---|
| **Evolution** | Evolução clínica gerada | `sector`, `bed`, `patient_initials`, `comorbidities`, `labs`, `prescription`, `clinical_description`, `soap_text` |
| **Patient** | Cadastro de pacientes | `name` |
| **Appointment** | Consultas e agendamentos | `patient_id`, `patient_name`, `type` (primeira_consulta/retorno), `chief_complaint`, `evolution`, `conduct_change`, `exam_results`, `prescription`, `notes` |
| **Comorbidity** | Comorbidades cadastradas | `name` |
| **ComorbidityMedication** | Medicação crônica por comorbidade | `comorbidity_name`, `medications` |
| **Allergy** | Alergias cadastradas (reutilizáveis) | `name` |
| **Sector** | Setores hospitalares | `name` |
| **PlanTemplate** | Templates de plano por especialidade | `name`, `specialty`, `skeleton`, `is_default` |
| **LLMConfig** | Configurações de provedores de IA | `provider_name`, `api_url`, `api_key_env_var`, `model_name`, `is_active` |
| **AppLink** | Links externos do painel | `nome`, `url`, `icone`, `categoria`, `ativo`, `ordem` |

### Row-Level Security (RLS)
Todas as entidades clínicas aplicam RLS:
- **Create:** apenas admin + vincula `created_by_id` ao usuário atual.
- **Read/Update/Delete:** usuário vê/modifica apenas seus registros; admin tem acesso total.

---

## 🤖 Integrações de IA

### 1. Core.InvokeLLM (Padrão)
Usado para geração de evoluções SOAP/Livre quando nenhum provedor customizado está selecionado.
- **Modelo padrão:** `gemini_3_flash` (rápido e econômico).
- **Modelo avançado:** `claude_sonnet_4_6` (interpretação de exames — maior precisão).
- **Recursos:** `response_json_schema` para saída estruturada, `add_context_from_internet` para busca web.

### 2. generateSOAP (Backend Function)
Função serverless que orquestra geração de evoluções via provedores externos.
- **Fluxo:** autentica usuário → busca `LLMConfig` → valida chave API → chama API OpenAI-compatible → normaliza resposta para HTML.
- **Compatibilidade:** qualquer provedor com API REST no formato OpenAI (Magistral, OpenAI, DeepSeek, etc.).
- **Fallback:** se a resposta não contém HTML, converte Markdown via `marked`.
- **Segurança:** chave API lida via variável de ambiente (`Deno.env.get`), nunca exposta no frontend.

### 3. Outras Integrações Core
- **UploadFile / UploadPrivateFile:** armazenamento de arquivos (PDFs de exames, imagens).
- **ExtractDataFromUploadedFile:** extração estruturada de PDFs/CSVs/imagens.
- **CreateFileSignedUrl:** URLs temporárias para download de arquivos privados.
- **SendEmail:** envio de notificações e relatórios.
- **TranscribeAudio:** transcrição de áudio (ditados médicos) para texto.
- **GenerateImage / GenerateVideo / GenerateSpeech:** recursos multimídia para materiais educativos.

---

## 🛡️ Segurança como Ativo de Confiança

### Proteção de Dados
- **Row-Level Security:** isolamento total de dados entre usuários. Cada profissional acessa apenas suas próprias evoluções.
- **Autenticação robusta:** tokens de sessão gerenciados pela plataforma, OAuth Google, verificação por OTP.
- **Chaves API server-side:** credenciais de provedores de IA armazenadas como variáveis de ambiente no backend, nunca expostas no cliente.
- **Sem armazenamento de dados sensíveis em campos:** arquivos grandes (PDFs, imagens) são armazenados via `UploadFile` e referenciados por URL, não incorporados em entidades.

### Validação Clínica
- **Plausibilidade biológica:** filtros de segurança descartam valores fisiologicamente impossíveis antes de exibi-los.
- **Zero alucinação em exames:** a IA é instruída a extrair apenas o que existe literalmente no texto do laudo.
- **Human-in-the-loop:** o profissional revisa, edita e valida cada documento antes de salvar. A IA é um assistente, não um substituto.

### Rastreabilidade
- Cada evolução registra `created_date`, `updated_date` e `created_by_id`.
- Histórico completo de evoluções permite auditoria do raciocínio clínico ao longo do tempo.

---

## ⚖️ Recomendações de Compliance

### Jurídico
- **CFM (Resolução 1.821/2007):** o prontuário médico deve ser legível, completo e estruturado. O Transleitor garante padronização e clareza, atendendo aos requisitos de documentação clínica.
- **LGPD (Lei 13.709/2018):** dados de saúde são dados sensíveis (Art. 11). A plataforma aplica RLS, criptografia em trânsito (HTTPS) e minimização de dados. Recomenda-se:
  - Formalizar contrato de processamento de dados com a instituição hospedeira.
  - Definir política de retenção e descarte de evoluções.
  - Obter consentimento do paciente para processamento de dados por IA (recomendado).
- **Responsabilidade profissional:** a IA gera sugestões; a responsabilidade clínica e jurídica permanece integralmente com o médico. O sistema documenta o raciocínio, mas a decisão final é humana.

### Ético
- **Transparência:** o paciente deve ser informado quando ferramentas de IA auxiliam na documentação clínica.
- **Não substituição:** a IA não substitui julgamento clínico, exame físico ou relação médico-paciente.
- **Viés algorítmico:** modelos de IA podem ter viés. A validação humana final mitiga esse risco.
- **Privacidade:** dados de pacientes não devem ser usados para treinar modelos externos sem consentimento explícito. Verificar política de retenção do provedor de IA selecionado.

### Operacional
- Treinar equipe sobre limites da ferramenta (auxílio à documentação, não diagnóstico).
- Implementar auditorias periódicas das evoluções geradas.
- Manter registro de versões do modelo de IA utilizado para fins de rastreabilidade.

---

## 💻 Execução Local

### Pré-requisitos
- Node.js 18+
- Conta na plataforma Base44 (para backend e variáveis de ambiente)

### Passos
```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
# No dashboard Base44 → Settings → Environment Variables, definir:
# - MAGISTRAL_API_KEY (se usar provedor Magistral)
# - Outras chaves de API conforme provedores cadastrados em LLMConfig

# 3. Executar em modo desenvolvimento
npm run dev

# 4. Build para produção
npm run build
```

### Estrutura de Rotas
| Rota | Página | Acesso |
|---|---|---|
| `/` | LandingPage (marketing) | Público |
| `/login` | Login | Público |
| `/register` | Cadastro | Público |
| `/forgot-password` | Recuperação de senha | Público |
| `/reset-password` | Redefinição de senha | Público |
| `/transleitor` | App principal (geração de evoluções) | Autenticado |
| `/exames` | Interpretação de exames laboratoriais | Autenticado |
| `/templates` | Dashboard de templates SOAP | Autenticado |
| `/gerenciar-apps` | Gestão de links externos | Autenticado |
| `/dev-docs` | Documentação de schemas | Autenticado |
| `/admin-llms` | Gestão de provedores de IA | Admin |

### Estrutura de Arquivos
```
src/
├── pages/              # Páginas da aplicação
│   ├── Transleitor.jsx          # App principal
│   ├── InterpretacaoExames.jsx  # Interpretação de laudos
│   ├── LandingPage.jsx          # Landing page
│   ├── AdminLLMs.jsx            # Painel admin de IA
│   └── ...
├── components/
│   ├── transleitor/   # Componentes do app principal
│   │   ├── FormView.jsx
│   │   ├── ResultView.jsx
│   │   ├── Header.jsx
│   │   ├── SymptomsPanel.jsx
│   │   ├── ComorbidityPopover.jsx
│   │   ├── AllergyPopover.jsx
│   │   └── ...
│   └── ui/            # Componentes shadcn/ui
├── lib/               # Utilitários e contextos
│   ├── examInterpreter.js       # Engine de interpretação de exames
│   ├── AuthContext.jsx          # Contexto de autenticação
│   └── ...
├── hooks/             # Hooks customizados
│   └── useSettings.js
└── api/
    └── base44Client.js          # SDK Base44 pré-inicializado

base44/
├── entities/          # Schemas do banco de dados (.jsonc)
├── functions/         # Funções serverless (Deno)
│   └── generateSOAP/entry.ts
└── agents/            # Configurações de agentes de IA
```

---

## 🗺️ Funcionalidades Faltantes / Roadmap

### Em Desenvolvimento
- [ ] **Escores Clínicos:** cálculo automático de scores (APACHE II, SOFA, Glasgow, NEWS2, CHA₂DS₂-VASc) a partir dos dados inseridos.
- [ ] **Ferramentas Clínicas:** calculadoras médicas integradas (clearance de creatinina, correção de sódio, íons, doses).

### Planejado
- [ ] **Reconhecimento de voz (STT):** ditado clínico direto no campo de descrição via `TranscribeAudio`.
- [ ] **Upload de PDF de exames:** extração automática via `ExtractDataFromUploadedFile` (atualmente é necessário colar o texto manualmente).
- [ ] **Integração com prontuário eletrônico (EMR):** exportação direta para sistemas HIS/EMR via API.
- [ ] **Agentes de IA especializados:** agentes treinados por especialidade (Cardiologia, Neurologia, Infectologia) com conhecimento específico.
- [ ] **Alertas de interação medicamentosa:** verificação cruzada de prescrição contra alergias e interações.
- [ ] **Exportação para PDF formatado:** geração de documento com identidade visual institucional.
- [ ] **Multi-instituição:** suporte a múltiplos hospitais/clínicas com isolamento de dados.
- [ ] **Auditoria e logs:** trilha completa de quem gerou, editou e acessou cada evolução.
- [ ] **Modo offline:** cache local para plantões sem conexão estável.
- [ ] **Internacionalização (i18n):** suporte a outros idiomas além de pt-BR.

### Melhorias Técnicas Planejadas
- [ ] **Refatoração do `examInterpreter.js`:** migrar lógica determinística residual para IA com cache de resultados.
- [ ] **Testes automatizados:** cobertura de testes para fluxos críticos (geração de evolução, interpretação de exames, RLS).
- [ ] **Observabilidade:** monitoramento de latência, taxa de erro e uso de créditos de IA.
- [ ] **Rate limiting:** proteção contra abuso de endpoints de IA.

---

## 📞 Suporte

Para dúvidas técnicas, reportar bugs ou solicitar funcionalidades, utilize o canal oficial de suporte da plataforma Base44.

---

**© 2026 Transleitor — IA Clínica Adaptativa.**  
*Documentação técnica atualizada em julho de 2026.*