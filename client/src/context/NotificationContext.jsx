import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api/axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [playerID, setPlayerID] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('[Notif] Component mounted, loading:', loading);

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('[Notif] Fetching user profile...');
        const { data } = await API.get('/users/profile');
        console.log('[Notif] User profile:', data);
        setUserInfo(data);
        setIsAdmin(data.isAdmin || false);
        setLoading(false);
      } catch (err) {
        console.log('[Notif] No user logged in, skipped');
        setUserInfo(null);
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    if (loading) return;
    console.log('[Notif] Loading complete, initializing OneSignal...');

    const initOneSignal = () => {
      console.log('[Notif] OneSignal exists:', !!window.OneSignal, 'Deferred:', !!window.OneSignalDeferred);
      
      if (window.OneSignal) {
        window.OneSignal.init({
          appId: "3722d783-1406-417f-81f7-6402bd57b2e7",
          allowLocalhostAsSecureOrigin: true,
          notificationPromptEnable: false,
          welcomeNotification: { disable: true },
        }).then(async () => {
          console.log('[Notif] OneSignal initialized successfully');
          setIsInitialized(true);
          
          try {
            const userId = await window.OneSignal.getUserId();
            console.log('[Notif] Got userId:', userId);
            if (userId) {
              setPlayerID(userId);
              await savePlayerID(userId);
            }
          } catch (e) {
            console.log('[Notif] getUserId error:', e.message);
          }
        }).catch((err) => {
          console.log('[Notif] OneSignal init error:', err);
          setIsInitialized(true);
        });
      } else {
        console.log('[Notif] OneSignal not ready yet, retrying in 1s...');
        setTimeout(initOneSignal, 1000);
      }
    };

    initOneSignal();
  }, [loading]);

  useEffect(() => {
    if (!isInitialized || !playerID) return;
    console.log('[Notif] PlayerID ready, isAdmin:', isAdmin);
    
    if (isAdmin) {
      registerAdminPlayerID(playerID);
    }
  }, [isInitialized, playerID]);

  useEffect(() => {
    if (!isInitialized || loading || !userInfo) return;
    console.log('[Notif] Checking notification status, playerID:', playerID);
    
    if (!playerID && window.OneSignal) {
      window.OneSignal.isPushNotificationsEnabled()
        .then((enabled) => {
          console.log('[Notif] Push enabled:', enabled);
          if (!enabled) {
            setShowPrompt(true);
            console.log('[Notif] Showing prompt - notifications disabled');
          }
        })
        .catch((err) => {
          console.log('[Notif] isPushNotificationsEnabled error:', err.message);
          setShowPrompt(true);
        });
    }
  }, [isInitialized, loading, userInfo, playerID]);

  const savePlayerID = async (userId) => {
    try {
      console.log('[Notif] Saving playerID:', userId);
      await API.put('/users/notification', { playerID: userId, notificationEnabled: true });
      console.log('[Notif] PlayerID saved successfully');
    } catch (err) {
      console.log('[Notif] Failed to save playerID:', err.response?.data || err.message);
    }
  };

  const registerAdminPlayerID = async (userId) => {
    try {
      console.log('[Notif] Registering admin playerID:', userId);
      const { data } = await API.get('/settings/admin-player-ids');
      const currentIDs = data.adminPlayerIDs || [];
      console.log('[Notif] Current admin IDs:', currentIDs);
      
      if (!currentIDs.includes(userId)) {
        await API.put('/settings/admin-player-ids', { playerIDs: [...currentIDs, userId] });
        console.log('[Notif] Admin playerID registered');
      } else {
        console.log('[Notif] Admin playerID already registered');
      }
    } catch (err) {
      console.log('[Notif] Failed to register admin playerID:', err.response?.data || err.message);
    }
  };

  const enableNotifications = async () => {
    console.log('[Notif] enableNotifications called');
    if (!window.OneSignal) {
      console.log('[Notif] OneSignal not available');
      return false;
    }
    try {
      console.log('[Notif] Showing sliding notification...');
      await window.OneSignal.showSlidingNotification();
      
      const userId = await window.OneSignal.getUserId();
      console.log('[Notif] After prompt, userId:', userId);
      
      if (userId) {
        setPlayerID(userId);
        setShowPrompt(false);
        await savePlayerID(userId);
        
        if (isAdmin) {
          await registerAdminPlayerID(userId);
        }
        return true;
      }
    } catch (err) {
      console.log('[Notif] Enable notifications error:', err.message);
    }
    return false;
  };

  return (
    <NotificationContext.Provider
      value={{ playerID, isInitialized, showPrompt, enableNotifications, setShowPrompt }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);