"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import ContactCard from "./contact-card";
import ActivityHistoryPanel from "./activity-history-panel";
import { ArrowLeft, ArrowRight, Phone } from "lucide-react";

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
  statusHistory: Array<{
    statusId: string;
    updatedBy: { name: string; email: string };
    updatedAt: string;
    note?: string;
  }>;
}

export default function TelephonisteInterface() {
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [contactHistory, setContactHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fetchNextContact = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/telephoniste/contacts/random");

      if (response.status === 404) {
        setCurrentContact(null);
        setTotalAvailable(0);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch contact");
      }

      const data = await response.json();
      setCurrentContact(data.contact);
      setTotalAvailable(data.totalAvailable);

      // Add to history if it's a new contact
      if (
        data.contact &&
        !contactHistory.includes(data.contact._id)
      ) {
        const newHistory = [...contactHistory, data.contact._id];
        setContactHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    } catch (error) {
      console.error("Error fetching contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const navigateBack = async () => {
    if (historyIndex > 0) {
      const prevContactId = contactHistory[historyIndex - 1];
      if (prevContactId) {
        setLoading(true);
        try {
          const response = await fetch(`/api/contacts/${prevContactId}`);
          if (response.ok) {
            const data = await response.json();
            setCurrentContact(data);
            setHistoryIndex(historyIndex - 1);
          }
        } catch (error) {
          console.error("Error navigating back:", error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const navigateForward = async () => {
    if (historyIndex < contactHistory.length - 1) {
      const nextContactId = contactHistory[historyIndex + 1];
      if (nextContactId) {
        setLoading(true);
        try {
          const response = await fetch(`/api/contacts/${nextContactId}`);
          if (response.ok) {
            const data = await response.json();
            setCurrentContact(data);
            setHistoryIndex(historyIndex + 1);
          }
        } catch (error) {
          console.error("Error navigating forward:", error);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  useEffect(() => {
    fetchNextContact();
  }, []);

  const handleContactUpdated = () => {
    // Refresh current contact
    if (currentContact) {
      fetch(`/api/contacts/${currentContact._id}`)
        .then((res) => res.json())
        .then((data) => setCurrentContact(data))
        .catch((err) => console.error("Error refreshing contact:", err));
    }
  };

  if (loading && !currentContact) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentContact) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">No Contacts Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              There are no contacts available for calling right now.
            </p>
            <Button onClick={fetchNextContact} className="w-full">
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contact Interface</h1>
            <p className="text-muted-foreground">
              {totalAvailable} contact{totalAvailable !== 1 ? "s" : ""} available
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={navigateBack}
              disabled={historyIndex <= 0}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={navigateForward}
              disabled={historyIndex >= contactHistory.length - 1}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={fetchNextContact}>
              <Phone className="mr-2 h-4 w-4" />
              Next Contact
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact Card - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ContactCard
              contact={currentContact}
              onContactUpdated={handleContactUpdated}
              onNextContact={fetchNextContact}
            />
          </div>

          {/* Activity History - Takes 1 column */}
          <div>
            <ActivityHistoryPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
