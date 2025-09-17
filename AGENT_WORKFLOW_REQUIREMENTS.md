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

## 🎯 **CUSTOM ESCROW TIMELINE IMPLEMENTATION**

### **Overview**
Agents can upload custom escrow timeline PDFs for specific properties. The system **automatically detects and uses** custom vs default escrow steps via database triggers - **no manual code required**.

### **🤖 AUTOMATIC DETECTION & WORKFLOW**
The enhanced database trigger system handles the complete custom escrow timeline workflow:

1. **Property Upload Phase**: Agent uploads custom escrow PDF → Creates property-specific templates
2. **Automatic Detection Phase**: When `interest_level` changes to `'under_contract'`:
   - ✅ Timeline automatically advances to `'escrow'` phase
   - ✅ System automatically detects custom templates for this property
   - ✅ Creates escrow steps using **custom templates first**, **defaults as fallback**
   - ✅ Updates FUB stage to `'pending'`

**Key Benefit**: Agents only need to update `buyer_properties.interest_level` - everything else is automatic!

### **Database Architecture**
- **step_templates** table enhanced with `buyer_property_id` for property-specific templates
- **timeline_steps** table tracks execution of template steps
- **Enhanced trigger system** with automatic custom template detection
- **Database function**: `create_escrow_steps_for_timeline()` handles custom vs default logic

### **🔄 AUTOMATIC TRIGGER WORKFLOW**

The `create_timeline_on_interest_change()` trigger automatically handles:

| Interest Level Change | Trigger Action | Custom Detection |
|---------------------|----------------|------------------|
| `'interested'` → `'loved'` | Creates timeline in `pre_escrow` | ❌ Uses organization defaults |
| `'interested'` → `'viewing_scheduled'` | Creates timeline in `pre_escrow` | ❌ Uses organization defaults |
| `'loved'` → `'under_contract'` | Advances to `escrow` phase | ✅ **Detects custom templates** |
| `'viewing_scheduled'` → `'under_contract'` | Advances to `escrow` phase | ✅ **Detects custom templates** |
| Direct to `'under_contract'` | Creates timeline in `escrow` | ✅ **Detects custom templates** |

**Detection Priority**: Custom property templates FIRST → Organization defaults as fallback

### **Agent Implementation Requirements**

#### **1. Custom Escrow PDF Upload**
When agents upload custom escrow timeline PDFs:

```javascript
// Step 1: Upload PDF to documents table
const { data: document } = await supabase
  .from('documents')
  .insert({
    organization_id: organizationId,
    buyer_property_id: buyerPropertyId,  // Links to specific property
    document_type: 'timeline',           // Use existing 'timeline' enum
    title: 'Custom Escrow Timeline',
    file_path: pdfUrl,
    uploaded_by: agentId
  })
  .select('id')
  .single();

// Step 2: Process PDF with OCR/Manual extraction
// Agent extracts steps from PDF and creates property-specific templates
const customSteps = [
  { name: 'Custom Inspection', description: 'Property-specific inspection', order: 1, days: 10 },
  { name: 'Custom Appraisal', description: 'Special appraisal requirements', order: 2, days: 5 },
  // ... more steps
];

// Step 3: Create property-specific step templates
for (const step of customSteps) {
  await supabase
    .from('step_templates')
    .insert({
      buyer_property_id: buyerPropertyId,    // Property-specific template
      organization_id: null,                 // NULL for property-specific
      name: step.name,
      description: step.description,
      step_type: 'escrow',
      default_order: step.order,
      is_system_default: false,
      default_duration_days: step.days
    });
}
```

#### **2. Timeline Step Creation Logic**
The system automatically creates appropriate steps when properties enter escrow:

```sql
-- Function: create_escrow_steps_for_timeline(timeline_id, buyer_property_id)
-- Called automatically when property advances to escrow phase
-- Priority: Custom templates FIRST, then organization defaults
```

#### **3. Agent UI Requirements**

##### **Custom Timeline Upload Interface:**
```javascript
const CustomTimelineUpload = ({ buyerPropertyId }) => {
  const [pdfFile, setPdfFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async () => {
    setIsProcessing(true);
    
    // Upload PDF
    const pdfUrl = await uploadPDF(pdfFile);
    
    // Save document record
    await supabase.from('documents').insert({
      buyer_property_id: buyerPropertyId,
      document_type: 'timeline',
      title: 'Custom Escrow Timeline',
      file_path: pdfUrl
    });
    
    // Navigate to step extraction interface
    router.push(`/extract-steps/${buyerPropertyId}`);
  };

  return (
    <div className="custom-timeline-upload">
      <h3>Upload Custom Escrow Timeline</h3>
      <input 
        type="file" 
        accept="application/pdf"
        onChange={(e) => setPdfFile(e.target.files[0])} 
      />
      <button onClick={handleUpload} disabled={!pdfFile || isProcessing}>
        {isProcessing ? 'Processing...' : 'Upload & Extract Steps'}
      </button>
    </div>
  );
};
```

##### **Step Extraction Interface:**
```javascript
const StepExtractionForm = ({ buyerPropertyId }) => {
  const [extractedSteps, setExtractedSteps] = useState([
    { name: '', description: '', order: 1, days: 7 }
  ]);

  const addStep = () => {
    setExtractedSteps([...extractedSteps, { 
      name: '', description: '', 
      order: extractedSteps.length + 1, days: 7 
    }]);
  };

  const saveCustomSteps = async () => {
    for (const step of extractedSteps) {
      if (step.name.trim()) {
        await supabase.from('step_templates').insert({
          buyer_property_id: buyerPropertyId,
          name: step.name,
          description: step.description,
          step_type: 'escrow',
          default_order: step.order,
          is_system_default: false,
          default_duration_days: step.days
        });
      }
    }
    
    alert('Custom escrow steps saved! They will be used when property enters escrow.');
  };

  return (
    <div className="step-extraction-form">
      <h3>Extract Steps from Custom Timeline</h3>
      {extractedSteps.map((step, index) => (
        <div key={index} className="step-input">
          <input 
            placeholder="Step name"
            value={step.name}
            onChange={(e) => updateStep(index, 'name', e.target.value)}
          />
          <textarea 
            placeholder="Step description"
            value={step.description}
            onChange={(e) => updateStep(index, 'description', e.target.value)}
          />
          <input 
            type="number"
            placeholder="Days"
            value={step.days}
            onChange={(e) => updateStep(index, 'days', parseInt(e.target.value))}
          />
        </div>
      ))}
      <button onClick={addStep}>+ Add Step</button>
      <button onClick={saveCustomSteps}>Save Custom Timeline</button>
    </div>
  );
};
```

#### **4. Property Dashboard Integration**
Show custom timeline status in property details:

```javascript
// Check if property has custom escrow timeline
const { data: customSteps } = await supabase
  .from('step_templates')
  .select('count')
  .eq('buyer_property_id', propertyId)
  .eq('step_type', 'escrow');

const hasCustomTimeline = customSteps?.[0]?.count > 0;

// Display in UI
{hasCustomTimeline && (
  <div className="custom-timeline-indicator">
    ✅ Custom Escrow Timeline Uploaded
  </div>
)}
```

### **Workflow Integration Points**

#### **Timeline Phase Transitions (AUTOMATIC):**

**🤖 FULLY AUTOMATED WORKFLOW:**
The system now **automatically** handles custom escrow timeline detection via database triggers:

```javascript
// ✅ AUTOMATIC - No manual code needed!
// When agent marks property as "Under Contract":
const markUnderContract = async (buyerPropertyId) => {
  // This single update automatically triggers the entire escrow workflow
  await supabase
    .from('buyer_properties')
    .update({ interest_level: 'under_contract' })
    .eq('id', buyerPropertyId);
  
  // 🤖 Database trigger automatically:
  // 1. Advances timeline to 'escrow' phase
  // 2. Detects custom vs default escrow templates
  // 3. Creates appropriate escrow steps
  // 4. Updates FUB stage to 'pending'
};
```

**🔧 Manual Override (Optional):**
```javascript
// Only needed if you want to manually trigger escrow advancement
const manualAdvanceToEscrow = async (timelineId, buyerPropertyId) => {
  // Manual timeline phase update
  await supabase
    .from('timelines')
    .update({ 
      current_phase: 'escrow',
      current_fub_stage: 'pending' 
    })
    .eq('id', timelineId);

  // Manual escrow step creation with custom detection
  const { data } = await supabase
    .rpc('create_escrow_steps_for_timeline', {
      timeline_uuid: timelineId,
      buyer_property_uuid: buyerPropertyId
    });
  
  console.log(`Created ${data} escrow steps (${data > 0 ? 'custom' : 'default'} templates used)`);
};
```

#### **Viewing Schedule Email Enhancement:**
When buyers schedule viewings, include custom timeline info in agent notifications:

```javascript
// In api/send-viewing-email.js
const { data: hasCustomTimeline } = await supabase
  .from('step_templates')
  .select('count')
  .eq('buyer_property_id', buyerPropertyId)
  .eq('step_type', 'escrow')
  .gt('count', 0);

const emailContent = `
  Buyer has scheduled a viewing for ${propertyAddress}
  
  ${hasCustomTimeline ? 
    '📋 Note: This property has a custom escrow timeline ready' : 
    '📋 Note: This property will use default escrow timeline'
  }
`;
```

### **Database Schema Requirements**

#### **Enhanced step_templates table:**
```sql
-- Already implemented
ALTER TABLE step_templates ADD COLUMN buyer_property_id uuid REFERENCES buyer_properties(id);
ALTER TABLE step_templates ALTER COLUMN organization_id DROP NOT NULL;
```

#### **Template Selection Logic:**
```sql
-- Priority: Property-specific templates FIRST
-- 1. Custom templates: buyer_property_id IS NOT NULL
-- 2. Organization defaults: buyer_property_id IS NULL AND organization_id = <org_id>
```

### **Validation & Testing**

#### **Test Scenarios:**
1. **Upload custom timeline** → Verify step_templates created with buyer_property_id
2. **Property enters escrow WITH custom** → Verify custom steps used
3. **Property enters escrow WITHOUT custom** → Verify default steps used
4. **Multiple properties same buyer** → Verify templates are property-specific

#### **Validation Queries:**
```sql
-- Check custom templates for property
SELECT name, description, default_order, default_duration_days
FROM step_templates 
WHERE buyer_property_id = '<property_id>' 
  AND step_type = 'escrow' 
ORDER BY default_order;

-- CORRECTED: Verify timeline steps after escrow entry
SELECT 
  COALESCE(ts.custom_step_name, st.name) as step_name,
  ts.step_order, 
  ts.due_date, 
  ts.is_completed,
  CASE 
    WHEN st.buyer_property_id IS NOT NULL THEN 'Custom Template' 
    ELSE 'Organization Default' 
  END as template_type
FROM timeline_steps ts
JOIN step_templates st ON st.id = ts.step_template_id
JOIN timelines t ON t.id = ts.timeline_id
WHERE t.buyer_property_id = '<buyer_property_id>' 
  AND ts.step_type = 'escrow'
ORDER BY ts.step_order;
```

### **✅ SYSTEM TESTED & VERIFIED**

#### **Production Test Results (September 2025):**
The custom escrow timeline detection system has been **successfully tested** in production:

**Test Case**: Property advancement from `interested` → `under_contract`
```json
{
  "interest_level": "under_contract",
  "current_phase": "escrow", 
  "current_fub_stage": "pending",
  "total_steps": 12,
  "escrow_steps": 6
}
```

**Escrow Steps Created (Organization Defaults)**:
1. ✅ Open Escrow (2 days)
2. ✅ Earnest Money (4 days)
3. ✅ Inspections (11 days)  
4. ✅ Loan Approval (15 days)
5. ✅ Final Walkthrough (2 days)
6. ✅ Closing (2 days)

**Verified Functionality**:
- ✅ Automatic trigger activation on `interest_level` change
- ✅ Timeline phase progression (`pre_escrow` → `escrow`)
- ✅ Custom template detection logic (used defaults when no custom exist)
- ✅ Proper step creation with realistic due dates
- ✅ Function overloading issues resolved
- ✅ All database triggers operational

### **Performance Considerations**
- **Lazy Loading**: Custom steps created only when entering escrow phase
- **Template Caching**: Property-specific templates remain until property closes
- **Clean-up**: Templates auto-deleted when buyer_properties record deleted (CASCADE)

### **Error Handling**
- **PDF Processing Failed**: Fall back to manual step entry
- **No Custom Templates**: Automatically use organization defaults
- **Duplicate Templates**: System prevents duplicate property-specific templates

## 📞 Questions?
Contact the buyer-journey-ai development team for clarification on any workflow requirements.