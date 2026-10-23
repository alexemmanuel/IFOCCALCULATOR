import { SimulationParameters, AnalyzedCompany, CurrencyCode } from './index';

export type ChatSender = 'user' | 'bot' | 'system';

export interface QuickActionChip {
  id: string;
  label: string;
  promptText: string;
  icon?: string;
  category?: 'simulation' | 'decision_tree' | 'withdrawal' | 'info' | 'stress';
}

export type BotActionType =
  | 'SIMULATE_FORECAST'
  | 'SIMULATE_WITHDRAWAL'
  | 'SIMULATE_BOTH'
  | 'SET_HORIZON'
  | 'SET_CAPITAL'
  | 'SWITCH_CURRENCY'
  | 'SELECT_COMPANY'
  | 'SWITCH_TAB'
  | 'TOGGLE_STRESS_TEST'
  | 'DOWNLOAD_REPORT'
  | 'EXPORT_JSON';

export interface BotActionPayload {
  type: BotActionType;
  title: string;
  description: string;
  targetTab?: 'forecast' | 'withdrawal' | 'investments' | 'horizons' | 'historical' | 'methodology';
  params?: Partial<SimulationParameters>;
  company?: AnalyzedCompany;
  currency?: CurrencyCode;
  withdrawalRate?: number; // e.g. 0.04
  horizonYears?: number;
  initialCapital?: number;
  enableStressTest?: boolean;
}

export interface BotSimulationSummary {
  calculatorType: 'forecast' | 'withdrawal' | 'both';
  companyName: string;
  ticker?: string;
  horizonYears: number;
  initialCapital: number;
  currency: CurrencyCode;
  expectedReturn: number;
  annualVolatility: number;
  // Forecaster stats:
  medianTerminalWealth?: number;
  p5TerminalWealth?: number;
  p95TerminalWealth?: number;
  medianCAGR?: number;
  probGoodProfits?: number;
  probFailure?: number;
  // Withdrawal stats:
  withdrawalRate?: number;
  annualWithdrawalAmount?: number;
  terminalPortfolio?: number;
  totalWithdrawn?: number;
  netOpportunityCost?: number;
  opportunityCostMultiple?: number;
  portfolioSurvival?: boolean;
}

export interface DecisionTreeOption {
  label: string;
  description?: string;
  nextNodeId?: string;
  actionPayload?: BotActionPayload;
}

export interface DecisionTreeNode {
  id: string;
  treeId: string;
  title: string;
  prompt: string;
  notes?: string;
  parentNodeId?: string;
  options: DecisionTreeOption[];
}

export interface ChatMessage {
  id: string;
  sender: ChatSender;
  text: string;
  timestamp: number;
  decisionTreeNode?: DecisionTreeNode;
  actionPayload?: BotActionPayload;
  simulationSummary?: BotSimulationSummary;
  quickActions?: QuickActionChip[];
  isThinking?: boolean;
}
