const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const tls = require("node:tls");

const dataDir = path.resolve(__dirname, "..", "data");
const submissionsPath = path.join(dataDir, "quote-submissions.json");

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "Not provided";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function flattenInvoice(invoice) {
  const itemLines = (invoice?.items || []).map((item) => `${item.label}: ${formatMoney(item.total)}`);
  const summary = invoice?.summary || {};

  return [
    ...itemLines,
    "",
    `Subtotal: ${formatMoney(summary.subtotal)}`,
    `Taxes: ${formatMoney(summary.taxes)}`,
    `Fees: ${formatMoney(summary.fees)}`,
    `Deposit amount: ${formatMoney(summary.depositAmount)}`,
    `Estimated total: ${formatMoney(summary.estimatedTotal)}`
  ];
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
    return `${item.label}: ${item.orderQuantity.toFixed ? item.orderQuantity.toFixed(2) : item.orderQuantity} ${unit}`;
  });
}

function getQuoteRecipients({ config, contact }) {
  return [
    contact.email,
    process.env.QUOTE_COPY_EMAIL || config.quoteRequest.copyRecipientEmail || config.quoteRequest.recipientEmail
  ]
    .map((email) => String(email || "").trim())
    .filter(Boolean)
    .filter((email, index, emails) => emails.indexOf(email) === index);
}

function buildQuoteEmail({ config, quoteData, contact, notes, recipient }) {
  const subjectPrefix = config.quoteRequest.subjectPrefix || "Catering Quote Request";
  const subject = `${subjectPrefix} - ${quoteData.input.guestCount} guests on ${formatDate(quoteData.input.eventDate)}`;
  const serviceStyle =
    quoteData.mode === "full-service" ? quoteData.input.venueType.label : quoteData.input.fulfillment.label;
  const lines = [
    "A catering estimate follow-up request was sent through the website.",
    "",
    `Guest name: ${contact.name || quoteData.input.guestName || "Not provided"}`,
    `Phone number: ${contact.phone || quoteData.input.guestPhone || "Not provided"}`,
    `Email address: ${contact.email || quoteData.input.guestEmail || "Not provided"}`,
    `Event type: ${quoteData.input.eventType || "Not provided"}`,
    `Event date: ${formatDate(quoteData.input.eventDate)}`,
    `Guest count: ${quoteData.input.guestCount}`,
    `Selected service style: ${serviceStyle}`,
    "",
    "Selected Menu Items:",
    ...selectedItems(quoteData).map((line) => `- ${line}`),
    "",
    "Draft Invoice Summary:",
    ...flattenInvoice(quoteData.quote.invoice),
    "",
    `Estimated total: ${formatMoney(quoteData.quote.totalQuote)}`,
    `Deposit amount: ${formatMoney(quoteData.quote.deposit)}`,
    "",
    `Notes: ${notes || "None"}`
  ];

  return {
    recipient,
    subject,
    text: lines.join("\n")
  };
}

function buildQuoteEmails({ config, quoteData, contact, notes }) {
  return getQuoteRecipients({ config, contact }).map((recipient) =>
    buildQuoteEmail({
      config,
      quoteData,
      contact,
      notes,
      recipient
    })
  );
}

function captureSubmission(message) {
  fs.mkdirSync(dataDir, { recursive: true });
  const existing = fs.existsSync(submissionsPath) ? JSON.parse(fs.readFileSync(submissionsPath, "utf8")) : [];
  existing.push({
    createdAt: new Date().toISOString(),
    recipient: message.recipient,
    subject: message.subject,
    text: message.text
  });
  fs.writeFileSync(submissionsPath, `${JSON.stringify(existing, null, 2)}\n`);
}

function encodeBase64(value) {
  return Buffer.from(value || "", "utf8").toString("base64");
}

function smtpCommand(socket, command, expectedCodes) {
  return new Promise((resolve, reject) => {
    let buffer = "";

    function onData(chunk) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1] || "";
      if (!/^\d{3} /.test(lastLine)) return;

      socket.off("data", onData);
      const code = Number(lastLine.slice(0, 3));
      if (!expectedCodes.includes(code)) {
        reject(new Error(`SMTP rejected ${command || "connection"} with ${code}.`));
        return;
      }
      resolve(buffer);
    }

    socket.on("data", onData);
    if (command) socket.write(`${command}\r\n`);
  });
}

function connectSmtp({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    const socket = secure ? tls.connect(port, host) : net.connect(port, host);
    socket.once("error", reject);
    socket.once("connect", () => resolve(socket));
  });
}

async function sendSmtp(message, settings) {
  const socket = await connectSmtp(settings);
  socket.setTimeout(15000);

  try {
    await smtpCommand(socket, "", [220]);
    await smtpCommand(socket, `EHLO ${settings.helloName}`, [250]);

    if (!settings.secure && settings.startTls) {
      await smtpCommand(socket, "STARTTLS", [220]);
      const secureSocket = tls.connect({ socket, servername: settings.host });
      await smtpCommand(secureSocket, `EHLO ${settings.helloName}`, [250]);
      await authenticateAndSend(secureSocket, message, settings);
      return;
    }

    await authenticateAndSend(socket, message, settings);
  } finally {
    socket.end();
  }
}

async function authenticateAndSend(socket, message, settings) {
  if (settings.user || settings.pass) {
    await smtpCommand(socket, "AUTH LOGIN", [334]);
    await smtpCommand(socket, encodeBase64(settings.user), [334]);
    await smtpCommand(socket, encodeBase64(settings.pass), [235]);
  }

  const body = [
    `From: ${settings.from}`,
    `To: ${message.recipient}`,
    `Subject: ${message.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "",
    message.text
  ].join("\r\n");

  await smtpCommand(socket, `MAIL FROM:<${settings.from}>`, [250]);
  await smtpCommand(socket, `RCPT TO:<${message.recipient}>`, [250, 251]);
  await smtpCommand(socket, "DATA", [354]);
  await smtpCommand(socket, `${body.replace(/\r?\n\./g, "\r\n..")}\r\n.`, [250]);
  await smtpCommand(socket, "QUIT", [221]);
}

function getSmtpSettings(config) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  if (!host) return null;

  return {
    host,
    port,
    secure,
    startTls: process.env.SMTP_STARTTLS !== "false" && !secure,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from:
      config.quoteRequest.senderEmail ||
      config.quoteRequest.recipientEmail ||
      process.env.SMTP_FROM ||
      "melissa@blackboardbarbq.com",
    helloName: process.env.SMTP_HELO || "blackboardbarbq.com"
  };
}

async function sendQuoteRequest({ config, quoteData, contact, notes }) {
  const messages = buildQuoteEmails({ config, quoteData, contact, notes });
  const deliveryMode = process.env.EMAIL_DELIVERY_MODE || config.quoteRequest.deliveryMode || "smtp";

  if (messages.length === 0) {
    throw new Error("Please provide an email address for quote follow-up.");
  }

  if (deliveryMode === "capture") {
    messages.forEach(captureSubmission);
    return {
      delivered: true,
      mode: "capture",
      recipients: messages.map((message) => message.recipient)
    };
  }

  const smtpSettings = getSmtpSettings(config);
  if (!smtpSettings) {
    throw new Error("Email delivery is not configured. Set SMTP_HOST and related SMTP environment variables.");
  }

  for (const message of messages) {
    await sendSmtp(message, smtpSettings);
  }
  return {
    delivered: true,
    mode: "smtp",
    recipients: messages.map((message) => message.recipient)
  };
}

module.exports = {
  buildQuoteEmail,
  buildQuoteEmails,
  sendQuoteRequest,
  submissionsPath
};
