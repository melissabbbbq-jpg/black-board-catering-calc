const { getCalculatorConfig, saveCalculatorConfig: writeCalculatorConfig, resetCalculatorConfig: resetStoredCalculatorConfig } = require("./config-store");

let CONFIG = getCalculatorConfig();

function reloadCalculatorConfig() {
  CONFIG = getCalculatorConfig();
  return CONFIG;
}

function saveCalculatorConfig(config) {
  CONFIG = writeCalculatorConfig(config);
  return CONFIG;
}

function resetCalculatorConfig() {
  CONFIG = resetStoredCalculatorConfig();
  return CONFIG;
}

function getCurrentConfig() {
  return CONFIG;
}

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((Number(value) + Number.EPSILON) * 2) / 2;
}

function formatRate(rate) {
  const percent = Math.round((Number(rate) * 100 + Number.EPSILON) * 100) / 100;
  return `${percent.toFixed(2).replace(/\.?0+$/, "")}%`;
}

function formatQuantity(value) {
  return roundQuantity(value).toFixed(2);
}

function buildInvoice({ items, quote }) {
  return {
    items: items.map((item) => ({
      label: item.label,
      total: roundCurrency(item.total)
    })),
    summary: {
      subtotal: roundCurrency(quote.preFeeSubtotal),
      taxes: roundCurrency(quote.salesTax),
      fees: roundCurrency(quote.productionFee),
      depositAmount: roundCurrency(quote.deposit),
      estimatedTotal: roundCurrency(quote.totalQuote)
    }
  };
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean).map(String))];
}

function buildMap(items) {
  return new Map(items.map((item) => [item.id, item]));
}

function activeItems(items) {
  return items.filter((item) => item.active !== false);
}

function findSelected(ids, items, label) {
  const itemMap = buildMap(activeItems(items));
  const selected = ids.map((id) => itemMap.get(id)).filter(Boolean);
  const unknown = ids.filter((id) => !itemMap.has(id));

  if (unknown.length > 0) {
    throw new Error(`Unknown ${label}: ${unknown.join(", ")}`);
  }

  return selected;
}

function requireDate(eventDate) {
  if (!eventDate) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error("Enter a valid event date.");
  }
}

function requireGuestCount(guestCount) {
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    throw new Error("Guest count must be a whole number greater than 0.");
  }
}

function getOuncesPerPound() {
  return CONFIG.units.ouncesPerPound;
}

function getOuncesPerQuart() {
  return CONFIG.units.ouncesPerQuart;
}

function getItemOuncesPerUnit(item) {
  if (Number.isFinite(Number(item.ouncesPerUnit)) && Number(item.ouncesPerUnit) > 0) {
    return Number(item.ouncesPerUnit);
  }

  if (item.unit === "lb") return getOuncesPerPound();
  if (item.unit === "quart") return getOuncesPerQuart();
  return 0;
}

function getRecommendedOrderQuantity({ guestCount, item, fallbackOuncesPerGuest = 0 }) {
  const ouncesPerGuest = Number(item.ouncesPerGuest || fallbackOuncesPerGuest || 0);
  const piecesPerGuest = Number(item.piecesPerGuest || 0);

  if (ouncesPerGuest > 0) {
    const ouncesPerUnit = getItemOuncesPerUnit(item);
    if (!ouncesPerUnit) {
      throw new Error(`Set a valid unit size for ${item.label}.`);
    }
    return Math.ceil((guestCount * ouncesPerGuest) / ouncesPerUnit);
  }

  if (piecesPerGuest > 0) {
    const totalPieces = Math.ceil(guestCount * piecesPerGuest);
    return Math.ceil(totalPieces / (item.piecesPerUnit || 1));
  }

  return 0;
}

function getAlaCartePortionLabel(item, fallbackOuncesPerGuest = 0) {
  const ouncesPerGuest = Number(item.ouncesPerGuest || fallbackOuncesPerGuest || 0);
  const piecesPerGuest = Number(item.piecesPerGuest || 0);
  const portionsPerGuest = Number(item.portionsPerGuest || 0);

  if (ouncesPerGuest > 0) return `${ouncesPerGuest} oz per guest`;
  if (piecesPerGuest > 0) return `${piecesPerGuest} pc per guest`;
  if (portionsPerGuest > 0) {
    return `${portionsPerGuest} serving${portionsPerGuest === 1 ? "" : "s"} per guest`;
  }
  return "Portion pending";
}

function getProductionMath({ subtotal, minimum = 0, extraFee = 0, productionFeeRate }) {
  const minimumAdjustment = Math.max(0, minimum - subtotal);
  const preFeeSubtotal = subtotal + minimumAdjustment + extraFee;
  const productionFee = preFeeSubtotal * productionFeeRate;
  const taxableSubtotal = preFeeSubtotal + productionFee;
  const salesTax = taxableSubtotal * CONFIG.taxRate;
  const totalQuote = taxableSubtotal + salesTax;
  const deposit = totalQuote * CONFIG.depositRate;

  return {
    minimumAdjustment,
    preFeeSubtotal,
    productionFee,
    taxableSubtotal,
    salesTax,
    totalQuote,
    deposit,
    balanceDue: totalQuote - deposit
  };
}

function moneyLine(label, value) {
  return {
    label,
    kind: "currency",
    value: roundCurrency(value)
  };
}

function textLine(label, value) {
  return {
    label,
    kind: "text",
    value
  };
}

function getInputBasics(payload) {
  const eventDate = String(payload.eventDate || "").trim();
  const guestCount = Number(payload.guestCount);
  const guestName = String(payload.guestName || "").trim();
  const guestPhone = String(payload.guestPhone || "").trim();
  const guestEmail = String(payload.guestEmail || "").trim();
  const eventType = String(payload.eventType || "").trim();

  requireDate(eventDate);
  requireGuestCount(guestCount);

  return {
    eventDate,
    guestCount,
    guestName,
    guestPhone,
    guestEmail,
    eventType
  };
}

function exactSelectionLabel(count, label) {
  return `${count} ${label}${count === 1 ? "" : "s"}`;
}

function validateExactCount(values, requiredCount, label, packageLabel) {
  if (requiredCount === 0) return;
  if (values.length !== requiredCount) {
    throw new Error(`${packageLabel} requires exactly ${exactSelectionLabel(requiredCount, label)}.`);
  }
}

function getSelectedFullServiceItems(payload, selectedPackage) {
  const selectedMeatIds = uniqueValues(asArray(payload.packageMeats));
  const selectedSideIds = uniqueValues(asArray(payload.packageSides));
  const selectedDessertIds = uniqueValues(asArray(payload.packageDesserts));

  validateExactCount(selectedMeatIds, selectedPackage.requiredMeats, "meat", selectedPackage.label);
  validateExactCount(selectedSideIds, selectedPackage.requiredSides, "side", selectedPackage.label);
  validateExactCount(selectedDessertIds, selectedPackage.requiredDesserts, "dessert", selectedPackage.label);

  const fixedMeats = findSelected(selectedPackage.fixedMeats || [], CONFIG.aLaCarte.meats, "fixed package meats");
  const fixedSides = findSelected(selectedPackage.fixedSides || [], CONFIG.aLaCarte.sides, "fixed package sides");
  const selectedMeats = findSelected(selectedMeatIds, CONFIG.aLaCarte.meats, "package meats");
  const selectedSides = findSelected(selectedSideIds, CONFIG.aLaCarte.sides, "package sides");
  const selectedDesserts = findSelected(selectedDessertIds, CONFIG.aLaCarte.desserts, "package desserts");

  return {
    fixedMeats,
    fixedSides,
    meats: [...fixedMeats, ...selectedMeats],
    sides: [...fixedSides, ...selectedSides],
    desserts: selectedDesserts
  };
}

function calculateFullServiceQuote(payload = {}) {
  const input = getInputBasics(payload);
  const packageId = String(payload.packageId || "").trim();
  const venueTypeId = String(payload.venueType || "").trim();
  const selectedPackage = CONFIG.fullService.packages.find((item) => item.id === packageId);
  const venueType = CONFIG.fullService.venueTypes.find((item) => item.id === venueTypeId);

  if (!selectedPackage) {
    throw new Error("Choose a full-service buffet package.");
  }

  if (!venueType) {
    throw new Error("Choose a full-service event type.");
  }

  const packageSelections = getSelectedFullServiceItems(payload, selectedPackage);
  const packageSubtotal = input.guestCount * selectedPackage.pricePerPerson;
  const math = getProductionMath({
    subtotal: packageSubtotal,
    minimum: venueType.foodBeverageMinimum,
    extraFee: venueType.rentalFee,
    productionFeeRate: CONFIG.fullService.productionFeeRate
  });
  const teamGuestsPerStaffMember = CONFIG.fullService.teamGuestsPerStaffMember;
  const teamMembers = Math.ceil(input.guestCount / teamGuestsPerStaffMember);
  const prep = calculateFullServicePrep({
    guestCount: input.guestCount,
    selectedPackage,
    packageSelections
  });
  const lines = [
    textLine("Package", `${selectedPackage.label} (${selectedPackage.includes})`),
    textLine("Buffet price", `$${selectedPackage.pricePerPerson.toFixed(2)} per guest`),
    moneyLine("Package subtotal", packageSubtotal)
  ];

  if (math.minimumAdjustment > 0) {
    lines.push(moneyLine("Food & beverage minimum adjustment", math.minimumAdjustment));
  }

  if (venueType.rentalFee > 0) {
    lines.push(moneyLine(venueType.rentalLabel || "Venue rental", venueType.rentalFee));
  }

  lines.push(
    moneyLine("Pre-fee subtotal", math.preFeeSubtotal),
    moneyLine(`${formatRate(CONFIG.fullService.productionFeeRate)} production fee`, math.productionFee),
    moneyLine(`${formatRate(CONFIG.taxRate)} sales tax`, math.salesTax),
    moneyLine(`${formatRate(CONFIG.depositRate)} deposit to reserve`, math.deposit),
    moneyLine("Estimated balance after deposit", math.balanceDue)
  );

  const quote = {
    packageSubtotal: roundCurrency(packageSubtotal),
    minimumAdjustment: roundCurrency(math.minimumAdjustment),
    preFeeSubtotal: roundCurrency(math.preFeeSubtotal),
    productionFeeRate: CONFIG.fullService.productionFeeRate,
    productionFee: roundCurrency(math.productionFee),
    taxRate: CONFIG.taxRate,
    salesTax: roundCurrency(math.salesTax),
    totalQuote: roundCurrency(math.totalQuote),
    depositRate: CONFIG.depositRate,
    deposit: roundCurrency(math.deposit),
    balanceDue: roundCurrency(math.balanceDue),
    lines
  };
  const invoiceItems = [
    {
      label: selectedPackage.label,
      total: packageSubtotal
    }
  ];

  if (math.minimumAdjustment > 0) {
    invoiceItems.push({
      label: "Minimum adjustment",
      total: math.minimumAdjustment
    });
  }

  if (venueType.rentalFee > 0) {
    invoiceItems.push({
      label: venueType.rentalLabel || "Venue rental",
      total: venueType.rentalFee
    });
  }

  return {
    mode: "full-service",
    input: {
      ...input,
      venueType
    },
    selections: {
      package: selectedPackage,
      meats: packageSelections.meats.map((item) => item.label),
      sides: packageSelections.sides.map((item) => item.label),
      desserts: packageSelections.desserts.map((item) => item.label)
    },
    quote: {
      ...quote,
      invoice: buildInvoice({
        items: invoiceItems,
        quote
      })
    },
    detailSections: [
      {
        title: "Package details",
        items: [
          selectedPackage.includes,
          `${input.guestCount} guests x $${selectedPackage.pricePerPerson.toFixed(2)}`,
          `Meats: ${packageSelections.meats.map((item) => item.label).join(", ") || "None"}`,
          `Sides: ${packageSelections.sides.map((item) => item.label).join(", ") || "None"}`,
          `Dessert: ${packageSelections.desserts.map((item) => item.label).join(", ") || "None"}`
        ]
      },
      {
        title: "Service notes",
        items: [
          `${venueType.label} minimum: $${venueType.foodBeverageMinimum.toLocaleString()}`,
          venueType.note,
          `Planning estimate: ${teamMembers} team member${teamMembers === 1 ? "" : "s"} for ${input.guestCount} guests.`
        ]
      }
    ],
    prep,
    disclaimer:
      "This full-service quote is an estimate. Your date is not reserved until the deposit is paid and the catering agreement is confirmed. Labor, venue requirements, final headcount, menu changes, tax rules, and availability may change the total."
  };
}

function calculateFullServicePrep({ guestCount, selectedPackage, packageSelections }) {
  const overageRate = CONFIG.fullService.buffetOverageRate;
  const plannedGuests = Math.ceil(guestCount * (1 + overageRate));
  const portions = CONFIG.fullService.prepPortions;
  const meatPoundsPerSelection = (plannedGuests * portions.meatOuncesPerGuest) / getOuncesPerPound();
  const sideQuartsPerSelection = (plannedGuests * portions.sideOuncesPerGuest) / getOuncesPerQuart();
  const prep = {
    overageRate,
    plannedGuests,
    meats: [],
    sides: [],
    extras: []
  };

  packageSelections.meats.forEach((meat, index) => {
    prep.meats.push({
      label: meat.label || `Meat selection ${index + 1}`,
      portion: `${portions.meatOuncesPerGuest} oz per planned guest`,
      cookedPounds: roundQuantity(meatPoundsPerSelection)
    });
  });

  packageSelections.sides.forEach((side, index) => {
    prep.sides.push({
      label: side.label || `Side selection ${index + 1}`,
      portion: `${portions.sideOuncesPerGuest} oz per planned guest`,
      quarts: Math.ceil(sideQuartsPerSelection),
      totalPounds: roundQuantity((plannedGuests * portions.sideOuncesPerGuest) / getOuncesPerPound())
    });
  });

  if (selectedPackage.salad) {
    prep.extras.push({
      label: "Garden salad",
      body: `${formatQuantity((plannedGuests * portions.saladOuncesPerGuest) / getOuncesPerPound())} lb · ${portions.saladOuncesPerGuest} oz per planned guest`
    });
  }

  if (selectedPackage.dessert) {
    const dessertLabel = packageSelections.desserts[0]?.label || "Dessert";
    prep.extras.push({
      label: dessertLabel,
      body: `${plannedGuests * portions.dessertServingsPerGuest} servings · ${portions.dessertServingsPerGuest} per planned guest`
    });
  }

  if (selectedPackage.beverage) {
    const servings = Math.ceil(plannedGuests * portions.beverageServingsPerGuest);
    prep.extras.push({
      label: "Beverage station",
      body: `${Math.ceil(servings / portions.beverageServingsPerGallon)} gallons · ${servings} servings`
    });
  }

  return prep;
}

function dateUsesPickupNoMinimum(eventDate) {
  if (!eventDate) return false;
  const day = new Date(`${eventDate}T00:00:00`).getDay();
  return CONFIG.aLaCarte.pickupNoMinimumDays.includes(day);
}

function getAlaCarteMinimum(eventDate, fulfillment) {
  const fulfillmentId = typeof fulfillment === "string" ? fulfillment : fulfillment?.id;
  if (fulfillment && Number.isFinite(Number(fulfillment.minimum))) return Number(fulfillment.minimum);
  if (fulfillmentId === "dropoff") return CONFIG.aLaCarte.dropoffMinimum;
  if (fulfillmentId === "pickup") {
    return dateUsesPickupNoMinimum(eventDate) ? 0 : CONFIG.aLaCarte.pickupWeekdayMinimum;
  }
  throw new Error("Choose a valid a la carte order type.");
}

function getAlaCarteProductionRate(fulfillment) {
  const fulfillmentId = typeof fulfillment === "string" ? fulfillment : fulfillment?.id;
  if (fulfillment && Number.isFinite(Number(fulfillment.productionFeeRate))) {
    return Number(fulfillment.productionFeeRate);
  }
  if (fulfillmentId === "pickup") return CONFIG.aLaCarte.pickupProductionFeeRate;
  if (fulfillmentId === "dropoff") return CONFIG.aLaCarte.dropoffProductionFeeRate;
  throw new Error("Choose a valid a la carte order type.");
}

function getDefaultUnitPrice(category, item, unitKey = CONFIG.aLaCarte.dessertDefaultContainerSize) {
  if (category === "desserts" && item.priceByContainer) {
    return item.priceByContainer[unitKey] ?? 0;
  }

  return item.pricePerUnit ?? 0;
}

function getUnitPrice(payload, category, item, unitKey) {
  const price = getDefaultUnitPrice(category, item, unitKey);

  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`Set a valid backend unit price for ${item.label}.`);
  }

  return price;
}

function getQuantityOverride(payload, category, item) {
  const value = payload.quantities?.[category]?.[item.id];

  if (value === undefined || value === "") return null;

  const quantity = Number(value);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error(`Enter a valid quantity for ${item.label}.`);
  }

  return quantity;
}

function getDessertContainer(sizeId = CONFIG.aLaCarte.dessertDefaultContainerSize) {
  const selectedSize = CONFIG.aLaCarte.dessertContainerSizes.find((size) => size.id === sizeId);
  if (!selectedSize) {
    throw new Error("Choose a valid dessert container size.");
  }

  return selectedSize;
}

function calculateAlaCartePrep({ guestCount, meats, sides, desserts, beverages, payload }) {
  return {
    meats: meats.map((meat) => {
      const recommendedQuantity = getRecommendedOrderQuantity({
        guestCount,
        item: meat
      });
      const orderQuantity = getQuantityOverride(payload, "meats", meat) ?? recommendedQuantity;
      const cookedPounds = meat.unit === "lb" ? orderQuantity : null;
      const rawPounds = meat.rawYield ? cookedPounds / meat.rawYield : null;
      const unitPrice = getUnitPrice(payload, "meats", meat);

      return {
        id: meat.id,
        label: meat.label,
        unit: meat.unit,
        unitLabel: meat.unitLabel,
        portion: getAlaCartePortionLabel(meat),
        cookedPounds: cookedPounds === null ? null : roundQuantity(cookedPounds),
        recommendedQuantity,
        orderQuantity,
        rawPounds: rawPounds === null ? null : roundQuantity(rawPounds),
        rawYield: meat.rawYield,
        piecesPerUnit: meat.piecesPerUnit,
        unitPrice: roundCurrency(unitPrice),
        lineTotal: roundCurrency(orderQuantity * unitPrice)
      };
    }),
    sides: sides.map((side) => {
      const totalOunces = guestCount * side.ouncesPerGuest;
      const recommendedQuantity = getRecommendedOrderQuantity({ guestCount, item: side });
      const orderQuantity = getQuantityOverride(payload, "sides", side) ?? recommendedQuantity;
      const unitPrice = getUnitPrice(payload, "sides", side);

      return {
        id: side.id,
        label: side.label,
        unit: side.unit,
        unitLabel: side.unitLabel,
        portion: getAlaCartePortionLabel(side),
        totalOunces: roundQuantity(totalOunces),
        totalPounds: roundQuantity(totalOunces / getOuncesPerPound()),
        recommendedQuantity,
        orderQuantity,
        unitPrice: roundCurrency(unitPrice),
        lineTotal: roundCurrency(orderQuantity * unitPrice)
      };
    }),
    desserts: desserts.map((dessert) => {
      const selectedSize = dessert.priceByContainer ? getDessertContainer(payload.dessertSizes?.[dessert.id]) : null;
      const portions = selectedSize ? Math.ceil(guestCount * dessert.portionsPerGuest) : null;
      const pieces = dessert.piecesPerGuest ? Math.ceil(guestCount * dessert.piecesPerGuest) : null;
      const totalOunces = dessert.ouncesPerGuest ? Math.ceil(guestCount * dessert.ouncesPerGuest) : null;
      const recommendedQuantity = selectedSize
        ? Math.ceil(portions / selectedSize.servings)
        : getRecommendedOrderQuantity({ guestCount, item: dessert });
      const orderQuantity = getQuantityOverride(payload, "desserts", dessert) ?? recommendedQuantity;
      const unitPrice = getUnitPrice(payload, "desserts", dessert, selectedSize?.id);

      return {
        id: dessert.id,
        label: dessert.label,
        unit: dessert.unit,
        portion: getAlaCartePortionLabel(dessert),
        portions,
        pieces,
        totalOunces,
        container: selectedSize,
        unitLabel: selectedSize?.label || dessert.unitLabel || dessert.unit,
        recommendedQuantity,
        orderQuantity,
        unitPrice: roundCurrency(unitPrice),
        lineTotal: roundCurrency(orderQuantity * unitPrice)
      };
    }),
    beverages: beverages.map((beverage) => {
      const servings = Math.ceil(guestCount * beverage.servingsPerGuest);
      const recommendedQuantity = Math.ceil(servings / beverage.servingsPerUnit);
      const orderQuantity = getQuantityOverride(payload, "beverages", beverage) ?? recommendedQuantity;
      const unitPrice = getUnitPrice(payload, "beverages", beverage);

      return {
        id: beverage.id,
        label: beverage.label,
        unit: beverage.unit,
        unitLabel: beverage.unitLabel,
        portion: `${beverage.servingsPerGuest} serving per guest`,
        servings,
        recommendedQuantity,
        orderQuantity,
        unitPrice: roundCurrency(unitPrice),
        lineTotal: roundCurrency(orderQuantity * unitPrice)
      };
    })
  };
}

function flattenPrepItems(prep) {
  return [...prep.meats, ...prep.sides, ...prep.desserts, ...prep.beverages];
}

function calculateAlaCarteQuote(payload = {}) {
  const input = getInputBasics(payload);
  const fulfillmentId = String(payload.fulfillment || "").trim();
  const fulfillment = CONFIG.aLaCarte.fulfillmentOptions.find((item) => item.id === fulfillmentId);
  const meatIds = uniqueValues(asArray(payload.meats));
  const sideIds = uniqueValues(asArray(payload.sides));
  const dessertIds = uniqueValues(asArray(payload.desserts));
  const beverageIds = uniqueValues(asArray(payload.beverages));

  if (!fulfillment) {
    throw new Error("Choose pickup or drop-off.");
  }

  if (meatIds.length < 1) {
    throw new Error("Select at least one smoked meat.");
  }

  if (meatIds.length > CONFIG.aLaCarte.maxMeats) {
    throw new Error(`Select no more than ${CONFIG.aLaCarte.maxMeats} smoked meats for auto-portions.`);
  }

  if (sideIds.length < 1) {
    throw new Error("Select at least one side.");
  }

  const meats = findSelected(meatIds, CONFIG.aLaCarte.meats, "meats");
  const sides = findSelected(sideIds, CONFIG.aLaCarte.sides, "sides");
  const desserts = findSelected(dessertIds, CONFIG.aLaCarte.desserts, "desserts");
  const beverages = findSelected(beverageIds, CONFIG.aLaCarte.beverages, "beverages");
  const prep = calculateAlaCartePrep({
    guestCount: input.guestCount,
    meats,
    sides,
    desserts,
    beverages,
    payload
  });
  const allPrepItems = flattenPrepItems(prep);
  const menuSubtotal = allPrepItems.reduce((total, item) => total + item.lineTotal, 0);
  const minimum = getAlaCarteMinimum(input.eventDate, fulfillment);
  const productionFeeRate = getAlaCarteProductionRate(fulfillment);
  const math = getProductionMath({
    subtotal: menuSubtotal,
    minimum,
    productionFeeRate
  });
  const pricingIncomplete = allPrepItems.some((item) => item.unitPrice === 0);
  const lines = [
    textLine("Order type", fulfillment.label),
    moneyLine("A la carte subtotal", menuSubtotal)
  ];

  if (math.minimumAdjustment > 0) {
    lines.push(moneyLine("Minimum adjustment", math.minimumAdjustment));
  }

  if (productionFeeRate > 0 || math.productionFee > 0) {
    const feeLabel = fulfillment.feeLabel || `${fulfillment.id === "pickup" ? "Pickup" : "Delivery"} add-on`;
    lines.push(moneyLine(`${feeLabel} (${formatRate(productionFeeRate)})`, math.productionFee));
  }

  lines.push(
    moneyLine(`${formatRate(CONFIG.taxRate)} sales tax`, math.salesTax),
    moneyLine(`${formatRate(CONFIG.depositRate)} deposit to reserve`, math.deposit),
    moneyLine("Estimated balance after deposit", math.balanceDue)
  );
  const quote = {
    menuSubtotal: roundCurrency(menuSubtotal),
    minimum,
    minimumAdjustment: roundCurrency(math.minimumAdjustment),
    preFeeSubtotal: roundCurrency(math.preFeeSubtotal),
    productionFeeRate,
    productionFee: roundCurrency(math.productionFee),
    taxRate: CONFIG.taxRate,
    salesTax: roundCurrency(math.salesTax),
    totalQuote: roundCurrency(math.totalQuote),
    depositRate: CONFIG.depositRate,
    deposit: roundCurrency(math.deposit),
    balanceDue: roundCurrency(math.balanceDue),
    pricingIncomplete,
    usesSamplePricing: CONFIG.aLaCarte.usesSamplePricing,
    lines
  };
  const invoiceItems = allPrepItems.map((item) => ({
    label: item.label,
    total: item.lineTotal
  }));

  if (math.minimumAdjustment > 0) {
    invoiceItems.push({
      label: "Minimum adjustment",
      total: math.minimumAdjustment
    });
  }

  return {
    mode: "a-la-carte",
    input: {
      ...input,
      fulfillment,
      quantities: payload.quantities || {}
    },
    selections: {
      meats: meats.map((item) => item.label),
      sides: sides.map((item) => item.label),
      desserts: desserts.map((item) => item.label),
      beverages: beverages.map((item) => item.label)
    },
    quote: {
      ...quote,
      invoice: buildInvoice({
        items: invoiceItems,
        quote
      })
    },
    prep,
    detailSections: [
      {
        title: "Order notes",
        items: [
          fulfillment.description,
          "Every order includes fixin's: house pickled onions, pickles, jalapenos, Martin's potato bread, and signature sauce.",
          "Disposable plates, serving and dinnerware, plastic cups, and ice are available for purchase."
        ]
      }
    ],
    disclaimer:
      "This pickup/drop-off quote is an estimate. Orders require at least 10 days' notice, and larger events or peak dates may require more lead time. Final quantities, menu changes, tax rules, and availability may change the total."
  };
}

function calculateQuote(payload = {}) {
  const calculatorType = String(payload.calculatorType || "full-service").trim();

  if (calculatorType === "full-service") {
    return calculateFullServiceQuote(payload);
  }

  if (calculatorType === "a-la-carte") {
    return calculateAlaCarteQuote(payload);
  }

  throw new Error("Choose a valid calculator type.");
}

module.exports = {
  CONFIG,
  getCurrentConfig,
  reloadCalculatorConfig,
  saveCalculatorConfig,
  resetCalculatorConfig,
  calculateQuote,
  calculateFullServiceQuote,
  calculateAlaCarteQuote
};
