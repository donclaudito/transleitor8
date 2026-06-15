export const TEST_NAME_MAP = {
  "wbc": "White Blood Cell Count", "leucócitos": "White Blood Cell Count",
  "rbc": "Red Blood Cell Count", "hemácias": "Red Blood Cell Count",
  "hgb": "Hemoglobin", "hemoglobina": "Hemoglobin", "hb": "Hemoglobin",
  "plt": "Platelet Count", "plaquetas": "Platelet Count",
  "hct": "Hematocrit", "hematócrito": "Hematocrit",
  "colesterol total": "Total Cholesterol", "tc": "Total Cholesterol",
  "ldl": "LDL Cholesterol", "ldl-c": "LDL Cholesterol",
  "hdl": "HDL Cholesterol", "hdl-c": "HDL Cholesterol",
  "triglicerídeos": "Triglycerides", "tg": "Triglycerides", "triglicerides": "Triglycerides",
  "alt": "Alanine Aminotransferase", "tgo": "Aspartate Aminotransferase",
  "ast": "Aspartate Aminotransferase", "tgp": "Alanine Aminotransferase",
  "creatinina": "Creatinine", "crea": "Creatinine",
  "ureia": "Blood Urea Nitrogen", "bun": "Blood Urea Nitrogen",
  "glicose": "Fasting Blood Glucose", "glicemia": "Fasting Blood Glucose", "glu": "Fasting Blood Glucose",
  "hba1c": "HbA1c", "hemoglobina glicada": "HbA1c",
  "tsh": "TSH", "t4 livre": "Free T4", "ft4": "Free T4",
  "sódio": "Sodium", "na": "Sodium",
  "potássio": "Potassium", "k": "Potassium",
  "pcr": "C-Reactive Protein", "proteína c reativa": "C-Reactive Protein",
};

export const REFERENCE_RANGES = {
  "White Blood Cell Count": { min: 4.0, max: 10.0, unit: "10⁹/L", ptName: "Leucócitos" },
  "Red Blood Cell Count": { min: 3.8, max: 5.8, unit: "10¹²/L", ptName: "Hemácias" },
  "Hemoglobin": { min: 12, max: 17.5, unit: "g/dL", ptName: "Hemoglobina" },
  "Platelet Count": { min: 150, max: 400, unit: "10³/µL", ptName: "Plaquetas" },
  "Hematocrit": { min: 36, max: 50, unit: "%", ptName: "Hematócrito" },
  "Total Cholesterol": { min: 0, max: 200, unit: "mg/dL", ptName: "Colesterol Total" },
  "LDL Cholesterol": { min: 0, max: 130, unit: "mg/dL", ptName: "LDL" },
  "HDL Cholesterol": { min: 40, max: 80, unit: "mg/dL", ptName: "HDL" },
  "Triglycerides": { min: 0, max: 150, unit: "mg/dL", ptName: "Triglicerídeos" },
  "Alanine Aminotransferase": { min: 0, max: 40, unit: "U/L", ptName: "ALT/TGP" },
  "Aspartate Aminotransferase": { min: 0, max: 40, unit: "U/L", ptName: "AST/TGO" },
  "Creatinine": { min: 0.6, max: 1.2, unit: "mg/dL", ptName: "Creatinina" },
  "Blood Urea Nitrogen": { min: 10, max: 50, unit: "mg/dL", ptName: "Ureia" },
  "Fasting Blood Glucose": { min: 70, max: 100, unit: "mg/dL", ptName: "Glicose em Jejum" },
  "HbA1c": { min: 4.0, max: 5.6, unit: "%", ptName: "HbA1c" },
  "TSH": { min: 0.27, max: 4.2, unit: "mIU/L", ptName: "TSH" },
  "Free T4": { min: 0.9, max: 1.7, unit: "ng/dL", ptName: "T4 Livre" },
  "Sodium": { min: 136, max: 145, unit: "mEq/L", ptName: "Sódio" },
  "Potassium": { min: 3.5, max: 5.0, unit: "mEq/L", ptName: "Potássio" },
  "C-Reactive Protein": { min: 0, max: 5, unit: "mg/L", ptName: "PCR" },
};

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseLine(line) {
  const cleaned = line.trim().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(.+?)[\s:]+(\d+[\.,]?\d*)\s*(.*)?$/);
  if (!match) return null;
  const rawName = match[1].trim();
  const value = parseFloat(match[2].replace(',', '.'));
  const unit = match[3]?.trim() || '';

  // Busca com normalização (remove acentos)
  const normalizedInput = normalize(rawName);
  let mapped = TEST_NAME_MAP[rawName.toLowerCase()];
  if (!mapped) {
    for (const [key, val] of Object.entries(TEST_NAME_MAP)) {
      if (normalize(key) === normalizedInput) { mapped = val; break; }
    }
  }
  if (!mapped) return null;
  return { name: mapped, value, unit, originalName: rawName };
}

function getStatus(value, ref) {
  if (value < ref.min) return 'low';
  if (value > ref.max) return 'high';
  return 'normal';
}

export function interpretExams(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const results = [];
  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const ref = REFERENCE_RANGES[parsed.name];
    if (!ref) continue;
    const status = getStatus(parsed.value, ref);
    results.push({
      ...parsed,
      ptName: ref.ptName,
      ref,
      status,
    });
  }
  return results;
}

export function generateMarkdownReport(results) {
  if (!results || results.length === 0) return '';
  let md = '# Relatório de Exames Laboratoriais\n\n';
  md += '| Exame | Valor | Ref. | Status |\n';
  md += '|-------|-------|------|--------|\n';
  for (const r of results) {
    const statusEmoji = r.status === 'normal' ? '✅' : r.status === 'high' ? '🔴 Alto' : '🔵 Baixo';
    md += `| ${r.ptName} | ${r.value} ${r.ref.unit} | ${r.ref.min}–${r.ref.max} | ${statusEmoji} |\n`;
  }
  const abnormal = results.filter(r => r.status !== 'normal');
  if (abnormal.length > 0) {
    md += '\n## Achados Relevantes\n\n';
    for (const r of abnormal) {
      md += `- **${r.ptName}**: ${r.value} ${r.ref.unit} (${r.status === 'high' ? 'acima' : 'abaixo'} do normal: ${r.ref.min}–${r.ref.max})\n`;
    }
  }
  return md;
}