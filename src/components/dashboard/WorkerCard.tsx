import { WorkerMetrics } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { User, Clock, Package, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WorkerCardProps {
  metrics: WorkerMetrics;
  isSelected?: boolean;
  onClick?: () => void;
}

const statusStyles = {
  working: "bg-success text-success-foreground",
  idle: "bg-warning text-warning-foreground",
  absent: "bg-destructive text-destructive-foreground",
  product_count: "bg-info text-info-foreground",
};

const statusLabels = {
  working: "Working",
  idle: "Idle",
  absent: "Absent",
  product_count: "Producing",
};

export function WorkerCard({ metrics, isSelected, onClick }: WorkerCardProps) {
  const status = metrics.last_event_type as keyof typeof statusStyles;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "stat-card cursor-pointer transition-all duration-200",
        isSelected && "ring-2 ring-primary border-primary",
        "hover:border-primary/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{metrics.name}</h3>
            <p className="text-xs text-muted-foreground">{metrics.worker_id}</p>
          </div>
        </div>
        <Badge className={cn("text-xs", statusStyles[status] || statusStyles.absent)}>
          {statusLabels[status] || "Unknown"}
        </Badge>
      </div>
      
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Utilization</span>
            <span className="font-medium">{metrics.utilization_percentage}%</span>
          </div>
          <Progress 
            value={metrics.utilization_percentage} 
            className="h-2"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-success" />
            <div>
              <p className="text-muted-foreground text-xs">Active</p>
              <p className="font-medium">{metrics.total_active_minutes}m</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            <div>
              <p className="text-muted-foreground text-xs">Idle</p>
              <p className="font-medium">{metrics.total_idle_minutes}m</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-info" />
            <div>
              <p className="text-muted-foreground text-xs">Units</p>
              <p className="font-medium">{metrics.total_units_produced}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground text-xs">Units/hr</p>
              <p className="font-medium">{metrics.units_per_hour}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
