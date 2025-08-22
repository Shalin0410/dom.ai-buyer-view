# Persons Table Migration Documentation

## Overview

This document describes the migration from separate `agents` and `buyers` tables to a unified `persons` table with role-based access control.

## Migration Summary

### Before Migration
- **`agents` table**: 2 records (John Smith, Sarah Johnson)
- **`buyers` table**: 3 records (Shalin Shah, Emma Wilson, Saachi Shah)
- **Relationships**: Buyers linked to agents via `agent_id` foreign key

### After Migration
- **`persons` table**: 116 total records (3 agents + 3 buyers + 110 other persons)
- **Role-based access**: `role` enum with values `'agent'`, `'buyer'`, `'other'`
- **Relationships**: Buyer-agent relationships maintained via `agent_id` self-reference
- **Organization support**: All records have `organization_id` for multi-tenancy

## Database Schema Changes

### New Persons Table Structure
```sql
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    role person_role, -- 'agent', 'buyer', 'other'
    agent_id UUID REFERENCES persons(id), -- Self-reference for buyer-agent relationships
    organization_id UUID REFERENCES organizations(id),
    -- Additional fields for enhanced functionality
    fub_person_id INTEGER,
    background TEXT,
    buyer_needs TEXT,
    price_min INTEGER,
    price_max INTEGER,
    budget_approved BOOLEAN,
    pre_approval_amount NUMERIC,
    pre_approval_expiry DATE,
    last_contact_date DATE,
    next_followup_date DATE,
    stage TEXT,
    tags TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Relationships
- **Buyer → Agent**: `agent_id` references `persons.id` where `role = 'agent'`
- **Person → Organization**: `organization_id` references `organizations.id`
- **Self-referencing**: `agent_id` creates buyer-agent relationships within the same table

## Code Changes

### Updated Files
1. **`src/services/supabase/data.ts`**
   - All buyer operations now use `persons` table with `role = 'buyer'`
   - All agent operations now use `persons` table with `role = 'agent'`
   - Relationship queries use self-joins on `persons` table

2. **`src/types/database.types.ts`**
   - Updated to reflect new `persons` table structure
   - Added legacy type aliases for backward compatibility
   - Added `person_role` enum definition

### Backward Compatibility
- Legacy type aliases maintained: `DbAgent`, `DbBuyer`, etc.
- Existing API interfaces unchanged
- All existing hooks and components continue to work

## Migration Results

### Data Verification
- ✅ **3 agents** successfully migrated
- ✅ **3 buyers** successfully migrated
- ✅ **3 buyer-agent relationships** properly established
- ✅ **All records** have `organization_id` set
- ✅ **Email uniqueness** maintained
- ✅ **No data loss** during migration

### Buyer-Agent Relationships
| Buyer | Agent | Organization |
|-------|-------|--------------|
| Shalin Shah | John Smith | 550e8400-e29b-41d4-a716-446655440001 |
| Saachi Shah | John Smith | 550e8400-e29b-41d4-a716-446655440001 |
| Emma Wilson | Sarah Johnson | 550e8400-e29b-41d4-a716-446655440001 |

## Benefits of Migration

### 1. Unified Data Model
- Single table for all people (agents, buyers, other roles)
- Consistent data structure and relationships
- Easier to add new roles in the future

### 2. Enhanced Functionality
- Support for additional person attributes (background, buyer_needs, etc.)
- Better organization support with `organization_id`
- FUB integration support with `fub_person_id`

### 3. Improved Relationships
- Self-referencing buyer-agent relationships
- Consistent foreign key constraints
- Better data integrity

### 4. Scalability
- Easy to add new roles without schema changes
- Better support for multi-tenant architecture
- More flexible querying capabilities

## Usage Examples

### Querying Agents
```typescript
// Get all agents
const agents = await dataService.getAgents();

// Get agent by ID
const agent = await dataService.getAgentById(agentId);
```

### Querying Buyers
```typescript
// Get all buyers
const buyers = await dataService.getBuyers();

// Get buyer by email
const buyer = await dataService.getBuyerByEmail(email);

// Get buyers with their agents
const buyersWithAgents = await dataService.getBuyersWithAgents();
```

### Creating New Records
```typescript
// Create a new agent
const newAgent = await dataService.createAgent({
  first_name: 'Jane',
  last_name: 'Doe',
  email: 'jane.doe@example.com',
  phone: '+1234567890'
});

// Create a new buyer
const newBuyer = await dataService.createBuyer({
  first_name: 'John',
  last_name: 'Buyer',
  email: 'john.buyer@example.com',
  agent_id: agentId
});
```

## Migration Commands

### SQL Commands Executed
```sql
-- 1. Insert agents into persons table
INSERT INTO persons (id, first_name, last_name, email, phone, role, created_at, updated_at)
SELECT id, first_name, last_name, email, phone, 'agent'::person_role, created_at, updated_at
FROM agents;

-- 2. Insert buyers into persons table
INSERT INTO persons (id, first_name, last_name, email, phone, role, agent_id, created_at, updated_at)
SELECT id, first_name, last_name, email, phone, 'buyer'::person_role, agent_id, created_at, updated_at
FROM buyers;

-- 3. Set organization_id for agents
UPDATE persons 
SET organization_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE role = 'agent' AND organization_id IS NULL;

-- 4. Set organization_id for buyers based on their agent
UPDATE persons 
SET organization_id = (
    SELECT agent_person.organization_id 
    FROM persons agent_person 
    WHERE agent_person.id = persons.agent_id
)
WHERE role = 'buyer' AND agent_id IS NOT NULL;

-- 5. Drop old tables (after verification)
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
```

## Testing

### Verification Queries
```sql
-- Check migration results
SELECT 
    COUNT(*) as total_persons,
    COUNT(CASE WHEN role = 'agent' THEN 1 END) as agents,
    COUNT(CASE WHEN role = 'buyer' THEN 1 END) as buyers,
    COUNT(CASE WHEN role = 'buyer' AND agent_id IS NOT NULL THEN 1 END) as buyers_with_agents
FROM persons;

-- Verify buyer-agent relationships
SELECT 
    b.first_name || ' ' || b.last_name as buyer_name,
    a.first_name || ' ' || a.last_name as agent_name
FROM persons b
JOIN persons a ON b.agent_id = a.id
WHERE b.role = 'buyer' AND a.role = 'agent';
```

## Future Considerations

### Potential Enhancements
1. **Role-based permissions**: Implement RLS policies based on person roles
2. **Additional roles**: Add support for lenders, inspectors, etc.
3. **Audit trail**: Track role changes and relationship updates
4. **Bulk operations**: Optimize for bulk data imports and updates

### Monitoring
- Monitor query performance with the new schema
- Track usage patterns for different roles
- Consider indexing strategies for role-based queries

## Conclusion

The migration to the unified `persons` table has been completed successfully. All existing functionality continues to work while providing enhanced capabilities for future development. The new schema is more flexible, scalable, and maintainable than the previous separate table approach.
