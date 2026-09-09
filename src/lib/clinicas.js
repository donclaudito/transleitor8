import { Scissors, Stethoscope, Droplets, HeartPulse, Wind, Activity, Sparkles, Bone, Baby, Eye, FlaskConical, Flower2 } from 'lucide-react';

// Ambientes do menu pós-login.
export const AMBIENTES = {
  hospital: { icone: '🏥', rotulo: 'Hospital' },
  clinica: { icone: '🏢', rotulo: 'Clínicas' },
};

// Lista de especialidades — constante editável, pronta para a futura adaptação
// por especialidade (Transleitor de Cirurgia, de Urologia...).
export const ESPECIALIDADES = [
  { id: 1, icone: Scissors, nome: 'Cirurgia', slug: 'cirurgia' },
  { id: 2, icone: Stethoscope, nome: 'Clínica Médica', slug: 'clinica-medica' },
  { id: 3, icone: Droplets, nome: 'Urologia', slug: 'urologia' },
  { id: 4, icone: HeartPulse, nome: 'Cardiologia', slug: 'cardiologia' },
  { id: 5, icone: Wind, nome: 'Pneumologia', slug: 'pneumologia' },
  { id: 6, icone: Activity, nome: 'Gastro/Endoscopia', slug: 'gastro-endoscopia' },
  { id: 7, icone: Sparkles, nome: 'Dermatologia', slug: 'dermatologia' },
  { id: 8, icone: Bone, nome: 'Ortopedia', slug: 'ortopedia' },
  { id: 9, icone: Baby, nome: 'Pediatria', slug: 'pediatria' },
  { id: 10, icone: Eye, nome: 'Oftalmologia', slug: 'oftalmologia' },
  { id: 11, icone: FlaskConical, nome: 'Endocrino', slug: 'endocrino' },
  { id: 12, icone: Flower2, nome: 'Ginecologia', slug: 'ginecologia' },
];