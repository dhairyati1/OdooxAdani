# GearGuard Schema Design Documentation

## Overview

This document explains the Mongoose schema design for GearGuard, a production-grade maintenance management system. The schemas are designed to enforce business rules at the data layer while supporting efficient queries for Kanban views, calendar views, and role-based access control.

## Schema Relationships

### Entity Relationship Diagram (Conceptual)

```
User (1) ──< (many) MaintenanceTeam
  │
  │ (technician role)
  │
  └──> assignedTechnician (MaintenanceRequest)

Equipment (1) ──< (many) MaintenanceRequest
  │
  └──> defaultMaintenanceTeam (MaintenanceTeam)

MaintenanceTeam (1) ──< (many) MaintenanceRequest
```

### Detailed Relationships

1. **User ↔ MaintenanceTeam**
   - **Relationship**: Many-to-One (technicians belong to one team)
   - **Implementation**: `User.maintenanceTeam` references `MaintenanceTeam._id`
   - **Business Rule**: Technicians must belong to a team; users and managers can optionally belong to a team
   - **Reverse Lookup**: Virtual `MaintenanceTeam.members` populates all technicians in a team

2. **Equipment ↔ MaintenanceRequest**
   - **Relationship**: One-to-Many (one equipment can have many requests)
   - **Implementation**: `MaintenanceRequest.equipment` references `Equipment._id`
   - **Business Rule**: Equipment selection auto-fills the maintenance team from `Equipment.defaultMaintenanceTeam`
   - **Constraint**: Scrapped equipment cannot receive new requests (except Scrap status)

3. **MaintenanceTeam ↔ MaintenanceRequest**
   - **Relationship**: One-to-Many (one team handles many requests)
   - **Implementation**: `MaintenanceRequest.maintenanceTeam` references `MaintenanceTeam._id`
   - **Business Rule**: Technicians can only see requests from their team (managers see all)

4. **User ↔ MaintenanceRequest**
   - **Relationship**: Many-to-Many (users create requests, technicians are assigned)
   - **Implementation**: 
     - `MaintenanceRequest.createdBy` references `User._id` (creator)
     - `MaintenanceRequest.assignedTechnician` references `User._id` (optional assignment)
   - **Business Rule**: Assigned technician must belong to the request's maintenance team

## Indexing Strategy

### User Schema Indexes

1. **`email` (single field)**
   - **Purpose**: Fast authentication lookups
   - **Query Pattern**: `User.findOne({ email })`

2. **`role` (single field)**
   - **Purpose**: Filter users by role for permission checks
   - **Query Pattern**: `User.find({ role: 'technician' })`

3. **`isActive` (single field)**
   - **Purpose**: Filter active users (soft delete)
   - **Query Pattern**: `User.find({ isActive: true })`

4. **Compound: `{ role: 1, maintenanceTeam: 1, isActive: 1 }`**
   - **Purpose**: Find active technicians in a specific team
   - **Query Pattern**: `User.find({ role: 'technician', maintenanceTeam: teamId, isActive: true })`

### MaintenanceTeam Schema Indexes

1. **`name` (single field, unique)**
   - **Purpose**: Fast lookup by name, enforce uniqueness
   - **Query Pattern**: `MaintenanceTeam.findOne({ name })`

2. **`isActive` (single field)**
   - **Purpose**: Filter active teams
   - **Query Pattern**: `MaintenanceTeam.find({ isActive: true })`

3. **Compound: `{ isActive: 1, name: 1 }`**
   - **Purpose**: List active teams sorted by name
   - **Query Pattern**: `MaintenanceTeam.find({ isActive: true }).sort({ name: 1 })`

### Equipment Schema Indexes

1. **`name` (single field)**
   - **Purpose**: Search equipment by name
   - **Query Pattern**: `Equipment.find({ name: /searchTerm/i })`

2. **`category` (single field)**
   - **Purpose**: Filter by equipment category
   - **Query Pattern**: `Equipment.find({ category: 'Vehicle' })`

3. **`serialNumber` (single field, sparse)**
   - **Purpose**: Lookup by serial number (allows null, unique when present)
   - **Query Pattern**: `Equipment.findOne({ serialNumber })`

4. **`department` (single field)**
   - **Purpose**: Filter equipment by department (for calendar/overdue queries)
   - **Query Pattern**: `Equipment.find({ department: 'IT' })`

5. **`defaultMaintenanceTeam` (single field)**
   - **Purpose**: Find all equipment handled by a team
   - **Query Pattern**: `Equipment.find({ defaultMaintenanceTeam: teamId })`

6. **`isScrapped` (single field)**
   - **Purpose**: Filter out scrapped equipment
   - **Query Pattern**: `Equipment.find({ isScrapped: false })`

7. **`isActive` (single field)**
   - **Purpose**: Soft delete filtering
   - **Query Pattern**: `Equipment.find({ isActive: true })`

8. **Compound: `{ isActive: 1, isScrapped: 1, department: 1 }`**
   - **Purpose**: Find active, non-scrapped equipment by department
   - **Query Pattern**: `Equipment.find({ isActive: true, isScrapped: false, department })`

9. **Compound: `{ defaultMaintenanceTeam: 1, isActive: 1, isScrapped: 1 }`**
   - **Purpose**: Team-based equipment filtering
   - **Query Pattern**: `Equipment.find({ defaultMaintenanceTeam: teamId, isActive: true, isScrapped: false })`

### MaintenanceRequest Schema Indexes

1. **`type` (single field)**
   - **Purpose**: Filter by request type (calendar view shows only Preventive)
   - **Query Pattern**: `MaintenanceRequest.find({ type: 'Preventive' })`

2. **`status` (single field)**
   - **Purpose**: Critical for Kanban view and badge counts
   - **Query Pattern**: `MaintenanceRequest.find({ status: 'New' })`

3. **`equipment` (single field)**
   - **Purpose**: Find all requests for an equipment
   - **Query Pattern**: `MaintenanceRequest.find({ equipment: equipmentId })`

4. **`maintenanceTeam` (single field)**
   - **Purpose**: Team-based visibility (technicians see only their team)
   - **Query Pattern**: `MaintenanceRequest.find({ maintenanceTeam: teamId })`

5. **`scheduledDate` (single field)**
   - **Purpose**: Calendar view and overdue calculations
   - **Query Pattern**: `MaintenanceRequest.find({ scheduledDate: { $gte: startDate, $lte: endDate } })`

6. **`isActive` (single field)**
   - **Purpose**: Soft delete filtering
   - **Query Pattern**: `MaintenanceRequest.find({ isActive: true })`

7. **Compound: `{ status: 1, isActive: 1 }`**
   - **Purpose**: Kanban view columns and badge counts
   - **Query Pattern**: `MaintenanceRequest.find({ status: 'In Progress', isActive: true })`

8. **Compound: `{ maintenanceTeam: 1, status: 1, isActive: 1 }`**
   - **Purpose**: Team-based Kanban view (technician perspective)
   - **Query Pattern**: `MaintenanceRequest.find({ maintenanceTeam: teamId, status: 'New', isActive: true })`

9. **Compound: `{ equipment: 1, status: 1, isActive: 1 }`**
   - **Purpose**: Equipment history with status filtering
   - **Query Pattern**: `MaintenanceRequest.find({ equipment: equipmentId, status: { $ne: 'Repaired' }, isActive: true })`

10. **Compound: `{ type: 1, scheduledDate: 1, status: 1, isActive: 1 }` (appears twice)**
    - **Purpose**: 
      - Calendar view: Show Preventive requests in date range
      - Overdue queries: Find Preventive requests with `scheduledDate < today` and `status != 'Repaired'`
    - **Query Pattern**: 
      - Calendar: `MaintenanceRequest.find({ type: 'Preventive', scheduledDate: { $gte: start, $lte: end }, isActive: true })`
      - Overdue: `MaintenanceRequest.find({ type: 'Preventive', scheduledDate: { $lt: today }, status: { $ne: 'Repaired' }, isActive: true })`

11. **Compound: `{ assignedTechnician: 1, status: 1, isActive: 1 }`**
    - **Purpose**: Find requests assigned to a specific technician
    - **Query Pattern**: `MaintenanceRequest.find({ assignedTechnician: userId, status: 'In Progress', isActive: true })`

## Design Decisions

### 1. Soft Delete Strategy
- All schemas use `isActive` flag instead of hard deletes
- Preserves audit trail and historical data
- Allows data recovery if needed
- Indexed for efficient filtering

### 2. Auto-fill Maintenance Team
- When equipment is selected in a request, `maintenanceTeam` is auto-filled via pre-save hook
- Reduces user error and enforces consistency
- Can be overridden if needed (though business rules may restrict this)

### 3. Scrap Logic
- Equipment scrap state is stored in `Equipment.isScrapped`
- When a request moves to "Scrap" status, related equipment is automatically marked as scrapped
- Scrapped equipment cannot receive new requests (validation enforced)
- Soft logic only (data not deleted)

### 4. Duration Validation
- Duration is required before moving to "Repaired" status
- Enforced at schema level via custom validator
- Should also be enforced at controller level for better error messages

### 5. Workflow Enforcement
- Status enum enforces valid states
- Pre-save hooks prevent reopening "Repaired" requests
- Direct "New → Scrap" transition should be prevented at controller level (schema allows it but documents the rule)

### 6. Department vs Employee
- Equipment can belong to EITHER department OR employee (mutually exclusive)
- Validated at schema level
- Department is indexed for calendar/overdue queries
- Employee is a reference to User (not indexed separately, but can be queried via population)

### 7. Overdue Calculation
- Virtual field `isOverdue` calculates overdue status
- Definition: `scheduledDate < today AND status != 'Repaired'`
- Only applies to Preventive requests
- Timezone handled as UTC

### 8. Role-Based Access Control (RBAC)
- Roles stored in User schema: `user`, `technician`, `manager`
- Permissions enforced at controller/middleware level
- Schema supports RBAC by indexing `role` and `maintenanceTeam`

## Query Patterns Supported

### Kanban View
```javascript
// Get requests by status
MaintenanceRequest.find({ status: 'New', isActive: true })

// Get badge counts
MaintenanceRequest.countDocuments({ status: 'In Progress', isActive: true })
```

### Calendar View
```javascript
// Get Preventive requests for a date range
MaintenanceRequest.find({
  type: 'Preventive',
  scheduledDate: { $gte: startDate, $lte: endDate },
  isActive: true
}).populate('equipment').populate('maintenanceTeam')
```

### Team-Based Visibility (Technician)
```javascript
// Technicians see only their team's requests
MaintenanceRequest.find({
  maintenanceTeam: user.maintenanceTeam,
  isActive: true
})
```

### Overdue Requests
```javascript
// Find overdue Preventive requests
const today = new Date();
today.setHours(0, 0, 0, 0);

MaintenanceRequest.find({
  type: 'Preventive',
  scheduledDate: { $lt: today },
  status: { $ne: 'Repaired' },
  isActive: true
})
```

### Equipment History
```javascript
// Get all requests for an equipment
MaintenanceRequest.find({
  equipment: equipmentId,
  isActive: true
}).sort({ createdAt: -1 })
```

## Future Extensibility

The schemas are designed to support future features:

1. **Notifications**: Can add `notifications` array or separate Notification model
2. **SLA/Priority**: Can add `priority` field and `slaDeadline` field
3. **File Uploads**: Can add `attachments` array with file references
4. **Mobile Support**: All queries are optimized for mobile-friendly response times

## Notes

- All timestamps use UTC timezone
- ObjectId references use Mongoose population for efficient queries
- Virtual fields are included in JSON output for API responses
- Validation errors provide clear messages for frontend display
- Indexes are optimized for read-heavy workloads (typical for maintenance systems)

