import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EVENT_DURATION_MINUTES = 5;

interface WorkerMetrics {
  worker_id: string;
  name: string;
  total_active_minutes: number;
  total_idle_minutes: number;
  utilization_percentage: number;
  total_units_produced: number;
  units_per_hour: number;
  last_event_type: string;
}

interface WorkstationMetrics {
  station_id: string;
  name: string;
  type: string | null;
  total_active_minutes: number;
  total_idle_minutes: number;
  utilization_percentage: number;
  total_units_produced: number;
  unique_workers: number;
}

interface FactoryMetrics {
  total_workers: number;
  active_workers: number;
  total_workstations: number;
  active_workstations: number;
  overall_utilization: number;
  total_units_produced: number;
  total_events: number;
  avg_confidence: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Fetch all data
    const [workersRes, stationsRes, eventsRes] = await Promise.all([
      supabase.from("workers").select("*").order("worker_id"),
      supabase.from("workstations").select("*").order("station_id"),
      supabase.from("ai_events").select("*").order("timestamp", { ascending: false }),
    ]);

    if (workersRes.error) throw workersRes.error;
    if (stationsRes.error) throw stationsRes.error;
    if (eventsRes.error) throw eventsRes.error;

    const workers = workersRes.data || [];
    const workstations = stationsRes.data || [];
    const events = eventsRes.data || [];

    // Compute worker metrics
    const workerMetrics: WorkerMetrics[] = workers.map((worker) => {
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
      const active_hours = total_active_minutes / 60;
      const units_per_hour = active_hours > 0
        ? Math.round((total_units_produced / active_hours) * 10) / 10
        : 0;

      const lastEvent = workerEvents[0];

      return {
        worker_id: worker.worker_id,
        name: worker.name,
        total_active_minutes,
        total_idle_minutes,
        utilization_percentage,
        total_units_produced,
        units_per_hour,
        last_event_type: lastEvent?.event_type || "absent",
      };
    });

    // Compute workstation metrics
    const workstationMetrics: WorkstationMetrics[] = workstations.map((station) => {
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

    // Compute factory metrics
    const activeWorkers = workerMetrics.filter((w) => w.last_event_type === "working").length;
    const activeWorkstations = workstationMetrics.filter((s) => s.utilization_percentage > 0).length;
    const totalUtilization = workerMetrics.reduce((sum, w) => sum + w.utilization_percentage, 0);
    const overall_utilization = workerMetrics.length > 0
      ? Math.round(totalUtilization / workerMetrics.length)
      : 0;
    const total_units_produced = workerMetrics.reduce((sum, w) => sum + w.total_units_produced, 0);
    const avgConfidence = events.length > 0
      ? events.reduce((sum, e) => sum + Number(e.confidence), 0) / events.length
      : 0;

    const factoryMetrics: FactoryMetrics = {
      total_workers: workers.length,
      active_workers: activeWorkers,
      total_workstations: workstations.length,
      active_workstations: activeWorkstations,
      overall_utilization,
      total_units_produced,
      total_events: events.length,
      avg_confidence: Math.round(avgConfidence * 100),
    };

    return new Response(
      JSON.stringify({
        factory: factoryMetrics,
        workers: workerMetrics,
        workstations: workstationMetrics,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
