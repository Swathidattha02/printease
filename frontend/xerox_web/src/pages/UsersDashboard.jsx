import React, { useEffect, useState, useRef, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const UsersDashboard = () => {
  const { user: authUser, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Navigation / Sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form inputs
  const [documentFile, setDocumentFile] = useState(null);
  const [documentDetails, setDocumentDetails] = useState({ name: '', size: 0, pages: 0 });
  const [parsingPages, setParsingPages] = useState(false);

  const [copies, setCopies] = useState(1);
  const [colorMode, setColorMode] = useState('bw'); // 'bw' or 'color'
  const [paperSize, setPaperSize] = useState('A4');
  const [sidedness, setSidedness] = useState('Double Sided (Long Edge)');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  // Payment states
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotName, setPaymentScreenshotName] = useState('');
  const [paymentType, setPaymentType] = useState('razorpay'); // 'razorpay' or 'upi'


  // Order Submission & History states
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  const [orderError, setOrderError] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Helper refs to reset file inputs
  const fileInputRef = useRef(null);
  const screenshotInputRef = useRef(null);

  const pricePerPage = colorMode === 'color' 
    ? (Number(process.env.REACT_APP_PRICE_PER_PAGE_COLOR) || 4.0) 
    : (Number(process.env.REACT_APP_PRICE_PER_PAGE_BW) || 2.0);

  // Load order history and setup fonts/Tailwind config
  useEffect(() => {
    fetchOrdersHistory();

    // Inject Razorpay SDK if not present
    if (!document.getElementById('razorpay-sdk')) {
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

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
  }, []);

  const fetchOrdersHistory = async () => {
    try {
      setLoadingOrders(true);
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/orders/my-orders`);
      const allOrders = res.data || [];
      // Filter out any razorpay orders that have not been successfully paid
      const completedOrders = allOrders.filter(order => {
        return !(order.paymentMethod === 'razorpay' && order.paymentStatus !== 'paid');
      });
      setMyOrders(completedOrders);
    } catch (err) {
      console.error('Fetch orders history error:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDocumentSelect = async (file) => {
    if (!file) return;
    setDocumentFile(file);
    setDocumentDetails({ name: file.name, size: file.size, pages: 0 });
    setParsingPages(true);
    setOrderError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      // Hit the print upload endpoint to parse PDF and extract page counts
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/prints/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setDocumentDetails({
        name: file.name,
        size: file.size,
        pages: res.data.totalPages || 1
      });
    } catch (err) {
      console.error('Failed to parse PDF page count:', err);
      // Fallback: Default to 1 page
      setDocumentDetails({ name: file.name, size: file.size, pages: 1 });
    } finally {
      setParsingPages(false);
    }
  };

  const handleScreenshotSelect = (file) => {
    if (!file) return;
    setPaymentScreenshot(file);
    setPaymentScreenshotName(file.name);
  };

  const clearDocument = (e) => {
    if (e) e.stopPropagation();
    setDocumentFile(null);
    setDocumentDetails({ name: '', size: 0, pages: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearScreenshot = (e) => {
    if (e) e.stopPropagation();
    setPaymentScreenshot(null);
    setPaymentScreenshotName('');
    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
  };

  const resetForm = () => {
    clearDocument();
    clearScreenshot();
    setCopies(1);
    setColorMode('bw');
    setPaperSize('A4');
    setSidedness('Double Sided (Long Edge)');
    setDate('');
    setTime('');
    setPaymentType('razorpay');
    setOrderResult(null);
    setOrderError(null);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!documentFile) {
      setOrderError('Please upload a PDF/Document file first');
      return;
    }
    if (!date || !time) {
      setOrderError('Please specify pick-up date and time');
      return;
    }
    if (paymentType === 'upi' && !paymentScreenshot) {
      setOrderError('Please upload your payment screenshot/receipt to complete the order');
      return;
    }

    setOrderError(null);
    setLoadingSubmit(true);

    if (paymentType === 'razorpay') {
      try {
        // 1. Create the backend order and Razorpay order
        const fd = new FormData();
        fd.append('file', documentFile);
        fd.append('printType', colorMode);
        fd.append('copies', String(copies));
        fd.append('paperSize', paperSize);
        fd.append('pickupTime', `${date} ${time}`);

        const createRes = await axios.post(`${process.env.REACT_APP_API_URL}/orders/razorpay/create`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        const { rzpOrder, order } = createRes.data;

        // 2. Setup and trigger Razorpay Checkout
        const keyId = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_YOUR_KEY_ID_HERE';
        if (keyId.includes('YOUR_KEY_ID')) {
          throw new Error('Razorpay client Key ID is not configured in environment variables.');
        }

        const options = {
          key: keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'XeroxFlow Print Service',
          description: `Order for printing document: ${documentDetails.name}`,
          order_id: rzpOrder.id,
          handler: async function (response) {
            try {
              // Submit verification to backend
              const verifyRes = await axios.post(`${process.env.REACT_APP_API_URL}/orders/razorpay/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              });

              if (verifyRes.data.success) {
                setOrderResult(verifyRes.data.order);
                resetForm();
                fetchOrdersHistory();
              } else {
                setOrderError('Payment verification failed.');
              }
            } catch (verifyErr) {
              console.error('Payment verification error:', verifyErr);
              setOrderError(verifyErr.response?.data?.msg || 'Error verifying your payment. Please contact admin.');
            }
          },
          prefill: {
            name: authUser?.username || '',
            email: authUser?.email || '',
            contact: authUser?.phoneNumber || ''
          },
          theme: {
            color: '#2f3c5b'
          },
          modal: {
            ondismiss: function () {
              setOrderError('Payment checkout was closed.');
              setLoadingSubmit(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error('Razorpay initialization/checkout error:', err);
        const msg = err?.response?.data?.msg || err?.response?.data || err.message || 'Failed to initiate Razorpay checkout';
        setOrderError(msg);
        setLoadingSubmit(false);
      }
    } else {
      // Existing UPI screenshot flow
      try {
        const fd = new FormData();
        fd.append('file', documentFile);
        fd.append('paymentScreenshot', paymentScreenshot);
        fd.append('printType', colorMode);
        fd.append('copies', String(copies));
        fd.append('paperSize', paperSize);
        fd.append('pickupTime', `${date} ${time}`);
        fd.append('paymentMethod', 'upi');

        const res = await axios.post(`${process.env.REACT_APP_API_URL}/orders`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setOrderResult(res.data);
        resetForm();
        fetchOrdersHistory(); // Refresh history list
      } catch (err) {
        console.error('Order submit error:', err);
        const msg = err?.response?.data?.msg || err?.response?.data || err.message || 'Failed to submit order';
        setOrderError(msg);
      } finally {
        setLoadingSubmit(false);
      }
    }
  };

  const getProfileInitials = () => {
    if (authUser && authUser.username) {
      return authUser.username.substring(0, 2).toUpperCase();
    }
    return 'US';
  };

  // Live total estimation
  const calculatedTotal = documentDetails.pages * copies * pricePerPage;

  return (
    <div className="bg-[#f3f4f6] text-slate-800 h-screen flex overflow-hidden font-display">
      
      {/* Desktop Left Sidebar */}
      <aside className="w-64 bg-[#2f3c5b] text-white flex-col hidden md:flex h-full shadow-xl z-20">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-2xl">print</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">XeroxFlow</h1>
            <p className="text-xs text-white/60 font-medium">Customer Center</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white shadow-sm transition-all" href="#">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-semibold">Dashboard</span>
          </a>
          <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-all group" href="#new-request">
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
              <div className="bg-emerald-400 h-1.5 rounded-full w-[15%]" />
            </div>
            <p className="text-[10px] text-white/50">0.1 GB of 5 GB used</p>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-sm transition-colors border border-red-500/20">
            <span className="material-symbols-outlined text-sm">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Slide-over Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-64 bg-[#2f3c5b] text-white flex flex-col p-6 h-full shadow-2xl animate-fade-in-left">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
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
                <span className="material-symbols-outlined">dashboard</span>
                <span className="text-sm font-semibold">Dashboard</span>
              </a>
              <a className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5" href="#new-request" onClick={() => setMobileMenuOpen(false)}>
                <span className="material-symbols-outlined">add_circle</span>
                <span className="text-sm font-medium">New Request</span>
              </a>
            </nav>
            <div className="border-t border-white/10 pt-4 flex flex-col gap-4">
              <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-sm transition-colors border border-red-500/20">
                <span className="material-symbols-outlined text-sm">logout</span>
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-gray-500 hover:text-[#2f3c5b]">
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Welcome back, {authUser ? authUser.username : 'Customer'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#2f3c5b]/10 flex items-center justify-center border border-gray-200">
              <span className="text-sm font-bold text-[#2f3c5b]">{getProfileInitials()}</span>
            </div>
            <div className="hidden sm:block text-sm text-left">
              <p className="font-semibold text-gray-700 leading-tight">{authUser ? authUser.username : 'Customer'}</p>
              <p className="text-xs text-gray-400">Regular Plan</p>
            </div>
          </div>
        </header>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f9fafb]">
          <div className="max-w-6xl mx-auto flex flex-col gap-8">
            
            {/* Success and Error Alerts */}
            {orderError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">error</span>
                <strong>Error:</strong> {orderError}
              </div>
            )}

            {orderResult && (
              <div className="p-5 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-lg text-sm flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-emerald-600">check_circle</span>
                  <strong className="text-base">Order Submitted Successfully!</strong>
                </div>
                <p>Order ID: <span className="font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded">{orderResult._id}</span></p>
                <p className="text-xs text-emerald-600">You can check its printing status in the history log below.</p>
              </div>
            )}

            {/* Steps & Request Form Grid */}
            <div id="new-request" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Form Section */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#2f3c5b]">description</span>
                      New Print Request
                    </h3>
                    <button onClick={resetForm} className="text-sm font-semibold text-[#2f3c5b] hover:text-[#3e4c6e] flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">refresh</span> Reset
                    </button>
                  </div>

                  {/* STEP 1: Upload File */}
                  <div>
                    <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Step 1: Upload PDF/Document</span>
                    
                    {!documentFile ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()} 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <input 
                          ref={fileInputRef} 
                          type="file" 
                          accept=".pdf,.doc,.docx" 
                          className="hidden" 
                          onChange={e => handleDocumentSelect(e.target.files?.[0])} 
                        />
                        <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">cloud_upload</span>
                        <p className="text-sm font-bold text-gray-700">Drag &amp; drop file here or click to select</p>
                        <p className="text-xs text-gray-400 mt-1">Accepts PDF, DOCX up to 50MB</p>
                      </div>
                    ) : (
                      <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-red-50 p-2.5 rounded-lg text-red-500">
                            <span className="material-symbols-outlined text-2xl">picture_as_pdf</span>
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 truncate max-w-[200px] sm:max-w-md">{documentDetails.name}</h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {parsingPages ? 'Analyzing document...' : `${documentDetails.pages} Pages`} • {(documentDetails.size/1024/1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button onClick={clearDocument} className="text-gray-400 hover:text-red-500 p-1">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <span className="inline-block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-2">Step 2: Print Settings</span>
                    </div>

                    {/* Color Mode Toggle */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Color Mode</label>
                      <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200">
                        <button 
                          type="button"
                          onClick={() => setColorMode('bw')} 
                          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${colorMode === 'bw' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                        >
                          Black &amp; White (₹2.00)
                        </button>
                        <button 
                          type="button"
                          onClick={() => setColorMode('color')} 
                          className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all ${colorMode === 'color' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                        >
                          Color (₹4.00)
                        </button>
                      </div>
                    </div>

                    {/* Copies Counter */}
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-gray-700">Copies</label>
                      <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden w-full h-[42px] bg-white">
                        <button 
                          type="button"
                          onClick={() => setCopies(c => Math.max(1, c - 1))} 
                          className="w-12 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-r border-gray-300 text-gray-600"
                        >
                          <span className="material-symbols-outlined text-lg">remove</span>
                        </button>
                        <span className="flex-1 text-center font-bold text-sm text-gray-800">{copies}</span>
                        <button 
                          type="button"
                          onClick={() => setCopies(c => Math.min(100, c + 1))} 
                          className="w-12 h-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-l border-gray-300 text-gray-600"
                        >
                          <span className="material-symbols-outlined text-lg">add</span>
                        </button>
                      </div>
                    </div>

                    {/* Paper Size */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Paper Size</label>
                      <select 
                        value={paperSize} 
                        onChange={e => setPaperSize(e.target.value)} 
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#2f3c5b] focus:border-[#2f3c5b] p-2.5"
                      >
                        <option value="A4">A4 (Standard)</option>
                        <option value="A3">A3 (Poster)</option>
                        <option value="Letter">Letter</option>
                        <option value="Legal">Legal</option>
                      </select>
                    </div>

                    {/* Sidedness */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-gray-700">Sidedness</label>
                      <select 
                        value={sidedness} 
                        onChange={e => setSidedness(e.target.value)} 
                        className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#2f3c5b] focus:border-[#2f3c5b] p-2.5"
                      >
                        <option value="Single Sided">Single Sided</option>
                        <option value="Double Sided (Long Edge)">Double Sided (Long Edge)</option>
                        <option value="Double Sided (Short Edge)">Double Sided (Short Edge)</option>
                      </select>
                    </div>

                    {/* Delivery / Pick-up Date & Time */}
                    <div className="sm:col-span-2 flex flex-col gap-2 mt-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-[#2f3c5b]">schedule</span>
                        Hardcopy Pick-up Delivery Details
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input 
                          value={date} 
                          onChange={e => setDate(e.target.value)} 
                          type="date" 
                          className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#2f3c5b] focus:border-[#2f3c5b] p-2.5" 
                        />
                        <input 
                          value={time} 
                          onChange={e => setTime(e.target.value)} 
                          type="time" 
                          className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-[#2f3c5b] focus:border-[#2f3c5b] p-2.5" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Section (Right Column) */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                  <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">payments</span>
                    Step 3: Payment &amp; Submit
                  </h3>

                  {/* Pricing break-down */}
                  <div className="bg-[#f9fafb] rounded-xl p-4 flex flex-col gap-2 text-sm border border-gray-100">
                    <div className="flex justify-between text-gray-500">
                      <span>Rate per page:</span>
                      <span className="font-semibold text-gray-800">₹{pricePerPage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Pages detected:</span>
                      <span className="font-semibold text-gray-800">{documentDetails.pages}</span>
                    </div>
                    <div className="flex justify-between text-gray-500 text-xs pl-2">
                      <span>Total printable sheets:</span>
                      <span>{documentDetails.pages * copies} pages</span>
                    </div>
                    <div className="h-px bg-gray-200 my-1" />
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="font-bold text-gray-700">Estimated Total:</span>
                      <span className="text-2xl font-black text-[#2f3c5b]">
                        ₹{calculatedTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                   {/* Payment Method Selector */}
                  <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 mt-1">
                    <button 
                      type="button"
                      onClick={() => setPaymentType('razorpay')} 
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${paymentType === 'razorpay' ? 'bg-[#2f3c5b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <span className="material-symbols-outlined text-xs">flash_on</span>
                      Pay Online
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentType('upi')} 
                      className={`flex-1 py-2 text-center rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${paymentType === 'upi' ? 'bg-[#2f3c5b] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      <span className="material-symbols-outlined text-xs">photo_camera</span>
                      Manual UPI QR
                    </button>
                  </div>

                  {paymentType === 'razorpay' ? (
                    <div className="flex flex-col gap-3 py-3 text-center border border-emerald-100 rounded-xl bg-emerald-50/20 p-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
                        <span className="material-symbols-outlined text-lg">verified_user</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Secure Online Checkout</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Pay instantly via UPI, Cards, Netbanking, or Wallets.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* UPI QR Payment */}
                      <div className="flex flex-col items-center text-center p-3 border border-dashed border-gray-200 rounded-xl bg-slate-50/50">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Scan &amp; Pay via UPI QR</p>
                        <div className="w-32 h-32 bg-white border border-gray-200 p-2 rounded-lg flex items-center justify-center shadow-sm">
                          {/* Generates a simple, robust payment QR mockup */}
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=upi://pay?pa=xeroxflow@upi%26pn=XeroxFlow%26am=${calculatedTotal.toFixed(2)}%26cu=INR`} 
                            alt="UPI Payment QR Code" 
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 mt-2 font-medium">Merchant: XeroxFlow System</span>
                      </div>

                      {/* Upload Transaction Screenshot */}
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upload Payment Receipt / Screen</label>
                        
                        {!paymentScreenshot ? (
                          <div 
                            onClick={() => screenshotInputRef.current?.click()} 
                            className="border border-dashed border-gray-300 rounded-xl py-4 px-3 flex flex-col items-center justify-center hover:bg-slate-50 cursor-pointer transition-colors bg-[#f9fafb]"
                          >
                            <input 
                              ref={screenshotInputRef} 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={e => handleScreenshotSelect(e.target.files?.[0])} 
                            />
                            <span className="material-symbols-outlined text-2xl text-gray-400 mb-1">photo_camera</span>
                            <p className="text-[11px] font-semibold text-gray-600">Upload transaction screenshot</p>
                          </div>
                        ) : (
                          <div className="border border-emerald-200 bg-emerald-50/20 rounded-xl py-2 px-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="material-symbols-outlined text-lg text-emerald-600">receipt_long</span>
                              <span className="text-xs font-bold text-gray-700 truncate max-w-[130px]">{paymentScreenshotName}</span>
                            </div>
                            <button onClick={clearScreenshot} className="text-gray-400 hover:text-red-500">
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Submission buttons */}
                  <button 
                    onClick={handleOrderSubmit}
                    disabled={loadingSubmit || parsingPages || !documentFile}
                    className="w-full bg-[#2f3c5b] hover:bg-[#242e46] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#2f3c5b]/15 transition-all mt-2"
                  >
                    {loadingSubmit ? 'Processing...' : (paymentType === 'razorpay' ? 'Pay & Submit Order' : 'Submit Print Request')}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Section 2: Order History List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col gap-6">
              <h3 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#2f3c5b]">history_edu</span>
                Your Print Order Logs
              </h3>

              {loadingOrders ? (
                <div className="text-center py-8 text-gray-400 text-sm flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2f3c5b]" />
                  <span>Loading history...</span>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm flex flex-col items-center gap-3">
                  <span className="material-symbols-outlined text-4xl">feed</span>
                  <p>You haven't submitted any print requests yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm text-gray-500">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 uppercase font-semibold text-[11px] tracking-wider border-b border-gray-200">
                        <th className="px-6 py-3">Order ID</th>
                        <th className="px-6 py-3">Document</th>
                        <th className="px-6 py-3">Configuration</th>
                        <th className="px-6 py-3">Pickup Scheduled</th>
                        <th className="px-6 py-3">Price Paid</th>
                        <th className="px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 border-t border-gray-100">
                      {myOrders.map(order => (
                        <tr key={order._id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4 font-mono text-[11px] text-gray-400">
                            #{order._id.substring(order._id.length - 6).toUpperCase()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-gray-800 truncate max-w-[200px] block">
                              {order.filePath.split(/[\\/]/).pop()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <div className="flex flex-col gap-0.5">
                              <span className="capitalize font-medium text-gray-700">
                                {order.printSettings?.printType === 'color' ? '🌈 Color' : '⚫ B&W'}
                              </span>
                              <span className="text-gray-400">
                                {order.printSettings?.copies} copies • {order.printSettings?.paperSize || 'A4'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-600">
                            {order.printSettings?.pickupTime ? new Date(order.printSettings.pickupTime).toLocaleString() : 'Not Specified'}
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-800">
                            ₹{order.totalCost.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                              order.status === 'printed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                order.status === 'pending' ? 'bg-amber-500' :
                                order.status === 'printed' ? 'bg-blue-500' :
                                'bg-emerald-500'
                              }`} />
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default UsersDashboard;
