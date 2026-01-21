import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clear existing events
    await supabase.from("ai_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const workers = ["W1", "W2", "W3", "W4", "W5", "W6"];
    const stations = ["S1", "S2", "S3", "S4", "S5", "S6"];
    const eventTypes = ["working", "idle", "absent", "product_count"];

    const events: Array<{
      timestamp: string;
      worker_id: string;
      workstation_id: string;
      event_type: string;
      confidence: number;
      count: number;
      event_hash: string;
    }> = [];

    const now = new Date();

    // Generate 96 events (8 hours of 5-min intervals)
    for (let i = 0; i < 96; i++) {
      const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);

      workers.forEach((workerId, idx) => {
        const stationId = stations[idx % stations.length];

        // Weighted random: 50% working, 20% idle, 10% absent, 20% product_count
        const rand = Math.random();
        let eventType: string;
        if (rand < 0.5) eventType = "working";
        else if (rand < 0.7) eventType = "idle";
        else if (rand < 0.8) eventType = "absent";
        else eventType = "product_count";

        const event = {
          timestamp: timestamp.toISOString(),
          worker_id: workerId,
          workstation_id: stationId,
          event_type: eventType,
          confidence: Math.round((0.85 + Math.random() * 0.14) * 100) / 100,
          count: eventType === "product_count" ? Math.floor(Math.random() * 5) + 1 : 1,
          event_hash: `${timestamp.toISOString()}-${workerId}-${stationId}-${eventType}-${Math.random()}`,
        };

        events.push(event);
      });
    }

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      const { error } = await supabase.from("ai_events").insert(batch);
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ 
        message: "Dummy data generated successfully", 
        events_created: events.length 
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
