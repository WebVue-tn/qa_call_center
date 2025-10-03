"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { CheckCircle } from "lucide-react";

interface Agent {
  _id: string;
  name: string;
  email: string;
}

interface ConversionDialogProps {
  contactId: string;
  onConversionComplete: () => void;
}

export default function ConversionDialog({
  contactId,
  onConversionComplete,
}: ConversionDialogProps) {
  const [open, setOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    assignedToAgentId: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      // Fetch available agents
      fetch("/api/agents")
        .then((res) => res.json())
        .then((data) => setAgents(data || []))
        .catch((err) => console.error("Error fetching agents:", err));
    }
  }, [open]);

  const handleConvert = async () => {
    if (!formData.date || !formData.time || !formData.assignedToAgentId) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Combine date and time
      const dateTime = new Date(`${formData.date}T${formData.time}`);

      const response = await fetch(`/api/contacts/${contactId}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateTime.toISOString(),
          assignedToAgentId: formData.assignedToAgentId,
          notes: formData.notes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to convert contact");
      }

      setOpen(false);
      setFormData({
        date: "",
        time: "",
        assignedToAgentId: "",
        notes: "",
      });
      onConversionComplete();
    } catch (error: any) {
      console.error("Error converting contact:", error);
      alert(error.message || "Failed to convert contact");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="w-full" size="lg">
          <CheckCircle className="mr-2 h-5 w-5" />
          Convert to Reservation
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert to Reservation</DialogTitle>
          <DialogDescription>
            Create a new reservation for this contact. Select a date, time, and
            assign an agent.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="agent">Assigned Agent *</Label>
            <Select
              value={formData.assignedToAgentId}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedToAgentId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.name} ({agent.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add any notes about this reservation..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvert}
              className="flex-1"
              disabled={loading}
            >
              {loading ? "Converting..." : "Create Reservation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
