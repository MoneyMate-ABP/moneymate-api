const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MoneyMate API",
      version: "1.0.0",
      description:
        "REST API untuk aplikasi expense tracker MoneyMate (Express.js + JWT).",
    },
    servers: [
      {
        url: "https://anandabintang.web.id",
        description: "Production server",
      },
      {
        url: "http://localhost:3000",
        description: "Local development",
      },
    ],
    tags: [
      { name: "Health", description: "Service health check" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Categories", description: "Category endpoints" },
      { name: "Transactions", description: "Transaction endpoints" },
      { name: "Budget Periods", description: "Budget period endpoints" },
      { name: "Dashboard", description: "Dashboard summary endpoint" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Invalid or expired token." },
          },
          required: ["message"],
        },
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Bintang" },
            email: {
              type: "string",
              format: "email",
              example: "bintang@mail.com",
            },
          },
          required: ["id", "name", "email"],
        },
        AuthSuccessResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Login successful." },
            data: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
                user: { $ref: "#/components/schemas/User" },
              },
              required: ["token", "user"],
            },
          },
          required: ["message", "data"],
        },
        RegisterRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Bintang" },
            email: {
              type: "string",
              format: "email",
              example: "bintang@mail.com",
            },
            password: { type: "string", minLength: 6, example: "password123" },
          },
          required: ["name", "email", "password"],
        },
        LoginRequest: {
          type: "object",
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "bintang@mail.com",
            },
            password: { type: "string", example: "password123" },
          },
          required: ["email", "password"],
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Makanan" },
            type: {
              type: "string",
              enum: ["income", "expense", "both"],
              example: "expense",
            },
          },
          required: ["id", "name", "type"],
        },
        CategoryListResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Category" },
            },
          },
          required: ["data"],
        },
        Transaction: {
          type: "object",
          properties: {
            id: { type: "integer", example: 10 },
            user_id: { type: "integer", example: 1 },
            category_id: { type: "integer", example: 1 },
            budget_period_id: { type: "integer", nullable: true, example: 2 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "expense",
            },
            amount: { type: "number", format: "float", example: 50000 },
            note: { type: "string", nullable: true, example: "Makan siang" },
            date: { type: "string", format: "date", example: "2026-04-02" },
            latitude: {
              type: "number",
              format: "float",
              nullable: true,
              example: -6.2,
            },
            longitude: {
              type: "number",
              format: "float",
              nullable: true,
              example: 106.816666,
            },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-02T10:00:00.000Z",
            },
            category_name: {
              type: "string",
              nullable: true,
              example: "Makanan",
            },
            budget_period_name: {
              type: "string",
              nullable: true,
              example: "Budget April",
            },
          },
        },
        CreateTransactionRequest: {
          type: "object",
          properties: {
            category_id: { type: "integer", example: 1 },
            budget_period_id: { type: "integer", nullable: true, example: 2 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "expense",
            },
            amount: { type: "number", format: "float", example: 50000 },
            note: { type: "string", nullable: true, example: "Makan siang" },
            date: { type: "string", format: "date", example: "2026-04-02" },
            latitude: { type: "number", nullable: true, example: -6.2 },
            longitude: { type: "number", nullable: true, example: 106.816666 },
          },
          required: ["category_id", "type", "amount", "date"],
        },
        UpdateTransactionRequest: {
          type: "object",
          properties: {
            category_id: { type: "integer", example: 1 },
            budget_period_id: { type: "integer", nullable: true, example: 2 },
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "expense",
            },
            amount: { type: "number", format: "float", example: 60000 },
            note: { type: "string", nullable: true, example: "Makan malam" },
            date: { type: "string", format: "date", example: "2026-04-02" },
            latitude: { type: "number", nullable: true, example: -6.21 },
            longitude: { type: "number", nullable: true, example: 106.82 },
          },
        },
        TransactionListResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Transaction" },
            },
          },
          required: ["data"],
        },
        TransactionMutationResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Transaction created." },
            data: { $ref: "#/components/schemas/Transaction" },
          },
          required: ["message"],
        },
        BudgetPeriod: {
          type: "object",
          properties: {
            id: { type: "integer", example: 2 },
            user_id: { type: "integer", example: 1 },
            category_id: { type: "integer", nullable: true, example: null },
            name: { type: "string", example: "Budget April" },
            total_budget: { type: "number", format: "float", example: 1500000 },
            start_date: {
              type: "string",
              format: "date",
              example: "2026-04-01",
            },
            end_date: { type: "string", format: "date", example: "2026-04-30" },
            daily_budget_base: {
              type: "number",
              format: "float",
              example: 68181.82,
            },
            working_days_count: { type: "integer", example: 22 },
            created_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-01T00:00:00.000Z",
            },
            category_name: {
              type: "string",
              nullable: true,
              example: "Makanan",
            },
            category_type: {
              type: "string",
              nullable: true,
              example: "expense",
            },
          },
        },
        CreateBudgetPeriodRequest: {
          type: "object",
          properties: {
            category_id: {
              type: "integer",
              nullable: true,
              example: null,
              description: "Null berarti global budget",
            },
            name: { type: "string", example: "Budget April" },
            total_budget: { type: "number", format: "float", example: 1500000 },
            start_date: {
              type: "string",
              format: "date",
              example: "2026-04-01",
            },
            end_date: { type: "string", format: "date", example: "2026-04-30" },
          },
          required: ["name", "total_budget", "start_date", "end_date"],
        },
        UpdateBudgetPeriodRequest: {
          type: "object",
          properties: {
            category_id: { type: "integer", nullable: true, example: 1 },
            name: { type: "string", example: "Budget April Revised" },
            total_budget: { type: "number", format: "float", example: 1600000 },
            start_date: {
              type: "string",
              format: "date",
              example: "2026-04-01",
            },
            end_date: { type: "string", format: "date", example: "2026-04-30" },
          },
        },
        BudgetPeriodListResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/BudgetPeriod" },
            },
          },
          required: ["data"],
        },
        BudgetPeriodMutationResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Budget period created." },
            data: { $ref: "#/components/schemas/BudgetPeriod" },
          },
          required: ["message"],
        },
        DailyStatus: {
          type: "object",
          properties: {
            date: { type: "string", format: "date", example: "2026-04-02" },
            base: { type: "number", format: "float", example: 68181.82 },
            carry_over: { type: "number", format: "float", example: 5000 },
            effective_budget: {
              type: "number",
              format: "float",
              example: 73181.82,
            },
            total_spent: { type: "number", format: "float", example: 50000 },
            remaining: { type: "number", format: "float", example: 23181.82 },
            is_weekend: { type: "boolean", example: false },
          },
          required: [
            "date",
            "base",
            "carry_over",
            "effective_budget",
            "total_spent",
            "remaining",
            "is_weekend",
          ],
        },
        DailyStatusResponse: {
          type: "object",
          properties: {
            data: { $ref: "#/components/schemas/DailyStatus" },
          },
          required: ["data"],
        },
        DashboardResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                totals: {
                  type: "object",
                  properties: {
                    balance: { type: "number", example: 2500000 },
                    income: { type: "number", example: 5000000 },
                    expense: { type: "number", example: 2500000 },
                  },
                },
                budgets: {
                  type: "object",
                  properties: {
                    active_count: { type: "integer", example: 2 },
                    effective_today: { type: "number", example: 150000 },
                    spent_today: { type: "number", example: 70000 },
                    remaining_today: { type: "number", example: 80000 },
                    status: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          budget_period_id: { type: "integer", example: 2 },
                          name: { type: "string", example: "Budget April" },
                          category_id: {
                            type: "integer",
                            nullable: true,
                            example: null,
                          },
                          category_name: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          category_type: {
                            type: "string",
                            nullable: true,
                            example: null,
                          },
                          start_date: {
                            type: "string",
                            format: "date",
                            example: "2026-04-01",
                          },
                          end_date: {
                            type: "string",
                            format: "date",
                            example: "2026-04-30",
                          },
                          daily_status: {
                            $ref: "#/components/schemas/DailyStatus",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          required: ["data"],
        },
      },
    },
    paths: {
      "/health": {
        get: {
          tags: ["Health"],
          summary: "Health check",
          responses: {
            200: {
              description: "Service is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      status: { type: "string", example: "ok" },
                      service: { type: "string", example: "moneymate-api" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Register user baru",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Registration success",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                },
              },
            },
            409: {
              description: "Email already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login user",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login success",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                },
              },
            },
            401: {
              description: "Invalid email/password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/logout": {
        post: {
          tags: ["Auth"],
          summary: "Logout user (revoke token)",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Logout success",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Logout successful.",
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/categories": {
        get: {
          tags: ["Categories"],
          summary: "List kategori",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Category list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CategoryListResponse" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/transactions": {
        get: {
          tags: ["Transactions"],
          summary: "List transaksi",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "query",
              name: "date",
              schema: { type: "string", format: "date" },
              description: "Filter tanggal (YYYY-MM-DD)",
            },
            {
              in: "query",
              name: "type",
              schema: { type: "string", enum: ["income", "expense"] },
              description: "Filter tipe transaksi",
            },
            {
              in: "query",
              name: "category",
              schema: { type: "integer" },
              description: "Filter category id",
            },
          ],
          responses: {
            200: {
              description: "Transaction list",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TransactionListResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Transactions"],
          summary: "Tambah transaksi",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateTransactionRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Transaction created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TransactionMutationResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Category atau budget period tidak ditemukan",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/transactions/{id}": {
        put: {
          tags: ["Transactions"],
          summary: "Update transaksi",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Transaction id",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateTransactionRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Transaction updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TransactionMutationResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Transaction/category/budget period not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Transactions"],
          summary: "Hapus transaksi",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Transaction id",
            },
          ],
          responses: {
            200: {
              description: "Transaction deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Transaction deleted.",
                      },
                    },
                    required: ["message"],
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Transaction not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/budget-periods": {
        get: {
          tags: ["Budget Periods"],
          summary: "List budget periods",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Budget period list",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/BudgetPeriodListResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Budget Periods"],
          summary: "Buat budget period",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateBudgetPeriodRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Budget period created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/BudgetPeriodMutationResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/budget-periods/{id}": {
        put: {
          tags: ["Budget Periods"],
          summary: "Update budget period",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Budget period id",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateBudgetPeriodRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Budget period updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/BudgetPeriodMutationResponse",
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Budget period/category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Budget Periods"],
          summary: "Hapus budget period",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Budget period id",
            },
          ],
          responses: {
            200: {
              description: "Budget period deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Budget period deleted.",
                      },
                    },
                    required: ["message"],
                  },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Budget period not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/budget-periods/{id}/daily-status": {
        get: {
          tags: ["Budget Periods"],
          summary: "Get daily status untuk budget period",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Budget period id",
            },
            {
              in: "query",
              name: "date",
              required: false,
              schema: { type: "string", format: "date" },
              description:
                "Tanggal target (YYYY-MM-DD). Jika kosong pakai hari ini.",
            },
          ],
          responses: {
            200: {
              description: "Daily status response",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DailyStatusResponse" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Budget period not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/dashboard": {
        get: {
          tags: ["Dashboard"],
          summary: "Global dashboard summary",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Dashboard summary",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/DashboardResponse" },
                },
              },
            },
            401: {
              description: "Unauthorized",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
