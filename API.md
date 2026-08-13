# Snap API

API documentation for the routes currently registered by the Snap backend.

## Base URL

Local development:

```text
http://localhost:3000
```

Requests and responses use JSON unless otherwise noted. The Express JSON body limit is `1mb`.

## Authentication

The API uses two tokens:

- **Access token:** A JWT returned by login and refresh. It expires after 15 minutes and is sent as a Bearer token.
- **Refresh token:** An opaque token stored in the HTTP-only `refreshToken` cookie. It expires after 7 days and is rotated on refresh.

Send the access token to protected endpoints:

```http
Authorization: Bearer <accessToken>
```

Browser requests that use the refresh cookie must include credentials:

```ts
fetch(url, {
  credentials: "include",
});
```

The configured development CORS origin is:

```text
http://localhost:5173
```

## Route summary

| Method | Path                      | Authentication                          | Description                                                                    |
| ------ | ------------------------- | --------------------------------------- | ------------------------------------------------------------------------------ |
| `GET`  | `/`                       | None                                    | Check whether the API is running                                               |
| `POST` | `/api/user/signup`        | None                                    | Create a user and wallet                                                       |
| `POST` | `/api/auth/login`         | None                                    | Log in and create a session                                                    |
| `POST` | `/api/auth/refresh`       | Refresh cookie                          | Rotate the refresh token and issue an access token                             |
| `POST` | `/api/auth/logout`        | Refresh cookie, if present              | Delete the current session and clear the cookie                                |
| `GET`  | `/api/user/me`            | Bearer access token                     | Return the authenticated user, wallet, and recent transactions                 |
| `POST` | `/api/account/transfer`   | Bearer access token and idempotency key | Transfer money between wallets; currently blocked by implementation mismatches |
| `POST` | `/api/account/bankcredit` | Bearer access token                     | Development deposit route; not safe for production use                         |

## Health check

### `GET /`

Successful response: `200 OK`

```json
{
  "message": "Snap server is running"
}
```

## Create user

### `POST /api/user/signup`

Creates a user and a default wallet. The wallet starts with `USD` currency and a zero minor-unit balance.

### Request body

| Field       | Type   | Required    | Validation                                                   |
| ----------- | ------ | ----------- | ------------------------------------------------------------ |
| `firstName` | string | Yes         | Trimmed; at least one character                              |
| `lastName`  | string | Yes         | Trimmed; at least one character                              |
| `email`     | string | Conditional | Valid email; empty strings become absent                     |
| `phone`     | string | Conditional | Trimmed; at least 10 characters; empty strings become absent |
| `password`  | string | Yes         | Trimmed; no minimum-strength rule is currently enforced      |
| `snapTag`   | string | Yes         | Trimmed; must start with `@`                                 |

At least one of `email` or `phone` is required. Both may be supplied.

```json
{
  "firstName": "Lamar",
  "lastName": "Lewis",
  "email": "l***r@example.com",
  "password": "<password>",
  "snapTag": "@lewislam"
}
```

Successful response: `201 Created`

```json
{
  "id": "6a640a04338109ea24f83859",
  "email": "l***r@example.com"
}
```

For a phone-only signup, `email` may be `null`.

Validation failure: `400 Bad Request`

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "message": "Email or phone is required",
      "path": ["email", "phone"]
    }
  ]
}
```

Duplicate signup failures also return `400` with a field-specific message such as:

```json
{
  "message": "Email already taken"
}
```

## Login

### `POST /api/auth/login`

Authenticates with an email address, phone number, or SnapTag. A successful login creates a session and sets the refresh-token cookie.

### Request body

| Field      | Type   | Required | Allowed values                            |
| ---------- | ------ | -------- | ----------------------------------------- |
| `username` | string | Yes      | Non-empty email, phone number, or SnapTag |
| `password` | string | Yes      | Non-empty string                          |
| `method`   | string | Yes      | `EMAIL`, `PHONE`, or `SNAPTAG`            |

```json
{
  "username": "@lewislam",
  "password": "<password>",
  "method": "SNAPTAG"
}
```

Successful response: `200 OK`

```json
{
  "user": {
    "id": "6a640a04338109ea24f83859",
    "firstName": "Lamar",
    "lastName": "Lewis",
    "email": "l***r@example.com",
    "phone": null,
    "snapTag": "@lewislam"
  },
  "accessToken": "<jwt>"
}
```

The refresh token is not returned in JSON. It is set as:

```text
Set-Cookie: refreshToken=<token>; Path=/api/auth; HttpOnly; SameSite=Strict
```

In production, the cookie also uses `Secure`.

Validation failure: `400 Bad Request`

```json
{
  "message": "Validation failed",
  "errors": []
}
```

Unknown users and incorrect passwords return `401 Unauthorized` with the same generic response so the API does not reveal whether an identifier is registered:

````json
{
  "message": "Invalid username or password",
  "code": "INVALID_CREDENTIALS"
}

## Refresh session

### `POST /api/auth/refresh`

Rotates the session refresh token and returns a new access token. No request body is required.

```ts
const response = await fetch("http://localhost:3000/api/auth/refresh", {
  method: "POST",
  credentials: "include",
});
````

Successful response: `200 OK`

```json
{
  "data": {
    "accessToken": "<jwt>"
  }
}
```

A new `refreshToken` cookie replaces the previous one.

Missing cookie: `401 Unauthorized`

```json
{
  "message": "Missing refresh token"
}
```

Invalid, expired, revoked, or reused token: `401 Unauthorized`

```json
{
  "message": "Invalid refresh token"
}
```

The invalid refresh-token cookie is cleared.

## Logout

### `POST /api/auth/logout`

Deletes the session associated with the refresh-token cookie and clears the cookie. No request body or access token is required. The operation also succeeds when the cookie or session is absent.

```ts
await fetch("http://localhost:3000/api/auth/logout", {
  method: "POST",
  credentials: "include",
});
```

Successful response: `204 No Content`. The response has no body.

## Get current user

### `GET /api/user/me`

Returns the user represented by the Bearer access token and up to five wallet transactions, newest first.

```http
GET /api/user/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <accessToken>
```

Successful response: `200 OK`

```json
{
  "user": {
    "id": "6a640a04338109ea24f83859",
    "firstName": "Lamar",
    "lastName": "Lewis",
    "email": "l***r@example.com",
    "phone": null,
    "snapTag": "@lewislam",
    "wallet": {
      "id": "6a640a04338109ea24f83860",
      "currency": "USD",
      "balanceMinor": "2500",
      "createdAt": "2026-07-27T12:00:00.000Z",
      "updatedAt": "2026-07-27T12:00:00.000Z",
      "transactions": [
        {
          "id": "6a640a04338109ea24f83861",
          "walletId": "6a640a04338109ea24f83860",
          "type": "TRANSFER",
          "amountMinor": "550",
          "balanceAfterMinor": "1950",
          "status": "COMPLETED",
          "direction": "DEBIT",
          "description": "Payment",
          "idempotencyKey": "request-id-debit",
          "relatedId": "6a640a04338109ea24f83862",
          "createdAt": "2026-07-27T12:00:00.000Z",
          "completedAt": "2026-07-27T12:00:00.000Z",
          "metadata": null
        }
      ]
    }
  }
}
```

All `bigint` values are recursively serialized as decimal strings. If a user has no wallet, `wallet` is `null`.

Missing token: `401 Unauthorized`

```json
{
  "message": "Authentication required"
}
```

Invalid or expired token: `401 Unauthorized`

```json
{
  "message": "Invalid or expired access token"
}
```

Missing JWT configuration: `500 Internal Server Error`

```json
{
  "message": "Authentication unavailable"
}
```

## Transfer between wallets

### `POST /api/account/transfer`

Requires both an access token and an idempotency key:

```http
Authorization: Bearer <accessToken>
Idempotency-Key: <client-generated-unique-key>
Content-Type: application/json
```

The request validator currently defines this body:

| Field         | Type   | Required | Validation                             |
| ------------- | ------ | -------- | -------------------------------------- |
| `walletId`    | string | Yes      | No format validation currently applied |
| `amountMinor` | number | Yes      | Integer from `1` through `100000000`   |
| `description` | string | No       | Trimmed; maximum 255 characters        |

```json
{
  "walletId": "6a6ebf305fd97bde0d2d10c8",
  "amountMinor": 550,
  "description": "Lewis sends you money"
}
```

Intended successful response: `201 Created`

```json
{
  "message": "Transfer successful"
}
```

Reusing a successfully processed idempotency key returns `200 OK`:

```json
{
  "message": "Transfer already processed"
}
```

Missing idempotency key: `400 Bad Request`

```json
{
  "message": "Idempotency-Key header is required"
}
```

### Current implementation blockers

This endpoint cannot currently complete through its documented validator/controller path:

1. The validator accepts `walletId`, but the controller reads `req.body.accountId`. Zod strips unknown fields, so the service receives an undefined receiver ID.
2. The validator produces a JavaScript `number`, while the service performs arithmetic against Prisma `bigint` wallet balances without first converting the amount to `BigInt`.
3. The transaction repository sends `relatedWalletId`, but the Prisma model field is named `relatedId`.

Align these names and convert the validated amount before treating the successful responses above as available behavior.

## Development bank credit

### `POST /api/account/bankcredit`

This route is currently registered with Bearer authentication but has no request schema or idempotency middleware.

The controller reads:

```json
{
  "amountMinor": 550,
  "description": "Development credit"
}
```

Intended new-deposit response: `201 Created`

```json
{
  "message": "Transfer Successful"
}
```

Intended duplicate response: `200 OK`

```json
{
  "message": "Transfer already processed"
}
```

### Security and implementation warning

Do not expose this route in production. It allows an authenticated user to request a wallet credit without evidence of a settled bank payment. It also currently reads an idempotency key that its route never populates, and unvalidated JSON numbers are not converted before `bigint` arithmetic.

A production deposit should be initiated and confirmed through a trusted payment-provider flow, normally using a verified provider webhook and provider transaction ID for idempotency.

## Money representation

`amountMinor`, `balanceMinor`, and `balanceAfterMinor` represent minor currency units:

- For USD, `550` means `$5.50`.
- For USD, `$550.00` is represented as `55000`.
- Request amounts are currently JSON numbers.
- Response amounts backed by Prisma `BigInt` are serialized as decimal strings.

## Error handling

Validation and authentication middleware return JSON errors directly. Known HTTP errors forwarded by controllers retain their status and JSON message. Unexpected errors return:

```json
{
  "message": "Internal server error",
  "code": "INTERNAL_SERVER_ERROR"
}

## Token lifecycle

1. The client logs in and receives an access token plus an HTTP-only refresh cookie.
2. The client uses the access token for protected requests.
3. After 15 minutes, the client calls `/api/auth/refresh` with credentials enabled.
4. The server rotates the refresh token and returns a new access token.
5. The rolling refresh session expires after 7 days without a successful refresh.
6. Logout deletes the session and clears the refresh cookie.

## Routes not currently exposed

No Express routes currently expose withdrawals, refunds, wallet transaction history as a standalone endpoint, public user search, user updates, or user deletion.
```
