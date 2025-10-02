/**
 * Permission utility functions for checking user access
 */

import type { Types } from "mongoose";
import {
  getAllAdminPermissionCodes,
  isValidAdminPermission,
} from "~/lib/permissions/admin-permissions";
import {
  getAllAgentPermissionCodes,
  isValidAgentPermission,
} from "~/lib/permissions/agent-permissions";

/**
 * User interface with permission fields
 */
export interface UserWithPermissions {
  _id?: Types.ObjectId | string;
  isAdmin?: boolean;
  isAgent?: boolean;
  isTelephoniste?: boolean;
  adminRoles?: Array<{
    permissions: string[];
  }>;
  agentRoles?: Array<{
    permissions: string[];
  }>;
  adminDirectPermissions?: string[];
  agentDirectPermissions?: string[];
}

/**
 * Check if user has a specific admin permission
 * Checks both direct permissions and role-based permissions
 */
export function hasAdminPermission(
  user: UserWithPermissions,
  permission: string
): boolean {
  if (!user.isAdmin) return false;

  // Check for wildcard permission (superadmin)
  const directPerms = user.adminDirectPermissions || [];
  if (directPerms.includes("*")) return true;

  // Check direct permissions
  if (directPerms.includes(permission)) return true;

  // Check role permissions
  const roles = user.adminRoles || [];
  for (const role of roles) {
    if (role.permissions.includes("*")) return true;
    if (role.permissions.includes(permission)) return true;
  }

  return false;
}

/**
 * Check if user has any of the specified admin permissions
 */
export function hasAnyAdminPermission(
  user: UserWithPermissions,
  permissions: string[]
): boolean {
  return permissions.some((permission) => hasAdminPermission(user, permission));
}

/**
 * Check if user has all of the specified admin permissions
 */
export function hasAllAdminPermissions(
  user: UserWithPermissions,
  permissions: string[]
): boolean {
  return permissions.every((permission) =>
    hasAdminPermission(user, permission)
  );
}

/**
 * Check if user has a specific agent permission
 * Checks both direct permissions and role-based permissions
 */
export function hasAgentPermission(
  user: UserWithPermissions,
  permission: string
): boolean {
  if (!user.isAgent) return false;

  // Check for wildcard permission (super agent)
  const directPerms = user.agentDirectPermissions || [];
  if (directPerms.includes("*")) return true;

  // Check direct permissions
  if (directPerms.includes(permission)) return true;

  // Check role permissions
  const roles = user.agentRoles || [];
  for (const role of roles) {
    if (role.permissions.includes("*")) return true;
    if (role.permissions.includes(permission)) return true;
  }

  return false;
}

/**
 * Check if user has any of the specified agent permissions
 */
export function hasAnyAgentPermission(
  user: UserWithPermissions,
  permissions: string[]
): boolean {
  return permissions.some((permission) => hasAgentPermission(user, permission));
}

/**
 * Check if user has all of the specified agent permissions
 */
export function hasAllAgentPermissions(
  user: UserWithPermissions,
  permissions: string[]
): boolean {
  return permissions.every((permission) => hasAgentPermission(user, permission));
}

/**
 * Get all admin permissions for a user
 */
export function getUserAdminPermissions(user: UserWithPermissions): string[] {
  if (!user.isAdmin) return [];

  const permissions = new Set<string>();

  // Add direct permissions
  const directPerms = user.adminDirectPermissions || [];
  directPerms.forEach((p) => permissions.add(p));

  // If wildcard, return all permissions
  if (permissions.has("*")) {
    return getAllAdminPermissionCodes();
  }

  // Add role permissions
  const roles = user.adminRoles || [];
  for (const role of roles) {
    if (role.permissions.includes("*")) {
      return getAllAdminPermissionCodes();
    }
    role.permissions.forEach((p) => permissions.add(p));
  }

  return Array.from(permissions);
}

/**
 * Get all agent permissions for a user
 */
export function getUserAgentPermissions(user: UserWithPermissions): string[] {
  if (!user.isAgent) return [];

  const permissions = new Set<string>();

  // Add direct permissions
  const directPerms = user.agentDirectPermissions || [];
  directPerms.forEach((p) => permissions.add(p));

  // If wildcard, return all permissions
  if (permissions.has("*")) {
    return getAllAgentPermissionCodes();
  }

  // Add role permissions
  const roles = user.agentRoles || [];
  for (const role of roles) {
    if (role.permissions.includes("*")) {
      return getAllAgentPermissionCodes();
    }
    role.permissions.forEach((p) => permissions.add(p));
  }

  return Array.from(permissions);
}

/**
 * Check if user is a superadmin (has wildcard permission)
 */
export function isSuperAdmin(user: UserWithPermissions): boolean {
  if (!user.isAdmin) return false;

  const directPerms = user.adminDirectPermissions || [];
  if (directPerms.includes("*")) return true;

  const roles = user.adminRoles || [];
  return roles.some((role) => role.permissions.includes("*"));
}

/**
 * Get user's actor types (roles in the system)
 */
export function getUserActors(user: UserWithPermissions): string[] {
  const actors: string[] = [];

  if (user.isAdmin) actors.push("admin");
  if (user.isAgent) actors.push("agent");
  if (user.isTelephoniste) actors.push("telephoniste");

  return actors;
}

/**
 * Check if user has multiple actors (multi-role user)
 */
export function isMultiRoleUser(user: UserWithPermissions): boolean {
  return getUserActors(user).length > 1;
}

/**
 * Validate permission code for a specific actor
 */
export function isValidPermissionForActor(
  actor: "admin" | "agent",
  permissionCode: string
): boolean {
  if (permissionCode === "*") return true;

  if (actor === "admin") {
    return isValidAdminPermission(permissionCode);
  } else if (actor === "agent") {
    return isValidAgentPermission(permissionCode);
  }

  return false;
}
