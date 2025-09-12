# Agent Workflow Requirements

## 🎯 Overview
When agents recommend properties to buyers, they need to follow this exact workflow to ensure proper property state management and buyer experience.

## 🔄 Property Recommendation Workflow

### 1. **Property Addition/Update**
When an agent wants to recommend a property to a buyer:

```sql
-- STEP 1: Insert or Update property in properties table
INSERT INTO properties (
  organization_id,
  address,
  city,
  state,
  zip_code,
  listing_price,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  status,
  mls_number,
  listing_url,
  description
) VALUES (
  '<organization_id>',
  '<address>',
  '<city>',
  '<state>',
  '<zip>',
  <price>,
  <bedrooms>,
  <bathrooms>,
  <sqft>,
  '<type>',
  'active',  -- MUST be 'active' for search tab
  '<mls>',
  '<url>',
  '<description>'
)
ON CONFLICT (mls_number, organization_id) 
DO UPDATE SET
  listing_price = EXCLUDED.listing_price,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  updated_at = NOW();
```

### 2. **Create Buyer-Property Relationship**
After property is in the database:

```sql
-- STEP 2: Add to buyer_properties table
INSERT INTO buyer_properties (
  organization_id,
  buyer_id,
  property_id,
  relationship_type,
  interest_level,
  is_active
) VALUES (
  '<organization_id>',
  '<buyer_id>',
  '<property_id>',
  'home_buyer',
  'interested',  -- MUST be 'interested' initially
  true          -- MUST be true for search tab
);
```

## 🎛️ Property States & Workflow

### **Search Tab Logic**
Properties appear in search tab when:
- `buyer_properties.is_active = true`
- `buyer_properties.interest_level = 'interested'`  
- `properties.status = 'active'`

### **Dashboard Logic**
Properties appear on dashboard when:
- `buyer_properties.interest_level IN ('loved', 'viewing_scheduled', 'under_contract', 'pending')`
- `buyer_properties.is_active = true`
- Has associated timeline created

### **Timeline Creation**
Timelines are automatically created via database triggers when:
- `buyer_properties.interest_level` changes to `'loved'` OR `'viewing_scheduled'`

## 🚀 **NEW: Advanced Stage Property Addition**

### Fast-Moving Market Scenarios
When properties need to be added at advanced stages (common in hot markets):

| Scenario | Use This | Timeline Phase | FUB Stage |
|----------|----------|----------------|-----------|
| **Just recommended** | `interested` | `pre_escrow` | `active_client` |
| **Buyer already loved** | `loved` | `pre_escrow` | `active_client` |  
| **Viewing scheduled** | `viewing_scheduled` | `pre_escrow` | `active_client` |
| **Offer accepted** | `under_contract` | `escrow` | `pending` |
| **In escrow** | `pending` | `escrow` | `pending` |

### Smart Stage Management
- **Automatic Timeline Creation**: Advanced stages auto-create timelines
- **Stage Progression**: System won't downgrade stages (loved → interested won't work)
- **Existing Property Updates**: If property exists at lower stage, it gets upgraded

```javascript
// Example: Adding property that's already under contract
await dataService.addPropertyToBuyer(buyerId, propertyId, {
  initialStage: 'under_contract',
  timelinePhase: 'escrow', 
  fubStage: 'pending'
});
```

## 🚨 Critical Rules

### ✅ DO:
- Always set `properties.status = 'active'` for new recommendations
- Always set `buyer_properties.interest_level = 'interested'` initially
- Always set `buyer_properties.is_active = true` for new recommendations
- Update existing property info if MLS data changes

### ❌ DON'T:
- Never set `interest_level` to `'loved'` or `'viewing_scheduled'` directly (buyer actions only)
- Never set `is_active = false` (buyer actions only)
- Never create timeline manually (triggers handle this)

## 🔄 Buyer Action Results

When buyers interact with properties:

| Action | interest_level | is_active | Timeline | Appears In |
|--------|---------------|-----------|----------|------------|
| **Initial Recommendation** | `interested` | `true` | ❌ | Search Tab |
| **Buyer "Loves"** | `loved` | `true` | ✅ Auto-created | Dashboard |
| **Buyer "Schedules Viewing"** | `viewing_scheduled` | `true` | ✅ Auto-created | Dashboard |
| **Buyer "Passes"** | `passed` | `false` | ❌ | Nowhere |

## 💻 Code Examples

### JavaScript/TypeScript (using Service Layer):

```javascript
// Standard property recommendation (starts at 'interested' stage)
const response = await dataService.addPropertyToBuyer(buyerId, propertyId);

// Property recommendation for advanced stages
const response = await dataService.addPropertyToBuyer(buyerId, propertyId, {
  initialStage: 'under_contract',  // Property already under contract
  timelinePhase: 'escrow',         // In escrow phase
  fubStage: 'pending'              // FUB stage is pending
});

// Property recommendation for viewing already scheduled
const response = await dataService.addPropertyToBuyer(buyerId, propertyId, {
  initialStage: 'viewing_scheduled',
  timelinePhase: 'pre_escrow',
  fubStage: 'active_client'
});
```

### Direct Database Approach (if not using service layer):

```javascript
// Step 1: Upsert property
const { data: property } = await supabase
  .from('properties')
  .upsert({
    ...propertyData,
    status: 'active' // Critical!
  })
  .select('id')
  .single();

// Step 2: Create buyer-property relationship
const { data, error } = await supabase
  .from('buyer_properties')
  .insert({
    buyer_id: buyerId,
    property_id: property.id,
    organization_id: organizationId,
    interest_level: 'interested', // Or advanced stage
    is_active: true
  });

// Step 3: Create timeline if advanced stage
if (initialStage !== 'interested') {
  await supabase.from('timelines').insert({
    buyer_property_id: data.id,
    current_phase: 'pre_escrow', // or 'escrow'/'post_escrow'
    current_fub_stage: 'active_client',
    timeline_name: 'Property Timeline',
    is_active: true
  });
}
```

## 🔍 Validation Queries

To verify the workflow is working:

```sql
-- Check properties in search tab for a buyer
SELECT p.address, bp.interest_level, bp.is_active, p.status
FROM buyer_properties bp
JOIN properties p ON p.id = bp.property_id
WHERE bp.buyer_id = '<buyer_id>'
  AND bp.is_active = true
  AND bp.interest_level = 'interested'
  AND p.status = 'active';

-- Check properties on dashboard for a buyer
SELECT p.address, bp.interest_level, t.current_phase
FROM buyer_properties bp
JOIN properties p ON p.id = bp.property_id
LEFT JOIN timelines t ON t.buyer_property_id = bp.id
WHERE bp.buyer_id = '<buyer_id>'
  AND bp.interest_level IN ('loved', 'viewing_scheduled', 'under_contract', 'pending')
  AND bp.is_active = true;
```

## 🚨 Common Mistakes

1. **Setting wrong initial interest_level**: Don't use `'loved'` initially
2. **Forgetting to set property status**: Must be `'active'` for search
3. **Manual timeline creation**: Let triggers handle this
4. **Not updating existing properties**: Use upsert to keep data fresh

## 🚨 **CRITICAL UPDATES - January 2025**

### **Enhanced Property Addition API**

The `addPropertyToBuyer` method has been significantly enhanced to support fast-moving real estate markets:

#### **NEW Method Signature:**
```typescript
addPropertyToBuyer(
  buyerId: string, 
  propertyId: string, 
  options?: {
    initialStage?: 'interested' | 'loved' | 'viewing_scheduled' | 'under_contract' | 'pending';
    timelinePhase?: 'pre_escrow' | 'escrow' | 'post_escrow';
    fubStage?: 'lead' | 'hot_prospect' | 'nurture' | 'active_client' | 'pending' | 'closed';
  }
): Promise<ApiResponse<any>>
```

#### **Automatic Timeline Creation:**
- **Any stage except 'interested'** automatically creates timelines
- **No buyer interaction required** for advanced stage properties
- **Perfect for hot markets** where properties move quickly

#### **Stage Progression Rules:**
```javascript
// ✅ ALLOWED PROGRESSIONS (forward only)
'interested' → 'loved' → 'viewing_scheduled' → 'under_contract' → 'pending'

// ❌ BLOCKED REGRESSIONS (system prevents)
'under_contract' → 'interested'  // Keeps existing higher stage
'pending' → 'loved'              // Keeps existing higher stage
```

#### **Smart Duplicate Handling:**
- If property already exists at **lower stage** → **Upgrades automatically**
- If property already exists at **same/higher stage** → **No change, returns existing**

### **Updated Integration Examples:**

#### **Standard Recommendation:**
```javascript
// Basic property recommendation (appears in Search Tab)
const response = await dataService.addPropertyToBuyer(buyerId, propertyId);
// Result: interest_level='interested', no timeline
```

#### **Fast Market Scenarios:**
```javascript
// Property already under contract
const response = await dataService.addPropertyToBuyer(buyerId, propertyId, {
  initialStage: 'under_contract',
  timelinePhase: 'escrow',
  fubStage: 'pending'
});
// Result: Timeline created, appears on Dashboard

// Viewing already scheduled
const response = await dataService.addPropertyToBuyer(buyerId, propertyId, {
  initialStage: 'viewing_scheduled',
  timelinePhase: 'pre_escrow',
  fubStage: 'active_client'
});
// Result: Timeline created, appears on Dashboard
```

### **Recommended Agent UI Updates:**

#### **Property Addition Form Enhancement:**
```javascript
// Add stage selector to your property addition form
const PropertyAddForm = () => {
  const [selectedStage, setSelectedStage] = useState('interested');
  const [timelinePhase, setTimelinePhase] = useState('pre_escrow');
  const [fubStage, setFubStage] = useState('active_client');

  const handleSubmit = async () => {
    const response = await dataService.addPropertyToBuyer(
      selectedBuyerId, 
      selectedPropertyId, 
      {
        initialStage: selectedStage,
        timelinePhase: timelinePhase,
        fubStage: fubStage
      }
    );
    
    // Handle response
    if (response.success) {
      alert(`Property added at ${selectedStage} stage`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PropertySelector />
      <BuyerSelector />
      
      {/* NEW: Stage Selector */}
      <StageSelector 
        value={selectedStage}
        onChange={setSelectedStage}
        options={[
          { value: 'interested', label: 'Initial Interest' },
          { value: 'loved', label: 'Buyer Loves Property' },
          { value: 'viewing_scheduled', label: 'Viewing Scheduled' },
          { value: 'under_contract', label: 'Under Contract' },
          { value: 'pending', label: 'Pending Sale' }
        ]}
      />
      
      {selectedStage !== 'interested' && (
        <>
          <TimelinePhaseSelector value={timelinePhase} onChange={setTimelinePhase} />
          <FUBStageSelector value={fubStage} onChange={setFubStage} />
        </>
      )}
      
      <button type="submit">Add Property</button>
    </form>
  );
};
```

#### **Error Handling Updates:**
```javascript
// Updated error handling for new response format
const handlePropertyAddition = async (buyerId, propertyId, options) => {
  try {
    const response = await dataService.addPropertyToBuyer(buyerId, propertyId, options);
    
    if (response.success) {
      // New: Enhanced success message
      console.log(response.data.message); // "Property added at under_contract stage"
      return response.data;
    } else {
      console.error('Error adding property:', response.error);
    }
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

### **Stage-to-Timeline Mapping Reference:**

| Initial Stage | Default Timeline Phase | Default FUB Stage | Appears In |
|---------------|------------------------|-------------------|------------|
| `interested` | No timeline | No timeline | Search Tab |
| `loved` | `pre_escrow` | `active_client` | Dashboard |
| `viewing_scheduled` | `pre_escrow` | `active_client` | Dashboard |
| `under_contract` | `escrow` | `pending` | Dashboard |
| `pending` | `escrow` | `pending` | Dashboard |

### **Testing Checklist:**

- [ ] Test basic property addition (`interested` stage)
- [ ] Test advanced stage addition (`under_contract` stage) 
- [ ] Verify timeline auto-creation for advanced stages
- [ ] Test stage progression (upgrade existing properties)
- [ ] Test stage regression blocking (should maintain higher stage)
- [ ] Verify buyer sees properties in correct tabs (Search vs Dashboard)

### **Breaking Changes:**
- **None** - All existing agent code continues to work
- **Optional Enhancement** - New stage options are optional parameters

### **Performance Impact:**
- **Minimal** - One additional database query for organization lookup
- **Beneficial** - Reduces buyer-side timeline creation load

## 📞 Questions?
Contact the buyer-journey-ai development team for clarification on any workflow requirements.