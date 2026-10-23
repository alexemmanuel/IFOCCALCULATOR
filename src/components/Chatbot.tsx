import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  SimulationParameters,
  AnalyzedCompany,
  CurrencyCode
} from '../types';
import {
  ChatMessage,
  DecisionTreeNode,
  BotActionPayload,
  BotSimulationSummary,
  QuickActionChip
} from '../types/chatbot';
import {
  processChatbotQuery,
  DEFAULT_QUICK_ACTIONS,
  DECISION_TREES,
  formatMoney
} from '../utils/chatbotEngine';
import { formatCurrency, formatPercent } from '../utils/financialEngine';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  TrendingUp,
  ShieldCheck,
  Layers,
  FileText,
  ChevronRight,
  ArrowLeft,
  DollarSign,
  Activity,
  ArrowRight,
  HelpCircle,
  BarChart3,
  Compass
} from 'lucide-react';

interface ChatbotProps {
  theme: 'dark' | 'light';
  params: SimulationParameters;
  analyzedCompany: AnalyzedCompany;
  currency: CurrencyCode;
  activeTab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology';
  onApplySimulationParams: (newParams: Partial<SimulationParameters>, company?: AnalyzedCompany, targetTab?: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology') => void;
  onSimulateBoth: (newParams: Partial<SimulationParameters>, company?: AnalyzedCompany, withdrawalRate?: number) => void;
  onSelectCompany: (company: AnalyzedCompany) => void;
  onSwitchTab: (tab: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology') => void;
  onCurrencyChange: (newCurrency: CurrencyCode) => void;
  onDownloadReport: () => void;
  onExportData: () => void;
  onToggleStressTest: (enabled: boolean) => void;
}

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting_1',
  sender: 'bot',
  text: `👋 **Welcome to the IFOC Institutional Quant Assistant!**\n\nI can answer questions across our entire financial methodology, guide you with **interactive decision trees**, and **simulate any investment across horizons up to 200 years** using either the Monte Carlo Forecaster, the Safe Withdrawal Calculator, or **both calculators concurrently**.\n\nTry clicking a quick prompt below or type your custom simulation query:`,
  timestamp: Date.now(),
  quickActions: DEFAULT_QUICK_ACTIONS
};

export const Chatbot: React.FC<ChatbotProps> = ({
  theme,
  params,
  analyzedCompany,
  currency,
  activeTab,
  onApplySimulationParams,
  onSimulateBoth,
  onSelectCompany,
  onSwitchTab,
  onCurrencyChange,
  onDownloadReport,
  onExportData,
  onToggleStressTest
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_GREETING]);
  const [inputText, setInputText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeDecisionTree, setActiveDecisionTree] = useState<DecisionTreeNode | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isProcessing]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  // Execute bot action payload
  const handleExecuteAction = useCallback((action: BotActionPayload) => {
    switch (action.type) {
      case 'SIMULATE_FORECAST':
        onApplySimulationParams(action.params || {}, action.company, action.targetTab || 'forecast');
        if (action.currency && action.currency !== currency) onCurrencyChange(action.currency);
        break;

      case 'SIMULATE_WITHDRAWAL':
        onApplySimulationParams(action.params || {}, action.company, 'withdrawal');
        if (action.currency && action.currency !== currency) onCurrencyChange(action.currency);
        break;

      case 'SIMULATE_BOTH':
        onSimulateBoth(action.params || {}, action.company, action.withdrawalRate || 0.04);
        if (action.currency && action.currency !== currency) onCurrencyChange(action.currency);
        break;

      case 'SET_HORIZON':
        if (action.horizonYears) onApplySimulationParams({ horizonYears: action.horizonYears });
        break;

      case 'SET_CAPITAL':
        if (action.initialCapital) onApplySimulationParams({ initialCapital: action.initialCapital });
        break;

      case 'SWITCH_CURRENCY':
        if (action.currency) onCurrencyChange(action.currency);
        break;

      case 'SELECT_COMPANY':
        if (action.company) onSelectCompany(action.company);
        break;

      case 'SWITCH_TAB':
        if (action.targetTab) onSwitchTab(action.targetTab);
        break;

      case 'TOGGLE_STRESS_TEST':
        onToggleStressTest(action.enableStressTest ?? true);
        if (action.params) onApplySimulationParams(action.params);
        break;

      case 'DOWNLOAD_REPORT':
        onDownloadReport();
        break;

      case 'EXPORT_JSON':
        onExportData();
        break;
    }
  }, [
    currency,
    onApplySimulationParams,
    onSimulateBoth,
    onSelectCompany,
    onSwitchTab,
    onCurrencyChange,
    onDownloadReport,
    onExportData,
    onToggleStressTest
  ]);

  // Handle user query submission
  const handleSubmitQuery = useCallback((queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    // Process using comprehensive Chatbot engine
    setTimeout(() => {
      const result = processChatbotQuery(trimmed, params, analyzedCompany, activeTab);

      if (result.decisionTreeNode) {
        setActiveDecisionTree(result.decisionTreeNode);
      }

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'bot',
        text: result.text,
        timestamp: Date.now(),
        actionPayload: result.actionPayload,
        simulationSummary: result.simulationSummary,
        decisionTreeNode: result.decisionTreeNode,
        quickActions: result.quickActions
      };

      setMessages(prev => [...prev, botMsg]);
      setIsProcessing(false);

      // Proactively execute action if user explicitly commanded a direct switch or simulation
      if (
        result.actionPayload &&
        (trimmed.toLowerCase().startsWith('switch tab') ||
         trimmed.toLowerCase().startsWith('switch currency'))
      ) {
        handleExecuteAction(result.actionPayload);
      }
    }, 250);
  }, [params, analyzedCompany, activeTab, handleExecuteAction]);

  // Handle decision tree choice click
  const handleDecisionTreeOptionClick = (option: { label: string; description?: string; nextNodeId?: string; actionPayload?: BotActionPayload }) => {
    // Record user selection
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: option.label,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    setTimeout(() => {
      if (option.nextNodeId && DECISION_TREES[option.nextNodeId]) {
        const nextNode = DECISION_TREES[option.nextNodeId];
        setActiveDecisionTree(nextNode);

        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `**${nextNode.title}**\n\n${nextNode.prompt}${nextNode.notes ? `\n\n*${nextNode.notes}*` : ''}`,
          timestamp: Date.now(),
          decisionTreeNode: nextNode
        };
        setMessages(prev => [...prev, botMsg]);
      } else if (option.actionPayload) {
        // Reached an action node
        handleExecuteAction(option.actionPayload);
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: `### 🎯 Strategy Configured & Executed!\n\nI have configured **${option.actionPayload.title}** and applied the parameters directly to your active workspace. You can review the updated projections right now.`,
          timestamp: Date.now(),
          actionPayload: option.actionPayload,
          quickActions: DEFAULT_QUICK_ACTIONS
        };
        setMessages(prev => [...prev, botMsg]);
        setActiveDecisionTree(null);
      }
      setIsProcessing(false);
    }, 200);
  };

  // Reset conversation
  const handleResetChat = () => {
    setMessages([INITIAL_GREETING]);
    setActiveDecisionTree(null);
    setInputText('');
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 group border ${
            isDark
              ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-100 border-amber-500/40 shadow-amber-500/10'
              : 'bg-white/95 hover:bg-slate-50 text-slate-900 border-amber-500/40 shadow-slate-900/10'
          } backdrop-blur-md cursor-pointer`}
          title="Open IFOC Quant Assistant & Simulator"
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-md">
              <Bot className="w-5 h-5 text-slate-950" />
            </div>
            {/* Live pulsing status badge */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-black tracking-wider uppercase flex items-center gap-1.5 text-amber-500">
              <Sparkles className="w-3.5 h-3.5" />
              <span>IFOC Assistant</span>
            </div>
            <div className="text-[11px] opacity-75 font-medium">
              Simulate 1–200Y & Ask Anything
            </div>
          </div>
        </button>
      )}

      {/* Expandable Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl border transition-all duration-200 backdrop-blur-xl ${
            isMinimized
              ? 'w-80 h-14 overflow-hidden'
              : 'w-[94vw] sm:w-[500px] h-[82vh] max-h-[720px]'
          } ${
            isDark
              ? 'bg-slate-950/95 border-slate-800 text-slate-100 shadow-amber-500/5'
              : 'bg-white/98 border-slate-200 text-slate-900 shadow-slate-900/15'
          }`}
        >
          {/* Header Bar */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b select-none ${
              isDark ? 'border-slate-800/80 bg-slate-900/70' : 'border-slate-200/80 bg-slate-50/90'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-500">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                  <span>IFOC Quant Assistant</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                    200Y Engine
                  </span>
                </div>
                {!isMinimized && (
                  <div className="text-[10px] text-slate-400">
                    Active: {analyzedCompany.ticker ? `${analyzedCompany.name} (${analyzedCompany.ticker})` : analyzedCompany.name}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                className="p-1.5 rounded-md hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-md hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-slate-800/40 text-slate-400 hover:text-slate-200 transition-colors"
                title="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Chat Body (Hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-slate-700">
                {messages.map((msg) => {
                  const isBot = msg.sender === 'bot';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-xl px-4 py-3 leading-relaxed border ${
                          isBot
                            ? isDark
                              ? 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-sm'
                              : 'bg-slate-100/90 border-slate-200 text-slate-900 shadow-sm'
                            : 'bg-amber-500 text-slate-950 font-medium border-amber-600 shadow-sm'
                        }`}
                      >
                        {/* Message Text with Simple Markdown Formatting */}
                        <div className="whitespace-pre-wrap break-words space-y-1.5">
                          {msg.text.split('\n\n').map((paragraph, idx) => {
                            // Header matching
                            if (paragraph.startsWith('### ')) {
                              return (
                                <h4 key={idx} className="font-bold text-sm text-amber-500 mt-1 mb-1">
                                  {paragraph.replace('### ', '')}
                                </h4>
                              );
                            }
                            return <p key={idx}>{paragraph}</p>;
                          })}
                        </div>

                        {/* Interactive Decision Tree Node Card */}
                        {msg.decisionTreeNode && (
                          <div className={`mt-3 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-300'} space-y-2`}>
                            <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5" />
                              <span>Select an Option to Proceed:</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {msg.decisionTreeNode.options.map((opt, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => handleDecisionTreeOptionClick(opt)}
                                  className={`text-left p-2.5 rounded-lg border transition-all ${
                                    isDark
                                      ? 'bg-slate-950/70 hover:bg-slate-800 border-slate-800 hover:border-amber-500/60 text-slate-200'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-amber-500/60 text-slate-800'
                                  } group flex items-start justify-between gap-2`}
                                >
                                  <div>
                                    <div className="font-semibold text-xs text-amber-400 group-hover:text-amber-300 flex items-center gap-1.5">
                                      <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>{opt.label}</span>
                                    </div>
                                    {opt.description && (
                                      <div className="text-[10px] text-slate-400 mt-0.5 pl-5">
                                        {opt.description}
                                      </div>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                            {msg.decisionTreeNode.parentNodeId && (
                              <button
                                onClick={() => {
                                  const parent = DECISION_TREES[msg.decisionTreeNode!.parentNodeId!];
                                  if (parent) {
                                    handleDecisionTreeOptionClick({
                                      label: '← Back to Previous Step',
                                      nextNodeId: parent.id
                                    });
                                  }
                                }}
                                className="mt-1 text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                              >
                                <ArrowLeft className="w-3 h-3" />
                                <span>Back to previous question</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Interactive Simulation Summary Card */}
                        {msg.simulationSummary && (
                          <div
                            className={`mt-3 p-3 rounded-lg border ${
                              isDark
                                ? 'bg-slate-950/80 border-amber-500/30 text-slate-200'
                                : 'bg-white border-amber-500/30 text-slate-900'
                            } shadow-inner space-y-2.5`}
                          >
                            <div className="flex items-center justify-between border-b pb-2 border-slate-800/60">
                              <div className="flex items-center gap-1.5">
                                <Activity className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-xs text-amber-400">
                                  {msg.simulationSummary.calculatorType === 'both'
                                    ? 'Dual Engine Simulation Summary'
                                    : msg.simulationSummary.calculatorType === 'withdrawal'
                                    ? 'Safe Withdrawal Engine Summary'
                                    : 'Monte Carlo Forecaster Summary'}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                                {msg.simulationSummary.horizonYears} Years
                              </span>
                            </div>

                            {/* Forecaster Section */}
                            {(msg.simulationSummary.calculatorType === 'forecast' || msg.simulationSummary.calculatorType === 'both') && (
                              <div className="grid grid-cols-2 gap-2 text-[11px]">
                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Median Terminal Wealth</div>
                                  <div className="text-sm font-black text-emerald-400">
                                    {formatMoney(msg.simulationSummary.medianTerminalWealth || 0, msg.simulationSummary.currency)}
                                  </div>
                                </div>
                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Real Compound CAGR</div>
                                  <div className="text-sm font-black text-amber-400">
                                    {formatPercent(msg.simulationSummary.medianCAGR || 0)}
                                  </div>
                                </div>
                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800 col-span-2">
                                  <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>5th %ile (Bear): {formatMoney(msg.simulationSummary.p5TerminalWealth || 0, msg.simulationSummary.currency)}</span>
                                    <span>95th %ile (Bull): {formatMoney(msg.simulationSummary.p95TerminalWealth || 0, msg.simulationSummary.currency)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Withdrawal Section */}
                            {(msg.simulationSummary.calculatorType === 'withdrawal' || msg.simulationSummary.calculatorType === 'both') && (
                              <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[11px]">
                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Terminal Portfolio</div>
                                  <div className={`text-sm font-black ${msg.simulationSummary.portfolioSurvival ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {formatMoney(msg.simulationSummary.terminalPortfolio || 0, msg.simulationSummary.currency)}
                                  </div>
                                </div>
                                <div className="p-2 rounded bg-slate-900/50 border border-slate-800">
                                  <div className="text-[10px] text-slate-400">Opportunity Cost</div>
                                  <div className="text-sm font-black text-amber-400">
                                    {formatMoney(msg.simulationSummary.netOpportunityCost || 0, msg.simulationSummary.currency)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Direct Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              <button
                                onClick={() => {
                                  if (msg.actionPayload) handleExecuteAction(msg.actionPayload);
                                  onSwitchTab('forecast');
                                }}
                                className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow transition-colors"
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>Inspect in Forecaster</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (msg.actionPayload) handleExecuteAction(msg.actionPayload);
                                  onSwitchTab('withdrawal');
                                }}
                                className="flex-1 py-1.5 px-2.5 rounded-lg text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                                <span>Inspect in Withdrawal</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Standalone Action Payload Button */}
                        {msg.actionPayload && !msg.simulationSummary && (
                          <div className="mt-2.5 pt-2 border-t border-slate-800/40">
                            <button
                              onClick={() => handleExecuteAction(msg.actionPayload!)}
                              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center gap-1.5 shadow transition-colors"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                              <span>{msg.actionPayload.title}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isProcessing && (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center animate-spin">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    <span>Calculating statistical paths & financial models...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Chips Bar */}
              <div
                className={`p-2 border-t overflow-x-auto whitespace-nowrap scrollbar-none flex gap-1.5 ${
                  isDark ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50'
                }`}
              >
                {DEFAULT_QUICK_ACTIONS.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => handleSubmitQuery(chip.promptText)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all ${
                      isDark
                        ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-200 hover:text-amber-400 hover:border-amber-500/50'
                        : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 hover:text-amber-600 hover:border-amber-500/50'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Box */}
              <div
                className={`p-3 border-t ${
                  isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'
                }`}
              >
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleSubmitQuery(inputText);
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder="Simulate 200Y investments, ask questions, or run both calculators..."
                    className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isProcessing}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition-all shadow-md"
                    title="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-slate-500">
                  <span>Simulates Forecaster & Withdrawal up to 200 Years</span>
                  <span>Decision Tree + Intent Triggered</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
