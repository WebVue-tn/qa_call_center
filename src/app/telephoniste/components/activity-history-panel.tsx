"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ActivityContact {
  _id: string;
  phone: string;
  name?: string;
  statusId: {
    name: string;
    color: string;
  };
  updatedAt: string;
}

export default function ActivityHistoryPanel() {
  const [todayActivity, setTodayActivity] = useState<ActivityContact[]>([]);
  const [stats, setStats] = useState({
    callsMade: 0,
    conversions: 0,
    contactsWorked: 0,
    notesAdded: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchActivityHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/telephoniste/contacts/activity-history"
      );

      if (response.ok) {
        const data = await response.json();
        setTodayActivity(data.contacts || []);
        setStats(data.stats || {
          callsMade: 0,
          conversions: 0,
          contactsWorked: 0,
          notesAdded: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching activity history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityHistory();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityHistory, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatPhone = (phone: string) => {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Today's Activity</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchActivityHistory}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Calls Today</p>
            <p className="text-2xl font-bold">{stats.callsMade}</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-sm text-muted-foreground">Conversions</p>
            <p className="text-2xl font-bold">{stats.conversions}</p>
          </div>
        </div>

        {/* Activity List */}
        <div>
          <h3 className="mb-2 text-sm font-semibold">Contacts Worked Today</h3>
          {todayActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity yet today. Start calling!
            </p>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {todayActivity.map((contact) => (
                <div
                  key={contact._id}
                  className="rounded-lg border p-3 hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {contact.name || "Unknown Contact"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPhone(contact.phone)}
                      </p>
                    </div>
                    <Badge
                      style={{
                        backgroundColor: contact.statusId.color,
                        color: "white",
                      }}
                    >
                      {contact.statusId.name}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Last updated: {new Date(contact.updatedAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
