/**
 * Monager AI Copilot View
 * Intelligent Financial Advisor with Structured Proposal & Confirmation Engine.
 * Features: Multi-turn Chat, PDF Budget Parsing, and Explicit [APPLY] mutation workflows.
 */

import { aiService } from '../services/ai.js';
import { storageService } from '../services/storage.js';
import { currencyService } from '../services/currency.js';

export function renderAI(container) {
  const state = storageService.getState();
  const curr = state.profile?.primaryCurrency || 'COP';
  const chatHistory = state.aiChatHistory || [];

  container.innerHTML = `
    <div class="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in font-mono">
      
      <!-- Top Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span class="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Financial Intelligence Copilot</span>
          <h1 class="text-2xl md:text-3xl font-black text-white tracking-tight">Monager AI Copilot</h1>
          <p class="text-xs text-slate-400 mt-0.5">Ask questions, plan savings velocity, or draft budget reallocations with confirmation safety.</p>
        </div>
        <div class="flex items-center gap-2">
          <label for="pdf-upload-input" class="btn-secondary px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <span class="material-icons-outlined text-sm">upload_file</span>
            <span>Parse Budget PDF</span>
          </label>
          <input type="file" id="pdf-upload-input" accept="application/pdf" class="hidden" />
        </div>
      </div>

      <!-- Main Layout: Active Chat + Proposal Stack -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left: Chat View (8 cols) -->
        <div class="lg:col-span-8 glass-card p-6 rounded-2xl border border-white/10 flex flex-col h-[580px]">
          
          <!-- Message Feed -->
          <div id="ai-chat-feed" class="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            ${chatHistory.map(msg => `
              <div class="flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}">
                <div class="max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-emerald-600/90 text-white' : 'bg-white/[0.04] border border-white/10 text-slate-200'}">
                  <div class="text-[10px] opacity-70 mb-1 uppercase font-bold flex items-center gap-1">
                    <span class="material-icons-outlined text-[12px]">${msg.role === 'user' ? 'person' : 'smart_toy'}</span>
                    <span>${msg.role === 'user' ? 'You' : 'Monager AI'}</span>
                  </div>
                  <div class="markdown-body whitespace-pre-wrap">${formatAiMarkdown(msg.text)}</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Pending Proposals Container (In-chat dynamic banner) -->
          <div id="active-proposal-slot" class="mt-3"></div>

          <!-- Chat Input Form -->
          <form id="ai-chat-form" class="mt-4 flex gap-2 pt-3 border-t border-white/10">
            <input type="text" id="ai-chat-input" placeholder="e.g. Can I afford COP 300,000 for groceries? Or move 50k to Kenya..."
              class="flex-1 bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500" />
            <button type="submit" id="ai-send-btn" class="btn-primary px-5 py-3 rounded-xl text-xs font-bold flex items-center gap-1">
              <span class="material-icons-outlined text-sm">send</span>
            </button>
          </form>

        </div>

        <!-- Right: Prompts & Financial Context Cards (4 cols) -->
        <div class="lg:col-span-4 space-y-4">
          
          <!-- Sample Actionable Prompts -->
          <div class="glass-card p-5 rounded-2xl border border-white/10 space-y-3">
            <div class="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase">
              <span class="material-icons-outlined text-sm text-emerald-400">tips_and_updates</span>
              <span>Quick Commands</span>
            </div>
            <div class="space-y-2">
              <button class="quick-prompt-btn w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-slate-300 transition"
                data-prompt="Can I afford to buy something that costs 200000 COP?">
                "Can I afford to buy something that costs 200000 COP?"
              </button>
              <button class="quick-prompt-btn w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-slate-300 transition"
                data-prompt="How am I doing financially?">
                "How am I doing financially?"
              </button>
              <button class="quick-prompt-btn w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-slate-300 transition"
                data-prompt="How much have I spent this month?">
                "How much have I spent this month?"
              </button>
              <button class="quick-prompt-btn w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-slate-300 transition"
                data-prompt="Move 10% of my Travel budget to my Goals budget">
                "Move 10% of my Travel budget to my Goals budget"
              </button>
              <button class="quick-prompt-btn w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 text-[11px] text-slate-300 transition"
                data-prompt="What should I improve about my spending?">
                "What should I improve about my spending?"
              </button>
            </div>
          </div>

          <!-- Proposal Safety Guarantee Badge -->
          <div class="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-2 leading-relaxed">
            <div class="flex items-center gap-1.5 font-bold uppercase text-[11px] text-blue-300">
              <span class="material-icons-outlined text-sm">verified_user</span>
              <span>Monager AI Safety Protocol</span>
            </div>
            <p class="text-[11px] text-slate-300">
              AI never mutates your financial ledger silently. When a mutation is suggested, a structured preview is generated requiring your explicit <strong>[APPLY]</strong> confirmation.
            </p>
          </div>

        </div>

      </div>

    </div>
  `;

  attachAIEvents(container);
}

function formatAiMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');
}

function attachAIEvents(container) {
  const form = container.querySelector('#ai-chat-form');
  const input = container.querySelector('#ai-chat-input');
  const feed = container.querySelector('#ai-chat-feed');
  const proposalSlot = container.querySelector('#active-proposal-slot');
  const pdfInput = container.querySelector('#pdf-upload-input');
  const sendBtn = container.querySelector('#ai-send-btn');

  // Scroll to bottom
  if (feed) feed.scrollTop = feed.scrollHeight;

  async function handleSend(userText) {
    if (!userText || !userText.trim()) return;

    // Append user message immediately
    storageService.update(state => ({
      ...state,
      aiChatHistory: [
        ...(state.aiChatHistory || []),
        { role: 'user', text: userText }
      ]
    }));

    renderAI(container);

    // Disable input while processing
    const currentInput = container.querySelector('#ai-chat-input');
    const currentSendBtn = container.querySelector('#ai-send-btn');
    if (currentInput) currentInput.disabled = true;
    if (currentSendBtn) {
      currentSendBtn.disabled = true;
      currentSendBtn.innerHTML = `<span class="material-icons-outlined text-sm animate-spin">refresh</span>`;
    }

    const res = await aiService.sendMessage(userText);

    // Append AI response
    storageService.update(state => ({
      ...state,
      aiChatHistory: [
        ...(state.aiChatHistory || []),
        { role: 'model', text: res.reply }
      ]
    }));

    renderAI(container);

    // If there is a structured proposal, render the confirmation card
    if (res.proposal) {
      renderProposalCard(container, res.proposal);
    }
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = input.value;
    input.value = '';
    handleSend(val);
  });

  // Quick Prompt buttons
  container.querySelectorAll('.quick-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      handleSend(btn.dataset.prompt);
    });
  });

  // PDF Upload handler
  pdfInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const prevHistory = storageService.getState().aiChatHistory || [];
    storageService.update(s => ({
      ...s,
      aiChatHistory: [
        ...prevHistory,
        { role: 'user', text: `Uploaded Statement PDF: ${file.name} (${Math.round(file.size / 1024)} KB)` },
        { role: 'model', text: `🔄 Analyzing statement document "${file.name}"... Parsing transactions and line items.` }
      ]
    }));
    renderAI(container);

    try {
      const res = await fetch('/api/budget/parse-pdf', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        const parsedCount = data.transactions?.length || 0;
        const totalParsed = data.totalAmount || 0;

        storageService.update(s => ({
          ...s,
          aiChatHistory: [
            ...(s.aiChatHistory || []),
            {
              role: 'model',
              text: `✅ **PDF Statement Parsed Successfully**\n- Extracted **${parsedCount} transactions** totalling **COP ${totalParsed.toLocaleString()}**.\n- Detected categories: ${Object.keys(data.categoryBreakdown || {}).join(', ')}.\n\nWould you like me to import these transactions into your active Expense Ledger?`
            }
          ]
        }));
      } else {
        throw new Error('PDF parse endpoint returned error');
      }
    } catch (err) {
      storageService.update(s => ({
        ...s,
        aiChatHistory: [
          ...(s.aiChatHistory || []),
          { role: 'model', text: `⚠️ Could not parse PDF file automatically: ${err.message}. You can manually paste expense text here and I will structure it for you.` }
        ]
      }));
    }

    renderAI(container);
  });
}

function renderProposalCard(container, proposal) {
  const proposalSlot = container.querySelector('#active-proposal-slot');
  if (!proposalSlot) return;

  proposalSlot.innerHTML = `
    <div class="p-5 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-xs font-mono animate-fade-in space-y-3.5 shadow-lg shadow-amber-500/5">
      <div class="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
        <div class="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
          <span class="material-icons-outlined text-base">rule</span>
          <span>PROPOSED CHANGE</span>
        </div>
        <span class="px-2 py-0.5 rounded text-[10px] bg-amber-500/25 text-amber-300 font-bold tracking-wide">CONFIRMATION REQUIRED</span>
      </div>

      <div>
        <h4 class="font-bold text-white text-sm tracking-tight">${proposal.title}</h4>
        <p class="text-slate-300 text-xs mt-0.5">${proposal.description}</p>
      </div>

      <!-- Diff Comparison Breakdown -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        ${proposal.changes.map(ch => `
          <div class="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-1">
            <span class="text-slate-400 font-bold block text-[11px]">${ch.item}</span>
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-400 font-mono">Current: <span class="line-through text-slate-300">${ch.from}</span></span>
              <span class="text-emerald-400 font-bold font-mono">New: ${ch.to}</span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Expected Effect -->
      <div class="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1">
        <span class="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Expected effect:</span>
        <p class="text-xs text-amber-200/90 leading-relaxed font-sans">${proposal.consequenceText}</p>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-amber-500/20">
        <button id="dismiss-proposal-btn" class="btn-secondary px-4 py-2 rounded-xl text-xs font-bold hover:text-white transition">
          CANCEL
        </button>
        <button id="apply-proposal-btn" class="btn-primary px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20">
          <span class="material-icons-outlined text-sm font-bold">check</span>
          <span>APPLY CHANGES</span>
        </button>
      </div>
    </div>
  `;

  proposalSlot.querySelector('#dismiss-proposal-btn')?.addEventListener('click', () => {
    proposalSlot.innerHTML = '';
  });

  proposalSlot.querySelector('#apply-proposal-btn')?.addEventListener('click', () => {
    proposal.execute();
    proposalSlot.innerHTML = `
      <div class="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-300 font-mono flex items-center gap-2 animate-fade-in">
        <span class="material-icons-outlined text-base">check_circle</span>
        <span><strong>Applied:</strong> Financial changes have been committed to your active ledger and allocations.</span>
      </div>
    `;
    setTimeout(() => {
      renderAI(container);
    }, 1400);
  });
}
