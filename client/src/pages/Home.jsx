import React, { useContext, useEffect, useLayoutEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import ProductCard from "../components/ProductCard";
import { ProductsContext } from "../context/ProductsContext";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Loader2,
} from "lucide-react";

const Home = () => {
  const { pathname } = useLocation();
  const {
    homeProducts,
    homeLoading,
    fetchHomeProducts,
    saveScrollPosition,
    restoreScrollPosition
  } = useContext(ProductsContext);

  useEffect(() => {
    fetchHomeProducts();
  }, [fetchHomeProducts]);

  // Restore scroll position on back navigation
  useLayoutEffect(() => {
    if (!homeLoading && homeProducts.length > 0) {
      const savedY = restoreScrollPosition(pathname);
      if (savedY > 0) {
        // Immediate restoration in layout phase to prevent flicker
        window.scrollTo({ top: savedY, behavior: 'instant' });

        // Backup restore just in case layout shift happens
        const timer = setTimeout(() => {
          window.scrollTo({ top: savedY, behavior: 'instant' });
        }, 30);
        return () => clearTimeout(timer);
      }
    }
  }, [homeLoading, homeProducts.length, pathname, restoreScrollPosition]);

  const handleProductClick = useCallback(() => {
    saveScrollPosition(pathname, window.scrollY);
  }, [saveScrollPosition, pathname]);

  const products = homeProducts;
  const loading = homeLoading;

  return (
    <div className="max-w-8xl mx-auto px-2 py-0">
      {/* ── Hero Carousel ───────────────────────────────────── */}
      <HeroCarousel />

      {/* ── Featured Products ───────────────────────────────── */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-blue-600 dark:text-blue-400 font-black text-[10px] md:text-xs uppercase tracking-widest mb-1">
              Handpicked For You
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Featured Products
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            View All
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>

        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={40} className="animate-spin text-blue-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 glass rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              No products loaded yet.
            </span>
          </div>

        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-7" onClick={handleProductClick}>
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.07, duration: 0.45 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        )}

        {/* View All CTA – visible on all screen sizes below grid */}
        <div className="mt-10 flex justify-center">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-[0.97]"
          >
            View All Products
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* ── Promo Banner ─────────────────────────────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden mb-16 premium-shadow"
        style={{ minHeight: 320 }}
      >
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80"
          alt="Sale Banner"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-800/70 to-transparent" />
        <div className="relative z-10 flex flex-col justify-center h-full p-12 md:p-20 min-h-[320px]">
          <span className="inline-block text-blue-300 font-black text-xs uppercase tracking-[0.2em] mb-4">
            Limited Time
          </span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight max-w-md">
            Up to <span className="text-blue-300">50% Off</span> Select Items
          </h2>
          <div >
            <Link
              to="/products"
              className="inline-flex items-center gap-3 bg-white text-blue-900 px-9 py-4 rounded-2xl font-black text-base hover:shadow-2xl transition-all"
            >
              Shop the Sale
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Signals ────────────────────────────────────── */}
      <section>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Truck,
              title: "Free Shipping",
              desc: "On all orders above $49. Fast & reliable worldwide delivery.",
            },
            {
              icon: ShieldCheck,
              title: "Secure Checkout",
              desc: "256-bit SSL encryption. Your data is always safe with us.",
            },
            {
              icon: RotateCcw,
              title: "30-Day Returns",
              desc: "Changed your mind? Easy, hassle-free returns guaranteed.",
            },
          ].map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-5 glass dark:bg-gray-800/50 p-7 rounded-3xl border border-white/50 dark:border-white/5 hover:bg-white dark:hover:bg-gray-800 transition-colors premium-shadow"
            >
              <div className="w-12 h-12 flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <f.icon size={24} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 dark:text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>

          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
