# AI-Powered Worker Productivity Dashboard

Real-time worker productivity monitoring powered by AI computer vision for manufacturing facilities.

## 🏭 Architecture Overview

```
Edge Cameras (CV) → Backend API → Database → Dashboard
     ↓                  ↓            ↓           ↓
  AI Events      Edge Functions   Postgres    React App
```

### Components
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime subscriptions

## 📊 Database Schema

### Workers Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| worker_id | TEXT | Unique identifier (W1-W6) |
| name | TEXT | Worker name |

### Workstations Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| station_id | TEXT | Unique identifier (S1-S6) |
| name | TEXT | Station name |
| type | TEXT | assembly, inspection, packaging, welding, machining |

### AI Events Table
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| timestamp | TIMESTAMPTZ | Event time |
| worker_id | TEXT | Foreign key to workers |
| workstation_id | TEXT | Foreign key to workstations |
| event_type | TEXT | working, idle, absent, product_count |
| confidence | NUMERIC | AI confidence score (0-1) |
| count | INTEGER | Units produced (for product_count) |
| event_hash | TEXT | Unique hash for deduplication |

## 📈 Metric Definitions

### Worker Metrics
- **Total Active Time**: Sum of 5-min intervals where event_type = 'working'
- **Total Idle Time**: Sum of 5-min intervals where event_type = 'idle'
- **Utilization %**: (Active Time / (Active + Idle)) × 100
- **Units Produced**: Sum of count for product_count events
- **Units/Hour**: Units Produced / Active Hours

### Workstation Metrics
- Same as worker metrics, grouped by workstation
- **Unique Workers**: Count of distinct workers at station

## 🔧 API Endpoints

### POST /functions/v1/ingest-event
Ingest AI event from CCTV system.

```json
{
  "timestamp": "2026-01-15T10:15:00Z",
  "worker_id": "W1",
  "workstation_id": "S3",
  "event_type": "working",
  "confidence": 0.93,
  "count": 1
}
```

## 🛡️ Handling Edge Cases

### Intermittent Connectivity
- Events are stored with timestamps from the edge device
- Database accepts out-of-order events; metrics computed from timestamp
- Idempotent ingestion prevents duplicates on retry

### Duplicate Events
- Each event has a unique `event_hash` (timestamp + worker + station + type)
- Database has UNIQUE constraint on event_hash
- API returns 200 for duplicates instead of error

### Out-of-Order Timestamps
- Events sorted by timestamp in queries, not insertion order
- Metrics computation is timestamp-agnostic
- Dashboard always shows chronologically correct data

## 🚀 Scaling Considerations

### 5 → 100+ Cameras
- Add database indexing on timestamp, worker_id, workstation_id
- Implement batch ingestion endpoint for bulk events
- Add connection pooling (PgBouncer)

### Multi-Site Deployment
- Add `site_id` column to all tables
- Partition ai_events table by site_id
- Deploy edge functions per region
- Consider time-series database (TimescaleDB) for events

### Model Versioning
- Add `model_version` column to events table
- Store model metadata in separate models table
- Track performance metrics per model version

### Drift Detection
- Compare confidence distributions over time
- Alert when avg confidence drops below threshold
- Monitor event type distribution changes

### Retraining Triggers
- Confidence threshold: retrain when avg < 85%
- Distribution shift: retrain when event ratios change significantly
- Scheduled: weekly retraining with latest labeled data

## 🐳 Docker Deployment

### Production Build
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access at http://localhost:3000
```

### Development Mode
```bash
# Run with hot reload
docker-compose --profile dev up dashboard-dev

# Access at http://localhost:8080
```

### Manual Docker Build
```bash
# Build image
docker build -t worker-dashboard .

# Run container
docker run -p 3000:80 worker-dashboard
```

## 🏃 Running Locally (without Docker)

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Dashboard loads at http://localhost:8080

Click "Generate Data" to populate with sample events.

## 📝 Assumptions & Tradeoffs

1. **5-minute event intervals**: Each event represents 5 minutes of activity
2. **Public API access**: For demo purposes; production would use API keys
3. **Client-side metrics**: Computed in browser; production would use database views
4. **No authentication**: Factory dashboard is internal; production would add auth
