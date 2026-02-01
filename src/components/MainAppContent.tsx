import { useState, useEffect } from 'react';
import ModernDashboard from '@/components/ModernDashboard';
import ChatbotInterface from '@/components/ChatbotInterface';
import ChatbotTest from '@/components/ChatbotTest';
import PropertySwiping from '@/components/PropertySwiping';
import ProfilePage from '@/components/ProfilePage';
import PropertyDetailPage from '@/components/PropertyDetailPage';
import { VoicePreferenceInput } from '@/components/VoicePreferenceInput';
import { dataService } from '@/services';
import { UserData } from '@/types/user';
import { ExtractedPreferences } from '@/components/VoiceRecorder';

interface MainAppContentProps {
  activeTab: string;
  userData: UserData | null;
  onTabChange?: (tab: string) => void;
  openEditProfileOnMount?: boolean;
}

const MainAppContent = ({ activeTab, userData, onTabChange, openEditProfileOnMount }: MainAppContentProps) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [agentEmail, setAgentEmail] = useState<string>('agent@example.com');
  const [shouldOpenEditProfile, setShouldOpenEditProfile] = useState(openEditProfileOnMount || false);

  // Fetch agent email using proper buyer->agent lookup flow
  useEffect(() => {
    const fetchAgentEmail = async () => {
      if (!userData?.email) {
        console.log('[MainAppContent] No user email available for agent lookup');
        return;
      }

      try {
        console.log('[MainAppContent] Fetching buyer info for email:', userData.email);

        // Step 1: Get buyer info to find their assigned_agent_id
        const buyerResponse = await dataService.getBuyerByEmail(userData.email);
        console.log('[MainAppContent] getBuyerByEmail response:', buyerResponse);

        if (buyerResponse.success && buyerResponse.data?.assigned_agent_id) {
          const agentId = buyerResponse.data.assigned_agent_id;
          console.log('[MainAppContent] Found assigned_agent_id:', agentId);

          // Step 2: Get agent info using the assigned_agent_id
          const agentResponse = await dataService.getAgentById(agentId);
          console.log('[MainAppContent] getAgentById response:', agentResponse);

          if (agentResponse.success && agentResponse.data?.email) {
            console.log('[MainAppContent] Setting agent email to:', agentResponse.data.email);
            setAgentEmail(agentResponse.data.email);
          } else {
            console.log('[MainAppContent] Failed to get agent details:', agentResponse);
          }
        } else {
          console.log('[MainAppContent] No assigned_agent_id found for buyer:', buyerResponse);
        }
      } catch (error) {
        console.error('[MainAppContent] Error fetching agent email:', error);
        // Keep default email on error
      }
    };

    fetchAgentEmail();
  }, [userData?.email]);

  const handleChatBack = () => {
    // Navigation handled by header now
  };

  const handlePropertyAction = (propertyId: string, action: 'like' | 'dislike' | 'save') => {
    // Property action logic can be implemented here
    // Future: Add property to saved/liked list, notify agent, etc.
  };

  const handleOpenChat = () => {
    onTabChange?.('chat');
  };

  const handlePropertyClick = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const handleBackToDashboard = () => {
    setSelectedPropertyId(null);
  };

  const handleNavigateToSearch = () => {
    if (onTabChange) {
      onTabChange('search');
    }
  };

  const handleVoicePreferencesComplete = (preferences: ExtractedPreferences) => {
    console.log('Voice preferences completed:', preferences);
    // Navigate to profile after completing voice preferences
    if (onTabChange) {
      onTabChange('profile');
    }
  };

  const handleFormFillRequest = () => {
    // Navigate to profile tab and trigger edit profile modal
    setShouldOpenEditProfile(true);
    if (onTabChange) {
      onTabChange('profile');
    }
  };

  // Reset shouldOpenEditProfile after navigating away from profile
  useEffect(() => {
    if (activeTab !== 'profile' && shouldOpenEditProfile) {
      setShouldOpenEditProfile(false);
    }
  }, [activeTab, shouldOpenEditProfile]);

  // Reset selected property when tab changes away from dashboard
  useEffect(() => {
    if (selectedPropertyId && activeTab !== 'dashboard') {
      setSelectedPropertyId(null);
    }
  }, [activeTab, selectedPropertyId]);

  // Show property detail page if a property is selected AND we're on dashboard
  if (selectedPropertyId && activeTab === 'dashboard') {
    return (
      <div className="w-full">
        <PropertyDetailPage 
          propertyId={selectedPropertyId}
          onBack={handleBackToDashboard}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {activeTab === 'dashboard' && (
        <ModernDashboard 
          userData={userData} 
          onPropertyClick={handlePropertyClick}
          onNavigateToSearch={handleNavigateToSearch}
        />
      )}
      {activeTab === 'chat' && <ChatbotInterface onBack={handleChatBack} />}
      {activeTab === 'chat-test' && <ChatbotTest />}
      {activeTab === 'search' && (
        <PropertySwiping 
          userProfile={userData}
          onPropertyAction={handlePropertyAction}
          onOpenChat={handleOpenChat}
          agentEmail={agentEmail}
        />
      )}
      {activeTab === 'profile' && (
        <ProfilePage
          userData={userData}
          openEditModalOnMount={shouldOpenEditProfile}
          onEditModalOpened={() => setShouldOpenEditProfile(false)}
        />
      )}
      {activeTab === 'voice-agent' && (
        <div className="max-w-4xl mx-auto py-8">
          <VoicePreferenceInput
            onComplete={handleVoicePreferencesComplete}
            onSkip={handleFormFillRequest}
            showSkipOption={true}
          />
        </div>
      )}
    </div>
  );
};

export default MainAppContent;
