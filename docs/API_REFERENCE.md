# QMS REST API Reference

QMS provides a standardized REST API surface for all inventory modules. All endpoints adhere to uniform response envelopes, authentication checks, Zod validation, and error contracts.

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

All API endpoints return a uniform `ApiResponse<T>` JSON envelope:

### Success Response

```json
{
  "success": true,
  "data": { ... },
  "pagination": {
    "total": 42,
    "offset": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "输入数据校验失败",
    "fieldErrors": {
      "name": ["Name is required"]
    }
  }
}
```

Standard error codes:

- `VALIDATION_FAILED` (400) — Input payload failed Zod validation.
- `UNAUTHORIZED` (401) — Missing or invalid authentication.
- `NOT_FOUND` (404) — Requested resource does not exist.
- `INTERNAL_ERROR` (500) — Server-side error.

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

## AI Agent API

If you are building or integrating an AI agent (such as OpenClaw), do **not** call the REST endpoints directly. Use the dedicated **Agent API**:

- **Endpoint**: `POST /api/agent/tools`
- **OpenAPI Document**: `GET /api/agent/openapi.json`
- **Documentation**: `/AGENT_API.md`
- **Authentication**: Bearer token created under **Settings -> Agent API Keys**.
- Supports idempotency keys, dry runs, and audit logging.
