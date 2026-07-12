type PdfSection = {
  title: string;
  lines: string[];
};

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, max = 82) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";

  words.forEach((word) => {
    if (`${line} ${word}`.trim().length > max) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`.trim();
    }
  });

  if (line) {
    lines.push(line);
  }

  return lines;
}

export function downloadReportPdf({
  filename,
  title,
  subtitle,
  sections,
  scores
}: {
  filename: string;
  title: string;
  subtitle: string;
  sections: PdfSection[];
  scores: Array<{ label: string; value: number }>;
}) {
  const pages: string[] = [];
  let ops: string[] = [];
  let y = 742;

  function addRaw(command: string) {
    ops.push(command);
  }

  function setColor(r: number, g: number, b: number) {
    addRaw(`${r} ${g} ${b} rg`);
  }

  function addText(text: string, size = 10, bold = false, color: [number, number, number] = [0.06, 0.09, 0.16]) {
    const lines = wrapText(text);
    lines.forEach((line) => {
      ensureSpace(18);
      setColor(...color);
      addRaw(`BT /F${bold ? 2 : 1} ${size} Tf 54 ${y} Td (${escapePdfText(line)}) Tj ET`);
      y -= size + 6;
    });
  }

  function addGap(amount = 10) {
    y -= amount;
  }

  function ensureSpace(amount: number) {
    if (y - amount < 54) {
      pages.push(ops.join("\n"));
      ops = [];
      y = 742;
      addText("Venture Connect VC Readiness Report", 11, true, [0.15, 0.39, 0.92]);
      addGap(8);
    }
  }

  function addBar(label: string, value: number) {
    ensureSpace(38);
    addText(`${label}: ${value}/100`, 10, true);
    setColor(0.9, 0.94, 1);
    addRaw(`54 ${y - 2} 500 8 re f`);
    setColor(0.15, 0.39, 0.92);
    addRaw(`54 ${y - 2} ${Math.max(8, Math.min(value, 100) * 5)} 8 re f`);
    y -= 22;
  }

  setColor(0.02, 0.09, 0.18);
  addRaw("0 704 612 88 re f");
  addText("Venture Connect", 12, true, [1, 1, 1]);
  addText(title, 20, true, [1, 1, 1]);
  addText(subtitle, 10, false, [0.86, 0.91, 1]);
  y = 668;

  addText("Investor Scorecard", 14, true, [0.15, 0.39, 0.92]);
  scores.forEach((score) => addBar(score.label, score.value));
  addGap(8);

  sections.forEach((section) => {
    ensureSpace(48);
    addText(section.title, 13, true, [0.15, 0.39, 0.92]);
    section.lines.forEach((line) => addText(line, 10));
    addGap(8);
  });

  pages.push(ops.join("\n"));

  const objects: string[] = [];
  const pageCount = pages.length;
  const font1Id = 3 + pageCount * 2;
  const font2Id = font1Id + 1;
  const pageIds = pages.map((_, index) => 3 + index * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;

  pages.forEach((content, index) => {
    const pageId = 3 + index * 2;
    const contentId = pageId + 1;
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${font1Id} 0 R /F2 ${font2Id} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`;
  });

  objects[font1Id] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[font2Id] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = new TextEncoder().encode(pdf).length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }

  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    pdf += `${offsets[index].toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
