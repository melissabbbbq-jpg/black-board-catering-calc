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

## Deploy

This app is configured for Render with `render.yaml`. See [DEPLOYMENT.md](DEPLOYMENT.md) for the full admin UI,
settings, deployment, update, and redeploy runbook.

## Guest Request Flow

Guests enter contact details, event type, optional event date, guest count, package or menu selections, service choice, and quantities before calculating a quote. Pickup/delivery quantities auto-populate from backend recommendations and remain editable by guests. They can click `Ready to move forward` after calculating a quote, submit the request in-app, and see: `Your quote has been submitted. We will be in touch soon!`

Quote requests are sent by the backend through SMTP. Configure these environment variables in production:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `QUOTE_RECIPIENT_EMAIL`

On Render, open the service dashboard, go to **Environment**, add or fill in those variables, then redeploy the
service. `SMTP_PASS` should be an app password or SMTP API key from the email provider, not a personal login password.

For local testing without sending real email, set `EMAIL_DELIVERY_MODE=capture`; submissions are written to `data/quote-submissions.json`.

## Backend Price Management

Menu, pricing, fees, taxes, deposits, minimums, package rules, quote recipient settings, and recommendation data are managed in the admin database editor at `/admin`. The saved runtime file is `data/calculator-config.json`; defaults live in `data/calculator-config.default.json`. The guest form reads those values from `/api/config`, so frontend form code does not need price edits.

For spreadsheet uploads or bulk menu updates, use one row per menu item with these columns: `Menu Item`, `Category`, `Price`, `Unit`, `Portion Size`, `Guest Count Assumptions`, `Yield`, `Order Increments`, `Formula Notes`, and `Relevant Notes`.

## Full-Service Rules

- Buffet packages:
  - Texas Two-Step: $27/person
  - Texas Smoke Show: $34/person
  - Texas Trinity: $39/person
  - The Whole Dang Barn: $52/person
- Package selections:
  - Texas Two-Step: exactly 2 meats and 2 sides.
  - Texas Smoke Show: exactly 2 meats and 2 sides.
  - Texas Trinity: fixed brisket, ribs, and sausage; exactly 2 sides.
  - The Whole Dang Barn: exactly 4 meats, 4 sides, and 1 dessert.
- Off-site full service has a $2,000 food and beverage minimum.
- Restaurant buy-out has a $1,200 food and beverage minimum plus a $1,050 starting rental fee.
- Large party reservations at Black Board Bar-B-Q show the a la carte menu and calculate from selected bulk menu items.
- Production fee is 30%.
- Sales tax is 8.25%.
- Deposit is 25% to reserve, collected after follow-up rather than through the app.
- Admin prep uses a 15% buffet overage planning buffer.

## Pickup / Delivery Rules

- Pickup production fee is 20%.
- Pickup has no food and beverage minimum Friday-Sunday and a $500 minimum Monday-Thursday.
- Drop-off production fee is 30%.
- Drop-off has a $500 food and beverage minimum.
- Pickup/delivery item prices are managed in backend config and are not visible or editable by guests.
- Some dessert prices use the backend default full-tray container size; Excel-priced a la carte desserts can also be sold by quart or piece.
- Smoked meats are quoted by their configured unit type, such as cooked pound or whole chicken. Whole smoked chicken is sold by the whole chicken, with 16 planned pieces per chicken.
- Sides by the Quart are quoted at $20 per quart in backend config.
- Beverages are quoted by gallon, using 16 servings per gallon.

## Quantity Rules

- A la carte meats use each item's own portion rule, regardless of how many meats are selected.
- Brisket uses 5 oz cooked per guest; Burnt Ends use 2 oz; Pulled Pork and Turkey Breast use 3 oz each; sausage links use 1 oz each.
- Pork Spare Ribs and Whole Smoked Chicken use 1 piece per guest, converted to the configured sellable unit.
- Sides use each item's ounces-per-guest rule.
- Desserts use each item's configured unit: quart, piece, or backend default dessert container.
- Beverages use 16 servings per gallon.
- Auto-populated quantity values round up to the sellable unit.
