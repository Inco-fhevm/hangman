import React, { createContext, useContext, useState, useEffect } from 'react';
import { setSessionData, getSessionData, clearSessionData } from '@/utils/inco-lite';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [sessionData, setSessionDataState] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize session data from storage on mount
  useEffect(() => {
    const stored = getSessionData();
    if (stored) {
      setSessionDataState(stored);
    }
    setIsInitialized(true);
  }, []);

  const updateSessionData = (data) => {
    setSessionDataState(data);
    setSessionData(data);
  };

  const clearSession = () => {
    setSessionDataState(null);
    clearSessionData();
  };

  const value = {
    sessionData,
    updateSessionData,
    clearSession,
    isInitialized,
    hasValidSession: () => sessionData && sessionData.voucher && sessionData.keypair,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
