import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

interface Props {
  isHindi?: boolean;
}

export const OfflineIndicator: React.FC<Props> = ({ isHindi = true }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:max-w-md z-50 flex items-center gap-3 rounded-2xl bg-amber-500/95 backdrop-blur-md px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in slide-in-from-bottom">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/20">
        <WifiOff className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wider text-amber-100 font-extrabold">
          {isHindi ? 'ऑफ़लाइन मोड (Offline Mode)' : 'Offline Mode'}
        </p>
        <p className="text-xs text-white">
          {isHindi
            ? 'इंटरनेट कनेक्शन नहीं है। सहेजे गए अध्याय उपलब्ध हैं; AI के लिए नेटवर्क आवश्यक है।'
            : 'No internet connection. Saved chapters can still be viewed.'}
        </p>
      </div>
    </div>
  );
};
