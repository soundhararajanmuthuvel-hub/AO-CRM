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
  X,
  Sparkles,
  Layers,
  ArrowRight,
  Workflow
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
    { title: 'Unified Inbox & Chat Sync', desc: 'Sync chats, filter by unread, and execute rapid replies, product cards, or order creation from a single team dashboard.', icon: MessageSquare },
    { title: 'AI-Powered Lead Predictor', desc: 'Automatically classify prospects, compute conversion probabilities, and prioritize hot vs cold leads via Gemini API.', icon: Sparkles },
    { title: 'AI Order Detection', desc: 'Extract items, quantities, and prices from natural customer text (e.g. "Need 10 ABC Malt") to instantly generate order drafts.', icon: Zap },
    { title: 'Automated CRM Triggers', desc: 'Engage customers automatically with no-order alerts (30/60/90 days), festival templates, and birthday greetings.', icon: Workflow },
    { title: 'Sales Pipelines & Visual Kanban', desc: 'Move sales deals through visual pipelines (New, Contacted, Qualified, Won, Lost) while tracking lifetime value and AOV.', icon: TrendingUp },
    { title: 'ERP & Store Sync Connectors', desc: 'Sync customer directories, product lists, and orders with Shopify, WooCommerce, ERPNext, Odoo, and custom REST APIs.', icon: Layers },
  ];

  const pricing = [
    { name: 'Starter Growth', price: '₹1,999', limit: 1000, features: ['1 CRM Workspace', '1 Linked WhatsApp Device', '1,000 Messages/Month', 'AI Order Drafts Detection', 'Standard Customer Profile Timeline', 'Email Support'] },
    { name: 'Professional Growth', price: '₹4,999', limit: 10000, features: ['3 CRM Workspaces', '2 Linked WhatsApp Devices', '10,000 Messages/Month', 'AI Lead Classification & Prediction', 'Keyword Auto-Replies & Triggers', 'Automated Birthday/Festival Greetings', 'Priority Chat Support'] },
    { name: 'Enterprise Connect', price: '₹12,499', limit: 50000, features: ['10 CRM Workspaces', '5 Linked WhatsApp Devices', '50,000 Messages/Month', 'Full Shopify & WooCommerce ERP Sync', 'Custom Field Mappings & scheduled logs', 'PWA Installable Mobile App', 'Dedicated Account Executive'] },
  ];

  const faqs = [
    { q: 'What is Cusman CRM?', a: 'Cusman CRM is an AI-powered Customer Growth Platform by DK\'s Technologies. It connects your WhatsApp Business accounts with a state-of-the-art visual CRM, allowing you to turn conversations into customers, auto-detect orders, run promotional campaigns, and sync data with external ERPs.' },
    { q: 'How does the WhatsApp QR login and sync work?', a: 'Cusman CRM leverages secure session pairing. You simply scan the QR code displayed on your dashboard with your WhatsApp mobile app (linked devices section) to instantly sync incoming chats, active contacts, and messages.' },
    { q: 'Does Cusman CRM integrate with my existing ERP or shop?', a: 'Yes! Cusman CRM includes built-in connectors for Shopify, WooCommerce, ERPNext, Odoo, and custom REST endpoints. You can map custom payload structures, import products/orders, and schedule automatic sync logs.' },
    { q: 'How does the AI order detection feature help my sales team?', a: 'When a customer messages you saying something like "Need 10 ABC Malt", our built-in Gemini parser detects the intent, resolves the product name in your catalog, extracts the quantity, and automatically creates a draft order ready for review.' }
  ];

  return (
    <div className="bg-neutral-950 text-neutral-100 font-sans min-h-screen selection:bg-primary selection:text-primary-foreground">
      
      {/* Header Navbar */}
      <header className="sticky top-0 bg-neutral-950/75 backdrop-blur-md border-b border-neutral-900 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-primary to-teal-500">CUSMAN CRM</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-400">
            <a href="#features" className="hover:text-neutral-200 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-neutral-200 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-neutral-200 transition-colors">FAQ</a>
            <a href="#contact" className="hover:text-neutral-200 transition-colors">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold hover:text-neutral-200 transition-colors">Sign In</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/95 transition-all shadow-md shadow-primary/10">Get Started</Link>
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
      <section className="relative overflow-hidden pt-20 pb-16 md:pt-32 md:pb-28">
        {/* Glow vector background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 text-center space-y-8 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-[10px] uppercase font-bold tracking-wider animate-pulse">
            <Sparkles className="w-3 h-3" /> AI-Powered Customer Growth Platform
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-neutral-100 max-w-4xl mx-auto leading-[1.1]">
            Turn Conversations Into Customers with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-primary to-teal-400">Cusman CRM</span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            A premium, mobile-first CRM for SMEs, distributors, D2C brands, and sales teams. Connect your WhatsApp business line, run campaigns, automate workflows, predict conversion probability, and grow revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
              Start Free Workspace <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#features" className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-neutral-800 hover:bg-neutral-900 transition-all font-semibold text-xs text-neutral-350">
              Explore CRM Features
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 border-t border-neutral-900 bg-neutral-900/10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">AI-Driven Customer Growth Suite</h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto">Everything you need to automate client outreach, manage pipelines, track orders, and boost conversions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div key={i} className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 hover:border-primary/20 transition-all space-y-4 hover:shadow-lg hover:shadow-primary/5 group">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-neutral-200 text-sm">{f.title}</h3>
                  <p className="text-neutral-450 text-xs leading-relaxed">{f.desc}</p>
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
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Simple, Growth-Oriented Pricing</h2>
            <p className="text-sm text-neutral-400 max-w-xl mx-auto">Select a subscription plan tailored for your active team, database scope, and WhatsApp volume.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {pricing.map((p, i) => (
              <div key={i} className="p-8 rounded-3xl border border-neutral-900 bg-neutral-900/15 flex flex-col justify-between space-y-8 relative hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/[0.02]">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-neutral-300 capitalize">{p.name}</h3>
                  <div className="flex items-baseline text-neutral-100">
                    <span className="text-4xl font-extrabold">{p.price}</span>
                    <span className="text-xs text-neutral-500 font-semibold ml-1">/mo</span>
                  </div>
                  <div className="h-[1px] bg-neutral-900 my-2" />
                  <ul className="space-y-3 text-xs text-neutral-450">
                    {p.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link href="/signup" className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-primary border border-neutral-800 hover:border-primary text-center text-xs font-bold uppercase tracking-wider text-neutral-300 hover:text-primary-foreground transition-all block">
                  Select Plan
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 border-t border-neutral-900">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Frequently Asked Questions</h2>
            <p className="text-sm text-neutral-400">Everything you need to know about the AI Customer Growth Platform.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => {
              const isOpen = faqOpen === i;
              return (
                <div key={i} className="border border-neutral-900 rounded-xl overflow-hidden bg-neutral-900/5 transition-all">
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
      <section id="contact" className="py-20 border-t border-neutral-900 bg-neutral-900/10">
        <div className="max-w-xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-100">Connect With Our Growth Team</h2>
            <p className="text-sm text-neutral-400">Need specific custom connectors, custom dashboards, or multi-tenant API integrations?</p>
          </div>

          {contactSuccess ? (
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs text-center flex flex-col items-center gap-2">
              <CheckCircle className="w-8 h-8 animate-bounce" />
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
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 focus:ring-1 focus:ring-primary"
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
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 focus:ring-1 focus:ring-primary"
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
                  className="w-full px-4 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-primary text-neutral-200 focus:ring-1 focus:ring-primary resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
              >
                Submit Request
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-900 bg-neutral-950 flex flex-col items-center justify-center gap-4 text-center text-xs text-neutral-500">
        <span className="text-md font-black tracking-widest text-neutral-300">CUSMAN CRM</span>
        <p className="max-w-md leading-relaxed text-neutral-500">Turn Conversations Into Customers - AI-Powered Customer Growth Platform by DK's Technologies.</p>
        <p>&copy; {new Date().getFullYear()} Cusman CRM - DK's Technologies. All rights reserved.</p>
      </footer>

    </div>
  );
}
