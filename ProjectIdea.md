# 🧱 LegacyBridge – MVP Architecture

## 🎯 Goal
Expose CRUD REST APIs from a legacy SQL database (e.g., MySQL, PostgreSQL, SQLite) with auto-generated documentation, authentication, and a basic admin dashboard.

---

## 📐 High-Level Architecture Diagram

                     ┌─────────────────────┐
                     │   Admin Dashboard   │
                     │ (React or Vue.js)   │
                     └────────┬────────────┘
                              │
                      REST API (Backend)
                              │
     ┌────────────────────────┴────────────────────────┐
     │                                                 │
┌────▼────┐   ┌────────────────────────────┐   ┌────────▼────────┐
│ Auth &  │   │ CRUD API Generator Layer   │   │ API Doc Engine  │
│ JWT     │   │ (Schema reader + router)   │   │  (Swagger/Open) │
└─────────┘   └────────────────────────────┘   └─────────────────┘
        │            │                        │
        │            ▼                        ▼
        │     ┌────────────┐           ┌────────────┐
        │     │  DB Mapper │           │ Usage Logs │
        │     └────┬───────┘           └────┬───────┘
        │          │                        │
        ▼          ▼                        ▼
 ┌────────────┐ ┌──────────────┐    ┌───────────────┐
 │ Legacy SQL │ │ Normalized DB│    │ Analytics DB  │
 │  Database  │ │  Output JSON │    │ (Lite version)│
 └────────────┘ └──────────────┘    └───────────────┘


---

## 🧰 What It Provides to Users

### 1. Auto-Generated REST APIs
- CRUD endpoints from legacy DB tables.
- Example: `GET /customers`, `POST /orders`.

### 2. Microservice Generator (future)
- Modular APIs per table, deployable independently.

### 3. Data Normalization
- Converts old formats to clean, camelCase JSON.

### 4. Developer Portal
- Swagger / OpenAPI docs for all endpoints.
- Token management for devs.

### 5. Analytics Dashboard
- Track usage: request volume, errors, response time.

### 6. Phased Migration Panel (future)
- Mark services as legacy, migrating, or modernized.

### 7. Low-Code Configurator
- Non-technical UI to toggle endpoints, map fields, rename columns.

---

## 👨‍💻 MVP You Can Build Solo

### Phase 1: MVP (2–3 months)
- ✅ Connect to SQL/SQLite/MySQL
- ✅ Read schema + auto-generate CRUD API
- ✅ Normalize column names
- ✅ Swagger documentation
- ✅ Basic dashboard
- ✅ Token-based auth (JWT)

### Phase 2: Enhancements
- 🔄 Data transformation rules
- 📈 Advanced analytics (charting)
- 🧱 Container-based microservices
- ➕ Support more legacy DBs (e.g., Oracle)

---

## 🧪 Example Workflow

1. Admin logs into dashboard
2. Inputs legacy DB connection
3. App reads schema & displays tables
4. Admin selects tables to expose
5. REST APIs are auto-generated
6. Swagger docs are created
7. Devs consume endpoints securely

---

## 🛠 Tech Stack

| Layer        | Technology                              |
|--------------|------------------------------------------|
| Frontend     | React or Vue + Tailwind CSS             |
| Backend      | Node.js + Express (or Laravel)          |
| Auth         | JWT                                     |
| DB Access    | Knex.js / Sequelize / Laravel Eloquent  |
| API Docs     | Swagger UI + OpenAPI                    |
| Logs         | MySQL / SQLite                          |
| Deployment   | Docker / Railway / Vercel               |

---

## ✅ MVP Feature Checklist

| Feature                                | Status |
|----------------------------------------|--------|
| Connect to legacy DB                   | ✅     |
| Read table schema                      | ✅     |
| Generate CRUD API                      | ✅     |
| Normalize field names                  | ✅     |
| JWT Authentication                     | ✅     |
| Swagger API docs                       | ✅     |
| Admin dashboard                        | ✅     |
| Endpoint activation toggle             | ✅     |
| Request logging                        | ✅     |
| Analytics UI (charts)                  | ✅     |

---

Let me know if you want help building the file structure, backend schema, or frontend wireframes!
