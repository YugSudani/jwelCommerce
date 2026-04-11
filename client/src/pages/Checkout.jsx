import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { AuthContext } from "../context/AuthContext";

import { toast } from "react-hot-toast";
import API from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Phone,
  User,
  Home,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Banknote,
  CreditCard,
  Smartphone,
  ShoppingBag,
  Loader2,
  Package,
} from "lucide-react";

const STEPS = ["Shipping", "Payment", "Review"];

const inputClass =
  "w-full bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-white/5 rounded-2xl px-4 py-4 text-gray-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 outline-none transition-all";
const labelClass =
  "text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5 block ml-1";

const PAYMENT_OPTIONS = [
  {
    id: "COD",
    label: "Cash on Delivery",
    icon: Banknote,
    desc: "Pay when your order arrives.",
    available: true,
  },
  {
    id: "UPI",
    label: "UPI Payment",
    icon: Smartphone,
    desc: "Pay via any UPI app.",
    available: false,
  },
  {
    id: "Card",
    label: "Debit / Credit Card",
    icon: CreditCard,
    desc: "Pay securely with card.",
    available: false,
  },
];


const CITIES = [
  "Agartala",
  "Agra",
  "Ahmedabad",
  "Aizawl",
  "Ajmer",
  "Akola",
  "Alappuzha",
  "Aligarh",
  "Allahabad",
  "Alwar",
  "Ambattur",
  "Amravati",
  "Amritsar",
  "Anand",
  "Ankleshwar",
  "Asansol",
  "Aurangabad",
  "Avadi",
  "Bareilly",
  "Bangalore",
  "Belgaum",
  "Bhagalpur",
  "Bharuch",
  "Bhavnagar",
  "Bhilai",
  "Bhiwandi",
  "Bhopal",
  "Bhubaneswar",
  "Bikaner",
  "Bilaspur",
  "Bokaro",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Cuttack",
  "Dehradun",
  "Delhi",
  "Dhanbad",
  "Bhilwara",
  "Durgapur",
  "Erode",
  "Faridabad",
  "Firozabad",
  "Gandhinagar",
  "Gaya",
  "Ghaziabad",
  "Gopalpur",
  "Gorakhpur",
  "Gulbarga",
  "Guntur",
  "Guwahati",
  "Gwalior",
  "Howrah",
  "Hubli-Dharwad",
  "Hyderabad",
  "Ichalkaranji",
  "Imphal",
  "Indore",
  "Itanagar",
  "Jabalpur",
  "Jaipur",
  "Jalandhar",
  "Jalgaon",
  "Jammu",
  "Jamnagar",
  "Jamshedpur",
  "Jhansi",
  "Jodhpur",
  "Junagadh",
  "Kakinada",
  "Kalyan-Dombivli",
  "Kanpur",
  "Karnal",
  "Kochi",
  "Kolhapur",
  "Kolkata",
  "Kollam",
  "Korba",
  "Kota",
  "Kottayam",
  "Kozhikode",
  "Kurnool",
  "Latur",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Malappuram",
  "Mathura",
  "Mangalore",
  "Meerut",
  "Mira-Bhayandar",
  "Moradabad",
  "Mumbai",
  "Muzaffarnagar",
  "Mysore",
  "Nagpur",
  "Nanded",
  "Nashik",
  "Navi Mumbai",
  "Navsari",
  "Nellore",
  "Noida",
  "Panaji",
  "Panchkula",
  "Patiala",
  "Patna",
  "Pimpri-Chinchwad",
  "Puducherry",
  "Pune",
  "Raipur",
  "Rajahmundry",
  "Rajkot",
  "Ranchi",
  "Rourkela",
  "Sagar",
  "Salem",
  "Sangli",
  "Satara",
  "Shimla",
  "Siliguri",
  "Solapur",
  "Srinagar",
  "Surat",
  "Thane",
  "Thiruvananthapuram",
  "Thrissur",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tiruppur",
  "Tirupati",
  "Udaipur",
  "Ujjain",
  "Ulhasnagar",
  "Vadodara",
  "Valsad",
  "Vapi",
  "Varanasi",
  "Vasai-Virar",
  "Vellore",
  "Vijayawada",
  "Visakhapatnam",
  "Warangal",
].sort();

const Checkout = () => {
  const {
    cartItems,
    clearCart,
    loading: cartLoading,
  } = useContext(CartContext);
  const { userInfo, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [citySearch, setCitySearch] = useState(userInfo?.city || "");
  const [showCityList, setShowCityList] = useState(false);

  const [shipping, setShipping] = useState({
    fullName: userInfo?.name || "",
    phone: userInfo?.phone || "",
    address: userInfo?.address || "",
    city: userInfo?.city || "",
    state: userInfo?.state || "",
    postalCode: userInfo?.postalCode || "",
    country: userInfo?.country || "India",
  });
  const [paymentMethod, setPaymentMethod] = useState("COD");


  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.qty * item.product.price,
    0,
  );
  const totalItems = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const handleCityInputChange = (e) => {
    const value = e.target.value;
    setCitySearch(value);
    setShipping((prev) => ({ ...prev, city: value }));
    setShowCityList(true); // Keep list open while typing
  };

  const handleCitySelect = (city) => {
    setShipping((s) => ({ ...s, city }));
    setCitySearch(city);
    setShowCityList(false);
  };

  const handleShippingChange = (e) => {
    setShipping((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateShipping = () => {
    if (!shipping.fullName.trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!shipping.phone.trim() || !/^\d{10}$/.test(shipping.phone.trim())) {
      toast.error("Enter a valid 10-digit phone number");
      return false;
    }
    if (!shipping.address.trim()) {
      toast.error("Address is required");
      return false;
    }
    if (!shipping.city.trim()) {
      toast.error("City is required");
      return false;
    }
    if (
      !shipping.postalCode.trim() ||
      !/^\d{6}$/.test(shipping.postalCode.trim())
    ) {
      toast.error("Enter a valid 6-digit pincode");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 0 && !validateShipping()) return;
    setStep((s) => s + 1);
  };

  const handlePlaceOrder = async () => {
    if (!validateShipping()) {
      setStep(0);
      return;
    }
    setSubmitting(true);
    try {
      const orderData = {
        orderItems: cartItems.map((item) => ({
          name: item.product.name,
          qty: item.qty,
          image: item.product.image,
          price: item.product.price,
          product: item.product._id,
        })),
        shippingAddress: shipping,
        paymentMethod,
        totalPrice,
      };

      await API.post("/orders", orderData);
      // Save shipping info back to user profile silently
      try {
        await updateProfile({
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          postalCode: shipping.postalCode,
          state: shipping.state,
          country: shipping.country,
        });
      } catch (_) { /* silent */ }
      await clearCart();
      toast.success("Order placed successfully! 🎉");
      navigate("/orders", { replace: true });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to place order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };


  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase()),
  );

  if (!userInfo) {
    navigate("/login");
    return null;
  }

  if (cartLoading) {
    return (
      <div className="text-center py-20 flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-blue-600" size={40} />
        <p className="text-gray-500 font-bold">
          Initializing Secure Checkout...
        </p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
          Checkout
        </h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          Complete your order by providing shipping and payment details.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="glass dark:bg-gray-800/50 rounded-[2rem] p-6 border border-white/40 dark:border-white/5 premium-shadow">
        <div className="flex items-center justify-between">
          {STEPS.map((name, i) => (
            <React.Fragment key={name}>
              <div className="flex flex-col items-center gap-2 group">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-500 ${
                    i < step
                      ? "bg-green-500 text-white"
                      : i === step
                        ? "bg-blue-600 text-white scale-110"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                  }`}
                >
                  {i < step ? (
                    <CheckCircle size={22} strokeWidth={2.5} />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${i === step ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}
                >
                  {name}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full transition-all duration-700 overflow-hidden bg-gray-100 dark:bg-gray-800`}
                >
                  <div
                    className={`h-full bg-green-500 transition-all duration-700 ${i < step ? "w-full" : "w-0"}`}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Shipping */}
            {step === 0 && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-10 border border-white/40 dark:border-white/5 premium-shadow"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <MapPin size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    Shipping Logistics
                  </h2>
                </div>

                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Customer Name</label>
                      <div className="relative">
                        <User
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          name="fullName"
                          value={shipping.fullName}
                          onChange={handleShippingChange}
                          placeholder="Full Name"
                          className={`${inputClass} pl-12`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Contact Number</label>
                      <div className="relative">
                        <Phone
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />
                        <input
                          name="phone"
                          type="tel"
                          value={shipping.phone}
                          onChange={handleShippingChange}
                          placeholder="10-digit number"
                          maxLength={10}
                          className={`${inputClass} pl-12`}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Dispatch Address</label>
                    <div className="relative">
                      <Home
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />
                      <input
                        name="address"
                        value={shipping.address}
                        onChange={handleShippingChange}
                        placeholder="Street, Building, Area"
                        className={`${inputClass} pl-12`}
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-6">
                    <div className="sm:col-span-1 relative">
                      <label className={labelClass}>City</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Type or select city"
                          className={`${inputClass} pr-10`}
                          value={shipping.city}
                          onChange={handleCityInputChange}
                          onFocus={() => setShowCityList(true)}
                          // Optional: Close list when clicking outside
                          onBlur={() =>
                            setTimeout(() => setShowCityList(false), 200)
                          }
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <motion.div
                            animate={{ rotate: showCityList ? 180 : 0 }}
                          >
                            <ArrowLeft
                              className="-rotate-90 text-gray-400"
                              size={16}
                            />
                          </motion.div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {showCityList && filteredCities.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                          >
                            <div className="max-h-52" style={{ overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                              {filteredCities.map((city) => (
                                <button
                                  key={city}
                                  type="button"
                                  onClick={() => handleCitySelect(city)}
                                  className="w-full text-left px-4 py-3 text-sm font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                  {city}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </div>
                    <div className="sm:col-span-1">
                      <label className={labelClass}>Postal Code</label>
                      <input
                        name="postalCode"
                        value={shipping.postalCode}
                        onChange={handleShippingChange}
                        placeholder="Code"
                        maxLength={6}
                        className={inputClass}
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className={labelClass}>Country</label>
                      <input
                        name="country"
                        value={shipping.country}
                        onChange={handleShippingChange}
                        placeholder="Country"
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 1 && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="glass dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-10 border border-white/40 dark:border-white/5 premium-shadow"
              >
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                    <Banknote size={24} />
                  </div>
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                    Secure Payment
                  </h2>
                </div>

                <div className="grid gap-4">
                  {PAYMENT_OPTIONS.map(({ id, label, icon: Icon, desc, available }) => {
                    const isSelected = paymentMethod === id && available;
                    const isDisabled = !available;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => available && setPaymentMethod(id)}
                        className={`group relative flex items-center gap-5 p-6 rounded-3xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                            : isDisabled
                            ? "border-transparent bg-gray-50/50 dark:bg-gray-900/30 opacity-60 cursor-not-allowed"
                            : "border-transparent bg-gray-50 dark:bg-gray-900/50 hover:border-gray-200 dark:hover:border-white/10"
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                          <Icon size={24} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-black text-lg ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200"}`}>
                              {label}
                            </p>
                            {isDisabled && (
                              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                Coming Soon
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-bold">{desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300 dark:border-gray-700"}`}>
                          {isSelected && (<CheckCircle size={14} strokeWidth={3} />)}
                        </div>
                      </button>
                    );
                  })}
                </div>

              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 2 && (
              <motion.div
                key="review"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                <div className="glass dark:bg-gray-800 rounded-[2.5rem] p-8 md:p-10 border border-white/40 dark:border-white/5 premium-shadow">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                      Order Review
                    </h2>
                  </div>

                  <div className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-8">
                      <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
                        <p className={labelClass}>Shipping Address</p>
                        <p className="font-black text-gray-900 dark:text-white mb-1">
                          {shipping.fullName}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                          {shipping.address}
                          <br />
                          {shipping.city}, {shipping.postalCode}
                          <br />
                          {shipping.country}
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-bold mt-3">
                          📞 {shipping.phone}
                        </p>
                      </div>
                      <div className="bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
                        <p className={labelClass}>Payment Gateway</p>
                        <div className="flex items-center gap-3 mb-2">
                          {React.createElement(
                            PAYMENT_OPTIONS.find((p) => p.id === paymentMethod)
                              ?.icon || CreditCard,
                            { size: 20, className: "text-blue-600" },
                          )}
                          <p className="font-black text-gray-900 dark:text-white">
                            {
                              PAYMENT_OPTIONS.find(
                                (p) => p.id === paymentMethod,
                              )?.label
                            }
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">
                          {paymentMethod === "COD"
                            ? "Pay upon delivery at your doorstep."
                            : "Secure transaction will be initialized."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[1.5rem] border-2 border-gray-100 dark:border-white/5 text-gray-600 dark:text-gray-400 font-black uppercase tracking-widest text-[10px] hover:bg-white dark:hover:bg-gray-800 transition-all active:scale-[0.98]"
              >
                <ArrowLeft size={16} /> Previous Phase
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-[2] flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[14px] transition-all active:scale-[0.98]"
              >
                Proceed to Next Phase <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="flex-[2] flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-green-500/20 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Finalizing
                    Order...
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} /> Confirm & Place Order
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Vertical Order Receipt */}
        <div className="lg:col-span-1">
          <div className="glass dark:bg-gray-800 rounded-[2.5rem] overflow-hidden border border-white/40 dark:border-white/5 premium-shadow sticky top-32">
            <div className="bg-gray-50/50 dark:bg-gray-900/50 p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                Order Receipt
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.product._id} className="flex gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 dark:border-white/5">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 dark:text-white text-xs truncate uppercase tracking-tight">
                        {item.product.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-black mt-0.5">
                        ₹{item.product.price} × {item.qty}
                      </p>
                    </div>
                    <p className="font-black text-xs text-gray-900 dark:text-white">
                      ₹{(item.product.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t-2 border-dashed border-gray-100 dark:border-white/10">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-gray-900 dark:text-white">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>Delivery Fee</span>
                  <span className="text-green-500">FREE</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-gray-900 dark:text-white">
                    Grand Total
                  </span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-800 flex items-start gap-3">
                  <CheckCircle
                    className="text-blue-600 dark:text-blue-400 mt-0.5"
                    size={16}
                  />
                  <p className="text-[10px] text-blue-800 dark:text-blue-200 font-bold leading-relaxed">
                    Premium delivery included. Your items are protected by our
                    transport insurance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
