# Technical Architecture & Design Notes

## Overview

This document outlines the architecture, design decisions, and assumptions made in the Attendance Management Module.

## Architecture Layers

### Backend Architecture (Layered Pattern)

```
┌─────────────────────────────────────────┐
│           Controllers                   │  ← Handle HTTP requests/responses
│  (authController, attendanceController) │
├─────────────────────────────────────────┤
│           Services                      │  ← Business logic (if extracted)
├─────────────────────────────────────────┤
│           Middleware                    │  ← Auth, validation, audit logging
├─────────────────────────────────────────┤
│           Prisma ORM                    │  ← Database abstraction
├─────────────────────────────────────────┤
│           PostgreSQL                    │  ← Data persistence
└─────────────────────────────────────────┘
```

**Design Choice**: Kept controllers thin with direct Prisma calls for simplicity. In larger applications, a separate service layer would be added.

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│           Pages                         │  ← Role-specific views
│  (Employee, HR, Admin, SuperAdmin)     │
├─────────────────────────────────────────┤
│           Components                    │  ← Reusable UI components
├─────────────────────────────────────────┤
│           Contexts                      │  ← Global state (Auth, Toast)
├─────────────────────────────────────────┤
│           Services                      │  ← API integration
├─────────────────────────────────────────┤
│           Tailwind CSS                  │  ← Styling
└─────────────────────────────────────────┘
```

## Database Schema Design

### Multi-Tenant SaaS Model

**Key Decision**: Implemented multi-tenancy via **companyId foreign keys** rather than separate databases per tenant.

**Rationale**:
- Easier management for small-medium scale (100-1000 companies)
- Shared resources = lower operational costs
- Simpler backup/restore operations
- Easier to implement global analytics

**Trade-off**: Data isolation is application-layer enforced (via middleware) rather than database-level. For enterprise customers requiring strict isolation, database-per-tenant would be better.

### Schema Highlights

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique  // Changed from composite to simple unique
  companyId String?            // Nullable for Super Admin
  role      Role
  ...
}
```

**Email Uniqueness**: Changed from `@@unique([email, companyId])` to simple `@unique` because:
- Same person across companies = different accounts (simpler mental model)
- Super Admin needs unique email without company
- Prevents confusion when same email exists in multiple companies

### Indexing Strategy

```prisma
@@index([companyId, date])        // Attendance queries by company
@@index([companyId, status])     // HR dashboard queries
@@index([companyId, createdAt])    // Audit log queries
```

**Justification**: All list queries are scoped by company, so companyId is always the first column in composite indexes.

## Authentication & Security

### JWT Token Strategy

| Token Type | Expiration | Storage | Purpose |
|------------|-----------|---------|---------|
| Access Token | 15 minutes | LocalStorage (with httpOnly cookie alternative) | API authentication |
| Refresh Token | 7 days | Database + LocalStorage | Token rotation |

**Why store refresh tokens in database?**
- Token revocation capability (logout from all devices)
- Prevents token replay attacks (detect reuse of invalidated token)
- Audit trail of active sessions

**Alternative considered**: Stateless JWT-only - rejected due to inability to revoke tokens.

### Role Hierarchy & Permissions

```
SUPER_ADMIN (Platform Owner)
  └── Can access all companies
  └── Can create/manage companies
  └── Can view audit logs

ADMIN (Company Admin)
  └── Can manage users within company
  └── Can configure company settings
  └── Can view/edit attendance
  └── Can approve correction requests

HR (HR Manager)
  └── Can approve/reject correction requests
  └── Can view company attendance

EMPLOYEE
  └── Can check-in/check-out
  └── Can view own history
  └── Can request corrections
```

**Permission Implementation**: Role-based middleware (`authorize('HR', 'ADMIN')`) combined with company scoping (`requireCompanyAccess`).

## API Design Principles

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Consistency**: All endpoints follow this format for predictable client-side handling.

### Validation Strategy

- **Zod schemas** for runtime validation
- Validation happens in controllers before database operations
- Error responses include field-level details for form handling

## Frontend Design Decisions

### State Management

**Context API chosen over Redux** because:
- Simpler for this scale (3 contexts: Auth, Toast)
- No complex state interactions
- Built-in, no additional dependencies

**Trade-off**: For >10 contexts or complex state trees, Redux/Zustand would be better.

### Routing & Access Control

```javascript
// ProtectedRoute redirects based on role
const roleRoutes = {
  SUPER_ADMIN: '/superadmin',
  ADMIN: '/admin',
  HR: '/hr',
  EMPLOYEE: '/employee'
}
```

**UX Decision**: After login, users are redirected to their role-specific dashboard rather than a generic landing page.

### Styling with Tailwind

**Component Classes**: Created custom component classes in CSS layer:

```css
@layer components {
  .btn-primary { @apply px-4 py-2 bg-blue-600 text-white rounded; }
  .card { @apply bg-white rounded-lg shadow-md p-6; }
}
```

**Rationale**: Maintains Tailwind's utility-first approach while providing semantic class names for readability.

## Business Logic Implementation

### Attendance Validations

| Validation | Implementation |
|------------|---------------|
| One check-in per day | `@@unique([userId, date])` constraint |
| Check-out after check-in | API check: `if (!record?.clockIn)` |
| Work hours calculation | `(clockOut - clockIn) / (1000 * 60 * 60)` |
| Manual flag | Set to `true` when HR/Admin edits |

### Correction Request Flow

```
1. Employee creates request (PENDING status)
2. HR/Admin reviews with APPROVED/REJECTED + remarks
3. On approval:
   a. Update attendance record with corrected time
   b. Recalculate work hours
   c. Set isManual = true
4. Employee sees updated status and remarks
```

**Duplicate Prevention**: Database query prevents multiple pending requests for same attendance:
```javascript
const existing = await prisma.correctionRequest.findFirst({
  where: { attendanceId, requesterId, status: 'PENDING' }
})
```

## Commercial Readiness Features

### Audit Logging

All state-changing operations are logged:
- User ID, Company ID
- Action type, Entity type/ID
- Old/New values (JSON)
- IP address, User agent
- Timestamp

**Use Cases**: 
- Compliance reporting
- Debugging disputes
- Security incident investigation

### Extensibility Points

| Feature | How to Extend |
|---------|--------------|
| New Role | Insert into Role table, add to authorize() calls |
| New Correction Type | Add to requestType enum in schema |
| New Settings | Add field to CompanySettings model |
| Custom Workflows | Add status values, create workflow service |

## Performance Considerations

### Database
- Proper indexing on all foreign keys
- Pagination on all list endpoints (default 20 items)
- Select specific fields in queries (not `SELECT *`)

### Frontend
- Lazy loading for role-specific routes (future enhancement)
- Debounced search inputs
- Optimistic UI updates for check-in/check-out

## Deployment Considerations

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://...
JWT_SECRET=32+ character random string
JWT_REFRESH_SECRET=different 32+ character string
NODE_ENV=production

# Frontend (build time)
VITE_API_URL=https://api.example.com
```

### Database Migration
```bash
npx prisma migrate deploy  # Production migrations
```

## Known Limitations & Future Enhancements

### Current Limitations
1. No real-time notifications (WebSockets) for HR when requests created
2. No email notifications
3. No shift scheduling (assumes standard 9-6 workday)
4. No holiday calendar integration
5. No bulk import/export for attendance

### Suggested Enhancements
1. **Shift Management**: Support multiple shifts per company
2. **Leave Management**: Integrate with correction requests
3. **Reporting**: Charts, analytics, export to Excel
4. **Mobile App**: React Native/Flutter version
5. **Biometric Integration**: Fingerprint/face recognition API hooks

## Testing Strategy

### Manual Testing Checklist
- [ ] All 4 roles can login successfully
- [ ] Employee check-in/out flow
- [ ] Correction request creation and approval
- [ ] Admin user management
- [ ] Super Admin company creation
- [ ] Token refresh on expiry
- [ ] Role-based access restrictions

### Automated Testing (Recommended)
- API integration tests with Jest + Supertest
- Frontend component tests with React Testing Library
- E2E tests with Playwright for critical flows

## Conclusion

This architecture balances:
- **Simplicity**: Easy to understand and modify
- **Scalability**: Database design supports growth to thousands of companies
- **Security**: Industry-standard JWT implementation with proper validation
- **Commercial viability**: Multi-tenant SaaS ready with audit logging

The modular structure allows incremental feature additions without major refactoring.
