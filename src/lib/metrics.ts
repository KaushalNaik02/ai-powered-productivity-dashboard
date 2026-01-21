import { AIEvent, Worker, Workstation, WorkerMetrics, WorkstationMetrics, FactoryMetrics } from "@/types/dashboard";

const EVENT_DURATION_MINUTES = 5; // Assume each event represents 5 minutes of activity

export function computeWorkerMetrics(
  workers: Worker[],
  events: AIEvent[]
): WorkerMetrics[] {
  return workers.map((worker) => {
    const workerEvents = events.filter((e) => e.worker_id === worker.worker_id);
    
    const workingEvents = workerEvents.filter((e) => e.event_type === "working");
    const idleEvents = workerEvents.filter((e) => e.event_type === "idle");
    const productEvents = workerEvents.filter((e) => e.event_type === "product_count");
    
    const total_active_minutes = workingEvents.length * EVENT_DURATION_MINUTES;
    const total_idle_minutes = idleEvents.length * EVENT_DURATION_MINUTES;
    const total_time = total_active_minutes + total_idle_minutes;
    
    const utilization_percentage = total_time > 0 
      ? Math.round((total_active_minutes / total_time) * 100) 
      : 0;
    
    const total_units_produced = productEvents.reduce((sum, e) => sum + (e.count || 0), 0);
    
    // Calculate units per hour (based on active time)
    const active_hours = total_active_minutes / 60;
    const units_per_hour = active_hours > 0 
      ? Math.round((total_units_produced / active_hours) * 10) / 10 
      : 0;
    
    // Get last event
    const sortedEvents = [...workerEvents].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastEvent = sortedEvents[0];
    
    return {
      worker_id: worker.worker_id,
      name: worker.name,
      total_active_minutes,
      total_idle_minutes,
      utilization_percentage,
      total_units_produced,
      units_per_hour,
      last_event_type: lastEvent?.event_type || "absent",
      last_seen: lastEvent?.timestamp || null,
    };
  });
}

export function computeWorkstationMetrics(
  workstations: Workstation[],
  events: AIEvent[]
): WorkstationMetrics[] {
  return workstations.map((station) => {
    const stationEvents = events.filter((e) => e.workstation_id === station.station_id);
    
    const workingEvents = stationEvents.filter((e) => e.event_type === "working");
    const idleEvents = stationEvents.filter((e) => e.event_type === "idle");
    const productEvents = stationEvents.filter((e) => e.event_type === "product_count");
    
    const total_active_minutes = workingEvents.length * EVENT_DURATION_MINUTES;
    const total_idle_minutes = idleEvents.length * EVENT_DURATION_MINUTES;
    const total_time = total_active_minutes + total_idle_minutes;
    
    const utilization_percentage = total_time > 0 
      ? Math.round((total_active_minutes / total_time) * 100) 
      : 0;
    
    const total_units_produced = productEvents.reduce((sum, e) => sum + (e.count || 0), 0);
    
    const unique_workers = new Set(stationEvents.map((e) => e.worker_id)).size;
    
    return {
      station_id: station.station_id,
      name: station.name,
      type: station.type,
      total_active_minutes,
      total_idle_minutes,
      utilization_percentage,
      total_units_produced,
      unique_workers,
    };
  });
}

export function computeFactoryMetrics(
  workers: Worker[],
  workstations: Workstation[],
  events: AIEvent[],
  workerMetrics: WorkerMetrics[],
  workstationMetrics: WorkstationMetrics[]
): FactoryMetrics {
  const activeWorkers = workerMetrics.filter(
    (w) => w.last_event_type === "working"
  ).length;
  
  const activeWorkstations = workstationMetrics.filter(
    (s) => s.utilization_percentage > 0
  ).length;
  
  const totalUtilization = workerMetrics.reduce(
    (sum, w) => sum + w.utilization_percentage,
    0
  );
  const overall_utilization = workerMetrics.length > 0 
    ? Math.round(totalUtilization / workerMetrics.length) 
    : 0;
  
  const total_units_produced = workerMetrics.reduce(
    (sum, w) => sum + w.total_units_produced,
    0
  );
  
  const avgConfidence = events.length > 0 
    ? events.reduce((sum, e) => sum + Number(e.confidence), 0) / events.length 
    : 0;
  
  return {
    total_workers: workers.length,
    active_workers: activeWorkers,
    total_workstations: workstations.length,
    active_workstations: activeWorkstations,
    overall_utilization,
    total_units_produced,
    total_events: events.length,
    avg_confidence: Math.round(avgConfidence * 100),
  };
}

export function generateEventHash(event: {
  timestamp: string;
  worker_id: string;
  workstation_id: string;
  event_type: string;
}): string {
  return `${event.timestamp}-${event.worker_id}-${event.workstation_id}-${event.event_type}`;
}
