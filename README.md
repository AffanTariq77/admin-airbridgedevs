# Admin AirBridgeDevs

Centralized admin panel for managing submissions across all AirBridge repositories.

## Features
- Authentication with JWT and role-based access.
- Dashboard overview of connected repositories.
- CRUD access to contact submissions.
- Metadata management (status + notes) stored in the admin database.
- Modular integration via a simple JSON registry.

## Quick start
1. Install dependencies:
   - `npm install`
2. Create `.env` from the example:
   - `cp .env.example .env`
3. Update `.env` with your own values.
4. Start dev servers:
   - `npm run dev`

Frontend runs on port 5179, API on port 5050.

## Configuration
### Repository registry
Edit config at:
- config/repos.json

Each entry uses:
- `id`: URL-friendly id
- `name`: Display name
- `description`: Optional description
- `dbPath`: Path to the repository’s `contact_submissions.db`

Example:
```
{
  "id": "ai-analytics-dashboards",
  "name": "AI Analytics Dashboards",
  "dbPath": "../AI-Analytics-Dashboards/contact_submissions.db"
}
```

### Authentication
- `ADMIN_DEFAULT_EMAIL`
- `ADMIN_DEFAULT_PASSWORD`
- `JWT_SECRET`

If there are no users in the admin DB, the server bootstraps the first admin using these values.

## Integration model
The admin panel reads each repository’s `contact_submissions.db` directly. This avoids embedding admin logic in the individual repos. Repos only need to continue writing contact submissions as they already do.

If a repository does not yet have a `contact_submissions.db`, the admin will show zero submissions until the file exists.

## Adding a new repository
1. Add a new entry in config/repos.json.
2. Ensure the repo writes contact submissions to `contact_submissions.db` at its root.
3. Restart the admin server.

## Environment variables
See .env.example for the full list.

## Notes
- This admin panel does not modify contact form behavior in the repositories.
- Role-based access is enforced for create/update/delete actions.
