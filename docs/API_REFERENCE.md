# QMS REST API Reference

QMS provides a standardized REST API surface for all inventory modules. All endpoints share the same `ApiResponse<T>` envelope, authentication checks, Zod validation, and error contract. The **list payload inside `data` currently has three variants** — see [List response shapes](#list-response-shapes--three-variants-in-current-code) before writing a client.

## Overview

### Base URL

```text
https://qms.414080.xyz/api
```

Locally: `http://localhost:3000/api`

### Modules Available

| Module     | Identifier | Description                                          |
| ---------- | ---------- | ---------------------------------------------------- |
| 被子管理   | `quilts`   | Household quilt and bedding inventory                |
| 球星卡     | `cards`    | Sports trading card collection                       |
| 乒乓球底板 | `paddles`  | Table tennis blade and rubber collection             |
| 文玩管理   | `antiques` | Jade, ceramics, woodwork, and antique collectibles   |
| 地图管理   | `maps`     | Historical, topographic, and thematic map collection |
| 藏酒管理   | `spirits`  | Fine spirits, wine, and vintage alcohol collection   |

---

## Authentication & Authorization

All API endpoints require an active session or authenticated user context.

- **Web session**: Cookies managed by Better Auth.
- **Module access**: Users must have the corresponding module enabled in their `activeModules` (or role `admin`).
- Unauthenticated requests return `401 Unauthorized`.
- Requests without module subscription return `401 / 403 Forbidden`.

---

## Response Envelope

### Top-level envelope

All API endpoints return the `ApiResponse<T>` envelope defined in `src/lib/api/response.ts`:

```ts
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; details?: Record<string, unknown> };
  meta?: { page?: number; limit?: number; total?: number; hasMore?: boolean };
}
```

- `meta` is the **standard pagination carrier** and is always top-level (never nested inside `data`).
- On failure, `data` is absent; on success, `error` is absent.

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "输入数据校验失败",
    "details": {
      "errors": {
        "name": ["Name is required"]
      }
    }
  }
}
```

Note the nesting: per-field validation messages live at **`error.details.errors`**, not at `error.fieldErrors`. The mapping is performed by `actionResultToApiResponse` in `src/lib/api/action-response.ts`, which reads the Action's `fieldErrors` and re-wraps it as `details.errors`.

Standard error codes and their HTTP status (`STATUS_BY_CODE` in `src/lib/api/action-response.ts`):

| Code | Status | Meaning |
| --- | --- | --- |
| `BAD_REQUEST` / `INVALID_INPUT` | 400 | Malformed request |
| `VALIDATION_FAILED` | 400 | Payload failed Zod validation |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Authenticated but lacks module access |
| `NOT_FOUND` | 404 | Resource does not exist |
| `ALREADY_EXISTS` | 409 | Conflict |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server-side error |

### List response shapes and pagination

All list endpoints return the standard top-level `meta` envelope (`total`, `limit`, `hasMore`, and optional `page`):

```json
{
  "success": true,
  "data": { "<module>": [...] },
  "meta": { "total": 42, "limit": 20, "hasMore": true }
}
```

For backward compatibility with existing clients:
- **`quilts`**, **`antiques`**, **`maps`**, **`spirits`**: Standard shape — items array under `data.<module>`, pagination strictly in top-level `meta`.
- **`cards`**: Also includes convenient flattened pagination in `data` (`total`, `page`, `pageSize`, `totalPages`), with canonical pagination mirrored to top-level `meta`.
- **`paddles`**: Also includes convenient `data.pagination` (`total`, `offset`, `limit`, `hasMore`), with canonical pagination in top-level `meta`.

Every API client can safely consume top-level `meta` uniformly across all 6 modules.

---

## Endpoints by Module

### 1. Table Tennis Paddles (`/api/paddles`)

#### List Paddles

- **Endpoint**: `GET /api/paddles`
- **Query Parameters**:
  - `search` (string): Keyword search on name, bladeBrand, bladeModel, rubber.
  - `status` (string): `ACTIVE` | `RETIRED` | `FOR_SALE` | `SOLD` | `DISPLAY`.
  - `bladeBrand` (string): Filter by blade brand (e.g. `Butterfly`, `Stiga`).
  - `handleType` (string): `FL` | `ST` | `CS` | `AN`.
  - `sortBy` (string): `itemNumber` | `name` | `bladeBrand` | `bladeWeightG` | `createdAt` | `updatedAt`.
  - `sortOrder` (string): `asc` | `desc` (default: `asc`).
  - `limit` (number): Page size, 1-100 (default: 20).
  - `offset` (number): Offset for pagination (default: 0).

#### Create Paddle

- **Endpoint**: `POST /api/paddles`
- **Request Body**:
  ```json
  {
    "name": "Viscaria FL",
    "bladeBrand": "Butterfly",
    "bladeModel": "VISCARIA",
    "bladeWeightG": 86,
    "handleType": "FL",
    "forehandRubber": "Hurricane 3 Neo",
    "backhandRubber": "Donic Baracuda",
    "rubberThicknessMm": 2.1,
    "bladeSpeed": 9,
    "bladeControl": 8,
    "status": "ACTIVE",
    "purchasePrice": 1200,
    "currentValue": 1100
  }
  ```

#### Get Paddle by ID

- **Endpoint**: `GET /api/paddles/:id`

#### Update Paddle

- **Endpoint**: `PATCH /api/paddles/:id`
- **Request Body**: Partial update object. Set clearable fields to `null` to remove them.

#### Delete Paddle

- **Endpoint**: `DELETE /api/paddles/:id`

---

### 2. Antiques (`/api/antiques`)

#### List Antiques

- **Endpoint**: `GET /api/antiques`
- **Query Parameters**:
  - `search` (string): Search across name, material, notes.
  - `category` (string): `JADE` | `WOOD` | `CERAMIC` | `METAL` | `STONE` | `PAPER` | `OTHER`.
  - `status` (string): `COLLECTION` | `FOR_SALE` | `SOLD` | `DISPLAY` | `APPRAISAL`.
  - `era` (string): Era (e.g. `清代`, `民国`).
  - `dynasty` (string): Dynasty (e.g. `清朝`, `明朝`).
  - `minValue` / `maxValue` (number): Valuation range filter.
  - `sortBy` (string): `itemNumber` | `name` | `category` | `currentValue` | `createdAt` | `updatedAt`.
  - `sortOrder` (string): `asc` | `desc`.
  - `limit` / `offset` (number): Pagination.

#### Create Antique

- **Endpoint**: `POST /api/antiques`
- **Request Body**:
  ```json
  {
    "name": "清代和田白玉佩",
    "category": "JADE",
    "material": "和田白玉",
    "era": "清代",
    "dynasty": "清朝",
    "weightG": 68.5,
    "condition": "包浆温润，无磕碰",
    "status": "COLLECTION",
    "purchasePrice": 35000,
    "currentValue": 48000
  }
  ```

#### Get / Update / Delete Antique

- `GET /api/antiques/:id`
- `PATCH /api/antiques/:id`
- `DELETE /api/antiques/:id`

---

### 3. Maps (`/api/maps`)

#### List Maps

- **Endpoint**: `GET /api/maps`
- **Query Parameters**:
  - `search` (string): Search name, region, publisher.
  - `mapType` (string): `TOPOGRAPHIC` | `ROAD` | `CITY` | `HISTORICAL` | `THEMATIC` | `NAUTICAL` | `AERONAUTICAL` | `OTHER`.
  - `status` (string): `COLLECTION` | `FOR_SALE` | `SOLD` | `DISPLAY` | `FRAMED`.
  - `material` (string): `PAPER` | `CLOTH` | `DIGITAL` | `OTHER`.
  - `region` / `country` (string): Geographic location.
  - `sortBy`: `itemNumber` | `name` | `mapType` | `publishedYear` | `createdAt` | `updatedAt`.
  - `sortOrder`: `asc` | `desc`.
  - `limit` / `offset` (number): Pagination.

#### Create Map

- **Endpoint**: `POST /api/maps`
- **Request Body**:
  ```json
  {
    "name": "1985年北京城市详细规划图",
    "mapType": "CITY",
    "publishedYear": 1985,
    "publisher": "中国地图出版社",
    "material": "PAPER",
    "widthCm": 78,
    "heightCm": 105,
    "isOriginal": true,
    "status": "COLLECTION"
  }
  ```

#### Get / Update / Delete Map

- `GET /api/maps/:id`
- `PATCH /api/maps/:id`
- `DELETE /api/maps/:id`

---

### 4. Spirits (`/api/spirits`)

#### List Spirits

- **Endpoint**: `GET /api/spirits`
- **Query Parameters**:
  - `search` (string): Search name, brand, distillery, tasting notes.
  - `spiritType` (string): `WHISKY` | `COGNAC` | `BRANDY` | `RUM` | `VODKA` | `GIN` | `TEQUILA` | `BAIJIU` | `WINE` | `OTHER`.
  - `status` (string): `COLLECTION` | `AGING` | `FOR_SALE` | `SOLD` | `OPENED` | `EMPTY`.
  - `bottleStatus` (string): `SEALED` | `OPENED` | `EMPTY`.
  - `brand` / `country` / `region` (string): Brand or origin.
  - `limitedEdition` (boolean): Filter limited edition bottles.
  - `sortBy`: `itemNumber` | `name` | `spiritType` | `vintage` | `age` | `createdAt` | `updatedAt`.
  - `sortOrder`: `asc` | `desc`.
  - `limit` / `offset` (number): Pagination.

#### Create Spirit

- **Endpoint**: `POST /api/spirits`
- **Request Body**:
  ```json
  {
    "name": "Macallan 18 Years Sherry Oak",
    "spiritType": "WHISKY",
    "brand": "The Macallan",
    "distillery": "The Macallan Distillery",
    "country": "Scotland",
    "region": "Speyside",
    "vintage": 2004,
    "age": 18,
    "abv": 43,
    "volumeMl": 700,
    "caskType": "Sherry Oak",
    "status": "COLLECTION",
    "bottleStatus": "SEALED",
    "purchasePrice": 2800,
    "currentValue": 3600
  }
  ```

#### Get / Update / Delete Spirit

- `GET /api/spirits/:id`
- `PATCH /api/spirits/:id`
- `DELETE /api/spirits/:id`

---

### 5. Quilts (`/api/quilts`)

#### List Quilts

- **Endpoint**: `GET /api/quilts`
- **Query Parameters**:
  - `search` (string): Keyword search across quilt name and notes.
  - `season` (string): `WINTER` | `SPRING_AUTUMN` | `SUMMER`.
  - `status` (string): `IN_USE` | `MAINTENANCE` | `STORAGE` | `LOST`. `LOST` records a quilt
    that has gone missing; like `MAINTENANCE` and `STORAGE` it carries no active usage record.
  - `location` (string): Physical storage location.
  - `brand` (string): Brand or manufacturer.
  - `sortBy` (string): `itemNumber` | `name` | `season` | `weightGrams` | `createdAt` | `updatedAt`.
  - `sortOrder` (string): `asc` | `desc` (default: `asc`).
  - `limit` (number): Page size, 1-100 (default: 20).
  - `offset` (number): Pagination offset (default: 0).

#### Create Quilt

- **Endpoint**: `POST /api/quilts`
- **Request Body**:
  ```json
  {
    "name": "冬季加厚蚕丝被",
    "season": "WINTER",
    "lengthCm": 220,
    "widthCm": 200,
    "weightGrams": 3000,
    "fillMaterial": "100% 桑蚕丝",
    "color": "米白",
    "location": "主卧衣柜上层",
    "brand": "罗莱家纺",
    "currentStatus": "STORAGE"
  }
  ```

#### Get Quilt by ID

- **Endpoint**: `GET /api/quilts/:id`

#### Update Quilt

- **Endpoint**: `PATCH /api/quilts/:id` (also accepts `PUT`)
- **Request Body**: Partial or full update object.

#### Delete Quilt

- **Endpoint**: `DELETE /api/quilts/:id`

---

### 6. Sports Cards (`/api/cards`)

#### List Cards

- **Endpoint**: `GET /api/cards`
- **Query Parameters**:
  - `search` (string): Search player name, team, brand, notes.
  - `sport` (string): `BASKETBALL` | `SOCCER` | `OTHER`.
  - `status` (string): `COLLECTION` | `FOR_SALE` | `SOLD` | `GRADING` | `DISPLAY`.
  - `gradingCompany` (string): `UNGRADED` | `PSA` | `BGS` | `SGC` | `CGC`.
  - `includeSold` (boolean): Whether to include sold cards in results.
  - `page` (number): Page number (1-indexed).
  - `pageSize` (number): Items per page (default: 20).

#### Create Card

- **Endpoint**: `POST /api/cards`
- **Request Body**:
  ```json
  {
    "playerName": "Luka Dončić",
    "sport": "BASKETBALL",
    "team": "Dallas Mavericks",
    "year": 2018,
    "brand": "Panini Prizm",
    "cardNumber": "280",
    "gradingCompany": "PSA",
    "grade": 10,
    "status": "COLLECTION",
    "purchasePrice": 2500,
    "currentValue": 3200
  }
  ```

#### Get Card by ID

- **Endpoint**: `GET /api/cards/:id`

#### Update Card

- **Endpoint**: `PATCH /api/cards/:id`
- **Request Body**: Partial update object with fields to change.

#### Delete Card

- **Endpoint**: `DELETE /api/cards/:id`

---

## AI Agent API

If you are building or integrating an AI agent (such as OpenClaw), do **not** call the REST endpoints directly. Use the dedicated **Agent API**:

- **Endpoint**: `POST /api/agent/tools`
- **OpenAPI Document**: `GET /api/agent/openapi.json`
- **Documentation**: `/AGENT_API.md`
- **Authentication**: Bearer token created under **Settings -> Agent API Keys**.
- Supports idempotency keys, dry runs, and audit logging.

Each tool requires one scope, derived from the API key owner's active modules rather than configured per key. Every registered module grants `read:<module>` and `write:<module>`; `quilts` additionally grants `read:usage` / `write:usage`; `read:settings` is granted to every valid key; administrators receive `*`. Registering a new module therefore adds its scope pair automatically — no API change is required. A tool whose scope the key does not hold returns `403` with `Missing agent scope: <scope>`.

The tool list is defined once in `src/lib/agent/tool-names.ts`; the dispatcher's Zod enum and the published OpenAPI `tool` enum both read it, and a test asserts the two sets are identical.
