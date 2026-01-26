"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { ReportAlert } from "@/types";
import { ArrowUp, ArrowDown } from "lucide-react";

interface AlertsTableProps {
  alerts: ReportAlert[];
}

export function AlertsTable({ alerts }: AlertsTableProps) {
  const upsideAlerts = alerts.filter((a) => a.type === "upside");
  const downsideAlerts = alerts.filter((a) => a.type === "downside");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Key Levels & Alerts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upside Alerts */}
        {upsideAlerts.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ArrowUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-500">Upside Targets</span>
            </div>
            <div className="space-y-3">
              {upsideAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="upside">{alert.level_name}</Badge>
                      <span className="font-bold">{formatPrice(alert.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.action}</p>
                    {alert.reason && (
                      <p className="text-xs text-muted-foreground/70">{alert.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downside Alerts */}
        {downsideAlerts.length > 0 && (
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <ArrowDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-500">Downside Support</span>
            </div>
            <div className="space-y-3">
              {downsideAlerts.map((alert, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="downside">{alert.level_name}</Badge>
                      <span className="font-bold">{formatPrice(alert.price)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.action}</p>
                    {alert.reason && (
                      <p className="text-xs text-muted-foreground/70">{alert.reason}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
