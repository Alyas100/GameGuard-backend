Backend Setup

Prerequisites

- Install Node.js (recommended v16 or newer) and npm

Install dependencies

```bash
npm install
```

Environment

- Create a `.env` file in the `backend` directory and set required variables (for example `DATABASE_URL`, `PORT`, etc.).

Database

- Run Prisma migrations (development):

```bash
npx prisma migrate dev
```

- Or run migrations for production:

```bash
npx prisma migrate deploy
```

- Seed the database:

```bash
npm run seed
```

Docker PostgreSQL (named `gameguard`)

- Pull and run the PostgreSQL Docker image using the `gameguard` container name and a persistent volume:

```bash
docker pull postgres:15
docker run -d \
	--name gameguard \
	-e POSTGRES_USER=gameguard_user \
	-e POSTGRES_PASSWORD=change_me \
	-e POSTGRES_DB=gameguard_db \
	-v gameguard-data:/var/lib/postgresql/data \
	-p 5432:5432 \
	postgres:15
```

- Set `DATABASE_URL` in `.env` to point to the container, for example:

```
DATABASE_URL=postgresql://gameguard_user:change_me@localhost:5432/gameguard_db
```

- Wait for the database to be ready before running migrations or seeding.

Start the server

- Run the server directly:

```bash
node app/src/server.js
```

Notes

- If you prefer a start script, add a `start` script to `package.json` and use `npm start`.

Docker Compose (local development)

- Start Postgres and the backend together (it uses the `postgres:15` image for the database):

```bash
docker compose up -d
```

- Build and recreate containers (if you changed Dockerfile or dependencies):

```bash
docker compose up -d --build
```

- The `DATABASE_URL` used by the backend when run via compose is:

```
postgresql://gameguard_user:change_me@db:5432/gameguard_db
```

- To view logs:

```bash
docker compose logs -f backend
```
