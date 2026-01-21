import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWorkers,
  useWorkstations,
  useAIEvents,
  useGenerateDummyData,
  useClearData,
} from "@/hooks/useDashboardData";
import {
  computeWorkerMetrics,
  computeWorkstationMetrics,
  computeFactoryMetrics,
} from "@/lib/metrics";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FactorySummary } from "@/components/dashboard/FactorySummary";
import { WorkerCard } from "@/components/dashboard/WorkerCard";
import { WorkstationCard } from "@/components/dashboard/WorkstationCard";
import { EventsTable } from "@/components/dashboard/EventsTable";
import { FilterSelect } from "@/components/dashboard/FilterSelect";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const queryClient = useQueryClient();
  const [selectedWorker, setSelectedWorker] = useState<string>("all");
  const [selectedStation, setSelectedStation] = useState<string>("all");

  const { data: workers = [], isLoading: workersLoading } = useWorkers();
  const { data: workstations = [], isLoading: stationsLoading } = useWorkstations();
  const { data: events = [], isLoading: eventsLoading } = useAIEvents();

  const generateData = useGenerateDummyData();
  const clearData = useClearData();

  // Filter events based on selection
  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (selectedWorker !== "all" && e.worker_id !== selectedWorker) return false;
      if (selectedStation !== "all" && e.workstation_id !== selectedStation) return false;
      return true;
    });
  }, [events, selectedWorker, selectedStation]);

  // Compute metrics
  const workerMetrics = useMemo(
    () => computeWorkerMetrics(workers, filteredEvents),
    [workers, filteredEvents]
  );

  const workstationMetrics = useMemo(
    () => computeWorkstationMetrics(workstations, filteredEvents),
    [workstations, filteredEvents]
  );

  const factoryMetrics = useMemo(
    () =>
      computeFactoryMetrics(
        workers,
        workstations,
        filteredEvents,
        workerMetrics,
        workstationMetrics
      ),
    [workers, workstations, filteredEvents, workerMetrics, workstationMetrics]
  );

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["workers"] });
    queryClient.invalidateQueries({ queryKey: ["workstations"] });
    queryClient.invalidateQueries({ queryKey: ["ai_events"] });
  };

  const isLoading = workersLoading || stationsLoading || eventsLoading;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        onGenerateData={() => generateData.mutate()}
        onClearData={() => clearData.mutate()}
        onRefresh={handleRefresh}
        isGenerating={generateData.isPending}
        isClearing={clearData.isPending}
      />

      <main className="container py-6 space-y-6">
        {/* Factory Summary */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Factory Overview</h2>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </div>
          ) : (
            <FactorySummary metrics={factoryMetrics} />
          )}
        </section>

        {/* Filters */}
        <section className="flex flex-wrap gap-4">
          <FilterSelect
            label="Filter by Worker"
            value={selectedWorker}
            onChange={setSelectedWorker}
            options={workers}
            getOptionValue={(w) => w.worker_id}
            getOptionLabel={(w) => `${w.name} (${w.worker_id})`}
            placeholder="All Workers"
          />
          <FilterSelect
            label="Filter by Station"
            value={selectedStation}
            onChange={setSelectedStation}
            options={workstations}
            getOptionValue={(s) => s.station_id}
            getOptionLabel={(s) => `${s.name} (${s.station_id})`}
            placeholder="All Stations"
          />
        </section>

        {/* Tabs for Workers, Workstations, Events */}
        <Tabs defaultValue="workers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="workers">Workers ({workers.length})</TabsTrigger>
            <TabsTrigger value="workstations">
              Workstations ({workstations.length})
            </TabsTrigger>
            <TabsTrigger value="events">
              Recent Events ({filteredEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workers" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workerMetrics
                  .filter(
                    (m) => selectedWorker === "all" || m.worker_id === selectedWorker
                  )
                  .map((metrics) => (
                    <WorkerCard
                      key={metrics.worker_id}
                      metrics={metrics}
                      isSelected={selectedWorker === metrics.worker_id}
                      onClick={() =>
                        setSelectedWorker(
                          selectedWorker === metrics.worker_id
                            ? "all"
                            : metrics.worker_id
                        )
                      }
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="workstations" className="space-y-4">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workstationMetrics
                  .filter(
                    (m) =>
                      selectedStation === "all" || m.station_id === selectedStation
                  )
                  .map((metrics) => (
                    <WorkstationCard
                      key={metrics.station_id}
                      metrics={metrics}
                      isSelected={selectedStation === metrics.station_id}
                      onClick={() =>
                        setSelectedStation(
                          selectedStation === metrics.station_id
                            ? "all"
                            : metrics.station_id
                        )
                      }
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="events">
            {isLoading ? (
              <Skeleton className="h-96 rounded-lg" />
            ) : (
              <EventsTable events={filteredEvents} limit={50} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
