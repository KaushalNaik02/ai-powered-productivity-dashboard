import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Worker, Workstation, AIEvent, EventPayload } from "@/types/dashboard";
import { generateEventHash } from "@/lib/metrics";
import { useToast } from "@/hooks/use-toast";

export function useWorkers() {
  return useQuery({
    queryKey: ["workers"],
    queryFn: async (): Promise<Worker[]> => {
      const { data, error } = await supabase
        .from("workers")
        .select("*")
        .order("worker_id");
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useWorkstations() {
  return useQuery({
    queryKey: ["workstations"],
    queryFn: async (): Promise<Workstation[]> => {
      const { data, error } = await supabase
        .from("workstations")
        .select("*")
        .order("station_id");
      
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAIEvents() {
  return useQuery({
    queryKey: ["ai_events"],
    queryFn: async (): Promise<AIEvent[]> => {
      const { data, error } = await supabase
        .from("ai_events")
        .select("*")
        .order("timestamp", { ascending: false });
      
      if (error) throw error;
      return (data || []) as AIEvent[];
    },
  });
}

export function useIngestEvent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (event: EventPayload) => {
      const eventHash = generateEventHash(event);
      
      // Check for duplicate
      const { data: existing } = await supabase
        .from("ai_events")
        .select("id")
        .eq("event_hash", eventHash)
        .maybeSingle();
      
      if (existing) {
        throw new Error("Duplicate event detected");
      }
      
      const { data, error } = await supabase
        .from("ai_events")
        .insert({
          timestamp: event.timestamp,
          worker_id: event.worker_id,
          workstation_id: event.workstation_id,
          event_type: event.event_type,
          confidence: event.confidence,
          count: event.count || 1,
          event_hash: eventHash,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_events"] });
      toast({
        title: "Event ingested",
        description: "AI event has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Ingestion failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useGenerateDummyData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // Clear existing events
      await supabase.from("ai_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      
      const workers = ["W1", "W2", "W3", "W4", "W5", "W6"];
      const stations = ["S1", "S2", "S3", "S4", "S5", "S6"];
      const eventTypes: Array<'working' | 'idle' | 'absent' | 'product_count'> = ["working", "idle", "absent", "product_count"];
      
      const events: Array<{
        timestamp: string;
        worker_id: string;
        workstation_id: string;
        event_type: string;
        confidence: number;
        count: number;
        event_hash: string;
      }> = [];
      
      // Generate events for the last 8 hours
      const now = new Date();
      for (let i = 0; i < 96; i++) { // 96 events = 8 hours of 5-min intervals
        const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000);
        
        workers.forEach((workerId, idx) => {
          const stationId = stations[idx % stations.length];
          
          // Weighted random event type (more working events)
          const rand = Math.random();
          let eventType: 'working' | 'idle' | 'absent' | 'product_count';
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
            event_hash: "",
          };
          event.event_hash = generateEventHash(event);
          
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
      
      return events.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["ai_events"] });
      toast({
        title: "Data generated",
        description: `${count} dummy events have been created.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useClearData() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("ai_events")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_events"] });
      toast({
        title: "Data cleared",
        description: "All AI events have been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Clear failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
