'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Code,
  Copy,
  Check,
  Play,
  HelpCircle,
  AlertTriangle,
  Lock,
  Layers,
  Cpu,
  CornerDownRight
} from 'lucide-react';

interface Endpoint {
  category: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  name: string;
  desc: string;
  params: Array<{ name: string; type: string; required: boolean; desc: string }>;
  requestBody?: string;
  mockResponse: string;
}

export default function ApiExplorerPage() {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'go' | 'php'>('node');
  const [selectedEndpointIdx, setSelectedEndpointIdx] = useState(2); // Default to Send Text Message
  const [copiedCode, setCopiedCode] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<string | null>(null);

  // Form parameters overrides
  const [toParam, setToParam] = useState('1234567890');
  const [textParam, setTextParam] = useState('Hello from WhatsFlow API Explorer!');

  const endpoints: Endpoint[] = [
    {
      category: 'Sessions',
      method: 'GET',
      path: '/api/whatsapp-sessions',
      name: 'List Sessions',
      desc: 'Retrieves all active and disconnected WhatsApp connection sessions under this workspace.',
      params: [
        { name: 'status', type: 'string', required: false, desc: 'Filter sessions by status (Connected, Disconnected)' }
      ],
      mockResponse: `{
  "success": true,
  "sessions": [
    {
      "id": "sess_8a7c3b8e1f0c",
      "name": "Main Office line",
      "status": "Connected",
      "phone": "919988776655",
      "profileName": "WhatsFlow AI Agent",
      "battery": "92%",
      "createdAt": "2026-07-18T09:34:17Z"
    }
  ]
}`
    },
    {
      category: 'Sessions',
      method: 'POST',
      path: '/api/whatsapp-sessions',
      name: 'Create Session',
      desc: 'Registers a new WhatsApp connection session thread. subject to plan session thresholds.',
      params: [
        { name: 'name', type: 'string', required: true, desc: 'Descriptive title for this linked number' }
      ],
      requestBody: `{
  "name": "Primary Connection Line"
}`,
      mockResponse: `{
  "success": true,
  "message": "Session initialized successfully. QR Code generated.",
  "sessionId": "sess_9b6c4b2e1a0f",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS..."
}`
    },
    {
      category: 'Messages',
      method: 'POST',
      path: '/api/send-message',
      name: 'Send Text Message',
      desc: 'Sends a plain text message to a specific WhatsApp phone number or group chat.',
      params: [
        { name: 'to', type: 'string', required: true, desc: 'Destination phone number with country code (e.g. 919988776655)' },
        { name: 'text', type: 'string', required: true, desc: 'Plain text message content body' }
      ],
      requestBody: `{
  "to": "1234567890",
  "text": "Hello from WhatsFlow AI!"
}`,
      mockResponse: `{
  "success": true,
  "messageId": "msg_90a8f7b2c6d4e3",
  "status": "Queued",
  "recipient": "1234567890",
  "sentAt": "2026-07-18T09:37:16Z"
}`
    },
    {
      category: 'Messages',
      method: 'POST',
      path: '/api/send-message',
      name: 'Send Media Attachment',
      desc: 'Dispatches an image, video, document, or audio attachment using static file hosting URLs.',
      params: [
        { name: 'to', type: 'string', required: true, desc: 'Destination phone number' },
        { name: 'text', type: 'string', required: false, desc: 'Optional caption text' },
        { name: 'imageUrl', type: 'string', required: true, desc: 'Static hosted URL of attachment (e.g. JPG/PNG)' }
      ],
      requestBody: `{
  "to": "1234567890",
  "text": "Check out our invoice!",
  "imageUrl": "https://example.com/invoice.png"
}`,
      mockResponse: `{
  "success": true,
  "messageId": "msg_89a7c3b8e2f0",
  "status": "Sent",
  "mediaType": "image"
}`
    },
    {
      category: 'Contacts',
      method: 'GET',
      path: '/api/contacts',
      name: 'List Contacts',
      desc: 'Retrieves all synced contacts and active conversations synced from your linked device.',
      params: [
        { name: 'limit', type: 'integer', required: false, desc: 'Number of logs to list (default: 50)' },
        { name: 'search', type: 'string', required: false, desc: 'Filter contacts list by display name or number' }
      ],
      mockResponse: `{
  "success": true,
  "contacts": [
    {
      "id": "c_20b6f9a7c1d3",
      "name": "Amudhasurabiy customer",
      "phone": "918877665544",
      "leadStage": "Qualified",
      "lastInteraction": "2026-07-18T08:50:00Z"
    }
  ]
}`
    },
    {
      category: 'Webhooks',
      method: 'PUT',
      path: '/api/webhooks',
      name: 'Configure Webhook',
      desc: 'Updates the active HTTP webhook destination URL to receive incoming payloads.',
      params: [
        { name: 'webhookUrl', type: 'string', required: true, desc: 'Your server destination URL to send POST payloads' }
      ],
      requestBody: `{
  "webhookUrl": "https://api.yourserver.com/whatsapp/receiver"
}`,
      mockResponse: `{
  "success": true,
  "message": "Webhook URL modified.",
  "webhookUrl": "https://api.yourserver.com/whatsapp/receiver"
}`
    }
  ];

  const selectedEndpoint = endpoints[selectedEndpointIdx];

  const getGeneratedCode = () => {
    const toNum = toParam.trim() || '1234567890';
    const msgText = textParam.replace(/"/g, '\\"');

    // Create JSON strings
    let bodyObj: any = {};
    if (selectedEndpoint.name.includes('Text')) {
      bodyObj = { to: toNum, text: msgText };
    } else if (selectedEndpoint.name.includes('Media')) {
      bodyObj = { to: toNum, text: msgText, imageUrl: "https://example.com/invoice.png" };
    } else {
      try {
        bodyObj = JSON.parse(selectedEndpoint.requestBody || '{}');
      } catch {
        bodyObj = {};
      }
    }

    const payloadString = JSON.stringify(bodyObj, null, 2);

    switch (activeLang) {
      case 'curl':
        return `curl -X ${selectedEndpoint.method} https://api.whatsflow.ai${selectedEndpoint.path} \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" ${
    selectedEndpoint.method !== 'GET' ? `\\\n  -d '${JSON.stringify(bodyObj)}'` : ''
  }`;

      case 'node':
        return `import axios from 'axios';

const response = await axios({
  method: '${selectedEndpoint.method}',
  url: 'https://api.whatsflow.ai${selectedEndpoint.path}',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }${selectedEndpoint.method !== 'GET' ? `,\n  data: ${payloadString}` : ''}
});`;

      case 'python':
        return `import httpx

response = httpx.request(
    "${selectedEndpoint.method}",
    "https://api.whatsflow.ai${selectedEndpoint.path}",
    headers={
        "Authorization": "Bearer YOUR_API_KEY"
    }${selectedEndpoint.method !== 'GET' ? `,\n    json=${payloadString.replace(/true/g, 'True').replace(/false/g, 'False')}` : ''}
)`;

      case 'go':
        return `package main

import (
    "bytes"
    "net/http"
)

func main() {
    payload := []byte(\`${JSON.stringify(bodyObj)}\`)
    req, _ := http.NewRequest("${selectedEndpoint.method}", "https://api.whatsflow.ai${selectedEndpoint.path}", bytes.NewBuffer(payload))
    req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
    req.Header.Set("Content-Type", "application/json")
    
    client := &http.Client{}
    resp, _ := client.Do(req)
    defer resp.Body.Close()
}`;

      case 'php':
        return `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.whatsflow.ai${selectedEndpoint.path}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "${selectedEndpoint.method}",
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer YOUR_API_KEY",
    "Content-Type: application/json"
  ]${selectedEndpoint.method !== 'GET' ? `,\n  CURLOPT_POSTFIELDS => '${JSON.stringify(bodyObj)}'` : ''}
]);
$response = curl_exec($curl);
curl_close($curl);`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getGeneratedCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleExecuteRequest = () => {
    setExecuting(true);
    setExecutionResult(null);
    setTimeout(() => {
      setExecuting(false);
      setExecutionResult(selectedEndpoint.mockResponse);
    }, 1200);
  };

  // Group endpoints by category
  const categories = Array.from(new Set(endpoints.map((e) => e.category)));

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto h-[calc(100vh-80px)] flex flex-col">
      {/* Page Title */}
      <div className="shrink-0 flex items-center justify-between border-b border-neutral-900 pb-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            WhatsFlow AI API Explorer
          </h1>
          <p className="text-xs text-neutral-400">Twilio-style API interactive reference sandbox. Test endpoints and compile SDK snippets.</p>
        </div>
        <div className="flex gap-2">
          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1">
            <Lock className="w-3 h-3" /> Sandbox Active
          </span>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* Left Side: Endpoint links */}
        <div className="lg:col-span-3 overflow-y-auto border-r border-neutral-900 pr-4 space-y-5">
          {categories.map((cat) => (
            <div key={cat} className="space-y-1">
              <span className="block text-[9px] font-bold text-neutral-600 uppercase tracking-widest pl-2.5">{cat}</span>
              <div className="space-y-0.5">
                {endpoints
                  .map((e, idx) => ({ e, idx }))
                  .filter(({ e }) => e.category === cat)
                  .map(({ e, idx }) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedEndpointIdx(idx);
                        setExecutionResult(null);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                        selectedEndpointIdx === idx
                          ? 'bg-neutral-900 text-emerald-400 border border-neutral-800'
                          : 'text-neutral-450 hover:bg-neutral-900/40 hover:text-neutral-300'
                      }`}
                    >
                      <span className="truncate">{e.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                        e.method === 'GET'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : e.method === 'POST'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : e.method === 'PUT'
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>{e.method}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Center: Documentation and Params */}
        <div className="lg:col-span-4 overflow-y-auto pr-4 space-y-6 flex flex-col">
          
          {/* Header Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                selectedEndpoint.method === 'GET' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}>{selectedEndpoint.method}</span>
              <span className="font-mono text-xs text-neutral-350">{selectedEndpoint.path}</span>
            </div>
            <h2 className="text-base font-bold text-neutral-200">{selectedEndpoint.name}</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">{selectedEndpoint.desc}</p>
          </div>

          {/* Parameters Input */}
          <div className="space-y-3.5 border-t border-neutral-900 pt-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Request Parameters</span>
            
            {selectedEndpoint.params.map((p, i) => (
              <div key={i} className="space-y-1.5 p-3 rounded-xl border border-neutral-900 bg-neutral-950/20">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-neutral-300 font-mono">
                    {p.name} {p.required && <span className="text-red-400 font-sans">*</span>}
                  </span>
                  <span className="text-[9px] text-neutral-600 font-semibold uppercase">{p.type}</span>
                </div>
                
                {/* Check for dynamically editable parameters */}
                {selectedEndpoint.name.includes('Text') && p.name === 'to' ? (
                  <input
                    type="text"
                    value={toParam}
                    onChange={(e) => setToParam(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-300"
                  />
                ) : selectedEndpoint.name.includes('Text') && p.name === 'text' ? (
                  <input
                    type="text"
                    value={textParam}
                    onChange={(e) => setTextParam(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs bg-neutral-950 border border-neutral-850 focus:outline-none focus:border-emerald-500 text-neutral-300"
                  />
                ) : (
                  <p className="text-[10px] text-neutral-500 italic mt-1 font-mono">Configured default payload parameters</p>
                )}
                
                <p className="text-[10px] text-neutral-500 leading-relaxed pt-1.5 border-t border-neutral-900/40">{p.desc}</p>
              </div>
            ))}
          </div>

        </div>

        {/* Right Side: Code Playground & Mock Sandbox Response */}
        <div className="lg:col-span-5 flex flex-col justify-between overflow-y-auto space-y-6">
          
          {/* Code Selection and copy */}
          <div className="glass-card border border-neutral-850 rounded-2xl p-5 flex flex-col space-y-4">
            
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <div className="flex gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-850">
                {(['node', 'python', 'go', 'php', 'curl'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${
                      activeLang === lang
                        ? 'bg-neutral-800 text-emerald-400'
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {lang === 'node' ? 'JS' : lang}
                  </button>
                ))}
              </div>
              <button
                onClick={copyToClipboard}
                className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-neutral-250 transition-all"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="bg-neutral-950/80 rounded-xl p-4 border border-neutral-900 font-mono text-[10px] leading-relaxed text-neutral-400 text-left overflow-x-auto min-h-[170px]">
              <pre>{getGeneratedCode()}</pre>
            </div>

            <button
              onClick={handleExecuteRequest}
              disabled={executing}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-neutral-950 text-xs font-bold uppercase tracking-wider hover:bg-emerald-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Play className="w-3.5 h-3.5" /> {executing ? 'Executing Sandbox Request...' : 'Trigger Sandbox Request'}
            </button>

          </div>

          {/* Sandbox JSON Response Panel */}
          <div className="flex-1 glass-card border border-neutral-855 rounded-2xl p-5 flex flex-col justify-between min-h-[220px]">
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Sandbox API Response (JSON)</span>
              {executionResult && (
                <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/35 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase font-mono">200 OK</span>
              )}
            </div>

            <div className="flex-1 bg-neutral-950/90 rounded-xl p-4 border border-neutral-900 font-mono text-[10px] leading-relaxed text-neutral-450 text-left overflow-y-auto mt-4 max-h-[200px]">
              {executionResult ? (
                <pre>{executionResult}</pre>
              ) : (
                <div className="h-full flex items-center justify-center text-neutral-600 gap-1.5">
                  <Play className="w-4 h-4" /> Press "Trigger Sandbox Request" to verify payload dispatches.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
