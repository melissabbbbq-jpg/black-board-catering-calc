# Backend Admin UI and Settings Deployment Runbook

This runbook covers what is already built, how to deploy it on Render, and how to update settings or code after launch.

## Current State

- GitHub repo: `melissabbbbq-jpg/black-board-catering-calc`
- Production branch: `main`
- Backend entrypoint: `src/server.js`
- Render Blueprint: `render.yaml`
- Guest calculator: `/`
- Admin calculator and settings editor: `/admin`
- Health check: `/api/health`
- Runtime calculator settings: `data/calculator-config.json`
- Default calculator settings: `data/calculator-config.default.json`

The backend serves the public calculator and admin UI, calculates quotes, saves calculator settings, resets settings to defaults, and submits quote requests by email.

## Backend and Admin Endpoints

- `GET /api/health`: returns backend health status for Render and manual checks.
- `GET /api/config`: returns the active calculator settings.
- `PUT /api/config`: saves admin-edited calculator settings.
- `POST /api/config/reset`: restores default calculator settings.
- `POST /api/calculate`: calculates guest quotes and admin prep details.
- `POST /api/quote-request`: sends or captures guest quote requests.

The `/admin` page includes the database editor for pricing, portions, taxes, fees, deposits, minimums, packages, quote email settings, and recommendation rules.

## Deploy on Render

Use the existing Render Blueprint file.

1. Open the Render Dashboard.
2. Choose **New > Blueprint**.
3. Connect the GitHub repo `melissabbbbq-jpg/black-board-catering-calc`.
4. Select branch `main`.
5. Use Blueprint path `render.yaml`.
6. Confirm the service name is `bbq-catering-calculator`.
7. Deploy the Blueprint.

The service is configured as:

- Runtime: Node
- Plan: free
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

## Production Environment Variables

Set these in the Render service environment before testing quote submissions:

- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Confirm these are present from `render.yaml` or the Render environment page:

- `HOST=0.0.0.0`
- `NODE_VERSION=20`
- `EMAIL_DELIVERY_MODE=smtp`
- `QUOTE_RECIPIENT_EMAIL=melissa@blackboardbarbq.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`

Use an SMTP app password or provider API key for `SMTP_PASS`, not a personal email password.

For local testing without sending email, use `EMAIL_DELIVERY_MODE=capture`. Captured submissions are written to `data/quote-submissions.json`.

## Post-Deploy Checks

After Render finishes deploying:

1. Open `/api/health` and confirm it returns `status: "ok"`.
2. Open `/` and calculate one full-service quote.
3. Open `/admin` and confirm the database editor loads.
4. In `/admin`, calculate a quote and confirm admin prep details are visible.
5. Open `/api/config` and confirm calculator settings are returned.
6. Submit a quote request from the guest flow.
7. Confirm the quote request email arrives at `QUOTE_RECIPIENT_EMAIL`.

If quote email fails, check Render logs first, then verify SMTP environment variables.

## Updating Settings

For permanent production settings changes, edit `data/calculator-config.json` in the repo, test locally, commit, and push to `main`. Render will redeploy from the updated branch.

The `/admin` editor saves settings to the service filesystem. This is useful for quick edits and validation, but Render services use an ephemeral filesystem by default. Without persistent storage or a real database, production edits made only in `/admin` can be lost on restart or redeploy.

Safe settings workflow:

1. Make the setting change in `data/calculator-config.json`.
2. Run `node --test` or `npm test`.
3. Commit the change.
4. Push or merge to `main`.
5. Let Render redeploy.
6. Re-check `/api/config` and one calculator quote.

## Updating Code and Redeploying

Use this flow for backend, admin UI, or public calculator changes:

1. Create a branch from `main`.
2. Make the code change.
3. Run the test suite.
4. Open a pull request if review is needed.
5. Merge to `main`.
6. Render redeploys the linked branch automatically, unless auto-deploy is disabled.
7. Run the post-deploy checks above.

If a deploy needs to be triggered manually, open the Render service page and use **Manual Deploy > Deploy latest commit**.

## Notes for Future Hardening

- Add authentication before exposing `/admin` publicly.
- Move saved settings to persistent storage before relying on live admin edits as the source of truth.
- Add a database if multiple users need reliable concurrent admin edits.
- Add a smoke-test script for `/api/health`, `/api/config`, and a sample quote calculation once the production URL is known.
