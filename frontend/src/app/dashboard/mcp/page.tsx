'use client';

import React, { useState } from 'react';
import {
  Cpu,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  Code,
  CheckCircle,
  HelpCircle,
  Key,
  Info
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

export default function McpIntegrationPage() {
  const { workspace } = useAuth();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const apiKey = workspace?.apiKey || 'YOUR_API_KEY';
  const apiSecret = workspace?.apiSecret || 'YOUR_API_SECRET';

  const claudeConfig = `{
  "mcpServers": {
    "whatsflow-ai": {
      "command": "npx",
      "args": ["-y", "@whatsflow/mcp-server"],
      "env": {
        "WHATSFLOW_API_KEY": "${apiKey}",
        "WHATSFLOW_API_SECRET": "${apiSecret}"
      }
    }
  }
}`;

  const n8nConfig = `{
  "node": "n8n-nodes-whatsflow.mcpToolCall",
  "parameters": {
    "apiKey": "${apiKey}",
    "apiSecret": "${apiSecret}",
    "tools": ["send_message", "list_sessions", "verify_number"]
  }
}`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto overflow-y-auto pb-10">
      
      {/* Header */}
      <div className="border-b border-neutral-900 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2">
            Model Context Protocol (MCP) Integration
          </h1>
          <p className="text-xs text-neutral-400">Connect WhatsFlow AI directly to Claude Code, Claude Desktop, or n8n as a remote tools service.</p>
        </div>
        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/35 text-indigo-400 font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1">
          <Cpu className="w-3.5 h-3.5" /> MCP Server Ready
        </span>
      </div>

      {/* Info notice */}
      <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/25 flex gap-3 text-neutral-350 text-xs leading-relaxed">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-neutral-250 block mb-1">What is Model Context Protocol?</span>
          <span>
            Model Context Protocol is an open standard that allows LLMs (like Claude) to securely execute client-side tools. By adding our remote MCP server config, your AI agent can automatically query your WhatsApp contacts, list session status, check deliveries, and compose responses using natural text commands.
          </span>
        </div>
      </div>

      {/* Section 1: Claude Desktop configuration */}
      <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-center">
              <Terminal className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-200 text-sm">Claude Desktop Setup</h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">Append this server profile block inside your claude_desktop_config.json file.</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(claudeConfig, 'claude')}
            className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-neutral-250 transition-all"
            title="Copy Config"
          >
            {copiedCode === 'claude' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="bg-neutral-950/90 rounded-xl p-4 border border-neutral-900 font-mono text-[10.5px] leading-relaxed text-neutral-400 overflow-x-auto">
          <pre>{claudeConfig}</pre>
        </div>

        <p className="text-[10px] text-neutral-500 leading-relaxed font-mono">
          💡 File locations:<br />
          - macOS: ~/Library/Application Support/Claude/claude_desktop_config.json<br />
          - Windows: %APPDATA%\\Claude\\claude_desktop_config.json
        </p>
      </div>

      {/* Section 2: n8n Integration */}
      <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-lg bg-neutral-950 border border-neutral-850 flex items-center justify-center">
              <Code className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-200 text-sm">n8n Workflow Node parameters</h3>
              <p className="text-[10px] text-neutral-500 mt-0.5">Parameters schema to integrate WhatsFlow AI tools in custom MCP toolcall workflow nodes.</p>
            </div>
          </div>
          <button
            onClick={() => copyToClipboard(n8nConfig, 'n8n')}
            className="p-2 rounded-lg bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 text-neutral-400 hover:text-neutral-250 transition-all"
            title="Copy config"
          >
            {copiedCode === 'n8n' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="bg-neutral-950/90 rounded-xl p-4 border border-neutral-900 font-mono text-[10.5px] leading-relaxed text-neutral-400 overflow-x-auto">
          <pre>{n8nConfig}</pre>
        </div>
      </div>

      {/* Section 3: Available Tools schema */}
      <div className="p-6 rounded-2xl border border-neutral-900 bg-neutral-900/10 space-y-4">
        <h3 className="font-bold text-neutral-200 text-sm">Exposed Server Tools</h3>
        <p className="text-xs text-neutral-400 leading-relaxed">Our remote server exposes standard OpenAPI functions as callable context tools for LLMs:</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/30 text-xs text-left space-y-1">
            <span className="font-bold text-emerald-400 font-mono text-[11px]">send_message</span>
            <p className="text-[10px] text-neutral-500">Sends text/media replies to any destination number.</p>
          </div>
          <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/30 text-xs text-left space-y-1">
            <span className="font-bold text-emerald-400 font-mono text-[11px]">list_sessions</span>
            <p className="text-[10px] text-neutral-500">Returns connections status indicators for linked devices.</p>
          </div>
          <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/30 text-xs text-left space-y-1">
            <span className="font-bold text-emerald-400 font-mono text-[11px]">verify_number</span>
            <p className="text-[10px] text-neutral-500">Checks if a target number possesses a WhatsApp account.</p>
          </div>
          <div className="p-4 rounded-xl border border-neutral-900 bg-neutral-950/30 text-xs text-left space-y-1">
            <span className="font-bold text-emerald-400 font-mono text-[11px]">fetch_contacts</span>
            <p className="text-[10px] text-neutral-500">ListsSynced address book items from linked account.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
