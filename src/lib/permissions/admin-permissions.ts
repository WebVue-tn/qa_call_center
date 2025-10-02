/**
 * Admin Permission Definitions
 * These permissions control access to admin-specific features
 */

export interface Permission {
  code: string;
  name: string;
  description: string;
}

export const adminPermissions: Permission[] = [
  // Contact Management
  {
    code: "admin.contacts.view",
    name: "View Contacts",
    description: "View all contacts in the system",
  },
  {
    code: "admin.contacts.create",
    name: "Create Contacts",
    description: "Create new contacts",
  },
  {
    code: "admin.contacts.edit",
    name: "Edit Contacts",
    description: "Edit existing contacts",
  },
  {
    code: "admin.contacts.delete",
    name: "Delete Contacts",
    description: "Delete contacts from the system",
  },
  {
    code: "admin.contacts.import",
    name: "Import Contacts",
    description: "Import contacts via CSV or bulk upload",
  },
  {
    code: "admin.contacts.export",
    name: "Export Contacts",
    description: "Export contacts to CSV or other formats",
  },

  // Contact Assignment
  {
    code: "admin.contacts.assign",
    name: "Assign Contacts",
    description: "Assign contacts to telephonistes",
  },
  {
    code: "admin.contacts.unassign",
    name: "Unassign Contacts",
    description: "Remove contact assignments from telephonistes",
  },
  {
    code: "admin.contacts.move",
    name: "Move Contacts",
    description: "Move contacts between telephonistes",
  },

  // Contact Status Management
  {
    code: "admin.contact_statuses.view",
    name: "View Contact Statuses",
    description: "View all contact statuses",
  },
  {
    code: "admin.contact_statuses.create",
    name: "Create Contact Statuses",
    description: "Create new contact statuses",
  },
  {
    code: "admin.contact_statuses.edit",
    name: "Edit Contact Statuses",
    description: "Edit existing contact statuses",
  },
  {
    code: "admin.contact_statuses.delete",
    name: "Delete Contact Statuses",
    description: "Delete non-system contact statuses",
  },

  // Telephoniste Management
  {
    code: "admin.telephonistes.view",
    name: "View Telephonistes",
    description: "View telephoniste users and their performance",
  },
  {
    code: "admin.telephonistes.stats",
    name: "View Telephoniste Stats",
    description: "View telephoniste performance statistics and analytics",
  },
  {
    code: "admin.telephonistes.manage_assignments",
    name: "Manage Telephoniste Assignments",
    description: "Manage contact assignments for telephonistes",
  },

  // User Management
  {
    code: "admin.users.view",
    name: "View Users",
    description: "View all users in the system",
  },
  {
    code: "admin.users.create",
    name: "Create Users",
    description: "Create new user accounts",
  },
  {
    code: "admin.users.edit",
    name: "Edit Users",
    description: "Edit existing user accounts",
  },
  {
    code: "admin.users.delete",
    name: "Delete Users",
    description: "Delete user accounts",
  },
  {
    code: "admin.users.manage_roles",
    name: "Manage User Roles",
    description: "Assign or remove roles from users",
  },
  {
    code: "admin.users.manage_permissions",
    name: "Manage User Permissions",
    description: "Assign or remove direct permissions from users",
  },

  // Role Management
  {
    code: "admin.roles.view",
    name: "View Roles",
    description: "View all admin roles",
  },
  {
    code: "admin.roles.create",
    name: "Create Roles",
    description: "Create new admin roles",
  },
  {
    code: "admin.roles.edit",
    name: "Edit Roles",
    description: "Edit existing admin roles",
  },
  {
    code: "admin.roles.delete",
    name: "Delete Roles",
    description: "Delete admin roles",
  },

  // Reservation Management
  {
    code: "admin.reservations.view",
    name: "View Reservations",
    description: "View all reservations in the system",
  },
  {
    code: "admin.reservations.edit",
    name: "Edit Reservations",
    description: "Edit existing reservations",
  },
  {
    code: "admin.reservations.delete",
    name: "Delete Reservations",
    description: "Delete reservations",
  },
  {
    code: "admin.reservations.assign_agent",
    name: "Assign Agents to Reservations",
    description: "Assign or reassign agents to reservations",
  },

  // Analytics & Reporting
  {
    code: "admin.analytics.view",
    name: "View Analytics",
    description: "View system-wide analytics and reports",
  },
  {
    code: "admin.analytics.export",
    name: "Export Analytics",
    description: "Export analytics data and reports",
  },

  // History & Audit
  {
    code: "admin.history.view",
    name: "View History",
    description: "View audit trails and history for all records",
  },

  // System Settings
  {
    code: "admin.settings.view",
    name: "View Settings",
    description: "View system settings and configuration",
  },
  {
    code: "admin.settings.edit",
    name: "Edit Settings",
    description: "Modify system settings and configuration",
  },
];

// Helper function to get permission by code
export function getAdminPermission(code: string): Permission | undefined {
  return adminPermissions.find((p) => p.code === code);
}

// Helper function to get all permission codes
export function getAllAdminPermissionCodes(): string[] {
  return adminPermissions.map((p) => p.code);
}

// Helper function to check if a permission code exists
export function isValidAdminPermission(code: string): boolean {
  return adminPermissions.some((p) => p.code === code);
}
