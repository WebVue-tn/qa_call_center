"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { RefreshCw } from "lucide-react";

interface TelephonisteStats {
  userId: string;
  userName: string;
  userEmail: string;
  totalAssigned: number;
  totalCalls: number;
  totalConversions: number;
  conversionRate: number;
  callsInPeriod: number;
  conversionsInPeriod: number;
  statusBreakdown: Record<string, number>;
}

interface StatsResponse {
  stats: TelephonisteStats[];
  dateRange: {
    from: string;
    to: string;
  };
  totalTelephonistes: number;
}

export default function TelephonisteManagementPage() {
  const [statsData, setStatsData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Date filters
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await fetch(`/api/admin/telephoniste-stats?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStatsData(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyDateFilter = () => {
    fetchStats();
  };

  if (!statsData && loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const totalStats = statsData?.stats.reduce(
    (acc, stat) => ({
      totalAssigned: acc.totalAssigned + stat.totalAssigned,
      totalCalls: acc.totalCalls + stat.callsInPeriod,
      totalConversions: acc.totalConversions + stat.conversionsInPeriod,
    }),
    { totalAssigned: 0, totalCalls: 0, totalConversions: 0 }
  );

  const globalConversionRate =
    totalStats && totalStats.totalCalls > 0
      ? (totalStats.totalConversions / totalStats.totalCalls) * 100
      : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Telephoniste Management</h1>
        <p className="text-muted-foreground">
          Monitor performance and manage telephoniste assignments
        </p>
      </div>

      {/* Global Stats */}
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Telephonistes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.totalTelephonistes || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assigned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats?.totalAssigned || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Calls (Period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats?.totalCalls || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conversions (Period)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalStats?.totalConversions || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {globalConversionRate.toFixed(1)}% rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Date Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={handleApplyDateFilter} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Apply Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telephoniste Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Telephoniste Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Assigned</TableHead>
                  <TableHead className="text-right">Calls (Period)</TableHead>
                  <TableHead className="text-right">
                    Conversions (Period)
                  </TableHead>
                  <TableHead className="text-right">
                    Conversion Rate
                  </TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">
                    Total Conversions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!statsData || statsData.stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No telephonistes found
                    </TableCell>
                  </TableRow>
                ) : (
                  statsData.stats.map((stat) => (
                    <TableRow key={stat.userId}>
                      <TableCell className="font-medium">
                        {stat.userName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {stat.userEmail}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.totalAssigned}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.callsInPeriod}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="default">
                          {stat.conversionsInPeriod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            stat.conversionRate >= 10
                              ? "default"
                              : "secondary"
                          }
                        >
                          {stat.conversionRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.totalCalls}
                      </TableCell>
                      <TableCell className="text-right">
                        {stat.totalConversions}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
