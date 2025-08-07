# 🚀 FUB Integration Usage Guide

This guide shows you how to use the Follow Up Boss integration in your buyer journey application with practical examples.

## 🎯 Quick Start

### 1. Enable FUB Integration

First, configure the integration in your Supabase database:

```sql
-- Update configuration to enable FUB sync
UPDATE fub_configuration SET 
  api_key = 'your_fub_api_key_here',
  sync_enabled = true,
  sync_frequency_minutes = 15;

-- Verify configuration
SELECT * FROM fub_configuration;
```

### 2. Create FUB Service

Create a service to handle FUB operations:

```typescript
// src/services/fub/index.ts
import { supabase } from '@/lib/supabaseClient';

export class FUBService {
  private async getFUBConfig() {
    const { data } = await supabase
      .from('fub_configuration')
      .select('*')
      .single();
    return data;
  }

  async syncBuyerToFUB(buyerId: string) {
    const config = await this.getFUBConfig();
    if (!config?.sync_enabled) return;

    // Implementation here
  }
}

export const fubService = new FUBService();
```

## 📝 Common Use Cases

### 1. 🏠 Track Property Interest

When a buyer views or saves a property:

```typescript
// src/components/PropertyCard.tsx
import { fubService } from '@/services/fub';

const PropertyCard = ({ property, onPropertyClick }) => {
  const handlePropertyView = async () => {
    // Track the view locally
    onPropertyClick(property.id);
    
    // Send event to FUB
    if (userData?.id) {
      await fubService.createPropertyViewEvent(userData.id, property.id);
    }
  };

  return (
    <Card onClick={handlePropertyView} className="cursor-pointer">
      {/* Property content */}
    </Card>
  );
};
```

FUB Service implementation:

```typescript
// src/services/fub/index.ts (continued)
async createPropertyViewEvent(buyerId: string, propertyId: string) {
  try {
    // Get buyer and property data
    const buyer = await this.getBuyerById(buyerId);
    const property = await this.getPropertyById(propertyId);
    
    if (!buyer.fub_person_id) {
      // Create FUB contact first
      await this.syncBuyerToFUB(buyerId);
    }

    // Create FUB event
    const eventData = {
      type: 'PropertyView',
      subject: `Viewed ${property.address}`,
      message: `${buyer.first_name} viewed property details online`,
      person: {
        firstName: buyer.first_name,
        lastName: buyer.last_name,
        emails: [{ value: buyer.email }],
      },
      property: {
        address: property.address,
        city: property.city,
        state: property.state,
        zip: property.zip_code,
        price: property.listing_price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
      },
    };

    const response = await this.fubApiCall('/events', 'POST', eventData);
    
    // Store event locally
    await supabase.from('fub_events').insert({
      fub_event_id: response.id,
      person_id: buyerId,
      property_id: propertyId,
      event_type: 'property_view',
      title: `Viewed ${property.address}`,
      description: 'Property viewed online',
    });

    console.log('Property view tracked in FUB');
  } catch (error) {
    console.error('Failed to track property view:', error);
  }
}
```

### 2. 📞 Track Communication

When an agent calls or texts a buyer:

```typescript
// src/components/ContactModal.tsx
const ContactModal = ({ buyer, onClose }) => {
  const [callNotes, setCallNotes] = useState('');

  const handleCallCompleted = async () => {
    await fubService.logCall(buyer.id, {
      direction: 'outbound',
      duration: 300, // 5 minutes
      notes: callNotes,
      status: 'completed',
    });
    
    // Also create a note
    await fubService.createNote(buyer.id, {
      subject: 'Follow-up call',
      body: callNotes,
      noteType: 'call',
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      {/* Modal content */}
      <Button onClick={handleCallCompleted}>
        Complete Call
      </Button>
    </Dialog>
  );
};
```

### 3. 📅 Schedule Property Showing

When scheduling a property showing:

```typescript
// src/components/ScheduleShowingModal.tsx
const ScheduleShowingModal = ({ buyer, property, agent }) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');

  const handleScheduleShowing = async () => {
    const showingDateTime = new Date(`${selectedDate?.toDateString()} ${selectedTime}`);
    
    // Create appointment in FUB
    await fubService.scheduleAppointment(buyer.id, property.id, agent.id, {
      title: `Property Showing - ${property.address}`,
      description: `Show property to ${buyer.first_name} ${buyer.last_name}`,
      location: `${property.address}, ${property.city}, ${property.state}`,
      startTime: showingDateTime,
      endTime: new Date(showingDateTime.getTime() + 60 * 60 * 1000), // 1 hour
    });

    // Update local property status
    await supabase
      .from('buyer_properties')
      .update({ 
        status: 'viewing',
        action_required: 'none',
        last_activity_at: new Date().toISOString(),
      })
      .eq('buyer_id', buyer.id)
      .eq('property_id', property.id);
  };

  return (
    <Dialog>
      <DatePicker date={selectedDate} onSelect={setSelectedDate} />
      <TimePicker value={selectedTime} onChange={setSelectedTime} />
      <Button onClick={handleScheduleShowing}>Schedule Showing</Button>
    </Dialog>
  );
};
```

### 4. 💰 Create Deal for Offer

When a buyer submits an offer:

```typescript
// src/components/OfferModal.tsx
const OfferModal = ({ buyer, property, agent }) => {
  const [offerAmount, setOfferAmount] = useState(property.listing_price);
  const [terms, setTerms] = useState('');

  const handleSubmitOffer = async () => {
    // Create deal in FUB
    await fubService.createDeal(buyer.id, property.id, agent.id, {
      dealType: 'buyer',
      value: offerAmount,
      stage: 'Offer Submitted',
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
      terms: terms,
    });

    // Update local status
    await supabase
      .from('buyer_properties')
      .update({
        status: 'offer_submitted',
        buying_stage: 'offer_negotiation',
        purchase_price: offerAmount,
        offer_date: new Date().toISOString(),
        action_required: 'review_documents',
      })
      .eq('buyer_id', buyer.id)
      .eq('property_id', property.id);

    // Create follow-up task
    await fubService.createTask(buyer.id, agent.id, {
      title: 'Follow up on offer response',
      description: `Check with listing agent on offer for ${property.address}`,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      priority: 'high',
    });
  };

  return (
    <Dialog>
      <Input 
        type="number" 
        value={offerAmount} 
        onChange={(e) => setOfferAmount(Number(e.target.value))}
        placeholder="Offer amount"
      />
      <Textarea 
        value={terms} 
        onChange={(e) => setTerms(e.target.value)}
        placeholder="Offer terms and conditions"
      />
      <Button onClick={handleSubmitOffer}>Submit Offer</Button>
    </Dialog>
  );
};
```

## 🔄 Auto-Sync Setup

### 1. Real-time Sync on Data Changes

Set up database triggers to sync changes automatically:

```sql
-- Function to sync buyer changes to FUB
CREATE OR REPLACE FUNCTION sync_buyer_to_fub()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if FUB sync is enabled for this buyer
  IF NEW.fub_sync_enabled = true THEN
    -- Insert sync job
    INSERT INTO fub_sync_log (entity_type, entity_id, operation, status)
    VALUES ('person', NEW.id::text, 'update', 'pending');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on buyer updates
CREATE TRIGGER buyer_fub_sync_trigger
  AFTER UPDATE ON buyers
  FOR EACH ROW
  EXECUTE FUNCTION sync_buyer_to_fub();
```

### 2. Background Sync Worker

Create a background worker to process sync jobs:

```typescript
// src/workers/fubSyncWorker.ts
export class FUBSyncWorker {
  private isRunning = false;
  private syncInterval = 15000; // 15 seconds

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;

    while (this.isRunning) {
      await this.processPendingSyncs();
      await this.sleep(this.syncInterval);
    }
  }

  private async processPendingSyncs() {
    const { data: pendingSyncs } = await supabase
      .from('fub_sync_log')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    for (const sync of pendingSyncs || []) {
      try {
        await this.processSync(sync);
        
        await supabase
          .from('fub_sync_log')
          .update({ 
            status: 'success',
            processed_at: new Date().toISOString(),
          })
          .eq('id', sync.id);
          
      } catch (error) {
        await supabase
          .from('fub_sync_log')
          .update({ 
            status: 'failed',
            error_message: error.message,
            retry_count: sync.retry_count + 1,
          })
          .eq('id', sync.id);
      }
    }
  }

  private async processSync(sync: any) {
    switch (sync.entity_type) {
      case 'person':
        if (sync.operation === 'update') {
          await fubService.syncBuyerToFUB(sync.entity_id);
        }
        break;
      // Handle other entity types
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the worker
const syncWorker = new FUBSyncWorker();
syncWorker.start();
```

## 📊 Dashboard Integration

### Show FUB Data in Dashboard

```typescript
// src/components/FUBDashboard.tsx
const FUBDashboard = () => {
  const [fubStats, setFubStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);

  useEffect(() => {
    loadFUBData();
  }, []);

  const loadFUBData = async () => {
    // Load FUB statistics
    const stats = await supabase
      .from('fub_deals')
      .select('*')
      .eq('deal_status', 'active');
    
    // Load recent activities
    const activities = await supabase
      .from('fub_events')
      .select('*, buyers!person_id(*)')
      .order('happened_at', { ascending: false })
      .limit(10);
    
    // Load upcoming tasks
    const tasks = await supabase
      .from('fub_tasks')
      .select('*, buyers!person_id(*)')
      .eq('status', 'pending')
      .gte('due_date', new Date().toISOString())
      .order('due_date')
      .limit(5);

    setFubStats(stats.data);
    setRecentActivities(activities.data);
    setUpcomingTasks(tasks.data);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* FUB Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Active Deals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {fubStats?.length || 0}
          </div>
          <p className="text-sm text-muted-foreground">
            Properties in pipeline
          </p>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.buyers?.first_name} {activity.buyers?.last_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {upcomingTasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-2">
                <Checkbox />
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 🔧 Configuration Settings

### FUB Settings Panel

```typescript
// src/components/FUBSettingsPanel.tsx
const FUBSettingsPanel = () => {
  const [config, setConfig] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [syncEnabled, setSyncEnabled] = useState(false);

  const handleSaveSettings = async () => {
    await supabase
      .from('fub_configuration')
      .update({
        api_key: apiKey,
        sync_enabled: syncEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id);

    toast.success('FUB settings saved successfully');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Follow Up Boss Integration</CardTitle>
        <CardDescription>
          Configure your FUB integration settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="api-key">FUB API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your FUB API key"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="sync-enabled"
            checked={syncEnabled}
            onCheckedChange={setSyncEnabled}
          />
          <Label htmlFor="sync-enabled">Enable automatic sync</Label>
        </div>

        <Button onClick={handleSaveSettings}>
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
};
```

## 📈 Monitoring & Analytics

### Sync Status Monitor

```typescript
// src/components/FUBSyncMonitor.tsx
const FUBSyncMonitor = () => {
  const [syncLogs, setSyncLogs] = useState([]);
  const [syncStats, setSyncStats] = useState(null);

  useEffect(() => {
    loadSyncData();
    const interval = setInterval(loadSyncData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSyncData = async () => {
    // Load recent sync logs
    const { data: logs } = await supabase
      .from('fub_sync_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    // Load sync statistics
    const { data: stats } = await supabase
      .from('fub_sync_log')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    setSyncLogs(logs);
    setSyncStats(stats?.reduce((acc, log) => {
      acc[log.status] = (acc[log.status] || 0) + 1;
      return acc;
    }, {}));
  };

  return (
    <div className="space-y-6">
      {/* Sync Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="Successful" value={syncStats?.success || 0} color="green" />
        <StatCard title="Failed" value={syncStats?.failed || 0} color="red" />
        <StatCard title="Pending" value={syncStats?.pending || 0} color="yellow" />
        <StatCard title="Total" value={Object.values(syncStats || {}).reduce((a, b) => a + b, 0)} />
      </div>

      {/* Sync Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sync Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entity</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {syncLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.entity_type}</TableCell>
                  <TableCell>{log.operation}</TableCell>
                  <TableCell>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-red-500 text-xs">
                    {log.error_message}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 🎯 Best Practices

### 1. Error Handling

Always wrap FUB API calls in try-catch blocks and handle errors gracefully:

```typescript
async function safeFUBCall(operation: () => Promise<any>) {
  try {
    return await operation();
  } catch (error) {
    console.error('FUB API Error:', error);
    
    // Log to sync log table
    await supabase.from('fub_sync_log').insert({
      entity_type: 'unknown',
      entity_id: 'unknown',
      operation: 'api_call',
      status: 'failed',
      error_message: error.message,
    });
    
    // Show user-friendly message
    toast.error('Unable to sync with Follow Up Boss. Please try again.');
    return null;
  }
}
```

### 2. Rate Limiting

Implement rate limiting to avoid hitting FUB API limits:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 1000; // Per hour
  private timeWindow = 60 * 60 * 1000; // 1 hour in ms

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

### 3. Data Validation

Always validate data before sending to FUB:

```typescript
function validateFUBPersonData(data: any): boolean {
  // Check required fields
  if (!data.firstName && !data.lastName) return false;
  if (!data.emails || data.emails.length === 0) return false;
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.emails.some(email => emailRegex.test(email.value))) return false;
  
  return true;
}
```

This usage guide provides practical examples of how to integrate FUB into your buyer journey application. Start with these basic implementations and expand based on your specific needs!