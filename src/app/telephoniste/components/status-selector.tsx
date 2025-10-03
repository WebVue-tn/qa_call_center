"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";

interface ContactStatus {
  _id: string;
  name: string;
  code: string;
  color: string;
}

interface StatusSelectorProps {
  currentStatusId: string;
  contactId: string;
  onStatusUpdated: () => void;
}

export default function StatusSelector({
  currentStatusId,
  contactId,
  onStatusUpdated,
}: StatusSelectorProps) {
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch available statuses
    fetch("/api/contact-statuses")
      .then((res) => res.json())
      .then((data) => setStatuses(data))
      .catch((err) => console.error("Error fetching statuses:", err));
  }, []);

  const handleStatusChange = async (newStatusId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/contacts/${contactId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusId: newStatusId }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      onStatusUpdated();
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentStatus = statuses.find((s) => s._id === currentStatusId);

  return (
    <Select
      value={currentStatusId}
      onValueChange={handleStatusChange}
      disabled={loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue>
          {currentStatus && (
            <Badge
              style={{
                backgroundColor: currentStatus.color,
                color: "white",
              }}
            >
              {currentStatus.name}
            </Badge>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status._id} value={status._id}>
            <Badge
              style={{
                backgroundColor: status.color,
                color: "white",
              }}
            >
              {status.name}
            </Badge>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
