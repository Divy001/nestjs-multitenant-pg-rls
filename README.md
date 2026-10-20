# NestJS Multi-Tenant Architecture with PostgreSQL Row-Level Security (RLS) & AsyncLocalStorage

A production-grade reference architecture for multi-tenant SaaS applications, combining Node.js AsyncLocalStorage for ambient context propagation with PostgreSQL Row-Level Security (RLS) as a database-level defense-in-depth safety net.

Resolves high-concurrency tenant data isolation challenges without the 5x latency and memory allocation penalty of NestJS Scope.REQUEST.

---

## System Architecture

```
Incoming Request (HTTP Header: X-Tenant-Id)
                 │
                 ▼
┌──────────────────────────────────────────────┐
│  1. TenantContextMiddleware                  │
│     - Extracts tenantId from request header  │
│     - Wraps execution in AsyncLocalStorage   │ ──► Missing Header? ──► HTTP 400 Bad Request
└──────────────────────┬───────────────────────┘
                       │
                       │ Context Propagated (Zero Instantiation Overhead)
                       ▼
┌──────────────────────────────────────────────┐
│  2. Singleton Service (PatientsService)      │
│     - Standard NestJS Singleton Scope        │
│     - Executes tx.findMany() WITHOUT WHERE!  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼ Intercepted Transaction
┌──────────────────────────────────────────────┐
│  3. PrismaRlsService                         │
│     - Begins local interactive transaction   │
│     - Runs: SELECT set_config(..., true)     │ ──► Scoped to active transaction only
└──────────────────────┬───────────────────────┘
                       │
                       │ Transaction Connection
                       ▼
┌──────────────────────────────────────────────┐
│  4. PostgreSQL Engine (Row-Level Security)   │
│     - Policy: tenant_id = current_setting()  │
│     - Automatically filters all table rows   │ ──► Zero Cross-Tenant Data Leaks!
└──────────────────────────────────────────────┘
```

---

## The Architectural Problem It Solves

Multi-tenant architectures in NestJS traditionally suffer from one of two failure modes:

| Approach | Architecture Trap | Production Consequence |
|---|---|---|
| **Default Singleton Scope** | Storing tenant state on service instance variables | **Cross-Tenant Data Leak:** High-concurrency requests overwrite shared memory state. |
| **Official Scope.REQUEST** | NestJS re-instantiates the entire DI tree on every request | **5x Latency Penalty:** Garbage Collection thrashing, CPU spikes, p99 latency skyrockets to 150ms+. |
| **Application-Only WHERE** | Relying on developers to remember WHERE tenant_id = ? | **Human Error:** A single missing WHERE clause in a raw query leaks private patient data. |
| **Combined (This Repo)** | **AsyncLocalStorage + PostgreSQL Row-Level Security** | **Zero Latency Penalty + Zero Data Leak:** Engine-level enforcement with sub-millisecond overhead. |

---

## Key Implementation Details

### 1. Zero-Penalty Context via AsyncLocalStorage
Instead of recreating services per request, services remain high-performance Singletons. The TenantContextMiddleware anchors the tenant identity to Node.js native V8 async execution hooks.

### 2. PgBouncer-Safe Session Variables
Using naive `SET app.current_tenant = ...` can poison shared connection pools (like PgBouncer in transaction mode). 
This repo uses PostgreSQL's native set_config function with the is_local = true flag:
```sql
SELECT set_config('app.current_tenant', $tenantId, true);
```
When is_local is set to true, the parameter is strictly bound to the active transaction. Upon COMMIT or ROLLBACK, PostgreSQL automatically reverts the variable, returning a 100% clean connection to the pool.

### 3. FORCED RLS for Table Owners
PostgreSQL bypasses Row-Level Security by default for table owners and superusers. This repo executes:
```sql
ALTER TABLE "patient_records" FORCE ROW LEVEL SECURITY;
```
This guarantees that even if the application connects using the database owner credentials, PostgreSQL strictly enforces tenant isolation boundaries.

---

## Quickstart

### 1. Clone & Configure
```bash
git clone https://github.com/Divy001/nestjs-multitenant-pg-rls.git
cd nestjs-multitenant-pg-rls
cp .env.example .env
```

### 2. Start PostgreSQL
```bash
docker-compose up -d
```

### 3. Install Dependencies & Push Schema
```bash
npm install
npx prisma db push
```

### 4. Apply RLS Security Policies & Seed Test Data
```bash
npm run rls:apply
npm run prisma:seed
```

### 5. Start Server
```bash
npm run start:dev
```
Server runs on http://localhost:3000.

---

## Proof of Zero Leak (Verification with cURL)

The seed script creates two distinct hospital tenants:
- Tenant 1 (Apollo Hospitals): Patients: Rahul Sharma, Priya Patel
- Tenant 2 (Max Healthcare): Patient: Amit Verma

### Test 1: Fetch as Apollo Hospitals
```bash
curl -i http://localhost:3000/api/v1/patients \
  -H "X-Tenant-Id: <apollo-tenant-id>"
```
Output: Returns strictly Apollo records. Amit Verma (Max Healthcare) is completely invisible.

### Test 2: Fetch as Max Healthcare
```bash
curl -i http://localhost:3000/api/v1/patients \
  -H "X-Tenant-Id: <max-tenant-id>"
```
Output: Returns strictly Amit Verma. Apollo records are completely invisible.

### Test 3: Request without Tenant Context
```bash
curl -i http://localhost:3000/api/v1/patients
```
Output: HTTP 400 Bad Request (Missing required header: X-Tenant-Id).

---

## Security & Reliability Checklist

- [x] Node.js AsyncLocalStorage ambient context propagation
- [x] Singleton service dependency injection (Zero GC pressure)
- [x] PostgreSQL Row-Level Security (ENABLE ROW LEVEL SECURITY)
- [x] Forced enforcement for table owners (FORCE ROW LEVEL SECURITY)
- [x] PgBouncer transaction-safe session binding (set_config(..., true))
- [x] Comprehensive cURL verification suite
