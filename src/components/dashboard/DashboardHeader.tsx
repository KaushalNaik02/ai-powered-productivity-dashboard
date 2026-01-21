import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Trash2, Factory } from "lucide-react";

interface DashboardHeaderProps {
  onGenerateData: () => void;
  onClearData: () => void;
  onRefresh: () => void;
  isGenerating: boolean;
  isClearing: boolean;
}

export function DashboardHeader({
  onGenerateData,
  onClearData,
  onRefresh,
  isGenerating,
  isClearing,
}: DashboardHeaderProps) {
  return (
    <header className="border-b bg-card px-6 py-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <Factory className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              AI Worker Productivity Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time monitoring powered by computer vision
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onGenerateData}
            disabled={isGenerating}
          >
            <Database className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate Data"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearData}
            disabled={isClearing}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear Data
          </Button>
        </div>
      </div>
    </header>
  );
}
