# GlobalEduNova Telegram Bot

Production-ready Telegram bot for university application management, built with Node.js, TypeScript, Telegraf, and PostgreSQL.

## Features

- `/start` command with onboarding flow
- Multi-language support (English, Russian, Uzbek)
- Phone number sharing via Telegram contact button
- Main menu with universities, applications, documents, manager contact, and profile
- PostgreSQL persistence for user data
- Structured logging with Pino
- Global error handling
- Docker & Docker Compose support
- Environment variable validation with Zod

## Project Structure

```
src/
├── bot/
│   ├── handlers/       # Command and event handlers
│   ├── keyboards/      # Reply and inline keyboards
│   ├── middleware/     # Session, user, and error middleware
│   └── bot.ts          # Bot setup and routing
├── config/             # Environment configuration
├── database/
│   ├── migrations/     # SQL migrations
│   ├── repositories/   # Data access layer
│   ├── migrate.ts      # Migration runner
│   └── index.ts        # PostgreSQL pool
├── i18n/               # Translations (en, ru, uz)
├── logger/             # Pino logger
├── types/              # Shared TypeScript types
└── index.ts            # Application entry point
```

## Prerequisites

- Node.js 20+
- PostgreSQL 16+ (or use Docker Compose)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

## Quick Start (Local)

1. **Clone and install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your `BOT_TOKEN` and `DATABASE_URL`.

3. **Start PostgreSQL** (if not using Docker)

   Ensure PostgreSQL is running and the database exists.

4. **Run migrations and start the bot**

   ```bash
   npm run dev
   ```

   For production:

   ```bash
   npm run build
   npm start
   ```

## Docker

Run the entire stack (bot + PostgreSQL) with Docker Compose:

```bash
cp .env.example .env
# Set BOT_TOKEN in .env
docker compose up -d --build
```

View logs:

```bash
docker compose logs -f bot
```

Stop:

```bash
docker compose down
```

## Environment Variables

| Variable           | Required | Description                          |
|--------------------|----------|--------------------------------------|
| `BOT_TOKEN`        | Yes      | Telegram bot token from BotFather    |
| `DATABASE_URL`     | Yes      | PostgreSQL connection string         |
| `NODE_ENV`         | No       | `development` or `production`        |
| `LOG_LEVEL`        | No       | Pino log level (default: `info`)     |
| `MANAGER_USERNAME` | No       | Telegram username for manager contact|

## User Flow

1. User sends `/start`
2. Bot asks to select language (🇬🇧 English / 🇷🇺 Русский / 🇺🇿 O'zbekcha)
3. Bot requests phone number via contact share button
4. Bot displays main menu:
   - 🎓 Universities
   - 📋 My Applications
   - 📄 Documents
   - 💬 Contact Manager
   - ⚙️ Profile

## Scripts

| Script          | Description                    |
|-----------------|--------------------------------|
| `npm run dev`   | Start in development mode      |
| `npm run build` | Compile TypeScript             |
| `npm start`     | Run compiled production build  |
| `npm run migrate` | Run database migrations      |
| `npm run lint`  | Type-check without emitting    |

## License

MIT
