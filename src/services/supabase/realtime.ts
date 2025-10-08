// Real-time Synchronization Service
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

export type RealtimeCallback<T = any> = (payload: T) => void;

export interface RealtimePayload<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  errors: string[] | null;
}

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();

  /**
   * Subscribe to timeline changes for a specific person
   */
  subscribeToTimelineChanges(
    personId: string,
    callback: RealtimeCallback<RealtimePayload>
  ): () => void {
    const channelName = `timeline-${personId}`;

    // Clean up existing channel if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timelines',
          filter: `person_id=eq.${personId}`,
        },
        (payload) => {
          console.log('[Realtime] Timeline changed:', payload);
          callback(payload as RealtimePayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to timeline changes for person ${personId}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[Realtime] Error subscribing to timeline for person ${personId}`);
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to timeline step changes
   */
  subscribeToTimelineStepChanges(
    timelineId: string,
    callback: RealtimeCallback<RealtimePayload>
  ): () => void {
    const channelName = `timeline-steps-${timelineId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timeline_steps',
          filter: `timeline_id=eq.${timelineId}`,
        },
        (payload) => {
          console.log('[Realtime] Timeline step changed:', payload);
          callback(payload as RealtimePayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to step changes for timeline ${timelineId}`);
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to buyer_properties changes (interest level changes, etc.)
   */
  subscribeToBuyerPropertyChanges(
    buyerId: string,
    callback: RealtimeCallback<RealtimePayload>
  ): () => void {
    const channelName = `buyer-properties-${buyerId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'buyer_properties',
          filter: `buyer_id=eq.${buyerId}`,
        },
        (payload) => {
          console.log('[Realtime] Buyer property changed:', payload);
          callback(payload as RealtimePayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to property changes for buyer ${buyerId}`);
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to action_items changes
   */
  subscribeToActionItemChanges(
    buyerId: string,
    callback: RealtimeCallback<RealtimePayload>
  ): () => void {
    const channelName = `action-items-${buyerId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'action_items',
          filter: `assigned_buyer_id=eq.${buyerId}`,
        },
        (payload) => {
          console.log('[Realtime] Action item changed:', payload);
          callback(payload as RealtimePayload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to action items for buyer ${buyerId}`);
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to buyer_profile changes (using pg_notify broadcast)
   */
  subscribeToBuyerProfileChanges(
    personId: string,
    callback: RealtimeCallback<any>
  ): () => void {
    const channelName = `buyer-profile-${personId}`;

    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buyer_profiles',
          filter: `person_id=eq.${personId}`,
        },
        (payload) => {
          console.log('[Realtime] Buyer profile changed:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to profile changes for person ${personId}`);
        }
      });

    this.channels.set(channelName, channel);

    return () => this.unsubscribe(channelName);
  }

  /**
   * Subscribe to ALL timeline-related changes for a person (comprehensive)
   */
  subscribeToAllTimelineUpdates(
    personId: string,
    timelineId: string | undefined,
    callbacks: {
      onTimelineChange?: RealtimeCallback<RealtimePayload>;
      onStepChange?: RealtimeCallback<RealtimePayload>;
      onPropertyChange?: RealtimeCallback<RealtimePayload>;
      onActionItemChange?: RealtimeCallback<RealtimePayload>;
    }
  ): () => void {
    const unsubscribeFns: Array<() => void> = [];

    // Subscribe to timeline changes
    if (callbacks.onTimelineChange) {
      unsubscribeFns.push(
        this.subscribeToTimelineChanges(personId, callbacks.onTimelineChange)
      );
    }

    // Subscribe to step changes if we have a timeline ID
    if (timelineId && callbacks.onStepChange) {
      unsubscribeFns.push(
        this.subscribeToTimelineStepChanges(timelineId, callbacks.onStepChange)
      );
    }

    // Subscribe to property changes
    if (callbacks.onPropertyChange) {
      unsubscribeFns.push(
        this.subscribeToBuyerPropertyChanges(personId, callbacks.onPropertyChange)
      );
    }

    // Subscribe to action item changes
    if (callbacks.onActionItemChange) {
      unsubscribeFns.push(
        this.subscribeToActionItemChanges(personId, callbacks.onActionItemChange)
      );
    }

    // Return cleanup function that unsubscribes from all
    return () => {
      unsubscribeFns.forEach((fn) => fn());
    };
  }

  /**
   * Unsubscribe from a specific channel
   */
  private unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      console.log(`[Realtime] Unsubscribing from ${channelName}`);
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll(): void {
    console.log('[Realtime] Unsubscribing from all channels');
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }

  /**
   * Get connection status
   */
  getChannelStatus(channelName: string): string | undefined {
    const channel = this.channels.get(channelName);
    return channel?.state;
  }

  /**
   * Get all active channels
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();
