import React, { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthContext from '../context/AuthContext';

const Signup = () => {
    const { signup } = useContext(AuthContext);
    const navigate = useNavigate();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState({});

    // Inject Tailwind CDN safely and apply a config after it loads to avoid runtime errors
    useEffect(() => {
        const cfgData = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: '#2d3958',
                        'primary-hover': '#3e4c70',
                        'background-light': '#f6f7f7',
                        'background-dark': '#16181c',
                        'slate-custom': '#646c82',
                    },
                    fontFamily: { display: ['Inter', 'sans-serif'] },
                    borderRadius: { DEFAULT: '0.5rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
                },
            },
        };

        const applyConfig = () => {
            try {
                if (typeof window !== 'undefined' && window.tailwind) {
                    window.tailwind.config = cfgData;
                } else {
                    // store temporarily if tailwind not yet present
                    window.__tailwindConfig = cfgData;
                }
            } catch (e) {
                // fail silently
            }
        };

        // If CDN not present, add it and set config on load
        if (!document.getElementById('tw-cdn')) {
            const s = document.createElement('script');
            s.id = 'tw-cdn';
            s.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
            s.onload = () => {
                // If config was stored earlier, apply it now
                if (window.__tailwindConfig) {
                    try {
                        if (window.tailwind) window.tailwind.config = window.__tailwindConfig;
                    } catch (e) {}
                    delete window.__tailwindConfig;
                } else {
                    applyConfig();
                }
            };
            document.head.appendChild(s);
        } else {
            // CDN present — try to apply immediately
            applyConfig();
        }
    }, []);

    const validate = (values) => {
        const e = {};
        if (!values.fullName || values.fullName.trim().length < 2) e.fullName = 'Enter your name';
        if (!values.email || !values.email.includes('@')) e.email = 'Enter a valid email';
        if (!values.phone || !/^\d{10}$/.test(values.phone)) e.phone = 'Phone must be 10 digits';
        if (!values.password) e.password = 'Password required';
        else {
            if (values.password.length < 7) e.password = 'At least 7 characters';
            if (!/[A-Z]/.test(values.password)) e.password = 'Include uppercase letter';
            if (!/[a-z]/.test(values.password)) e.password = 'Include lowercase letter';
            if (!/[0-9]/.test(values.password)) e.password = 'Include a number';
            if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(values.password)) e.password = 'Include a special character';
        }
        if (values.password !== values.confirmPassword) e.confirmPassword = 'Passwords do not match';
        return e;
    };

    const memoValid = useMemo(() => {
        const errs = validate({ fullName, email, phone, password, confirmPassword });
        return { isValid: Object.keys(errs).length === 0, errs };
    }, [fullName, email, phone, password, confirmPassword]);

    useEffect(() => {
        // keep inline errors updated but avoid setting during render loops
        setErrors(memoValid.errs);
    }, [memoValid.errs]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate({ fullName, email, phone, password, confirmPassword });
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;
        try {
            await signup(fullName, email, password, phone);
            navigate('/login');
        } catch (err) {
            console.error('Signup error:', err);
            // Prefer server-sent message when available
            const serverMsg = err?.response?.data?.msg || err?.response?.data?.message;
            // Handle validation errors array/object
            const validation = err?.response?.data?.errors || err?.response?.data?.validation;
            if (validation && typeof validation === 'object') {
                // try to map validation errors to fields
                const newErrors = {};
                if (Array.isArray(validation)) {
                    validation.forEach(v => {
                        if (v.param) newErrors[v.param] = v.msg || v.message;
                    });
                } else {
                    Object.keys(validation).forEach(k => { newErrors[k] = validation[k]; });
                }
                setErrors(prev => ({ ...prev, ...newErrors }));
            }
            alert(serverMsg || err.message || 'Signup failed');
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-row items-stretch gap-2 lg:gap-0 overflow-hidden bg-gray-50">
            <div className="relative hidden w-1/2 flex-col justify-between p-8 text-white lg:flex lg:w-1/2 xl:w-1/2 min-h-screen" style={{background: 'linear-gradient(135deg, #2f3c5b 0%, #242e46 100%)'}}>
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[#1a233a] opacity-90" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-sm">
                            <svg className="size-6" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">{/* icon */}
                                <path d="M13.8261 17.4264C16.7203 18.1174 20.2244 18.5217 24 18.5217C27.7756 18.5217 31.2797 18.1174 34.1739 17.4264C36.9144 16.7722 39.9967 15.2331 41.3563 14.1648L24.8486 40.6391C24.4571 41.267 23.5429 41.267 23.1514 40.6391L6.64374 14.1648C8.00331 15.2331 11.0856 16.7722 13.8261 17.4264Z" fill="currentColor" />
                                <path clipRule="evenodd" d="M39.998 12.236C39.9944 12.2537 39.9875 12.2845 39.9748 12.3294C39.9436 12.4399 39.8949 12.5741 39.8346 12.7175C39.8168 12.7597 39.7989 12.8007 39.7813 12.8398C38.5103 13.7113 35.9788 14.9393 33.7095 15.4811C30.9875 16.131 27.6413 16.5217 24 16.5217C20.3587 16.5217 17.0125 16.131 14.2905 15.4811C12.0012 14.9346 9.44505 13.6897 8.18538 12.8168C8.17384 12.7925 8.16216 12.767 8.15052 12.7408C8.09919 12.6249 8.05721 12.5114 8.02977 12.411C8.00356 12.3152 8.00039 12.2667 8.00004 12.2612C8.00004 12.261 8 12.2607 8.00004 12.2612C8.00004 12.2359 8.0104 11.9233 8.68485 11.3686C9.34546 10.8254 10.4222 10.2469 11.9291 9.72276C14.9242 8.68098 19.1919 8 24 8C28.8081 8 33.0758 8.68098 36.0709 9.72276C37.5778 10.2469 38.6545 10.8254 39.3151 11.3686C39.9006 11.8501 39.9857 12.1489 39.998 12.236ZM4.95178 15.2312L21.4543 41.6973C22.6288 43.5809 25.3712 43.5809 26.5457 41.6973L43.0534 15.223C43.0709 15.1948 43.0878 15.1662 43.104 15.1371L41.3563 14.1648C43.104 15.1371 43.1038 15.1374 43.104 15.1371L43.1051 15.135L43.1065 15.1325L43.1101 15.1261L43.1199 15.1082C43.1276 15.094 43.1377 15.0754 43.1497 15.0527C43.1738 15.0075 43.2062 14.9455 43.244 14.8701C43.319 14.7208 43.4196 14.511 43.5217 14.2683C43.6901 13.8679 44 13.0689 44 12.2609C44 10.5573 43.003 9.22254 41.8558 8.2791C40.6947 7.32427 39.1354 6.55361 37.385 5.94477C33.8654 4.72057 29.133 4 24 4C18.867 4 14.1346 4.72057 10.615 5.94478C8.86463 6.55361 7.30529 7.32428 6.14419 8.27911C4.99695 9.22255 3.99999 10.5573 3.99999 12.2609C3.99999 13.1275 4.29264 13.9078 4.49321 14.3607C4.60375 14.6102 4.71348 14.8196 4.79687 14.9689C4.83898 15.0444 4.87547 15.1065 4.9035 15.1529C4.91754 15.1762 4.92954 15.1957 4.93916 15.2111L4.94662 15.223L4.95178 15.2312ZM35.9868 18.996L24 38.22L12.0131 18.996C12.4661 19.1391 12.9179 19.2658 13.3617 19.3718C16.4281 20.1039 20.0901 20.5217 24 20.5217C27.9099 20.5217 31.5719 20.1039 34.6383 19.3718C35.082 19.2658 35.5339 19.1391 35.9868 18.996Z" fill="currentColor" fillRule="evenodd" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight">XeroxFlow</h2>
                    </div>
                </div>
                <div className="relative z-10 max-w-lg">
                    <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight">Streamline Your Document Workflow Today</h1>
                    <p className="mb-8 text-lg font-medium text-white/80">Join thousands of companies optimizing their print management with XeroxFlow. Secure, efficient, and reliable.</p>
                    <div className="flex items-center gap-4 text-sm font-medium text-white/90">
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">check_circle</span><span>No credit card required</span></div>
                        <div className="flex items-center gap-2"><span className="material-symbols-outlined text-[20px]">check_circle</span><span>14-day free trial</span></div>
                    </div>
                </div>
                <div className="relative z-10 text-sm text-white/50">© 2024 XeroxFlow Inc. All rights reserved.</div>
                </div>

                <div className="flex w-full flex-col justify-center bg-gray-50 p-6 dark:bg-background-dark lg:w-1/2 xl:w-1/2 min-h-screen">
                <div className="mx-auto flex w-full max-w-md flex-col">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold tracking-tight text-[#121317] dark:text-white">Create your account</h1>
                        <p className="mt-2 text-slate-custom dark:text-gray-400">Get started with XeroxFlow in seconds.</p>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-1">
                            <label className="text-base font-medium leading-normal text-[#121317]" htmlFor="full-name">Full Name</label>
                            <input id="full-name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="form-input flex h-12 w-full rounded-xl border border-[#d7d9e0] bg-white p-[15px] text-base" aria-label="Full name" />
                            {errors.fullName && <div className="field-error">{errors.fullName}</div>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-base font-medium leading-normal text-[#121317]" htmlFor="email">Work Email</label>
                            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-input flex h-12 w-full rounded-xl border border-[#d7d9e0] bg-white p-[15px] text-base" aria-label="Work email" />
                            {errors.email && <div className="field-error">{errors.email}</div>}
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-base font-medium leading-normal text-[#121317]" htmlFor="phone">Phone Number</label>
                            <input id="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))} className="form-input flex h-12 w-full rounded-xl border border-[#d7d9e0] bg-white p-[15px] text-base" aria-label="Phone number" />
                            {errors.phone && <div className="field-error">{errors.phone}</div>}
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div className="flex flex-col gap-1">
                                <label className="text-base font-medium leading-normal text-[#121317]" htmlFor="password">Password</label>
                                <div className="relative">
                                    <input id="password" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="" className="form-input flex h-12 w-full rounded-xl border border-[#d7d9e0] bg-white p-[15px] pr-12 text-base" />
                                    <button type="button" aria-label={showPwd ? 'Hide password' : 'Show password'} onClick={() => setShowPwd(s => !s)} className="absolute inset-y-0 right-3 flex items-center pr-2 text-slate-custom">{showPwd ? 'Hide' : 'Show'}</button>
                                </div>
                                {errors.password && <div className="field-error">{errors.password}</div>}
                            </div>

                            <div className="flex flex-col gap-1">
                                <label className="text-base font-medium leading-normal text-[#121317]" htmlFor="confirm-password">Confirm Password</label>
                                                                <div className="relative">
                                    <input id="confirm-password" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="" className="form-input flex h-12 w-full rounded-xl border border-[#d7d9e0] bg-white p-[15px] pr-12 text-base" />
                                    <button type="button" aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'} onClick={() => setShowConfirm(s => !s)} className="absolute inset-y-0 right-3 flex items-center pr-2 text-slate-custom">{showConfirm ? 'Hide' : 'Show'}</button>
                                </div>
                                {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
                            </div>
                        </div>

                        <p className="text-xs text-slate-custom mt-1">Password must be at least 7 characters and include upper/lower/number/special.</p>

                        {/* Terms checkbox removed per request */}

                        <button
                            className={`mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold text-white shadow-lg ${memoValid.isValid ? 'bg-[#2f3c5b] hover:bg-[#242e46]' : 'bg-[#2f3c5b] opacity-60 cursor-not-allowed'}`}
                            type="submit"
                            disabled={!memoValid.isValid}
                        >
                            Create Account
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-custom">Already have an account? <Link className="font-semibold text-primary" to="/login">Log in</Link></div>
                </div>
            </div>
        </div>
    );
};

export default Signup;
