function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "Not Provided";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function escapePdfText(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function textWidth(value, fontSize) {
  return String(value).length * fontSize * 0.48;
}

function wrapText(value, maxWidth, fontSize) {
  const words = String(value || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && textWidth(next, fontSize) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function selectedItems(data) {
  if (data.mode === "full-service") {
    return [
      `Package: ${data.selections.package.label}`,
      `Meats: ${data.selections.meats.join(", ") || "None"}`,
      `Sides: ${data.selections.sides.join(", ") || "None"}`,
      `Dessert: ${data.selections.desserts.join(", ") || "None"}`
    ];
  }

  return [...data.prep.meats, ...data.prep.sides, ...data.prep.desserts, ...data.prep.beverages].map((item) => {
    const unit = item.unitLabel || item.unit || item.container?.label || "each";
    return `${item.label}: ${item.orderQuantity} ${unit}`;
  });
}

function serviceStyle(data) {
  return data.mode === "full-service" ? data.input.venueType.label : data.input.fulfillment.label;
}

function quoteLines(data) {
  return [
    "Event Details",
    `Guest Name: ${data.input.guestName || "Not Provided"}`,
    `Phone Number: ${data.input.guestPhone || "Not Provided"}`,
    `Email Address: ${data.input.guestEmail || "Not Provided"}`,
    `Event Type: ${data.input.eventType || "Not Provided"}`,
    `Event Date: ${formatDate(data.input.eventDate)}`,
    `Guest Count: ${data.input.guestCount}`,
    `Service Style: ${serviceStyle(data)}`,
    "",
    "Selected Menu Items",
    ...selectedItems(data).map((item) => `- ${item}`),
    "",
    "Pricing Breakdown",
    ...data.quote.lines.map((line) => `${line.label}: ${line.value}`),
    `Estimated Total: ${formatMoney(data.quote.totalQuote)}`,
    "",
    "Quote Disclaimer",
    data.disclaimer
  ];
}

function buildPageContent(lines, pageNumber, pageCount) {
  const commands = [
    "0.07 0.07 0.07 rg",
    "BT",
    "/F2 18 Tf",
    "54 742 Td",
    "(Black Board Bar-B-Q) Tj",
    "0 -24 Td",
    "/F1 13 Tf",
    "(Catering & Event Quote Estimate) Tj",
    "ET",
    "0.86 0.86 0.86 RG",
    "54 694 m 558 694 l S"
  ];
  let y = 672;

  lines.forEach(({ text, size = 10, bold = false }) => {
    commands.push("BT", `/${bold ? "F2" : "F1"} ${size} Tf`, `54 ${y} Td`, `(${escapePdfText(text)}) Tj`, "ET");
    y -= size + 6;
  });

  commands.push(
    "BT",
    "/F1 8 Tf",
    `54 36 Td`,
    `(${escapePdfText(`Page ${pageNumber} of ${pageCount}`)}) Tj`,
    "ET"
  );

  return commands.join("\n");
}

function paginate(lines) {
  const maxWidth = 504;
  const pages = [];
  let page = [];
  let used = 0;

  lines.forEach((line) => {
    if (line === "") {
      if (used + 10 > 560) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push({ text: "", size: 8 });
      used += 10;
      return;
    }

    const isHeading = !line.includes(":") && !line.startsWith("-") && line.length < 40;
    const size = isHeading ? 12 : 9;
    const wrapped = wrapText(line, maxWidth, size);
    wrapped.forEach((text, index) => {
      if (used + size + 6 > 560) {
        pages.push(page);
        page = [];
        used = 0;
      }
      page.push({
        text,
        size,
        bold: isHeading && index === 0
      });
      used += size + 6;
    });
  });

  if (page.length) pages.push(page);
  return pages;
}

function createPdf(objects) {
  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets[index + 1] = Buffer.byteLength(chunks.join(""), "utf8");
    chunks.push(`${index + 1} 0 obj\n${object}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "utf8");
  chunks.push(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`);
  offsets.slice(1).forEach((offset) => {
    chunks.push(`${String(offset).padStart(10, "0")} 00000 n \n`);
  });
  chunks.push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.from(chunks.join(""), "utf8");
}

function buildQuotePdf(data) {
  const pages = paginate(quoteLines(data));
  const pageObjects = pages.map((_, index) => 5 + index * 2);
  const objects = [
    `<< /Type /Catalog /Pages 2 0 R >>`,
    `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`,
    `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`
  ];

  pages.forEach((page, index) => {
    const content = buildPageContent(page, index + 1, pages.length);
    const contentObjectId = 6 + index * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      `<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream`
    );
  });

  return createPdf(objects);
}

module.exports = {
  buildQuotePdf
};
