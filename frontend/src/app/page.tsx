'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  MessageSquare,
  Zap,
  ShieldCheck,
  TrendingUp,
  Mail,
  ChevronDown,
  Users,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Contact Form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSuccess(true);
    setContactName('');
    setContactEmail('');
    setContactMessage('');
    setTimeout(() => setContactSuccess(false), 5000);
  };

  const toggleFaq = (index: number) => {
    setFaqOpen((prev) => (prev === index ? null : index));
  };

  const features = [
    { title: 'Workspace Segregation', desc: 'Secure containerized environment for each small business, holding separate contact lists, sessions, and logs.', icon: ShieldCheck },
    { title: 'Instant WhatsApp Connect', desc: 'Link your business profile number instantly by scanning the native QR code using standard devices.', icon: MessageSquare },
    { title: 'AI Sales Assistant', desc: 'Automatically parse order items, detect client purchasing intents, and draft smart replies.', icon: Zap },
    { title: 'Sales Kanban Board', desc: 'Manage order cards visually from draft to dispatch, automatically updating customer metric totals.', icon: TrendingUp },
  ];

  const pricing = [
    { name: 'Micro Shops', price: '$0', limit: 1000, features: ['1 Workspace Account', '1 Linked Device', '1,000 Messages/Month', 'AI Order Drafts Detection', 'Email Support'] },
    { name: 'Growing Retailers', price: '$29', limit: 10000, features: ['3 Workspace Accounts', '2 Linked Devices', '10,000 Messages/Month', 'Keyword Auto-Replies', 'Automated Customer Birthdays', 'Priority Support'] },
    { name: 'Distributors & Brands', price: '$79', limit: 50000, features: ['10 Workspace Accounts', '5 Linked Devices', '50,000 Messages/Month', 'Catalog PDF Uploads mapping', 'CSV Contact Directory Import/Export', 'Dedicated Account Manager'] },
  ];

  const faqs = [
    { q: 'How does WhatsFlow help my small business?', a: 'WhatsFlow acts as a lightweight WhatsApp CRM. It syncs chats, analyzes client intents automatically, generates order drafts from plain text messages, and saves you time by automating catalog downloads.' },
    { q: 'Do I need a complex WhatsApp API registration?', a: 'No! WhatsFlow connects with your existing WhatsApp Business number directly via scanning the QR code, removing the need for complex API setups or custom templates approvals.' },
    { q: 'Can I import my existing customer list?', a: 'Yes! Small businesses can import their contact lists directly from standard CSV sheets, categorize them by tags (Distributor, Retailer, Support), and track their purchase histories.' },
  ];

  return (
    <div className="bg-neutral-950 text-neutral-100 font-sans min-h-screen">
      
      {/* Header Navbar */}
      <header className="sticky top-0 bg-neutral-950/75 backdrop-blur-md border-b border-neutral-900 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo-dark.svg" alt="WhatsFlow CRM" className="h-9 w-auto" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-400">
            <a href="#features" className="hover:text-neutral-250 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-neutral-250 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-neutral-250 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-neutral-250 transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold hover:text-neutral-250 transition-colors">Sign In</Link>
            <Link href="/signup" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10">Get Started</Link>
          </div>

          {/* Mobile menu trigger */}
          <button className="md:hidden text-neutral-400 hover:text-neutral-200" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 bg-neutral-950 border-b border-neutral-900 space-y-3 flex flex-col text-sm font-semibold text-neutral-400 animate-in slide-in-from-top-4 duration-200">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-200 py-1">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-200 py-1">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-200 py-1">FAQ</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-200 py-1">Contact</a>
            <div className="h-[1px] bg-neutral-900 my-2" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-200 py-1">Sign In</Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-center hover:bg-primary/95 block">Get Started</Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-24">
        {/* Glow vector background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
          <span className="px-3 py-1 rounded-full border border-primary/35 bg-primary/10 text-primary-foreground font-bold text-[10px] uppercase tracking-wider animate-pulse">
            WhatsApp CRM for Small Businesses
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-100 max-w-4xl mx-auto leading-[1.1]">
            Grow Your Small Business with <span className="text-primary-foreground text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">WhatsApp Sales CRM</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Connect your Business number instantly, sync client chat streams, detect orders automatically with AI, track sales value on Kanban boards, and manage long-term customer relationships.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-lg shadow-primary/20">
              Start Free Workspace
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 transition-all font-semibold text-xs text-neutral-350">
              Explore CRM Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Simple & Powerful Features</h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto">No complex APIs or setups required. Designed specifically for retail shops, distributors, and growing brands.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 hover:border-primary/20 transition-all space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary-foreground">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-250 text-sm">{f.title}</h3>
                  <p className="text-neutral-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-neutral-900 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Simple, Transparent Pricing</h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto">Pick a plan matching your CRM list size. Upgrade or downgrade anytime.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricing.map((p, i) => (
              <div key={i} className="p-8 rounded-3xl border border-neutral-900 bg-neutral-900/15 flex flex-col justify-between space-y-8 relative hover:border-primary/15 transition-all">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-neutral-300 capitalize">{p.name}</h3>
                  <div className="flex items-baseline text-neutral-100">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    <span className="text-xs text-neutral-500 font-semibold ml-1">/mo</span>
                  </div>
                  <div className="h-[1px] bg-neutral-900 my-2" />
                  <ul className="space-y-3 text-xs text-neutral-400">
                    {p.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/signup" className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-primary border border-neutral-800 hover:border-primary text-center text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-primary-foreground transition-all block">
                  Select {p.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-neutral-900">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Frequently Asked Questions</h2>
            <p className="text-sm text-neutral-400">Got questions about the WhatsApp SaaS system? We have answers.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = faqOpen === i;
              return (
                <div key={i} className="border border-neutral-900 rounded-xl overflow-hidden bg-neutral-900/5">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left text-xs font-semibold text-neutral-300 hover:bg-neutral-900/10 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-neutral-900/50 pt-2 bg-neutral-900/10">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 border-t border-neutral-900 bg-neutral-950/40">
        <div className="max-w-xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Get in Touch</h2>
            <p className="text-sm text-neutral-400">Have questions about enterprise integrations or API limits?</p>
          </div>

          {contactSuccess ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8" />
              <span className="font-bold">Thank you! Your message was submitted successfully. Our team will contact you shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4 p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 backdrop-blur">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5">Message / Requirements</label>
                <textarea
                  rows={4}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder="Describe your requirements..."
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
              >
                Submit Form
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-900/60 bg-neutral-950/50 flex flex-col items-center justify-center gap-4 text-center text-xs text-neutral-500">
        <img src="/logo-dark.svg" alt="WhatsFlow CRM" className="h-8 w-auto opacity-70" />
        <p>&copy; {new Date().getFullYear()} WhatsFlow CRM - WhatsApp Sales Assistant Module. All rights reserved.</p>
      </footer>

    </div>
  );
}
