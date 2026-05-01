# CRUD-Project — Student Management

A small server-rendered Express app for managing students (name, age, fees) backed by MongoDB. Views are rendered with EJS; data is persisted via Mongoose. The repository is the subject of an ongoing wiring sprint — see [Project Status](#project-status) for context before contributing.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Status](#project-status)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Docker](#docker)
- [Project Layout](#project-layout)
- [License](#license)

---

## Tech Stack

| Layer       | Technology                  |
| ----------- | --------------------------- |
| Runtime     | Node.js 20+ (ES Modules)    |
| Web         | Express 5 (alpha)           |
| Templating  | EJS                         |
| Database    | MongoDB via Mongoose 8      |
| Config      | dotenv                      |
| Dev tooling | nodemon                     |
| Tests       | `node --test` (built-in)    |
| CI          | GitHub Actions (Node 20)    |

---

## Project Status

This is a brownfield codebase recovering from an analyzer health score of **65/100**. A multi-ticket wiring sprint is in flight to connect previously orphaned modules (DB layer, routes, frontend JS). Treat sections of the README that depend on in-flight tickets (Docker, `.env.example`, `npm start`) as the **target state** — if a referenced file is missing locally, pull `main` or use the development fallback noted alongside.

---

## Getting Started

You should be able to go from a fresh clone to a running server in under 5 minutes.

### Prerequisites

- **Node.js 20+** and npm 10+
- **MongoDB** — either a local `mongod` instance or a connection string (e.g. MongoDB Atlas). For Docker users, the bundled `docker compose` stack provisions Mongo for you (see [Docker](#docker)).

### 1. Clone and install

```bash
git clone https://github.com/PraAIHub-bot/CRUD-Project.git
cd CRUD-Project
npm ci
```

`npm ci` is preferred over `npm install` because it installs from the committed `package-lock.json` for a reproducible tree. If you do not yet have a lockfile checked out, `npm install` works as a fallback.

### 2. Configure environment

Copy the example env file and fill in your MongoDB URL:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=mongodb://localhost:27017
PORT=3000
```

See [Environment Variables](#environment-variables) for the full list.

### 3. Run the app

```bash
npm start        # production-style start
# or
npm run dev      # nodemon, auto-restart on file changes
```

Open <http://localhost:3000> — you should see the student list (empty on first run).

> **Note**: if `npm start` is not yet defined in `package.json`, fall back to `npm run dev`. The `start` script is being added as part of the sprint wiring work.

---

## API Endpoints

All routes are wired in [`routes/web.js`](routes/web.js) and mounted at `/` by [`app.js`](app.js).

| Method | Path           | Description                                                                          |
| ------ | -------------- | ------------------------------------------------------------------------------------ |
| GET    | `/`            | Render the student list (`views/index.ejs`).                                         |
| POST   | `/`            | Create a new student. Body: `name`, `age`, `fees` (form-encoded). Redirects to `/`.  |
| GET    | `/edit/:id`    | Render the edit form for the student with `:id` (`views/edit.ejs`).                  |
| POST   | `/update/:id`  | Update the student with `:id`. Body: any `Student` fields. Redirects to `/`.         |
| POST   | `/delete/:id`  | Delete the student with `:id`. Redirects to `/`.                                     |
| GET    | `/api/health`  | Lightweight connectivity probe. Returns `{ "ok": true }`. Consumed by frontend JS.   |

Static assets under `public/` are served from `/` and `/edit/` (so the edit page can resolve relative asset URLs).

---

## Data Models

Defined in [`models/`](models/). The application currently exposes one Mongoose model.

| Model     | Collection | Field  | Type                  | Constraints                    |
| --------- | ---------- | ------ | --------------------- | ------------------------------ |
| `Student` | `data`     | `name` | `String`              | required, trimmed              |
|           |            | `age`  | `Number`              | required, min 18, max 50       |
|           |            | `fees` | `mongoose.Decimal128` | required                       |

The collection name is `data` (Mongoose pluralizes `mongoose.model("data", ...)` to itself when it ends in non-pluralizable form — explicitly the model registers as `data`).

---

## Environment Variables

Read at startup via `dotenv.config()`. All variables are optional unless marked otherwise; defaults match local development.

| Variable       | Required | Default | Description                                                                   |
| -------------- | -------- | ------- | ----------------------------------------------------------------------------- |
| `DATABASE_URL` | yes      | _none_  | MongoDB connection string. Used by `db/connectDB.js`. The DB name is forced to `student_db` via Mongoose options. |
| `PORT`         | no       | `3000`  | HTTP port the Express server listens on.                                      |

A reference template lives at `.env.example`. Copy it to `.env` (which is git-ignored) before starting the app:

```bash
cp .env.example .env
```

> **Heads up**: some upstream documentation refers to this variable as `MONGODB_URI`. The codebase uses `DATABASE_URL`. If you see an older example, treat the two as synonymous and keep `DATABASE_URL` for consistency with `app.js`.

---

## Testing

Tests use Node's built-in test runner — no extra dev dependencies required.

```bash
npm test
```

This runs every `*.test.js` file under `tests/`. The suite includes:

- Smoke tests that boot a test app and assert views render (`tests/views.test.js`).
- Static-asset serving checks (`tests/public.test.js`).
- A workflow validation test that asserts the CI pipeline shape (`tests/ci-workflow.test.js`).
- A README structure test that pins the required sections in this file (`tests/readme.test.js`).

CI runs the same command on every push and pull request — see [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

---

## Docker

A Compose stack is provided to run the app and a Mongo instance together without installing MongoDB locally.

```bash
docker compose up
```

This brings up two services:

| Service | Image           | Port      | Purpose                              |
| ------- | --------------- | --------- | ------------------------------------ |
| `app`   | built locally   | `3000`    | Node/Express server                  |
| `mongo` | `mongo:7`       | `27017`   | Database for `student_db`            |

The compose file wires `DATABASE_URL=mongodb://mongo:27017` so the app talks to the bundled database container. To tear everything down (and remove the data volume):

```bash
docker compose down -v
```

> **Status**: `docker-compose.yml` is delivered by a sibling ticket in this sprint. If the file is missing on your branch, either pull `main` or run the app with a local Mongo (see [Getting Started](#getting-started)).

---

## Project Layout

```
.
├── app.js                  # Express bootstrap — entry point
├── controllers/            # Request handlers (one class per resource)
│   └── studentController.js
├── db/
│   └── connectDB.js        # Mongoose connection helper
├── models/
│   └── Student.js          # Mongoose schema
├── routes/
│   └── web.js              # All wired routes (mounted at /)
├── views/                  # EJS templates (index, edit, error, partials)
├── public/                 # Static assets (CSS, client JS, images)
├── tests/                  # node --test suites
├── __tests__/              # legacy mirror of tests (kept for tooling discovery)
└── .github/workflows/ci.yml
```

---

## License

MIT — see [LICENSE](LICENSE).
