'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Workflow,
  Terminal,
  Code,
  Copy,
  Check,
  Bot,
  Cpu,
  Database,
  Globe,
  Settings,
  Clock,
  ExternalLink
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  
  // Interactive API Playground States
  const [activeLang, setActiveLang] = useState<'curl' | 'js' | 'python' | 'php'>('js');
  const [inputPhone, setInputPhone] = useState('1234567890');
  const [inputText, setInputText] = useState('Hello from WhatsFlow AI!');
  const [selectedMediaType, setSelectedMediaType] = useState<'text' | 'image' | 'location' | 'poll'>('text');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800');
  
  const [chatMessages, setChatMessages] = useState<Array<{ text: string; isSender: boolean; time: string; mediaUrl?: string; type?: string }>>([
    { text: "Hey! How can I integrate WhatsApp with my ERP?", isSender: false, time: "10:24 AM" },
    { text: "WhatsFlow AI makes it incredibly easy with REST APIs or Model Context Protocol.", isSender: true, time: "10:25 AM" }
  ]);
  const [copiedText, setCopiedText] = useState(false);

  // Flow Builder Animation
  const [activeNode, setActiveNode] = useState(0);

  // Billing states
  const [isYearly, setIsYearly] = useState(false);

  // Contact Form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

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

  // Generate code snippet dynamically
  const getCodeSnippet = () => {
    const toNum = inputPhone.trim() || '1234567890';
    const msgText = inputText.replace(/"/g, '\\"');
    
    let payload = {};
    if (selectedMediaType === 'text') {
      payload = { to: toNum, text: msgText };
    } else if (selectedMediaType === 'image') {
      payload = { to: toNum, text: msgText, imageUrl: mediaUrl };
    } else if (selectedMediaType === 'location') {
      payload = { to: toNum, location: { latitude: 37.7749, longitude: -122.4194 } };
    } else if (selectedMediaType === 'poll') {
      payload = { to: toNum, poll: { name: "Do you like WhatsFlow?", options: ["Yes", "Absolutely!"] } };
    }

    const payloadString = JSON.stringify(payload, null, 2);

    switch (activeLang) {
      case 'curl':
        return `curl -X POST https://api.whatsflow.ai/api/send-message \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(payload)}'`;
      
      case 'js':
        return `import axios from 'axios';

const response = await axios.post(
  'https://api.whatsflow.ai/api/send-message',
  ${payloadString},
  {
    headers: {
      Authorization: 'Bearer YOUR_API_KEY'
    }
  }
);`;

      case 'python':
        return `import httpx

response = httpx.post(
    'https://api.whatsflow.ai/api/send-message',
    json=${payloadString.replace(/true/g, 'True').replace(/false/g, 'False')},
    headers={
        'Authorization': 'Bearer YOUR_API_KEY'
    }
)`;

      case 'php':
        return `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.whatsflow.ai/api/send-message",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "POST",
  CURLOPT_POSTFIELDS => '${JSON.stringify(payload)}',
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json"
  ],
]);
$response = curl_exec($curl);
curl_close($curl);`;
    }
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const triggerTestMessage = () => {
    if (!inputText) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev) => [
      ...prev,
      {
        text: inputText,
        isSender: true,
        time: timeNow,
        mediaUrl: selectedMediaType === 'image' ? mediaUrl : undefined,
        type: selectedMediaType
      }
    ]);
    // Simulate auto AI reply
    setTimeout(() => {
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setChatMessages((prev) => [
        ...prev,
        {
          text: `[Webhook Fired: messages.sent] API request authenticated. Dispatch complete.`,
          isSender: false,
          time: replyTime,
          type: 'webhook'
        }
      ]);
    }, 1000);
  };

  const pricingPlans = [
    {
      name: 'Basic',
      slug: 'basic',
      price: 6,
      sessions: 1,
      desc: 'Ideal for indie hackers or small builders needing 1 WhatsApp link.',
      features: [
        '1 Connected WhatsApp Number',
        'Unlimited Contacts & Messages',
        'No Daily Rate Throttling',
        'API Keys & REST Access',
        'Webhooks (Real-time Events)',
        'Standard Email Support'
      ]
    },
    {
      name: 'Pro',
      slug: 'pro',
      price: 15,
      sessions: 3,
      popular: true,
      desc: 'Perfect for growing companies managing client integrations.',
      features: [
        '3 Connected WhatsApp Numbers',
        'Unlimited Contacts & Messages',
        'Model Context Protocol (MCP) Remote Server',
        'AI Studio Prompt Builder',
        'Webhooks Replay Debugger',
        'Priority Slack & Chat Support'
      ]
    },
    {
      name: 'Business',
      slug: 'business',
      price: 45,
      sessions: 10,
      desc: 'Robust capability for customer service hubs and support teams.',
      features: [
        '10 Connected WhatsApp Numbers',
        'Unlimited Contacts & Messages',
        'Model Context Protocol (MCP) Access',
        'AI Chatbot Vision OCR Capabilities',
        'Shopify & ERP Sync Connectors',
        'Dedicated Enterprise Account Exec'
      ]
    }
  ];

  const faqs = [
    {
      q: 'Will clients know I am using WhatsFlow AI to send messages?',
      a: 'No, recipients will only see your registered WhatsApp number. The message appears completely native and direct, without any watermarks or third-party indicators.'
    },
    {
      q: 'How does session linking work?',
      a: 'WhatsFlow AI uses standard WhatsApp Web device linking. You navigate to the dashboard, click "Create Session", and scan the generated QR code with your mobile device under "Linked Devices".'
    },
    {
      q: 'Can I route incoming messages to my backend?',
      a: 'Yes! Our webhook module triggers immediate HTTP POST payloads (in a flattened structure) to your specified URL for incoming messages, reactions, receipts, and status updates.'
    },
    {
      q: 'What is the Model Context Protocol (MCP) remote server?',
      a: 'The MCP server allows AI agents (like Claude Desktop or custom LLMs) to run local tools directly on WhatsFlow. This means an AI can list your sessions, fetch contacts, or automatically compile and send replies using natural text instructions.'
    },
    {
      q: 'Is it safe to connect my phone?',
      a: 'Absolutely. We do not store your chat logs or cache credentials. The automation session is fully isolated in an encrypted sandbox. You can disconnect at any time from your device.'
    },
    {
      q: 'Do you offer a marketplace for integrations?',
      a: 'Yes, we provide direct API plugins and webhook handlers for n8n, Make, Zapier, Shopify, WooCommerce, and ERPNext.'
    }
  ];

  return (
    <div className="bg-[#0A0C14] text-neutral-100 font-sans min-h-screen selection:bg-emerald-500 selection:text-neutral-950 relative overflow-hidden">
      
      {/* Background Aurora blurs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] aurora-glow-emerald rounded-full pointer-events-none filter blur-[120px]" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] aurora-glow-indigo rounded-full pointer-events-none filter blur-[150px]" />
      <div className="absolute bottom-[10%] left-[20%] w-[500px] h-[500px] aurora-glow-cyan rounded-full pointer-events-none filter blur-[130px]" />

      {/* Announcement Banner */}
      <div className="relative z-50 bg-gradient-to-r from-emerald-950/60 via-emerald-900/60 to-emerald-950/60 border-b border-emerald-500/20 py-2.5 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">n8n Node</span>
          <span className="text-neutral-300 font-medium">Automate WhatsApp without writing code using our official n8n community node.</span>
          <a href="https://www.npmjs.com/package/n8n-nodes-wasenderapi" target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline inline-flex items-center gap-1 transition-colors">
            Install Node <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 bg-[#0A0C14]/85 backdrop-blur-md border-b border-neutral-900 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6.5 h-6.5 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black text-sm">C</span>
            <span className="text-lg font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">CUSMAN CRM</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-400">
            <a href="#features" className="hover:text-neutral-100 transition-colors">Features</a>
            <a href="#flow-builder" className="hover:text-neutral-100 transition-colors">Flow Builder</a>
            <a href="#playground" className="hover:text-neutral-100 transition-colors">API Playground</a>
            <a href="#pricing" className="hover:text-neutral-100 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-neutral-100 transition-colors">FAQ</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-xs font-semibold text-neutral-400 hover:text-neutral-100 transition-colors">Sign In</Link>
            <Link href="/signup" className="px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10">Get Started</Link>
          </div>

          <button className="md:hidden text-neutral-400 hover:text-neutral-100" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-6 py-4 bg-[#0A0C14] border-b border-neutral-900 space-y-3 flex flex-col text-sm font-semibold text-neutral-400">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-100 py-1">Features</a>
            <a href="#flow-builder" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-100 py-1">Flow Builder</a>
            <a href="#playground" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-100 py-1">API Playground</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-100 py-1">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-100 py-1">FAQ</a>
            <div className="h-[1px] bg-neutral-900 my-2" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="hover:text-neutral-100 py-1">Sign In</Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-center hover:bg-emerald-400 block">Get Started</Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-28 md:pb-24 max-w-7xl mx-auto px-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 text-[10px] uppercase font-bold tracking-wider animate-pulse">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered WhatsApp CRM & Gateway
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-neutral-100 leading-[1.08] max-w-xl">
              WhatsApp API Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-400">Developers</span>
            </h1>
            <p className="text-neutral-400 text-sm md:text-base max-w-lg leading-relaxed">
              Connect multi-tenant sessions, orchestrate visual logic flows, configure autonomous AI chatbots, and receive real-time webhooks through a professional, isolated platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                Start Free Sandbox <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#playground" className="w-full sm:w-auto px-8 py-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-800 transition-all font-bold text-xs uppercase text-neutral-350 tracking-wider flex items-center justify-center">
                Explore API Console
              </a>
            </div>
          </div>

          {/* Interactive Hero SDK Playground & WhatsApp Device */}
          <div className="lg:col-span-6">
            <div className="glass-card rounded-2xl p-4 md:p-6 border border-neutral-800/80 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4 border-b border-neutral-900 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/40" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/40" />
                  <span className="w-3 h-3 rounded-full bg-green-500/30 border border-green-500/40" />
                </div>
                <div className="flex items-center gap-1.5 bg-neutral-950/60 p-1.5 rounded-lg border border-neutral-800">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase px-1.5 font-mono">POST</span>
                  <span className="text-[10px] text-neutral-300 font-semibold font-mono">/api/send-message</span>
                </div>
              </div>

              {/* Languages selectors */}
              <div className="flex items-center justify-between mb-3 bg-neutral-950/40 p-1 rounded-xl border border-neutral-850">
                <div className="flex gap-1">
                  {(['curl', 'js', 'python', 'php'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        activeLang === lang
                          ? 'bg-neutral-800 text-emerald-400 border border-neutral-700/60'
                          : 'text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {lang === 'js' ? 'Node.js' : lang}
                    </button>
                  ))}
                </div>
                <button
                  onClick={copyCodeToClipboard}
                  className="p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-805/50 transition-all"
                  title="Copy Code"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Code Snippet Display */}
              <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-900 font-mono text-[10.5px] leading-relaxed text-neutral-400 text-left overflow-x-auto min-h-[160px]">
                <pre>{getCodeSnippet()}</pre>
              </div>

              {/* Input Interactive Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-left">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Recipient Number</label>
                  <input
                    type="text"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">Body Message</label>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between gap-3 mt-4 border-t border-neutral-900 pt-4">
                <div className="flex gap-2">
                  {(['text', 'image', 'location', 'poll'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedMediaType(type)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all border ${
                        selectedMediaType === type
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                          : 'bg-neutral-950 border-neutral-850 text-neutral-500 hover:text-neutral-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <button
                  onClick={triggerTestMessage}
                  className="px-5 py-2 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" /> Execute API
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Visual Flow Builder Interactive Schematic */}
      <section id="flow-builder" className="py-20 border-y border-neutral-900 bg-neutral-950/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] uppercase font-bold tracking-wider">Visual Logic</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-100">AI Visual Workflow Studio</h2>
            <p className="text-neutral-400 text-xs md:text-sm max-w-lg mx-auto">Build stateful visual automation flows connecting web triggers, CRM entities, AI models, and database systems.</p>
          </div>

          {/* Graphical editor workspace simulator */}
          <div className="glass-card rounded-2xl border border-neutral-850 p-6 md:p-8 max-w-4xl mx-auto shadow-2xl relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-2xl" />
            
            {/* Visual Node Grid */}
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4 md:py-6">
              
              {/* Node 1: Trigger */}
              <div className={`p-4 rounded-xl border w-44 text-left transition-all duration-300 ${activeNode === 0 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5 scale-105' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Trigger</span>
                </div>
                <span className="text-xs font-semibold text-neutral-200 block truncate">Receive Message</span>
                <span className="text-[9px] text-neutral-500 block mt-1">Incoming chat match</span>
              </div>

              {/* Node Connector Line */}
              <div className="h-6 w-[2px] md:h-[2px] md:w-8 bg-neutral-800" />

              {/* Node 2: Logic Condition */}
              <div className={`p-4 rounded-xl border w-44 text-left transition-all duration-300 ${activeNode === 1 ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-lg shadow-indigo-500/5 scale-105' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Workflow className="w-4 h-4 shrink-0 text-indigo-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Condition</span>
                </div>
                <span className="text-xs font-semibold text-neutral-200 block">Keyword Match</span>
                <span className="text-[9px] text-neutral-500 block mt-1">If text contains "order"</span>
              </div>

              {/* Node Connector Line */}
              <div className="h-6 w-[2px] md:h-[2px] md:w-8 bg-neutral-800" />

              {/* Node 3: AI Agent */}
              <div className={`p-4 rounded-xl border w-44 text-left transition-all duration-300 ${activeNode === 2 ? 'bg-pink-500/10 border-pink-500 text-pink-400 shadow-lg shadow-pink-500/5 scale-105' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 shrink-0 text-pink-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">AI Agent</span>
                </div>
                <span className="text-xs font-semibold text-neutral-200 block">Product Assist</span>
                <span className="text-[9px] text-neutral-500 block mt-1">Gemini context lookup</span>
              </div>

              {/* Node Connector Line */}
              <div className="h-6 w-[2px] md:h-[2px] md:w-8 bg-neutral-800" />

              {/* Node 4: Action Integration */}
              <div className={`p-4 rounded-xl border w-44 text-left transition-all duration-300 ${activeNode === 3 ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 shadow-lg shadow-cyan-500/5 scale-105' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Integration</span>
                </div>
                <span className="text-xs font-semibold text-neutral-200 block truncate">WooCommerce ERP</span>
                <span className="text-[9px] text-neutral-500 block mt-1">Generate Draft Invoice</span>
              </div>

              {/* Node Connector Line */}
              <div className="h-6 w-[2px] md:h-[2px] md:w-8 bg-neutral-800" />

              {/* Node 5: Output */}
              <div className={`p-4 rounded-xl border w-44 text-left transition-all duration-300 ${activeNode === 4 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/5 scale-105' : 'bg-neutral-950 border-neutral-800 text-neutral-400'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Send</span>
                </div>
                <span className="text-xs font-semibold text-neutral-200 block">Order Card</span>
                <span className="text-[9px] text-neutral-500 block mt-1">Reply dispatch confirmation</span>
              </div>

            </div>

            {/* Visual Node Description details */}
            <div className="mt-8 bg-neutral-950/60 border border-neutral-900 rounded-xl p-4 text-left flex gap-3 items-start">
              <Cpu className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-neutral-300 block mb-1">Stateful Webhooks & Execution Trails</span>
                <span className="text-[11px] text-neutral-400 leading-relaxed block">
                  Every node action is cataloged in the Audit Log, permitting failed webhooks, missing integrations, or AI prompt exceptions to be replayed or debugged directly from the settings.
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Live Interactive WhatsApp Simulator & Webhooks Console */}
      <section id="playground" className="py-20 bg-neutral-950/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Developer Sandbox</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-100">Live API Execution Console</h2>
            <p className="text-neutral-400 text-xs md:text-sm max-w-lg mx-auto">Inspect how the REST payload parameters immediately reflect on a virtual WhatsApp client interface and trigger webhook payloads.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* Input Config Control Panel */}
            <div className="lg:col-span-6 glass-card border border-neutral-850 p-6 rounded-2xl flex flex-col justify-between text-left space-y-6">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block border-b border-neutral-900 pb-2">Simulator Settings</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Message Body Text</label>
                  <textarea
                    rows={3}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300 focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Type</label>
                    <select
                      value={selectedMediaType}
                      onChange={(e) => setSelectedMediaType(e.target.value as any)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-400"
                    >
                      <option value="text">Plain Text</option>
                      <option value="image">Media (Image)</option>
                      <option value="location">Location Pin</option>
                      <option value="poll">Poll Questionnaire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Recipient</label>
                    <input
                      type="text"
                      value={inputPhone}
                      onChange={(e) => setInputPhone(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300"
                    />
                  </div>
                </div>

                {selectedMediaType === 'image' && (
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-2">Media Attachment Link</label>
                    <input
                      type="text"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-300"
                    />
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-900 pt-4 flex gap-4">
                <button
                  onClick={triggerTestMessage}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5"
                >
                  <SendIcon className="w-3.5 h-3.5" /> Send Message
                </button>
                <button
                  onClick={() => setChatMessages([
                    { text: "Hey! How can I integrate WhatsApp with my ERP?", isSender: false, time: "10:24 AM" },
                    { text: "WhatsFlow AI makes it incredibly easy with REST APIs or Model Context Protocol.", isSender: true, time: "10:25 AM" }
                  ])}
                  className="px-4 py-3 rounded-xl border border-neutral-800 hover:bg-neutral-900 transition-all text-xs font-semibold text-neutral-400"
                >
                  Clear Screen
                </button>
              </div>
            </div>

            {/* Virtual Mobile Screen Simulator */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[300px] h-[520px] rounded-[36px] border-[8px] border-neutral-800 bg-[#0F121E] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                
                {/* Speaker/Camera slot */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-800 rounded-full z-20 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-950/80 mr-1" />
                  <span className="w-8 h-1 bg-neutral-950/80 rounded-full" />
                </div>

                {/* Device Chat Header */}
                <div className="bg-[#121B22] pt-8 pb-3 px-4 border-b border-neutral-900/60 z-10 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-450 border border-neutral-750">WF</div>
                  <div>
                    <span className="text-xs font-bold text-neutral-100 block">WhatsFlow Sandbox</span>
                    <span className="text-[9px] text-emerald-400 block font-medium">online</span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 bg-[#0B141A] p-3 space-y-3 overflow-y-auto flex flex-col">
                  <div className="text-[9px] bg-[#182229] border border-neutral-800 text-neutral-400 rounded-md py-1 px-2 text-center mx-auto max-w-[190px]">
                    Encrypted virtual Sandbox line session.
                  </div>

                  {chatMessages.map((msg, i) => {
                    if (msg.type === 'webhook') {
                      return (
                        <div key={i} className="text-[8px] bg-neutral-950/80 border border-neutral-900 text-neutral-400 rounded-md p-1.5 font-mono text-left w-full max-w-[240px] self-center">
                          {msg.text}
                        </div>
                      );
                    }
                    return (
                      <div
                        key={i}
                        className={`p-2.5 rounded-xl text-[11px] leading-relaxed max-w-[210px] text-left relative ${
                          msg.isSender
                            ? 'bg-[#005C4B] text-neutral-100 self-end rounded-tr-none'
                            : 'bg-[#202C33] text-neutral-100 self-start rounded-tl-none'
                        }`}
                      >
                        {msg.mediaUrl && (
                          <div className="mb-2 rounded-lg overflow-hidden border border-neutral-900/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={msg.mediaUrl} alt="Payload attachment" className="w-full h-24 object-cover" />
                          </div>
                        )}
                        {msg.type === 'location' && (
                          <div className="mb-1 bg-neutral-950/40 border border-neutral-900 p-1.5 rounded-lg font-mono text-[9px] text-neutral-400">
                            📍 Lat: 37.7749<br />Lon: -122.4194
                          </div>
                        )}
                        {msg.type === 'poll' && (
                          <div className="mb-1 border border-neutral-850 p-2 rounded-lg bg-neutral-950/20 space-y-1">
                            <span className="font-bold text-[10px] block">Do you like WhatsFlow?</span>
                            <div className="border border-neutral-800 rounded p-1 text-[9px]">◯ Yes</div>
                            <div className="border border-neutral-800 rounded p-1 text-[9px]">◯ Absolutely!</div>
                          </div>
                        )}
                        <span>{msg.text}</span>
                        <span className="block text-[8px] text-neutral-400 text-right mt-1.5 font-mono">{msg.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Input simulator footer */}
                <div className="bg-[#1F2C34] py-2 px-3 border-t border-neutral-900/40 flex items-center gap-2">
                  <div className="flex-1 bg-[#2A3942] rounded-full px-3 py-1.5 text-[11px] text-neutral-500 text-left">
                    Send simulation...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-neutral-950">
                    <SendIcon className="w-3.5 h-3.5" />
                  </div>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Pricing Calculator Section */}
      <section id="pricing" className="py-20 border-t border-neutral-900 bg-neutral-950/20 relative z-10">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Billing Tiers</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-100">Growth-Oriented Pricing</h2>
            <p className="text-neutral-400 text-xs md:text-sm max-w-lg mx-auto">Configure a workspace plan that fits your linked database scope, active numbers, and team capacity.</p>
            
            {/* Toggle interval */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <span className={`text-xs font-semibold ${!isYearly ? 'text-emerald-400' : 'text-neutral-500'}`}>Monthly</span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="w-12 h-6.5 rounded-full bg-neutral-800 p-1 flex items-center border border-neutral-700/60"
              >
                <div className={`w-4.5 h-4.5 rounded-full bg-emerald-500 transition-all duration-305 ${isYearly ? 'translate-x-5.5' : 'translate-x-0'}`} />
              </button>
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isYearly ? 'text-emerald-400' : 'text-neutral-500'}`}>
                Yearly <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">Save 15%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {pricingPlans.map((plan, i) => {
              const basePrice = plan.price;
              const actualPrice = isYearly ? basePrice * 0.85 : basePrice;
              
              return (
                <div
                  key={i}
                  className={`p-6 md:p-8 rounded-3xl border flex flex-col justify-between space-y-6 relative hover:shadow-xl hover:shadow-emerald-500/[0.01] transition-all duration-300 ${
                    plan.popular
                      ? 'bg-neutral-900/40 border-emerald-500/40 shadow-emerald-500/5'
                      : 'bg-neutral-900/10 border-neutral-900 hover:border-neutral-800'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-neutral-950 font-bold text-[9px] uppercase tracking-wider shadow">Most Popular</span>
                  )}
                  
                  <div className="space-y-4 text-left">
                    <div>
                      <h3 className="text-lg font-bold text-neutral-100">{plan.name}</h3>
                      <p className="text-[11px] text-neutral-500 block mt-1">{plan.desc}</p>
                    </div>

                    <div className="flex items-baseline gap-1 text-neutral-100 border-y border-neutral-900 py-3.5">
                      <span className="text-4xl font-black">${actualPrice.toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-neutral-500 uppercase">/month</span>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Included Features</span>
                      <ul className="space-y-2.5 text-xs text-neutral-400">
                        {plan.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Link
                      href="/signup"
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-center block transition-all ${
                        plan.popular
                          ? 'bg-emerald-500 text-neutral-950 hover:bg-emerald-400'
                          : 'bg-neutral-950 border border-neutral-855 hover:bg-neutral-900 text-neutral-355'
                      }`}
                    >
                      Start Workspace
                    </Link>
                    <span className="text-[9px] text-neutral-500 block text-center uppercase tracking-wider font-semibold">
                      ${(actualPrice / plan.sessions).toFixed(2)} / connection session limit
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Platforms SDKs Showcase */}
      <section id="features" className="py-20 border-t border-neutral-900 bg-[#0A0C14]">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">Integrations</span>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-100">SDKs for Your Favorite Platform</h2>
            <p className="text-neutral-400 text-xs md:text-sm max-w-lg mx-auto">Platform-specific SDKs to connect with WhatsFlow API with zero boilerplate.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto text-left">
            
            {/* Node.js SDK */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 space-y-4 hover:border-neutral-800 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Code className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-200 text-sm">Node.js SDK</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Official JavaScript/TypeScript package with full type safety.</p>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[9px] text-neutral-400 border border-neutral-900">
                npm install @whatsflow/sdk
              </div>
            </div>

            {/* Python SDK */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 space-y-4 hover:border-neutral-800 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Terminal className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-200 text-sm">Python SDK</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Pip package with support for asyncio and full model callbacks.</p>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[9px] text-neutral-400 border border-neutral-900">
                pip install whatsflow
              </div>
            </div>

            {/* Laravel SDK */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 space-y-4 hover:border-neutral-800 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-200 text-sm">Laravel Service</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Laravel service providers, facades, and webhook routers.</p>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[9px] text-neutral-400 border border-neutral-900">
                composer require whatsflow/laravel
              </div>
            </div>

            {/* n8n Node */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/40 space-y-4 hover:border-neutral-800 transition-all group">
              <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-neutral-200 text-sm">n8n Node</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Official community node to handle events and templates.</p>
              </div>
              <div className="bg-neutral-950 p-2.5 rounded-lg font-mono text-[9px] text-neutral-400 border border-neutral-900">
                n8n-nodes-whatsflow
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 border-t border-neutral-900">
        <div className="max-w-3xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">FAQ</span>
            <h2 className="text-3xl font-black tracking-tight text-neutral-100">Frequently Asked Questions</h2>
            <p className="text-neutral-450 text-xs md:text-sm">Everything you need to know about WhatsFlow AI WhatsApp integration API.</p>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, i) => {
              const isOpen = faqOpen === i;
              return (
                <div key={i} className="border border-neutral-900 rounded-2xl overflow-hidden bg-neutral-900/10 transition-all">
                  <button
                    onClick={() => toggleFaq(i)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left text-xs md:text-sm font-semibold text-neutral-200 hover:bg-neutral-900/30 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-neutral-550 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 text-xs md:text-sm text-neutral-455 leading-relaxed border-t border-neutral-900/50 pt-3 bg-neutral-950/20">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Interactive Call-To-Action (CTA) */}
      <section className="py-20 border-t border-neutral-900 bg-gradient-to-b from-[#0A0C14] to-[#0D101C] relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-100">Ready to Automate WhatsApp?</h2>
          <p className="text-neutral-400 text-xs md:text-sm max-w-xl mx-auto leading-relaxed">
            Create your developer sandbox today. Access REST APIs, link multi-tenant numbers, deploy visual logic nodes, and connect custom AI models.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="w-full sm:w-auto px-8 py-4 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
              Get Started for Free <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto px-8 py-4 rounded-xl border border-neutral-800 hover:bg-neutral-900 transition-all font-bold text-xs uppercase text-neutral-400 tracking-wider flex items-center justify-center">
              View OpenAPI Spec
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-neutral-900 bg-neutral-950 flex flex-col items-center justify-center gap-4 text-center text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-black text-xs">C</span>
          <span className="text-sm font-black tracking-widest text-neutral-300">CUSMAN CRM</span>
        </div>
        <p className="max-w-md leading-relaxed text-neutral-500">Professional, AI-Powered WhatsApp CRM & Developer APIs Platform.</p>
        <p>&copy; {new Date().getFullYear()} Cusman CRM. All rights reserved.</p>
      </footer>

    </div>
  );
}

// Inline Helper SVG Components
function SendIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}
