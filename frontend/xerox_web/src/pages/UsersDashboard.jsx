import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const UsersDashboard = () => {
  const { user: authUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [uploaded, setUploaded] = useState(null);
  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState('Color');
  const [paperSize, setPaperSize] = useState('A4 (Standard)');
  const [sidedness, setSidedness] = useState('Double Sided (Long Edge)');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const fileInputRef = useRef(null);

  const pricePerPage = 2.0; // ₹2.0 per page for copies
  const fileInputKeyRef = useRef(Date.now()); // helper to reset file input

  useEffect(() => {
    // Inject Tailwind CSS configuration if not present
    if (!document.getElementById('tw-cdn-users-dashboard')) {
      const s = document.createElement('script');
      s.id = 'tw-cdn-users-dashboard';
      s.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
      s.onload = () => {
        try {
          window.tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  primary: '#2f3c5b',
                  'primary-hover': '#3e4c6e',
                  'background-light': '#f6f7f7',
                  'background-dark': '#111827',
                },
                fontFamily: { display: ['Inter', 'sans-serif'] },
                borderRadius: { lg: '0.5rem', xl: '0.75rem', '2xl': '1rem' },
              },
            },
          };
        } catch (e) {}
      };
      document.head.appendChild(s);
    }

    // Google Fonts link injections
    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
      const l1 = document.createElement('link');
      l1.rel = 'preconnect';
      l1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(l1);
      const l2 = document.createElement('link');
      l2.rel = 'preconnect';
      l2.crossOrigin = '';
      l2.href = 'https://fonts.gstatic.com';
      document.head.appendChild(l2);
      const l3 = document.createElement('link');
      l3.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
      l3.rel = 'stylesheet';
      document.head.appendChild(l3);
      const l4 = document.createElement('link');
      l4.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      l4.rel = 'stylesheet';
      document.head.appendChild(l4);
    }
  }, []);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = (file) => {
    if (!file) return;
    // mock pages detection for demo/draft upload
    const pages = 8;
    setUploaded({ file, name: file.name, size: file.size, pages });
  };

  const onDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onDragOver = (e) => e.preventDefault();

  const decCopies = () => setCopies(c => Math.max(1, c - 1));
  const incCopies = () => setCopies(c => Math.min(100, c + 1));

  const clearUploadedFile = (e) => {
    if (e) e.stopPropagation();
    setUploaded(null);
    fileInputKeyRef.current = Date.now();
  };

  const resetForm = () => {
    setUploaded(null);
    setCopies(1);
    setColorMode('Color');
    setPaperSize('A4 (Standard)');
    setSidedness('Double Sided (Long Edge)');
    setDate('');
    setTime('');
    setOrderResult(null);
    setOrderError(null);
    fileInputKeyRef.current = Date.now();
  };

  const [loadingPay, setLoadingPay] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);

  const handlePay = async () => {
    if (!uploaded?.file) {
      setOrderError('Please upload a file first');
      return;
    }
    if (!date || !time) {
      setOrderError('Please select a pickup delivery date and time');
      return;
    }
    setOrderError(null);
    setLoadingPay(true);
    try {
      const fd = new FormData();
      fd.append('file', uploaded.file);
      fd.append('printType', colorMode === 'Color' ? 'color' : 'bw');
      fd.append('copies', String(copies));
      fd.append('paperSize', paperSize);
      fd.append('pickupTime', `${date} ${time}`);

      const res = await axios.post('http://localhost:5000/api/orders/draft', fd);
      setOrderResult(res.data);
      setOrderError(null);
    } catch (err) {
      console.error('Order create error', err);
      const msg = err?.response?.data?.msg || err?.response?.data || err.message || 'Order creation failed';
      setOrderError(msg);
    } finally {
      setLoadingPay(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfileInitials = () => {
    if (authUser && authUser.username) {
      return authUser.username.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-gray-100 h-screen flex overflow-hidden font-display">
      
      {/* Desktop Left Sidebar */}
      <aside className="w-64 bg-primary text-white flex-col hidden md:flex h-full shadow-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">print</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">XeroxFlow</h1>
            <p className="text-xs text-white/60 font-medium">Customer Center</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white shadow-sm transition-all" href="#">
            <span className="material-symbols-outlined filled">dashboard</span>
            <span className="text-sm font-semibold">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all group" href="#request-section">
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
            <span className="text-sm font-medium">New Request</span>
          </a>
        </nav>
        <div className="p-4 border-t border-white/10 flex flex-col gap-4">
          <div className="bg-white/5 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-white/80">
              <span className="material-symbols-outlined text-sm">cloud_queue</span>
              <span className="text-xs font-semibold">Storage Used</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-emerald-400 h-1.5 rounded-full w-[25%]" />
            </div>
            <p className="text-[10px] text-white/50">0.2 GB of 5 GB used</p>
          </div>
          <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-sm transition-colors border border-red-500/20">
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Slide-over Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-primary text-white flex flex-col p-6 h-full shadow-2xl animate-fade-in-left">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined">print</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">XeroxFlow</h1>
                  <p className="text-[10px] text-white/60">Customer Center</p>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-white/80 hover:text-white">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-2">
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white" href="#" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-symbols-outlined filled">dashboard</span>
                <span className="text-sm font-semibold">Dashboard</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5" href="#request-section" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-sm font-medium">New Request</span>
              </a>
            </nav>
            <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-sm transition-colors border border-red-500/20">
                <span className="material-symbols-outlined text-sm">logout</span>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Panel */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* Header */}
        <header className="bg-white dark:bg-[#1f2937] border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-6 md:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-primary dark:text-gray-300 dark:hover:text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                Welcome back, {authUser ? authUser.username : 'Customer'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Upload document, set settings, and get prints instantly.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 p-1.5 rounded-lg">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-indigo-900 dark:to-blue-900 flex items-center justify-center border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-bold text-primary dark:text-white">{getProfileInitials()}</span>
              </div>
              <div className="hidden md:block text-sm text-left">
                <p className="font-semibold text-gray-700 dark:text-gray-200 leading-tight">{authUser ? authUser.username : 'Customer'}</p>
                <p className="text-xs text-gray-400">Regular Plan</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#1f2937] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Role</p>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white capitalize">{authUser ? authUser.role : 'Customer'} Account</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span>System Connected</span>
                  </div>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-primary dark:text-indigo-400">
                  <span className="material-symbols-outlined">account_circle</span>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1f2937] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Printing Rate</p>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">₹{pricePerPage.toFixed(2)} / page</h3>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
                    <span className="material-symbols-outlined text-sm">sell</span>
                    <span>Standard Pricing</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <span className="material-symbols-outlined">payments</span>
                </div>
              </div>
            </div>

            {/* Grid for New Requests & Instructions */}
            <div id="request-section" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form & Upload Area */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">New Print Request</h3>
                  <button onClick={resetForm} className="text-sm font-semibold text-primary dark:text-indigo-400 hover:underline flex items-center gap-1">
                    Reset
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>

                {/* Drag and Drop Area */}
                <div 
                  onDrop={onDrop} 
                  onDragOver={onDragOver} 
                  onClick={openFilePicker} 
                  role="button" 
                  tabIndex={0} 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 flex flex-col items-center justify-center bg-white dark:bg-[#1f2937] hover:bg-slate-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer group relative overflow-hidden"
                >
                  <input 
                    key={fileInputKeyRef.current} 
                    ref={fileInputRef} 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    className="hidden" 
                    onChange={e => handleFile(e.target.files?.[0])} 
                  />
                  <span className="material-symbols-outlined text-4xl text-gray-400 group-hover:text-primary dark:group-hover:text-indigo-400 mb-2 transition-colors">cloud_upload</span>
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300 text-center">Drag &amp; drop your file here or click to select</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 50MB</p>
                </div>

                {/* Upload Card and Form Settings */}
                <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                  
                  {/* File information panel */}
                  <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
                    <div className="flex items-start gap-4">
                      <div className="bg-red-50 dark:bg-red-950/40 p-3 rounded-xl flex-shrink-0 text-red-500">
                        <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-base font-bold text-gray-900 dark:text-white truncate">
                          {uploaded?.name || 'Please select a file to print...'}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                            {uploaded ? `${uploaded.pages} Pages` : '0 Pages'}
                          </span>
                          {uploaded && (
                            <span className="text-xs text-gray-400">
                              {(uploaded.size/1024/1024).toFixed(2)} MB
                            </span>
                          )}
                        </div>
                      </div>
                      {uploaded && (
                        <button onClick={clearUploadedFile} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Print settings controls */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="flex items-center justify-between sm:col-span-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">Color Mode</span>
                        <span className="text-xs text-gray-500">Standard printing</span>
                      </div>
                      <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700">
                        <button onClick={() => setColorMode('Color')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${colorMode==='Color' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Color</button>
                        <button onClick={() => setColorMode('B&W')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${colorMode==='B&W' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>B&amp;W</button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">Copies</label>
                      <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden w-fit">
                        <button onClick={decCopies} className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-r border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <input value={copies} readOnly type="text" className="w-12 h-10 text-center text-sm border-none bg-white dark:bg-[#1f2937] focus:ring-0 text-gray-900 dark:text-white font-bold" />
                        <button onClick={incCopies} className="w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-l border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">Paper Size</label>
                      <select value={paperSize} onChange={e => setPaperSize(e.target.value)} className="w-full bg-white dark:bg-[#1f2937] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3">
                        <option>A4 (Standard)</option>
                        <option>A3 (Poster)</option>
                        <option>Letter</option>
                        <option>Legal</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white">Sidedness</label>
                      <select value={sidedness} onChange={e => setSidedness(e.target.value)} className="w-full bg-white dark:bg-[#1f2937] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3">
                        <option>Single Sided</option>
                        <option>Double Sided (Long Edge)</option>
                        <option>Double Sided (Short Edge)</option>
                      </select>
                    </div>

                    {/* Delivery Scheduling */}
                    <div className="sm:col-span-2 flex flex-col gap-3 border-t border-gray-200 dark:border-gray-800 pt-6 mt-2">
                      <label className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-primary dark:text-indigo-400">schedule</span>
                        Hardcopy Pick-up Date &amp; Time
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input value={date} onChange={e => setDate(e.target.value)} type="date" className="w-full bg-white dark:bg-[#1f2937] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3" />
                        <input value={time} onChange={e => setTime(e.target.value)} type="time" className="w-full bg-white dark:bg-[#1f2937] border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-primary focus:border-primary block p-3" />
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="bg-primary/5 dark:bg-primary/20 p-6 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-gray-200 dark:border-gray-800"> 
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Total Cost Estimation</p>
                      <p className="text-3xl font-extrabold text-primary dark:text-white">
                        ₹{( (uploaded?.pages ?? 0) * copies * pricePerPage ).toFixed(2)}
                      </p>
                    </div>
                    <button onClick={handlePay} disabled={loadingPay} className="w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:opacity-60 text-white px-8 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all">
                      {loadingPay ? 'Processing...' : 'Pay & Print'}
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>

                  {/* Message displays */}
                  {orderError && (
                    <div className="m-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium">
                      ⚠️ {orderError}
                    </div>
                  )}

                  {orderResult && (
                    <div className="m-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400 rounded-xl text-sm">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold">Order Draft Created Successfully!</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500">ID: {orderResult._id}</p>
                        </div>
                        <a href="/dashboard" className="text-sm font-bold text-primary dark:text-indigo-400 hover:underline">
                          View History
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions and Steps panel */}
              <div className="flex flex-col gap-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">How it Works</h3>
                <div className="bg-white dark:bg-[#1f2937] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col gap-6">
                  
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-primary dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Upload Document</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select or drag in a PDF or Word document up to 50MB.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-primary dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Configure Settings</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose copy counts, size, and sidedness. Pick up times are configurable.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-primary dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Make Payment</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generate print request and make the payment seamlessly.</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UsersDashboard;
