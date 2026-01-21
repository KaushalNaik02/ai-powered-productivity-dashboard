import { WorkstationMetrics } from "@/types/dashboard";
import { cn } from "@/lib/utils";
import { Monitor, Clock, Package, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface WorkstationCardProps {
  metrics: WorkstationMetrics;
  isSelected?: boolean;
  onClick?: () => void;
}

const typeColors: Record<string, string> = {
  assembly: "bg-info/10 text-info border-info/30",
  inspection: "bg-success/10 text-success border-success/30",
  packaging: "bg-warning/10 text-warning border-warning/30",
  welding: "bg-destructive/10 text-destructive border-destructive/30",
  machining: "bg-primary/10 text-primary border-primary/30",
};

export function WorkstationCard({ metrics, isSelected, onClick }: WorkstationCardProps) {
  const typeStyle = metrics.type 
    ? typeColors[metrics.type] || typeColors.assembly 
    : typeColors.assembly;
  
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
          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
            <Monitor className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">{metrics.name}</h3>
            <p className="text-xs text-muted-foreground">{metrics.station_id}</p>
          </div>
        </div>
        {metrics.type && (
          <Badge variant="outline" className={cn("text-xs capitalize", typeStyle)}>
            {metrics.type}
          </Badge>
        )}
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
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-muted-foreground text-xs">Workers</p>
              <p className="font-medium">{metrics.unique_workers}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
