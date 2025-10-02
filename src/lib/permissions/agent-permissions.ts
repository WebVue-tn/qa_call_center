/**
 * Agent Permission Definitions
 * These permissions control access to agent-specific features
 */

export interface Permission {
  code: string;
  name: string;
  description: string;
}

export const agentPermissions: Permission[] = [
  // Reservation Access
  {
    code: "agent.reservations.view_own",
    name: "View Own Reservations",
    description: "View reservations assigned to this agent",
  },
  {
    code: "agent.reservations.view_all",
    name: "View All Reservations",
    description: "View all reservations in the system",
  },
  {
    code: "agent.reservations.edit_own",
    name: "Edit Own Reservations",
    description: "Edit reservations assigned to this agent",
  },
  {
    code: "agent.reservations.add_notes",
    name: "Add Reservation Notes",
    description: "Add notes to reservations",
  },

  // Schedule & Calendar
  {
    code: "agent.schedule.view_own",
    name: "View Own Schedule",
    description: "View this agent's schedule and calendar",
  },
  {
    code: "agent.schedule.view_all",
    name: "View All Schedules",
    description: "View schedules for all agents",
  },
  {
    code: "agent.schedule.manage_availability",
    name: "Manage Availability",
    description: "Manage this agent's availability slots",
  },

  // Contact Information
  {
    code: "agent.contacts.view",
    name: "View Contact Information",
    description: "View contact information for assigned reservations",
  },
  {
    code: "agent.contacts.edit",
    name: "Edit Contact Information",
    description: "Edit contact information for assigned reservations",
  },

  // Route Planning (future)
  {
    code: "agent.routes.view",
    name: "View Routes",
    description: "View optimized routes and directions",
  },

  // Check-in/Check-out (future)
  {
    code: "agent.reservations.checkin",
    name: "Check-in to Reservations",
    description: "Mark arrival at reservation location",
  },
  {
    code: "agent.reservations.checkout",
    name: "Check-out from Reservations",
    description: "Mark completion of reservation",
  },

  // Analytics
  {
    code: "agent.analytics.view_own",
    name: "View Own Analytics",
    description: "View this agent's performance analytics",
  },

  // Team Collaboration (future)
  {
    code: "agent.team.view",
    name: "View Team",
    description: "View other team members and their availability",
  },
  {
    code: "agent.team.request_help",
    name: "Request Help",
    description: "Request assistance from other agents or supervisors",
  },
];

// Helper function to get permission by code
export function getAgentPermission(code: string): Permission | undefined {
  return agentPermissions.find((p) => p.code === code);
}

// Helper function to get all permission codes
export function getAllAgentPermissionCodes(): string[] {
  return agentPermissions.map((p) => p.code);
}

// Helper function to check if a permission code exists
export function isValidAgentPermission(code: string): boolean {
  return agentPermissions.some((p) => p.code === code);
}
