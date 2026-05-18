# Todo API

A small but complete Express API with JSON responses, health checks, CRUD routes, input validation, and automated tests.

## Requirements

- Node.js 24+
- npm

## Scripts

```bash
npm start
npm run dev
npm test
```

## Base URL

```text
http://localhost:3000
```

The server also respects the `PORT` environment variable.

## Response format

Successful responses use this shape:

```json
{
  "success": true,
  "data": {}
}
```

Error responses use this shape:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed.",
    "details": []
  }
}
```

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/` | API metadata and available endpoints |
| `GET` | `/health` | Health check |
| `GET` | `/api/todos` | List todos. Optional query: `completed=true` or `completed=false` |
| `POST` | `/api/todos` | Create a todo |
| `GET` | `/api/todos/:id` | Read one todo |
| `PUT` | `/api/todos/:id` | Replace a todo title and completion status |
| `PATCH` | `/api/todos/:id` | Partially update a todo |
| `DELETE` | `/api/todos/:id` | Delete a todo |

## Examples

Create a todo:

```bash
curl -X POST http://localhost:3000/api/todos \
  -H 'Content-Type: application/json' \
  -d '{"title":"Learn Express","completed":false}'
```

Patch a todo:

```bash
curl -X PATCH http://localhost:3000/api/todos/1 \
  -H 'Content-Type: application/json' \
  -d '{"completed":true}'
```
