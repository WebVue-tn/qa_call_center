# Project Requirements: Contact Management System (Phase 0)

## Original Requirements

### Context

Analyze the amq_partners platform's (`/home/carim/Github/amq_partners`) recontact reservation & reservations system and the relation between them, APIs, models and UI involved.

We're going to copy the way amq_partners does the recontact module and implement it here with a few key differences.

### Key Differences from amq_partners

**In amq_partners:**
- System handles **recontact** - contacting existing customers who already have a prior reservation
- Full customer information and reservation history available

**In this platform (vibe-kanban):**
- No recontact - we start with a **phone number** and make **first contact**
- No prospect's prior reservation and info - all we have is a **phone number** and **maybe a name**

### User Roles & Navigation

We have three actors in the system:

1. **Admin**
   - Have access to admin dashboard with its own roles and permissions

2. **Agent**
   - Have access to agent dashboard with its own roles and permissions

3. **Telephoniste**
   - Straightforward role with access to telephoniste view
   - May later have roles and permissions but for now keep it simple

**Multi-Role Navigation:**
- When a user connects who is **only a telephoniste**: automatically redirect to telephoniste view
- When a user is a **telephoniste AND something else**, OR is **not a telephoniste**:
  - Let them choose which view they want to navigate to on login
  - Options: Dashboard or Telephoniste view
- Users should be able to **easily navigate between views** through the app bar
- Each actor should have their own **completely separate view**
- Easy to add more actors to the system later

### Database Structure

#### Users Collection
```
name
email
password
isTelephoniste
isAdmin
adminRoles: [roleId]
adminDirectPermissions: [list of permissions from admin permissions ts file]
isAgent
agentRoles: [roleId]
agentDirectPermissions: [list of permissions from agent permissions ts file]
```

#### Agent Profiles Collection
Track users who are assigned to reservations.
```
userId
availability: list of datetime ranges
```

#### Roles Collection
```
actor: admin or agent
name
code
permissions: [list of permissions from permissions.ts file]
```

#### Permission TS Files
List of permissions with name, code and description; available both to the routes and the UI.

#### Contacts Collection
Main collection for keeping track of potential customers.
```
phone: unique, normalized to 10 digits
name? (optional)
email? (optional)
address? (optional)
postalCode?: should be a valid Canadian postal code (e.g., "A1A 1A1")
status: contactStatusId
statusHistory: history of status changes and who did the change and when
assignedToTelephonisteId?: ref userId (telephoniste this contact is assigned to)
assignmentHistory: contact can be assigned, unassigned and moved from a userId to another - keep track of that
callHistory: history of Twilio calls and who did the call and when
reservationId?: defaults to null but gets a ref to reservations if the contact books a reservation
isConverted: defaults to false; whether the contact has booked a reservation
convertedBy?: who did the conversion
```

#### Contact Statuses Collection
```
name: display name
code
color: hex color to control how it shows up in lists
```

#### Reservations Collection
```
date: the date the reservation is going to take place
  - Set when telephoniste converts a contact
  - Can only be set to a datetime where an agent is available
  - Agent doesn't have an existing reservation at that time
  - Account for time between reservations (agent has to move around)
assignedToAgentId: ref userId (agent this reservation is assigned to)
```

### UI Requirements

**Need the UI and logic for:**

1. **Admin Views** (adapted from amq_partners)
   - `/recontact-reservations` → adapted for new contacts workflow
   - `/recontact-reservations/telephoniste-management` → telephoniste management dashboard

2. **Telephoniste View**
   - `/telephoniste-recontacts` → adapted for new requirements and data

3. **Agent View**
   - Leave empty for now (just a welcome message)
   - Will be filled in later phases

### Implementation Approach

1. **Start with:** Write a comprehensive plan in an MD file
2. **Then:** Execute tasks according to the plan

---

## Additional Requirements: History System

### Overview

Implement a comprehensive, reusable history/audit system across all collections.

### Requirements

**Each collection should have a `history` field that logs:**

1. **Action Type**
   - Creation
   - Update
   - Deletion

2. **Metadata**
   - Timestamp of the action
   - User who performed the action (userId)
   - **Complete snapshot of the user document** who performed the action

3. **Change Tracking**
   - Old values (before the change)
   - New values (after the change)

### System Characteristics

- **Reusable:** Should be implemented as a reusable utility/middleware that can be applied across all APIs
- **Automatic:** Should automatically capture changes without requiring manual logging in each endpoint
- **Complete:** Should capture the full user context at the time of action
- **Queryable:** History should be easily queryable for audit trails and debugging

### Implementation Notes

- This should be a centralized system that can be imported and used across all API routes
- Should handle all CRUD operations uniformly
- Should be efficient and not significantly impact performance
- Should preserve data integrity (immutable history records)

---

## Permission System Clarification

**No need for a shared permissions file.**

Only need:
- `admin-permissions.ts` - For admin-specific permissions
- `agent-permissions.ts` - For agent-specific permissions

Each permission file should contain permissions relevant only to that actor.

---

## Success Criteria

### Phase 0 Deliverables

1. ✅ Comprehensive implementation plan
2. ✅ Project requirements documentation (this file)
3. Database schema with all models including history system
4. Reusable history/audit middleware
5. Working authentication with role-based access
6. Admin contact management UI
7. Admin telephoniste management UI
8. Telephoniste contact interface
9. All API endpoints functional with history tracking
10. Basic error handling and validation
11. Documentation for future phases

### Functional Requirements

**Telephoniste must be able to:**
- Log in and see assigned contacts
- Make calls through Twilio integration
- Update contact status and add notes
- Convert contact to reservation
- View today's activity

**Admin must be able to:**
- View all contacts in filterable table
- Assign contacts to telephonistes
- View telephoniste performance stats
- Access full audit history of changes

**Agent must:**
- See placeholder view with navigation to other roles if applicable

**System must:**
- Track complete history of all changes
- Preserve user snapshots at time of action
- Provide audit trail for compliance
- Support multi-role navigation
- Scale efficiently with large contact lists

---

## Technical Constraints

1. **Tech Stack:** Next.js 15, TypeScript, MongoDB, NextAuth.js v5, Tailwind CSS, shadcn/ui
2. **Phone Format:** Canadian phone numbers (10 digits normalized)
3. **Postal Code:** Canadian postal codes only ("A1A 1A1" format)
4. **Calling:** Twilio integration required
5. **History:** Must be reusable across all APIs
6. **Permissions:** Actor-based (admin, agent) - no shared permissions

---

## Out of Scope for Phase 0

- Agent dashboard implementation (beyond placeholder)
- Advanced analytics and reporting
- Automated assignment rules
- SMS/Email integration
- Lead scoring
- Revenue attribution
- Route optimization for agents
