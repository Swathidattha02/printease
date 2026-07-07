import React, { useEffect } from 'react';

const Landing = () => {
  useEffect(() => {
    // inject Google fonts (if not already present)
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
      l3.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap';
      l3.rel = 'stylesheet';
      document.head.appendChild(l3);
      const l4 = document.createElement('link');
      l4.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap';
      l4.rel = 'stylesheet';
      document.head.appendChild(l4);
    }

    // safe tailwind injection: store config and set after CDN loads
    const cfg = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            primary: '#2f3c5b',
            'primary-hover': '#242e46',
            'background-light': '#f6f7f7',
            'background-dark': '#16181c',
            'surface-light': '#ffffff',
            'surface-dark': '#23262d',
          },
          fontFamily: { display: ['Inter', 'sans-serif'], body: ['Inter', 'sans-serif'] },
          borderRadius: { DEFAULT: '0.5rem', lg: '1rem', xl: '1.5rem', full: '9999px' },
        },
      },
    };

    const applyConfig = () => {
      try {
        if (window.tailwind) window.tailwind.config = cfg;
        else window.__tailwindConfig = cfg;
      } catch (e) {}
    };

    if (!document.getElementById('tw-cdn-landing')) {
      const s = document.createElement('script');
      s.id = 'tw-cdn-landing';
      s.src = 'https://cdn.tailwindcss.com?plugins=forms,container-queries';
      s.onload = () => {
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
      applyConfig();
    }
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden font-display bg-background-light text-[#121317] dark:bg-background-dark dark:text-gray-100">

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto w-full px-4">
        <section className="relative px-4 py-16 md:py-24 max-w-[1280px] mx-auto">
          <div className="max-w-[1120px] mx-auto w-full">
            <div className="flex flex-col-reverse lg:flex-row items-center gap-12 lg:gap-20">
              <div className="flex flex-col gap-6 lg:w-1/2 items-start text-left">
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight text-slate-900 dark:text-white">Streamline Your <span className="text-primary dark:text-blue-400">Xerox Fleet</span> in One Flow.</h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-[540px]">Centralized management, automated supply ordering, and real-time analytics for modern enterprises. Stop managing printers, start managing flow.</p>
                <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400 mt-2">
                  
                  
                </div>
              </div>

              <div className="w-full lg:w-1/2 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark aspect-[4/3] md:aspect-video flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATXa9NUnRNePKOe0KTiHrVBUzpbr4s1FqP37JkMUeKMFJER-jRGBBTbzQ2X-k6BXfmwpQ_9DpDAi3dsX4wNo2KdlZJol8SkSvcDVcvdcBcnqPiJMBPYVoSDQzNZBDTn8xDnd0dbofl09pR6cSQv-eQPCxw5GEohPolRWPw57BnJStfVf7R_Moh-IrXlg31mVGvQprC9JKszUU5j19N8b4OkuoHRkPkzuJczEkVoQwK2VEW8xsusLlVB2gs1oCg1Zmirl4bogg2k-bV')" }}>
                  <div className="absolute inset-0 bg-primary/10 mix-blend-multiply" />
                </div>
              </div>
            </div>
          </div>
        </section>

       
        <section className="py-20 px-4 max-w-[1280px] mx-auto">
          <div className="flex flex-col items-center gap-4 text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white max-w-[700px]">Everything you need to optimize your document workflow</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-[600px]">XeroxFlow connects your entire fleet into a single, manageable stream of data and control.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group p-8 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Real-time Monitoring</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Track device status instantly across your entire organization without delays. Know what's happening before your users do.</p>
            </div>
            <div className="group p-8 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Cost Allocation</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Precise billing and department tracking to manage your budget effectively. Drill down to individual user usage.</p>
            </div>
            <div className="group p-8 rounded-2xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Smart Alerts</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Predictive maintenance notifications to prevent downtime before it happens. Automated supply reordering included.</p>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white dark:bg-surface-dark/50 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-[1280px] mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-24">
              <div className="w-full md:w-1/2">
                <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="bg-gray-100 dark:bg-gray-800 aspect-video bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPIsiFKHlmaI5BjTkR3VPbBV05QxDsk3HC1MNcP9t3lDSIqNmEp5aOU6_P-pcYGPiaruqRP8yBGK_RARa3TB15lBKqu2r2CHtYSWJEG3F-3ib8RFsw607PRSBhWxE9h3l6_TbVy4vm9JIhVcFpXt0LqPySWBPldnS-WsNiMOCL7FJ5_K12r8zsMkx9OPiiUt-JWx93Ba9o7SV_8AjGkbACfnguiHi6QdTp5khU-_q5A0K88lpLZQB2TiwpA6MvACifSGsLYuPr8kYr')" }} />
                </div>
              </div>
              <div className="w-full md:w-1/2 flex flex-col gap-6">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">Detailed Reporting at Your Fingertips</h3>
                <p className="text-slate-600 dark:text-slate-400 text-lg">Stop guessing where your printing budget goes. XeroxFlow provides granular reports that highlight inefficiencies, identify high-volume users, and suggest optimization strategies automatically.</p>
                <ul className="flex flex-col gap-3">
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><span className="material-symbols-outlined text-green-500">check_circle</span><span>Export to PDF, Excel, or CSV</span></li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><span className="material-symbols-outlined text-green-500">check_circle</span><span>Automated weekly email summaries</span></li>
                  <li className="flex items-center gap-3 text-slate-700 dark:text-slate-300"><span className="material-symbols-outlined text-green-500">check_circle</span><span>Department-level breakdown</span></li>
                </ul>
                <div className="pt-2">
                  <a className="text-primary dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1" href="#">Learn more about analytics <span className="material-symbols-outlined text-sm">arrow_forward</span></a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 text-center">
          <div className="max-w-[700px] mx-auto flex flex-col items-center gap-6">
            <p className="text-lg text-slate-600 dark:text-slate-400">Join 500+ companies that trust XeroxFlow for their document management needs.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <a href="/signup" className="flex items-center justify-center rounded-xl h-12 px-8 bg-primary hover:bg-primary-hover text-white text-base font-bold shadow-lg transition-all">Signup Now</a>

            </div>
          </div>
        </section>
        </div>
      </main>

      <footer className="bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-800 pt-16 pb-8">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2 flex flex-col gap-4 pr-8">
              <div className="flex items-center gap-2 text-primary dark:text-white"><span className="material-symbols-outlined text-[24px]">print</span><span className="text-xl font-bold">XeroxFlow</span></div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[300px]">The leading platform for enterprise document management and fleet optimization. Simplify your workflow today.</p>
            </div>
            <div className="flex flex-col gap-4"><h4 className="font-bold text-slate-900 dark:text-white">Product</h4><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Features</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Integrations</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Pricing</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Changelog</a></div>
            <div className="flex flex-col gap-4"><h4 className="font-bold text-slate-900 dark:text-white">Resources</h4><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Documentation</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">API Reference</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Community</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Help Center</a></div>
            <div className="flex flex-col gap-4"><h4 className="font-bold text-slate-900 dark:text-white">Company</h4><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">About</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Blog</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Careers</a><a className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-blue-400 text-sm" href="#">Legal</a></div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-8 border-t border-gray-100 dark:border-gray-800">
            <p className="text-slate-400 text-sm">© 2023 XeroxFlow Inc. All rights reserved.</p>
            <div className="flex gap-4"><a className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">public</span></a><a className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">rss_feed</span></a><a className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">mail</span></a></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

