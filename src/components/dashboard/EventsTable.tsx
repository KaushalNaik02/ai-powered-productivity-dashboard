import { AIEvent } from "@/types/dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface EventsTableProps {
  events: AIEvent[];
  limit?: number;
}

const eventTypeStyles = {
  working: "bg-success/10 text-success border-success/30",
  idle: "bg-warning/10 text-warning border-warning/30",
  absent: "bg-destructive/10 text-destructive border-destructive/30",
  product_count: "bg-info/10 text-info border-info/30",
};

export function EventsTable({ events, limit = 20 }: EventsTableProps) {
  const displayEvents = events.slice(0, limit);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timestamp</TableHead>
            <TableHead>Worker</TableHead>
            <TableHead>Station</TableHead>
            <TableHead>Event</TableHead>
            <TableHead className="text-right">Confidence</TableHead>
            <TableHead className="text-right">Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayEvents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No events recorded yet. Generate dummy data to see metrics.
              </TableCell>
            </TableRow>
          ) : (
            displayEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-mono text-sm">
                  {format(new Date(event.timestamp), "MMM d, HH:mm:ss")}
                </TableCell>
                <TableCell className="font-medium">{event.worker_id}</TableCell>
                <TableCell>{event.workstation_id}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "capitalize",
                      eventTypeStyles[event.event_type]
                    )}
                  >
                    {event.event_type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {(Number(event.confidence) * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-right">
                  {event.event_type === "product_count" ? event.count : "—"}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
