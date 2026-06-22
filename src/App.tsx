/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  fetchCategories,
  fetchProducts,
  saveCategory,
  deleteCategory,
  saveProduct,
  deleteProduct,
  getSupabaseStatus,
  ensureCloudUrl
} from "./lib/supabaseClient";
import { loginAdmin, logoutAdmin, getLoggedInAdmin, LoggedInUser, FALLBACK_ADMIN } from "./lib/auth";
import { Category, Product, SupabaseConfigStatus } from "./types";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CategoryCard from "./components/CategoryCard";
import ProductCard from "./components/ProductCard";
import AdminSetupGuide from "./components/AdminSetupGuide";
import ImageSourceSelector from "./components/ImageSourceSelector";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Dumbbell,
  ChevronRight,
  Key,
  Plus,
  Edit2,
  Trash2,
  X,
  Settings,
  FolderPlus,
  TrendingUp,
  Eye,
  Folder,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
  Sparkles
} from "lucide-react";

export default function App() {
  // Navigation Routing State
  const [currentPath, setCurrentPath] = useState<string>(window.location.hash || "#/");

  // Catalog State
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<SupabaseConfigStatus>({ connected: false, usingFallback: true });

  // Admin Session State
  const [adminUser, setAdminUser] = useState<LoggedInUser | null>(getLoggedInAdmin());

  // Search filter
  const [searchQuery, setSearchQuery] = useState<string>("");

  // CRUD Admin Modals State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Category Form Inputs
  const [catName, setCatName] = useState("");
  const [catSlug, setCatSlug] = useState("");
  const [catImageUrl, setCatImageUrl] = useState("");

  // Product Form Inputs
  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState<number>(0);
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodAvailable, setProdAvailable] = useState(true);

  // Sign-in Credentials Inputs
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showDemoBanner, setShowDemoBanner] = useState(true);

  // UI Notification Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Custom visual state-based delete confirmation target
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: "category" | "product" } | null>(null);

  // Router listener
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(window.location.hash || "#/");
      // Auto scroll to top on routing
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Initial fetch and database status monitor
  const loadCatalogData = async () => {
    setLoading(true);
    try {
      const cats = await fetchCategories();
      const prods = await fetchProducts();
      setCategories(cats);
      setProducts(prods);
      setDbStatus(getSupabaseStatus());
    } catch (err) {
      console.error("System error during initial data reload:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  const triggerToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleNavigate = (path: string) => {
    window.location.hash = path;
  };

  // Auth Functions
  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!adminEmail || !adminPassword) {
      setLoginError("Please enter your email and password.");
      return;
    }

    const res = await loginAdmin(adminEmail, adminPassword);
    if (res.success) {
      setAdminUser(getLoggedInAdmin());
      triggerToast("Access Granted: Welcome back, Store Admin!", "success");
      setAdminEmail("");
      setAdminPassword("");
      handleNavigate("#/admin/dashboard");
    } else {
      setLoginError(res.error || "Authentication failed.");
    }
  };

  const handleAdminSignOut = () => {
    logoutAdmin();
    setAdminUser(null);
    triggerToast("Logged out of Admin Session successfully", "success");
    handleNavigate("#/admin/login");
  };

  // Auto-generate Slug on Type (Exercise Bikes -> exercise-bikes)
  useEffect(() => {
    if (!editingCategory) {
      const slugified = catName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-") // replace non-alphanumeric with -
        .replace(/(^-|-$)+/g, ""); // trim leading/trailing dashes
      setCatSlug(slugified);
    }
  }, [catName, editingCategory]);

  // CATEGORY MUTATIONS
  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName("");
    setCatSlug("");
    setCatImageUrl("");
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatSlug(cat.slug);
    setCatImageUrl(cat.image_url);
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName || !catSlug) {
      triggerToast("Category name and slug are required fields.", "error");
      return;
    }

    try {
      let finalImageUrl = catImageUrl;
      if (catImageUrl.startsWith("data:")) {
        triggerToast("Uploading category cover to Supabase Storage...", "success");
        finalImageUrl = await ensureCloudUrl("categories-images", "cat", catImageUrl);
        setCatImageUrl(finalImageUrl);
      }

      const payload: Category = {
        id: editingCategory ? editingCategory.id : "cat-" + Math.random().toString(36).substr(2, 9),
        name: catName,
        slug: catSlug,
        image_url: finalImageUrl || "/images/treadmill.svg",
      };

      await saveCategory(payload, !!editingCategory);
      setIsCategoryModalOpen(false);
      triggerToast(editingCategory ? "Category successfully updated!" : "New equipment category successfully added!", "success");
      loadCatalogData();
    } catch (err: any) {
      triggerToast("Failed to save category: " + (err.message || err), "error");
    }
  };

  const handleDeleteCategoryClick = (id: string, name: string) => {
    setDeleteTarget({ id, name, type: "category" });
  };

  const executeDeleteTarget = async () => {
    if (!deleteTarget) return;
    const { id, name, type } = deleteTarget;
    try {
      if (type === "category") {
        await deleteCategory(id);
        triggerToast(`Deleted category: ${name}`, "success");
      } else {
        await deleteProduct(id);
        triggerToast(`Product removed: ${name}`, "success");
      }
      loadCatalogData();
    } catch (err: any) {
      triggerToast(`Failed to delete items: ${err?.message || err}`, "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  // PRODUCT MUTATIONS
  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdName("");
    setProdPrice(0);
    setProdCategoryId(categories[0]?.id || "");
    setProdImageUrl("");
    setProdAvailable(true);
    setIsProductModalOpen(true);
  };

  const openEditProductModal = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdPrice(prod.price);
    setProdCategoryId(prod.category_id);
    setProdImageUrl(prod.image_url);
    setProdAvailable(prod.available);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCategoryId || prodPrice <= 0) {
      triggerToast("Please input a valid name, price (₦), and assign a category.", "error");
      return;
    }

    try {
      let finalImageUrl = prodImageUrl;
      if (prodImageUrl.startsWith("data:")) {
        triggerToast("Uploading product showcase image to Supabase Storage...", "success");
        finalImageUrl = await ensureCloudUrl("products-images", "prod", prodImageUrl);
        setProdImageUrl(finalImageUrl);
      }

      const payload: Product = {
        id: editingProduct ? editingProduct.id : "prod-" + Math.random().toString(36).substr(2, 9),
        category_id: prodCategoryId,
        name: prodName,
        price: Number(prodPrice),
        image_url: finalImageUrl || "/images/dumbbells.svg",
        available: prodAvailable,
      };

      await saveProduct(payload, !!editingProduct);
      setIsProductModalOpen(false);
      triggerToast(editingProduct ? "Fitness product successfully updated!" : "New premium showroom item cataloged!", "success");
      loadCatalogData();
    } catch (err: any) {
      triggerToast("Failed to save product: " + (err.message || err), "error");
    }
  };

  const handleDeleteProductClick = (id: string, name: string) => {
    setDeleteTarget({ id, name, type: "product" });
  };

  // Quick helper to fill royalty-free premium gym imagery on the fly for ease in CMS
  const injectStockPhotoCat = () => {
    const urls = [
      "/images/treadmill.svg", // treadmill
      "/images/bike.svg", // stationary bikes
      "/images/dumbbells.svg", // dumbbells/weights
      "/images/gear.svg", // gear
    ];
    setCatImageUrl(urls[Math.floor(Math.random() * urls.length)]);
    triggerToast("Injected local high-performance showroom catalog image", "success");
  };

  const injectStockPhotoProd = () => {
    const urls = [
      "/images/athlete.svg",
      "/images/treadmill.svg",
      "/images/bike.svg",
      "/images/dumbbells.svg",
      "/images/gear.svg",
      "/images/accessory.svg"
    ];
    setProdImageUrl(urls[Math.floor(Math.random() * urls.length)]);
    triggerToast("Injected local gym equipment asset graphic", "success");
  };

  // Render Core Layouts
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">

      {/* Dynamic Toast Window */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-24 right-4 md:right-8 z-100 max-w-sm pointer-events-auto"
          >
            <div className={`p-4 rounded-lg shadow-2xl border flex items-start space-x-3 ${toastMessage.type === "success"
              ? "bg-neutral-900 border-emerald-500/30 text-emerald-400"
              : "bg-neutral-900 border-red-500/30 text-red-400"
              }`}>
              <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${toastMessage.type === "success" ? "text-emerald-500" : "text-red-500"}`} />
              <div>
                <h5 className="font-extrabold text-xs uppercase tracking-wider text-white">System Broadcast</h5>
                <p className="text-xs mt-1 text-gray-300 font-medium">{toastMessage.text}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Banner indicating Sandbox State */}
      {showDemoBanner && (
        <div className="bg-linear-to-r from-red-950 via-black to-red-950 text-[11px] py-2 px-4 border-b border-red-900/40 relative flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-red-600 animate-pulse" />
            <span className="text-gray-300 font-medium hidden sm:inline">
              <strong>Bavidex Nigeria Client Workspace:</strong> Authenticated on database cluster
              <code> {dbStatus.usingFallback ? "Sandboxed Sandbox Caching" : "Live Postgres Connected"}</code>
            </span>
            <span className="text-gray-300 font-medium sm:hidden truncate">
              <strong>Bavidex</strong> · <code>{dbStatus.usingFallback ? "Sandbox" : "Live Postgres"}</code>
            </span>
            <span className="text-red-400 font-extrabold uppercase tracking-widest bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/30 whitespace-nowrap text-[10px]">
              Showroom Only
            </span>
          </div>
          <button
            onClick={() => setShowDemoBanner(false)}
            className="text-gray-400 hover:text-white transition-colors p-1 shrink-0"
            title="Dismiss notification"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Header Viewport */}
      <Navbar currentPath={currentPath} onNavigate={handleNavigate} categories={categories} />

      {/* Main Container Core Router */}
      <main className="grow flex flex-col">
        {loading ? (
          <div className="grow flex flex-col items-center justify-center py-24 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600" />
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-[0.2em] animate-pulse">
              Buffering Showroom Inventory...
            </span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Showroom HOME PAGE router */}
            {currentPath === "#/" && (
              <motion.div
                key="home"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col grow"
              >
                {/* Immersive Hero Banner with Real Gym Background */}
                <section className="relative min-h-[60vh] md:h-[90vh] flex items-center justify-center overflow-hidden bg-neutral-950 py-16 md:py-0">
                  <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-102 filter grayscale hover:grayscale-0 transition-all duration-2000"
                    style={{ backgroundImage: "url('/images/hero_bg.jpg')" }}
                  />
                  <div className="absolute inset-0 bg-linear-to-b from-black/80 via-black/30 to-black pointer-events-none" />

                  {/* Subtle dynamic backdrop layout animation lines */}
                  <div className="absolute inset-0 block bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-red-600/5 via-transparent to-transparent pointer-events-none" />

                  <div className="relative z-10 text-center px-4 max-w-4xl tracking-tight">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.6 }}
                      className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/20 text-red-500 py-1.5 px-4 rounded-full text-xs font-black uppercase tracking-widest mb-6"
                    >
                      <Dumbbell className="h-4 w-4 stroke-[2.5]" />
                      <span>Welcome to Lagos' #1 Gym Showroom</span>
                    </motion.div>

                    <motion.h1
                      initial={{ opacity: 0, y: 35 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-sans font-black tracking-tighter text-white uppercase leading-none"
                    >
                      Bavidex <span className="text-red-600 text-glow">Fitness</span>
                    </motion.h1>

                    <motion.p
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="mt-6 text-base sm:text-xl text-neutral-400 font-sans tracking-wide leading-relaxed max-w-2xl mx-auto"
                    >
                      "Your one-stop fitness store for all your sports and fitness equipment." Find elite treadmills, commercial stationary spin bikes, dual station weight cable lines, and more.
                    </motion.p>
                  </div>

                  {/* Absolute Bottom Indicator Arrow with subtle bouncing motion */}
                  <div className="absolute bottom-10 inset-x-0 text-center hidden md:block">
                    <motion.div
                      animate={{ y: [0, 8, 0] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="flex flex-col items-center justify-center space-y-1.5 cursor-pointer"
                      onClick={() => {
                        const target = document.getElementById("categories-catalogue");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <span className="text-[10px] uppercase tracking-widest font-black text-red-500 hover:text-white transition-colors duration-300">
                        Explore Showroom Stock
                      </span>
                      <ChevronRight className="h-4 w-4 text-red-600 rotate-90" />
                    </motion.div>
                  </div>
                </section>

                {/* SHOWROOM CATALOG NAVIGATION BAR */}
                <section id="categories-catalogue" className="py-10 sm:py-14 md:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                    <div className="shrink-0">
                      <span className="text-red-500 text-xs font-black uppercase tracking-widest">
                        High-Performance Assets
                      </span>
                      <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white mt-1 leading-none">
                        Equipment Categories
                      </h2>
                      <div className="h-1 w-20 bg-red-600 mt-2 rounded" />
                    </div>

                    {/* Live search input box */}
                    <div className="relative w-full md:max-w-sm lg:max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-neutral-500" />
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search treadmills, exercise bikes..."
                        className="bg-neutral-900 text-neutral-300 placeholder-neutral-500 text-xs rounded border border-neutral-800 pl-10 pr-4 py-3.5 w-full focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600"
                      />
                    </div>
                  </div>

                  {searchQuery.trim() === "" ? (
                    // Display general category categories
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {categories.map((cat) => {
                        const count = products.filter(p => p.category_id === cat.id).length;
                        return (
                          <CategoryCard
                            key={cat.id}
                            category={cat}
                            onNavigate={handleNavigate}
                            productCount={count}
                          />
                        );
                      })}
                      {categories.length === 0 && (
                        <div className="col-span-full py-16 bg-neutral-950 border border-neutral-900 rounded-lg text-center font-medium italic text-neutral-500">
                          No product categories registered in catalog database yet.
                        </div>
                      )}
                    </div>
                  ) : (
                    // Display filtered keyword products directly for ease
                    <div className="space-y-6">
                      <div className="text-xs bg-neutral-950 p-3 rounded border border-neutral-900 text-neutral-400">
                        Showing filtered equipment matches for "<strong className="text-white">{searchQuery}</strong>"
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map((prod) => {
                          const cat = categories.find(c => c.id === prod.category_id);
                          return (
                            <ProductCard
                              key={prod.id}
                              product={prod}
                              categoryName={cat?.name}
                            />
                          );
                        })}
                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div className="col-span-full py-12 text-center text-neutral-500 italic text-sm">
                            No physical equipment matching your search. Try searching for "Series", "Dumbbell" or "Bike"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </section>

                {/* SHOWROOM STATISTICS AND TRUST */}
                <section className="bg-neutral-950 border-t border-b border-neutral-900 py-16">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12 font-sans">
                    <div className="text-center group">
                      <div className="text-red-500 font-black text-4xl mb-2 tracking-tight group-hover:scale-105 transition-transform">
                        100%
                      </div>
                      <h4 className="text-white text-xs uppercase font-extrabold tracking-widest">
                        Bavidex Authenticity
                      </h4>
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                        Every motorized treadmill, table tennis assembly or barbell frame is vetted by real athletes for performance standard.
                      </p>
                    </div>

                    <div className="text-center group">
                      <div className="text-red-500 font-black text-4xl mb-2 tracking-tight group-hover:scale-105 transition-transform">
                        ₦0
                      </div>
                      <h4 className="text-white text-xs uppercase font-extrabold tracking-widest">
                        Showroom Commissions
                      </h4>
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                        Bavidex operates as a zero-middlemen wholesale store. You get direct local rates.
                      </p>
                    </div>

                    <div className="text-center group">
                      <div className="text-red-500 font-black text-4xl mb-2 tracking-tight group-hover:scale-105 transition-transform">
                        1 Year+
                      </div>
                      <h4 className="text-white text-xs uppercase font-extrabold tracking-widest">
                        Parts & Frame Warranty
                      </h4>
                      <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                        Rest easy knowing our elite machinery is backed by factory certified technicians. Parts available locally in Lagos workshops.
                      </p>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* DYNAMIC CATEGORY SHOWROOM INVENTORY (`#/categories/:slug`) */}
            {currentPath.startsWith("#/categories/") && (
              <motion.div
                key="category-isolated"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
              >
                {(() => {
                  const targetSlug = currentPath.split("#/categories/")[1];
                  const activeCat = categories.find(cat => cat.slug === targetSlug);

                  if (!activeCat) {
                    return (
                      <div className="text-center py-20 bg-neutral-950 border border-neutral-800 rounded">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-black text-white uppercase tracking-wider">
                          Showroom Category Not Detected
                        </h3>
                        <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">
                          The requested category slug "<strong>{targetSlug}</strong>" does not exist in the Bavidex database schema yet.
                        </p>
                        <button
                          onClick={() => handleNavigate("#/")}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest py-3 px-6 rounded mt-6 transition-all"
                        >
                          Return to Home Showroom
                        </button>
                      </div>
                    );
                  }

                  const categoryProducts = products.filter(p => p.category_id === activeCat.id);

                  return (
                    <div className="space-y-10">
                      {/* Breadcrumbs */}
                      <nav className="text-xs font-bold uppercase tracking-wider text-neutral-600 flex items-center flex-wrap gap-1.5">
                        <span className="hover:text-white cursor-pointer" onClick={() => handleNavigate("#/")}>
                          Showroom Base
                        </span>
                        <span>/</span>
                        <span className="text-neutral-400">Categories</span>
                        <span>/</span>
                        <span className="text-red-500 font-black">{activeCat.name}</span>
                      </nav>

                      {/* Header isolated banner */}
                      <div className="relative h-64 rounded bg-neutral-900 border border-neutral-800 overflow-hidden flex items-center p-8 sm:p-12 shadow-2xl">
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-30 brightness-75 filter grayscale"
                          style={{ backgroundImage: `url(${activeCat.image_url})` }}
                        />
                        <div className="absolute inset-0 bg-linear-to-r from-black via-black/85 to-transparent pointer-events-none" />

                        <div className="relative z-10 max-w-xl">
                          <span className="text-red-500 font-extrabold text-[10px] uppercase tracking-[0.25em] block mb-2">
                            Bavidex Nigeria Professional Lineup
                          </span>
                          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white mb-2">
                            {activeCat.name} Showroom
                          </h1>
                          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed font-medium">
                            Explore commercial grade, heavy-duty {activeCat.name.toLowerCase()} cataloged directly in our depot. High resistance cylinders and smart displays built to last.
                          </p>
                        </div>
                      </div>

                      {/* Products Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {categoryProducts.map((prod) => (
                          <ProductCard key={prod.id} product={prod} />
                        ))}
                        {categoryProducts.length === 0 && (
                          <div className="col-span-full py-20 text-center bg-neutral-950 border border-neutral-900 rounded text-neutral-500 italic text-sm">
                            <ShoppingBag className="h-10 w-10 text-neutral-700 mx-auto mb-3" />
                            No physical equipment listed in {activeCat.name} yet. Authorized staff can deploy listings via Admin Panel.
                          </div>
                        )}
                      </div>

                      {/* Store Call To Action */}
                      <div className="bg-neutral-950 p-8 rounded border border-neutral-900 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                          <h4 className="text-white text-lg font-black uppercase tracking-wide">
                            Found what you were looking for?
                          </h4>
                          <p className="text-xs text-neutral-500 mt-1 max-w-xl leading-relaxed">
                            To inquire about stock levels, logistics, setups at your location, or request a invoice summary, quote our official Bavidex reference number by visiting Jibowu Flagship Depot or phoning our team.
                          </p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                          <button
                            onClick={() => handleNavigate("#/")}
                            className="bg-neutral-900 hover:bg-neutral-800 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-6 rounded border border-neutral-800 transition-all text-center w-full md:w-auto cursor-pointer"
                          >
                            Back Home
                          </button>
                          <a
                            href={`tel:${+2348031234567}`}
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-3.5 px-6 rounded transition-all text-center w-full md:w-auto"
                          >
                            Call Showroom (+234)
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* AUTHORIZED LOCKOUT ADMIN SIGN IN MODULE (`#/admin/login`) */}
            {currentPath === "#/admin/login" && (
              <motion.div
                key="admin-login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="py-16 px-4 flex flex-col justify-center items-center grow bg-neutral-950"
              >
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded p-8 shadow-2xl relative overflow-hidden font-sans">

                  {/* Visual key header badge */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-red-600" />

                  <div className="text-center mb-8">
                    <div className="bg-red-600/10 p-3 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                      <Key className="h-6 w-6 text-red-500" />
                    </div>
                    <span className="text-red-500 text-[9px] font-black uppercase tracking-[0.25em] block mb-1">
                      Bavidex Security Gateway
                    </span>
                    <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                      Store Manager Sign-in
                    </h1>
                    <p className="text-xs text-neutral-500 mt-2">
                      Authentication access required to execute CRUD actions or write to Supabase cluster.
                    </p>
                  </div>

                  {loginError && (
                    <div className="bg-red-950/20 border border-red-900/40 p-3.5 rounded text-xs text-red-400 mb-6 font-medium leading-relaxed">
                      {loginError}
                    </div>
                  )}

                  <form onSubmit={handleAdminSignIn} className="space-y-5">
                    <div>
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                        Staff Email Address
                      </label>
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="e.g. admin@bavidex.com"
                        className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-300 rounded px-4 py-3 w-full focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                          Access PIN / Password
                        </label>
                      </div>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••"
                        className="bg-neutral-950 border border-neutral-800 text-sm text-neutral-300 rounded px-4 py-3 w-full focus:outline-none focus:ring-1 focus:ring-red-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-4 rounded transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Authenticate Credentials
                    </button>
                  </form>

                  {/* Sandbox helper credentials panel */}
                  <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
                    <p className="text-[11px] uppercase tracking-widest font-black text-red-500/80 mb-2">
                      Evaluation Demo Access Instructions:
                    </p>
                    <div className="bg-black/40 text-[11px] text-neutral-400/95 py-2 px-3 rounded text-center leading-relaxed border border-neutral-800/60 inline-block w-full">
                      Account: <code className="text-white font-bold">{FALLBACK_ADMIN.email}</code>
                      <br />
                      Password: <code className="text-white font-bold">{FALLBACK_ADMIN.password}</code>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* AUTHORIZED CONSOLE HUB / DASHBOARD (`#/admin/dashboard`) */}
            {currentPath === "#/admin/dashboard" && (
              <motion.div
                key="admin-dashboard-hub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10"
              >
                {/* Authority Lock Guard */}
                {!adminUser ? (
                  <div className="text-center py-24 bg-neutral-950 rounded border border-neutral-800">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-black text-white uppercase tracking-wider">Access Restricted</h2>
                    <p className="text-xs text-neutral-500 mt-2">You must pass authorized admin login gateway to inspect this console.</p>
                    <button
                      onClick={() => handleNavigate("#/admin/login")}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest py-3 px-6 rounded mt-6"
                    >
                      Staff Sign-in Gateway
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
                      <div>
                        <div className="flex items-center space-x-2 text-xs text-red-500 font-extrabold uppercase tracking-widest">
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                          <span>Authorized Management Console</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1 wrap-break-word">Terminal Hub Control
                        </h1>
                      </div>

                      <div className="flex items-center space-x-3 text-xs">
                        <span className="text-gray-400 font-semibold italic bg-neutral-950 border border-neutral-800 px-3.5 py-2 rounded">
                          Staff: {adminUser.email}
                        </span>
                        <button
                          onClick={handleAdminSignOut}
                          className="bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-red-500 font-bold tracking-widest uppercase px-4 py-2 rounded transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>

                    {/* Statistics Row cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                      <div className="bg-neutral-900 p-6 rounded border border-neutral-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Dumbbell className="h-16 w-16 text-white" />
                        </div>
                        <span className="text-gray-500 text-[10px] tracking-widest font-black uppercase block">Catalog Categories</span>
                        <span className="text-3xl font-black text-white block mt-2">{categories.length}</span>
                        <button
                          onClick={() => handleNavigate("#/admin/categories")}
                          className="text-red-500 text-[10px] uppercase tracking-widest font-black mt-4 block hover:text-white transition-colors"
                        >
                          Configure Categories &rarr;
                        </button>
                      </div>

                      <div className="bg-neutral-900 p-6 rounded border border-neutral-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <ShoppingBag className="h-16 w-16 text-white" />
                        </div>
                        <span className="text-gray-500 text-[10px] tracking-widest font-black uppercase block">Showroom Items</span>
                        <span className="text-3xl font-black text-white block mt-2">{products.length}</span>
                        <button
                          onClick={() => handleNavigate("#/admin/products")}
                          className="text-red-500 text-[10px] uppercase tracking-widest font-black mt-4 block hover:text-white transition-colors"
                        >
                          Inventory Catalog &rarr;
                        </button>
                      </div>

                      <div className="bg-neutral-900 p-6 rounded border border-neutral-800 relative overflow-hidden">
                        <span className="text-gray-500 text-[10px] tracking-widest font-black uppercase block">Instock Showroom</span>
                        <span className="text-3xl font-black text-emerald-500 block mt-2">
                          {products.filter(p => p.available).length}
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-4 font-bold">Instantly viewable to customers</span>
                      </div>
                    </div>

                    {/* Navigation Direct Access grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                      <div className="bg-neutral-900/40 p-8 rounded border border-neutral-800/80 space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center space-x-2">
                          <Folder className="h-5 w-5 text-red-500" />
                          <span>Dynamic Equipment Categories</span>
                        </h3>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Control categories dynamically. Adding or updating items generates standard slugs linked with responsive client SEO listings automatically.
                        </p>
                        <button
                          onClick={() => handleNavigate("#/admin/categories")}
                          className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded block text-center transition-all w-full"
                        >
                          Manage Categories Panel
                        </button>
                      </div>

                      <div className="bg-neutral-900/40 p-8 rounded border border-neutral-800/80 space-y-4">
                        <h3 className="text-lg font-black uppercase tracking-wider text-white flex items-center space-x-2">
                          <Plus className="h-5 w-5 text-red-500" />
                          <span>Showroom Gym Inventory</span>
                        </h3>
                        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                          Maintain equipment information (Image URLs, Prices in Naira, Category assignments, and Instock toggles). All listings update globally in 1 second.
                        </p>
                        <button
                          onClick={() => handleNavigate("#/admin/products")}
                          className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded block text-center transition-all w-full"
                        >
                          Manage Showroom Stock
                        </button>
                      </div>
                    </div>

                    {/* Supabase Technical Integration Module removed per user request */}
                  </>
                )}
              </motion.div>
            )}

            {/* ADMIN DYNAMIC CATEGORIES CRUD PANEL (`#/admin/categories`) */}
            {currentPath === "#/admin/categories" && (
              <motion.div
                key="admin-categories-crud"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
              >
                {/* Security Gate */}
                {!adminUser ? (
                  <div className="text-center py-20 bg-neutral-950 rounded border border-neutral-800">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-black uppercase tracking-wider text-white">Access Denied</h2>
                    <button onClick={() => handleNavigate("#/admin/login")} className="bg-red-600 px-4 py-2 rounded text-xs mt-4">Sign-in</button>
                  </div>
                ) : (
                  <>
                    {/* Panel Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
                      <div>
                        {/* Brackets Navigation back to dashboard */}
                        <button onClick={() => handleNavigate("#/admin/dashboard")} className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors">
                          &larr; Return to Dashboard Hub
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 wrap-break-word">Showroom Category Editor
                        </h1>
                      </div>

                      <button
                        onClick={openAddCategoryModal}
                        className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded transition-all flex items-center space-x-1.5"
                      >
                        <FolderPlus className="h-4 w-4" />
                        <span>Add Category</span>
                      </button>
                    </div>

                    {/* Responsive Categories List */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                      <div className="p-4 bg-neutral-950 font-bold text-xs uppercase text-neutral-400 tracking-wider">
                        Dynamic Categories Registry ({categories.length})
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider font-extrabold bg-neutral-900/60">
                              <th className="p-4">Visual</th>
                              <th className="p-4">Category Name</th>
                              <th className="p-4">Public URL Slug</th>
                              <th className="p-4">Gear Count</th>
                              <th className="p-4 text-right">Console Tools</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800/50">
                            {categories.map((cat) => {
                              const productCount = products.filter(p => p.category_id === cat.id).length;
                              return (
                                <tr key={cat.id} className="hover:bg-neutral-800/30 transition-colors">
                                  <td className="p-4">
                                    <img src={cat.image_url} alt={cat.name} className="w-12 h-12 rounded object-cover border border-neutral-800 bg-neutral-950" />
                                  </td>
                                  <td className="p-4">
                                    <span className="font-extrabold text-white text-sm uppercase tracking-wide">{cat.name}</span>
                                  </td>
                                  <td className="p-4 font-mono text-red-500 font-bold">/categories/{cat.slug}</td>
                                  <td className="p-4 font-bold text-neutral-300">{productCount} items</td>
                                  <td className="p-4 text-right">
                                    <div className="inline-flex space-x-2">
                                      <button onClick={() => openEditCategoryModal(cat)} className="bg-neutral-850 hover:bg-neutral-800 text-gray-300 font-bold py-1.5 px-3 rounded flex items-center space-x-1 border border-neutral-800">
                                        <Edit2 className="h-3 w-3" /><span>Edit</span>
                                      </button>
                                      <button onClick={() => handleDeleteCategoryClick(cat.id, cat.name)} className="bg-red-950/20 hover:bg-red-600 hover:text-white text-red-400 font-bold py-1.5 px-3 rounded flex items-center space-x-1">
                                        <Trash2 className="h-3 w-3" /><span>Purge</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {categories.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-10 text-center text-neutral-500 italic font-medium bg-neutral-900/30">
                                  No categories loaded. Click 'Add Category' above to provision your first gym department catalog.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden divide-y divide-neutral-800/50">
                        {categories.map((cat) => {
                          const productCount = products.filter(p => p.category_id === cat.id).length;
                          return (
                            <div key={cat.id} className="p-4 flex items-center gap-3">
                              <img src={cat.image_url} alt={cat.name} className="w-14 h-14 rounded object-cover border border-neutral-800 bg-neutral-950 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-white text-sm uppercase tracking-wide truncate">{cat.name}</p>
                                <p className="font-mono text-red-500 text-[10px] font-bold truncate">/categories/{cat.slug}</p>
                                <p className="text-neutral-400 text-[10px] font-bold mt-0.5">{productCount} items</p>
                              </div>
                              <div className="flex flex-col gap-1.5 shrink-0">
                                <button onClick={() => openEditCategoryModal(cat)} className="bg-neutral-800 text-gray-300 font-bold py-1.5 px-3 rounded flex items-center gap-1 border border-neutral-700 text-xs">
                                  <Edit2 className="h-3 w-3" /><span>Edit</span>
                                </button>
                                <button onClick={() => handleDeleteCategoryClick(cat.id, cat.name)} className="bg-red-950/20 text-red-400 font-bold py-1.5 px-3 rounded flex items-center gap-1 text-xs border border-red-900/20">
                                  <Trash2 className="h-3 w-3" /><span>Purge</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {categories.length === 0 && (
                          <div className="p-8 text-center text-neutral-500 italic font-medium text-xs">
                            No categories loaded. Tap 'Add Category' above to provision your first gym department catalog.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* ADMIN SHOWROOM PRODUCTS CRUD PANEL (`#/admin/products`) */}
            {currentPath === "#/admin/products" && (
              <motion.div
                key="admin-products-crud"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
              >
                {/* Security Gate */}
                {!adminUser ? (
                  <div className="text-center py-20 bg-neutral-950 rounded border border-neutral-800">
                    <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-3" />
                    <h2 className="text-lg font-black uppercase tracking-wider text-white">Access Denied</h2>
                    <button onClick={() => handleNavigate("#/admin/login")} className="bg-red-600 px-4 py-2 rounded text-xs mt-4">Sign-in</button>
                  </div>
                ) : (
                  <>
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-neutral-800 gap-4">
                      <div>
                        <button onClick={() => handleNavigate("#/admin/dashboard")} className="text-xs font-bold uppercase tracking-widest text-neutral-400 hover:text-red-500 transition-colors">
                          &larr; Return to Dashboard Hub
                        </button>
                        <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 wrap-break-word">Showroom Inventory Manager
                        </h1>
                      </div>

                      <button
                        onClick={openAddProductModal}
                        className="bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-3 px-6 rounded transition-all flex items-center space-x-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Deploy Gym Gear</span>
                      </button>
                    </div>

                    {/* Stock list log */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded overflow-hidden">
                      <div className="p-4 bg-neutral-950 font-bold text-xs uppercase text-neutral-400 tracking-wider flex items-center justify-between">
                        <span>Showroom Equipment listings ({products.length})</span>
                      </div>

                      {/* Desktop Table */}
                      <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs font-sans">
                          <thead>
                            <tr className="border-b border-neutral-800 text-neutral-500 uppercase tracking-wider font-extrabold bg-neutral-900/60">
                              <th className="p-4">Visual</th>
                              <th className="p-4">Gear Name</th>
                              <th className="p-4">Category</th>
                              <th className="p-4">Price (₦)</th>
                              <th className="p-4">Stock</th>
                              <th className="p-4 text-right">Tools</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-800/50">
                            {products.map((prod) => {
                              const correspondingCat = categories.find(cat => cat.id === prod.category_id);
                              return (
                                <tr key={prod.id} className="hover:bg-neutral-800/30 transition-colors">
                                  <td className="p-4">
                                    <img src={prod.image_url} alt={prod.name} className="w-12 h-12 rounded object-cover border border-neutral-800 bg-neutral-950" />
                                  </td>
                                  <td className="p-4">
                                    <span className="font-extrabold text-white text-sm uppercase tracking-wide block">{prod.name}</span>
                                    <span className="text-[10px] text-neutral-500 tracking-wider">REF: {prod.id}</span>
                                  </td>
                                  <td className="p-4">
                                    <span className="bg-neutral-950 text-neutral-400 px-2.5 py-1 rounded inline-block font-extrabold text-[10px] tracking-wider uppercase border border-neutral-800">
                                      {correspondingCat ? correspondingCat.name : "Unassigned"}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    <span className="text-red-500 font-extrabold text-sm tracking-tight">
                                      {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(prod.price)}
                                    </span>
                                  </td>
                                  <td className="p-4">
                                    {prod.available ? (
                                      <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />In Stock
                                      </span>
                                    ) : (
                                      <span className="text-red-500 font-black uppercase text-[10px] tracking-widest flex items-center">
                                        <span className="h-2 w-2 rounded-full bg-red-600 mr-2" />Out of Stock
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-4 text-right">
                                    <div className="inline-flex space-x-2">
                                      <button onClick={() => openEditProductModal(prod)} className="bg-neutral-850 hover:bg-neutral-800 text-gray-300 font-bold py-1.5 px-3 rounded flex items-center space-x-1 border border-neutral-800">
                                        <Edit2 className="h-3 w-3" /><span>Edit</span>
                                      </button>
                                      <button onClick={() => handleDeleteProductClick(prod.id, prod.name)} className="bg-red-950/20 hover:bg-red-600 hover:text-white text-red-400 font-bold py-1.5 px-3 rounded flex items-center space-x-1">
                                        <Trash2 className="h-3 w-3" /><span>Purge</span>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {products.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-12 text-center text-neutral-500 italic font-medium bg-neutral-900/30">
                                  No fitness equipment registered. Click 'Deploy Gym Gear' above to populate custom inventory logs.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile Cards */}
                      <div className="md:hidden divide-y divide-neutral-800/50">
                        {products.map((prod) => {
                          const correspondingCat = categories.find(cat => cat.id === prod.category_id);
                          return (
                            <div key={prod.id} className="p-4 flex items-start gap-3">
                              <img src={prod.image_url} alt={prod.name} className="w-14 h-14 rounded object-cover border border-neutral-800 bg-neutral-950 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-extrabold text-white text-sm uppercase tracking-wide leading-tight line-clamp-2">{prod.name}</p>
                                <p className="text-red-500 font-extrabold text-sm mt-0.5">
                                  {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0 }).format(prod.price)}
                                </p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className="bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-neutral-800">
                                    {correspondingCat ? correspondingCat.name : "Unassigned"}
                                  </span>
                                  {prod.available ? (
                                    <span className="text-emerald-500 font-black text-[10px] flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />In Stock
                                    </span>
                                  ) : (
                                    <span className="text-red-500 font-black text-[10px] flex items-center gap-1">
                                      <span className="h-1.5 w-1.5 rounded-full bg-red-600" />Out of Stock
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col gap-1.5 shrink-0">
                                <button onClick={() => openEditProductModal(prod)} className="bg-neutral-800 text-gray-300 font-bold py-1.5 px-3 rounded flex items-center gap-1 border border-neutral-700 text-xs">
                                  <Edit2 className="h-3 w-3" /><span>Edit</span>
                                </button>
                                <button onClick={() => handleDeleteProductClick(prod.id, prod.name)} className="bg-red-950/20 text-red-400 font-bold py-1.5 px-3 rounded flex items-center gap-1 text-xs border border-red-900/20">
                                  <Trash2 className="h-3 w-3" /><span>Purge</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {products.length === 0 && (
                          <div className="p-8 text-center text-neutral-500 italic font-medium text-xs">
                            No fitness equipment registered. Tap 'Deploy Gym Gear' above to populate custom inventory logs.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Footer view */}
      <Footer onNavigate={handleNavigate} />

      {/* ======================================================= */}
      {/* 📂 CATEGORY MODAL DIALOG POPUP */}
      {/* ======================================================= */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 rounded border border-neutral-800 p-5 md:p-8 max-w-lg w-full text-white shadow-2xl relative font-sans max-h-[90dvh] overflow-y-auto">
            <button
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base sm:text-xl font-black uppercase tracking-wider mb-2 flex items-center gap-2 flex-wrap">
              <FolderPlus className="h-5 w-5 text-red-500" />
              <span>{editingCategory ? "Alter Category Config" : "Deploy Equipment Category"}</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Establish a dynamic visual showcase container linked directly to SEO-clean URLs.
            </p>

            <form onSubmit={handleCategorySubmit} className="space-y-5">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Stationary Racks, Treadmills, Dumbbells"
                  className="bg-neutral-950 border border-neutral-800 text-sm rounded px-4 py-3 w-full focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                  SEO URL Slug (Auto-Generated)
                </label>
                <div className="flex rounded overflow-hidden select-none w-full">
                  <span className="bg-neutral-950 text-neutral-500 px-2 sm:px-3.5 py-3 border border-neutral-800 text-[10px] sm:text-xs font-mono select-none whitespace-nowrap shrink-0">/categories/
                  </span>
                  <input
                    type="text"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                    placeholder="treadmills"
                    className="bg-neutral-950 border-t border-b border-r border-neutral-800 text-sm rounded-r px-4 py-3 w-full focus:outline-none font-mono text-red-400"
                  />
                </div>
              </div>

              <ImageSourceSelector
                imageUrl={catImageUrl}
                onImageSelected={(url) => setCatImageUrl(url)}
                bucket="categories-images"
                idPrefix="cat"
                label="Category Cover Visual"
              />

              <div className="pt-4 border-t border-neutral-800 flex justify-end space-x-3 text-xs uppercase font-extrabold tracking-widest">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="bg-transparent text-gray-400 px-5 py-3 rounded hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded transition-all"
                >
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* 📂 PRODUCT MODAL DIALOG POPUP */}
      {/* ======================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-neutral-900 rounded border border-neutral-800 p-5 md:p-8 max-w-lg w-full text-white shadow-2xl relative font-sans max-h-[90dvh] overflow-y-auto">
            <button
              onClick={() => setIsProductModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base sm:text-xl font-black uppercase tracking-wider mb-2 flex items-center gap-2 flex-wrap">
              <Dumbbell className="h-5 w-5 text-red-500" />
              <span>{editingProduct ? "Edit Equipment Spec" : "Catalog Showroom Product"}</span>
            </h3>
            <p className="text-xs text-neutral-400 mb-6">
              Specify active pricing tags, stock levels, and associated categories.
            </p>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                  Equipment Product Title
                </label>
                <input
                  type="text"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. commercial Smart Auto-Incline Treadmill 7000"
                  className="bg-neutral-950 border border-neutral-800 text-sm rounded px-4 py-3 w-full focus:outline-none focus:ring-1 focus:ring-red-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                    Showroom Price (₦ NGN)
                  </label>
                  <input
                    type="number"
                    value={prodPrice || ""}
                    onChange={(e) => setProdPrice(Number(e.target.value))}
                    placeholder="1350000"
                    className="bg-neutral-950 border border-neutral-800 text-sm rounded px-4 py-3 w-full focus:outline-none focus:ring-1 focus:ring-red-600 font-mono text-red-500 font-extrabold"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-2">
                    Assign Showroom Division
                  </label>
                  <select
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="bg-neutral-950 border border-neutral-800 text-xs rounded px-4 py-3.5 w-full focus:outline-none focus:ring-1 focus:ring-red-600 h-[46px]"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                    {categories.length === 0 && (
                      <option value="">No Categories Registered</option>
                    )}
                  </select>
                </div>
              </div>

              <ImageSourceSelector
                imageUrl={prodImageUrl}
                onImageSelected={(url) => setProdImageUrl(url)}
                bucket="products-images"
                idPrefix="prod"
                label="Product Showcase Image"
              />

              <div className="flex items-center space-x-3 bg-neutral-950/40 p-3 rounded border border-neutral-800/80">
                <input
                  id="prod-available-toggle"
                  type="checkbox"
                  checked={prodAvailable}
                  onChange={(e) => setProdAvailable(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-800 bg-neutral-950 accent-red-600"
                />
                <label htmlFor="prod-available-toggle" className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                  Equipment is available for public showcase listing
                </label>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end space-x-3 text-xs uppercase font-extrabold tracking-widest">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="bg-transparent text-gray-400 px-5 py-3 rounded hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded transition-all"
                >
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================= */}
      {/* ⚠️ CUSTOM IN-APP DELETE CONFIRMATION DIALOG */}
      {/* ======================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-110 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-neutral-900 rounded border border-neutral-800 p-6 md:p-8 max-w-md w-full text-white shadow-2xl relative font-sans">
            <h3 className="text-lg font-black uppercase tracking-wider mb-2 text-red-500 flex items-center space-x-2">
              <span className="p-1 bg-red-500/10 rounded mr-1">⚠️</span>
              <span>Delete Confirmation</span>
            </h3>
            <p className="text-xs text-neutral-300 my-4 leading-relaxed">
              Are you sure you want to remove the {deleteTarget.type === "category" ? "equipment category" : "fitness product"}{" "}
              <strong className="text-white">"{deleteTarget.name}"</strong>? This will permanently erase it from the Supabase active tables.
            </p>
            {deleteTarget.type === "category" && (
              <p className="text-[10px] text-red-400 bg-red-950/20 border border-red-900/30 p-2.5 rounded mb-4 leading-normal">
                Notice: Removing a category unbinds products inside it or hides them from standard store queries.
              </p>
            )}
            <div className="pt-4 border-t border-neutral-850 flex justify-end space-x-3 text-xs uppercase font-extrabold tracking-widest">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="bg-transparent text-gray-400 px-4 py-2.5 rounded hover:text-white transition-all"
              >
                No, Cancel
              </button>
              <button
                type="button"
                onClick={executeDeleteTarget}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
