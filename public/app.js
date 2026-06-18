const form = document.querySelector("#quote-form");
const isAdminView = window.location.pathname === "/admin";
const adminDatabaseEl = document.querySelector("#admin-database");
const configEditorEl = document.querySelector("#config-editor");
const configSaveEl = document.querySelector("#config-save");
const configResetEl = document.querySelector("#config-reset");
const configStatusEl = document.querySelector("#config-status");
const errorEl = document.querySelector("#form-error");
const resultsEl = document.querySelector("#results");
const emptyStateEl = document.querySelector("#empty-state");
const resultModeLabelEl = document.querySelector("#result-mode-label");
const quoteTitleEl = document.querySelector("#quote-title");
const quoteTotalEl = document.querySelector("#quote-total");
const quoteLinesEl = document.querySelector("#quote-lines");
const depositTotalEl = document.querySelector("#deposit-total");
const guestSummaryEl = document.querySelector("#guest-summary");
const guestSummaryCopyEl = document.querySelector("#guest-summary-copy");
const invoiceItemsEl = document.querySelector("#invoice-items");
const invoiceSummaryEl = document.querySelector("#invoice-summary");
const requestActionEl = document.querySelector("#request-action");
const pdfActionEl = document.querySelector("#pdf-action");
const requestStatusEl = document.querySelector("#request-status");
const depositLabelEl = document.querySelector(".deposit-box span");
const requestDialogEl = document.querySelector("#request-dialog");
const requestFormEl = document.querySelector("#request-form");
const requestCancelEl = document.querySelector("#request-cancel");
const pricingNoticeEl = document.querySelector("#pricing-notice");
const disclaimerEl = document.querySelector("#disclaimer");
const adminBreakdownEl = document.querySelector("#admin-breakdown");
const adminDetailsEl = document.querySelector("#admin-details");
const detailEyebrowEl = document.querySelector("#detail-eyebrow");
const detailTitleEl = document.querySelector("#detail-title");
const detailGridEl = document.querySelector("#detail-grid");
const quantityPreviewListEl = document.querySelector("#quantity-preview-list");
const viewEyebrowEl = document.querySelector("#view-eyebrow");
const packageSelectionsEl = document.querySelector("#package-selections");
const eventTypeFieldsetEl = document.querySelector("#event-type-fieldset");
const fulfillmentFieldsetEl = document.querySelector("#fulfillment-fieldset");
const LARGE_PARTY_VENUE_TYPE = "large-party-reservation";

let calculatorConfig;
let latestQuoteData;
let latestQuotePayload;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function formatMoney(value) {
  return money.format(value || 0);
}

function roundQuantity(value) {
  return Math.round((Number(value) + Number.EPSILON) * 2) / 2;
}

function formatQuantity(value) {
  return roundQuantity(value).toFixed(2);
}

function formatRate(rate) {
  const percent = Math.round((Number(rate || 0) * 100 + Number.EPSILON) * 100) / 100;
  return `${percent.toFixed(2).replace(/\.?0+$/, "")}%`;
}

function formatDate(value) {
  if (!value) return "Date TBD";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${value}T00:00:00`));
}

function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getActiveMode() {
  return form.calculatorType.value;
}

function getSelectedVenueTypeId() {
  return form.venueType?.value || "";
}

function isLargePartyReservation() {
  return getActiveMode() === "full-service" && getSelectedVenueTypeId() === LARGE_PARTY_VENUE_TYPE;
}

function getCalculationMode() {
  return isLargePartyReservation() ? "a-la-carte" : getActiveMode();
}

function getGuestCount() {
  const value = Number(form.guestCount.value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function getCheckedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function getActiveItems(items) {
  return items.filter((item) => item.active !== false);
}

function findById(items, id) {
  return items.find((item) => item.id === id);
}

function getOuncesPerPound() {
  return calculatorConfig.units.ouncesPerPound;
}

function getOuncesPerQuart() {
  return calculatorConfig.units.ouncesPerQuart;
}

function getItemOuncesPerUnit(item) {
  if (Number.isFinite(Number(item.ouncesPerUnit)) && Number(item.ouncesPerUnit) > 0) {
    return Number(item.ouncesPerUnit);
  }

  if (item.unit === "lb") return getOuncesPerPound();
  if (item.unit === "quart") return getOuncesPerQuart();
  return 0;
}

function getDessertDefaultSize() {
  const defaultSizeId = calculatorConfig?.aLaCarte?.dessertDefaultContainerSize || "full-tray";
  return findById(calculatorConfig.aLaCarte.dessertContainerSizes, defaultSizeId);
}

function getPortionMeta(item, fallbackOuncesPerGuest = 0) {
  const ouncesPerGuest = Number(item.ouncesPerGuest || fallbackOuncesPerGuest || 0);
  const piecesPerGuest = Number(item.piecesPerGuest || 0);
  const portionsPerGuest = Number(item.portionsPerGuest || 0);

  if (ouncesPerGuest > 0) return `${ouncesPerGuest} oz/guest`;
  if (piecesPerGuest > 0) return `${piecesPerGuest} pc/guest`;
  if (portionsPerGuest > 0) {
    return `${portionsPerGuest} serving${portionsPerGuest === 1 ? "" : "s"}/guest`;
  }
  return "Portion pending";
}

function getRecommendedQuantity(category, item, guests) {
  if (!guests || !item) return 0;

  const ouncesPerGuest = Number(item.ouncesPerGuest || 0);
  const piecesPerGuest = Number(item.piecesPerGuest || 0);

  if (ouncesPerGuest > 0) {
    const ouncesPerUnit = getItemOuncesPerUnit(item);
    return ouncesPerUnit ? Math.ceil((guests * ouncesPerGuest) / ouncesPerUnit) : 0;
  }

  if (piecesPerGuest > 0) {
    return Math.ceil(Math.ceil(guests * piecesPerGuest) / (item.piecesPerUnit || 1));
  }

  if (category === "desserts" && item.priceByContainer) {
    const size = getDessertDefaultSize();
    const portions = Math.ceil(guests * item.portionsPerGuest);
    return Math.ceil(portions / size.servings);
  }

  if (category === "beverages") {
    const servings = Math.ceil(guests * item.servingsPerGuest);
    return Math.ceil(servings / item.servingsPerUnit);
  }

  return 0;
}

function getQuantityUnitLabel(category, item) {
  if (category === "desserts" && item.priceByContainer) return getDessertDefaultSize()?.label || "unit";
  return item.unitLabel || item.unit || "unit";
}

function formatRecommendedQuantity(category, item, quantity) {
  if (category === "meats" && item.unit === "lb") {
    return `${formatQuantity(quantity)} lb cooked recommended`;
  }

  return `${formatQuantity(quantity)} ${getQuantityUnitLabel(category, item)} recommended`;
}

function appendText(parent, tagName, text, className) {
  const node = document.createElement(tagName);
  node.textContent = text;
  if (className) node.className = className;
  parent.append(node);
  return node;
}

function renderChoice(containerId, item, inputType, name, checked, meta) {
  const container = document.querySelector(containerId);
  const label = document.createElement("label");
  label.className = "choice";

  const input = document.createElement("input");
  input.type = inputType;
  input.name = name;
  input.value = item.id;
  input.checked = checked;

  const content = document.createElement("span");
  content.className = "choice-content";
  appendText(content, "span", item.label, "choice-name");
  if (meta) appendText(content, "span", meta, "choice-meta");

  label.append(input, content);
  container.append(label);
}

function getDefaultUnitPrice(category, item, sizeId = calculatorConfig?.aLaCarte?.dessertDefaultContainerSize || "full-tray") {
  if (category === "desserts" && item.priceByContainer) {
    return item.priceByContainer[sizeId] || 0;
  }

  return item.pricePerUnit || 0;
}

function formatUnitPrice(category, item, sizeId = "full-tray") {
  const unitPrice = getDefaultUnitPrice(category, item, sizeId);
  const unitLabel =
    category === "desserts" && item.priceByContainer
      ? findById(calculatorConfig.aLaCarte.dessertContainerSizes, sizeId)?.label
      : item.unitLabel || item.unit || "each";
  return unitPrice ? `${formatMoney(unitPrice)} / ${unitLabel}` : "Price pending";
}

function quantityInputName(category, id) {
  return `quantity-${category}-${id}`;
}

function renderAlaCarteItem(containerId, item, category, checked = false) {
  const container = document.querySelector(containerId);
  const row = document.createElement("div");
  row.className = "item-row";
  row.dataset.category = category;
  row.dataset.itemId = item.id;

  const label = document.createElement("label");
  label.className = "choice item-choice";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.name = category;
  input.value = item.id;
  input.checked = checked;

  const content = document.createElement("span");
  content.className = "choice-content";
  appendText(content, "span", item.label, "choice-name");
  if (item.menuHelperText) appendText(content, "span", item.menuHelperText, "choice-helper");
  const meta = getAlaCarteMeta(item, category);
  if (meta) appendText(content, "span", meta, "choice-meta");
  label.append(input, content);

  const controls = document.createElement("div");
  controls.className = "item-controls";

  const quantityLabel = document.createElement("label");
  quantityLabel.className = "mini-field";
  appendText(quantityLabel, "span", "Quantity");
  const quantity = document.createElement("input");
  quantity.type = "number";
  quantity.name = quantityInputName(category, item.id);
  quantity.min = "0";
  quantity.step = item.unit === "lb" ? "0.5" : "1";
  quantity.placeholder = "Auto";
  quantity.dataset.quantityCategory = category;
  quantity.dataset.quantityId = item.id;
  quantityLabel.append(quantity);
  controls.append(quantityLabel);

  row.append(label, controls);
  container.append(row);
}

function getAlaCarteMeta(item, category) {
  if (!isAdminView) return "";

  if (category === "meats" || category === "sides") {
    return `${getPortionMeta(item)} · ${formatUnitPrice(category, item)}`;
  }

  if (category === "desserts") {
    const size = getDessertDefaultSize();
    return `${getPortionMeta(item)} · ${formatUnitPrice(category, item, size.id)}`;
  }
  return `${item.yieldNote || "Sold by unit"} · ${formatUnitPrice(category, item)}`;
}

function getSelectedPackage() {
  return findById(calculatorConfig.fullService.packages, form.packageId?.value);
}

function renderPackageChoiceGroup(title, items, name, requiredCount) {
  const section = document.createElement("section");
  section.className = "package-choice-section";
  appendText(section, "h3", title);
  appendText(section, "p", `Choose exactly ${requiredCount}.`, "choice-help");

  const grid = document.createElement("div");
  grid.className = "choice-grid package-option-grid";
  items.forEach((item) => {
    renderChoiceNode(grid, item, requiredCount === 1 ? "radio" : "checkbox", name, false);
  });
  section.append(grid);
  packageSelectionsEl.append(section);
}

function renderChoiceNode(container, item, inputType, name, checked, meta) {
  const label = document.createElement("label");
  label.className = "choice";

  const input = document.createElement("input");
  input.type = inputType;
  input.name = name;
  input.value = item.id;
  input.checked = checked;

  const content = document.createElement("span");
  content.className = "choice-content";
  appendText(content, "span", item.label, "choice-name");
  if (meta) appendText(content, "span", meta, "choice-meta");

  label.append(input, content);
  container.append(label);
}

function renderFixedPackageSelections(selectedPackage) {
  const fixedMeats = (selectedPackage.fixedMeats || [])
    .map((id) => findById(calculatorConfig.aLaCarte.meats, id))
    .filter(Boolean);
  const fixedSides = (selectedPackage.fixedSides || [])
    .map((id) => findById(calculatorConfig.aLaCarte.sides, id))
    .filter(Boolean);

  if (fixedMeats.length === 0 && fixedSides.length === 0) return;

  const section = document.createElement("section");
  section.className = "package-choice-section";
  appendText(section, "h3", "Included Fixed Selections");

  const list = document.createElement("ul");
  [...fixedMeats, ...fixedSides].forEach((item) => {
    const li = document.createElement("li");
    appendText(li, "strong", item.label);
    appendText(li, "span", item.yieldNote || "Included with this package.");
    list.append(li);
  });
  section.append(list);
  packageSelectionsEl.append(section);
}

function renderPackageSelections() {
  if (!calculatorConfig || !packageSelectionsEl) return;

  packageSelectionsEl.replaceChildren();
  const selectedPackage = getSelectedPackage();
  if (!selectedPackage) return;

  renderFixedPackageSelections(selectedPackage);

  if (selectedPackage.requiredMeats > 0) {
    renderPackageChoiceGroup("Meats", getActiveItems(calculatorConfig.aLaCarte.meats), "packageMeats", selectedPackage.requiredMeats);
  }

  if (selectedPackage.requiredSides > 0) {
    renderPackageChoiceGroup("Sides", getActiveItems(calculatorConfig.aLaCarte.sides), "packageSides", selectedPackage.requiredSides);
  }

  if (selectedPackage.requiredDesserts > 0) {
    renderPackageChoiceGroup(
      "Dessert",
      getActiveItems(calculatorConfig.aLaCarte.desserts),
      "packageDesserts",
      selectedPackage.requiredDesserts
    );
  }

  if (packageSelectionsEl.children.length === 0) {
    appendText(packageSelectionsEl, "p", "This package has fixed menu selections.", "choice-help");
  }
}

function renderMenu(config) {
  [
    "#full-service-packages",
    "#venue-types",
    "#fulfillment-options",
    "#a-la-carte-meats",
    "#a-la-carte-sides",
    "#a-la-carte-desserts",
    "#a-la-carte-beverages"
  ].forEach((selector) => document.querySelector(selector).replaceChildren());

  config.fullService.packages.forEach((item, index) => {
    renderChoice(
      "#full-service-packages",
      item,
      "radio",
      "packageId",
      index === 1,
      `${formatMoney(item.pricePerPerson)}/guest · ${item.includes}`
    );
  });

  config.fullService.venueTypes.forEach((item, index) => {
    const minimum = formatMoney(item.foodBeverageMinimum);
    const rental = item.rentalFee ? ` · ${formatMoney(item.rentalFee)} rental` : "";
    const meta = item.description || `${minimum} minimum${rental}`;
    renderChoice("#venue-types", item, "radio", "venueType", index === 0, meta);
  });

  config.aLaCarte.fulfillmentOptions.filter((item) => item.menuVisible !== false).forEach((item, index) => {
    renderChoice("#fulfillment-options", item, "radio", "fulfillment", index === 1, item.description);
  });

  getActiveItems(config.aLaCarte.meats).forEach((item, index) => {
    renderAlaCarteItem("#a-la-carte-meats", item, "meats", index < 2);
  });

  getActiveItems(config.aLaCarte.sides).forEach((item) => {
    const checked = item.id === "mac-n-cheese" || item.id === "stone-ground-potato-salad";
    renderAlaCarteItem("#a-la-carte-sides", item, "sides", checked);
  });

  getActiveItems(config.aLaCarte.desserts).forEach((item) => {
    renderAlaCarteItem("#a-la-carte-desserts", item, "desserts");
  });

  getActiveItems(config.aLaCarte.beverages).forEach((item) => {
    renderAlaCarteItem("#a-la-carte-beverages", item, "beverages");
  });

  renderPackageSelections();
}

function syncConfigEditor() {
  if (!isAdminView || !configEditorEl) return;
  adminDatabaseEl.hidden = false;
  configEditorEl.value = JSON.stringify(calculatorConfig, null, 2);
}

async function saveConfigEditor() {
  configStatusEl.textContent = "";

  try {
    const nextConfig = JSON.parse(configEditorEl.value);
    const response = await fetch("/api/config", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(nextConfig)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to save calculator values.");
    }

    calculatorConfig = data;
    syncConfigEditor();
    renderMenu(calculatorConfig);
    syncMode();
    configStatusEl.textContent = "Saved. The calculator is now using these values.";
  } catch (error) {
    configStatusEl.textContent = error.message;
  }
}

async function resetConfigEditor() {
  configStatusEl.textContent = "";

  try {
    const response = await fetch("/api/config/reset", {
      method: "POST"
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to reset calculator values.");
    }

    calculatorConfig = data;
    syncConfigEditor();
    renderMenu(calculatorConfig);
    syncMode();
    configStatusEl.textContent = "Defaults restored. The calculator is now using default values.";
  } catch (error) {
    configStatusEl.textContent = error.message;
  }
}

function collectQuantities(category) {
  return [...form.querySelectorAll(`[data-quantity-category="${category}"]`)].reduce((quantities, input) => {
    if (!input.disabled && input.value !== "") {
      quantities[input.dataset.quantityId] = Number(input.value);
    }
    return quantities;
  }, {});
}

function collectDessertSizes() {
  return [...form.querySelectorAll("[data-dessert-size-for]")].reduce((sizes, select) => {
    sizes[select.dataset.dessertSizeFor] = select.value;
    return sizes;
  }, {});
}

function collectPayload() {
  const calculatorType = getCalculationMode();
  const payload = {
    calculatorType,
    guestName: form.guestName.value,
    guestPhone: form.guestPhone.value,
    guestEmail: form.guestEmail.value,
    eventType: form.eventType.value,
    eventDate: form.eventDate.value,
    guestCount: Number(form.guestCount.value)
  };

  if (calculatorType === "full-service") {
    payload.packageId = form.packageId.value;
    payload.venueType = form.venueType.value;
    payload.packageMeats = getCheckedValues("packageMeats");
    payload.packageSides = getCheckedValues("packageSides");
    payload.packageDesserts = getCheckedValues("packageDesserts");
    return payload;
  }

  return {
    ...payload,
    fulfillment: isLargePartyReservation() ? LARGE_PARTY_VENUE_TYPE : form.fulfillment.value,
    meats: getCheckedValues("meats"),
    sides: getCheckedValues("sides"),
    desserts: getCheckedValues("desserts"),
    beverages: getCheckedValues("beverages"),
    dessertSizes: collectDessertSizes(),
    quantities: {
      meats: collectQuantities("meats"),
      sides: collectQuantities("sides"),
      desserts: collectQuantities("desserts"),
      beverages: collectQuantities("beverages")
    }
  };
}

function renderQuoteLines(lines) {
  quoteLinesEl.replaceChildren();

  lines.forEach((line) => {
    const row = document.createElement("div");
    const term = document.createElement("dt");
    const definition = document.createElement("dd");

    term.textContent = line.label;
    definition.textContent = line.kind === "currency" ? formatMoney(line.value) : line.value;
    row.append(term, definition);
    quoteLinesEl.append(row);
  });
}

function appendInvoiceRow(container, label, value) {
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const definition = document.createElement("dd");
  term.textContent = label;
  definition.textContent = formatMoney(value);
  row.append(term, definition);
  container.append(row);
}

function renderInvoice(invoice) {
  invoiceItemsEl.replaceChildren();
  invoiceSummaryEl.replaceChildren();

  (invoice?.items || []).forEach((item) => {
    appendInvoiceRow(invoiceItemsEl, item.label, item.total);
  });

  const summary = invoice?.summary || {};
  appendInvoiceRow(invoiceSummaryEl, "Subtotal", summary.subtotal);
  appendInvoiceRow(invoiceSummaryEl, "Taxes", summary.taxes);
  appendInvoiceRow(invoiceSummaryEl, "Fees", summary.fees);
  appendInvoiceRow(invoiceSummaryEl, "Deposit Amount", summary.depositAmount);
  appendInvoiceRow(invoiceSummaryEl, "Estimated total", summary.estimatedTotal);
}

function createDetailSection(title, items) {
  const section = document.createElement("section");
  appendText(section, "h3", title);

  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    if (typeof item === "string") {
      li.textContent = item;
    } else {
      appendText(li, "strong", item.title);
      appendText(li, "span", item.body);
    }
    list.append(li);
  });
  section.append(list);
  return section;
}

function priceSuffix(item) {
  if (!item.unitPrice) return "price pending";
  return `${formatMoney(item.unitPrice)} / ${item.unitLabel || item.unit || "each"} · ${formatMoney(item.lineTotal)}`;
}

function bodyFromItems(items) {
  return items.map((item) => (typeof item === "string" ? item : `${item.title || item.label}: ${item.body}`));
}

function renderAlaCarteDetails(data) {
  const prep = data.prep;
  detailEyebrowEl.textContent = "Prep List";
  detailTitleEl.textContent = "Order Quantities";
  detailGridEl.replaceChildren();

  detailGridEl.append(
    createDetailSection(
      "Meats",
      prep.meats.map((item) => ({
        title: item.label,
        body:
          item.unit === "lb"
            ? `${formatQuantity(item.orderQuantity)} lb ordered · ${formatQuantity(item.cookedPounds)} lb cooked · ${formatQuantity(item.rawPounds)} lb raw · ${item.portion} · ${priceSuffix(item)}`
            : `${formatQuantity(item.orderQuantity)} ${item.unitLabel || item.unit} ordered · ${item.portion} · ${priceSuffix(item)}`
      }))
    ),
    createDetailSection(
      "Sides",
      prep.sides.map((item) => ({
        title: item.label,
        body: `${formatQuantity(item.orderQuantity)} quart${item.orderQuantity === 1 ? "" : "s"} · ${formatQuantity(item.totalOunces)} oz total · ${item.portion} · ${priceSuffix(item)}`
      }))
    ),
    createDetailSection(
      "Desserts",
      prep.desserts.map((item) => ({
        title: item.label,
        body: `${formatQuantity(item.orderQuantity)} ${item.unitLabel || item.unit} · ${item.portion} · ${priceSuffix(item)}`
      }))
    ),
    createDetailSection(
      "Beverages",
      prep.beverages.map((item) => ({
        title: item.label,
        body: `${formatQuantity(item.orderQuantity)} gallon${item.orderQuantity === 1 ? "" : "s"} · ${item.servings} servings · ${priceSuffix(item)}`
      }))
    )
  );

  data.detailSections.forEach((section) => {
    detailGridEl.append(createDetailSection(section.title, section.items));
  });
}

function renderFullServiceDetails(data) {
  detailEyebrowEl.textContent = "Admin Prep";
  detailTitleEl.textContent = "Buffet Planning Quantities";
  detailGridEl.replaceChildren();

  data.detailSections.forEach((section) => {
    detailGridEl.append(createDetailSection(section.title, section.items));
  });

  detailGridEl.append(
    createDetailSection("Overage Plan", [
      `Guest count: ${data.input.guestCount}`,
      `Planned count: ${data.prep.plannedGuests}`,
      `Overage: ${Math.round(data.prep.overageRate * 100)}%`
    ]),
    createDetailSection(
      "Meats",
      data.prep.meats.map((item) => ({
        title: item.label,
        body: `${formatQuantity(item.cookedPounds)} lb cooked · ${item.portion}`
      }))
    ),
    createDetailSection(
      "Sides",
      data.prep.sides.map((item) => ({
        title: item.label,
        body: `${formatQuantity(item.quarts)} quart${item.quarts === 1 ? "" : "s"} · ${formatQuantity(item.totalPounds)} lb · ${item.portion}`
      }))
    ),
    createDetailSection("Package Extras", bodyFromItems(data.prep.extras))
  );
}

function renderResults(data) {
  errorEl.textContent = "";
  requestStatusEl.textContent = "";
  latestQuoteData = data;
  resultsEl.hidden = false;
  emptyStateEl.hidden = true;

  const modeLabel = data.mode === "full-service" ? "Full-Service Offerings Quote" : "Pickup / Delivery Quote";
  resultModeLabelEl.textContent = isAdminView ? `Admin ${modeLabel}` : "Estimated Catering Quote";
  quoteTitleEl.textContent = `${data.input.guestCount} guests · ${formatDate(data.input.eventDate)}`;
  quoteTotalEl.textContent = formatMoney(data.quote.totalQuote);
  depositTotalEl.textContent = formatMoney(data.quote.deposit);
  depositLabelEl.textContent = `${formatRate(data.quote.depositRate)} Deposit to Reserve`;
  guestSummaryCopyEl.textContent =
    `This estimate includes the selected catering service, production fee, and sales tax. Submitting your quote starts a conversation with our team and does not require payment. A ${formatRate(data.quote.depositRate)} deposit is required later to officially reserve your date.`;
  disclaimerEl.textContent = data.disclaimer;

  renderQuoteLines(data.quote.lines);
  renderInvoice(data.quote.invoice);
  adminBreakdownEl.hidden = !isAdminView;
  adminDetailsEl.hidden = !isAdminView;
  guestSummaryEl.hidden = isAdminView;
  requestActionEl.hidden = isAdminView;
  pdfActionEl.hidden = isAdminView;

  pricingNoticeEl.hidden = true;
  if (isAdminView) {
    pricingNoticeEl.hidden = !data.quote.pricingIncomplete && !data.quote.usesSamplePricing;
    if (data.quote.pricingIncomplete) {
      pricingNoticeEl.textContent =
        "Some pickup/delivery unit prices are still set to $0. Update those prices before sending a guest-facing quote.";
    } else if (data.quote.usesSamplePricing) {
      pricingNoticeEl.textContent =
        "Pickup/delivery unit prices are sample values. Update them before sending a final guest-facing quote.";
    } else {
      pricingNoticeEl.textContent = "";
    }
  }

  if (isAdminView) {
    if (data.mode === "full-service") {
      renderFullServiceDetails(data);
    } else {
      renderAlaCarteDetails(data);
    }
  } else {
    detailGridEl.replaceChildren();
  }
}

function syncMode() {
  const mode = getActiveMode();
  const calculationMode = getCalculationMode();
  viewEyebrowEl.textContent = isAdminView ? "Black Board Bar-B-Q · Admin" : "Black Board Bar-B-Q";
  document.querySelectorAll("[data-calculator-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.calculatorPanel !== calculationMode;
  });
  if (eventTypeFieldsetEl) {
    eventTypeFieldsetEl.hidden = mode !== "full-service";
  }
  if (fulfillmentFieldsetEl) {
    fulfillmentFieldsetEl.hidden = isLargePartyReservation();
  }
  form.querySelector(".primary-action").textContent =
    calculationMode === "full-service" ? "Calculate Quote" : "Calculate Pickup / Delivery Quote";
  updateAlaCarteControls();
  syncRecommendedQuantities();
  updateQuantityPreview();
}

function updateAlaCarteControls() {
  form.querySelectorAll(".item-row").forEach((row) => {
    const checked = row.querySelector('input[type="checkbox"]').checked;
    row.querySelectorAll(".item-controls input, .item-controls select").forEach((control) => {
      control.disabled = !checked;
      if (checked && control.dataset.quantityCategory && control.value === "") {
        delete control.dataset.userEdited;
      }
    });
  });
}

function syncDessertPriceDefault(sizeSelect) {
  updateQuantityPreview();
}

function syncRecommendedQuantities() {
  if (!calculatorConfig || getCalculationMode() !== "a-la-carte") return;

  const guests = getGuestCount();
  form.querySelectorAll("[data-quantity-category]").forEach((quantity) => {
    if (quantity.disabled || !guests) return;

    const category = quantity.dataset.quantityCategory;
    const item = findById(calculatorConfig.aLaCarte[category], quantity.dataset.quantityId);
    const recommendedQuantity = getRecommendedQuantity(category, item, guests);
    const recommendedValue = formatQuantity(recommendedQuantity);
    const canAutoFill =
      quantity.dataset.userEdited !== "true" ||
      quantity.value === "" ||
      quantity.value === quantity.dataset.autoQuantity;

    if (canAutoFill) {
      quantity.value = recommendedValue;
      quantity.dataset.autoQuantity = recommendedValue;
      delete quantity.dataset.userEdited;
    }
  });
}

function countChecked(name) {
  return getCheckedValues(name).length;
}

function validatePackageSelectionCount(selectedPackage, fieldName, requiredCount, label) {
  if (!requiredCount) return true;

  const count = countChecked(fieldName);
  if (count !== requiredCount) {
    errorEl.textContent = `${selectedPackage.label} requires exactly ${requiredCount} ${label}${requiredCount === 1 ? "" : "s"}.`;
    return false;
  }

  return true;
}

function validateFullServiceSelections() {
  if (getCalculationMode() !== "full-service") return true;

  const selectedPackage = getSelectedPackage();
  if (!selectedPackage) return true;

  return (
    validatePackageSelectionCount(selectedPackage, "packageMeats", selectedPackage.requiredMeats, "meat") &&
    validatePackageSelectionCount(selectedPackage, "packageSides", selectedPackage.requiredSides, "side") &&
    validatePackageSelectionCount(selectedPackage, "packageDesserts", selectedPackage.requiredDesserts, "dessert")
  );
}

function addPreviewLine(title, body) {
  const li = document.createElement("li");
  appendText(li, "strong", title);
  appendText(li, "span", body);
  quantityPreviewListEl.append(li);
}

function updateQuantityPreview() {
  if (!calculatorConfig || getCalculationMode() !== "a-la-carte") return;

  quantityPreviewListEl.replaceChildren();
  const guests = getGuestCount();
  const selectedMeatIds = getCheckedValues("meats");
  const selectedSideIds = getCheckedValues("sides");
  const selectedDessertIds = getCheckedValues("desserts");
  const selectedBeverageIds = getCheckedValues("beverages");

  if (!guests) {
    addPreviewLine("Guest count", "Enter a guest count.");
    return;
  }

  if (selectedMeatIds.length > 0) {
    selectedMeatIds.forEach((id) => {
      const item = findById(calculatorConfig.aLaCarte.meats, id);
      const quantity = getRecommendedQuantity("meats", item, guests, selectedMeatIds.length);
      addPreviewLine(item.label, formatRecommendedQuantity("meats", item, quantity));
    });
  }

  selectedSideIds.forEach((id) => {
    const item = findById(calculatorConfig.aLaCarte.sides, id);
    const quantity = getRecommendedQuantity("sides", item, guests);
    addPreviewLine(item.label, formatRecommendedQuantity("sides", item, quantity));
  });

  selectedDessertIds.forEach((id) => {
    const item = findById(calculatorConfig.aLaCarte.desserts, id);
    const quantity = getRecommendedQuantity("desserts", item, guests);
    addPreviewLine(item.label, formatRecommendedQuantity("desserts", item, quantity));
  });

  selectedBeverageIds.forEach((id) => {
    const item = findById(calculatorConfig.aLaCarte.beverages, id);
    const quantity = getRecommendedQuantity("beverages", item, guests);
    addPreviewLine(item.label, formatRecommendedQuantity("beverages", item, quantity));
  });

  if (quantityPreviewListEl.children.length === 0) {
    addPreviewLine("Menu", "Select at least one meat and side.");
  }
}

function openRequestDialog() {
  if (!latestQuoteData) return;
  requestStatusEl.textContent = "";
  requestFormEl.elements.namedItem("name").value = latestQuoteData.input.guestName || "";
  requestFormEl.elements.namedItem("email").value = latestQuoteData.input.guestEmail || "";
  requestFormEl.elements.namedItem("phone").value = latestQuoteData.input.guestPhone || "";
  if (typeof requestDialogEl.showModal === "function") {
    requestDialogEl.showModal();
  } else {
    requestDialogEl.setAttribute("open", "");
  }
}

function closeRequestDialog() {
  requestDialogEl.close();
}

async function submitRequest(event) {
  event.preventDefault();
  if (!latestQuoteData || !latestQuotePayload || !requestFormEl.reportValidity()) return;

  const formData = new FormData(requestFormEl);
  const submitButton = requestFormEl.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";

  try {
    const response = await fetch("/api/quote-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quotePayload: latestQuotePayload,
        contact: {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim()
        },
        notes: String(formData.get("notes") || "").trim()
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to submit quote request.");
    }

    closeRequestDialog();
    requestStatusEl.textContent =
      data.message || "Thank you. Our team will be in touch soon to discuss your event.";
  } catch (error) {
    requestStatusEl.textContent =
      "We could not submit your quote online right now. Please call or email us and we will help right away.";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Let's Start Planning";
  }
}

async function downloadQuotePdf() {
  if (!latestQuotePayload) return;

  pdfActionEl.disabled = true;
  pdfActionEl.textContent = "Preparing PDF...";

  try {
    const response = await fetch("/api/quote-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        quotePayload: latestQuotePayload
      })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Unable to create quote PDF.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "black-board-bar-b-q-quote-estimate.pdf";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    requestStatusEl.textContent = "We could not prepare the PDF right now. Please try again in a moment.";
  } finally {
    pdfActionEl.disabled = false;
    pdfActionEl.textContent = "Download PDF";
  }
}

async function calculate(event) {
  event.preventDefault();
  errorEl.textContent = "";
  if (!validateFullServiceSelections()) return;

  try {
    const payload = collectPayload();
    const response = await fetch("/api/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to calculate quote.");
    }

    latestQuotePayload = payload;
    renderResults(data);
  } catch (error) {
    errorEl.textContent = error.message;
  }
}

async function init() {
  const response = await fetch("/api/config");
  calculatorConfig = await response.json();
  syncConfigEditor();
  renderMenu(calculatorConfig);
  syncMode();
  form.addEventListener("change", (event) => {
    if (event.target.matches('.item-row input[type="checkbox"]') && event.target.checked) {
      const row = event.target.closest(".item-row");
      const quantity = row?.querySelector("[data-quantity-category]");
      if (quantity) {
        delete quantity.dataset.userEdited;
        quantity.value = "";
      }
    }
    if (event.target.name === "packageId") {
      renderPackageSelections();
      errorEl.textContent = "";
    }
    if (event.target.name?.startsWith("package")) {
      errorEl.textContent = "";
    }
    syncMode();
  });
  form.addEventListener("input", (event) => {
    if (event.target.dataset.quantityCategory) {
      event.target.dataset.userEdited = "true";
    } else {
      syncRecommendedQuantities();
    }
    updateQuantityPreview();
  });
  requestActionEl.addEventListener("click", openRequestDialog);
  pdfActionEl.addEventListener("click", downloadQuotePdf);
  requestCancelEl.addEventListener("click", closeRequestDialog);
  requestFormEl.addEventListener("submit", submitRequest);
  if (isAdminView) {
    configSaveEl.addEventListener("click", saveConfigEditor);
    configResetEl.addEventListener("click", resetConfigEditor);
  }
  form.addEventListener("submit", calculate);
}

init().catch((error) => {
  errorEl.textContent = error.message;
});
