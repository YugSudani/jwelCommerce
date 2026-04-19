import { createContext, useContext, useEffect, useRef, useState } from 'react';
import API from '../api/axios';
import { AuthContext } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { userInfo } = useContext(AuthContext);

  const [playerID, setPlayerID] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  // Guard against double-init
  const didInit = useRef(false);
  // Track the last userInfo._id we ran the device check for
  const checkedUserId = useRef(null);

  // ─── 1. Init OneSignal once (after SDK loads) ──────────────────────────────
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
        console.log('[Notif] OneSignal.init() called (v16)');
      } catch (e) {
        console.log('[Notif] OneSignal.init() error:', e.message);
      }

      // Listen for subscription changes (grant / revoke / new device)
      try {
        window.OneSignal.User.PushSubscription.addEventListener('change', (event) => {
          console.log('[Notif] PushSubscription change event:', event);
          const newId = event?.current?.id;
          if (newId) {
            console.log('[Notif] New subscription ID:', newId);
            setPlayerID(newId);
            savePlayerID(newId);
            setShowPrompt(false);
          }
        });
      } catch (e) {
        console.log('[Notif] Could not attach subscription listener:', e.message);
      }

      setIsInitialized(true);
    };

    initOneSignal();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 2. React to user login / logout ───────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;

    if (!userInfo) {
      // User logged out — reset state
      setPlayerID('');
      setShowPrompt(false);
      checkedUserId.current = null;
      return;
    }

    // Avoid re-running for the same user session
    if (checkedUserId.current === userInfo._id) return;
    checkedUserId.current = userInfo._id;

    runNotificationCheck(userInfo);
  }, [isInitialized, userInfo]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Core check logic ──────────────────────────────────────────────────────
  const runNotificationCheck = async (user) => {
    console.log('[Notif] Running notification check for user:', user._id);

    // Get current device subscription ID (v16 API)
    let currentSubId = null;
    try {
      currentSubId = window.OneSignal?.User?.PushSubscription?.id ?? null;
      console.log('[Notif] Current PushSubscription.id:', currentSubId);
    } catch (e) {
      console.log('[Notif] Could not read PushSubscription.id:', e.message);
    }

    // Check browser permission
    let permissionGranted = false;
    try {
      permissionGranted = window.OneSignal?.Notifications?.permission ?? false;
      console.log('[Notif] Notifications.permission:', permissionGranted);
    } catch (e) {
      console.log('[Notif] Could not read Notifications.permission:', e.message);
    }

    const dbPlayerID = user.playerID || '';
    const dbPlayerIDs = user.playerIDs || [];

    if (permissionGranted && currentSubId) {
      // Already subscribed on this device
      setPlayerID(currentSubId);

      // Check if this device ID is already saved
      const alreadySaved =
        dbPlayerID === currentSubId || dbPlayerIDs.includes(currentSubId);

      if (!alreadySaved) {
        console.log('[Notif] New device detected, saving ID to DB');
        await savePlayerID(currentSubId);
      }

      // Register admin IDs if admin
      if (user.isAdmin) {
        registerAdminPlayerID(currentSubId);
      }
    } else {
      // Not subscribed — check if this is a device change situation
      if (dbPlayerID && currentSubId && dbPlayerID !== currentSubId && !dbPlayerIDs.includes(currentSubId)) {
        console.log('[Notif] Device change detected — showing deferred prompt');
      } else {
        console.log('[Notif] Notifications not granted — showing prompt');
      }
      setShowPrompt(true);
    }
  };

  // ─── Save playerID to DB (appends to playerIDs array) ─────────────────────
  const savePlayerID = async (id) => {
    if (!id) return;
    try {
      console.log('[Notif] Saving playerID to DB:', id);
      await API.put('/users/notification', { playerID: id, notificationEnabled: true });
      console.log('[Notif] playerID saved');
    } catch (err) {
      console.log('[Notif] Failed to save playerID:', err.response?.data || err.message);
    }
  };

  // ─── Register admin playerID in app settings ──────────────────────────────
  const registerAdminPlayerID = async (id) => {
    try {
      const { data } = await API.get('/settings/admin-player-ids');
      const current = data.adminPlayerIDs || [];
      if (!current.includes(id)) {
        await API.put('/settings/admin-player-ids', { playerIDs: [...current, id] });
        console.log('[Notif] Admin playerID registered in settings');
      }
    } catch (err) {
      console.log('[Notif] Failed to register admin playerID:', err.response?.data || err.message);
    }
  };

  // ─── Called when user clicks "Allow" in our custom prompt ─────────────────
  const enableNotifications = async () => {
    if (!window.OneSignal) return false;
    try {
      console.log('[Notif] Requesting browser permission...');
      await window.OneSignal.Notifications.requestPermission();

      // Wait a tick for the subscription to settle
      await new Promise((r) => setTimeout(r, 500));

      const id = window.OneSignal.User?.PushSubscription?.id ?? null;
      console.log('[Notif] After permission grant, subscription ID:', id);

      if (id) {
        setPlayerID(id);
        setShowPrompt(false);
        await savePlayerID(id);

        if (userInfo?.isAdmin) {
          await registerAdminPlayerID(id);
        }
        return true;
      }
    } catch (err) {
      console.log('[Notif] enableNotifications error:', err.message);
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