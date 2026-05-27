const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Task Manager API",
    version: "2.0.0",
    description:
      "Реєстрація/вхід (JWT), CRUD завдань, фільтри та пагінація. Спочатку виклич POST /auth/register або /auth/login, потім Authorize."
  },
  servers: [
    { url: "http://127.0.0.1:3000", description: "Локально" },
    { url: "http://localhost:3000", description: "localhost" }
  ],
  tags: [
    { name: "Сервіс", description: "Перевірка стану" },
    { name: "Авторизація", description: "Реєстрація та вхід" },
    { name: "Завдання", description: "Потрібен Bearer-токен" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Встав токен з відповіді login/register (поле token)"
      }
    },
    schemas: {
      RegisterBody: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Олена" },
          email: { type: "string", format: "email", example: "user@test.com" },
          password: { type: "string", minLength: 6, example: "secret12" }
        }
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@test.com" },
          password: { type: "string", example: "secret12" }
        }
      },
      TaskCreate: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Підготувати звіт" },
          description: { type: "string", example: "До п'ятниці" },
          status: {
            type: "string",
            enum: ["new", "in_progress", "done"],
            default: "new"
          },
          repeat_type: {
            type: "string",
            enum: ["none", "daily"],
            default: "none"
          },
          reminder_time: {
            type: "string",
            example: "08:30",
            description: "Формат HH:MM, обов'язково для repeat_type=daily"
          },
          due_at: {
            type: "string",
            example: "2026-04-20T18:00",
            description: "Дедлайн у форматі YYYY-MM-DDTHH:MM"
          }
        }
      },
      TaskUpdate: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["new", "in_progress", "done"]
          },
          repeat_type: {
            type: "string",
            enum: ["none", "daily"]
          },
          reminder_time: {
            type: "string",
            example: "08:30"
          },
          due_at: {
            type: "string",
            example: "2026-04-20T18:00"
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Сервіс"],
        summary: "Перевірка API та БД",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { ok: { type: "boolean", example: true } }
                }
              }
            }
          }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Авторизація"],
        summary: "Реєстрація",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterBody" }
            }
          }
        },
        responses: {
          "201": {
            description: "Створено, у відповіді є token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { type: "object" },
                    token: { type: "string" }
                  }
                }
              }
            }
          },
          "400": { description: "Некоректні дані" },
          "409": { description: "Email вже існує" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Авторизація"],
        summary: "Вхід",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginBody" }
            }
          }
        },
        responses: {
          "200": {
            description: "OK, у відповіді є token",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { type: "object" },
                    token: { type: "string" }
                  }
                }
              }
            }
          },
          "401": { description: "Невірний логін або пароль" }
        }
      }
    },
    "/tasks": {
      get: {
        tags: ["Завдання"],
        summary: "Список своїх завдань",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["new", "in_progress", "done"] },
            description: "Фільтр за статусом (необов'язково)"
          },
          {
            name: "search",
            in: "query",
            schema: { type: "string" },
            description: "Пошук у назві та описі"
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", minimum: 1, default: 1 }
          },
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", minimum: 1, maximum: 50, default: 10 }
          }
        ],
        responses: {
          "200": {
            description: "items + pagination",
            content: {
              "application/json": {
                schema: { type: "object" }
              }
            }
          },
          "401": { description: "Потрібен токен" }
        }
      },
      post: {
        tags: ["Завдання"],
        summary: "Створити завдання",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TaskCreate" }
            }
          }
        },
        responses: {
          "201": { description: "Створено" },
          "400": { description: "Помилка валідації" },
          "401": { description: "Потрібен токен" }
        }
      }
    },
    "/tasks/{id}": {
      put: {
        tags: ["Завдання"],
        summary: "Оновити завдання",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TaskUpdate" }
            }
          }
        },
        responses: {
          "200": { description: "OK" },
          "404": { description: "Не знайдено" },
          "401": { description: "Потрібен токен" }
        }
      },
      delete: {
        tags: ["Завдання"],
        summary: "Видалити завдання",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "204": { description: "Видалено" },
          "404": { description: "Не знайдено" },
          "401": { description: "Потрібен токен" }
        }
      }
    },
    "/tasks/reminders/today": {
      get: {
        tags: ["Завдання"],
        summary: "Щоденні нагадування на сьогодні",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Список щоденних задач з ознакою is_due_now",
            content: {
              "application/json": {
                schema: { type: "array" }
              }
            }
          },
          "401": { description: "Потрібен токен" }
        }
      }
    }
  }
};

module.exports = swaggerDocument;
