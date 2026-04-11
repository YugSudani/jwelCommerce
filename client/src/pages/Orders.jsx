import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { Package, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import BackButton from '../components/BackButton';

const STATUS_FLOW = [
  { key: 'pending', label: 'Pending', shortLabel: 'Placed' },
  { key: 'accepted', label: 'Accepted', shortLabel: 'Accepted' },
  { key: 'inProcess', label: 'In Process', shortLabel: 'Processing' },
  { key: 'outForDelivery', label: 'Out for Delivery', shortLabel: 'On the Way' },
  { key: 'delivered', label: 'Delivered', shortLabel: 'Delivered' },
];

const STATUS_INDEX = STATUS_FLOW.reduce((acc, s, i) => ({ ...acc, [s.key]: i }), {});

const STATUS_STYLES = {
  pending: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', label: 'Pending' },
  accepted: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Accepted' },
  inProcess: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'In Process' },
  outForDelivery: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Out for Delivery' },
  delivered: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Delivered' },
};

const StatusTrail = ({ orderStatus }) => {
  const status = orderStatus || 'pending';
  const currentIdx = STATUS_INDEX[status] ?? 0;

  return (
    <div className="flex items-center w-full pt-4">
      {STATUS_FLOW.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        const isLast = i === STATUS_FLOW.length - 1;
        return (
          <React.Fragment key={s.key}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: active ? 1.15 : 1 }}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 transition-all duration-500 ${done
                    ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-400/30'
                    : active
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/30 ring-4 ring-blue-500/20'
                      : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'
                  }`}
              >
                {done ? <CheckCircle size={13} strokeWidth={2.5} /> : i + 1}
              </motion.div>
              <span className={`text-[9px] font-black uppercase tracking-wide whitespace-nowrap ${done ? 'text-green-600 dark:text-green-400' : active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                }`}>
                {s.shortLabel}
              </span>
            </div>
            {!isLast && (
              <div className="flex-1 h-0.5 mx-1 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 mb-5">
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: done ? '100%' : active ? '50%' : '0%' }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full ${done ? 'bg-green-500' : 'bg-blue-500'}`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await API.get('/orders/myorders');
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Fetching Orders</p>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 py-10">
      <BackButton />
      <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-10 tracking-tight">My Orders</h2>
      {orders.length === 0 ? (
        <div className="glass dark:bg-gray-800 p-20 rounded-[2.5rem] text-center border border-dashed border-gray-200 dark:border-gray-700">
          <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-6" />
          <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">No orders placed yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const status = order.orderStatus || (order.isDelivered ? 'delivered' : 'pending');
            const style = STATUS_STYLES[status] || STATUS_STYLES.pending;
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass dark:bg-gray-900 rounded-[2rem] border border-white/40 dark:border-white/5 premium-shadow overflow-hidden"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 pb-4 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    {/* Product images */}
                    <div className="flex -space-x-3">
                      {order.orderItems.slice(0, 4).map((item, i) => (
                        <img
                          key={i}
                          src={item.image}
                          alt={item.name}
                          onError={(e) => { e.target.src = 'https://placehold.co/40x40'; }}
                          className="w-11 h-11 rounded-full border-2 border-white dark:border-gray-900 object-cover"
                        />
                      ))}
                      {order.orderItems.length > 4 && (
                        <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-xs font-black text-gray-500">
                          +{order.orderItems.length - 4}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-mono text-xs text-gray-400">#{order._id.substring(0, 14)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Payment */}
                    {order.isPaid ? (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Paid
                      </span>
                    ) : (
                      <span className="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider">
                        Cash on Delivery
                      </span>
                    )}
                    <span className={`${style.bg} ${style.text} px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-wider`}>
                      {style.label}
                    </span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">₹{order.totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="px-5 pt-4 pb-2 flex gap-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                  {order.orderItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl px-3 py-2 flex-shrink-0">
                      <img src={item.image} alt={item.name}
                        onError={(e) => { e.target.src = 'https://placehold.co/32x32'; }}
                        className="w-8 h-8 rounded-lg object-cover" />
                      <div>
                        <p className="text-[11px] font-black text-gray-800 dark:text-gray-200 max-w-[120px] truncate">{item.name}</p>
                        <p className="text-[9px] text-gray-400 font-bold">₹{item.price} × {item.qty}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status Trail */}
                <div className="px-6 pb-6">
                  <StatusTrail orderStatus={status} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
