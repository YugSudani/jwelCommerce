import { useState } from 'react';
import { useNotification } from '../context/NotificationContext';
import { Bell, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPrompt = () => {
  const { showPrompt, enableNotifications, setShowPrompt } = useNotification();
  const [loading, setLoading] = useState(false);

  if (!showPrompt) return null;

  const handleAllow = async () => {
    setLoading(true);
    await enableNotifications();
    // enableNotifications hides the prompt on success; if it fails we reset
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">
                Enable Notifications
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Stay updated with order status, promotions, and more.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleAllow}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Allow'
                  )}
                </button>
                <button
                  onClick={() => setShowPrompt(false)}
                  disabled={loading}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300 text-xs font-bold py-2 px-3 rounded-lg transition-colors"
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowPrompt(false)}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPrompt;