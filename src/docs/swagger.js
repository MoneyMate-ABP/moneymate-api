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
      { name: "Notifications", description: "Push notification endpoints" },
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
        GoogleLoginRequest: {
          type: "object",
          properties: {
            idToken: {
              type: "string",
              description: "Firebase ID token dari client app",
              example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...",
            },
          },
          required: ["idToken"],
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
            meta: { $ref: "#/components/schemas/PaginationMeta" },
          },
          required: ["data"],
        },
        CreateCategoryRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Belanja" },
            type: {
              type: "string",
              enum: ["income", "expense", "both"],
              example: "expense",
            },
          },
          required: ["name"],
        },
        UpdateCategoryRequest: {
          type: "object",
          properties: {
            name: { type: "string", example: "Belanja Harian" },
            type: {
              type: "string",
              enum: ["income", "expense", "both"],
              example: "expense",
            },
          },
        },
        CategoryMutationResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Category created." },
            data: { $ref: "#/components/schemas/Category" },
          },
          required: ["message"],
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
            budget_period_id: {
              type: "integer",
              nullable: true,
              example: 2,
              description:
                "Opsional. Jika tidak dikirim, backend akan gunakan default budget period user (jika ada).",
            },
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
            meta: { $ref: "#/components/schemas/PaginationMeta" },
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
        ReceiptScanData: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["income", "expense"],
              example: "expense",
            },
            amount: {
              type: "number",
              format: "float",
              nullable: true,
              example: 50000,
            },
            date: {
              type: "string",
              format: "date",
              nullable: true,
              example: "2026-04-10",
            },
            note: {
              type: "string",
              nullable: true,
              example: "Belanja bulanan supermarket",
            },
            suggested_category: {
              type: "string",
              nullable: true,
              example: "Makanan",
            },
            merchant_name: {
              type: "string",
              nullable: true,
              example: "Super Indo",
            },
            confidence: {
              type: "number",
              format: "float",
              example: 0.92,
            },
            source_file_name: {
              type: "string",
              nullable: true,
              example: "struk-supermarket.jpg",
            },
            source_mime_type: {
              type: "string",
              nullable: true,
              example: "image/jpeg",
            },
          },
          required: ["type", "confidence"],
        },
        ReceiptScanResponse: {
          type: "object",
          properties: {
            message: { type: "string", example: "Receipt analyzed." },
            data: { $ref: "#/components/schemas/ReceiptScanData" },
          },
          required: ["message", "data"],
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
            excluded_weekdays: {
              type: "array",
              items: {
                type: "integer",
                minimum: 0,
                maximum: 6,
              },
              example: [0, 6],
              description:
                "Hari yang dikecualikan dari perhitungan budget harian",
            },
            is_default: { type: "boolean", example: true },
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
            excluded_weekdays: {
              type: "array",
              items: {
                type: "integer",
                minimum: 0,
                maximum: 6,
              },
              example: [0, 6],
              description:
                "Hari yang dikecualikan dari budget harian. 0 = Minggu, 6 = Sabtu",
            },
            is_default: {
              type: "boolean",
              example: true,
              description:
                "Set true untuk menjadikan period ini sebagai default",
            },
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
            excluded_weekdays: {
              type: "array",
              items: {
                type: "integer",
                minimum: 0,
                maximum: 6,
              },
              example: [0, 6],
            },
            is_default: { type: "boolean", example: false },
          },
        },
        BudgetPeriodListResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/BudgetPeriod" },
            },
            meta: { $ref: "#/components/schemas/PaginationMeta" },
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
            is_excluded_day: { type: "boolean", example: false },
            is_weekend: { type: "boolean", example: false },
          },
          required: [
            "date",
            "base",
            "carry_over",
            "effective_budget",
            "total_spent",
            "remaining",
            "is_excluded_day",
            "is_weekend",
          ],
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 120 },
            total_pages: { type: "integer", example: 6 },
            has_next: { type: "boolean", example: true },
            has_prev: { type: "boolean", example: false },
          },
          required: [
            "page",
            "limit",
            "total",
            "total_pages",
            "has_next",
            "has_prev",
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
        PushSubscribeRequest: {
          type: "object",
          properties: {
            subscription: {
              type: "object",
              properties: {
                endpoint: {
                  type: "string",
                  example:
                    "https://fcm.googleapis.com/fcm/send/example-endpoint",
                },
                keys: {
                  type: "object",
                  properties: {
                    p256dh: { type: "string", example: "BInExampleP256dhKey" },
                    auth: { type: "string", example: "ExampleAuthKey" },
                  },
                  required: ["p256dh", "auth"],
                },
              },
              required: ["endpoint", "keys"],
            },
          },
          required: ["subscription"],
        },
        NotificationHistoryItem: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            title: { type: "string", example: "Budget hari ini siap!" },
            body: {
              type: "string",
              example:
                "Budget efektif kamu hari ini: Rp 63.500 (surplus Rp 3.500 dari kemarin)",
            },
            budget_period_name: {
              type: "string",
              nullable: true,
              example: "Budget Maret-April",
            },
            effective_budget: {
              type: "number",
              format: "float",
              example: 63500,
            },
            carry_over: { type: "number", format: "float", example: 3500 },
            is_read: { type: "boolean", example: false },
            sent_at: {
              type: "string",
              format: "date-time",
              example: "2026-04-10T01:00:00.000Z",
            },
          },
          required: [
            "id",
            "title",
            "body",
            "effective_budget",
            "carry_over",
            "is_read",
            "sent_at",
          ],
        },
        NotificationHistoryResponse: {
          type: "object",
          properties: {
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/NotificationHistoryItem" },
            },
            unread_count: { type: "integer", example: 2 },
          },
          required: ["data", "unread_count"],
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
          summary: "Register user baru (local auth)",
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
          summary: "Login user (local auth)",
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
              description:
                "Invalid email/password atau akun hanya bisa login via Google",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/auth/google": {
        post: {
          tags: ["Auth"],
          summary: "Login/Register dengan Google (Firebase ID token)",
          description:
            "Verifikasi Firebase ID token, ambil uid/email/name, auto-register jika user belum ada, lalu keluarkan JWT internal.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/GoogleLoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Google login success",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                },
              },
            },
            201: {
              description: "User auto-registered via Google",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/AuthSuccessResponse" },
                },
              },
            },
            401: {
              description: "Invalid Firebase ID token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            400: {
              description: "Firebase token tidak mengandung email",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "Email sudah terhubung ke Google account lain",
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
          parameters: [
            {
              in: "query",
              name: "page",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "Page number untuk lazy load (opsional)",
            },
            {
              in: "query",
              name: "limit",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "Jumlah item per page untuk lazy load (opsional)",
            },
          ],
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
        post: {
          tags: ["Categories"],
          summary: "Tambah kategori",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateCategoryRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Category created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CategoryMutationResponse",
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
            409: {
              description: "Category name already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/categories/{id}": {
        get: {
          tags: ["Categories"],
          summary: "Detail kategori",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Category id",
            },
          ],
          responses: {
            200: {
              description: "Category detail",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Category" },
                    },
                    required: ["data"],
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
        put: {
          tags: ["Categories"],
          summary: "Update kategori",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Category id",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateCategoryRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Category updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CategoryMutationResponse",
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
            409: {
              description: "Category name already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Categories"],
          summary: "Hapus kategori",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Category id",
            },
          ],
          responses: {
            200: {
              description: "Category deleted",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: { type: "string", example: "Category deleted." },
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
            404: {
              description: "Category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "Category is used by transactions",
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
            {
              in: "query",
              name: "page",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "Page number untuk lazy load (opsional)",
            },
            {
              in: "query",
              name: "limit",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "Jumlah item per page untuk lazy load (opsional)",
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
            409: {
              description: "Duplicate transaction (too fast)",
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
        get: {
          tags: ["Transactions"],
          summary: "Detail transaksi",
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
              description: "Transaction detail",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      data: { $ref: "#/components/schemas/Transaction" },
                    },
                    required: ["data"],
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
      "/api/transactions/receipt-scan": {
        post: {
          tags: ["Transactions"],
          summary: "Scan struk dengan AI",
          description:
            "Upload file struk (JPG/PNG/WEBP/PDF), backend akan ekstrak draft transaksi dengan Gemini.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "multipart/form-data": {
                schema: {
                  type: "object",
                  properties: {
                    receipt: {
                      type: "string",
                      format: "binary",
                      description: "File struk (maks 5MB)",
                    },
                  },
                  required: ["receipt"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Receipt analyzed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ReceiptScanResponse" },
                },
              },
            },
            400: {
              description: "Invalid receipt upload",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
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
            422: {
              description: "Receipt could not be parsed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            503: {
              description: "AI service not configured",
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
          parameters: [
            {
              in: "query",
              name: "page",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "Page number untuk lazy load (opsional)",
            },
            {
              in: "query",
              name: "limit",
              required: false,
              schema: { type: "integer", minimum: 1 },
              description: "Jumlah item per page untuk lazy load (opsional)",
            },
          ],
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
            409: {
              description: "Duplicate budget period (too fast)",
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
      "/api/budget-periods/{id}/set-default": {
        post: {
          tags: ["Budget Periods"],
          summary: "Set default budget period",
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
              description: "Default budget period updated",
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
      "/api/notifications/vapid-key": {
        get: {
          tags: ["Notifications"],
          summary: "Get VAPID public key",
          responses: {
            200: {
              description: "VAPID public key",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      publicKey: {
                        type: "string",
                        example: "BOrExampleVapidPublicKey",
                      },
                    },
                    required: ["publicKey"],
                  },
                },
              },
            },
            503: {
              description: "VAPID key not configured",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/notifications/subscribe": {
        post: {
          tags: ["Notifications"],
          summary: "Save push subscription",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/PushSubscribeRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Push subscription saved",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Push subscription saved.",
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
          },
        },
      },
      "/api/notifications/unsubscribe": {
        delete: {
          tags: ["Notifications"],
          summary: "Remove push subscription",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    endpoint: {
                      type: "string",
                      example:
                        "https://fcm.googleapis.com/fcm/send/example-endpoint",
                    },
                  },
                  required: ["endpoint"],
                },
              },
            },
          },
          responses: {
            200: {
              description: "Push subscription removed",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Push subscription removed.",
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
              description: "Push subscription not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/notifications/history": {
        get: {
          tags: ["Notifications"],
          summary: "Get latest notification history",
          description:
            "Returns maximum 5 latest history records for current user.",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "Notification history",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/NotificationHistoryResponse",
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
      "/api/notifications/history/read-all": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark all notification history as read",
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: "All notifications marked as read",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "All notifications marked as read.",
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
          },
        },
      },
      "/api/notifications/history/{id}/read": {
        patch: {
          tags: ["Notifications"],
          summary: "Mark one notification history item as read",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
              description: "Notification history id",
            },
          ],
          responses: {
            200: {
              description: "Notification marked as read",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        example: "Notification marked as read.",
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
              description: "Notification history not found",
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
