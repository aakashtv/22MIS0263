# Vehicle Maintenance Scheduler

## Purpose
A lightweight Express.js microservice responsible for allocating vehicle maintenance tasks across depots. It utilizes a 0/1 Knapsack Dynamic Programming algorithm to maximize the total impact score of scheduled tasks while strictly adhering to the available mechanic-hour constraints per depot.

## Setup
```bash
npm install
```
Ensure you have created a `.env` file containing the required credentials:
```env
PORT=3000
API_BASE_URL=https://example.com/api/v1
CLIENT_ID=your_id
CLIENT_SECRET=your_secret
CLIENT_EMAIL=your_email
CLIENT_ROLL_NO=22MIS0263
```

## Run Instructions
```bash
npm run dev
```
The server will start on port 3000 by default.

## Key Functionality
- **Automated Authentication**: Lazily fetches and caches external Bearer tokens via Axios Interceptors.
- **DP Optimization**: Resolves the constraint maximization problem in `O(N * W)` time complexity.
- **Robust Error Handling**: Safely catches and formats external API failures into JSON payloads.

## Folder Structure
```text
src/
├── config/          # API config and environment loading
├── controllers/     # Request/Response logic
├── middleware/      # Global error handling
├── routes/          # Express route registration
├── services/        # Core business logic (DP allocator, Data fetching, Auth)
└── utils/           # Singletons (Axios client, Token manager)
```

## API Overview
**`POST /api/scheduler/optimize`**
- Interacts with external APIs to fetch depots and tasks.
- Returns a structured array of depots with their selected tasks mapped by the DP algorithm.
