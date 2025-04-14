import { supabase } from '@/lib/supabase'
import { UserInfo } from '@/types/outreach'
import { DEFAULT_USER_INFO } from '@/config/constants'

export type OutreachType = 'getClients' | 'getJob' | 'getSpeakers' | 'getHotelStay' | 'getSponsors'
export type MessageStyle = 'direct' | 'casual' | 'storytelling'

interface OutreachSettingsProps {
  outreachType: OutreachType;
  messageStyle: MessageStyle;
  setOutreachType: (type: OutreachType) => void;
  setMessageStyle: (style: MessageStyle) => void;
  profile: any;
  setProfile: (profile: any) => void;
  userInfo: UserInfo | null;
  setUserInfo: (info: UserInfo | null) => void;
  onRegenerateEmails: (type: OutreachType, style: MessageStyle) => void;
}

export function OutreachSettings({
  outreachType,
  messageStyle,
  setOutreachType,
  setMessageStyle,
  profile,
  setProfile,
  userInfo,
  setUserInfo,
  onRegenerateEmails
}: OutreachSettingsProps) {
  return (
    <div className="rounded-lg border-2 border-turbo-black/10 p-4 bg-white">
      <div className="grid grid-cols-2 gap-4">
        {/* Outreach Type Selector */}
        <div>
          <label className="block text-xs font-medium text-turbo-black mb-1">Outreach Type</label>
          <select
            value={outreachType}
            onChange={async (e) => {
              const newType = e.target.value as OutreachType;
              setOutreachType(newType);
              console.log('📝 Outreach type changed:', { from: outreachType, to: newType });
              
              try {
                const { data, error } = await supabase
                  .from('users')
                  .update({ outreach_type: newType })
                  .eq('id', profile?.id)
                  .select()
                  .single();

                if (error) throw error;

                if (data && setProfile) {
                  setProfile(data);
                }

                if (newType && userInfo) {
                  const updatedUserInfo: UserInfo = {
                    ...DEFAULT_USER_INFO,
                    ...userInfo,
                    outreachType: newType,
                    messageStyle: messageStyle
                  };
                  setUserInfo(updatedUserInfo);
                  onRegenerateEmails(newType, messageStyle);
                }
              } catch (error) {
                console.error('Error updating outreach type:', error);
              }
            }}
            className="w-full px-2 py-1.5 text-sm rounded-lg border-2 border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors"
          >
            <option value="getClients">Get New Clients</option>
            <option value="getJob">Land a New Job</option>
            <option value="getSpeakers">Get Event Speakers</option>
            <option value="getHotelStay">Get Hotel Stay</option>
            <option value="getSponsors">Get Sponsors</option>
          </select>
        </div>

        {/* Message Style Selector */}
        <div>
          <label className="block text-xs font-medium text-turbo-black mb-1">Message Style</label>
          <select
            value={messageStyle}
            onChange={async (e) => {
              const newStyle = e.target.value as MessageStyle;
              setMessageStyle(newStyle);
              console.log('📝 Message style changed:', { from: messageStyle, to: newStyle });
              
              try {
                const { data, error } = await supabase
                  .from('users')
                  .update({ message_style: newStyle })
                  .eq('id', profile?.id)
                  .select()
                  .single();

                if (error) throw error;

                if (data && setProfile) {
                  setProfile(data);
                }

                if (userInfo) {
                  const updatedUserInfo: UserInfo = {
                    ...DEFAULT_USER_INFO,
                    ...userInfo,
                    messageStyle: newStyle
                  };
                  setUserInfo(updatedUserInfo);
                  onRegenerateEmails(outreachType, newStyle);
                }
              } catch (error) {
                console.error('Error updating message style:', error);
              }
            }}
            className="w-full px-2 py-1.5 text-sm rounded-lg border-2 border-turbo-black/10 focus:border-turbo-blue focus:outline-none transition-colors"
          >
            <option value="direct">Direct & Professional</option>
            <option value="casual">Casual & Friendly</option>
            <option value="storytelling">Story-Driven</option>
          </select>
        </div>
      </div>
    </div>
  );
} 