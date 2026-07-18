'use client';

import React, { useState } from 'react';
import {
  Bot,
  Brain,
  Sliders,
  Play,
  Send,
  Eye,
  FileText,
  Sparkles,
  HelpCircle,
  Plus,
  Trash,
  Settings,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface ChatMessage {
  text: string;
  isSender: boolean;
  time: string;
}

export default function AiStudioPage() {
  const [activeSubTab, setActiveSubTab] = useState<'prompt' | 'knowledge' | 'intents' | 'simulator'>('prompt');
  
  // Prompt builder states
  const [chatbotName, setChatbotName] = useState('Amudhasurabiy AI Agent');
  const [systemPrompt, setSystemPrompt] = useState(
    `You are the official customer growth assistant for Amudhasurabiy Organics. Your purpose is to:
1. Greet customers warmly and answer queries regarding organic malts, health mixes, and pricing.
2. If a customer mentions ordering items (e.g. "I want 5 Health Mix"), extract the quantities and products.
3. Automatically prompt the user to confirm their details before routing to the database.`
  );
  const [temperature, setTemperature] = useState(0.2);
  const [enableOCR, setEnableOCR] = useState(true);

  // Knowledge base list
  const [files, setFiles] = useState([
    { name: 'Product_Catalog_2026.pdf', size: '2.4 MB', uploadDate: '2026-07-10' },
    { name: 'FAQ_Shipping_Returns.txt', size: '12 KB', uploadDate: '2026-07-12' },
    { name: 'Malt_Benefits_Sheet.docx', size: '145 KB', uploadDate: '2026-07-15' }
  ]);
  const [newFileName, setNewFileName] = useState('');

  // Intent Mapping
  const [intents, setIntents] = useState([
    { phrase: 'price', action: 'Trigger Catalog Card reply' },
    { phrase: 'track order', action: 'Call check_order_status function' },
    { phrase: 'cancel', action: 'Human Handoff (Route to support inbox)' }
  ]);
  const [newPhrase, setNewPhrase] = useState('');
  const [newAction, setNewAction] = useState('Trigger Catalog Card reply');

  // Conversational Simulator
  const [simText, setSimText] = useState('');
  const [simMessages, setSimMessages] = useState<ChatMessage[]>([
    { text: "Hello! What is the price of Malt?", isSender: false, time: "11:00 AM" },
    { text: "Greetings! Our Premium Health Malt is priced at ₹350 per 500g package. Would you like to check details?", isSender: true, time: "11:00 AM" }
  ]);

  const handleUploadFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;
    setFiles((prev) => [
      ...prev,
      { name: newFileName, size: '85 KB', uploadDate: new Date().toISOString().split('T')[0] }
    ]);
    setNewFileName('');
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddIntent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase) return;
    setIntents((prev) => [...prev, { phrase: newPhrase, action: newAction }]);
    setNewPhrase('');
  };

  const handleRemoveIntent = (index: number) => {
    setIntents((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendSimMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!simText.trim()) return;
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setSimMessages((prev) => [...prev, { text: simText, isSender: false, time: timeNow }]);
    const currentInput = simText;
    setSimText('');

    setTimeout(() => {
      let reply = "I am processing your request using the configured Amudhasurabiy AI Agent prompt instructions...";
      if (currentInput.toLowerCase().includes('price')) {
        reply = "Our Health Mix is ₹350, and Organic Honey Malt is ₹420. Which would you like to buy?";
      } else if (currentInput.toLowerCase().includes('order')) {
        reply = "I detected an order intent! Let me compile a draft invoice for you. Please confirm: 1x Organic Honey Malt.";
      }
      
      const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSimMessages((prev) => [...prev, { text: reply, isSender: true, time: replyTime }]);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto flex flex-col min-h-0">
      
      {/* Title */}
      <div className="shrink-0 flex items-center justify-between border-b border-neutral-900 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            WhatsFlow AI Studio
          </h1>
          <p className="text-xs text-neutral-400">Deploy autonomous AI agents, feed knowledge bases, configure OCR systems, and trigger function callbacks.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" /> AI Engine Active
          </span>
        </div>
      </div>

      {/* Subtab navigation */}
      <div className="flex border-b border-neutral-900 gap-2 shrink-0">
        {([
          { id: 'prompt', label: 'Prompt Builder', icon: Sliders },
          { id: 'knowledge', label: 'Knowledge Base', icon: FileText },
          { id: 'intents', label: 'Intent Detection', icon: Brain },
          { id: 'simulator', label: 'Conversation Simulator', icon: Play }
        ] as const).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 border-b-2 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                activeSubTab === tab.id
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROMPT BUILDER */}
      {activeSubTab === 'prompt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Editor Left */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-5">
              <h3 className="font-bold text-neutral-200 text-sm">Agent Base Persona Configuration</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Agent Display Identifier</label>
                  <input
                    type="text"
                    value={chatbotName}
                    onChange={(e) => setChatbotName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-200"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1.5">Base System instructions (System Prompt)</label>
                  <textarea
                    rows={8}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-200 resize-none font-mono leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-900 flex justify-end">
                <button
                  onClick={() => alert('Agent Prompt persona updated.')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-955 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  Save Prompt Profile
                </button>
              </div>
            </div>
          </div>

          {/* Configuration Right */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Parameters card */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4">
              <h3 className="font-bold text-neutral-200 text-xs uppercase tracking-wider">Model Hyperparameters</h3>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-neutral-400 font-semibold">Temperature (Creativity)</span>
                    <span className="text-emerald-400 font-bold font-mono">{temperature}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1 bg-neutral-950 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-600 mt-1">
                    <span>Determined (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>

                {/* OCR Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-900">
                  <div>
                    <span className="text-xs font-bold text-neutral-300 block">Vision OCR Scanning</span>
                    <span className="text-[10px] text-neutral-500 block">Permit AI to extract receipt data.</span>
                  </div>
                  <button
                    onClick={() => setEnableOCR(!enableOCR)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors border ${
                      enableOCR ? 'bg-emerald-500 border-emerald-400' : 'bg-neutral-800 border-neutral-700'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-neutral-950 transition-transform ${enableOCR ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Model Info */}
            <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-950/20 text-xs space-y-3">
              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block">Execution Engine</span>
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="font-bold text-neutral-250 block">Gemini 2.5 Flash</span>
                  <span className="text-[10px] text-neutral-550 block">Ultra-fast latency parsing model.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE */}
      {activeSubTab === 'knowledge' && (
        <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-6 text-left max-w-4xl">
          <h3 className="font-bold text-neutral-200">Knowledge Files Directory</h3>
          <p className="text-xs text-neutral-450 leading-relaxed">Provide custom text documentation resources. Our embedding service partitions these documents into vector segments to feed contextual data to the LLM automatically.</p>

          <form onSubmit={handleUploadFile} className="flex gap-4 max-w-lg border-b border-neutral-900 pb-5">
            <input
              type="text"
              required
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="E.g. product_pricing_guidelines.txt"
              className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-300 placeholder-neutral-700"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Link File
            </button>
          </form>

          <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-950/20">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-850 bg-neutral-900/30 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">File Size</th>
                  <th className="px-6 py-3">Linked Date</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 text-xs text-neutral-350">
                {files.map((file, i) => (
                  <tr key={i} className="hover:bg-neutral-955/20">
                    <td className="px-6 py-3.5 font-bold text-neutral-200 flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      <span>{file.name}</span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-[10px] text-neutral-500">{file.size}</td>
                    <td className="px-6 py-3.5 font-mono text-[10px] text-neutral-500">{file.uploadDate}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleRemoveFile(i)}
                        className="p-1.5 rounded hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                        title="Delete file"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: INTENT DETECTION */}
      {activeSubTab === 'intents' && (
        <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-6 text-left max-w-4xl">
          <h3 className="font-bold text-neutral-200">Customer Intent Classification Maps</h3>
          <p className="text-xs text-neutral-450 leading-relaxed">Map trigger words or phrases to automated workflow paths. If the customer query contains these terms, it overrides regular chatbot queries to execute specialized visual builder nodes.</p>

          <form onSubmit={handleAddIntent} className="flex flex-wrap items-center gap-4 border-b border-neutral-900 pb-5 max-w-2xl">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                required
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="Trigger keyword (e.g. support)"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-300 placeholder-neutral-700"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <select
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-400"
              >
                <option value="Trigger Catalog Card reply">Trigger Catalog Card reply</option>
                <option value="Call check_order_status function">Call check_order_status function</option>
                <option value="Human Handoff (Route to support inbox)">Human Handoff (Route to support inbox)</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-955 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Map
            </button>
          </form>

          <div className="space-y-3 max-w-2xl">
            {intents.map((item, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/40 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs px-2.5 py-1 rounded-lg font-bold">"{item.phrase}"</span>
                  <div className="flex items-center gap-1.5 text-neutral-400 text-xs">
                    <span>➡️</span>
                    <span className="font-semibold text-neutral-300">{item.action}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveIntent(idx)}
                  className="p-1.5 rounded hover:bg-red-500/10 text-neutral-500 hover:text-red-400 transition-all"
                  title="Remove map"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONVERSATION SIMULATOR */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch min-h-[460px]">
          
          {/* Chat simulator panel */}
          <div className="lg:col-span-8 glass-card border border-neutral-850 p-4 md:p-6 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-neutral-250 uppercase tracking-wider">Active Chat Simulator</span>
              </div>
              <button
                onClick={() => setSimMessages([
                  { text: "Hello! What is the price of Malt?", isSender: false, time: "11:00 AM" },
                  { text: "Greetings! Our Premium Health Malt is priced at ₹350 per 500g package. Would you like to check details?", isSender: true, time: "11:00 AM" }
                ])}
                className="text-[10px] text-neutral-500 hover:text-neutral-300 font-semibold uppercase underline"
              >
                Clear History
              </button>
            </div>

            {/* Chat Body messages */}
            <div className="flex-1 bg-neutral-950/40 rounded-xl p-4 border border-neutral-900 overflow-y-auto space-y-4 max-h-[300px]">
              {simMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-xs leading-relaxed max-w-md text-left ${
                    msg.isSender
                      ? 'bg-neutral-900 border border-neutral-800 text-neutral-200 self-end ml-auto rounded-tr-none'
                      : 'bg-emerald-950/20 border border-emerald-900/30 text-neutral-200 self-start mr-auto rounded-tl-none'
                  }`}
                >
                  <span>{msg.text}</span>
                  <span className="block text-[8px] text-neutral-500 mt-1 font-mono text-right">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Input Message box */}
            <form onSubmit={handleSendSimMessage} className="mt-4 flex gap-3 border-t border-neutral-900 pt-4">
              <input
                type="text"
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
                placeholder="Type query to test AI prompt rules..."
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-neutral-950 border border-neutral-800 focus:outline-none focus:border-emerald-500 text-neutral-200"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </form>
          </div>

          {/* Parameters / debugger Right */}
          <div className="lg:col-span-4 glass-card border border-neutral-850 p-6 rounded-2xl flex flex-col justify-between text-left space-y-4">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block border-b border-neutral-900 pb-2">Simulator Logs</span>
              
              <div className="space-y-3.5">
                <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-1.5">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Active Prompt Profile</span>
                  <span className="text-xs font-bold text-neutral-300 font-mono block">{chatbotName}</span>
                </div>

                <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-1.5 font-mono text-[9.5px] text-neutral-450 leading-relaxed">
                  <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider block font-sans">Token Statistics</span>
                  <span>Input: 184 tokens</span><br />
                  <span>Output: 42 tokens</span><br />
                  <span>Cost estimate: $0.00015</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-500/5 border border-indigo-500/20 text-indigo-400 text-[10px] rounded-lg font-mono">
              💡 Simulator tests how the AI Agent parses prompts and FAQ documents before executing it on a live connected WhatsApp session.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
