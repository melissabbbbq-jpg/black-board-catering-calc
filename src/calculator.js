const CONFIG = {
  taxRate: 0.0825,
  depositRate: 0.25,
  fullService: {
    productionFeeRate: 0.3,
    recommendedMinimumGuests: 50,
    buffetOverageRate: 0.15,
    prepPortions: {
      meatOuncesPerGuest: 5,
      sideOuncesPerGuest: 4,
      saladOuncesPerGuest: 3,
      dessertServingsPerGuest: 1,
      beverageServingsPerGuest: 1.25,
      beverageServingsPerGallon: 16
    },
    packages: [
      {
        id: "texas-two-step",
        label: "Texas Two-Step",
        pricePerPerson: 25,
        includes: "2 meats + 2 sides",
        requiredMeats: 2,
        requiredSides: 2,
        requiredDesserts: 0,
        fixedMeats: [],
        fixedSides: [],
        salad: false,
        dessert: false,
        beverage: false
      },
      {
        id: "texas-smoke-show",
        label: "Texas Smoke Show",
        pricePerPerson: 30,
        includes: "Garden salad, 2 meats, 2 sides, beverage",
        requiredMeats: 2,
        requiredSides: 2,
        requiredDesserts: 0,
        fixedMeats: [],
        fixedSides: [],
        salad: true,
        dessert: false,
        beverage: true
      },
      {
        id: "texas-trinity",
        label: "Texas Trinity",
        pricePerPerson: 35,
        includes: "Brisket, ribs, sausage + 2 sides",
        requiredMeats: 0,
        requiredSides: 2,
        requiredDesserts: 0,
        fixedMeats: ["smoked-prime-brisket", "pork-spare-ribs", "garlic-confit-sausage"],
        fixedSides: [],
        salad: false,
        dessert: false,
        beverage: false
      },
      {
        id: "whole-dang-barn",
        label: "The Whole Dang Barn",
        pricePerPerson: 47,
        includes: "Garden salad, 4 meats, 4 sides, dessert, beverage station",
        requiredMeats: 4,
        requiredSides: 4,
        requiredDesserts: 1,
        fixedMeats: [],
        fixedSides: [],
        salad: true,
        dessert: true,
        beverage: true
      }
    ],
    venueTypes: [
      {
        id: "offsite",
        label: "Off-site full service",
        foodBeverageMinimum: 2000,
        rentalFee: 0,
        note: "Labor is estimated after event details. Plan starts at 1 team member per 25 guests."
      },
      {
        id: "restaurant-buyout",
        label: "At Black Board buy-out",
        foodBeverageMinimum: 1200,
        rentalFee: 1050,
        rentalLabel: "3-hour restaurant rental",
        note: "Labor is included with the restaurant rental. Additional hours are quoted separately."
      }
    ]
  },
  aLaCarte: {
    usesSamplePricing: false,
    maxMeats: 3,
    pickupProductionFeeRate: 0.2,
    dropoffProductionFeeRate: 0.3,
    pickupWeekdayMinimum: 500,
    dropoffMinimum: 500,
    dessertDefaultContainerSize: "full-tray",
    dessertContainerSizes: [
      {
        id: "quart",
        label: "Quart",
        servings: 8
      },
      {
        id: "half-tray",
        label: "1/2 tray",
        servings: 20
      },
      {
        id: "full-tray",
        label: "Full tray",
        servings: 40
      }
    ],
    fulfillmentOptions: [
      {
        id: "pickup",
        label: "Large pick-up",
        description: "Best for 20-50 guests. No minimum Friday-Sunday; $500 minimum Monday-Thursday."
      },
      {
        id: "dropoff",
        label: "Large drop-off",
        description: "$500 food and beverage minimum. Production fee includes delivery within 30 miles."
      }
    ],
    meats: [
      {
        id: "smoked-prime-brisket",
        label: "Smoked Prime Brisket",
        unit: "lb",
        unitLabel: "lb cooked",
        rawYield: 0.5,
        yieldNote: "Sold by the cooked pound.",
        active: true,
        pricePerUnit: 36
      },
      {
        id: "pork-spare-ribs",
        label: "Pork Spare Ribs",
        unit: "lb",
        unitLabel: "lb cooked",
        rawYield: 0.6,
        yieldNote: "Sold by the cooked pound.",
        active: true,
        pricePerUnit: 28
      },
      {
        id: "whole-smoked-chicken",
        label: "Whole Smoked Chicken",
        unit: "bird",
        unitLabel: "bird",
        piecesPerUnit: 8,
        yieldNote: "Sold by the bird. Each whole smoked chicken yields 8 pieces.",
        active: true,
        pricePerUnit: 18
      },
      {
        id: "pulled-pork",
        label: "Pulled Pork",
        unit: "lb",
        unitLabel: "lb cooked",
        rawYield: 0.65,
        yieldNote: "Sold by the cooked pound.",
        active: true,
        pricePerUnit: 22
      },
      {
        id: "garlic-confit-sausage",
        label: "Garlic Confit Sausage",
        unit: "lb",
        unitLabel: "lb cooked",
        rawYield: 0.85,
        yieldNote: "Sold by the cooked pound.",
        active: true,
        pricePerUnit: 20
      },
      {
        id: "jalapeno-cheddar-sausage",
        label: "Jalapeno Cheddar Sausage",
        unit: "lb",
        unitLabel: "lb cooked",
        rawYield: 0.85,
        yieldNote: "Sold by the cooked pound.",
        active: true,
        pricePerUnit: 21
      },
      {
        id: "turkey-breast",
        label: "Turkey Breast",
        unit: "lb",
        unitLabel: "lb cooked",
        rawYield: 0.62,
        yieldNote: "Sold by the cooked pound.",
        active: true,
        pricePerUnit: 24
      }
    ],
    sides: [
      {
        id: "creamy-jalapeno-slaw",
        label: "Creamy Jalapeno Slaw",
        unit: "quart",
        unitLabel: "quart",
        ouncesPerGuest: 4,
        ouncesPerUnit: 32,
        yieldNote: "Sold by the quart.",
        active: true,
        pricePerUnit: 20
      },
      {
        id: "charro-beans",
        label: "Charro Beans",
        unit: "quart",
        unitLabel: "quart",
        ouncesPerGuest: 4,
        ouncesPerUnit: 32,
        yieldNote: "Sold by the quart.",
        active: true,
        pricePerUnit: 20
      },
      {
        id: "stone-ground-potato-salad",
        label: "Stone Ground Mustard Potato Salad",
        unit: "quart",
        unitLabel: "quart",
        ouncesPerGuest: 4,
        ouncesPerUnit: 32,
        yieldNote: "Sold by the quart.",
        active: true,
        pricePerUnit: 20
      },
      {
        id: "mac-n-cheese",
        label: "Mac N Cheese",
        unit: "quart",
        unitLabel: "quart",
        ouncesPerGuest: 4,
        ouncesPerUnit: 32,
        yieldNote: "Sold by the quart.",
        active: true,
        pricePerUnit: 20
      },
      {
        id: "garlicky-green-beans",
        label: "Garlicky Green Beans",
        unit: "quart",
        unitLabel: "quart",
        ouncesPerGuest: 4,
        ouncesPerUnit: 32,
        yieldNote: "Sold by the quart.",
        active: true,
        pricePerUnit: 20
      }
    ],
    desserts: [
      {
        id: "seasonal-cobbler",
        label: "Seasonal Cobbler",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 18,
          "half-tray": 55,
          "full-tray": 95
        }
      },
      {
        id: "shortbread-banana-pudding",
        label: "Shortbread Banana Pudding",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 16,
          "half-tray": 45,
          "full-tray": 80
        }
      },
      {
        id: "shiner-bock-brownie-bites",
        label: "Shiner Bock Caramel Brownie Bites",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 18,
          "half-tray": 45,
          "full-tray": 80
        }
      },
      {
        id: "brown-butter-cookies",
        label: "Brown Butter, Sea Salt + Chocolate Chip Cookies",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1.5,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 16,
          "half-tray": 40,
          "full-tray": 75
        }
      },
      {
        id: "minimalist-carrot-cake-bites",
        label: "Minimalist Carrot Cake Bites",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 18,
          "half-tray": 45,
          "full-tray": 80
        }
      },
      {
        id: "buttermilk-pie-bars",
        label: "Buttermilk Pie Bars",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 18,
          "half-tray": 45,
          "full-tray": 80
        }
      },
      {
        id: "bourbon-bread-pudding",
        label: "Bourbon Sauce Bread Pudding",
        unit: "container",
        unitLabel: "container",
        portionsPerGuest: 1,
        yieldNote: "Configured by backend dessert default.",
        active: true,
        priceByContainer: {
          "quart": 20,
          "half-tray": 55,
          "full-tray": 95
        }
      }
    ],
    beverages: [
      {
        id: "sweet-unsweet-tea",
        label: "Sweet & Unsweet Tea",
        unit: "gallon",
        unitLabel: "gallon",
        servingsPerGuest: 1,
        servingsPerUnit: 16,
        yieldNote: "Sold by the gallon.",
        active: true,
        pricePerUnit: 12
      },
      {
        id: "fresh-lemonade",
        label: "Fresh Squeezed Lemonade",
        unit: "gallon",
        unitLabel: "gallon",
        servingsPerGuest: 1,
        servingsPerUnit: 16,
        yieldNote: "Sold by the gallon.",
        active: true,
        pricePerUnit: 16
      }
    ]
  }
};

function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function roundQuantity(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) {
    throw new Error("Enter a valid event date.");
  }
}

function requireGuestCount(guestCount) {
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    throw new Error("Guest count must be a whole number greater than 0.");
  }
}

function getMeatOuncesPerGuest(meatCount) {
  if (meatCount === 1) return 8;
  if (meatCount === 2) return 5;
  if (meatCount === 3) return 4;
  return 0;
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
  const teamMembers = Math.ceil(input.guestCount / 25);
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
    moneyLine("30% production fee", math.productionFee),
    moneyLine("8.25% sales tax", math.salesTax),
    moneyLine("25% deposit to reserve", math.deposit),
    moneyLine("Estimated balance after deposit", math.balanceDue)
  );

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
  const meatPoundsPerSelection = (plannedGuests * portions.meatOuncesPerGuest) / 16;
  const sideQuartsPerSelection = (plannedGuests * portions.sideOuncesPerGuest) / 32;
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
      totalPounds: roundQuantity((plannedGuests * portions.sideOuncesPerGuest) / 16)
    });
  });

  if (selectedPackage.salad) {
    prep.extras.push({
      label: "Garden salad",
      body: `${roundQuantity((plannedGuests * portions.saladOuncesPerGuest) / 16)} lb · ${portions.saladOuncesPerGuest} oz per planned guest`
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

function dateIsFridayToSunday(eventDate) {
  const day = new Date(`${eventDate}T00:00:00`).getDay();
  return day === 5 || day === 6 || day === 0;
}

function getAlaCarteMinimum(eventDate, fulfillmentId) {
  if (fulfillmentId === "dropoff") return CONFIG.aLaCarte.dropoffMinimum;
  if (fulfillmentId === "pickup") {
    return dateIsFridayToSunday(eventDate) ? 0 : CONFIG.aLaCarte.pickupWeekdayMinimum;
  }
  throw new Error("Choose pickup or drop-off.");
}

function getAlaCarteProductionRate(fulfillmentId) {
  if (fulfillmentId === "pickup") return CONFIG.aLaCarte.pickupProductionFeeRate;
  if (fulfillmentId === "dropoff") return CONFIG.aLaCarte.dropoffProductionFeeRate;
  throw new Error("Choose pickup or drop-off.");
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
  const cookedOuncesPerGuest = getMeatOuncesPerGuest(meats.length);

  return {
    meats: meats.map((meat) => {
      const cookedOunces = guestCount * cookedOuncesPerGuest;
      const recommendedCookedPounds = cookedOunces / 16;
      const recommendedQuantity =
        meat.unit === "lb" ? Math.ceil(recommendedCookedPounds) : Math.ceil(guestCount / (meat.piecesPerUnit || 1));
      const orderQuantity = getQuantityOverride(payload, "meats", meat) ?? recommendedQuantity;
      const cookedPounds = meat.unit === "lb" ? orderQuantity : null;
      const rawPounds = meat.rawYield ? cookedPounds / meat.rawYield : null;
      const unitPrice = getUnitPrice(payload, "meats", meat);

      return {
        id: meat.id,
        label: meat.label,
        unit: meat.unit,
        unitLabel: meat.unitLabel,
        portion:
          meat.unit === "lb"
            ? `${cookedOuncesPerGuest} oz cooked per guest`
            : `${meat.piecesPerUnit || 1} pieces per ${meat.unitLabel || meat.unit}`,
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
      const recommendedQuantity = Math.ceil(totalOunces / side.ouncesPerUnit);
      const orderQuantity = getQuantityOverride(payload, "sides", side) ?? recommendedQuantity;
      const unitPrice = getUnitPrice(payload, "sides", side);

      return {
        id: side.id,
        label: side.label,
        unit: side.unit,
        portion: `${side.ouncesPerGuest} oz per guest`,
        totalOunces: roundQuantity(totalOunces),
        totalPounds: roundQuantity(totalOunces / 16),
        recommendedQuantity,
        orderQuantity,
        unitPrice: roundCurrency(unitPrice),
        lineTotal: roundCurrency(orderQuantity * unitPrice)
      };
    }),
    desserts: desserts.map((dessert) => {
      const selectedSize = getDessertContainer(payload.dessertSizes?.[dessert.id]);
      const portions = Math.ceil(guestCount * dessert.portionsPerGuest);
      const recommendedQuantity = Math.ceil(portions / selectedSize.servings);
      const orderQuantity = getQuantityOverride(payload, "desserts", dessert) ?? recommendedQuantity;
      const unitPrice = getUnitPrice(payload, "desserts", dessert, selectedSize.id);

      return {
        id: dessert.id,
        label: dessert.label,
        portion: `${dessert.portionsPerGuest} serving${dessert.portionsPerGuest === 1 ? "" : "s"} per guest`,
        portions,
        container: selectedSize,
        unitLabel: selectedSize.label,
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
  const minimum = getAlaCarteMinimum(input.eventDate, fulfillment.id);
  const productionFeeRate = getAlaCarteProductionRate(fulfillment.id);
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

  lines.push(
    moneyLine(
      `${fulfillment.id === "pickup" ? "Pickup" : "Delivery"} add-on (${Math.round(productionFeeRate * 100)}%)`,
      math.productionFee
    ),
    moneyLine("8.25% sales tax", math.salesTax),
    moneyLine("25% deposit to reserve", math.deposit),
    moneyLine("Estimated balance after deposit", math.balanceDue)
  );

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
  calculateQuote,
  calculateFullServiceQuote,
  calculateAlaCarteQuote,
  getMeatOuncesPerGuest
};
