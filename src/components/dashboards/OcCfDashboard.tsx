'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight,
  Banknote, ArrowUpCircle, ArrowDownCircle, Landmark, Wallet,
  Lightbulb, Target, Info, DollarSign, BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  ComposedChart, Bar, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell
} from 'recharts';
import cashflowData from '@/data/cashflow.json';
import type { CashFlowReport } from '@/types/cashflow';

const data = cashflowData as CashFlowReport;

// ===== 유틸리티 =====

// 백만원 → 억원 변환 및 포맷
const toEok = (v: number | undefined) => {
  if (v === undefined || v === null) return '-';
  const eok = v / 100;
  if (Math.abs(eok) >= 1) return eok.toLocaleString('ko-KR', { maximumFractionDigits: 0 });
  return eok.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
};

const toEokNum = (v: number) => Math.round(v / 100);

// 백만원 포맷
const fmt = (v: number | undefined) => {
  if (v === undefined || v === null) return '-';
  return v.toLocaleString('ko-KR');
};

// YoY 변화율 계산
const calcYoY = (current: number, prev: number | undefined) => {
  if (!prev || prev === 0) return null;
  return ((current - prev) / Math.abs(prev)) * 100;
};

// 26년 하반기 합계 계산
const calcH2Total = (monthly: Record<string, number> | undefined) => {
  if (!monthly) return undefined;
  let sum = 0;
  let hasValue = false;
  for (let m = 7; m <= 12; m++) {
    const val = monthly[String(m)];
    if (val !== undefined) {
      sum += val;
      hasValue = true;
    }
  }
  return hasValue ? sum : undefined;
};

// 26년 상반기 합계 계산
const calcH1Total = (monthly: Record<string, number> | undefined) => {
  if (!monthly) return undefined;
  let sum = 0;
  let hasValue = false;
  for (let m = 1; m <= 6; m++) {
    const val = monthly[String(m)];
    if (val !== undefined) {
      sum += val;
      hasValue = true;
    }
  }
  return hasValue ? sum : undefined;
};

// 26년 연간 합계 (H1 + H2)
const calcY26Annual = (monthly: Record<string, number> | undefined) => {
  if (!monthly) return undefined;
  const h1 = calcH1Total(monthly);
  const h2 = calcH2Total(monthly);
  if (h1 === undefined && h2 === undefined) return undefined;
  return (h1 || 0) + (h2 || 0);
};

// 차트 색상
const COLORS = {
  operating: '#10B981',   // emerald-500
  investment: '#EF4444',  // red-500
  financing: '#F59E0B',   // amber-500
  endingCash: '#3B82F6',  // blue-500
  beginning: '#8B5CF6',   // violet-500
  positive: '#10B981',
  negative: '#EF4444',
};



export default function OcCfDashboard() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    operating: true,
    investment: true,
    financing: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // KPI 데이터
  const kpi = data.kpi;
  const kpiCards = useMemo(() => [
    {
      title: '기초현금',
      value: kpi.beginningCash,
      prev: kpi.beginningCashPrev,
      color: 'blue',
      icon: Banknote,
      bgGradient: 'from-blue-50 to-blue-100/50',
    },
    {
      title: '영업 CF',
      value: kpi.operatingCF,
      prev: kpi.operatingCFPrev,
      color: 'emerald',
      icon: ArrowUpCircle,
      bgGradient: 'from-emerald-50 to-emerald-100/50',
    },
    {
      title: '투자 CF',
      value: kpi.investmentCF,
      prev: kpi.investmentCFPrev,
      color: 'red',
      icon: ArrowDownCircle,
      bgGradient: 'from-red-50 to-red-100/50',
      invertTrend: true,
    },
    {
      title: '조달 CF',
      value: kpi.financingCF,
      prev: kpi.financingCFPrev,
      color: 'amber',
      icon: Landmark,
      bgGradient: 'from-amber-50 to-amber-100/50',
    },
    {
      title: '기말현금',
      value: kpi.endingCash,
      prev: kpi.endingCashPrev,
      color: 'violet',
      icon: Wallet,
      bgGradient: 'from-violet-50 to-violet-100/50',
    },
  ], [kpi]);

  // 투자CF 워터폴 데이터
  const investmentWaterfallData = useMemo(() => {
    const items = data.investmentYoY;
    let cumulative = 0;
    const bars = items.map(item => {
      const value = item.y26Value;
      const base = value >= 0 ? cumulative : cumulative + value;
      cumulative += value;
      return {
        name: item.label,
        value: Math.abs(value),
        base: base / 100, // 억원
        valueEok: value / 100, // 억원 (부호 포함)
        absEok: Math.abs(value) / 100, // 억원 (절대값)
        isPositive: value >= 0,
        cumulative: cumulative / 100, // 누적 억원
      };
    });
    // 합계 막대
    const total = cumulative;
    bars.push({
      name: '투자CF 합계',
      value: Math.abs(total),
      base: total < 0 ? total / 100 : 0,
      valueEok: total / 100,
      absEok: Math.abs(total) / 100,
      isPositive: total >= 0,
      cumulative: total / 100,
    });
    return bars;
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* ===== Section 1: KPI Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const yoy = calcYoY(card.value, card.prev);
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            blue: 'bg-blue-500',
            emerald: 'bg-emerald-500',
            red: 'bg-red-500',
            amber: 'bg-amber-500',
            violet: 'bg-violet-500',
          };

          return (
            <Card key={card.title} className={`border-0 shadow-md hover:shadow-xl transition-shadow bg-gradient-to-br ${card.bgGradient}`}>
              <div className={`h-1 ${colorMap[card.color]} rounded-t-xl`} />
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500">{card.title}</span>
                  <Icon className={`w-4 h-4 text-${card.color}-500`} />
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {toEok(card.value)}
                  <span className="text-sm font-normal text-slate-500 ml-1">억</span>
                </div>
                {yoy !== null && (
                  <div className={`flex items-center gap-1 mt-1 text-xs ${
                    yoy > 0 ? 'text-emerald-600' : yoy < 0 ? 'text-red-600' : 'text-slate-500'
                  }`}>
                    {yoy > 0 ? <TrendingUp className="w-3 h-3" /> : yoy < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    <span>YoY {yoy > 0 ? '+' : ''}{yoy.toFixed(1)}%</span>
                  </div>
                )}
                {card.prev !== undefined && (
                  <div className="text-xs text-slate-400 mt-0.5">
                    전년: {toEok(card.prev)}억
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ===== Section 2: 인사이트 + 액션플랜 ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CF 인사이트 */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
          <div className="h-1 bg-emerald-500 rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-emerald-500" />
              CF 인사이트
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.insights.map((insight, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 투자전략 / 액션플랜 */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
          <div className="h-1 bg-gradient-to-r from-blue-500 to-violet-500 rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              투자전략 / 액션플랜
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.actionPlan.map((item, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Section 3: 영업CF 분석 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 좌: 월별 기말현금 추이 + 브릿지 수식 */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
          <div className="h-1 bg-blue-500 rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-base">월별 기말현금 추이 (억원)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={data.monthlyTrend.map(t => ({
                ...t,
                endingCashEok: t.endingCash ? toEokNum(t.endingCash) : 0,
                operatingEok: t.operatingCF ? toEokNum(t.operatingCF) : 0,
                investmentEok: t.investmentCF ? toEokNum(t.investmentCF) : 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="displayLabel" tick={{ fontSize: 11 }} stroke="#64748b" angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = { endingCashEok: '기말현금', operatingEok: '영업CF', investmentEok: '투자CF' };
                    return [`${value.toLocaleString()}억`, labels[name] || name];
                  }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend formatter={(value) => {
                  const labels: Record<string, string> = { endingCashEok: '기말현금', operatingEok: '영업CF', investmentEok: '투자CF' };
                  return labels[value] || value;
                }} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="operatingEok" fill={COLORS.operating} opacity={0.7} radius={[2, 2, 0, 0]} />
                <Bar dataKey="investmentEok" fill={COLORS.investment} opacity={0.7} radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="endingCashEok" stroke={COLORS.endingCash} strokeWidth={2.5} dot={{ r: 3, fill: COLORS.endingCash }} />
              </ComposedChart>
            </ResponsiveContainer>
            {/* 영업CF 브릿지 수식 */}
            <div className="mt-2 p-2.5 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border border-emerald-200/50">
              <div className="text-xs font-medium text-slate-500 mb-1">영업CF 구성 (Bridge)</div>
              <div className="flex flex-wrap items-center gap-1 text-sm">
                <span className="font-bold text-emerald-700">영업현금흐름 {toEok(data.operatingCFBridge.total)}억</span>
                <span className="text-slate-400">=</span>
                <span className="text-slate-700">영업이익 <span className="font-semibold text-blue-600">+{toEok(data.operatingCFBridge.operatingProfit)}억</span></span>
                <span className="text-slate-400">+</span>
                <span className="text-slate-700">운전자본 <span className="font-semibold text-red-600">{toEok(data.operatingCFBridge.workingCapital)}억</span></span>
                <span className="text-slate-400">+</span>
                <span className="text-slate-700">비현금 <span className="font-semibold text-blue-600">+{toEok(data.operatingCFBridge.nonCash)}억</span></span>
                <span className="text-slate-400">+</span>
                <span className="text-slate-700">기타 <span className="font-semibold text-blue-600">+{toEok(data.operatingCFBridge.others)}억</span></span>
              </div>
            </div>
            {/* 운전자본 내역 (BS 기준) */}
            <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200/50">
              <div className="text-xs font-medium text-slate-500 mb-2">운전자본 내역 (억원, BS 기준)</div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-200">
                    <th className="text-left pb-1 font-medium">항목</th>
                    <th className="text-right pb-1 font-medium">25년말</th>
                    <th className="text-right pb-1 font-medium">26년말</th>
                    <th className="text-right pb-1 font-medium">YoY</th>
                  </tr>
                </thead>
                <tbody>
                  {data.workingCapitalDetail.map((item, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1 text-slate-600 font-medium">{item.label}</td>
                      <td className="py-1 text-right text-slate-500">{item.y25Value.toLocaleString()}</td>
                      <td className="py-1 text-right text-slate-700 font-medium">{item.y26Value.toLocaleString()}</td>
                      <td className={`py-1 text-right font-semibold ${
                        item.change > 0 ? 'text-emerald-600' : item.change < 0 ? 'text-red-600' : 'text-slate-400'
                      }`}>
                        {item.change > 0 ? '+' : ''}{item.change.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {(() => {
                    const wcItems = data.workingCapitalDetail;
                    const y25Sum = wcItems[0].y25Value + wcItems[1].y25Value - wcItems[2].y25Value;
                    const y26Sum = wcItems[0].y26Value + wcItems[1].y26Value - wcItems[2].y26Value;
                    const sumChange = y26Sum - y25Sum;
                    return (
                      <tr className="border-t-2 border-slate-300">
                        <td className="py-1 text-slate-800 font-bold">합계(채권+재고-채무)</td>
                        <td className="py-1 text-right text-slate-600 font-bold">{y25Sum.toLocaleString()}</td>
                        <td className="py-1 text-right text-slate-800 font-bold">{y26Sum.toLocaleString()}</td>
                        <td className={`py-1 text-right font-bold ${
                          sumChange > 0 ? 'text-emerald-600' : sumChange < 0 ? 'text-red-600' : 'text-slate-400'
                        }`}>
                          {sumChange > 0 ? '+' : ''}{sumChange.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 우: 영업CF 주요 증감 서머리 */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
          <div className="h-1 bg-emerald-500 rounded-t-xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              영업CF 주요 증감 분석
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">{data.operatingCFAnalysis.summary}</p>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {data.operatingCFAnalysis.items.map((item, i) => {
                const yoyRatio = item.y25Value !== 0
                  ? (item.y26Value / item.y25Value * 100).toFixed(1)
                  : '-';
                const changeSign = item.change >= 0 ? '+' : '△';
                const changeAbs = Math.abs(item.change);
                return (
                  <div key={i} className="border border-slate-100 rounded-lg p-2.5 bg-gradient-to-r from-slate-50 to-white">
                    <div className="mb-1">
                      <span className="text-sm font-semibold text-slate-800">{item.category}</span>
                      <span className="text-sm font-bold text-blue-700 ml-1.5">{toEok(item.y26Value)}억</span>
                      <span className="text-xs text-slate-500 ml-1">
                        ({yoyRatio}%,{' '}
                        <span className={item.change >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>
                          {changeSign}{toEok(changeAbs)}억
                        </span>
                        {' '}/ 25년 {toEok(item.y25Value)}억)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 rounded px-2 py-1">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Section 4: CF 상세 테이블 ===== */}
      <Card className="border-0 shadow-md hover:shadow-xl transition-shadow overflow-hidden">
        <div className="h-1 bg-slate-700 rounded-t-xl" />
        <CardHeader>
          <CardTitle className="text-base">Cash Flow 상세 내역 (단위: 백만원)</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-700 to-slate-600">
                <TableHead className="text-white font-medium min-w-[160px] sticky left-0 bg-slate-700 z-10">구분</TableHead>
                <TableHead className="text-white font-medium text-right">24년 연간</TableHead>
                <TableHead className="text-white font-medium text-right">25년 계(실적)</TableHead>
                <TableHead className="text-white font-medium text-right bg-blue-600/30">26.1월(실적)</TableHead>
                <TableHead className="text-white font-medium text-right bg-blue-600/30">26.2월(실적)</TableHead>
                <TableHead className="text-white font-medium text-right bg-slate-500/30">26.3월(e)</TableHead>
                <TableHead className="text-white font-medium text-right bg-slate-500/30">26.4월(e)</TableHead>
                <TableHead className="text-white font-medium text-right bg-slate-500/30">26.5월(e)</TableHead>
                <TableHead className="text-white font-medium text-right bg-slate-500/30">26.6월(e)</TableHead>
                <TableHead className="text-white font-medium text-right bg-violet-600/30">26H2 계(e)</TableHead>
                <TableHead className="text-white font-medium text-right bg-indigo-600/30">26년 계</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* 기초현금 */}
              <TableRow className="bg-blue-50/50 font-semibold">
                <TableCell className="font-semibold text-slate-800 sticky left-0 bg-blue-50/80 z-10">{data.beginningCash.label}</TableCell>
                <TableCell className="text-right">{fmt(data.beginningCash.y24Annual)}</TableCell>
                <TableCell className="text-right">{fmt(data.beginningCash.y25Total)}</TableCell>
                <TableCell className="text-right bg-blue-50/80">{fmt(data.beginningCash.y26Monthly?.['1'])}</TableCell>
                <TableCell className="text-right bg-blue-50/80">{fmt(data.beginningCash.y26Monthly?.['2'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50">{fmt(data.beginningCash.y26Monthly?.['3'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50">{fmt(data.beginningCash.y26Monthly?.['4'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50">{fmt(data.beginningCash.y26Monthly?.['5'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50">{fmt(data.beginningCash.y26Monthly?.['6'])}</TableCell>
                <TableCell className="text-right bg-violet-50/50 font-medium">{fmt(calcH2Total(data.beginningCash.y26Monthly))}</TableCell>
                <TableCell className="text-right bg-indigo-50/50 font-medium">{fmt(data.beginningCash.y26Total)}</TableCell>
              </TableRow>

              {/* 영업CF (합계만 표시, 하위항목 없음) */}
              <TableRow className="bg-emerald-50/50 font-semibold">
                <TableCell className="font-semibold text-emerald-700 sticky left-0 bg-emerald-50/80 z-10">
                  {data.operating.total.label}
                </TableCell>
                <TableCell className="text-right text-emerald-700">{fmt(data.operating.total.y24Annual)}</TableCell>
                <TableCell className="text-right text-emerald-700">{fmt(data.operating.total.y25Total)}</TableCell>
                <TableCell className="text-right bg-blue-50/50 text-emerald-700">{fmt(data.operating.total.y26Monthly?.['1'])}</TableCell>
                <TableCell className="text-right bg-blue-50/50 text-emerald-700">{fmt(data.operating.total.y26Monthly?.['2'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-emerald-700">{fmt(data.operating.total.y26Monthly?.['3'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-emerald-700">{fmt(data.operating.total.y26Monthly?.['4'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-emerald-700">{fmt(data.operating.total.y26Monthly?.['5'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-emerald-700">{fmt(data.operating.total.y26Monthly?.['6'])}</TableCell>
                <TableCell className="text-right bg-violet-50/50 text-emerald-700 font-bold">{fmt(calcH2Total(data.operating.total.y26Monthly))}</TableCell>
                <TableCell className="text-right bg-indigo-50/50 text-emerald-700 font-bold">{fmt(data.operating.total.y26Total)}</TableCell>
              </TableRow>

              {/* 투자CF */}
              <TableRow
                className="bg-red-50/50 font-semibold cursor-pointer hover:bg-red-100/50"
                onClick={() => toggleSection('investment')}
              >
                <TableCell className="font-semibold text-red-700 flex items-center gap-1 sticky left-0 bg-red-50/80 z-10">
                  {expandedSections.investment ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {data.investment.total.label}
                </TableCell>
                <TableCell className="text-right text-red-700">{fmt(data.investment.total.y24Annual)}</TableCell>
                <TableCell className="text-right text-red-700">{fmt(data.investment.total.y25Total)}</TableCell>
                <TableCell className="text-right bg-blue-50/50 text-red-700">{fmt(data.investment.total.y26Monthly?.['1'])}</TableCell>
                <TableCell className="text-right bg-blue-50/50 text-red-700">{fmt(data.investment.total.y26Monthly?.['2'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-red-700">{fmt(data.investment.total.y26Monthly?.['3'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-red-700">{fmt(data.investment.total.y26Monthly?.['4'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-red-700">{fmt(data.investment.total.y26Monthly?.['5'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-red-700">{fmt(data.investment.total.y26Monthly?.['6'])}</TableCell>
                <TableCell className="text-right bg-violet-50/50 text-red-700 font-bold">{fmt(calcH2Total(data.investment.total.y26Monthly))}</TableCell>
                <TableCell className="text-right bg-indigo-50/50 text-red-700 font-bold">{fmt(data.investment.total.y26Total)}</TableCell>
              </TableRow>
              {expandedSections.investment && data.investment.items.map((item, i) => (
                <TableRow key={`inv-${i}`} className="text-slate-600">
                  <TableCell className="pl-8 text-sm sticky left-0 bg-white z-10">- {item.label}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(item.y24Annual)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(item.y25Total)}</TableCell>
                  <TableCell className="text-right text-sm bg-blue-50/30">{fmt(item.y26Monthly?.['1'])}</TableCell>
                  <TableCell className="text-right text-sm bg-blue-50/30">{fmt(item.y26Monthly?.['2'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['3'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['4'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['5'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['6'])}</TableCell>
                  <TableCell className="text-right text-sm bg-violet-50/30">{fmt(calcH2Total(item.y26Monthly))}</TableCell>
                  <TableCell className="text-right text-sm bg-indigo-50/30">{fmt(item.y26Total)}</TableCell>
                </TableRow>
              ))}

              {/* 조달CF */}
              <TableRow
                className="bg-amber-50/50 font-semibold cursor-pointer hover:bg-amber-100/50"
                onClick={() => toggleSection('financing')}
              >
                <TableCell className="font-semibold text-amber-700 flex items-center gap-1 sticky left-0 bg-amber-50/80 z-10">
                  {expandedSections.financing ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  {data.financing.total.label}
                </TableCell>
                <TableCell className="text-right text-amber-700">{fmt(data.financing.total.y24Annual)}</TableCell>
                <TableCell className="text-right text-amber-700">{fmt(data.financing.total.y25Total)}</TableCell>
                <TableCell className="text-right bg-blue-50/50 text-amber-700">{fmt(data.financing.total.y26Monthly?.['1'])}</TableCell>
                <TableCell className="text-right bg-blue-50/50 text-amber-700">{fmt(data.financing.total.y26Monthly?.['2'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-amber-700">{fmt(data.financing.total.y26Monthly?.['3'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-amber-700">{fmt(data.financing.total.y26Monthly?.['4'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-amber-700">{fmt(data.financing.total.y26Monthly?.['5'])}</TableCell>
                <TableCell className="text-right bg-slate-50/50 text-amber-700">{fmt(data.financing.total.y26Monthly?.['6'])}</TableCell>
                <TableCell className="text-right bg-violet-50/50 text-amber-700 font-bold">{fmt(calcH2Total(data.financing.total.y26Monthly))}</TableCell>
                <TableCell className="text-right bg-indigo-50/50 text-amber-700 font-bold">{fmt(data.financing.total.y26Total)}</TableCell>
              </TableRow>
              {expandedSections.financing && data.financing.items.map((item, i) => (
                <TableRow key={`fin-${i}`} className="text-slate-600">
                  <TableCell className="pl-8 text-sm sticky left-0 bg-white z-10">- {item.label}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(item.y24Annual)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(item.y25Total)}</TableCell>
                  <TableCell className="text-right text-sm bg-blue-50/30">{fmt(item.y26Monthly?.['1'])}</TableCell>
                  <TableCell className="text-right text-sm bg-blue-50/30">{fmt(item.y26Monthly?.['2'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['3'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['4'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['5'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(item.y26Monthly?.['6'])}</TableCell>
                  <TableCell className="text-right text-sm bg-violet-50/30">{fmt(calcH2Total(item.y26Monthly))}</TableCell>
                  <TableCell className="text-right text-sm bg-indigo-50/30">{fmt(item.y26Total)}</TableCell>
                </TableRow>
              ))}

              {/* 조달후 기말잔액 */}
              <TableRow className="bg-violet-50/50 font-bold border-t-2 border-violet-300">
                <TableCell className="font-bold text-violet-800 sticky left-0 bg-violet-50/80 z-10">{data.endingCash.label}</TableCell>
                <TableCell className="text-right font-bold text-violet-800">{fmt(data.endingCash.y24Annual)}</TableCell>
                <TableCell className="text-right font-bold text-violet-800">{fmt(data.endingCash.y25Total)}</TableCell>
                <TableCell className="text-right font-bold bg-blue-50/50 text-violet-800">{fmt(data.endingCash.y26Monthly?.['1'])}</TableCell>
                <TableCell className="text-right font-bold bg-blue-50/50 text-violet-800">{fmt(data.endingCash.y26Monthly?.['2'])}</TableCell>
                <TableCell className="text-right font-bold bg-slate-50/50 text-violet-800">{fmt(data.endingCash.y26Monthly?.['3'])}</TableCell>
                <TableCell className="text-right font-bold bg-slate-50/50 text-violet-800">{fmt(data.endingCash.y26Monthly?.['4'])}</TableCell>
                <TableCell className="text-right font-bold bg-slate-50/50 text-violet-800">{fmt(data.endingCash.y26Monthly?.['5'])}</TableCell>
                <TableCell className="text-right font-bold bg-slate-50/50 text-violet-800">{fmt(data.endingCash.y26Monthly?.['6'])}</TableCell>
                <TableCell className="text-right font-bold bg-violet-100/50 text-violet-800">{fmt(calcH2Total(data.endingCash.y26Monthly))}</TableCell>
                <TableCell className="text-right font-bold bg-indigo-100/50 text-violet-900">{fmt(data.endingCash.y26Total)}</TableCell>
              </TableRow>

              {/* OC 차입금 */}
              {data.ocBorrowingBalance && (
                <TableRow className="text-slate-500">
                  <TableCell className="text-sm sticky left-0 bg-white z-10">{data.ocBorrowingBalance.label}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(data.ocBorrowingBalance.y24Annual)}</TableCell>
                  <TableCell className="text-right text-sm">{fmt(data.ocBorrowingBalance.y25Total)}</TableCell>
                  <TableCell className="text-right text-sm bg-blue-50/30">{fmt(data.ocBorrowingBalance.y26Monthly?.['1'])}</TableCell>
                  <TableCell className="text-right text-sm bg-blue-50/30">{fmt(data.ocBorrowingBalance.y26Monthly?.['2'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(data.ocBorrowingBalance.y26Monthly?.['3'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(data.ocBorrowingBalance.y26Monthly?.['4'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(data.ocBorrowingBalance.y26Monthly?.['5'])}</TableCell>
                  <TableCell className="text-right text-sm bg-slate-50/30">{fmt(data.ocBorrowingBalance.y26Monthly?.['6'])}</TableCell>
                  <TableCell className="text-right text-sm bg-violet-50/30">{fmt(calcH2Total(data.ocBorrowingBalance.y26Monthly))}</TableCell>
                  <TableCell className="text-right text-sm bg-indigo-50/30">{fmt(data.ocBorrowingBalance.y26Total)}</TableCell>
                </TableRow>
              )}

            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ===== 통화별 기말잔액 ===== */}
      {(() => {
        const totalDec25 = data.currencyBalances.reduce((s, cb) => s + (cb.previousAmount || 0), 0);
        const totalFeb26 = data.currencyBalances.reduce((s, cb) => s + cb.amount, 0);
        const totalChange = totalFeb26 - totalDec25;
        const totalYearEnd = data.currencyBalances.reduce((s, cb) => s + (cb.yearEndEstimate || 0), 0);
        const totalYoY = totalDec25 !== 0 ? ((totalYearEnd - totalDec25) / Math.abs(totalDec25)) * 100 : undefined;

        return (
          <Card className="border-0 shadow-md hover:shadow-xl transition-shadow overflow-hidden">
            <div className="h-1 bg-blue-500 rounded-t-xl" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-500" />
                통화별 기말잔액 (백만원)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 text-slate-500">
                    <th className="text-left py-2 font-medium">통화</th>
                    <th className="text-right py-2 font-medium">25년 12월말</th>
                    <th className="text-right py-2 font-medium">26년 2월말</th>
                    <th className="text-right py-2 font-medium">증감</th>
                    <th className="text-right py-2 font-medium">26년말(추정)</th>
                    <th className="text-right py-2 font-medium">YoY</th>
                    <th className="text-left py-2 pl-4 font-medium">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {data.currencyBalances.map((cb) => {
                    const dec25 = cb.previousAmount || 0;
                    const feb26 = cb.amount;
                    const change = feb26 - dec25;
                    const yearEnd = cb.yearEndEstimate || 0;
                    const yoy = dec25 !== 0
                      ? ((yearEnd - dec25) / Math.abs(dec25)) * 100
                      : undefined;
                    return (
                      <tr key={cb.currency} className="border-b border-slate-100">
                        <td className="py-2 font-medium text-slate-700 flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                          {cb.label}
                        </td>
                        <td className="py-2 text-right text-slate-500">{fmt(dec25)}</td>
                        <td className="py-2 text-right font-semibold text-slate-800">{fmt(feb26)}</td>
                        <td className={`py-2 text-right font-semibold ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {change > 0 ? '+' : ''}{fmt(change)}
                        </td>
                        <td className="py-2 text-right font-semibold text-blue-700">{fmt(yearEnd)}</td>
                        <td className={`py-2 text-right ${yoy !== undefined && yoy > 0 ? 'text-emerald-600' : yoy !== undefined && yoy < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                          {yoy !== undefined ? `${yoy > 0 ? '+' : ''}${yoy.toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-2 pl-4 text-xs text-slate-500">{cb.note || ''}</td>
                      </tr>
                    );
                  })}
                  {/* 합계 */}
                  <tr className="border-t-2 border-slate-300 font-bold">
                    <td className="py-2 text-slate-800">합계</td>
                    <td className="py-2 text-right text-slate-600">{fmt(totalDec25)}</td>
                    <td className="py-2 text-right text-slate-900">{fmt(totalFeb26)}</td>
                    <td className={`py-2 text-right ${totalChange > 0 ? 'text-emerald-600' : totalChange < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {totalChange > 0 ? '+' : ''}{fmt(totalChange)}
                    </td>
                    <td className="py-2 text-right font-semibold text-blue-700">{fmt(totalYearEnd)}</td>
                    <td className={`py-2 text-right ${totalYoY !== undefined && totalYoY > 0 ? 'text-emerald-600' : totalYoY !== undefined && totalYoY < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                      {totalYoY !== undefined ? `${totalYoY > 0 ? '+' : ''}${totalYoY.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2 pl-4"></td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
      })()}

      {/* ===== Section 5: 투자CF 분석 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 투자CF 워터폴 차트 */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-shadow">
          <div className="h-1 bg-red-500 rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-500" />
              26년 투자CF 워터폴 (억원)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={investmentWaterfallData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  stroke="#64748b"
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} stroke="#64748b" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0]?.payload;
                    if (!d) return null;
                    const isTotal = d.name === '투자CF 합계';
                    return (
                      <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs">
                        <div className="font-semibold text-slate-800 mb-1">{d.name}</div>
                        <div className={`font-bold ${d.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {d.valueEok > 0 ? '+' : ''}{Math.round(d.valueEok).toLocaleString()}억
                        </div>
                        {!isTotal && (
                          <div className="text-slate-500 mt-0.5">
                            누적: {Math.round(d.cumulative).toLocaleString()}억
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                {/* invisible base */}
                <Bar dataKey="base" stackId="waterfall" fill="transparent" />
                {/* visible bar */}
                <Bar dataKey="absEok" stackId="waterfall" radius={[3, 3, 0, 0]}>
                  {investmentWaterfallData.map((entry, index) => {
                    const isTotal = entry.name === '투자CF 합계';
                    let fill = entry.isPositive ? '#10B981' : '#EF4444';
                    if (isTotal) fill = '#6366F1'; // indigo for total
                    return <Cell key={`cell-${index}`} fill={fill} />;
                  })}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
            {/* 범례 */}
            <div className="flex flex-wrap gap-3 justify-center mt-1 text-xs">
              {investmentWaterfallData.slice(0, -1).map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className={`w-2.5 h-2.5 rounded-sm ${item.isPositive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-slate-600">{item.name}</span>
                  <span className={`font-medium ${item.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {item.valueEok > 0 ? '+' : ''}{Math.round(item.valueEok).toLocaleString()}억
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                <span className="text-slate-600 font-semibold">합계</span>
                <span className="font-bold text-indigo-600">
                  {Math.round(investmentWaterfallData[investmentWaterfallData.length - 1].valueEok).toLocaleString()}억
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 투자CF 전년대비 증감 */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-shadow overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-red-500 to-amber-500 rounded-t-xl" />
          <CardHeader>
            <CardTitle className="text-base">투자CF 전년대비 증감 (백만원)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-red-600 to-red-500">
                  <TableHead className="text-white font-medium">항목</TableHead>
                  <TableHead className="text-white font-medium text-right">25년</TableHead>
                  <TableHead className="text-white font-medium text-right">26년</TableHead>
                  <TableHead className="text-white font-medium text-right">증감</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.investmentYoY.map((item, i) => (
                  <TableRow key={i} className="hover:bg-red-50/30">
                    <TableCell className="text-sm font-medium">{item.label}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(item.y25Value)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(item.y26Value)}</TableCell>
                    <TableCell className={`text-right text-sm font-semibold ${
                      item.change > 0 ? 'text-emerald-600' : item.change < 0 ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      {item.change > 0 ? '+' : ''}{fmt(item.change)}
                    </TableCell>
                  </TableRow>
                ))}
                {/* 합계 행 */}
                <TableRow className="bg-red-50 font-bold border-t-2 border-red-200">
                  <TableCell className="font-bold text-red-800">합계</TableCell>
                  <TableCell className="text-right font-bold text-red-800">{fmt(data.investment.total.y25Total)}</TableCell>
                  <TableCell className="text-right font-bold text-red-800">{fmt(data.investment.total.y26Total)}</TableCell>
                  <TableCell className={`text-right font-bold ${
                    (data.investment.total.y26Total! - data.investment.total.y25Total!) > 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {(data.investment.total.y26Total! - data.investment.total.y25Total!) > 0 ? '+' : ''}
                    {fmt(data.investment.total.y26Total! - data.investment.total.y25Total!)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            {/* 보충설명 */}
            <div className="px-4 pb-4 pt-3 space-y-2">
              {data.investmentYoY.map((item, i) => (
                item.note && (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="font-semibold text-slate-500 whitespace-nowrap">{item.label}:</span>
                    <span>{item.note}</span>
                  </div>
                )
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Section 6: CF 증감내역 (전년대비) ===== */}
      <Card className="border-0 shadow-md hover:shadow-xl transition-shadow overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-t-xl" />
        <CardHeader>
          <CardTitle className="text-base">CF 증감내역 (25년 vs 26년, 단위: 백만원)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-amber-600 to-orange-500">
                <TableHead className="text-white font-medium">구분</TableHead>
                <TableHead className="text-white font-medium">항목</TableHead>
                <TableHead className="text-white font-medium text-right">25년</TableHead>
                <TableHead className="text-white font-medium text-right">26년</TableHead>
                <TableHead className="text-white font-medium text-right">증감</TableHead>
                <TableHead className="text-white font-medium">비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.yoyComparison.map((item, i) => {
                const prevCat = i > 0 ? data.yoyComparison[i - 1].category : '';
                const showCat = item.category !== prevCat;
                const catColors: Record<string, string> = {
                  '영업': 'bg-emerald-50',
                  '투자': 'bg-red-50',
                  '조달': 'bg-amber-50',
                };
                return (
                  <TableRow key={i} className={catColors[item.category] || ''}>
                    <TableCell className="font-medium text-sm">
                      {showCat ? item.category : ''}
                    </TableCell>
                    <TableCell className="text-sm">{item.label}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(item.y25Value)}</TableCell>
                    <TableCell className="text-right text-sm">{fmt(item.y26Value)}</TableCell>
                    <TableCell className={`text-right text-sm font-medium ${
                      item.change > 0 ? 'text-emerald-600' : item.change < 0 ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      {item.change > 0 ? '+' : ''}{fmt(item.change)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[300px] whitespace-normal">{item.note}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}
