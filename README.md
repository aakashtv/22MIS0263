# 22MIS0263 Backend Assessment

## Project Overview
This repository contains a modular, high-performance backend system designed to solve advanced constraint-optimization problems and demonstrate scalable architecture.

## Repository Structure
- `logging_middleware/`: Reusable, asynchronous logging package.
- `vehicle_maintenance_scheduler/`: Node.js microservice utilizing 0/1 Knapsack Dynamic Programming for vehicle task allocation.
- `notification_app_be/`: Scaffold for the notification backend.
- `notification_system_design.md`: Comprehensive system design and architectural writeup for a scalable campus notification platform.

## Tech Stack
- **Node.js**: Runtime environment
- **Express.js**: API Framework
- **Axios**: HTTP Client for external integrations
- **Dotenv**: Environment configuration

## Setup Instructions

### 1. Install Dependencies
Since this is a modular architecture, dependencies must be installed per package:
```bash
# 1. Install local middleware
cd logging_middleware
npm install

# 2. Install scheduler service
cd ../vehicle_maintenance_scheduler
npm install
```

### 2. Environment Setup
In `vehicle_maintenance_scheduler/`, configure the `.env` file with the required assessment credentials:
```env
PORT=3000
API_BASE_URL=https://example.com/api/v1
CLIENT_ID=your_id
CLIENT_SECRET=your_secret
CLIENT_EMAIL=your_email
CLIENT_ROLL_NO=22MIS0263
```

### 3. Running the Service
```bash
cd vehicle_maintenance_scheduler
npm run dev
```

## API Testing (Vehicle Maintenance Scheduler)
**Endpoint**: `POST /api/scheduler/optimize`
- Handles automatic authentication and Bearer token caching.
- Fetches protected `/depots` and `/tasks` from external APIs.
- Applies O(N * W) DP optimization to maximize task impact within mechanic-hour constraints.
- Returns a structured JSON optimization map.

## Core Implementations
- **Dynamic Programming Optimizer**: Accurately computes optimal task allocation.
- **Asynchronous Logger**: Native, failsafe logging without external dependencies.
- **Axios Interceptors**: Clean separation of authentication headers from business logic.
- **System Architecture**: Detailed markdown explaining Database Normalization, Queue-based Bulk Processing, and Cursor Pagination.
