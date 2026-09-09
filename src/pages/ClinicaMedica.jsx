import React from 'react';
import Transleitor from './Transleitor';

// Variante do Transleitor com raciocínio de Clínica Médica / Medicina Interna.
// Reutiliza todo o fluxo real (cadastro, contexto, geração, cópia) — só o foco
// de especialidade do prompt e o cabeçalho de confirmação mudam.
export default function ClinicaMedica() {
  return <Transleitor variante="clinica_medica" />;
}