"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Search, MoreVertical, Plus, Users, UserX } from "lucide-react";
import ContactAssignmentDialog from "./components/contact-assignment-dialog";

interface Contact {
  _id: string;
  phone: string;
  name?: string;
  email?: string;
  statusId: {
    _id: string;
    name: string;
    code: string;
    color: string;
  };
  assignedToTelephonisteId?: {
    _id: string;
    name: string;
    email: string;
  };
  callHistory: any[];
  isConverted: boolean;
  createdAt: string;
}

interface ContactStatus {
  _id: string;
  name: string;
  code: string;
  color: string;
}

interface Telephoniste {
  _id: string;
  name: string;
  email: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statuses, setStatuses] = useState<ContactStatus[]>([]);
  const [telephonistes, setTelephonistes] = useState<Telephoniste[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");
  const [conversionFilter, setConversionFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const limit = 50;

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all") params.append("statusId", statusFilter);
      if (assignmentFilter && assignmentFilter !== "all") {
        params.append("assignedToTelephonisteId", assignmentFilter);
      }
      if (conversionFilter && conversionFilter !== "all") {
        params.append("isConverted", conversionFilter);
      }

      const response = await fetch(`/api/contacts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts);
        setTotal(data.pagination.total);
        setPages(data.pagination.pages);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch statuses
    fetch("/api/contact-statuses")
      .then((res) => res.json())
      .then((data) => setStatuses(data))
      .catch((err) => console.error("Error fetching statuses:", err));

    // Fetch telephonistes
    fetch("/api/telephonistes")
      .then((res) => res.json())
      .then((data) => setTelephonistes(data))
      .catch((err) => console.error("Error fetching telephonistes:", err));
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [page, statusFilter, assignmentFilter, conversionFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchContacts();
  };

  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId)
        ? prev.filter((id) => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map((c) => c._id));
    }
  };

  const formatPhone = (phone: string) => {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
  };

  const handleBulkUnassign = async () => {
    if (selectedContacts.length === 0) return;

    try {
      const response = await fetch("/api/contacts/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactIds: selectedContacts }),
      });

      if (response.ok) {
        setSelectedContacts([]);
        fetchContacts();
      }
    } catch (error) {
      console.error("Error unassigning contacts:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contact Management</h1>
        <p className="text-muted-foreground">
          Manage and assign contacts to telephonistes
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Contacts ({total})</CardTitle>
            <div className="flex gap-2">
              {selectedContacts.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setAssignDialogOpen(true)}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Assign ({selectedContacts.length})
                  </Button>
                  <Button variant="outline" onClick={handleBulkUnassign}>
                    <UserX className="mr-2 h-4 w-4" />
                    Unassign
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search phone, name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status._id} value={status._id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={assignmentFilter}
              onValueChange={setAssignmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Assignments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {telephonistes.map((tel) => (
                  <SelectItem key={tel._id} value={tel._id}>
                    {tel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={conversionFilter}
              onValueChange={setConversionFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Contacts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contacts</SelectItem>
                <SelectItem value="false">Not Converted</SelectItem>
                <SelectItem value="true">Converted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        contacts.length > 0 &&
                        selectedContacts.length === contacts.length
                      }
                      onCheckedChange={toggleAllContacts}
                    />
                  </TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Calls</TableHead>
                  <TableHead>Converted</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No contacts found
                    </TableCell>
                  </TableRow>
                ) : (
                  contacts.map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact._id)}
                          onCheckedChange={() =>
                            toggleContactSelection(contact._id)
                          }
                        />
                      </TableCell>
                      <TableCell className="font-mono">
                        {formatPhone(contact.phone)}
                      </TableCell>
                      <TableCell>{contact.name || "-"}</TableCell>
                      <TableCell>{contact.email || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: contact.statusId.color,
                            color: "white",
                          }}
                        >
                          {contact.statusId.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contact.assignedToTelephonisteId?.name || (
                          <span className="text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{contact.callHistory.length}</TableCell>
                      <TableCell>
                        {contact.isConverted ? (
                          <Badge variant="default">Yes</Badge>
                        ) : (
                          <Badge variant="outline">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem>View History</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {page} of {pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <ContactAssignmentDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        selectedContactIds={selectedContacts}
        telephonistes={telephonistes}
        onAssignmentComplete={() => {
          setSelectedContacts([]);
          fetchContacts();
        }}
      />
    </div>
  );
}
