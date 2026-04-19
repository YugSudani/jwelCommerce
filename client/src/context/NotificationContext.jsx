import { createContext, useContext, useEffect, useState } from 'react';
import API from '../api/axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [playerID, setPlayerID] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await API.get('/users/profile');
        setUserInfo(data);
        setIsAdmin(data.isAdmin);
      } catch {
        setUserInfo(null);
      }
    };
    checkUser();
  }, []);

  useEffect(() => {
    let retries = 0;
    const maxRetries = 10;

    const initOneSignal = async () => {
      while (retries < maxRetries) {
        if (window.OneSignal) {
          try {
            window.OneSignal.init({
              appId: "3722d783-1406-417f-81f7-6402bd57b2e7",
              allowLocalhostAsSecureOrigin: true,
              notificationPromptEnable: false,
            }).then(async () => {
              setIsInitialized(true);
              const userId = await window.OneSignal.getUserId();
              if (userId) {
                setPlayerID(userId);
                savePlayerID(userId);
              }
            }).catch(() => {
              setIsInitialized(true);
            });
            break;
          } catch (err) {
            console.log('OneSignal init error:', err);
            setIsInitialized(true);
            break;
          }
        } else {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    };

    initOneSignal();
  }, []);

  useEffect(() => {
    if (isInitialized && playerID && isAdmin) {
      registerAdminPlayerID(playerID);
    }
  }, [isInitialized, playerID, isAdmin]);

  useEffect(() => {
    if (isInitialized && !playerID && userInfo) {
      window.OneSignal?.isPushNotificationsEnabled?.().then((enabled) => {
        if (!enabled && userInfo) {
          setShowPrompt(true);
        }
      }).catch(() => {
        if (userInfo) {
          setShowPrompt(true);
        }
      });
    }
  }, [isInitialized, playerID, userInfo]);

  const savePlayerID = async (userId) => {
    try {
      await API.put('/users/notification', { playerID: userId, notificationEnabled: true });
    } catch (err) {
      console.log('Failed to save playerID:', err);
    }
  };

  const registerAdminPlayerID = async (userId) => {
    try {
      const { data } = await API.get('/settings/admin-player-ids');
      const currentIDs = data.adminPlayerIDs || [];
      if (!currentIDs.includes(userId)) {
        await API.put('/settings/admin-player-ids', { playerIDs: [...currentIDs, userId] });
      }
    } catch (err) {
      console.log('Failed to register admin playerID:', err);
    }
  };

  const enableNotifications = async () => {
    if (!window.OneSignal) {
      return false;
    }
    try {
      await window.OneSignal.showSlidingNotification();
      const userId = await window.OneSignal.getUserId();
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
      console.log('Enable notifications error:', err);
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