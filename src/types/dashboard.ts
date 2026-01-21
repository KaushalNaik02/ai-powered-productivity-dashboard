export interface Worker {
  id: string;
  worker_id: string;
  name: string;
  created_at: string;
}

export interface Workstation {
  id: string;
  station_id: string;
  name: string;
  type: string | null;
  created_at: string;
}

export interface AIEvent {
  id: string;
  timestamp: string;
  worker_id: string;
  workstation_id: string;
  event_type: 'working' | 'idle' | 'absent' | 'product_count';
  confidence: number;
  count: number;
  event_hash: string | null;
  created_at: string;
}

export interface WorkerMetrics {
  worker_id: string;
  name: string;
  total_active_minutes: number;
  total_idle_minutes: number;
  utilization_percentage: number;
  total_units_produced: number;
  units_per_hour: number;
  last_event_type: string;
  last_seen: string | null;
}

export interface WorkstationMetrics {
  station_id: string;
  name: string;
  type: string | null;
  total_active_minutes: number;
  total_idle_minutes: number;
  utilization_percentage: number;
  total_units_produced: number;
  unique_workers: number;
}

export interface FactoryMetrics {
  total_workers: number;
  active_workers: number;
  total_workstations: number;
  active_workstations: number;
  overall_utilization: number;
  total_units_produced: number;
  total_events: number;
  avg_confidence: number;
}

export interface EventPayload {
  timestamp: string;
  worker_id: string;
  workstation_id: string;
  event_type: 'working' | 'idle' | 'absent' | 'product_count';
  confidence: number;
  count?: number;
}
