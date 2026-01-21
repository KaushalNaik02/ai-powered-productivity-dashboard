import { FactoryMetrics } from "@/types/dashboard";
import { MetricCard } from "./MetricCard";
import { Users, Monitor, Gauge, Package, Activity, BarChart3 } from "lucide-react";

interface FactorySummaryProps {
  metrics: FactoryMetrics;
}

export function FactorySummary({ metrics }: FactorySummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <MetricCard
        title="Active Workers"
        value={`${metrics.active_workers}/${metrics.total_workers}`}
        subtitle="Currently working"
        icon={Users}
        variant="success"
      />
      <MetricCard
        title="Active Stations"
        value={`${metrics.active_workstations}/${metrics.total_workstations}`}
        subtitle="In operation"
        icon={Monitor}
        variant="info"
      />
      <MetricCard
        title="Utilization"
        value={`${metrics.overall_utilization}%`}
        subtitle="Factory average"
        icon={Gauge}
        variant={metrics.overall_utilization >= 70 ? "success" : metrics.overall_utilization >= 40 ? "warning" : "default"}
      />
      <MetricCard
        title="Units Produced"
        value={metrics.total_units_produced.toLocaleString()}
        subtitle="Total output"
        icon={Package}
        variant="default"
      />
      <MetricCard
        title="Events Logged"
        value={metrics.total_events.toLocaleString()}
        subtitle="AI detections"
        icon={Activity}
      />
      <MetricCard
        title="AI Confidence"
        value={`${metrics.avg_confidence}%`}
        subtitle="Average score"
        icon={BarChart3}
        variant={metrics.avg_confidence >= 90 ? "success" : "warning"}
      />
    </div>
  );
}
