# Timeline Synchronization Implementation Guide

This guide explains how to integrate the real-time timeline synchronization between the agent view (domai-agent-view) and buyer view (buyer-journey-ai).

## 🎯 Overview

The timeline synchronization system ensures that any changes made in the agent view are immediately reflected in the buyer view, and vice versa. This is achieved through:

1. **Database Triggers** - Automatic synchronization at the database level
2. **Real-time Subscriptions** - Supabase real-time channels for instant updates
3. **React Query Integration** - Optimistic updates and cache invalidation

## 📁 New Files Created

### Types & Interfaces
- `src/services/api/timeline-types.ts` - Complete timeline type definitions matching Supabase schema

### Data Services
- `src/services/supabase/timeline.ts` - Timeline CRUD operations
- `src/services/supabase/realtime.ts` - Real-time subscription management

### React Hooks
- `src/hooks/useTimeline.ts` - Timeline data hooks with real-time sync

### Components
- `src/components/ProgressTrackerLive.tsx` - Updated progress tracker using real data

## 🔧 Integration Steps

### Step 1: Update Your Component to Use Real Timeline

Replace the old `ProgressTracker` with `ProgressTrackerLive`:

```tsx
// Before
import ProgressTracker from '@/components/ProgressTracker';

<ProgressTracker showDetailed={true} />

// After
import ProgressTrackerLive from '@/components/ProgressTrackerLive';

<ProgressTrackerLive personId={buyerId} showDetailed={true} />
```

### Step 2: Access Timeline Data in Any Component

Use the timeline hooks to access timeline data:

```tsx
import { useTimelineOperations } from '@/hooks/useTimeline';

function MyComponent({ buyerId }: { buyerId: string }) {
  const {
    timeline,
    summary,
    isLoading,
    error,
    toggleStepCompletion,
    refetch
  } = useTimelineOperations(buyerId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>{timeline.timeline_name}</h2>
      <p>Progress: {summary.progress_percentage}%</p>
      <p>Phase: {summary.current_phase_name}</p>

      {/* Show steps */}
      {timeline.steps?.map(step => (
        <div key={step.id}>
          <input
            type="checkbox"
            checked={step.is_completed}
            onChange={() => toggleStepCompletion(step.id, step.is_completed)}
          />
          {step.template_name || step.custom_step_name}
        </div>
      ))}
    </div>
  );
}
```

### Step 3: Use Individual Hooks for Specific Needs

```tsx
// Just get timeline data
const { data: timeline } = useTimeline(personId);

// Just get summary
const { data: summary } = useTimelineSummary(personId);

// Get timeline for a specific property
const { data: propertyTimeline } = usePropertyTimeline(buyerPropertyId);

// Mutations
const { mutate: updateStep } = useUpdateTimelineStep();
const { mutate: completeStep } = useCompleteTimelineStep();
```

## 🔄 How Real-time Synchronization Works

### Agent Makes a Change

1. Agent updates timeline step in domai-agent-view
2. Database trigger fires (`sync_timeline_phase`, `handle_step_completion`, etc.)
3. Supabase broadcasts `postgres_changes` event
4. Buyer view receives event via subscription
5. React Query invalidates cached data
6. Component automatically re-fetches and re-renders

### Buyer Makes a Change

1. Buyer completes a step in buyer-journey-ai
2. `completeTimelineStep` mutation executes
3. Database updates via `timeline_steps` table
4. Same trigger and broadcast mechanism as above
5. Agent view receives update in real-time

## 📊 Database Schema Reference

### Key Tables

#### `timelines`
- `id` - Timeline UUID
- `person_id` - Buyer person UUID
- `buyer_property_id` - Optional property relationship
- `current_phase` - 'pre_escrow' | 'escrow' | 'post_escrow' | 'inactive'
- `current_fub_stage` - Follow Up Boss stage
- `timeline_name` - Display name
- `is_active` - Active status

#### `timeline_steps`
- `id` - Step UUID
- `timeline_id` - Parent timeline
- `step_template_id` - Template reference
- `custom_step_name` - Custom name override
- `step_type` - Phase this step belongs to
- `step_order` - Display order
- `is_completed` - Completion status
- `completed_date` - When completed
- `due_date` - When due

### Key Triggers

1. **`auto_create_timeline()`** - Creates timeline when buyer_property interest level changes
2. **`create_timeline_on_interest_change()`** - Advances timeline phase automatically
3. **`handle_step_completion()`** - Updates completion status and dates
4. **`sync_timeline_phase()`** - Records phase changes in history

## 🧪 Testing the Synchronization

### Test 1: Basic Timeline Display

1. Open buyer view with a buyer who has a timeline
2. Verify timeline displays with correct steps
3. Check progress percentage matches database

### Test 2: Agent Updates → Buyer Sees

1. Open buyer view for a specific buyer
2. In agent view, mark a timeline step as complete
3. **Expected**: Buyer view updates within 1-2 seconds
4. Progress bar should advance
5. Step should show as completed

### Test 3: Buyer Updates → Agent Sees

1. Open agent view for a specific buyer
2. In buyer view, check off a step
3. **Expected**: Agent view updates in real-time
4. Timeline should reflect the completion

### Test 4: Phase Advancement

1. In agent view, change buyer_property interest_level from 'loved' to 'under_contract'
2. **Expected**:
   - Timeline phase advances from 'pre_escrow' to 'escrow'
   - Escrow steps are auto-created
   - Both views update immediately

### Test 5: Connection Resilience

1. Disconnect network
2. Make changes in buyer view
3. **Expected**: Changes queue locally
4. Reconnect network
5. **Expected**: Changes sync automatically

## 🐛 Troubleshooting

### Timeline Not Loading

**Issue**: Timeline is `null` or loading forever

**Checks**:
```sql
-- Verify person has a timeline
SELECT * FROM timelines WHERE person_id = '<buyer-uuid>' AND is_active = true;

-- Check if buyer has correct role
SELECT roles FROM persons WHERE id = '<buyer-uuid>';
```

**Solution**: Ensure person has 'buyer' role and a timeline was auto-created

### Real-time Not Working

**Issue**: Changes in agent view don't appear in buyer view

**Checks**:
1. Open browser console
2. Look for `[Realtime]` log messages
3. Verify subscription status

**Common Causes**:
- Supabase URL/key mismatch
- RLS policies blocking reads
- Network/firewall blocking WebSocket

**Solution**:
```tsx
// Check active subscriptions
import { realtimeService } from '@/services/supabase/realtime';

console.log('Active channels:', realtimeService.getActiveChannels());
console.log('Channel status:', realtimeService.getChannelStatus('timeline-<personId>'));
```

### Steps Out of Order

**Issue**: Timeline steps appear in wrong order

**Cause**: `step_order` field inconsistency

**Solution**:
```sql
-- Fix step order for a timeline
UPDATE timeline_steps
SET step_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM timeline_steps
  WHERE timeline_id = '<timeline-id>'
) AS subquery
WHERE timeline_steps.id = subquery.id;
```

## 🔒 Security Considerations

### Row Level Security (RLS)

The database has RLS policies that ensure:
- Buyers can only see their own timeline
- Agents can see timelines for buyers in their organization
- System admin can see all timelines

### Authentication

Timeline hooks require the buyer to be authenticated:

```tsx
// In your AuthContext
const { user } = useAuth();
const buyerId = user?.id;

// Pass to timeline hooks
<ProgressTrackerLive personId={buyerId} />
```

## 📈 Performance Optimization

### Caching Strategy

React Query caches timeline data with:
- **staleTime**: 1 minute (data considered fresh for 60 seconds)
- **Automatic refetch**: On window focus, network reconnect
- **Real-time invalidation**: When database changes detected

### Subscription Management

Real-time subscriptions automatically:
- Unsubscribe when component unmounts
- Handle reconnection on network issues
- Clean up resources properly

### Best Practices

1. **Use `enableRealtime` flag** to disable real-time for non-critical views
2. **Batch updates** when making multiple changes
3. **Show optimistic UI** while mutations are in flight
4. **Handle loading states** gracefully

## 🚀 Advanced Usage

### Custom Real-time Callbacks

```tsx
import { realtimeService } from '@/services/supabase/realtime';

// Subscribe to timeline changes with custom handling
useEffect(() => {
  const unsubscribe = realtimeService.subscribeToTimelineChanges(
    personId,
    (payload) => {
      // Custom logic here
      console.log('Timeline changed:', payload);

      if (payload.eventType === 'UPDATE') {
        // Handle update
        toast.success('Timeline updated!');
      }
    }
  );

  return unsubscribe;
}, [personId]);
```

### Optimistic Updates

```tsx
const { mutate } = useCompleteTimelineStep();

const handleComplete = (stepId: string) => {
  // Optimistically update UI
  queryClient.setQueryData(['timeline', personId], (old) => ({
    ...old,
    steps: old.steps.map(s =>
      s.id === stepId ? { ...s, is_completed: true } : s
    )
  }));

  // Then make actual API call
  mutate({ stepId }, {
    onError: () => {
      // Revert on error
      queryClient.invalidateQueries(['timeline', personId]);
    }
  });
};
```

## 📚 Additional Resources

- [Supabase Real-time Documentation](https://supabase.com/docs/guides/realtime)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Agent View Realtime Service](../domai-agent-view/js/realtime-notification-service.js)

## ✅ Checklist

Before deploying:

- [ ] Timeline types are properly imported
- [ ] Supabase client is configured with correct URL/keys
- [ ] RLS policies are in place
- [ ] Database triggers are active
- [ ] Real-time subscriptions are tested
- [ ] Error handling is implemented
- [ ] Loading states are shown
- [ ] Both agent and buyer views are tested together
- [ ] Network resilience is verified
- [ ] Performance is acceptable
