import React from 'react';
import {
  Layers, Camera, ScanLine, MessageSquare, Repeat, PanelTop,
  FileSearch, BookOpen, Pill, Quote, Cpu, ShieldCheck, Check,
} from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  {
    icon: Layers,
    title: 'Evoluções com IA',
    def: 'Geração automática da evolução de prontuário a partir dos dados do paciente.',
    func: 'Cole exames, prescrição e evoluções anteriores; escolha SOAP, Livre ou Simples com CID-10 sugerido.',
    benefit: 'Documentação completa e assinável em segundos, sem digitar do zero.',
  },
  {
    icon: Camera,
    title: 'Captura de laudos e exames',
    def: 'Fotografia de exames pela câmera do celular com extração de texto por IA.',
    func: 'Fotografe na beira do leito: a IA transcreve e anonimiza o documento, e a captura fica em fila para inserir depois.',
    benefit: 'Nada de digitar laudos — o exame vira texto pronto, na hora que sobrar tempo.',
  },
  {
    icon: ScanLine,
    title: 'Análise de imagem médica',
    def: 'Leitura multimodal de radiografias, tomografias, ultrassons e ressonâncias.',
    func: 'Envie a imagem e receba um laudo sugerido com achados visíveis e diferenciais por ordem de probabilidade.',
    benefit: 'Uma segunda opinião instantânea, sem inventar achados.',
  },
  {
    icon: MessageSquare,
    title: 'Elvio — assistente clínico',
    def: 'Chat de IA dedicado ao raciocínio clínico.',
    func: 'Discuta casos, condutas e condutas de suporte como uma conversa, com histórico salvo por sessão.',
    benefit: 'Um colega virtual disponível 24h durante o plantão.',
  },
  {
    icon: Repeat,
    title: 'Passagem de visita',
    def: 'Handover estruturado entre plantonistas.',
    func: 'Resumo ultracurto do paciente e rastreamento de status: internado, avaliação, alta ou transferido.',
    benefit: 'Passagem de plantão sem retrabalho e sem paciente perdido.',
  },
  {
    icon: PanelTop,
    title: 'Painéis de especialidade',
    def: 'Atalhos contextuais por setor.',
    func: 'UTI, PS, emergência, cirurgia, gastro e sintomas com condutas prontas — favorite e personalize itens.',
    benefit: 'Toque em vez de digitar, na velocidade da urgência.',
  },
  {
    icon: FileSearch,
    title: 'Interpretação de exames',
    def: 'Leitura estruturada de laudos laboratoriais.',
    func: 'Cole o exame e receba tabela comparativa com tendência dos valores dia a dia.',
    benefit: 'A evolução do paciente de uma olhada, sem decoreba de valores.',
  },
  {
    icon: BookOpen,
    title: 'Imaginologia com guidelines',
    def: 'Respostas ancoradas em guidelines oficiais (ACR, Fleischner, ISUOG).',
    func: 'Cada recomendação cita a organização, o documento e a versão; sem evidência, diz abertamente.',
    benefit: 'Conduta baseada em evidência, sem alucinação de IA.',
  },
  {
    icon: Pill,
    title: 'Comorbidades & alergias',
    def: 'Contexto clínico inteligente do paciente.',
    func: 'Selecione comorbidades e as medicações crônicas vêm junto; alergias entram no raciocínio da IA.',
    benefit: 'Histórico completo integrado, sem procurar no papel.',
  },
  {
    icon: Quote,
    title: 'Frases pré-definidas',
    def: 'Biblioteca pessoal de textos-padrão do médico.',
    func: 'Crie frases de exame físico e plano de conduta e insira em qualquer evolução com um toque.',
    benefit: 'Seus textos-padrão sempre à mão, sem copiar e colar.',
  },
  {
    icon: Cpu,
    title: 'Multi-modelo de IA',
    def: 'Roteamento entre provedores externos de IA.',
    func: 'Alterne entre Gemini, Magistral, DeepSeek e mais no cabeçalho, conforme a complexidade do caso.',
    benefit: 'O modelo certo para cada caso, sem depender de um só.',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança & monitoramento',
    def: 'Isolamento de dados por médico com auditoria contínua.',
    func: 'Cada médico acessa apenas seus próprios registros; o uso da IA é monitorado com nota de precisão.',
    benefit: 'Dados clínicos protegidos, no espírito da LGPD.',
  },
];

export default function LandingFeatures() {
  return (
    <section id="funcionalidades" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-primary tracking-widest uppercase">Funcionalidades</span>
          <h2 className="text-3xl md:text-5xl font-extrabold mt-3 tracking-tight">
            Tudo o app faz, <br className="hidden md:block" />explicado em detalhe
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Cada módulo com sua definição, como funciona na prática e o que ele devolve ao médico.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon: Icon, title, def, func, benefit }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
              className="glass-card rounded-2xl p-6 flex flex-col hover:shadow-soft hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm">{title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{def}</p>
              <div className="mt-3 pt-3 border-t border-border/60">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Como funciona</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{func}</p>
              </div>
              <div className="mt-3 flex items-start gap-1.5">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-primary/90 leading-relaxed">{benefit}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}