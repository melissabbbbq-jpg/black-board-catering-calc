const assert = require("node:assert/strict");
const test = require("node:test");
const {
  CONFIG,
  calculateQuote,
  reloadCalculatorConfig,
  saveCalculatorConfig
} = require("../src/calculator");

test("calculates a full-service buffet package quote", () => {
  const result = calculateQuote({
    calculatorType: "full-service",
    eventDate: "2026-07-04",
    guestCount: 100,
    packageId: "texas-smoke-show",
    venueType: "offsite",
    packageMeats: ["smoked-prime-brisket", "pulled-pork"],
    packageSides: ["mac-n-cheese", "stone-ground-potato-salad"]
  });

  assert.equal(result.mode, "full-service");
  assert.equal(result.selections.package.label, "Texas Smoke Show");
  assert.equal(result.quote.packageSubtotal, 3000);
  assert.equal(result.quote.minimumAdjustment, 0);
  assert.equal(result.quote.productionFee, 900);
  assert.equal(result.quote.salesTax, 321.75);
  assert.equal(result.quote.totalQuote, 4221.75);
  assert.equal(result.quote.deposit, 1055.44);
  assert.equal(result.prep.plannedGuests, 115);
  assert.equal(result.prep.meats.length, 2);
  assert.equal(result.prep.sides.length, 2);
  assert.equal(result.prep.meats[0].cookedPounds, 36);
  assert.equal(result.prep.sides[0].quarts, 15);
});

test("applies full-service food and beverage minimums", () => {
  const result = calculateQuote({
    calculatorType: "full-service",
    eventDate: "2026-09-12",
    guestCount: 50,
    packageId: "texas-two-step",
    venueType: "offsite",
    packageMeats: ["smoked-prime-brisket", "turkey-breast"],
    packageSides: ["charro-beans", "creamy-jalapeno-slaw"]
  });

  assert.equal(result.quote.packageSubtotal, 1250);
  assert.equal(result.quote.minimumAdjustment, 750);
  assert.equal(result.quote.preFeeSubtotal, 2000);
  assert.equal(result.quote.totalQuote, 2814.5);
  assert.equal(result.quote.deposit, 703.63);
});

test("uses fixed Texas Trinity meats and requires only side choices", () => {
  const result = calculateQuote({
    calculatorType: "full-service",
    eventDate: "2026-10-03",
    guestCount: 80,
    packageId: "texas-trinity",
    venueType: "offsite",
    packageSides: ["charro-beans", "mac-n-cheese"]
  });

  assert.deepEqual(result.selections.meats, [
    "Smoked Prime Brisket",
    "Pork Spare Ribs",
    "Garlic Confit Link"
  ]);
  assert.deepEqual(result.selections.sides, ["Charro Beans", "Mac N Cheese"]);
  assert.equal(result.prep.meats.length, 3);
  assert.equal(result.prep.sides.length, 2);
});

test("uses fixed per-item meat portions for a la carte selections", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-04",
    guestCount: 50,
    fulfillment: "dropoff",
    meats: ["smoked-prime-brisket", "pulled-pork", "turkey-breast"],
    sides: ["charro-beans"],
    desserts: [],
    beverages: []
  });

  assert.deepEqual(
    result.prep.meats.map((item) => ({
      label: item.label,
      portion: item.portion,
      orderQuantity: item.orderQuantity,
      lineTotal: item.lineTotal
    })),
    [
      {
        label: "Smoked Prime Brisket",
        portion: "5 oz per guest",
        orderQuantity: 16,
        lineTotal: 576
      },
      {
        label: "Pulled Pork",
        portion: "3 oz per guest",
        orderQuantity: 10,
        lineTotal: 200
      },
      {
        label: "Turkey Breast",
        portion: "3 oz per guest",
        orderQuantity: 10,
        lineTotal: 320
      }
    ]
  );
  assert.equal(result.quote.menuSubtotal, 1236);
});

test("calculates pickup and delivery a la carte quantities and quote from unit prices", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-04",
    guestCount: 50,
    fulfillment: "dropoff",
    meats: ["smoked-prime-brisket", "whole-smoked-chicken"],
    sides: ["mac-n-cheese", "stone-ground-potato-salad"],
    desserts: ["shortbread-banana-pudding"],
    beverages: ["fresh-lemonade"],
    quantities: {}
  });

  assert.equal(result.mode, "a-la-carte");
  assert.equal(result.quote.menuSubtotal, 1184);
  assert.equal(result.quote.productionFee, 355.2);
  assert.equal(result.quote.salesTax, 126.98);
  assert.equal(result.quote.totalQuote, 1666.18);
  assert.equal(result.quote.deposit, 416.55);
  assert.equal(result.quote.pricingIncomplete, false);

  assert.deepEqual(
    result.prep.meats.map((item) => ({
      label: item.label,
      orderQuantity: item.orderQuantity,
      cookedPounds: item.cookedPounds,
      rawPounds: item.rawPounds
    })),
    [
      {
        label: "Smoked Prime Brisket",
        orderQuantity: 16,
        cookedPounds: 16,
        rawPounds: 32
      },
      {
        label: "Whole Smoked Chicken",
        orderQuantity: 4,
        cookedPounds: null,
        rawPounds: null
      }
    ]
  );
  assert.equal(result.prep.meats[0].unitPrice, 36);
  assert.equal(result.prep.meats[1].unit, "whole-chicken");
  assert.equal(result.prep.sides[0].orderQuantity, 7);
  assert.equal(result.prep.sides[1].orderQuantity, 7);
  assert.equal(result.prep.desserts[0].orderQuantity, 2);
  assert.equal(result.prep.desserts[0].container.id, "full-tray");
  assert.equal(result.prep.beverages[0].orderQuantity, 4);
});

test("uses backend prices for a la carte quotes", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-06",
    guestCount: 25,
    fulfillment: "pickup",
    meats: ["pulled-pork"],
    sides: ["charro-beans"],
    desserts: [],
    beverages: []
  });

  assert.equal(result.quote.pricingIncomplete, false);
  assert.equal(result.quote.usesSamplePricing, false);
  assert.equal(result.quote.menuSubtotal, 180);
  assert.equal(result.quote.minimumAdjustment, 320);
});

test("uses updated sides by the quart menu configuration", () => {
  const sides = CONFIG.aLaCarte.sides;

  assert.equal(sides.some((item) => item.id === "cheesy-hominy-casserole"), false);
  assert.equal(sides.some((item) => item.id === "garlicky-green-beans"), true);
  assert.equal(sides.some((item) => item.id === "sweet-potato-salad"), true);
  assert.deepEqual([...new Set(sides.map((item) => item.pricePerUnit))], [20]);
  assert.equal(sides.every((item) => !item.yieldNote.includes("4 oz per guest")), true);
});

test("calculates dessert defaults and beverage gallons from backend assumptions", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-04",
    guestCount: 32,
    fulfillment: "dropoff",
    meats: ["pulled-pork"],
    sides: ["garlicky-green-beans"],
    desserts: ["seasonal-cobbler"],
    beverages: ["sweet-unsweet-tea"],
    quantities: {}
  });

  assert.equal(result.prep.sides[0].unitPrice, 20);
  assert.equal(result.prep.sides[0].orderQuantity, 4);
  assert.equal(result.prep.desserts[0].container, null);
  assert.equal(result.prep.desserts[0].unitLabel, "quart");
  assert.equal(result.prep.desserts[0].orderQuantity, 4);
  assert.equal(result.prep.desserts[0].lineTotal, 256);
  assert.equal(result.prep.beverages[0].servings, 32);
  assert.equal(result.prep.beverages[0].orderQuantity, 2);
});

test("adds Excel a la carte items for meats sides and piece desserts", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-04",
    guestCount: 50,
    fulfillment: "dropoff",
    meats: ["burnt-ends", "pork-spare-ribs", "whole-smoked-chicken"],
    sides: ["sweet-potato-salad"],
    desserts: ["seasonal-cobbler", "brownie-bites", "chocolate-chip-cookies", "buttermilk-pie-bites"],
    beverages: []
  });

  assert.deepEqual(
    result.prep.meats.map((item) => ({
      label: item.label,
      portion: item.portion,
      orderQuantity: item.orderQuantity,
      lineTotal: item.lineTotal
    })),
    [
      {
        label: "Burnt Ends",
        portion: "2 oz per guest",
        orderQuantity: 7,
        lineTotal: 266
      },
      {
        label: "Pork Spare Ribs",
        portion: "1 pc per guest",
        orderQuantity: 4,
        lineTotal: 108
      },
      {
        label: "Whole Smoked Chicken",
        portion: "1 pc per guest",
        orderQuantity: 4,
        lineTotal: 104
      }
    ]
  );
  assert.equal(result.prep.sides[0].label, "Sweet Potato Salad");
  assert.equal(result.prep.sides[0].orderQuantity, 7);
  assert.equal(result.prep.desserts[0].label, "Seasonal Cobbler");
  assert.equal(result.prep.desserts[0].orderQuantity, 7);
  assert.deepEqual(
    result.prep.desserts.slice(1).map((item) => ({
      label: item.label,
      unitLabel: item.unitLabel,
      orderQuantity: item.orderQuantity,
      lineTotal: item.lineTotal
    })),
    [
      {
        label: "Brownie Bites",
        unitLabel: "piece",
        orderQuantity: 50,
        lineTotal: 125
      },
      {
        label: "Chocolate Chip Cookies",
        unitLabel: "piece",
        orderQuantity: 50,
        lineTotal: 125
      },
      {
        label: "Buttermilk Pie Bites",
        unitLabel: "piece",
        orderQuantity: 50,
        lineTotal: 125
      }
    ]
  );
  assert.equal(result.quote.menuSubtotal, 1441);
});

test("uses quantity overrides without accepting frontend price edits", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-04",
    guestCount: 25,
    fulfillment: "pickup",
    meats: ["smoked-prime-brisket"],
    sides: ["charro-beans"],
    desserts: [],
    beverages: [],
    quantities: {
      meats: {
        "smoked-prime-brisket": 3
      },
      sides: {
        "charro-beans": 2
      }
    },
    unitPrices: {
      meats: {
        "smoked-prime-brisket": 1
      }
    }
  });

  assert.equal(result.prep.meats[0].orderQuantity, 3);
  assert.equal(result.prep.meats[0].unitPrice, 36);
  assert.equal(result.prep.meats[0].lineTotal, 108);
  assert.equal(result.prep.sides[0].orderQuantity, 2);
});

test("requires a valid minimum a la carte menu", () => {
  assert.throws(
    () =>
      calculateQuote({
        calculatorType: "a-la-carte",
        eventDate: "2026-07-04",
        guestCount: 25,
        fulfillment: "dropoff",
        meats: [],
        sides: ["charro-beans"],
        desserts: []
      }),
    /Select at least one smoked meat/
  );
});

test("builds a clean draft invoice without backend formulas", () => {
  const result = calculateQuote({
    calculatorType: "a-la-carte",
    eventDate: "2026-07-04",
    guestCount: 50,
    fulfillment: "dropoff",
    meats: ["smoked-prime-brisket", "whole-smoked-chicken"],
    sides: ["mac-n-cheese"],
    desserts: [],
    beverages: []
  });

  assert.deepEqual(result.quote.invoice.items.slice(0, 2), [
    {
      label: "Smoked Prime Brisket",
      total: 576
    },
    {
      label: "Whole Smoked Chicken",
      total: 104
    }
  ]);
  assert.deepEqual(Object.keys(result.quote.invoice.summary), [
    "subtotal",
    "taxes",
    "fees",
    "depositAmount",
    "estimatedTotal"
  ]);
});

test("uses admin-saved config values in calculator logic", () => {
  const originalConfig = reloadCalculatorConfig();
  const editedConfig = JSON.parse(JSON.stringify(originalConfig));
  editedConfig.taxRate = 0.1;
  editedConfig.depositRate = 0.5;
  editedConfig.aLaCarte.meats.find((item) => item.id === "pulled-pork").ouncesPerGuest = 6;

  try {
    saveCalculatorConfig(editedConfig);
    const result = calculateQuote({
      calculatorType: "a-la-carte",
      eventDate: "2026-07-06",
      guestCount: 16,
      fulfillment: "pickup",
      meats: ["pulled-pork"],
      sides: ["charro-beans"],
      desserts: [],
      beverages: []
    });

    assert.equal(result.prep.meats[0].orderQuantity, 6);
    assert.equal(result.prep.meats[0].portion, "6 oz per guest");
    assert.equal(result.quote.taxRate, 0.1);
    assert.equal(result.quote.depositRate, 0.5);
  } finally {
    saveCalculatorConfig(originalConfig);
  }
});
