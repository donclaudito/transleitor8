export const TEST_NAME_MAP = {
  // Hemograma
  "wbc": "White Blood Cell Count", "leucócitos": "White Blood Cell Count", "leucocitos": "White Blood Cell Count", "leuco": "White Blood Cell Count",
  "rbc": "Red Blood Cell Count", "hemácias": "Red Blood Cell Count", "hemacias": "Red Blood Cell Count",
  "hgb": "Hemoglobin", "hemoglobina": "Hemoglobin", "hb": "Hemoglobin",
  "plt": "Platelet Count", "plaquetas": "Platelet Count",
  "hct": "Hematocrit", "hematócrito": "Hematocrit", "hematocrito": "Hematocrit", "ht": "Hematocrit",
  // Diferencial leucocitário
  "segmentados": "Segmented Neutrophils", "seg": "Segmented Neutrophils", "neutrófilos": "Segmented Neutrophils", "neutrofilos": "Segmented Neutrophils", "neut": "Segmented Neutrophils",
  "bastões": "Band Neutrophils", "bastoes": "Band Neutrophils", "bast": "Band Neutrophils",
  "linfócitos": "Lymphocytes", "linfocitos": "Lymphocytes", "linf": "Lymphocytes",
  "monócitos": "Monocytes", "monocitos": "Monocytes", "mono": "Monocytes",
  "eosinófilos": "Eosinophils", "eosinofilos": "Eosinophils", "eos": "Eosinophils", "eosino": "Eosinophils",
  "basófilos": "Basophils", "basofilos": "Basophils", "baso": "Basophils",
  // Bioquímica
  "colesterol total": "Total Cholesterol", "tc": "Total Cholesterol", "colesterol": "Total Cholesterol",
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
  // Provas inflamatórias / outros
  "vhs": "ESR",
  "ferritina": "Ferritin",
  "ácido úrico": "Uric Acid", "acido urico": "Uric Acid",
  "bilirrubina total": "Total Bilirubin", "bt": "Total Bilirubin",
  "bilirrubina direta": "Direct Bilirubin", "bd": "Direct Bilirubin",
  "bilirrubina indireta": "Indirect Bilirubin", "bi": "Indirect Bilirubin",
  "amilase": "Amylase",
  "lipase": "Lipase",
  "lactato": "Lactate",
  "troponina": "Troponin",
  "ck": "CK",
  "ck-mb": "CK-MB",
  "d dímero": "D-Dimer", "d-dimero": "D-Dimer",
  "procalcitonina": "Procalcitonin",
};

export const REFERENCE_RANGES = {
  "White Blood Cell Count": { min: 4.0, max: 10.0, unit: "10³/µL", ptName: "Leucócitos" },
  "Red Blood Cell Count": { min: 3.8, max: 5.8, unit: "10⁶/µL", ptName: "Hemácias" },
  "Hemoglobin": { min: 12, max: 17.5, unit: "g/dL", ptName: "Hemoglobina" },
  "Platelet Count": { min: 150, max: 400, unit: "10³/µL", ptName: "Plaquetas" },
  "Hematocrit": { min: 36, max: 50, unit: "%", ptName: "Hematócrito" },
  "Segmented Neutrophils": { min: 40, max: 75, unit: "%", ptName: "Segmentados" },
  "Band Neutrophils": { min: 0, max: 5, unit: "%", ptName: "Bastões" },
  "Lymphocytes": { min: 20, max: 45, unit: "%", ptName: "Linfócitos" },
  "Monocytes": { min: 2, max: 10, unit: "%", ptName: "Monócitos" },
  "Eosinophils": { min: 0, max: 5, unit: "%", ptName: "Eosinófilos" },
  "Basophils": { min: 0, max: 1.5, unit: "%", ptName: "Basófilos" },
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
  "ESR": { min: 0, max: 20, unit: "mm/h", ptName: "VHS" },
  "Ferritin": { min: 20, max: 300, unit: "ng/mL", ptName: "Ferritina" },
  "Uric Acid": { min: 2.4, max: 6.0, unit: "mg/dL", ptName: "Ácido Úrico" },
  "Total Bilirubin": { min: 0.2, max: 1.2, unit: "mg/dL", ptName: "Bilirrubina Total" },
  "Direct Bilirubin": { min: 0, max: 0.3, unit: "mg/dL", ptName: "Bilirrubina Direta" },
  "Indirect Bilirubin": { min: 0.2, max: 0.9, unit: "mg/dL", ptName: "Bilirrubina Indireta" },
  "Amylase": { min: 28, max: 100, unit: "U/L", ptName: "Amilase" },
  "Lipase": { min: 13, max: 60, unit: "U/L", ptName: "Lipase" },
  "Lactate": { min: 0.5, max: 2.0, unit: "mmol/L", ptName: "Lactato" },
  "Troponin": { min: 0, max: 0.04, unit: "ng/mL", ptName: "Troponina" },
  "CK": { min: 30, max: 200, unit: "U/L", ptName: "CK Total" },
  "CK-MB": { min: 0, max: 5, unit: "ng/mL", ptName: "CK-MB" },
  "D-Dimer": { min: 0, max: 500, unit: "ng/mL", ptName: "D-Dímero" },
  "Procalcitonin": { min: 0, max: 0.5, unit: "ng/mL", ptName: "Procalcitonina" },
};

// Section headers → expected tests in order
const SECTION_TESTS = {
  'eritrograma': ['Red Blood Cell Count', 'Hemoglobin', 'Hematocrit'],
  'leucograma': ['White Blood Cell Count', 'Segmented Neutrophils', 'Band Neutrophils', 'Lymphocytes', 'Monocytes', 'Eosinophils', 'Basophils'],
  'plaquetas': ['Platelet Count'],
};

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function lookupTestName(rawName) {
  const key = rawName.toLowerCase().trim();
  if (TEST_NAME_MAP[key]) return TEST_NAME_MAP[key];
  const norm = normalize(rawName);
  // Try exact match on normalized key
  for (const [k, v] of Object.entries(TEST_NAME_MAP)) {
    const nk = normalize(k);
    if (nk === norm || nk.includes(norm) || norm.includes(nk)) return v;
  }
  return null;
}

// Parse a single line for name + value
function parseLine(line) {
  const cleaned = line
    .trim()
    .replace(/\s+/g, ' ')          // normalize whitespace
    .replace(/\.{3,}/g, ' ')       // dot-separators → spaces
    .replace(/[•·⋅]/g, ' ')        // bullet points → spaces
    .replace(/[\t]+/g, ' ');       // tabs → spaces

  // Skip lines that are purely numeric/symbolic (no letters)
  if (!/[a-zA-ZÀ-ÿ]/.test(cleaned)) return null;

  const patterns = [
    // "Name: Value Unit" or "Name Value Unit"
    /^([^\d]+?)[\s:]+(\d+[\.,]?\d*)\s*(.*?)$/,
  ];

  for (const pattern of patterns) {
    const match = cleaned.match(pattern);
    if (!match) continue;
    const rawName = match[1].trim();
    const value = parseFloat(match[2].replace(',', '.'));
    if (isNaN(value) || rawName.length < 2) continue;

    const unit = match[3]?.trim() || '';
    const mapped = lookupTestName(rawName);
    if (!mapped) continue;
    return { name: mapped, value, unit, originalName: rawName };
  }
  return null;
}

// Extract all positive numbers from a line
function extractNumbers(text) {
  const cleaned = text.replace(/[^\d,\.\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];
  const parts = cleaned.split(/\s+/);
  const numbers = [];
  for (const part of parts) {
    const num = parseFloat(part.replace(',', '.'));
    if (!isNaN(num) && num >= 0) numbers.push(num);
  }
  return numbers;
}

// Check if a number looks like a reference-range pair member
// (consecutive numbers where the second > first, typical ref range pattern)
function isRefRangeNumber(numbers, index) {
  // If it's part of a pair of numbers where they could be min-max
  if (index > 0) {
    const prev = numbers[index - 1];
    const curr = numbers[index];
    if (prev > 0 && curr > prev && curr <= 500) return true; // curr looks like a max
  }
  if (index < numbers.length - 1) {
    const curr = numbers[index];
    const next = numbers[index + 1];
    if (next > 0 && next > curr && next <= 500) return true; // curr looks like a min
  }
  return false;
}

export function getStatus(value, ref) {
  if (value < ref.min) return 'low';
  if (value > ref.max) return 'high';
  return 'normal';
}

export function interpretExams(text) {
  const lines = text.split('\n');
  const results = [];
  const seenTests = new Set(); // prevent duplicates

  // ----- PASS 1: Line-by-line parsing (structured input) -----
  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const ref = REFERENCE_RANGES[parsed.name];
    if (!ref) continue;
    const key = parsed.name;
    if (seenTests.has(key)) continue;
    seenTests.add(key);
    results.push({
      ...parsed,
      ptName: ref.ptName,
      ref,
      status: getStatus(parsed.value, ref),
    });
  }

  // ----- PASS 2: Section-based extraction (unstructured paste) -----
  // Only if we got few results from structured parsing
  if (results.length < 2) {
    const allLines = lines.map((l, i) => ({ text: l.trim(), index: i }));

    for (let i = 0; i < allLines.length; i++) {
      const lineText = allLines[i].text;
      const normLine = normalize(lineText);

      // Check for known section headers (also match partial like "ERITROGRAMA" in any text)
      let sectionKey = null;
      for (const [key] of Object.entries(SECTION_TESTS)) {
        if (normLine === key || normLine.includes(key)) {
          sectionKey = key;
          break;
        }
      }
      if (!sectionKey) continue;

      const expectedTests = SECTION_TESTS[sectionKey];

      // Collect all numbers from subsequent lines, tracking positions
      const rawValues = []; // { value, index }
      for (let j = i + 1; j < allLines.length; j++) {
        const nextText = allLines[j].text;
        const nextNorm = normalize(nextText);

        // Stop at next section header
        let isNextSection = false;
        for (const key of Object.keys(SECTION_TESTS)) {
          if (nextNorm === key || nextNorm.includes(key)) { isNextSection = true; break; }
        }
        if (isNextSection) break;

        const nums = extractNumbers(nextText);
        // Lines with exactly 1 number → candidate values
        // Lines with 2+ numbers → likely reference ranges (skip)
        if (nums.length === 1) {
          const n = nums[0];
          if (n > 0 && n < 100000) rawValues.push({ value: n, index: j });
        }
      }

      // Filter out reference-range pairs: if two consecutive single-number lines
      // form an ascending pair (a < b), skip both as they're likely ref min/max
      const candidates = [];
      let skipNext = false;
      for (let v = 0; v < rawValues.length; v++) {
        if (skipNext) { skipNext = false; continue; }
        const curr = rawValues[v];
        const next = rawValues[v + 1];
        // Check if curr and next form a plausible ref range (ascending, both reasonable)
        if (next && curr.value > 0 && next.value > curr.value && next.value <= 500 && next.index === curr.index + 1) {
          skipNext = true;
          continue;
        }
        candidates.push(curr.value);
      }

      // Smart matching: pair each candidate with the test whose reference range
      // it falls closest to (handles varying lab report column orders)
      const availableTests = expectedTests.filter(t => !seenTests.has(t) && REFERENCE_RANGES[t]);
      const usedCandidates = new Set();

      for (const testName of availableTests) {
        const ref = REFERENCE_RANGES[testName];
        if (!ref) continue;
        // Find the candidate value closest to this test's reference range midpoint
        const refMid = (ref.min + ref.max) / 2;
        let bestIdx = -1;
        let bestDist = Infinity;
        for (let c = 0; c < candidates.length; c++) {
          if (usedCandidates.has(c)) continue;
          const dist = Math.abs(candidates[c] - refMid);
          // Prefer values that are within or near the reference range
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = c;
          }
        }
        if (bestIdx >= 0) {
          usedCandidates.add(bestIdx);
          seenTests.add(testName);
          results.push({
            name: testName,
            value: candidates[bestIdx],
            unit: ref.unit,
            originalName: ref.ptName,
            ptName: ref.ptName,
            ref,
            status: getStatus(candidates[bestIdx], ref),
          });
        }
      }
    }
  }

  // ----- PASS 3: Keyword-based extraction (text has test names but not on the same line as values) -----
  if (results.length < 2) {
    // Find all known test name occurrences and nearby numbers
    const allText = text;
    const normText = normalize(allText);

    for (const [rawKey, mappedName] of Object.entries(TEST_NAME_MAP)) {
      if (seenTests.has(mappedName)) continue;
      const ref = REFERENCE_RANGES[mappedName];
      if (!ref) continue;

      // Find the keyword position in the normalized text
      const normKey = normalize(rawKey);
      const idx = normText.indexOf(normKey);
      if (idx < 0) continue;

      // Search for a number within ~100 chars after the keyword
      const searchWindow = allText.substring(idx, idx + 200);
      const nums = extractNumbers(searchWindow);
      if (nums.length === 0) continue;

      // Take the first plausible number
      const value = nums[0];
      if (value <= 0 || value > 100000) continue;

      seenTests.add(mappedName);
      results.push({
        name: mappedName,
        value,
        unit: ref.unit,
        originalName: ref.ptName,
        ptName: ref.ptName,
        ref,
        status: getStatus(value, ref),
      });
    }
  }

  return results;
}

export function generateMarkdownReport(results) {
  if (!results || results.length === 0) return '';
  const normal = results.filter(r => r.status === 'normal');
  const abnormal = results.filter(r => r.status !== 'normal');

  let md = `**${results.length} exame(s)** — ${normal.length} normal(is)`;
  if (abnormal.length > 0) md += `, **${abnormal.length} alterado(s)**`;
  md += '\n\n';

  if (abnormal.length > 0) {
    md += '## Achados Relevantes\n\n';
    for (const r of abnormal) {
      const dir = r.status === 'high' ? '↑ Acima' : '↓ Abaixo';
      md += `- **${r.ptName}**: ${r.value} ${r.ref.unit} — ${dir} (ref: ${r.ref.min}–${r.ref.max})\n`;
    }
  } else {
    md += '✅ Todos os exames dentro dos valores de referência.';
  }
  return md;
}

export function generateFullTableReport(results) {
  if (!results || results.length === 0) return '';
  let md = '# Relatório de Exames Laboratoriais\n\n';
  md += '| Exame | Valor | Referência | Status |\n';
  md += '|-------|-------|------------|--------|\n';
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