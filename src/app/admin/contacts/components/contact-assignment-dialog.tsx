"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface Telephoniste {
  _id: string;
  name: string;
  email: string;
}

interface ContactAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedContactIds: string[];
  telephonistes: Telephoniste[];
  onAssignmentComplete: () => void;
}

export default function ContactAssignmentDialog({
  open,
  onOpenChange,
  selectedContactIds,
  telephonistes,
  onAssignmentComplete,
}: ContactAssignmentDialogProps) {
  const [selectedTelephoniste, setSelectedTelephoniste] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedTelephoniste) {
      alert("Please select a telephoniste");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/contacts/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: selectedContactIds,
          telephonisteId: selectedTelephoniste,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign contacts");
      }

      onOpenChange(false);
      setSelectedTelephoniste("");
      onAssignmentComplete();
    } catch (error) {
      console.error("Error assigning contacts:", error);
      alert("Failed to assign contacts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Contacts</DialogTitle>
          <DialogDescription>
            Assign {selectedContactIds.length} contact
            {selectedContactIds.length !== 1 ? "s" : ""} to a telephoniste
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="telephoniste">Select Telephoniste</Label>
            <Select
              value={selectedTelephoniste}
              onValueChange={setSelectedTelephoniste}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a telephoniste" />
              </SelectTrigger>
              <SelectContent>
                {telephonistes.map((tel) => (
                  <SelectItem key={tel._id} value={tel._id}>
                    {tel.name} ({tel.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              className="flex-1"
              disabled={loading || !selectedTelephoniste}
            >
              {loading ? "Assigning..." : "Assign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
