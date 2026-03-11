// ===== Cash Flow (자금계획) Types =====

/** 월별 값 맵 (key: 월 번호 문자열) */
export type MonthlyValues = Record<string, number>;
export type MonthlyFlags = Record<string, boolean>;

/** CF 테이블 한 행 */
export interface CashFlowLineItem {
  label: string;
  y24Annual?: number;
  y25H1?: number;
  y25Monthly?: MonthlyValues;  // 25년 7~12월
  y25Total?: number;
  y26Monthly?: MonthlyValues;  // 26년 1~12월
  y26Total?: number;
  isEstimate?: MonthlyFlags;   // 월별 추정 여부
  isSubItem?: boolean;
  isTotal?: boolean;
}

/** 영업 Cash Flow */
export interface CashFlowOperating {
  total: CashFlowLineItem;
  subItems?: CashFlowLineItem[];
}

/** 투자 Cash Flow */
export interface CashFlowInvestment {
  total: CashFlowLineItem;
  items: CashFlowLineItem[];
}

/** 조달 Cash Flow */
export interface CashFlowFinancing {
  total: CashFlowLineItem;
  items: CashFlowLineItem[];
}

/** 전년대비 증감 항목 */
export interface CashFlowYoYItem {
  category: string;      // 영업, 투자, 조달
  label: string;
  y25Value: number;
  y26Value: number;
  change: number;
  note?: string;
}

/** 통화별 기말잔액 */
export interface CashFlowCurrencyBalance {
  currency: string;
  label: string;
  amount: number;
  previousAmount?: number;
  note?: string;
}

/** KPI 요약 */
export interface CashFlowKPI {
  beginningCash: number;
  operatingCF: number;
  investmentCF: number;
  financingCF: number;
  endingCash: number;
  beginningCashPrev?: number;
  operatingCFPrev?: number;
  investmentCFPrev?: number;
  financingCFPrev?: number;
  endingCashPrev?: number;
}

/** 핵심 요약 항목 (v1 호환용) */
export interface CashFlowHighlight {
  label: string;
  value: string;
  detail?: string;
  change?: number;
  changeNote?: string;
}

/** 영업CF 분석 항목 */
export interface OperatingCFAnalysisItem {
  category: string;
  y25Value: number;
  y26Value: number;
  change: number;
  detail: string;
}

/** 영업CF 주요 증감 분석 */
export interface OperatingCFAnalysis {
  summary: string;
  items: OperatingCFAnalysisItem[];
}

/** 영업CF 브릿지 (수식 표시용) */
export interface OperatingCFBridge {
  total: number;
  operatingProfit: number;
  workingCapital: number;
  nonCash: number;
  others: number;
}

/** 운전자본 세부항목 (BS 기준, 억원) */
export interface WorkingCapitalDetailItem {
  label: string;
  y26Value: number;
  y25Value: number;
  change: number;
}

/** 투자CF 전년대비 증감 항목 */
export interface InvestmentYoYItem {
  label: string;
  y25Value: number;
  y26Value: number;
  change: number;
  note: string;
}

/** 월별 추이 데이터 (차트용) */
export interface CashFlowMonthlyTrend {
  month: string;
  displayLabel: string;
  beginningCash?: number;
  operatingCF?: number;
  investmentCF?: number;
  financingCF?: number;
  endingCash?: number;
  isEstimate: boolean;
}

/** 전체 Cash Flow Report */
export interface CashFlowReport {
  meta: {
    title: string;
    period: string;
    unit: string;
    updatedAt: string;
  };
  kpi: CashFlowKPI;
  beginningCash: CashFlowLineItem;
  operating: CashFlowOperating;
  investment: CashFlowInvestment;
  financing: CashFlowFinancing;
  endingCash: CashFlowLineItem;
  ocBorrowingBalance?: CashFlowLineItem;
  currencyBalances: CashFlowCurrencyBalance[];
  totalAssets?: CashFlowLineItem;
  yoyComparison: CashFlowYoYItem[];
  highlights: CashFlowHighlight[];
  monthlyTrend: CashFlowMonthlyTrend[];
  insights: string[];
  warnings: string[];
  actionPlan: string[];
  operatingCFAnalysis: OperatingCFAnalysis;
  operatingCFBridge: OperatingCFBridge;
  workingCapitalDetail: WorkingCapitalDetailItem[];
  investmentYoY: InvestmentYoYItem[];
}
