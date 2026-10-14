# Strapi CMS

## Scripts

Start Strapi in development mode:

```bash
npm run develop
```

Start Strapi in production mode:

```bash
npm run start
```

Build the Strapi admin panel:

```bash
npm run build
```

## Database

SQLite is for local development. If `DATABASE_CLIENT` is not set, Strapi uses the existing SQLite database file at `.tmp/data.db`.

PostgreSQL is for production. Configure these environment variables before running Strapi in production:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=your-postgres-host
DATABASE_PORT=5432
DATABASE_NAME=your-database-name
DATABASE_USERNAME=your-database-user
DATABASE_PASSWORD=your-database-password
DATABASE_SSL=false
```

Set `DATABASE_SSL=true` when your PostgreSQL provider requires TLS.

## Ollama AI summary generation

Ollama must run separately from Strapi. The local default URL is `http://localhost:11434`.

In production, set `OLLAMA_BASE_URL` to a reachable internal AI server URL. Do not expose Ollama publicly without protection.

Required environment variables:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
AI_INTERNAL_SECRET=change-this-secret
```

Available protected routes:

- `POST /api/ai/generate-article-summary`
- `GET /api/ai/health`

Example request:

```bash
curl -X POST http://localhost:1337/api/ai/generate-article-summary \
  -H "Content-Type: application/json" \
  -H "x-ai-secret: change-this-secret" \
  -d "{\"articleId\":\"ARTICLE_ID_OR_DOCUMENT_ID\"}"
```
