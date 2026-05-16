# Scalable Campus Notification System Architecture

This document outlines the backend architecture, data models, and optimization strategies for a scalable notification platform.

---

## Stage 1 — REST API Design

### 1.1 API Endpoints & Contracts

**Authentication Assumption**: All endpoints except public webhooks expect a valid `Authorization: Bearer <token>` header containing the `user_id`.

#### 1. Create a Notification (Single)
- **Endpoint**: `POST /api/v1/notifications`
- **Use Case**: System or admin sends a targeted notification to a specific user.
- **Request Body**:
  ```json
  {
    "recipientId": "U-1029",
    "type": "ALERT",
    "priority": "HIGH",
    "title": "Maintenance Scheduled",
    "body": "Server maintenance at 2 AM."
  }
  ```
- **Response (201 Created)**:
  ```json
  { "success": true, "notificationId": "N-5011" }
  ```

#### 2. Get Notifications (Paginated)
- **Endpoint**: `GET /api/v1/notifications?limit=20&cursor=timestamp`
- **Use Case**: Client retrieves their inbox.
- **Response (200 OK)**:
  ```json
  {
    "data": [
      {
        "id": "N-5011",
        "title": "Maintenance Scheduled",
        "isRead": false,
        "createdAt": "2026-05-16T10:00:00Z"
      }
    ],
    "nextCursor": "2026-05-16T09:00:00Z"
  }
  ```

#### 3. Mark as Read
- **Endpoint**: `PUT /api/v1/notifications/:id/read`
- **Response (200 OK)**: `{ "success": true }`

#### 4. Bulk Send Notifications
- **Endpoint**: `POST /api/v1/notifications/bulk`
- **Request Body**:
  ```json
  {
    "targetAudience": "ALL_STUDENTS",
    "title": "Campus Closed",
    "body": "Due to weather, campus is closed today."
  }
  ```
- **Response (202 Accepted)**: `{ "message": "Bulk job queued.", "jobId": "J-992" }`

#### 5. Priority Inbox Retrieval
- **Endpoint**: `GET /api/v1/notifications/priority`
- **Response**: Similar to `GET /notifications`, but sorted by the dynamic ranking algorithm (see Stage 6).

### 1.2 Validation & Error Handling
- **400 Bad Request**: Missing required fields or invalid enum values (e.g., `priority` not in `[LOW, MEDIUM, HIGH]`).
- **401/403**: Missing or invalid token.
- **429 Too Many Requests**: Rate-limiting triggered on client polling.

---

## Stage 2 — Database Design

### 2.1 SQL vs NoSQL Reasoning
For a notification system, a **Relational SQL Database (e.g., PostgreSQL)** is highly recommended. 
**Why?** 
1. **Normalization**: If a bulk notification is sent to 10,000 students, storing 10,000 copies of the payload in a NoSQL document DB wastes massive storage space. In SQL, we store the payload *once* in a `notifications` table, and track read states in a mapping table.
2. **ACID properties**: Ensuring that state changes (marking as read) are strongly consistent.

### 2.2 Relational Schema

**1. `users` Table**
- `id` (PK, UUID)
- `name` (VARCHAR)
- `cohort_id` (VARCHAR) - Used for bulk audience targeting.

**2. `notifications` Table** (Stores the actual payload)
- `id` (PK, UUID)
- `type` (ENUM: ALERT, INFO, PROMO)
- `priority` (INT: 1-Low, 2-Medium, 3-High)
- `title` (VARCHAR)
- `body` (TEXT)
- `audience_target` (VARCHAR, Nullable) - e.g., "ALL", "U-1029"
- `created_at` (TIMESTAMP)

**3. `notification_reads` Table** (Mapping table for state)
- `notification_id` (FK to notifications)
- `user_id` (FK to users)
- `is_read` (BOOLEAN, Default: false)
- `read_at` (TIMESTAMP, Nullable)
- **Primary Key**: `(notification_id, user_id)`

### 2.3 Indexing Strategy
- Index on `notification_reads(user_id, is_read)` to instantly query a user's unread count.
- Index on `notifications(created_at DESC)` for fast timeline sorting.

---

## Stage 3 — Query Optimization

### 3.1 Unread Notifications Optimization
**Bottleneck**: Running `SELECT COUNT(*) FROM notification_reads WHERE user_id = X AND is_read = false` on every page load is expensive at scale.
**Solution**: 
Instead of computing it dynamically every time, maintain an `unread_count` integer column on the `users` table. 
- Increment it via DB trigger or application logic when a new notification is mapped.
- Decrement it when the user triggers the `/read` endpoint.

### 3.2 Pagination Strategy
Avoid `OFFSET`-based pagination (`LIMIT 20 OFFSET 10000`), as the DB must scan and discard 10,000 rows, degrading performance.
**Solution**: Use **Cursor-based Pagination**.
```sql
SELECT n.*, nr.is_read 
FROM notifications n
JOIN notification_reads nr ON n.id = nr.notification_id
WHERE nr.user_id = 'U-1029' 
  AND n.created_at < '2026-05-16T10:00:00Z' -- The cursor
ORDER BY n.created_at DESC LIMIT 20;
```

---

## Stage 4 — Caching Strategy

### 4.1 Repeated Fetch Reduction
When thousands of users log in simultaneously (e.g., morning class time), fetching notifications directly from the DB causes a massive IO spike.

### 4.2 Cache Layer Architecture
Use an **In-Memory Application Cache** (like standard Node.js HashMaps with TTL, or an external KV store).
1. **Inbox Caching**: Cache the top 20 recent notifications for active users. Key: `inbox:{user_id}`, Value: `JSON array of notifications`.
2. **Global Broadcast Caching**: If a bulk campus-wide notification is active, cache the payload globally. Key: `broadcast:latest`. All users fetch this from RAM instead of disk.

### 4.3 Tradeoff Analysis
- **Pros**: Drastically reduces DB Read IOPS; sub-millisecond API response times.
- **Cons**: Cache invalidation is tricky. If a user reads a notification on mobile, the web cache must be invalidated or updated, otherwise they see stale "unread" states. 
- **Compromise**: Set a short Time-To-Live (TTL) of 60 seconds on the cache, or only cache the *global payloads* while reading the `is_read` state directly from the fast indexed DB.

---

## Stage 5 — Bulk Notification Processing

### 5.1 Architecture & Strategy
Sending 10,000 notifications in a synchronous HTTP request will time out. We must decouple the submission from the execution.
- API accepts the bulk request, saves the core `notification` payload to the DB, and drops a Job into a **Background Queue** (e.g., DB-backed job table).
- API immediately returns `202 Accepted`.
- Background asynchronous workers pick up the job and batch-insert the `notification_reads` rows.

### 5.2 Pseudocode for Async Processing Worker
```javascript
async function processBulkNotification(job) {
  const { targetAudience, notificationId } = job;
  
  try {
    // 1. Fetch targeted users (e.g., all 1st year students)
    const users = await db.query("SELECT id FROM users WHERE cohort = ?", [targetAudience]);
    
    // 2. Batch insert into mapping table to avoid 10,000 separate INSERT queries
    const batchData = users.map(u => [notificationId, u.id, false]);
    
    await db.query(`
      INSERT INTO notification_reads (notification_id, user_id, is_read) 
      VALUES ?
    `, [batchData]);
    
    markJobComplete(job.id);
  } catch (error) {
    logError(error);
    scheduleRetry(job, /* retryCount */ 3);
  }
}
```

---

## Stage 6 — Priority Inbox Ranking

### 6.1 Ranking Strategy
Standard chronological sorting hides important alerts (e.g., "Exam Cancelled") under spam (e.g., "New Club Event"). We need a **Weighted Scoring System** that balances *Recency* and *Priority*.

### 6.2 Weighted Scoring Algorithm
```text
Score = (PriorityWeight * PriorityValue) - (DecayFactor * HoursSincePublished)
```
- **PriorityValue**: High=3, Medium=2, Low=1
- **PriorityWeight**: Base multiplier (e.g., 50)
- **DecayFactor**: How fast a notification loses relevance over time (e.g., 2 points per hour).

### 6.3 Pseudocode for Ranking Retrieval
```javascript
function rankNotifications(notifications) {
  const now = Date.now();
  
  return notifications.map(notif => {
    // Calculate hours passed
    const hoursSince = (now - new Date(notif.created_at).getTime()) / (1000 * 60 * 60);
    
    // Map priority enum to integer
    const pValue = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }[notif.priority];
    
    // Compute score
    const score = (50 * pValue) - (2 * hoursSince);
    
    return { ...notif, rankingScore: score };
  })
  .sort((a, b) => b.rankingScore - a.rankingScore); // Sort descending
}
```

### 6.4 Scalability Discussion
Running this math on thousands of rows per user dynamically in the DB is slow.
**Scalable approach**: 
- The DB retrieves only the last 7 days of unread notifications (a small dataset, max ~100 items).
- The lightweight Node.js backend applies the ranking function in-memory before sending the JSON to the client. This offloads compute from the shared DB layer to the horizontally scalable stateless application layer.
