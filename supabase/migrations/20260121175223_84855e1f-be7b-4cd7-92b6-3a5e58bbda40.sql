-- Create tables for the AI-Powered Worker Productivity Dashboard

-- Workers table
CREATE TABLE public.workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Workstations table
CREATE TABLE public.workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Events table
CREATE TABLE public.ai_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    worker_id TEXT NOT NULL REFERENCES public.workers(worker_id),
    workstation_id TEXT NOT NULL REFERENCES public.workstations(station_id),
    event_type TEXT NOT NULL CHECK (event_type IN ('working', 'idle', 'absent', 'product_count')),
    confidence NUMERIC(4,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    count INTEGER DEFAULT 1,
    event_hash TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public read for dashboard, controlled write)
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access for the dashboard
CREATE POLICY "Allow public read access to workers" ON public.workers
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to workstations" ON public.workstations
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to ai_events" ON public.ai_events
    FOR SELECT USING (true);

-- Allow public insert for API ingestion (in production, this would be secured with API keys)
CREATE POLICY "Allow public insert to workers" ON public.workers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to workstations" ON public.workstations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert to ai_events" ON public.ai_events
    FOR INSERT WITH CHECK (true);

-- Allow public delete for data refresh functionality
CREATE POLICY "Allow public delete on workers" ON public.workers
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete on workstations" ON public.workstations
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete on ai_events" ON public.ai_events
    FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX idx_ai_events_worker_id ON public.ai_events(worker_id);
CREATE INDEX idx_ai_events_workstation_id ON public.ai_events(workstation_id);
CREATE INDEX idx_ai_events_timestamp ON public.ai_events(timestamp);
CREATE INDEX idx_ai_events_event_type ON public.ai_events(event_type);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_events;