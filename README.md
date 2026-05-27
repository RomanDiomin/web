# Task Manager API

task manager backend using Express.js and MySQL.

## Features

- JWT authentication (`/auth/register`, `/auth/login`)
- User-based tasks isolation (each user sees only own tasks)
- CRUD for tasks
- Filtering, search and pagination for tasks
- Swagger docs at `/api-docs`
- Browser demo UI at `/`
- Optional email notifications for overdue deadlines (SMTP)
- Basic automated tests (`npm test`)

## Run

1. Configure `.env` (example in `.env.example`)
2. `npm install`
3. Start MySQL service (local install)
4. `npm run dev`
5. Open `http://127.0.0.1:3000`

## Main endpoints

- `POST /auth/register` - create user and receive JWT token
- `POST /auth/login` - login and receive JWT token
- `GET /tasks` - list own tasks (`status`, `search`, `page`, `limit`)
- `POST /tasks` - create task
- `PUT /tasks/:id` - update own task
- `DELETE /tasks/:id` - delete own task
- `GET /health` - db health check

Use `Authorization: Bearer <token>` for all `/tasks` endpoints.

## Email notifications (optional)

Enable in `.env`:

- `EMAIL_NOTIFICATIONS_ENABLED=true`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- Optional: `SMTP_FROM`, `EMAIL_CHECK_INTERVAL_MS`

When enabled, the server checks tasks every minute and sends a one-time email
if:

- task has `due_at`
- `due_at <= now`
- task is not `done`
- notification for that deadline has not been sent yet
