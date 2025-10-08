# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
- `npm run dev` - Start Vite development server (frontend only)
- `npm run server` - Start Express backend server (port 3001)
- `npm run dev:all` - Run both frontend and backend concurrently

### Build & Deploy
- `npm run build` - Production build for Vercel deployment
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

### MCP Server (Development Tool)
- `npm run mcp:build` - Build MCP server
- `npm run mcp:dev` - Start MCP server in development
- `npm run mcp:start` - Start MCP server in production

## Architecture Overview

### Multi-Tenant Real Estate Platform
This is a buyer journey AI platform for real estate, built as a multi-tenant system with organizations, agents, and buyers.

### Core Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Radix UI components + Tailwind CSS
- **Backend**: Supabase (PostgreSQL) + Express.js server
- **State Management**: TanStack Query + React Context
- **Authentication**: Supabase Auth with email/password
- **Deployment**: Vercel with serverless API functions

### Database Architecture
- **Multi-tenant setup** with `organization_id` on all major tables
- **Row Level Security (RLS)** enforced on all tables
- **Complex workflow triggers** for buyer-property relationship management
- **Admin client** (supabaseAdmin) bypasses RLS for service operations

### Key Data Flow
1. **Properties** exist independently with MLS data
2. **Buyer-Property relationships** track buyer interest levels
3. **Timelines** auto-created when buyers "love" properties
4. **Search Tab** shows properties with `interest_level = 'interested'`
5. **Dashboard** shows properties with timelines (`loved`, `viewing_scheduled`, etc.)

## Service Layer Architecture

### Data Service Pattern
- **Interface**: `src/services/api/data.ts` - DataService interface
- **Implementation**: `src/services/supabase/data.ts` - SupabaseDataService
- **Types**: `src/services/api/types.ts` - All shared interfaces
- **Usage**: Import via `src/services/index.ts`

### Property Workflow Implementation
Property activities are aggregated from existing tables rather than a dedicated `property_activities` table:
- `getPropertyActivities()` - Aggregates from buyer_properties, timeline_history, action_items, documents
- `addPropertyActivity()` - Routes activities to appropriate existing tables based on type

### Authentication Flow
- **Context**: `src/contexts/AuthContext.tsx` - Global auth state
- **Service**: `src/services/supabase/auth.ts` - Auth operations
- **Guards**: `src/components/RequireAuth.tsx` - Route protection

## Critical Property Workflow Rules

### Agent Property Addition
When agents recommend properties to buyers, follow the exact workflow in `AGENT_WORKFLOW_REQUIREMENTS.md`:

1. **Standard Flow**: Use `addPropertyToBuyer(buyerId, propertyId)` - creates `interested` stage
2. **Advanced Stages**: Use options parameter for fast-moving markets:
   ```typescript
   addPropertyToBuyer(buyerId, propertyId, {
     initialStage: 'under_contract',
     timelinePhase: 'escrow',
     fubStage: 'pending'
   })
   ```

### Property State Management
- **Search Tab**: `interest_level = 'interested'` + `is_active = true` + `properties.status = 'active'`
- **Dashboard**: `interest_level IN ('loved', 'viewing_scheduled', 'under_contract', 'pending')` + timeline exists
- **Timeline Creation**: Automatic via database triggers when interest_level changes from 'interested'

## Environment Variables

### Required for Development
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Public anon key
- `VITE_SUPABASE_SERVICE_ROLE_KEY` - Service role key (admin operations)
- `VITE_SITE_URL` - Site URL (for auth redirects)

### Backend/API
- `OPENAI_API_KEY` - For chatbot functionality (server-side)

## Database Access Patterns

### Client Selection
- **User Operations**: Use `supabase` client (respects RLS)
- **Admin Operations**: Use `supabaseAdmin` client (bypasses RLS)
- **Service Layer**: Automatically selects appropriate client

### Multi-tenant Queries
Always include `organization_id` filters except when using admin client:
```typescript
.from('properties')
.select('*')
.eq('organization_id', organizationId)  // Required for RLS
```

## Component Architecture

### Page Structure
- `src/pages/` - Route components (Index, Login, Properties, etc.)
- `src/components/` - Reusable UI components
- `src/components/ui/` - shadcn/ui components (auto-generated)

### Main App Flow
- `Index.tsx` - Main authenticated page
- `MainAppContent.tsx` - Tab-based interface (dashboard, search, profile)
- Navigation handled by `Header.tsx` and `NavigationBar.tsx`

### Property Components
- `PropertyGrid.tsx` / `PropertyGridNew.tsx` - Property listings
- `PropertyCard.tsx` - Individual property display
- `PropertyDetailModal.tsx` - Property details overlay
- `PropertySwiping.tsx` - Tinder-style property interaction

## Supabase Integration

### Migration Management
- Migrations in `supabase/migrations/`
- Latest schema: `0011_complete_database_schema.sql`
- Workflow triggers: `0012_property_workflow_triggers.sql`

### Admin Operations
Service layer uses admin client for operations requiring RLS bypass:
- Property activity aggregation
- Cross-tenant data access
- System-level operations

## Development Notes

### Chatbot Integration
- OpenAI-powered chatbot in `src/services/chatbot/`
- Server-side API at `/api/chat` (serverless function)
- Notion integration for knowledge base

### Real Estate Domain
- MLS integration patterns
- Property status workflow management
- Agent-buyer relationship handling
- Timeline-based buyer journey tracking

### Performance Considerations
- TanStack Query for server state caching
- Optimistic updates for property interactions
- Efficient RLS queries with proper indexing