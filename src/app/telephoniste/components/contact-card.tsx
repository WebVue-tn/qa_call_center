"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Phone, Save, User, Mail, MapPin, MessageSquare } from "lucide-react";
import StatusSelector from "./status-selector";
import ConversionDialog from "./conversion-dialog";

interface Contact {
  _id: string;
  phone: string;
  name?: string;
  email?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  statusId: {
    _id: string;
    name: string;
    code: string;
    color: string;
  };
  notes: Array<{
    content: string;
    createdBy: { name: string; email: string };
    createdAt: string;
  }>;
  callHistory: Array<{
    callSid: string;
    direction: string;
    duration?: number;
    status: string;
    calledBy?: string;
    calledAt: string;
  }>;
}

interface ContactCardProps {
  contact: Contact;
  onContactUpdated: () => void;
  onNextContact: () => void;
}

export default function ContactCard({
  contact,
  onContactUpdated,
  onNextContact,
}: ContactCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: contact.name || "",
    email: contact.email || "",
    address: contact.address || "",
    postalCode: contact.postalCode || "",
    city: contact.city || "",
  });
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [calling, setCalling] = useState(false);

  const formatPhone = (phone: string) => {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contact._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update contact");

      onContactUpdated();
      setEditMode(false);
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/contacts/${contact._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newNote }),
      });

      if (!response.ok) throw new Error("Failed to add note");

      setNewNote("");
      onContactUpdated();
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCall = async () => {
    setCalling(true);
    try {
      // Log the call
      const response = await fetch(`/api/contacts/${contact._id}/call-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callSid: `manual_${Date.now()}`,
          direction: "outbound",
          status: "completed",
        }),
      });

      if (!response.ok) throw new Error("Failed to log call");

      // In a real implementation, this would integrate with Twilio
      // For now, just open the phone dialer
      window.location.href = `tel:+1${contact.phone}`;

      onContactUpdated();
    } catch (error) {
      console.error("Error making call:", error);
    } finally {
      setCalling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{contact.name || "Unknown Contact"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatPhone(contact.phone)}
              </p>
            </div>
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
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Call Button */}
        <Button
          onClick={handleCall}
          disabled={calling}
          size="lg"
          className="w-full"
        >
          <Phone className="mr-2 h-5 w-5" />
          {calling ? "Calling..." : "Call Contact"}
        </Button>

        {/* Status Selector */}
        <div>
          <Label className="mb-2 block">Update Status</Label>
          <StatusSelector
            currentStatusId={contact.statusId._id}
            contactId={contact._id}
            onStatusUpdated={onContactUpdated}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Contact Information</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? "Cancel" : "Edit"}
            </Button>
          </div>

          {editMode ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter name"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="Enter email"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCode: e.target.value })
                    }
                    placeholder="A1A 1A1"
                  />
                </div>
              </div>
              <Button onClick={handleSaveContact} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {contact.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{contact.email}</span>
                </div>
              )}
              {contact.address && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {contact.address}
                    {contact.city && `, ${contact.city}`}
                    {contact.postalCode && ` ${contact.postalCode}`}
                  </span>
                </div>
              )}
              {!contact.email && !contact.address && (
                <p className="text-sm text-muted-foreground">
                  No additional information available. Click Edit to add details.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <MessageSquare className="h-4 w-4" />
            Notes
          </Label>

          <div className="space-y-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this call..."
              rows={3}
            />
            <Button
              onClick={handleAddNote}
              disabled={!newNote.trim() || saving}
              className="w-full"
            >
              Add Note
            </Button>
          </div>

          {contact.notes.length > 0 && (
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
              {contact.notes.map((note, index) => (
                <div key={index} className="border-b pb-2 last:border-b-0">
                  <p className="text-sm">{note.content}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {note.createdBy.name} -{" "}
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call History */}
        {contact.callHistory.length > 0 && (
          <div className="space-y-2">
            <Label className="text-base font-semibold">Call History</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
              {contact.callHistory.map((call, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="capitalize">{call.direction}</span>
                  <span className="text-muted-foreground">
                    {new Date(call.calledAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conversion Button */}
        <ConversionDialog
          contactId={contact._id}
          onConversionComplete={() => {
            onContactUpdated();
            onNextContact();
          }}
        />
      </CardContent>
    </Card>
  );
}
