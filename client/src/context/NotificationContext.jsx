import { createContext, useContext, useEffect, useRef, useState } from 'react';
import API from '../api/axios';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userInfo } = useContext(AuthContext);

  const [playerID, setPlayerID] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  const didInit = useRef(false);
  const checkedUserId = useRef(null);

  // ─── 1. Init OneSignal once ─────────────────────────────────────────────────
  useEffect(() => {
    const initOneSignal = () => {
      if (!window.OneSignal) {
        setTimeout(initOneSignal, 800);
        return;
      }

      if (didInit.current) return;
      didInit.current = true;

      try {
        window.OneSignal.init({
          appId: '3722d783-1406-417f-81f7-6402bd57b2e7',
          allowLocalhostAsSecureOrigin: true,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
        });
      } catch (_) {
        // init can throw if called more than once — safe to ignore
      }

      // React to subscription changes (permission granted / new device)
      try {
        window.OneSignal.User.PushSubscription.addEventListener('change', (event) => {
          const newId = event?.current?.id;
          if (newId) {
            setPlayerID(newId);
            savePlayerID(newId);
            setShowPrompt(false);
          }
        });
      } catch (_) {
        // Listener not available in this environment
      }

      setIsInitialized(true);
    };

    initOneSignal();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 2. React to user login / logout ───────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;

    if (!userInfo) {
      setPlayerID('');
      setShowPrompt(false);
      checkedUserId.current = null;
      return;
    }

    if (checkedUserId.current === userInfo._id) return;
    checkedUserId.current = userInfo._id;

    runNotificationCheck(userInfo);
  }, [isInitialized, userInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Core check ────────────────────────────────────────────────────────────
  const runNotificationCheck = async (user) => {
    let currentSubId = null;
    try {
      currentSubId = window.OneSignal?.User?.PushSubscription?.id ?? null;
    } catch (_) { }

    let permissionGranted = false;
    try {
      permissionGranted = window.OneSignal?.Notifications?.permission ?? false;
    } catch (_) { }

    const dbPlayerID = user.playerID || '';
    const dbPlayerIDs = user.playerIDs || [];

    if (permissionGranted && currentSubId) {
      setPlayerID(currentSubId);

      const alreadySaved = dbPlayerID === currentSubId || dbPlayerIDs.includes(currentSubId);
      if (!alreadySaved) {
        await savePlayerID(currentSubId);
      }

      if (user.isAdmin) {
        registerAdminPlayerID(currentSubId);
      }
    } else {
      setShowPrompt(true);
    }
  };

  // ─── Save playerID to DB ───────────────────────────────────────────────────
  const savePlayerID = async (id) => {
    if (!id) return;
    try {
      await API.put('/users/notification', { playerID: id, notificationEnabled: true });
    } catch (_) { }
  };

  // ─── Register admin playerID in app settings ──────────────────────────────
  const registerAdminPlayerID = async (id) => {
    try {
      const { data } = await API.get('/settings/admin-player-ids');
      const current = data.adminPlayerIDs || [];
      if (!current.includes(id)) {
        await API.put('/settings/admin-player-ids', { playerIDs: [...current, id] });
      }
    } catch (_) { }
  };

  // ─── Called when user clicks "Allow" in our custom prompt ─────────────────
  const enableNotifications = async () => {
    if (!window.OneSignal) return false;
    try {
      await window.OneSignal.Notifications.requestPermission();
      await new Promise((r) => setTimeout(r, 500));

      const id = window.OneSignal.User?.PushSubscription?.id ?? null;
      if (id) {
        setPlayerID(id);
        setShowPrompt(false);
        await savePlayerID(id);
        if (userInfo?.isAdmin) {
          await registerAdminPlayerID(id);
        }
        return true;
      }
    } catch (_) { }
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