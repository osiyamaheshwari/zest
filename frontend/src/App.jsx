import React, { useState, useEffect, useRef } from 'react';
import { 
  Leaf, Sun, Moon, Search, Filter, Plus, MapPin, Calendar, 
  MessageCircle, CheckCircle, ShoppingBag, Home, BookOpen, 
  HelpCircle, User, LogOut, Bell, Download, Star, ChevronRight, 
  Trash2, Award, Heart, MessageSquare, Send, Check, X, Users, Edit,
  ArrowLeft, Camera, Upload
} from 'lucide-react';

const API_BASE = '/api';
const DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

const CATEGORY_GRADIENTS = {
  Cycles: "from-teal-500 to-emerald-500",
  Electronics: "from-amber-500 to-orange-500",
  Books: "from-blue-500 to-indigo-500",
  Furniture: "from-amber-700 to-amber-900",
  Accessories: "from-pink-500 to-rose-500",
  PG: "from-rose-400 to-red-500",
  Hostel: "from-rose-500 to-orange-500",
  "Hostel Room": "from-rose-500 to-orange-500",
  Flat: "from-indigo-600 to-blue-500",
  Apartment: "from-violet-500 to-purple-600",
  Lost: "from-red-400 to-pink-500",
  Found: "from-blue-400 to-cyan-500",
  Technical: "from-emerald-600 to-teal-700",
  Sports: "from-orange-500 to-rose-600",
  "Extra-curricular": "from-purple-600 to-pink-600"
};

// F4: specific, locally-bundled image per category (downloaded into /public/categories).
// Deterministic + offline — no random external images.
const AVAILABLE_CATEGORY_IMAGES = new Set([
  'electronics', 'books', 'cycles', 'furniture', 'accessories',
  'hostel', 'hostel-room', 'pg', 'flat', 'apartment',
  'lost', 'found', 'technical', 'sports', 'extra-curricular'
]);

function categoryImageUrl(category) {
  const slug = String(category || '').toLowerCase().trim().replace(/\s+/g, '-');
  return `/categories/${AVAILABLE_CATEGORY_IMAGES.has(slug) ? slug : 'default'}.jpg`;
}

// Card header: shows uploaded image if present, else a category-based stock image,
// else falls back to a branded gradient. Gradient + dark overlay keep text legible.
function CardHeaderPlaceholder({ category, title, image, seedKey }) {
  const gradient = CATEGORY_GRADIENTS[category] || "from-slate-500 to-slate-700";
  const [imgError, setImgError] = useState(false);
  const src = image || categoryImageUrl(category);
  const showImg = src && !imgError;

  return (
    <div className={`h-40 w-full bg-gradient-to-br ${gradient} flex flex-col justify-between p-4 text-white relative overflow-hidden`}>
      {showImg && (
        <>
          <img
            src={src}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
        </>
      )}
      <span className="relative z-10 text-[10px] font-bold tracking-wider uppercase bg-white/20 backdrop-blur rounded px-2.5 py-1 self-start">
        {category}
      </span>
      <div className="relative z-10 space-y-1">
        <h4 className="font-extrabold text-sm line-clamp-2 leading-tight drop-shadow-sm">{title}</h4>
      </div>
    </div>
  );
}

// Reusable back button — uses browser history so it works with mobile/browser back too
function BackButton({ onBack, label = "Back" }) {
  return (
    <button
      type="button"
      onClick={() => (onBack ? onBack() : window.history.back())}
      className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

// F3: Image uploader — multiple files, drag & drop, and mobile camera capture.
// Stores images as base64 data URLs (kept in the JSON DB). onChange always receives an array.
function ImageUploader({ images = [], onChange, multiple = false, max = multiple ? 5 : 1 }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const camRef = useRef(null);

  const ingest = (fileList) => {
    const incoming = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (!incoming.length) return;
    const slots = Math.max(0, max - images.length);
    const take = multiple ? incoming.slice(0, slots) : incoming.slice(0, 1);
    if (!take.length) return;
    Promise.all(take.map(f => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(f);
    }))).then(urls => {
      const clean = urls.filter(Boolean);
      onChange(multiple ? [...images, ...clean].slice(0, max) : clean.slice(-1));
    });
  };

  const removeAt = (idx) => onChange(images.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); ingest(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center cursor-pointer transition-colors ${dragOver ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : 'border-slate-300 dark:border-slate-700 hover:border-emerald-400'}`}
      >
        <Upload className="h-5 w-5 text-slate-400" />
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Drag &amp; drop or click to upload{multiple ? ` (up to ${max})` : ''}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => { ingest(e.target.files); e.target.value = ''; }}
        />
      </div>

      <button
        type="button"
        onClick={() => camRef.current?.click()}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
      >
        <Camera className="h-4 w-4" /> Take a photo
      </button>
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { ingest(e.target.files); e.target.value = ''; }}
      />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {images.map((src, idx) => (
            <div key={idx} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
              <img src={src} alt={`upload-${idx}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute top-0.5 right-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPageRaw] = useState('landing'); // landing, dashboard, marketplace, hostels, resources, lostfound, clubs, profile
  const pageRef = useRef('landing');
  useEffect(() => { pageRef.current = page; }, [page]);

  // setPage wrapper: pushes a browser-history entry so the back button (desktop + mobile) works
  const setPage = (next) => {
    if (next !== pageRef.current) {
      try { window.history.pushState({ page: next }, ''); } catch (e) { /* noop */ }
    }
    setPageRaw(next);
  };

  // Sync app navigation with browser/mobile back & forward gestures
  useEffect(() => {
    try { window.history.replaceState({ page: pageRef.current }, ''); } catch (e) { /* noop */ }
    const onPop = (e) => setPageRaw(e.state?.page || 'landing');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const [darkMode, setDarkMode] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('zest_token') || '');
  const [currentUser, setCurrentUser] = useState(null);

  // Dynamic database states loaded from server
  const [marketplaceItems, setMarketplaceItems] = useState([]);
  const [hostelListings, setHostelListings] = useState([]);
  const [studyResources, setStudyResources] = useState([]);
  const [lostfoundItems, setLostfoundItems] = useState([]);
  const [clubPosts, setClubPosts] = useState([]);
  
  // Notification States
  const [notifications, setNotifications] = useState([
    { id: 1, text: "Welcome to ZEST! Browse our new notes repository.", time: "1 hour ago", read: false },
    { id: 2, text: "Someone is interested in your 'C++ Book' listing.", time: "2 hours ago", read: false },
    { id: 3, text: "New PG accommodation listed 1.2 km from campus.", time: "1 day ago", read: true }
  ]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  // Sync Dark Mode class on HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load User Profile on token change
  useEffect(() => {
    if (token) {
      localStorage.setItem('zest_token', token);
      fetchProfile();
      loadAllPlatformData();
    } else {
      localStorage.removeItem('zest_token');
      setCurrentUser(null);
      if (page !== 'landing') setPage('landing');
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
        if (page === 'landing') setPage('dashboard');
      } else {
        setToken('');
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
      setToken('');
    }
  };

  const loadAllPlatformData = async () => {
    try {
      const fetchOpts = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const [resM, resH, resR, resL, resC] = await Promise.all([
        fetch(`${API_BASE}/marketplace`),
        fetch(`${API_BASE}/hostels`),
        fetch(`${API_BASE}/resources`),
        fetch(`${API_BASE}/lostfound`),
        fetch(`${API_BASE}/clubs`)
      ]);

      if (resM.ok) setMarketplaceItems(await resM.json());
      if (resH.ok) setHostelListings(await resH.json());
      if (resR.ok) setStudyResources(await resR.json());
      if (resL.ok) setLostfoundItems(await resL.json());
      if (resC.ok) setClubPosts(await resC.json());
    } catch (err) {
      console.error("Error fetching collections:", err);
    }
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setPage('landing');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage(currentUser ? 'dashboard' : 'landing')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Leaf className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">ZEST</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {currentUser && (
              <>
                {/* Notification Bell */}
                <div className="relative">
                  <button 
                    onClick={() => setShowNotifMenu(!showNotifMenu)}
                    className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {notifications.some(n => !n.read) && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                  </button>

                  {showNotifMenu && (
                    <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-2 dark:border-slate-800">
                        <span className="font-semibold text-sm">Notifications</span>
                        <button 
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, read: true })))}
                          className="text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                        {notifications.map(n => (
                          <div 
                            key={n.id} 
                            className={`rounded-lg p-2 text-xs transition-colors ${n.read ? 'text-slate-500 dark:text-slate-400' : 'bg-slate-50 dark:bg-slate-800/50 font-medium'}`}
                          >
                            <p>{n.text}</p>
                            <span className="text-[10px] text-slate-400">{n.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Link */}
                <button 
                  onClick={() => setPage('profile')}
                  className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="h-8 w-8 overflow-hidden rounded-full border border-emerald-500">
                    <img 
                      src={currentUser.profilePic || DEFAULT_AVATAR} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="hidden text-sm font-medium sm:block">{currentUser.name}</span>
                </button>

                <button 
                  onClick={handleLogout}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {page !== 'landing' && page !== 'dashboard' && (
          <BackButton onBack={() => setPage('dashboard')} label="Back to Dashboard" />
        )}
        {page === 'landing' && <LandingPage setToken={setToken} />}
        {page === 'dashboard' && (
          <Dashboard 
            setPage={setPage} 
            currentUser={currentUser} 
            marketplaceItems={marketplaceItems}
            hostelListings={hostelListings}
            studyResources={studyResources}
            lostfoundItems={lostfoundItems}
            clubPosts={clubPosts}
          />
        )}
        {page === 'marketplace' && <Marketplace token={token} currentUser={currentUser} items={marketplaceItems} refreshData={loadAllPlatformData} />}
        {page === 'hostels' && <HostelFinder token={token} currentUser={currentUser} listings={hostelListings} refreshData={loadAllPlatformData} />}
        {page === 'resources' && <Resources token={token} currentUser={currentUser} resources={studyResources} refreshData={loadAllPlatformData} />}
        {page === 'lostfound' && <LostFound token={token} currentUser={currentUser} items={lostfoundItems} refreshData={loadAllPlatformData} />}
        {page === 'clubs' && <Clubs token={token} currentUser={currentUser} posts={clubPosts} refreshData={loadAllPlatformData} />}
        {page === 'profile' && <Profile token={token} currentUser={currentUser} fetchProfile={fetchProfile} />}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} ZEST Student Platform. Built exclusively for VIT Pune Students (@vit.edu).</p>
        </div>
      </footer>
    </div>
  );
}

// ==========================================
// PAGES & FEATURES
// ==========================================

// 1. LANDING PAGE / LOGIN PORTAL
function LandingPage({ setToken }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', branch: '', year: '', status: 'Day Scholar', contact: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Domain validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@vit\.edu$/;
    if (!emailRegex.test(formData.email)) {
      setError('Only college email addresses ending with @vit.edu are accepted.');
      return;
    }

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password } 
        : formData;

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json();
      } catch (parseErr) {
        throw new Error('Connection refused by the ZEST backend server. Please ensure the backend is running on port 5000.');
      }

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed.');
      }

      setToken(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Leaf className="h-4 w-4" /> Designed Exclusively for VIT Pune
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl">
          A One-Stop Student <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">Utility Platform</span> for Campus Resource Management
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
          Simplify your college life. Buy/sell items, find hosteler roommates, download syllabus-mapped notes, report lost belongings, and explore clubs in a single trusted space.
        </p>

        <div className="grid grid-cols-3 gap-6 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div>
            <div className="text-3xl font-extrabold text-emerald-500">1200+</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Active Students</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-500">450+</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Resources Shared</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-500">₹80K+</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">Marketplace Deals</div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button 
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${isLogin ? 'border-b-2 border-emerald-500 text-slate-900 dark:text-white' : 'text-slate-400'}`}
          >
            Log In
          </button>
          <button 
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 py-4 text-center font-semibold text-sm transition-colors ${!isLogin ? 'border-b-2 border-emerald-500 text-slate-900 dark:text-white' : 'text-slate-400'}`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900">
              {error}
            </div>
          )}

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Full Name</label>
                <input 
                  type="text" required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Branch</label>
                  <input 
                    type="text" placeholder="CS / IT / Mech"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Year</label>
                  <select 
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  >
                    <option value="">Select Year</option>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Status</label>
                  <select 
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  >
                    <option value="Hostel">Hostel</option>
                    <option value="Day Scholar">Day Scholar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Phone No</label>
                  <input 
                    type="text" placeholder="8411848008"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">VIT Email ID</label>
            <input 
              type="email" required
              placeholder="username@vit.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Password</label>
            <input 
              type="password" required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
            />
          </div>

          <button 
            type="submit" 
            className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. DASHBOARD
function Dashboard({ setPage, currentUser, marketplaceItems, hostelListings, studyResources, lostfoundItems, clubPosts }) {
  const modules = [
    { title: "Marketplace", desc: "Buy, sell, exchange, or rent items within college campus.", icon: ShoppingBag, page: "marketplace", color: "from-blue-500 to-indigo-500" },
    { title: "Hostel & Roommates", desc: "Find student hosteler rooms, shared flats, or matched roommates.", icon: Home, page: "hostels", color: "from-rose-500 to-orange-500" },
    { title: "PYQs & Study Repository", desc: "Syllabus notes, previous year tests, and lab sheets.", icon: BookOpen, page: "resources", color: "from-emerald-500 to-teal-500" },
    { title: "Lost & Found Portal", desc: "Report campus missing products or claim found items.", icon: HelpCircle, page: "lostfound", color: "from-purple-500 to-pink-500" },
    { title: "Clubs & Recruitment", desc: "Technical, sports, and extracurricular recruitment postings.", icon: Users, page: "clubs", color: "from-amber-500 to-red-500" }
  ];

  // Dynamic Statistics Counting matching actual user items
  const userMarketplaceCount = marketplaceItems.filter(i => i.seller === currentUser?.id).length;
  const userHostelCount = hostelListings.filter(l => l.owner === currentUser?.id).length;
  const userResourceCount = studyResources.filter(r => r.contributor === currentUser?.id).length;
  const userLostCount = lostfoundItems.filter(lf => lf.reporter === currentUser?.id).length;
  const userClubCount = clubPosts.filter(c => c.creator === currentUser?.id).length;

  const totalUserPosts = userMarketplaceCount + userHostelCount + userResourceCount + userLostCount + userClubCount;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold sm:text-3xl">Welcome back, {currentUser?.name || 'Student'}!</h2>
        <p className="mt-2 text-emerald-100 max-w-lg text-sm">
          Access your VIT Pune student resource portal. Manage listings, join clubs, or download study resources.
        </p>
      </div>

      {/* Modules Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {modules.map((m, idx) => (
          <div 
            key={idx}
            onClick={() => setPage(m.page)}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
          >
            <div>
              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${m.color} text-white shadow-md`}>
                <m.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-bold text-lg group-hover:text-emerald-500 transition-colors">{m.title}</h3>
              <p className="mt-2 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{m.desc}</p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-500">
              Open Module <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Activity & Stats split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Statistics Card (Dynamic Stats matches actual collection listings) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-4">Your Platform Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-400">Marketplace Listings</span>
              <span className="font-bold">{userMarketplaceCount} posts</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-400">Accommodations Shared</span>
              <span className="font-bold">{userHostelCount} posts</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-400">Study Note Uploads</span>
              <span className="font-bold text-emerald-500">{userResourceCount} uploads</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-400">Lost & Found Reports</span>
              <span className="font-bold">{userLostCount} posts</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
              <span className="text-slate-550 dark:text-slate-400">Club Postings Created</span>
              <span className="font-bold">{userClubCount} posts</span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total Active Postings</span>
              <span className="font-extrabold text-emerald-500">{totalUserPosts} items</span>
            </div>
          </div>
        </div>

        {/* Live Feed */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-lg mb-4">Campus Activity Feed</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 text-xs leading-relaxed">
              <div className="h-2 w-2 mt-1.5 rounded-full bg-emerald-500 shrink-0"></div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Rahul M.</span> listed <b>Hercules Gear Cycle</b> in Cycles for ₹2,500.
                <span className="block text-[10px] text-slate-400 mt-0.5">10 minutes ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs leading-relaxed">
              <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 shrink-0"></div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Nisha K.</span> uploaded <b>Database Management Systems Unit 3 Notes</b>.
                <span className="block text-[10px] text-slate-400 mt-0.5">45 minutes ago</span>
              </div>
            </div>
            <div className="flex items-start gap-3 text-xs leading-relaxed">
              <div className="h-2 w-2 mt-1.5 rounded-full bg-rose-500 shrink-0"></div>
              <div>
                <span className="font-semibold text-slate-700 dark:text-slate-300">Aniket P.</span> reported <b>Keys with Green Keychain</b> found in Canteen Area.
                <span className="block text-[10px] text-slate-400 mt-0.5">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. MARKETPLACE MODULE
function Marketplace({ token, currentUser, items, refreshData }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState({ title: '', description: '', category: 'Electronics', price: '', image: '' });
  const [filters, setFilters] = useState({ category: '', search: '' });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormState({ title: '', description: '', category: 'Electronics', price: '', image: '' });
    setShowAddForm(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    setFormState({ 
      id: item._id,
      title: item.title, 
      description: item.description, 
      category: item.category, 
      price: item.price, 
      image: item.image 
    });
    setSelectedItem(null);
    setShowAddForm(true);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isEditMode ? `${API_BASE}/marketplace/${formState.id}/status` : `${API_BASE}/marketplace`;
      
      // Note: In typical APIs PUT matches editing post details. Let's make it fully dynamic.
      // If we are editing, we send details. On status change, we hit status endpoint.
      // We will hit /api/marketplace/:id for PUT details, or fallback to status if status endpoint is only one available.
      // Since we are writing the routes, let's make sure the backend allows editing listings! 
      // (Wait, we can edit using the endpoint OR define direct route. Let's update marketplace.js backend to support PUT edit!)
      const res = await fetch(isEditMode ? `${API_BASE}/marketplace/${formState.id}` : `${API_BASE}/marketplace`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formState)
      });
      if (res.ok) {
        setShowAddForm(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const expressInterest = async (itemId) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/${itemId}/interest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Interest registered. Seller contact: ${data.sellerContact}`);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateDealStatus = async (itemId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/marketplace/${itemId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        refreshData();
        setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`${API_BASE}/marketplace/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedItem(null);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = !filters.category || item.category.toLowerCase() === filters.category.toLowerCase();
    const matchesSearch = !filters.search || 
      item.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      item.description.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Marketplace</h2>
          <p className="text-slate-500 text-sm">Buy, rent, or exchange things inside VIT campus.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-md self-start"
        >
          <Plus className="h-4 w-4" /> Create Listing
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 outline-none"
          />
        </div>
        <select 
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none"
        >
          <option value="">All Categories</option>
          <option value="Electronics">Electronics</option>
          <option value="Books">Books</option>
          <option value="Cycles">Cycles</option>
          <option value="Furniture">Furniture</option>
          <option value="Accessories">Accessories</option>
        </select>
      </div>

      {/* Item Listings Grid */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map(item => (
          <div 
            key={item._id}
            onClick={() => setSelectedItem(item)}
            className="group flex flex-col cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
          >
            {/* SVG placeholder instead of side images */}
            <CardHeaderPlaceholder category={item.category} title={item.title} image={item.image} seedKey={item._id} />
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">{item.category}</span>
                <h3 className="font-bold text-slate-850 dark:text-white mt-1 group-hover:text-emerald-500 transition-colors text-sm">{item.title}</h3>
                <span className="inline-block mt-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-655 dark:bg-slate-800 dark:text-slate-350">{item.status}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                <span className="font-extrabold text-sm">₹{item.price}</span>
                <span className="text-[10px] text-slate-400">By {item.sellerName}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Post/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isEditMode ? "Edit Marketplace Listing" : "Create Marketplace Listing"}</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Item Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Scientific Calculator"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Category</label>
                  <select 
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Books">Books</option>
                    <option value="Cycles">Cycles</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Price (INR)</label>
                  <input 
                    type="number" required
                    placeholder="₹ Expected"
                    value={formState.price}
                    onChange={(e) => setFormState({ ...formState, price: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Description</label>
                <textarea 
                  rows="3"
                  placeholder="Tell buyers about item condition, negotiation range..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Photo (optional)</label>
                <ImageUploader
                  images={formState.image ? [formState.image] : []}
                  onChange={(arr) => setFormState({ ...formState, image: arr[0] || '' })}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Publish Listing"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Item Details overlay */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <CardHeaderPlaceholder category={selectedItem.category} title={selectedItem.title} image={selectedItem.image} seedKey={selectedItem._id} />
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-4 right-4 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-emerald-500 uppercase">{selectedItem.category}</span>
                  <h3 className="text-xl font-bold mt-1">{selectedItem.title}</h3>
                  <p className="text-2xl font-extrabold text-emerald-500 mt-2">₹{selectedItem.price}</p>
                </div>
                {selectedItem.seller === currentUser?.id && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(selectedItem)}
                      className="rounded-lg p-2 border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      title="Edit Post"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedItem._id)}
                      className="rounded-lg p-2 border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                      title="Delete Post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-400">Description</h4>
                <p className="text-sm text-slate-655 dark:text-slate-305 mt-1 leading-relaxed">{selectedItem.description || 'No description provided.'}</p>
              </div>

              <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-xs border border-slate-100 dark:border-slate-800">
                <div>
                  <span className="block text-slate-400">Seller Profile</span>
                  <span className="font-bold">{selectedItem.sellerName}</span>
                  <p className="text-xs text-slate-500 mt-1">Contact: {selectedItem.sellerContact || 'Not available'}</p>
                </div>
                <div>
                  <span className="block text-slate-400">Status</span>
                  <span className="font-bold text-emerald-500">{selectedItem.status}</span>
                </div>
              </div>

              {selectedItem.seller === currentUser?.id ? (
                <div className="space-y-2">
                  <span className="block text-xs uppercase font-semibold text-slate-405">Update Deal status (Seller Panel)</span>
                  <div className="flex flex-wrap gap-2">
                    {['Interested', 'Contacted Seller', 'Meeting Scheduled', 'Negotiating', 'Deal Completed', 'Not Interested'].map(st => (
                      <button 
                        key={st}
                        onClick={() => updateDealStatus(selectedItem._id, st)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${selectedItem.status === st ? 'bg-emerald-50 text-white border-emerald-500' : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700'}`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => expressInterest(selectedItem._id)}
                  className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageCircle className="h-5 w-5" /> Express Interest / Get Seller Contact
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. HOSTEL FINDER MODULE
function HostelFinder({ token, currentUser, listings, refreshData }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filters, setFilters] = useState({ type: '', maxRent: '', roommateNeeded: 'false', search: '' });
  const [formState, setFormState] = useState({ title: '', description: '', type: 'Hostel Room', rent: '', location: '', occupancy: 'Single', genderPreference: 'Any', amenities: '', distance: '', images: [], roommateNeeded: false, roommateDetails: '' });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormState({ title: '', description: '', type: 'Hostel Room', rent: '', location: '', occupancy: 'Single', genderPreference: 'Any', amenities: '', distance: '', images: [], roommateNeeded: false, roommateDetails: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    setFormState({ 
      id: item._id,
      title: item.title, 
      description: item.description, 
      type: item.type, 
      rent: item.rent, 
      location: item.location, 
      occupancy: item.occupancy, 
      genderPreference: item.genderPreference, 
      amenities: item.amenities?.join(', ') || '',
      distance: item.distance,
      images: item.images || [],
      roommateNeeded: item.roommateProfile?.needed || false,
      roommateDetails: item.roommateProfile?.details || ''
    });
    setSelectedList(null);
    setShowForm(true);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const amenitiesArr = formState.amenities.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const payload = {
        ...formState,
        amenities: amenitiesArr,
        images: formState.images || []
      };

      const res = await fetch(isEditMode ? `${API_BASE}/hostels/${formState.id}` : `${API_BASE}/hostels`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleWishlist = async (listingId) => {
    try {
      const res = await fetch(`${API_BASE}/hostels/${listingId}/wishlist`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    try {
      const res = await fetch(`${API_BASE}/hostels/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedList(null);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredListings = listings.filter(l => {
    const matchesType = !filters.type || l.type.toLowerCase() === filters.type.toLowerCase();
    const matchesRent = !filters.maxRent || l.rent <= Number(filters.maxRent);
    const matchesRoommate = filters.roommateNeeded === 'false' || (l.roommateProfile && l.roommateProfile.needed === true);
    const matchesSearch = !filters.search || 
      l.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      l.location.toLowerCase().includes(filters.search.toLowerCase());
    return matchesType && matchesRent && matchesRoommate && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Hostel & Roommate Finder</h2>
          <p className="text-slate-500 text-sm">Post PGs, hostels, flats, or filter roommate profiles.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-md self-start"
        >
          <Plus className="h-4 w-4" /> Add Accommodation
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search location, amenities..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 outline-none"
          />
        </div>
        <select 
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none"
        >
          <option value="">All Types</option>
          <option value="Hostel Room">Hostel Room</option>
          <option value="Apartment">Apartment</option>
          <option value="PG">PG</option>
          <option value="Flat">Flat</option>
        </select>
        <input 
          type="number"
          placeholder="Max Rent (INR)"
          value={filters.maxRent}
          onChange={(e) => setFilters({ ...filters, maxRent: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white p-2 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none w-36"
        />
        <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
          <input 
            type="checkbox"
            checked={filters.roommateNeeded === 'true'}
            onChange={(e) => setFilters({ ...filters, roommateNeeded: e.target.checked ? 'true' : 'false' })}
            className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
          />
          Roommate Needed
        </label>
      </div>

      {/* Listings Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredListings.map(l => (
          <div 
            key={l._id}
            onClick={() => setSelectedList(l)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
          >
            {/* SVG placeholder instead of side images */}
            <CardHeaderPlaceholder category={l.type} title={l.title} image={l.images?.[0]} seedKey={l._id} />
            <div className="p-5 space-y-2">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">{l.type} • {l.occupancy}</span>
                <span className="font-extrabold text-base text-emerald-500">₹{l.rent}/mo</span>
              </div>
              <h3 className="font-bold text-sm text-slate-850 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">{l.title}</h3>
              <p className="flex items-center text-xs text-slate-400 gap-1"><MapPin className="h-3.5 w-3.5" /> {l.location} ({l.distance} km from VIT)</p>
              {l.roommateProfile?.needed && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:bg-orange-950/20 dark:text-orange-400">
                  Roommate Sought
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isEditMode ? "Edit Accommodation" : "Post Accommodation"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-650"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Spacious Double Occupancy Flat near VIT gate"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Type</label>
                  <select 
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Hostel Room">Hostel Room</option>
                    <option value="Apartment">Apartment</option>
                    <option value="PG">PG</option>
                    <option value="Flat">Flat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Rent (INR/month)</label>
                  <input 
                    type="number" required
                    placeholder="₹ Rent"
                    value={formState.rent}
                    onChange={(e) => setFormState({ ...formState, rent: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Occupancy</label>
                  <select 
                    value={formState.occupancy}
                    onChange={(e) => setFormState({ ...formState, occupancy: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Single">Single</option>
                    <option value="Double">Double</option>
                    <option value="Shared">Shared</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Distance (km from VIT)</label>
                  <input 
                    type="number" step="0.1" required
                    placeholder="e.g. 0.8"
                    value={formState.distance}
                    onChange={(e) => setFormState({ ...formState, distance: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Gender Preference</label>
                  <select 
                    value={formState.genderPreference}
                    onChange={(e) => setFormState({ ...formState, genderPreference: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Any">Any</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Amenities (comma-split)</label>
                  <input 
                    type="text"
                    placeholder="Wi-Fi, AC, Geyser"
                    value={formState.amenities}
                    onChange={(e) => setFormState({ ...formState, amenities: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Roommate Toggle */}
              <div className="border border-slate-200 rounded-xl p-4 dark:border-slate-850 space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold select-none cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={formState.roommateNeeded}
                    onChange={(e) => setFormState({ ...formState, roommateNeeded: e.target.checked })}
                    className="rounded text-emerald-500 focus:ring-emerald-500 h-4 w-4"
                  />
                  I want to list a Roommate Match profile too
                </label>
                {formState.roommateNeeded && (
                  <textarea 
                    rows="2"
                    placeholder="Describe roommate habits (e.g. non-smoker, veg preference, study times)..."
                    value={formState.roommateDetails}
                    onChange={(e) => setFormState({ ...formState, roommateDetails: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none mt-2"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Location Address</label>
                <input 
                  type="text" required
                  placeholder="e.g. Lane 4, Kondhwa Road"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Photos (optional, up to 5)</label>
                <ImageUploader
                  multiple
                  max={5}
                  images={formState.images || []}
                  onChange={(arr) => setFormState({ ...formState, images: arr })}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Publish Accommodation"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <CardHeaderPlaceholder category={selectedList.type} title={selectedList.title} image={selectedList.images?.[0]} seedKey={selectedList._id} />
              <button 
                onClick={() => setSelectedList(null)} 
                className="absolute top-4 right-4 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-emerald-500 uppercase">{selectedList.type}</span>
                  <h3 className="text-xl font-bold mt-1">{selectedList.title}</h3>
                </div>
                {selectedList.owner === currentUser?.id && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(selectedList)}
                      className="rounded-lg p-2 border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      title="Edit Accommodation"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedList._id)}
                      className="rounded-lg p-2 border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                      title="Delete Accommodation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-2xl font-extrabold text-emerald-500">₹{selectedList.rent}/month</p>

              <div className="flex gap-4 items-center text-xs text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">Distance: {selectedList.distance} km</span>
                <span className="bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">Gender: {selectedList.genderPreference}</span>
                <span className="bg-slate-100 px-2 py-1 rounded dark:bg-slate-800">Occupancy: {selectedList.occupancy}</span>
              </div>

              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-400">Amenities</h4>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {selectedList.amenities?.map((am, i) => (
                    <span key={i} className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">{am}</span>
                  ))}
                </div>
              </div>

              {selectedList.roommateProfile?.needed && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 dark:bg-orange-950/10 dark:border-orange-900/40">
                  <h4 className="text-xs uppercase font-semibold text-orange-700 dark:text-orange-400">Roommate Matching Profile</h4>
                  <p className="text-xs text-slate-650 dark:text-slate-350 mt-1">{selectedList.roommateProfile.details}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                <span className="block text-xs text-slate-405">Listed By Student</span>
                <span className="font-semibold text-sm">{selectedList.ownerName}</span>
                <p className="text-xs text-slate-500 mt-1 font-medium">Contact Details: {selectedList.ownerContact}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 5. PYQS & RESOURCES
function Resources({ token, currentUser, resources, refreshData }) {
  const [filters, setFilters] = useState({ department: '', semester: '', subject: '', search: '' });
  const [showUpload, setShowUpload] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState({ title: '', description: '', department: 'Computer', year: '1st Year', semester: 'Semester 1', subject: '', filePath: '' });
  const [selectedRes, setSelectedRes] = useState(null);
  
  // Rating states
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormState({ title: '', description: '', department: 'Computer', year: '1st Year', semester: 'Semester 1', subject: '', filePath: '', file: null });
    setShowUpload(true);
  };

  const handleOpenEdit = (res) => {
    setIsEditMode(true);
    setFormState({ 
      id: res._id,
      title: res.title, 
      description: res.description, 
      department: res.department, 
      year: res.year, 
      semester: res.semester, 
      subject: res.subject, 
      filePath: res.filePath,
      file: null
    });
    setSelectedRes(null);
    setShowUpload(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', formState.title);
      formData.append('description', formState.description);
      formData.append('department', formState.department);
      formData.append('year', formState.year);
      formData.append('semester', formState.semester);
      formData.append('subject', formState.subject);
      if (formState.file) {
        formData.append('document', formState.file);
      } else if (formState.filePath) {
        formData.append('filePath', formState.filePath);
      }

      const res = await fetch(isEditMode ? `${API_BASE}/resources/${formState.id}` : `${API_BASE}/resources`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        setShowUpload(false);
        setFormState({ title: '', description: '', department: 'Computer', year: '1st Year', semester: 'Semester 1', subject: '', filePath: '', file: null });
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownload = async (id, filePath) => {
    try {
      const res = await fetch(`${API_BASE}/resources/${id}/download`, { method: 'POST' });
      if (res.ok) {
        refreshData();
        alert(`Downloading syllabus resource: ${filePath}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/resources/${selectedRes._id}/review`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, text: reviewText })
      });
      if (res.ok) {
        setReviewText('');
        const updatedRes = await res.json();
        setSelectedRes(updatedRes);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this study resource?")) return;
    try {
      const res = await fetch(`${API_BASE}/resources/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedRes(null);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredResources = resources.filter(r => {
    const matchesBranch = !filters.department || r.department.toLowerCase() === filters.department.toLowerCase();
    const matchesSem = !filters.semester || r.semester === filters.semester;
    const matchesSearch = !filters.search || 
      r.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      r.subject.toLowerCase().includes(filters.search.toLowerCase());
    return matchesBranch && matchesSem && matchesSearch;
  });

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-8 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">PYQs & Notes Repository</h2>
            <p className="text-slate-500 text-sm">Download syllabus notes, lab sheets, and exam papers.</p>
          </div>
          <button 
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-md self-start"
          >
            <Plus className="h-4 w-4" /> Upload Document
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search subjects, topics..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 outline-none"
            />
          </div>
          <select 
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none"
          >
            <option value="">All Branches</option>
            <option value="Computer">Computer</option>
            <option value="IT">IT</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Electronics">Electronics</option>
            <option value="Chemical">Chemical</option>
          </select>
        </div>

        {/* Resources list */}
        <div className="space-y-4">
          {filteredResources.map(r => (
            <div 
              key={r._id}
              onClick={() => setSelectedRes(r)}
              className="flex items-center justify-between border border-slate-200 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{r.department} Dept • {r.semester}</span>
                <h3 className="font-bold text-slate-850 dark:text-white text-sm">{r.title}</h3>
                <p className="text-xs text-slate-400">{r.subject} • {r.downloads} downloads</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center text-yellow-500 gap-1 text-xs">
                  <Star className="h-4 w-4 fill-current" /> {r.avgRating || 'Unrated'}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDownload(r._id, r.filePath); }}
                  className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 transition-colors"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isEditMode ? "Edit Study Resource" : "Upload Study Resource"}</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-slate-650"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Document Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Mechanical Unit 2 Notes"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Department</label>
                  <select 
                    value={formState.department}
                    onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Computer">Computer</option>
                    <option value="IT">IT</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Chemical">Chemical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Semester</label>
                  <select 
                    value={formState.semester}
                    onChange={(e) => setFormState({ ...formState, semester: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Semester 1">Semester 1</option>
                    <option value="Semester 2">Semester 2</option>
                    <option value="Semester 3">Semester 3</option>
                    <option value="Semester 4">Semester 4</option>
                    <option value="Semester 5">Semester 5</option>
                    <option value="Semester 6">Semester 6</option>
                    <option value="Semester 7">Semester 7</option>
                    <option value="Semester 8">Semester 8</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Subject Name</label>
                <input 
                  type="text" required
                  placeholder="e.g. Thermodynamics"
                  value={formState.subject}
                  onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Upload Document</label>
                <input 
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFormState({ ...formState, file: e.target.files[0] })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-400">Upload a PDF file to store in the resource library.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Description</label>
                <textarea 
                  rows="2"
                  placeholder="Briefly summarize syllabus coverage or unit topics..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Upload Resource"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Review details modal */}
      {selectedRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-semibold text-emerald-500 uppercase">{selectedRes.department} Dept</span>
                <h3 className="font-bold text-lg">{selectedRes.title}</h3>
              </div>
              <div className="flex gap-2">
                {selectedRes.contributor === currentUser?.id && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(selectedRes)}
                      className="rounded-lg p-2 border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      title="Edit Document"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedRes._id)}
                      className="rounded-lg p-2 border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                      title="Delete Document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <button onClick={() => setSelectedRes(null)} className="text-slate-400 hover:text-slate-650"><X className="h-5 w-5" /></button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-405">Description</h4>
                <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed mt-1">{selectedRes.description || 'No description provided.'}</p>
              </div>

              {/* Add review form */}
              <form onSubmit={submitReview} className="border border-slate-100 rounded-xl p-4 dark:border-slate-800 space-y-3 bg-slate-50 dark:bg-slate-800/20">
                <span className="block text-xs uppercase font-bold text-slate-500">Add Rating & Review</span>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(st => (
                    <button 
                      type="button" key={st} 
                      onClick={() => setRating(st)}
                      className="text-yellow-500 focus:outline-none"
                    >
                      <Star className={`h-5 w-5 ${rating >= st ? 'fill-current' : 'stroke-current fill-none'}`} />
                    </button>
                  ))}
                </div>
                <input 
                  type="text" required
                  placeholder="Describe your review (e.g. helpful for exams)..."
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-855 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
                <button type="submit" className="rounded bg-emerald-500 px-3 py-1.5 text-xs text-white hover:bg-emerald-600 transition-colors font-semibold">Submit Review</button>
              </form>

              {/* Reviews List */}
              <div className="space-y-3">
                <h4 className="text-xs uppercase font-semibold text-slate-400">Reviews ({selectedRes.reviews?.length || 0})</h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto">
                  {selectedRes.reviews?.map((rv, idx) => (
                    <div key={idx} className="border-b border-slate-100 pb-2 text-xs dark:border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{rv.userName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(rv.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-500">{rv.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. LOST & FOUND PORTAL
function LostFound({ token, currentUser, items, refreshData }) {
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formState, setFormState] = useState({ title: '', description: '', type: 'Lost', location: '', date: '', image: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [claimMessage, setClaimMessage] = useState('');

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormState({ title: '', description: '', type: 'Lost', location: '', date: '', image: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setIsEditMode(true);
    setFormState({ 
      id: item._id,
      title: item.title, 
      description: item.description, 
      type: item.type, 
      location: item.location, 
      date: item.date, 
      image: item.image 
    });
    setSelectedItem(null);
    setShowModal(true);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const { id, ...payload } = formState;
      const res = await fetch(isEditMode ? `${API_BASE}/lostfound/${id}` : `${API_BASE}/lostfound`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/lostfound/${selectedItem._id}/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: claimMessage })
      });
      if (res.ok) {
        setClaimMessage('');
        setSelectedItem(null);
        refreshData();
        alert("Claim request sent to reporter.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimApproval = async (itemId, claimIdx, action) => {
    try {
      const res = await fetch(`${API_BASE}/lostfound/${itemId}/claim/${claimIdx}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        refreshData();
        setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (itemId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/lostfound/${itemId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        refreshData();
        setSelectedItem(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API_BASE}/lostfound/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setSelectedItem(null);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesType = !filters.type || item.type.toLowerCase() === filters.type.toLowerCase();
    const matchesStatus = !filters.status || item.status.toLowerCase() === filters.status.toLowerCase();
    const matchesSearch = !filters.search || 
      item.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      item.location.toLowerCase().includes(filters.search.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lost & Found Portal</h2>
          <p className="text-slate-500 text-sm">Report lost products or claim found keys, wallets, cards.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-md self-start"
        >
          <Plus className="h-4 w-4" /> Report Lost/Found
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search items, locations..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 outline-none"
          />
        </div>
        <select 
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none"
        >
          <option value="">All Types</option>
          <option value="Lost">Lost</option>
          <option value="Found">Found</option>
        </select>
        <select 
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Lost">Lost</option>
          <option value="Found">Found</option>
          <option value="Claimed">Claimed</option>
          <option value="Verified">Verified</option>
          <option value="Returned">Returned</option>
        </select>
      </div>

      {/* Grid items */}
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredItems.map(item => (
          <div 
            key={item._id}
            onClick={() => setSelectedItem(item)}
            className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900"
          >
            {/* SVG placeholder instead of side images */}
            <CardHeaderPlaceholder category={item.type} title={item.title} image={item.image} seedKey={item._id} />
            <div className="p-4 space-y-2">
              <h3 className="font-bold text-sm text-slate-850 dark:text-white line-clamp-1">{item.title}</h3>
              <p className="flex items-center text-[10px] text-slate-400 gap-1"><MapPin className="h-3.5 w-3.5" /> {item.location} • {item.date}</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800 mt-2">
                <span className="text-[10px] text-slate-400">By {item.reporterName}</span>
                <span className="text-[10px] font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-655 dark:bg-slate-800 dark:text-slate-350">{item.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Report modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isEditMode ? "Edit Report" : "Report Item"}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-650"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Item Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Noise Smartwatch Black Color"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Type</label>
                  <select 
                    value={formState.type}
                    onChange={(e) => setFormState({ ...formState, type: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Lost">Lost</option>
                    <option value="Found">Found</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Date of Incident</label>
                  <input 
                    type="date" required
                    value={formState.date}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Location</label>
                <input 
                  type="text" required
                  placeholder="e.g. Canteen block A / Classroom 302"
                  value={formState.location}
                  onChange={(e) => setFormState({ ...formState, location: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Description</label>
                <textarea 
                  rows="2"
                  placeholder="Describe unique details..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Photo (optional)</label>
                <ImageUploader
                  images={formState.image ? [formState.image] : []}
                  onChange={(arr) => setFormState({ ...formState, image: arr[0] || '' })}
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Publish Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <CardHeaderPlaceholder category={selectedItem.type} title={selectedItem.title} image={selectedItem.image} seedKey={selectedItem._id} />
              <button 
                onClick={() => setSelectedItem(null)} 
                className="absolute top-4 right-4 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-emerald-500 uppercase">{selectedItem.type} Item</span>
                  <h3 className="text-xl font-bold mt-1">{selectedItem.title}</h3>
                  <p className="text-xs text-slate-400 mt-2">Reporter: {selectedItem.reporterName} • Contact: {selectedItem.reporterContact || 'Not available'}</p>
                </div>
                {selectedItem.reporter === currentUser?.id && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(selectedItem)}
                      className="rounded-lg p-2 border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      title="Edit Report"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedItem._id)}
                      className="rounded-lg p-2 border border-red-200 text-red-655 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                      title="Delete Report"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedItem.location} • Reported: {selectedItem.date}</p>

              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-404">Description</h4>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mt-1">{selectedItem.description || 'No description provided.'}</p>
              </div>

              {selectedItem.reporter === currentUser?.id ? (
                <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <h4 className="text-xs uppercase font-semibold text-slate-404">Claim Requests ({selectedItem.claimRequests?.length || 0})</h4>
                  <div className="space-y-3">
                    {selectedItem.claimRequests?.map((claim, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-3 text-xs dark:border-slate-800 space-y-2 bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">{claim.userName} ({claim.contact})</span>
                          {claim.isApproved ? (
                            <span className="font-bold text-emerald-500">Approved</span>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handleClaimApproval(selectedItem._id, idx, 'approve')} className="text-emerald-500 hover:underline">Approve</button>
                              <button onClick={() => handleClaimApproval(selectedItem._id, idx, 'reject')} className="text-red-500 hover:underline">Reject</button>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-500"><b>Verification:</b> {claim.message}</p>
                      </div>
                    ))}
                  </div>

                  {selectedItem.status !== 'Returned' && (
                    <button 
                      onClick={() => updateStatus(selectedItem._id, 'Returned')}
                      className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs text-white hover:bg-emerald-600 transition-colors font-semibold"
                    >
                      Mark as Returned to Owner
                    </button>
                  )}
                </div>
              ) : (
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <form onSubmit={submitClaim} className="space-y-3">
                    <span className="block text-xs uppercase font-bold text-slate-550">Claim this Item</span>
                    <p className="text-[10px] text-slate-400">Describe unique marks, contents, or proofs of ownership to check.</p>
                    <input 
                      type="text" required
                      placeholder="e.g. My keys have a red keytag and a tiny copper ring..."
                      value={claimMessage}
                      onChange={(e) => setClaimMessage(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs dark:border-slate-850 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                    />
                    <button type="submit" className="w-full rounded bg-emerald-500 py-2 text-xs text-white hover:bg-emerald-600 transition-colors font-semibold">Submit Claim Request</button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 7. NEW COLLEGE CLUBS MODULE
function Clubs({ token, currentUser, posts, refreshData }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filters, setFilters] = useState({ category: '', search: '' });
  const [formState, setFormState] = useState({ clubName: '', title: '', description: '', category: 'Technical', openPositions: '', requirements: '', activities: '', contact: '' });

  const handleOpenAdd = () => {
    setIsEditMode(false);
    setFormState({ clubName: '', title: '', description: '', category: 'Technical', openPositions: '', requirements: '', activities: '', contact: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (post) => {
    setIsEditMode(true);
    setFormState({
      id: post._id,
      clubName: post.clubName,
      title: post.title,
      description: post.description,
      category: post.category,
      openPositions: post.openPositions?.join(', ') || '',
      requirements: post.requirements || '',
      activities: post.activities || '',
      contact: post.contact || ''
    });
    setSelectedPost(null);
    setShowForm(true);
  };

  const handlePost = async (e) => {
    e.preventDefault();
    try {
      const positionsArr = formState.openPositions.split(',').map(s => s.trim()).filter(s => s.length > 0);
      const payload = {
        ...formState,
        openPositions: positionsArr
      };

      const res = await fetch(isEditMode ? `${API_BASE}/clubs/${formState.id}` : `${API_BASE}/clubs`, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowForm(false);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this club post?")) return;
    try {
      const res = await fetch(`${API_BASE}/clubs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedPost(null);
        refreshData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesCategory = !filters.category || post.category.toLowerCase() === filters.category.toLowerCase();
    const matchesSearch = !filters.search || 
      post.clubName.toLowerCase().includes(filters.search.toLowerCase()) || 
      post.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      post.description.toLowerCase().includes(filters.search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">College Clubs & Recruitment</h2>
          <p className="text-slate-500 text-sm">Explore campus sports, technical, and extra-curricular recruitments.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors shadow-md self-start"
        >
          <Plus className="h-4 w-4" /> Create Club Post
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search clubs, positions..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm dark:border-slate-800 dark:bg-slate-900 focus:border-emerald-500 outline-none"
          />
        </div>
        <select 
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-sm dark:border-slate-800 dark:bg-slate-900 outline-none"
        >
          <option value="">All Categories</option>
          <option value="Technical">Technical</option>
          <option value="Sports">Sports</option>
          <option value="Extra-curricular">Extra-curricular (EC)</option>
          <option value="VC">VishwaConclave (VC)</option>                   
        </select>
      </div>

      {/* Clubs Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPosts.map(post => (
          <div 
            key={post._id}
            onClick={() => setSelectedPost(post)}
            className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
          >
            <div>
              <CardHeaderPlaceholder category={post.category} title={post.clubName} />
              <div className="p-5 space-y-3">
                <h3 className="font-extrabold text-sm text-slate-850 dark:text-white line-clamp-1 group-hover:text-emerald-500 transition-colors">{post.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{post.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Users className="h-4 w-4 text-emerald-500" />
                    <span>{post.members || "Growing"} active members</span>
                  </div>

                  {post.activities && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {post.activities}
                    </p>
                  )}
                </div>
                
                {post.openPositions?.length > 0 && (
                  
                  
                  <div className="space-y-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-400">Open Positions:</span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {post.openPositions.slice(0, 3).map((pos, idx) => (
                        <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium text-slate-655 dark:text-slate-350">{pos}</span>
                      ))}
                      {post.openPositions.length > 3 && <span className="text-[9px] text-slate-400">+{post.openPositions.length - 3} more</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>By {post.creatorName}</span>
              <span className="font-semibold text-emerald-500 group-hover:translate-x-0.5 transition-transform inline-flex items-center">View recruitment <ChevronRight className="h-3.5 w-3.5 ml-0.5" /></span>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{isEditMode ? "Edit Club Post" : "Create Club Post"}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-650"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handlePost} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Club Name</label>
                  <input 
                    type="text" required
                    placeholder="e.g. VIT Robotics Club"
                    value={formState.clubName}
                    onChange={(e) => setFormState({ ...formState, clubName: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Category</label>
                  <select 
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Sports">Sports</option>
                    <option value="Extra-curricular">Extra-curricular</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Post Title</label>
                <input 
                  type="text" required
                  placeholder="e.g. Recruitments 2026 - Open Positions"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Open Positions (comma-separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. Web Developer, Designer, PR Lead"
                  value={formState.openPositions}
                  onChange={(e) => setFormState({ ...formState, openPositions: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Description / Activities</label>
                <textarea 
                  rows="2" required
                  placeholder="Describe club activities and project goals..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Requirements</label>
                  <input 
                    type="text"
                    placeholder="e.g. Prerequisite: basic JavaScript knowledge"
                    value={formState.requirements}
                    onChange={(e) => setFormState({ ...formState, requirements: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Contact / Form Link</label>
                  <input 
                    type="text" required
                    placeholder="e.g. forms.gle/abc or email address"
                    value={formState.contact}
                    onChange={(e) => setFormState({ ...formState, contact: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
              >
                {isEditMode ? "Save Changes" : "Publish Post"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="relative">
              <CardHeaderPlaceholder category={selectedPost.category} title={selectedPost.clubName} />
              <button 
                onClick={() => setSelectedPost(null)} 
                className="absolute top-4 right-4 bg-black/40 text-white rounded-full p-1.5 hover:bg-black/60 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-emerald-500 uppercase">{selectedPost.category} Club</span>
                  <h3 className="text-xl font-bold mt-1">{selectedPost.title}</h3>
                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <Users className="h-4 w-4 text-emerald-500" />
                    {selectedPost.members || "Growing"} active members
                  </p>
                </div>
                {selectedPost.creator === currentUser?.id && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleOpenEdit(selectedPost)}
                      className="rounded-lg p-2 border border-slate-200 text-slate-650 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                      title="Edit Post"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedPost._id)}
                      className="rounded-lg p-2 border border-red-200 text-red-650 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/20"
                      title="Delete Post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-xs uppercase font-semibold text-slate-400">Description & Activities</h4>
                <p className="text-sm text-slate-655 dark:text-slate-350 mt-1 leading-relaxed">{selectedPost.description}</p>
              </div>

              {selectedPost.openPositions?.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-semibold text-slate-400 mb-1.5">Open Positions</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.openPositions.map((pos, idx) => (
                      <span key={idx} className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 font-semibold">{pos}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPost.requirements && (
                <div>
                  <h4 className="text-xs uppercase font-semibold text-slate-400">Requirements</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-350 mt-1">{selectedPost.requirements}</p>
                </div>
              )}

              <div className="border-t border-slate-100 pt-4 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="block text-slate-400">Posted By Student</span>
                  <span className="font-bold">{selectedPost.creatorName}</span>
                </div>
                <div>
                  <span className="block text-slate-400">Application Info</span>
                  <span className="font-bold text-emerald-500">{selectedPost.contact}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => window.open(`mailto:${selectedPost.contact}`)}
                  className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
                >
                  Apply to Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 8. PROFILE PAGE
function Profile({ token, currentUser, fetchProfile }) {
  const [formData, setFormData] = useState({ name: '', branch: '', year: '', status: '', contact: '', profilePic: '' });
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        branch: currentUser.branch || '',
        year: currentUser.year || '',
        status: currentUser.status || 'Day Scholar',
        contact: currentUser.contact || '',
        profilePic: currentUser.profilePic || ''
      });
    }
  }, [currentUser]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setEditSuccess(true);
        fetchProfile();
        setTimeout(() => setEditSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-emerald-500 shrink-0">
          <img src={formData.profilePic || DEFAULT_AVATAR} alt="Profile avatar" className="h-full w-full object-cover" />
        </div>
        <div>
          <h3 className="font-bold text-lg">{currentUser?.name}</h3>
          <p className="text-xs text-slate-400">{currentUser?.email} • {currentUser?.branch}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        {editSuccess && (
          <div className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900">
            Profile updated successfully.
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Profile Picture URL</label>
          <input 
            type="text"
            placeholder="Link to custom avatar, or leave blank for default avatar"
            value={formData.profilePic}
            onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Full Name</label>
            <input 
              type="text" required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Phone Number</label>
            <input 
              type="text"
              placeholder="+91 XXXXX XXXXX"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Branch</label>
            <input 
              type="text"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Year</label>
            <select 
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
            >
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800 dark:bg-slate-950 outline-none"
            >
              <option value="Hostel">Hostel</option>
              <option value="Day Scholar">Day Scholar</option>
            </select>
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-600 transition-colors"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}
