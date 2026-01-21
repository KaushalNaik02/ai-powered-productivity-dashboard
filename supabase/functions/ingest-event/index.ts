import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generateEventHash(event: { timestamp: string; worker_id: string; workstation_id: string; event_type: string }) {
  return `${event.timestamp}-${event.worker_id}-${event.workstation_id}-${event.event_type}`;
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

    const event = await req.json();

    // Validate required fields
    if (!event.timestamp || !event.worker_id || !event.workstation_id || !event.event_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const eventHash = generateEventHash(event);

    // Check for duplicate
    const { data: existing } = await supabase
      .from("ai_events")
      .select("id")
      .eq("event_hash", eventHash)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ message: "Duplicate event ignored", id: existing.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("ai_events")
      .insert({
        timestamp: event.timestamp,
        worker_id: event.worker_id,
        workstation_id: event.workstation_id,
        event_type: event.event_type,
        confidence: event.confidence || 0.95,
        count: event.count || 1,
        event_hash: eventHash,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Event ingested", id: data.id }),
      { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
