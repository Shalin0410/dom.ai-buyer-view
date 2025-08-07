# 🔄 Follow Up Boss Integration Guide

This guide explains how to integrate your buyer journey application with Follow Up Boss (FUB) CRM system.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Setup Instructions](#setup-instructions)
4. [API Integration](#api-integration)
5. [Data Mapping](#data-mapping)
6. [Sync Strategy](#sync-strategy)
7. [Webhooks](#webhooks)
8. [Usage Examples](#usage-examples)
9. [Troubleshooting](#troubleshooting)

## 🎯 Overview

The FUB integration allows your application to:

- ✅ **Bidirectional sync** contacts between your app and FUB
- ✅ **Track deals** and property transactions in FUB
- ✅ **Log activities** like property views and inquiries
- ✅ **Manage tasks** and follow-ups
- ✅ **Schedule appointments** for property showings
- ✅ **Sync communication** logs (calls, texts, notes)
- ✅ **Leverage action plans** for automated follow-ups
- ✅ **Use custom fields** for additional data

## 🏗️ Database Schema

### Enhanced Existing Tables

#### `agents` Table Enhancements
```sql
-- FUB User Integration
fub_user_id INTEGER UNIQUE           -- FUB User ID
role TEXT DEFAULT 'Agent'            -- Agent, Broker, Lender, Admin, Owner
is_owner BOOLEAN DEFAULT FALSE      -- Is account owner
is_active BOOLEAN DEFAULT TRUE      -- Active status
team_leader_of INTEGER[]            -- Teams they lead
time_zone TEXT                      -- Agent's timezone
last_synced_with_fub TIMESTAMP      -- Last sync time
fub_sync_enabled BOOLEAN            -- Enable sync for this agent
```

#### `buyers` Table Enhancements
```sql
-- FUB Person Integration
fub_person_id INTEGER UNIQUE        -- FUB Person ID
middle_name TEXT                    -- Middle name
suffix TEXT                         -- Name suffix
source TEXT                         -- Lead source
source_url TEXT                     -- Source URL
website TEXT                        -- Personal website
address JSONB                       -- Full address object
emails JSONB                        -- Array of email objects
phones JSONB                        -- Array of phone objects
social_profiles JSONB               -- Social media profiles
tags TEXT[]                         -- Contact tags
lead_stage TEXT                     -- Lead stage
lead_status TEXT                    -- active, inactive, etc.
assigned_user_id UUID               -- Assigned agent
last_contacted_at TIMESTAMP         -- Last contact time
next_touch_at TIMESTAMP             -- Next follow-up time
last_synced_with_fub TIMESTAMP      -- Last sync time
fub_sync_enabled BOOLEAN            -- Enable sync
```

#### `properties` Table Enhancements
```sql
-- FUB Property Integration
fub_property_id INTEGER UNIQUE      -- FUB Property ID
external_id TEXT                    -- MLS or external ID
property_sub_type TEXT              -- Detailed property type
description TEXT                    -- Property description
virtual_tour_url TEXT               -- Virtual tour link
listing_agent_name TEXT             -- Listing agent
listing_agent_phone TEXT            -- Listing agent phone
listing_agent_email TEXT            -- Listing agent email
listing_office TEXT                 -- Listing office
hoa_fee DECIMAL(10,2)               -- HOA fees
property_tax DECIMAL(10,2)          -- Annual property tax
days_on_market INTEGER              -- Days on market
coordinates JSONB                   -- {lat, lng}
features JSONB                      -- Property features array
schools JSONB                       -- School information
neighborhood_info JSONB             -- Neighborhood data
last_synced_with_fub TIMESTAMP      -- Last sync time
```

### New FUB Tables

#### Core FUB Tables
- `fub_teams` - Agent teams
- `fub_team_members` - Team memberships
- `fub_pipelines` - Sales pipelines
- `fub_stages` - Pipeline stages
- `fub_deals` - Property deals/transactions
- `fub_custom_fields` - Custom field definitions

#### Communication Tables
- `fub_events` - Lead activities (inquiries, views, etc.)
- `fub_notes` - Communication notes
- `fub_calls` - Phone call logs
- `fub_text_messages` - SMS logs

#### Task Management Tables
- `fub_tasks` - Follow-up tasks
- `fub_appointments` - Scheduled appointments
- `fub_action_plans` - Automated sequences
- `fub_action_plan_people` - Action plan assignments

#### System Tables
- `fub_sync_log` - Sync operation logs
- `fub_webhook_events` - Incoming webhook events
- `fub_configuration` - Integration settings

## ⚙️ Setup Instructions

### 1. Run Database Migrations

```bash
# Apply the FUB integration schema
npx supabase db reset --linked

# Or run individual migrations
npx supabase migration up --include-seed
```

### 2. Configure FUB API Access

1. **Get FUB API Key:**
   - Log into your Follow Up Boss account
   - Go to Settings → API & Integrations
   - Generate an API key

2. **Configure Integration:**
   ```sql
   UPDATE fub_configuration SET 
     api_key = 'your_fub_api_key_here',
     sync_enabled = true,
     webhook_url = 'https://your-app.com/webhooks/fub';
   ```

### 3. Set Up Webhooks (Optional)

Configure FUB to send webhook events:

```bash
# Register webhook endpoint
curl -X POST https://api.followupboss.com/v1/webhooks \
  -H "Authorization: Basic base64(api_key:)" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-app.com/webhooks/fub",
    "events": ["person.created", "person.updated", "deal.created", "deal.updated"]
  }'
```

## 🔄 API Integration

### Create FUB Service Layer

```typescript
// src/services/fub/client.ts
export class FUBClient {
  private apiKey: string;
  private baseURL = 'https://api.followupboss.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`FUB API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // People (Contacts) API
  async createPerson(personData: FUBPersonData) {
    return this.request('/people', {
      method: 'POST',
      body: JSON.stringify(personData),
    });
  }

  async updatePerson(personId: number, personData: Partial<FUBPersonData>) {
    return this.request(`/people/${personId}`, {
      method: 'PUT',
      body: JSON.stringify(personData),
    });
  }

  async getPeople(filters: FUBFilters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/people?${params}`);
  }

  // Events API (Recommended for leads)
  async createEvent(eventData: FUBEventData) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Deals API
  async createDeal(dealData: FUBDealData) {
    return this.request('/deals', {
      method: 'POST',
      body: JSON.stringify(dealData),
    });
  }

  // Notes API
  async createNote(noteData: FUBNoteData) {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }
}
```

### Data Type Definitions

```typescript
// src/services/fub/types.ts
export interface FUBPersonData {
  firstName?: string;
  lastName?: string;
  emails?: Array<{value: string; type?: string; isPrimary?: boolean}>;
  phones?: Array<{value: string; type?: string; isPrimary?: boolean}>;
  source?: string;
  sourceUrl?: string;
  tags?: string[];
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  customFields?: Record<string, any>;
}

export interface FUBEventData {
  type: 'Inquiry' | 'Registration' | 'PropertyView' | 'Custom';
  subject?: string;
  message?: string;
  person: {
    firstName?: string;
    lastName?: string;
    emails?: Array<{value: string}>;
    phones?: Array<{value: string}>;
  };
  property?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    price?: number;
    bedrooms?: number;
    bathrooms?: number;
    squareFootage?: number;
  };
  campaign?: {
    name?: string;
    source?: string;
    medium?: string;
    content?: string;
    term?: string;
  };
}

export interface FUBDealData {
  name?: string;
  value?: number;
  stageId?: number;
  pipelineId?: number;
  personId?: number;
  assignedUserId?: number;
  expectedCloseDate?: string;
  customFields?: Record<string, any>;
}
```

## 🗺️ Data Mapping

### Local Buyer → FUB Person

```typescript
function mapBuyerToFUBPerson(buyer: Buyer): FUBPersonData {
  return {
    firstName: buyer.first_name,
    lastName: buyer.last_name,
    emails: buyer.emails || [{ value: buyer.email, isPrimary: true }],
    phones: buyer.phones || (buyer.phone ? [{ value: buyer.phone, isPrimary: true }] : []),
    source: buyer.source || 'Website',
    sourceUrl: buyer.source_url,
    tags: buyer.tags || [],
    address: buyer.address,
    customFields: {
      'Local Buyer ID': buyer.id,
      // Map other custom fields as needed
    }
  };
}
```

### Property Inquiry → FUB Event

```typescript
function mapPropertyInquiryToFUBEvent(
  buyer: Buyer, 
  property: Property, 
  inquiry: string
): FUBEventData {
  return {
    type: 'Inquiry',
    subject: `Property Inquiry - ${property.address}`,
    message: inquiry,
    person: {
      firstName: buyer.first_name,
      lastName: buyer.last_name,
      emails: [{ value: buyer.email }],
      phones: buyer.phone ? [{ value: buyer.phone }] : [],
    },
    property: {
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip_code,
      price: property.listing_price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFootage: property.square_feet,
    },
    campaign: {
      name: 'Property Inquiry',
      source: 'Website',
      medium: 'Property Detail Page',
    }
  };
}
```

## 🔄 Sync Strategy

### 1. Initial Sync

```typescript
async function performInitialSync() {
  // Sync all existing buyers to FUB
  const buyers = await supabase
    .from('buyers')
    .select('*')
    .is('fub_person_id', null);

  for (const buyer of buyers.data || []) {
    try {
      const fubPerson = await fubClient.createPerson(
        mapBuyerToFUBPerson(buyer)
      );
      
      // Update buyer with FUB ID
      await supabase
        .from('buyers')
        .update({ 
          fub_person_id: fubPerson.id,
          last_synced_with_fub: new Date().toISOString()
        })
        .eq('id', buyer.id);
        
      console.log(`Synced buyer ${buyer.id} to FUB person ${fubPerson.id}`);
    } catch (error) {
      console.error(`Failed to sync buyer ${buyer.id}:`, error);
    }
  }
}
```

### 2. Real-time Sync

```typescript
// src/services/fub/syncService.ts
export class FUBSyncService {
  async syncBuyerToFUB(buyerId: string) {
    const buyer = await this.getBuyerById(buyerId);
    
    if (buyer.fub_person_id) {
      // Update existing FUB person
      await fubClient.updatePerson(
        buyer.fub_person_id,
        mapBuyerToFUBPerson(buyer)
      );
    } else {
      // Create new FUB person
      const fubPerson = await fubClient.createPerson(
        mapBuyerToFUBPerson(buyer)
      );
      
      // Store FUB ID
      await supabase
        .from('buyers')
        .update({ fub_person_id: fubPerson.id })
        .eq('id', buyerId);
    }
  }

  async createPropertyInquiryEvent(buyerId: string, propertyId: string, message: string) {
    const buyer = await this.getBuyerById(buyerId);
    const property = await this.getPropertyById(propertyId);
    
    const event = await fubClient.createEvent(
      mapPropertyInquiryToFUBEvent(buyer, property, message)
    );
    
    // Store event in local database
    await supabase.from('fub_events').insert({
      fub_event_id: event.id,
      person_id: buyerId,
      property_id: propertyId,
      event_type: 'inquiry',
      title: `Property Inquiry - ${property.address}`,
      description: message,
    });
  }
}
```

### 3. Webhook Handler

```typescript
// src/api/webhooks/fub.ts
export async function handleFUBWebhook(req: Request) {
  const event = await req.json();
  
  switch (event.type) {
    case 'person.created':
    case 'person.updated':
      await handlePersonUpdate(event.data);
      break;
      
    case 'deal.created':
    case 'deal.updated':
      await handleDealUpdate(event.data);
      break;
      
    default:
      console.log(`Unhandled webhook event: ${event.type}`);
  }
}

async function handlePersonUpdate(fubPerson: any) {
  // Find local buyer by FUB person ID
  const buyer = await supabase
    .from('buyers')
    .select('*')
    .eq('fub_person_id', fubPerson.id)
    .single();
    
  if (buyer.data) {
    // Update local buyer with FUB data
    await supabase
      .from('buyers')
      .update({
        first_name: fubPerson.firstName,
        last_name: fubPerson.lastName,
        email: fubPerson.emails?.[0]?.value,
        phone: fubPerson.phones?.[0]?.value,
        tags: fubPerson.tags,
        last_synced_with_fub: new Date().toISOString(),
      })
      .eq('id', buyer.data.id);
  }
}
```

## 🎯 Usage Examples

### 1. Track Property View

```typescript
async function trackPropertyView(buyerId: string, propertyId: string) {
  const syncService = new FUBSyncService();
  
  // Create event in FUB
  await syncService.createPropertyInquiryEvent(
    buyerId,
    propertyId,
    'Viewed property details online'
  );
  
  // Also track locally
  await supabase.from('property_activities').insert({
    buyer_property_id: await getBuyerPropertyId(buyerId, propertyId),
    type: 'viewing',
    title: 'Property viewed online',
    description: 'User viewed property details on website',
    created_by: buyerId,
  });
}
```

### 2. Schedule Property Showing

```typescript
async function schedulePropertyShowing(
  buyerId: string,
  propertyId: string,
  agentId: string,
  dateTime: Date
) {
  const buyer = await getBuyerById(buyerId);
  const property = await getPropertyById(propertyId);
  
  // Create appointment in FUB
  const appointment = await fubClient.createAppointment({
    personId: buyer.fub_person_id,
    assignedUserId: (await getAgentById(agentId)).fub_user_id,
    title: `Property Showing - ${property.address}`,
    description: `Show property to ${buyer.first_name} ${buyer.last_name}`,
    location: property.address,
    startTime: dateTime.toISOString(),
    endTime: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour
  });
  
  // Store locally
  await supabase.from('fub_appointments').insert({
    fub_appointment_id: appointment.id,
    person_id: buyerId,
    agent_id: agentId,
    title: appointment.title,
    description: appointment.description,
    location: appointment.location,
    start_time: dateTime.toISOString(),
    end_time: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString(),
    status: 'scheduled',
  });
}
```

### 3. Create Deal When Offer Submitted

```typescript
async function createDealForOffer(
  buyerId: string,
  propertyId: string,
  offerAmount: number,
  agentId: string
) {
  const buyer = await getBuyerById(buyerId);
  const agent = await getAgentById(agentId);
  
  // Create deal in FUB
  const deal = await fubClient.createDeal({
    name: `${buyer.first_name} ${buyer.last_name} - Purchase`,
    value: offerAmount,
    personId: buyer.fub_person_id,
    assignedUserId: agent.fub_user_id,
    stageId: 4, // "Offer Submitted" stage
    expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days from now
  });
  
  // Store deal locally
  await supabase.from('fub_deals').insert({
    fub_deal_id: deal.id,
    person_id: buyerId,
    property_id: propertyId,
    agent_id: agentId,
    deal_type: 'buyer',
    deal_value: offerAmount,
    stage_id: await getStageId('Offer Submitted'),
    deal_status: 'active',
  });
  
  // Update buyer-property relationship
  await supabase
    .from('buyer_properties')
    .update({
      status: 'offer_submitted',
      buying_stage: 'offer_negotiation',
      purchase_price: offerAmount,
      offer_date: new Date().toISOString(),
    })
    .eq('buyer_id', buyerId)
    .eq('property_id', propertyId);
}
```

## 🛠️ Troubleshooting

### Common Issues

1. **API Rate Limiting**
   - FUB has rate limits (typically 1000 requests/hour)
   - Implement exponential backoff
   - Queue sync operations

2. **Duplicate Contacts**
   - FUB automatically deduplicates based on email
   - Use the `/people/checkDuplicate` endpoint before creating

3. **Webhook Verification**
   - Verify webhook signatures for security
   - Handle webhook retries and idempotency

4. **Data Consistency**
   - Always store FUB IDs locally for future reference
   - Implement conflict resolution for bidirectional sync

### Debug Sync Issues

```sql
-- Check sync status
SELECT 
  entity_type,
  operation,
  status,
  COUNT(*) as count,
  MAX(created_at) as last_attempt
FROM fub_sync_log 
GROUP BY entity_type, operation, status
ORDER BY last_attempt DESC;

-- View failed syncs
SELECT * FROM fub_sync_log 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Test Webhook Integration

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks/fub \
  -H "Content-Type: application/json" \
  -d '{
    "type": "person.created",
    "data": {
      "id": 12345,
      "firstName": "Test",
      "lastName": "User",
      "emails": [{"value": "test@example.com"}]
    }
  }'
```

## 📚 Additional Resources

- [Follow Up Boss API Documentation](https://docs.followupboss.com/reference/getting-started)
- [FUB Webhook Documentation](https://docs.followupboss.com/reference/webhooks)
- [Supabase Documentation](https://supabase.com/docs)

## 🔒 Security Considerations

1. **API Key Storage**: Store FUB API keys encrypted
2. **Webhook Security**: Verify webhook signatures
3. **Data Privacy**: Follow GDPR/CCPA requirements
4. **Access Control**: Use RLS policies to restrict data access
5. **Audit Logging**: Log all sync operations for compliance

## 🚀 Next Steps

1. Run the database migrations
2. Configure your FUB API key
3. Test the integration with a few contacts
4. Set up webhooks for real-time sync
5. Monitor sync logs and performance
6. Implement additional FUB features as needed