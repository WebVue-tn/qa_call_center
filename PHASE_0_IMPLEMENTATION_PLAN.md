# Phase 0 Implementation Plan: Contact Management System

## Executive Summary

This document outlines the implementation plan for a contact-first telephonist system adapted from the amq_partners recontact reservation platform. The new system will handle cold calling workflows starting with phone numbers, whereas the amq_partners system handles re-contacting existing customers with prior reservations.

**Key Enhancement:** A comprehensive, reusable history/audit system will track all CRUD operations across all collections, capturing timestamps, user snapshots, and old/new values for complete audit trails.

## System Analysis: amq_partners Recontact Platform

### Core Architecture

#### 1. Data Models

**RecontactReservation Model** (`RecontactReservation.ts`)
```typescript
{
  recontactDate?: Date,
  statusId: ObjectId (ref: RecontactReservationStatus),
  reservationId: ObjectId (ref: Reservation),
  assignedTo?: ObjectId (ref: User),
  isConverted: boolean,
  statusHistory: [{
    statusId: ObjectId,
    updatedBy: ObjectId,
    updatedAt: Date
  }],
  notes: [{
    content: string,
    createdBy: ObjectId,
    createdAt: Date
  }]
}
```

**RecontactReservationStatus Model** (`RecontactReservationStatus.ts`)
```typescript
{
  name: string,
  code: string,
  color: string,
  order: number,
  excludeFromCallList: boolean,
  isSystemStatus: boolean,
  isDeletable: boolean
}
```

#### 2. Key Features Analysis

**Admin View** (`/recontact-reservations`)
- Filterable table of all recontact reservations
- Status management with color-coded badges
- Assignment management (assign/move/unassign to telephonistes)
- Conversion tracking to new reservations
- Notes management
- Date range filtering
- Export functionality
- Analytics and reporting

**Telephoniste Management** (`/recontact-reservations/telephoniste-management`)
- Per-telephoniste performance dashboard
- Date-filtered statistics
- Conversion rate tracking (presence vs sales)
- Status breakdown by telephoniste
- Assignment history
- Global overview of all telephonistes
- Call analytics and calendar views

**Telephoniste View** (`/telephoniste-recontacts`)
- Card-based single-contact interface
- Random contact assignment with intelligent prioritization:
  - Status order priority
  - Uncalled contacts first
  - Today's recontacts prioritized
  - Excludes already-worked-today contacts
- Integrated Twilio calling interface
- Real-time status updates
- Note-taking capability
- Call history tracking
- Conversion dialog to create new reservations
- Activity history panel showing today's work
- Back/forward navigation between contacts

#### 3. API Architecture

**Key Endpoints:**
- `GET /api/recontact-reservations` - List with filtering, pagination
- `GET /api/telephoniste-recontacts/random` - Smart contact assignment
- `PATCH /api/recontact-reservations/[id]/status` - Update status
- `POST /api/recontact-reservations/[id]/notes` - Add notes
- `POST /api/recontact-reservations/assign` - Bulk assignment
- `POST /api/recontact-reservations/move` - Move between telephonistes
- `GET /api/telephoniste-stats` - Performance metrics

#### 4. Permission System
- `canUserAccessRecontactReservations` - Admin access
- `canUserViewAssignedRecontact` - Telephoniste access
- `canUserAssignRecontact` - Assignment permissions

---

## Adapted System: vibe-kanban Contact Platform

### Key Differences from amq_partners

| Aspect | amq_partners | vibe-kanban |
|--------|--------------|-------------|
| **Starting Point** | Existing reservation with customer data | Phone number only (maybe name) |
| **Primary Action** | Re-contact existing customer | Make first contact |
| **Data Richness** | Full customer profile, preferences, visit history | Minimal initial data |
| **Conversion** | Recontact → New Reservation | Contact → Reservation |
| **Reservation Link** | Always has prior reservationId | Created on first conversion |
| **User Roles** | Complex role system | Simplified: admin, agent, telephoniste |

### Database Schema

All collections include a comprehensive history system for audit trails. See "History System Architecture" section below for implementation details.

#### 1. Users Collection
```typescript
{
  name: string,
  email: string (unique),
  password: string (hashed),

  // Role flags
  isTelephoniste: boolean,
  isAdmin: boolean,
  isAgent: boolean,

  // Admin permissions
  adminRoles: [ObjectId] (ref: Role where actor='admin'),
  adminDirectPermissions: [string], // from admin-permissions.ts

  // Agent permissions
  agentRoles: [ObjectId] (ref: Role where actor='agent'),
  agentDirectPermissions: [string], // from agent-permissions.ts

  // Audit fields
  createdBy?: ObjectId (ref: User),
  updatedBy?: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date,

  // History tracking (see History System section)
  history: [HistoryEntry]
}
```

#### 2. AgentProfile Collection
```typescript
{
  userId: ObjectId (ref: User, unique),
  availability: [{
    startDateTime: Date,
    endDateTime: Date,
    isRecurring: boolean,
    recurringPattern?: {
      frequency: 'daily' | 'weekly',
      daysOfWeek?: [0-6], // for weekly
      endDate?: Date
    }
  }],

  // Audit fields
  createdBy?: ObjectId (ref: User),
  updatedBy?: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date,

  // History tracking
  history: [HistoryEntry]
}
```

#### 3. Role Collection
```typescript
{
  actor: 'admin' | 'agent',
  name: string,
  code: string (unique per actor),
  permissions: [string], // from respective permissions.ts file

  // Audit fields
  createdBy?: ObjectId (ref: User),
  updatedBy?: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date,

  // History tracking
  history: [HistoryEntry]
}
```

#### 4. ContactStatus Collection
```typescript
{
  name: string (unique),
  code: string (unique),
  color: string (#RRGGBB hex),
  order: number, // for display ordering
  excludeFromCallList: boolean, // don't show in telephoniste random feed
  isSystemStatus: boolean, // can't be edited/deleted
  isDeletable: boolean,

  // Audit fields
  createdBy?: ObjectId (ref: User),
  updatedBy?: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date,

  // History tracking
  history: [HistoryEntry]
}
```

**Default Statuses:**
- `new` - New contact (order: 0, system status)
- `attempted` - Called but no answer (order: 10)
- `callback_requested` - Callback scheduled (order: 20)
- `in_discussion` - Active conversation (order: 30)
- `interested` - Showed interest (order: 40)
- `not_interested` - Not interested (order: 50, exclude from call list)
- `converted` - Booked reservation (order: 100, system status, exclude from call list)
- `do_not_call` - Do not call (order: 1000, exclude from call list)

#### 5. Contact Collection
```typescript
{
  phone: string (unique, indexed), // normalized to 10 digits
  name?: string,
  email?: string,
  address?: string,
  postalCode?: string, // validated Canadian format "A1A 1A1"
  city?: string,

  // Status tracking
  statusId: ObjectId (ref: ContactStatus),
  statusHistory: [{
    statusId: ObjectId,
    updatedBy: ObjectId (ref: User),
    updatedAt: Date,
    note?: string
  }],

  // Assignment
  assignedToTelephonisteId?: ObjectId (ref: User),
  assignmentHistory: [{
    action: 'assigned' | 'unassigned' | 'moved',
    fromUserId?: ObjectId,
    toUserId?: ObjectId,
    assignedBy: ObjectId,
    assignedAt: Date
  }],

  // Call tracking
  callHistory: [{
    callSid: string, // Twilio call ID
    direction: 'inbound' | 'outbound',
    duration?: number,
    status: string, // Twilio call status
    calledBy?: ObjectId (ref: User),
    calledAt: Date
  }],

  // Notes
  notes: [{
    content: string,
    createdBy: ObjectId (ref: User),
    createdAt: Date
  }],

  // Conversion tracking
  reservationId?: ObjectId (ref: Reservation),
  isConverted: boolean (default: false),
  convertedBy?: ObjectId (ref: User),
  convertedAt?: Date,

  // Metadata
  createdBy?: ObjectId,
  updatedBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date,

  // History tracking
  history: [HistoryEntry]
}
```

**Indexes:**
```typescript
- phone: unique
- statusId: 1
- assignedToTelephonisteId: 1
- isConverted: 1
- createdAt: -1
- statusId + assignedToTelephonisteId: compound
```

#### 6. Reservation Collection
```typescript
{
  contactId: ObjectId (ref: Contact),
  date: Date, // appointment date/time
  assignedToAgentId: ObjectId (ref: User),
  status: string, // reservation status

  // Customer info (copied from contact at conversion)
  customerInfo: {
    name: string,
    phone: string,
    email?: string,
    address?: string,
    postalCode?: string,
    city?: string
  },

  notes: [{
    content: string,
    createdBy: ObjectId,
    createdAt: Date
  }],

  // Audit fields
  createdBy: ObjectId,
  updatedBy?: ObjectId,
  createdAt: Date,
  updatedAt: Date,

  // History tracking
  history: [HistoryEntry]
}
```

---

## History System Architecture

### Overview

A comprehensive, reusable audit trail system that automatically tracks all CRUD operations across all collections.

### HistoryEntry Schema

```typescript
interface HistoryEntry {
  action: 'create' | 'update' | 'delete',
  timestamp: Date,
  userId: ObjectId (ref: User),

  // Complete snapshot of user at time of action
  userSnapshot: {
    _id: ObjectId,
    name: string,
    email: string,
    isTelephoniste: boolean,
    isAdmin: boolean,
    isAgent: boolean,
    // All relevant user fields at time of action
  },

  // Changes tracking
  changes?: {
    field: string,
    oldValue: any,
    newValue: any
  }[],

  // For create actions - store initial document
  initialDocument?: object,

  // For delete actions - store final document
  deletedDocument?: object,

  // Optional metadata
  metadata?: {
    ipAddress?: string,
    userAgent?: string,
    requestId?: string
  }
}
```

### Implementation Components

#### 1. History Middleware (`src/lib/middleware/history-middleware.ts`)

```typescript
import { Schema, Document, Model } from 'mongoose';
import User from '@/lib/db/models/User';

interface HistoryOptions {
  excludeFields?: string[]; // Fields to exclude from tracking
  captureMetadata?: boolean;
}

/**
 * Mongoose plugin to automatically track history on all CRUD operations
 */
export function historyPlugin(schema: Schema, options: HistoryOptions = {}) {
  const { excludeFields = ['history', 'updatedAt'], captureMetadata = false } = options;

  // Add history field to schema
  schema.add({
    history: [{
      action: {
        type: String,
        enum: ['create', 'update', 'delete'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now,
        required: true
      },
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      userSnapshot: {
        type: Schema.Types.Mixed
      },
      changes: [{
        field: String,
        oldValue: Schema.Types.Mixed,
        newValue: Schema.Types.Mixed
      }],
      initialDocument: Schema.Types.Mixed,
      deletedDocument: Schema.Types.Mixed,
      metadata: {
        ipAddress: String,
        userAgent: String,
        requestId: String
      }
    }]
  });

  // Pre-save hook for create and update
  schema.pre('save', async function(next) {
    const doc = this as any;

    // Get current user from context (set by API route)
    const userId = doc._currentUserId;
    if (!userId) {
      return next(); // Skip if no user context
    }

    // Fetch user snapshot
    const userSnapshot = await User.findById(userId).lean();
    if (!userSnapshot) {
      return next();
    }

    // Remove sensitive fields from snapshot
    delete userSnapshot.password;

    const isNew = doc.isNew;

    if (isNew) {
      // CREATE action
      const initialDoc = doc.toObject();
      delete initialDoc.history;

      doc.history.push({
        action: 'create',
        timestamp: new Date(),
        userId,
        userSnapshot,
        initialDocument: initialDoc
      });
    } else {
      // UPDATE action
      const modifiedPaths = doc.modifiedPaths();
      const changes = [];

      for (const path of modifiedPaths) {
        if (excludeFields.includes(path)) continue;

        changes.push({
          field: path,
          oldValue: doc._original ? doc._original[path] : undefined,
          newValue: doc[path]
        });
      }

      if (changes.length > 0) {
        doc.history.push({
          action: 'update',
          timestamp: new Date(),
          userId,
          userSnapshot,
          changes
        });
      }
    }

    next();
  });

  // Post-init hook to capture original values
  schema.post('init', function() {
    (this as any)._original = this.toObject();
  });

  // Pre-remove hook for delete
  schema.pre('remove', async function(next) {
    const doc = this as any;

    const userId = doc._currentUserId;
    if (!userId) {
      return next();
    }

    const userSnapshot = await User.findById(userId).lean();
    if (!userSnapshot) {
      return next();
    }

    delete userSnapshot.password;

    const deletedDoc = doc.toObject();
    delete deletedDoc.history;

    doc.history.push({
      action: 'delete',
      timestamp: new Date(),
      userId,
      userSnapshot,
      deletedDocument: deletedDoc
    });

    next();
  });

  // Add method to set current user context
  schema.methods.setCurrentUser = function(userId: string) {
    (this as any)._currentUserId = userId;
    return this;
  };
}
```

#### 2. API Helper Utility (`src/lib/utils/history-utils.ts`)

```typescript
import { Document } from 'mongoose';

/**
 * Helper to wrap model operations with user context
 */
export class HistoryContext {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  /**
   * Set user context on document
   */
  withUser<T extends Document>(doc: T): T {
    (doc as any)._currentUserId = this.userId;
    return doc;
  }

  /**
   * Create a new document with user context
   */
  async create<T extends Document>(Model: any, data: any): Promise<T> {
    const doc = new Model(data);
    this.withUser(doc);
    doc.createdBy = this.userId;
    doc.updatedBy = this.userId;
    await doc.save();
    return doc;
  }

  /**
   * Update existing document with user context
   */
  async update<T extends Document>(doc: T, updates: any): Promise<T> {
    Object.assign(doc, updates);
    (doc as any).updatedBy = this.userId;
    this.withUser(doc);
    await doc.save();
    return doc;
  }

  /**
   * Delete document with user context
   */
  async delete<T extends Document>(doc: T): Promise<T> {
    this.withUser(doc);
    await (doc as any).remove();
    return doc;
  }

  /**
   * Bulk update with history tracking
   */
  async bulkUpdate<T extends Document>(
    Model: any,
    filter: any,
    updates: any
  ): Promise<void> {
    const docs = await Model.find(filter);

    for (const doc of docs) {
      await this.update(doc, updates);
    }
  }
}

/**
 * Helper to extract user ID from session in API routes
 */
export function createHistoryContext(session: any): HistoryContext | null {
  if (!session?.user?.id) return null;
  return new HistoryContext(session.user.id);
}
```

#### 3. Usage in API Routes

```typescript
// Example: /api/contacts/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/server/auth/config';
import Contact from '@/lib/db/models/Contact';
import { createHistoryContext } from '@/lib/utils/history-utils';
import dbConnect from '@/lib/db';

// PATCH - Update contact
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const historyCtx = createHistoryContext(session);
    if (!historyCtx) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const contact = await Contact.findById(params.id);
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }

    const body = await request.json();

    // Update with automatic history tracking
    await historyCtx.update(contact, body);

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### History Query Utilities

```typescript
// src/lib/utils/history-query-utils.ts

/**
 * Get history for a specific document
 */
export async function getDocumentHistory(
  Model: any,
  documentId: string,
  options: {
    limit?: number,
    offset?: number,
    action?: 'create' | 'update' | 'delete',
    userId?: string,
    dateFrom?: Date,
    dateTo?: Date
  } = {}
) {
  const doc = await Model.findById(documentId);
  if (!doc) return [];

  let history = doc.history || [];

  // Filter by action
  if (options.action) {
    history = history.filter((h: any) => h.action === options.action);
  }

  // Filter by user
  if (options.userId) {
    history = history.filter((h: any) =>
      h.userId?.toString() === options.userId
    );
  }

  // Filter by date range
  if (options.dateFrom) {
    history = history.filter((h: any) => h.timestamp >= options.dateFrom);
  }
  if (options.dateTo) {
    history = history.filter((h: any) => h.timestamp <= options.dateTo);
  }

  // Sort by timestamp descending
  history.sort((a: any, b: any) => b.timestamp - a.timestamp);

  // Pagination
  const offset = options.offset || 0;
  const limit = options.limit || history.length;

  return history.slice(offset, offset + limit);
}

/**
 * Get all changes made by a specific user
 */
export async function getUserActivity(
  userId: string,
  options: {
    collections?: string[],
    dateFrom?: Date,
    dateTo?: Date,
    limit?: number
  } = {}
) {
  // Aggregate across all collections
  // Implementation would query each model and aggregate results
}
```

### API Endpoints for History

```typescript
// GET /api/history/[model]/[id] - Get history for specific document
// GET /api/history/user/[userId] - Get all activity by user
// GET /api/history/recent - Get recent changes across system
```

---

## Implementation Plan

### Phase 0.1: History System & Core Infrastructure

**Tasks:**
1. Create history system components:
   - `src/lib/middleware/history-middleware.ts` - Mongoose plugin for automatic history tracking
   - `src/lib/utils/history-utils.ts` - HistoryContext helper class
   - `src/lib/utils/history-query-utils.ts` - Query utilities for history data
   - `src/types/history.ts` - TypeScript interfaces for history entries

2. Create Mongoose models with history plugin:
   - `src/lib/db/models/User.ts`
   - `src/lib/db/models/AgentProfile.ts`
   - `src/lib/db/models/Role.ts`
   - `src/lib/db/models/ContactStatus.ts`
   - `src/lib/db/models/Contact.ts`
   - `src/lib/db/models/Reservation.ts`
   - All models should apply `historyPlugin()`

3. Create permission files:
   - `src/lib/permissions/admin-permissions.ts`
   - `src/lib/permissions/agent-permissions.ts`

4. Seed initial data:
   - Default contact statuses
   - Default admin role with all permissions
   - Sample admin user

5. Create history API routes:
   - `GET /api/history/[model]/[id]` - Get document history
   - `GET /api/history/user/[userId]` - Get user activity
   - `GET /api/history/recent` - Recent system changes

### Phase 0.2: Authentication & Permission System

**Tasks:**
1. Update NextAuth.js configuration:
   - Add user role fields to session
   - Add callbacks for multi-role support

2. Create permission utilities:
   - `src/lib/utils/permission-utils.ts`
   - Permission checking functions per actor
   - Server-side permission helpers

3. Create middleware for role-based routing:
   - Redirect telephoniste-only users to telephoniste view
   - Multi-role selection page

### Phase 0.3: Admin Dashboard - Contact Management

**Adapt from:** `/recontact-reservations/page.tsx`

**New route:** `/admin/contacts`

**Features:**
1. Contact table with columns:
   - Phone number
   - Name
   - Email
   - Status (badge with color)
   - Assigned Telephoniste
   - Last Call Date
   - Call Count
   - Actions (view, edit, assign, convert)

2. Filters:
   - Status filter (multi-select)
   - Assignment filter (assigned/unassigned/specific user)
   - Date range (created date)
   - Search (phone, name, email)
   - Conversion status (converted/not converted)

3. Bulk actions:
   - Assign to telephoniste
   - Move between telephonistes
   - Unassign
   - Update status
   - Export to CSV

4. Dialogs:
   - Contact details & edit
   - Notes management
   - Assignment management
   - Conversion to reservation

### Phase 0.4: Admin Dashboard - Telephoniste Management

**Adapt from:** `/recontact-reservations/telephoniste-management/page.tsx`

**New route:** `/admin/telephoniste-management`

**Features:**
1. Telephoniste list with stats:
   - Total assigned contacts
   - Calls made (today, this week, this month)
   - Conversion rate
   - Status breakdown

2. Date range filter (affects all stats)

3. Per-telephoniste tabs:
   - Overview (stats cards)
   - Contact list (assigned to this user)
   - Call analytics
   - Conversion calendar

4. Global analytics:
   - All telephonistes comparison
   - Team performance metrics
   - Assignment history

### Phase 0.5: Telephoniste View - Contact Interface

**Adapt from:** `/telephoniste-recontacts/page.tsx`

**New route:** `/telephoniste`

**Features:**
1. Card-based single contact view:
   - Contact information (editable inline)
   - Phone number (prominent, with call button)
   - Current status with visual badge
   - Call history for this contact
   - Notes section

2. Smart contact assignment algorithm:
   ```
   Priority:
   1. Status order (lower = higher priority)
   2. Uncalled contacts first (callHistory.length === 0)
   3. Exclude contacts worked today by this user
   4. Exclude statuses with excludeFromCallList = true
   5. Random within each priority group
   ```

3. Integrated Twilio calling:
   - One-click call button
   - Call duration tracker
   - Automatic call log creation

4. Quick actions:
   - Update status
   - Add note
   - Convert to reservation
   - Next contact
   - Back to previous

5. Today's activity panel:
   - Contacts worked today
   - Calls made today
   - Conversions today
   - Click to reload specific contact

6. Conversion dialog:
   - Select reservation date (check agent availability)
   - Select assigned agent
   - Add initial notes
   - Creates Reservation and updates Contact

### Phase 0.6: API Routes

**Contact Management:**
- `GET /api/contacts` - List with filtering/pagination
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get single contact
- `PATCH /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Soft delete contact

**Contact Status:**
- `PATCH /api/contacts/[id]/status` - Update status
- `POST /api/contacts/[id]/notes` - Add note

**Assignment:**
- `POST /api/contacts/assign` - Bulk assign to telephoniste
- `POST /api/contacts/move` - Move between telephonistes
- `POST /api/contacts/unassign` - Unassign from telephoniste

**Telephoniste:**
- `GET /api/telephoniste/contacts/random` - Get next contact
- `GET /api/telephoniste/contacts/activity-history` - Today's activity
- `GET /api/telephoniste/stats` - Performance stats

**Call Tracking:**
- `POST /api/contacts/[id]/call-log` - Log a call
- `GET /api/contacts/[id]/call-history` - Get call history

**Conversion:**
- `POST /api/contacts/[id]/convert` - Convert to reservation

**Admin Stats:**
- `GET /api/admin/telephoniste-stats` - All telephonistes stats
- `GET /api/admin/contact-stats` - Contact analytics

### Phase 0.7: Agent Dashboard

**New route:** `/agent`

**Initial implementation:**
- Simple welcome message
- "Coming soon" placeholder
- User profile display
- Navigation to other views if multi-role

**Future features** (not in Phase 0):
- Calendar of assigned reservations
- Daily schedule
- Route optimization
- Customer details for appointments

---

## UI/UX Adaptations

### Telephoniste View Design Principles

1. **Simplicity First:** Since starting with minimal data (just phone number), UI should be clean and uncluttered

2. **Progressive Disclosure:** As more info is gathered (name, email, address), show it inline

3. **Call-Centric:** Large, prominent call button. Call status always visible

4. **Quick Status Updates:** One-click status changes with visual feedback

5. **Note-Taking:** Fast, easy note-taking during/after calls

6. **Flow Optimization:** Minimize clicks between contacts. "Next" button always accessible

### Admin View Design Principles

1. **Data-Dense Tables:** Show maximum relevant info in list view

2. **Powerful Filters:** Quick access to different contact segments

3. **Bulk Operations:** Efficient telephoniste workload management

4. **Analytics Focus:** Visual representations of team performance

---

## Technical Considerations

### Phone Number Normalization

**Storage:** 10 digits only (e.g., "5141234567")
**Display:** Various formats for UI
**Twilio:** Prepend "+1" for API calls

```typescript
function normalizePhone(input: string): string {
  return input.replace(/\D/g, '').slice(-10);
}

function formatPhoneDisplay(phone: string): string {
  // "5141234567" → "(514) 123-4567"
  return `(${phone.slice(0,3)}) ${phone.slice(3,6)}-${phone.slice(6)}`;
}

function formatPhoneTwilio(phone: string): string {
  // "5141234567" → "+15141234567"
  return `+1${phone}`;
}
```

### Canadian Postal Code Validation

```typescript
function validatePostalCode(code: string): boolean {
  const regex = /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i;
  return regex.test(code);
}

function normalizePostalCode(code: string): string {
  // "h3a1b2" → "H3A 1B2"
  const clean = code.replace(/\s/g, '').toUpperCase();
  return `${clean.slice(0,3)} ${clean.slice(3)}`;
}
```

### Agent Availability Checking

When converting a contact to reservation, must check:
1. Agent has availability slot covering requested time
2. Agent doesn't have conflicting reservation
3. Account for travel time between appointments (configurable buffer)

```typescript
async function isAgentAvailable(
  agentId: string,
  requestedDate: Date,
  durationMinutes: number = 60,
  bufferMinutes: number = 30
): Promise<boolean> {
  // 1. Check availability slots
  // 2. Check existing reservations with buffer
  // 3. Return true only if both pass
}
```

### Call Logging Integration

Sync with Twilio webhooks:
- Call initiated
- Call answered
- Call ended
- Call duration

Store in Contact.callHistory for quick access

---

## Migration & Seeding Strategy

### Initial Seed Data

**Contact Statuses:**
```javascript
[
  { name: 'New', code: 'new', color: '#3B82F6', order: 0, isSystemStatus: true },
  { name: 'Attempted', code: 'attempted', color: '#F59E0B', order: 10 },
  { name: 'Callback Requested', code: 'callback_requested', color: '#8B5CF6', order: 20 },
  { name: 'In Discussion', code: 'in_discussion', color: '#06B6D4', order: 30 },
  { name: 'Interested', code: 'interested', color: '#10B981', order: 40 },
  { name: 'Not Interested', code: 'not_interested', color: '#6B7280', order: 50, excludeFromCallList: true },
  { name: 'Converted', code: 'converted', color: '#22C55E', order: 100, isSystemStatus: true, excludeFromCallList: true },
  { name: 'Do Not Call', code: 'do_not_call', color: '#EF4444', order: 1000, excludeFromCallList: true }
]
```

**Sample Admin User:**
```javascript
{
  name: 'System Admin',
  email: 'admin@vibe-kanban.com',
  password: 'hashed_password',
  isAdmin: true,
  isAgent: false,
  isTelephoniste: false,
  adminDirectPermissions: ['*'] // All permissions
}
```

### Bulk Contact Import

Create admin tool to import CSV of phone numbers:
```csv
phone,name,email,postalCode,assignTo
5141234567,John Doe,john@example.com,H3A 1B2,telephoniste1@company.com
4381234567,Jane Smith,,,telephoniste2@company.com
```

---

## File Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── contacts/
│   │   │   ├── page.tsx                 # Main contact list
│   │   │   └── components/
│   │   │       ├── contact-table.tsx
│   │   │       ├── contact-filters.tsx
│   │   │       ├── contact-details-dialog.tsx
│   │   │       ├── contact-assignment-dialog.tsx
│   │   │       ├── contact-notes-dialog.tsx
│   │   │       └── contact-conversion-dialog.tsx
│   │   └── telephoniste-management/
│   │       ├── page.tsx                 # Telephoniste stats dashboard
│   │       └── components/
│   │           ├── telephoniste-list.tsx
│   │           ├── telephoniste-stats.tsx
│   │           ├── telephoniste-tabs.tsx
│   │           └── call-analytics.tsx
│   ├── telephoniste/
│   │   ├── page.tsx                     # Main telephoniste interface
│   │   └── components/
│   │       ├── contact-card.tsx
│   │       ├── call-interface.tsx
│   │       ├── status-selector.tsx
│   │       ├── notes-panel.tsx
│   │       ├── activity-history-panel.tsx
│   │       └── conversion-dialog.tsx
│   ├── agent/
│   │   └── page.tsx                     # Placeholder agent view
│   └── api/
│       ├── contacts/
│       │   ├── route.ts                 # GET, POST
│       │   ├── [id]/
│       │   │   ├── route.ts             # GET, PATCH, DELETE
│       │   │   ├── status/route.ts      # PATCH
│       │   │   ├── notes/route.ts       # POST
│       │   │   ├── call-log/route.ts    # POST
│       │   │   ├── call-history/route.ts # GET
│       │   │   └── convert/route.ts     # POST
│       │   ├── assign/route.ts          # POST (bulk)
│       │   ├── move/route.ts            # POST
│       │   └── unassign/route.ts        # POST
│       ├── telephoniste/
│       │   ├── contacts/
│       │   │   ├── random/route.ts      # GET
│       │   │   └── activity-history/route.ts # GET
│       │   └── stats/route.ts           # GET
│       ├── admin/
│       │   ├── telephoniste-stats/route.ts # GET
│       │   └── contact-stats/route.ts   # GET
│       └── history/
│           ├── [model]/
│           │   └── [id]/route.ts        # GET - Document history
│           ├── user/
│           │   └── [userId]/route.ts    # GET - User activity
│           └── recent/route.ts          # GET - Recent changes
├── lib/
│   ├── db/
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── AgentProfile.ts
│   │   │   ├── Role.ts
│   │   │   ├── ContactStatus.ts
│   │   │   ├── Contact.ts
│   │   │   └── Reservation.ts
│   │   └── seeds/
│   │       ├── contact-statuses.ts
│   │       └── default-admin.ts
│   ├── middleware/
│   │   └── history-middleware.ts       # Mongoose history plugin
│   ├── permissions/
│   │   ├── admin-permissions.ts
│   │   └── agent-permissions.ts
│   └── utils/
│       ├── permission-utils.ts
│       ├── phone-utils.ts
│       ├── postal-code-utils.ts
│       ├── history-utils.ts            # HistoryContext class
│       └── history-query-utils.ts      # History queries
└── types/
    ├── contact.ts
    ├── reservation.ts
    ├── user.ts
    └── history.ts                      # HistoryEntry interface
```

---

## Development Workflow

### Step-by-Step Implementation Order

1. **History system setup**
   - Create history middleware plugin
   - Create HistoryContext helper class
   - Create history query utilities
   - Test history tracking with sample model

2. **Database setup**
   - Create all models with history plugin
   - Create seed scripts
   - Test with sample data
   - Verify history tracking works

3. **Permission system**
   - Define all permissions (admin, agent only)
   - Create utility functions
   - Test permission checking

4. **API routes - Core contact management**
   - CRUD operations with history tracking
   - Test with Postman/Insomnia
   - Verify history entries are created

5. **History API routes**
   - Document history endpoint
   - User activity endpoint
   - Recent changes endpoint

6. **Admin contact list**
   - Table component
   - Filters
   - Basic dialogs
   - History viewer component

7. **API routes - Telephoniste features**
   - Random contact assignment
   - Call logging with history
   - Activity tracking

8. **Telephoniste interface**
   - Single contact card
   - Call integration
   - Status updates
   - History timeline view

9. **Admin telephoniste management**
   - Stats dashboard
   - Performance metrics
   - User activity history

10. **Conversion system**
    - Reservation creation with history
    - Agent availability checking
    - Contact update

11. **Polish & Testing**
    - Error handling
    - Loading states
    - Mobile responsiveness
    - History audit trail verification

---

## Success Metrics

### MVP Completion Criteria

- [ ] History system tracks all CRUD operations automatically
- [ ] All collections have complete audit trails
- [ ] User snapshots captured at time of each action
- [ ] Old/new values tracked for all updates
- [ ] Telephoniste can log in and see assigned contacts
- [ ] Telephoniste can make calls through Twilio integration
- [ ] Telephoniste can update contact status and add notes
- [ ] Telephoniste can convert contact to reservation
- [ ] Admin can view all contacts in filterable table
- [ ] Admin can assign contacts to telephonistes
- [ ] Admin can view telephoniste performance stats
- [ ] Admin can view complete audit history for any record
- [ ] Agent placeholder view exists with navigation

### Phase 0 Deliverables

1. ✅ Comprehensive implementation plan (this document)
2. ✅ Project requirements documentation
3. Reusable history/audit middleware system
4. Database schema with all models and history tracking
5. Seed data for testing
6. Working authentication with role-based access
7. Admin contact management UI with history viewer
8. Admin telephoniste management UI
9. Telephoniste contact interface
10. All API endpoints functional with automatic history tracking
11. History query API endpoints
12. Basic error handling and validation
13. Documentation for future phases

---

## Future Phases (Out of Scope for Phase 0)

### Phase 1: Agent Dashboard
- Calendar view of assigned reservations
- Daily route optimization
- Customer details and notes
- Check-in/check-out functionality

### Phase 2: Advanced Analytics
- Conversion funnel visualization
- Call outcome analysis
- Time-to-conversion metrics
- Revenue attribution

### Phase 3: Automation
- Auto-assignment based on rules
- Scheduled callbacks
- SMS integration
- Email campaigns

### Phase 4: CRM Features
- Customer journey tracking
- Marketing source attribution
- Lead scoring
- Pipeline management

---

## Risk Mitigation

### Technical Risks

**Risk:** Phone number uniqueness conflicts
**Mitigation:** Normalize all inputs, unique index on normalized field

**Risk:** Twilio integration failures
**Mitigation:** Graceful error handling, manual call log entry option

**Risk:** Race conditions on contact assignment
**Mitigation:** Use atomic updates, transaction-safe operations

**Risk:** Agent availability calculation complexity
**Mitigation:** Start with simple availability slots, iterate based on feedback

**Risk:** History tracking performance overhead
**Mitigation:**
- Use efficient Mongoose hooks
- Index history arrays for queries
- Implement pagination for history views
- Consider archiving old history data if needed

**Risk:** History data growing too large
**Mitigation:**
- Exclude specified fields from tracking (e.g., `updatedAt`)
- Implement history retention policies
- Create background job to archive old history

### Product Risks

**Risk:** Telephoniste workflow too different from amq_partners reference
**Mitigation:** Iterate based on user testing, maintain core interaction patterns

**Risk:** Insufficient initial contact data
**Mitigation:** Progressive data collection, inline editing, don't block on missing fields

**Risk:** Users confused by extensive audit trails
**Mitigation:**
- Default to showing only recent history
- Provide clear filtering options
- Highlight important changes visually

---

## Conclusion

This implementation plan provides a comprehensive roadmap for building a contact-first telephonist management system adapted from the proven amq_partners recontact platform. The system is designed to be:

1. **Auditable:** Complete history tracking with user snapshots and change logs
2. **Scalable:** Clean data model, indexed queries, pagination
3. **User-friendly:** Intuitive UIs for each actor (admin, telephoniste, agent)
4. **Flexible:** Extensible permission system, customizable statuses
5. **Robust:** Comprehensive error handling, data validation, reusable middleware
6. **Future-proof:** Clear architecture for adding features in later phases

The next step is to begin **Phase 0.1: History System & Core Infrastructure**.

Key differentiators from amq_partners:
- ✅ Comprehensive audit trail system (new)
- ✅ Contact-first workflow vs recontact workflow
- ✅ Simplified actor-based permissions (admin, agent only)
- ✅ Progressive data collection approach
- ✅ Reusable history middleware across all collections
