# KMS API Documentation

## Overview

The KMS REST API provides programmatic access to the Knowledge Management System.

**Base URL:** `https://kms.it-enterprise.solutions/api`

**Authentication:** JWT Bearer Token

## Authentication

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### OAuth2 (Google/GitHub)

```http
GET /api/oauth2/google/login
GET /api/oauth2/github/login
```

## Categories

### List Categories

```http
GET /api/categories
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Projects",
    "slug": "projects",
    "parent_id": null,
    "type": "product"
  }
]
```

### Create Category

```http
POST /api/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "New Category",
  "parent_id": null,
  "type": "product"
}
```

### Update Category

```http
PUT /api/categories/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name"
}
```

### Delete Category

```http
DELETE /api/categories/{id}
Authorization: Bearer {token}
```

## Objects (Projects)

### List Objects

```http
GET /api/objects
GET /api/objects?category_id=1
Authorization: Bearer {token}
```

### Get Object

```http
GET /api/objects/{id}
Authorization: Bearer {token}
```

### Create Object

```http
POST /api/objects
Authorization: Bearer {token}
Content-Type: application/json

{
  "object_name": "My Project",
  "category_id": 1,
  "file_path": "/opt/projects/my-project",
  "metadata": {}
}
```

### Update Object

```http
PUT /api/objects/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "object_name": "Updated Name"
}
```

### Delete Object

```http
DELETE /api/objects/{id}
Authorization: Bearer {token}
```

## Documents

### List Documents

```http
GET /api/documents
GET /api/documents?object_id=1
Authorization: Bearer {token}
```

### Create Document

```http
POST /api/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "doc_name": "README.md",
  "object_id": 1,
  "file_path": "/opt/projects/my-project/README.md",
  "doc_type": "docs"
}
```

## Tools

### Open Terminal

```http
POST /api/tools/terminal/open
Authorization: Bearer {token}
Content-Type: application/json

{
  "object_id": 1,
  "folder": null
}
```

### Open VS Code

```http
POST /api/tools/vscode/open
Authorization: Bearer {token}
Content-Type: application/json

{
  "object_id": 1
}
```

### Git Operations

```http
POST /api/tools/git/status
POST /api/tools/git/pull
POST /api/tools/git/commit
POST /api/tools/git/push
Authorization: Bearer {token}
Content-Type: application/json

{
  "object_id": 1,
  "message": "Commit message"  // for commit
}
```

### Claude AI Chat

```http
POST /api/tools/claude/chat
Authorization: Bearer {token}
Content-Type: application/json

{
  "object_id": 1,
  "message": "Help me with this code",
  "include_context": true
}
```

## Search

```http
GET /api/search?q=search+term
Authorization: Bearer {token}
```

## System

### Health Check

```http
GET /api/health
```

### Statistics

```http
GET /api/stats
Authorization: Bearer {token}
```

### Metrics (Prometheus)

```http
GET /api/metrics
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Rate Limiting

API requests are limited to:
- 100 requests per minute for authenticated users
- 20 requests per minute for unauthenticated endpoints

## Versioning

Current API version: `1.0.0`

API changes are documented in the changelog.

