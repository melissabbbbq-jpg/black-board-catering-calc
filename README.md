# Black Board Bar-B-Q Catering Calculator

Minimal MVP for two quote paths:

- Full-service buffet packages from the full-service catering menu.
- Pickup / delivery a la carte ordering from the bulk catering menu.

The public guest view shows a clean total quote and a move-forward request form. The internal admin view is available at `/admin` and shows quote breakdowns plus prep quantities.

## Run

```bash
npm start
```

or, without npm:

```bash
node src/server.js
```

Then open http://127.0.0.1:3000.

## Test

```bash
npm test
```

or, without npm:

```bash
node --test
```

## Guest Request Flow

Guests enter contact details, event type, event date, guest count, package or menu selections, service choice, and quantities before calculating a quote. They can click `Ready to move forward` after calculating a quote. The MVP opens an email draft to `melissa@blackboardbarbq.com` with contact details, event details, selected package/items, quantities, unit prices, service add-on, total quote, and 25% deposit amount.

## Backend Price Management

Menu and pricing data is managed in `src/calculator.js` inside the exported `CONFIG` object. Update item `label`, category array, `unit` / `unitLabel`, `pricePerUnit` or `priceByContainer`, `yieldNote`, and `active` there; the guest form reads those values from `/api/config`, so frontend form code does not need price edits.

## Full-Service Rules

- Buffet packages:
  - Texas Two-Step: $25/person
  - Texas Smoke Show: $30/person
  - Texas Trinity: $35/person
  - The Whole Dang Barn: $47/person
- Package selections:
  - Texas Two-Step: exactly 2 meats and 2 sides.
  - Texas Smoke Show: exactly 2 meats and 2 sides.
  - Texas Trinity: fixed brisket, ribs, and sausage; exactly 2 sides.
  - The Whole Dang Barn: exactly 4 meats, 4 sides, and 1 dessert.
- Off-site full service has a $2,000 food and beverage minimum.
- Restaurant buy-out has a $1,200 food and beverage minimum plus a $1,050 starting rental fee.
- Production fee is 30%.
- Sales tax is 8.25%.
- Deposit is 25% to reserve, collected after follow-up rather than through the app.
- Admin prep uses a 15% buffet overage planning buffer.

## Pickup / Delivery Rules

- Pickup production fee is 20%.
- Pickup has no food and beverage minimum Friday-Sunday and a $500 minimum Monday-Thursday.
- Drop-off production fee is 30%.
- Drop-off has a $500 food and beverage minimum.
- Pickup/delivery item prices are managed in backend config and are not editable by guests.
- Dessert sample prices change by selected container size.
- Smoked meats are quoted by their configured unit type, such as cooked pound or bird. Whole smoked chicken is sold by the bird, with 8 pieces per bird.
- Sides are quoted by quart using 4 oz per guest for recommendations.
- Desserts are quoted by quart, half tray, or full tray.
- Beverages are quoted by gallon.

## Quantity Rules

- Meat portions:
  - 1 meat: 8 oz cooked per guest
  - 2 meats: 5 oz cooked per guest per meat
  - 3 meats: 4 oz cooked per guest per meat
- Sides use each item's ounces-per-guest rule.
- Desserts use each item's portions-per-guest rule and the selected container size.
- Beverages use 16 servings per gallon.
