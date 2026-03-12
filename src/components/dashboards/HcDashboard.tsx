'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronRight,
  Building2, Banknote, BarChart3, ArrowRight, ArrowDown,
  PieChart as PieChartIcon, Info, AlertTriangle, CheckCircle2,
  CircleDollarSign, Shield, TrendingUp as Growth, Calendar
} from 'lucide-react';
import {
  ComposedChart, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList
} from 'recharts';
import data from '@/data/hc-financial.json';

function fmt(v: number | undefined | null): string {
  if (v === undefined || v === null || isNaN(v)) return '-';
  if (v === 0) return '-';
  const abs = Math.abs(v);
  const formatted = abs.toLocaleString('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  return v < 0 ? `(${formatted})` : formatted;
}

function fmtPct(v: number | undefined | null): string {
  if (v === undefined || v === null || isNaN(v) || !isFinite(v)) return '-';
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
}

function calcChange(current: number, prev: number) {
  const diff = current - prev;
  const pct = prev !== 0 ? (diff / Math.abs(prev)) * 100 : 0;
  return { diff, pct };
}

function getChangeColor(change: number, isNegativeGood = false): string {
  if (change === 0) return 'text-gray-500';
  if (isNegativeGood) return change < 0 ? 'text-emerald-600' : 'text-red-600';
  return change > 0 ? 'text-emerald-600' : 'text-red-600';
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export default function HcDashboard() {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [showAll, setShowAll] = useState(false);
  const toggle = (k: string) => setExpanded(p => ({ ...p, [k]: !p[k] }));

  // Waterfall: fnf_CF pattern with begin/end bars
  const waterfallData = useMemo(() => {
    const all = data.cashImpact.waterfall;
    const beginItem = all.find(item => item.type === 'begin');
    const endItem = all.find(item => item.type === 'end');
    const changes = all.filter(item => item.type !== 'begin' && item.type !== 'end');
    const result: { name: string; base: number; absVal: number; valueWithSign: number; isPositive: boolean; isBeginEnd: boolean; cumulative: number }[] = [];

    // Begin bar (기초현금) - full bar from 0
    let cumulative = 0;
    if (beginItem) {
      cumulative = beginItem.value;
      result.push({ name: beginItem.name, base: 0, absVal: beginItem.value, valueWithSign: beginItem.value, isPositive: true, isBeginEnd: true, cumulative });
    }

    // Change items - floating bars
    for (const item of changes) {
      const value = item.value;
      const base = value >= 0 ? cumulative : cumulative + value;
      cumulative += value;
      result.push({ name: item.name, base, absVal: Math.abs(value), valueWithSign: value, isPositive: value >= 0, isBeginEnd: false, cumulative });
    }

    // End bar (기말현금) - full bar from 0
    if (endItem) {
      result.push({ name: endItem.name, base: 0, absVal: endItem.value, valueWithSign: endItem.value, isPositive: true, isBeginEnd: true, cumulative: endItem.value });
    }

    return result;
  }, []);

  const pl = data.plDrivers;
  const bs = data.bsImpact;
  const cf = data.cashImpact;
  const at = data.assetThreshold;
  const mp = data.monthlyCashPlan;

  const driverIcons = [CircleDollarSign, Shield, Growth];
  const driverColors = ['text-amber-600', 'text-violet-600', 'text-emerald-600'];
  const driverBg = ['bg-amber-50 border-amber-200', 'bg-violet-50 border-violet-200', 'bg-emerald-50 border-emerald-200'];
  const driverBadge = ['bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-800', 'bg-emerald-100 text-emerald-800'];

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6 space-y-5">
      {/* ===== 1. KPI SUMMARY: BS & CASH IMPACT ===== */}
      <Card className="border-0 shadow-lg py-0">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold shadow">1</div>
            <CardTitle className="text-base font-bold">FY2026E BS · 자금 핵심 영향</CardTitle>
            <span className="text-xs text-gray-400 ml-1">{bs.description}</span>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          {/* Asset 2조 Highlight Banner */}
          <div className="mb-3 bg-gradient-to-r from-red-50 via-amber-50 to-red-50 rounded-lg border-2 border-red-300 p-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">ALERT</div>
            <div className="flex items-center justify-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
              <div className="text-center">
                <div className="text-lg font-black text-red-700 tracking-tight">26년 자산총계 2조원 초과 예상</div>
                <div className="text-xs text-gray-600 mt-0.5 font-mono">
                  {fmt(at.current.feb26)}억 <ArrowRight className="w-3 h-3 inline text-gray-400" /> <span className="text-red-600 font-bold">{fmt(at.current.dec26e)}억</span>
                  <span className="text-gray-400 mx-1">|</span>
                  기준 {(at.threshold / 10000).toFixed(0)}조원 대비 <span className="text-red-600 font-bold">+{fmt(at.current.dec26e - at.threshold)}억 초과</span>
                </div>
              </div>
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {bs.keyItems.map((item, i) => {
              const isUp = item.change > 0;
              return (
                <div key={i} className={`rounded-lg border p-3.5 ${item.highlight ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-gray-100'}`}>
                  <div className="text-sm text-gray-700 font-bold">{item.label}</div>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className={`text-xl font-bold ${isUp ? 'text-emerald-700' : 'text-red-600'}`}>
                      {isUp ? '+' : ''}{fmt(item.change)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{item.driver}</div>
                  <div className="text-xs font-mono text-gray-500 mt-0.5">
                    {fmt(item.dec25)} → <span className="text-blue-600 font-semibold">{fmt(item.dec26e)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ===== 2. KPI SUMMARY: P&L KEY DRIVERS ===== */}
      <Card className="border-0 shadow-lg py-0">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white text-xs font-bold shadow">2</div>
            <CardTitle className="text-base font-bold">FY2026E 손익 증가 핵심 요인</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="grid grid-cols-3 gap-3 mb-3">
            {pl.drivers.map((d, i) => {
              const Icon = driverIcons[i];
              return (
                <div key={i} className={`rounded-lg border p-3.5 ${driverBg[i]}`}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-4 h-4 ${driverColors[i]}`} />
                    <span className={`text-sm font-bold ${driverColors[i]}`}>{d.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-gray-900">+{fmt(d.change)}</span>
                    <Badge className={`text-xs px-1.5 py-0 ${driverBadge[i]}`}>{fmtPct(d.changePct)}</Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{fmt(d.fy2025)} → {fmt(d.fy2026e)}</div>
                </div>
              );
            })}
          </div>
          {/* P&L Summary Strip */}
          <div className="bg-gray-50 rounded-lg px-3 py-2.5 flex items-center justify-between flex-wrap gap-2">
            {[
              { label: '매출', ...pl.plSummary.revenue },
              { label: '영업이익', ...pl.plSummary.operatingProfit },
              { label: '세전이익', ...pl.plSummary.preTaxProfit },
              { label: '당기순이익', ...pl.plSummary.netIncome },
            ].map((item, i) => (
              <div key={i} className={`flex items-center gap-1.5 ${i === 3 ? 'bg-blue-50 rounded-md px-2.5 py-1 border border-blue-200' : ''}`}>
                <span className="text-xs text-gray-500 font-bold">{item.label}</span>
                <span className="text-sm font-mono text-gray-400">{fmt(item.fy2025)}</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                <span className={`text-sm font-mono font-bold ${i === 3 ? 'text-blue-700' : 'text-gray-800'}`}>{fmt(item.fy2026e)}</span>
                <span className={`text-xs font-semibold ${getChangeColor(item.changePct)}`}>{fmtPct(item.changePct)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== BS TABLE + CHARTS ===== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-md py-0">
            <CardHeader className="pb-3 pt-4 flex-row items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> 재무상태표 (B/S)
              </CardTitle>
              <button onClick={() => setShowAll(!showAll)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors">
                {showAll ? '요약보기' : '전체보기'}
              </button>
            </CardHeader>
            <CardContent className="px-0 pb-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-700 hover:to-slate-600">
                    <TableHead className="text-white text-xs w-[170px] pl-4">계정과목</TableHead>
                    <TableHead className="text-white text-xs text-right w-[85px]">25.12</TableHead>
                    <TableHead className="text-amber-200 text-xs text-right w-[85px] font-bold">26.02</TableHead>
                    <TableHead className="text-white text-xs text-right w-[70px]">26년증감</TableHead>
                    <TableHead className="text-blue-200 text-xs text-right w-[85px] font-bold">26.12E</TableHead>
                    <TableHead className="text-white text-xs text-right w-[70px] pr-4">연간증감</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <BSSection label="자산" color="blue" items={data.balanceSheet.assets} isExpanded={expanded['asset'] || showAll} onToggle={() => toggle('asset')} />
                  <BSSection label="부채" color="red" items={data.balanceSheet.liabilities} isExpanded={expanded['liability'] || showAll} onToggle={() => toggle('liability')} isNegativeGood />
                  <BSSection label="자본" color="emerald" items={data.balanceSheet.equity} isExpanded={expanded['equity'] || showAll} onToggle={() => toggle('equity')} isEquity />
                  <TableRow className="bg-slate-50"><TableCell colSpan={6} className="py-0.5" /></TableRow>
                  {data.balanceSheet.totals.map((item, i) => {
                    const mom = calcChange(item.feb26, item.dec25);
                    const yoy = calcChange(item.dec26e, item.dec25);
                    const neg = item.label === '부채총계';
                    return (
                      <TableRow key={i} className="bg-slate-50 font-bold text-sm border-t-2 border-slate-300">
                        <TableCell className="pl-6 font-bold">{item.label}</TableCell>
                        <TableCell className="text-right font-mono text-gray-500">{fmt(item.dec25)}</TableCell>
                        <TableCell className="text-right font-mono font-bold bg-amber-50/50">{fmt(item.feb26)}</TableCell>
                        <TableCell className={`text-right font-mono ${getChangeColor(mom.diff, neg)}`}>{fmt(mom.diff)}</TableCell>
                        <TableCell className="text-right font-mono font-bold text-blue-700 bg-blue-50/30">{fmt(item.dec26e)}</TableCell>
                        <TableCell className={`text-right font-mono pr-4 ${getChangeColor(yoy.diff, neg)}`}>{fmtPct(yoy.pct)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="border-0 shadow-md py-0">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-blue-600" /> 자산구성</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart><Pie data={data.assetComposition} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                  {data.assetComposition.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie><Tooltip formatter={(v: number) => `${fmt(v)}억원`} /></PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1 mt-2">
                {data.assetComposition.map((item, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[11px]">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md py-0">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-600" /> 주요 재무비율</CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <table className="w-full text-xs">
                <thead><tr className="text-gray-400 border-b">
                  <th className="text-left py-1 font-medium">지표</th>
                  <th className="text-right py-1 font-medium">25.12</th>
                  <th className="text-right py-1 font-medium text-amber-600">26.02</th>
                  <th className="text-right py-1 font-medium text-blue-600">26.12E</th>
                </tr></thead>
                <tbody>
                  {Object.values(data.ratios).map((r: any, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-600">{r.label}</td>
                      <td className="text-right py-1.5 text-gray-500">{r.dec25.toFixed(1)}{r.unit}</td>
                      <td className="text-right py-1.5 font-semibold">{r.feb26.toFixed(1)}{r.unit}</td>
                      <td className="text-right py-1.5 font-semibold text-blue-700">{r.dec26e.toFixed(1)}{r.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== ASSET 2조 THRESHOLD ===== */}
      <Card className="border-0 shadow-lg border-l-4 border-l-amber-400 py-0">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-base font-bold text-amber-800">{at.title}</CardTitle>
            <div className="flex gap-1.5 ml-auto">
              <Badge className="bg-red-100 text-red-700 text-xs">긴급 {at.items.filter((x: any) => x.urgency === 'high').length}건</Badge>
              <Badge className="bg-amber-100 text-amber-800 text-xs">일반 {at.items.filter((x: any) => x.urgency === 'medium').length}건</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>26.02 실적: {fmt(at.current.feb26)}억 ({(at.current.feb26 / 10000 * 100).toFixed(1)}%)</span>
              <span className="text-amber-600 font-bold">2조원 기준</span>
              <span className="text-blue-600">26.12E: {fmt(at.current.dec26e)}억</span>
            </div>
            <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                style={{ width: `${(at.current.feb26 / at.current.dec26e) * 100}%` }} />
              <div className="absolute h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full opacity-30"
                style={{ width: '100%' }} />
              <div className="absolute h-full w-0.5 bg-red-500"
                style={{ left: `${(at.threshold / at.current.dec26e) * 100}%` }} />
              <div className="absolute text-[9px] text-red-600 font-bold"
                style={{ left: `${(at.threshold / at.current.dec26e) * 100 - 2}%`, top: '-14px' }}>2조</div>
            </div>
          </div>

          {/* HIGH urgency items */}
          <div className="mb-2 text-xs font-bold text-red-700 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> 긴급 대응 필요 (상법 개정 2026년 시행)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-4">
            {at.items.filter((x: any) => x.urgency === 'high').map((item: any) => (
              <div key={item.id} className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-xs font-bold text-gray-800">{item.requirement}</span>
                  {item.isNew && <Badge className="bg-red-500 text-white text-[9px] px-1 py-0 ml-auto">NEW</Badge>}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.detail}</p>
                <div className="text-[10px] text-gray-400 mt-1 font-mono">{item.basis}</div>
              </div>
            ))}
          </div>

          {/* MEDIUM urgency items */}
          <div className="mb-2 text-xs font-bold text-amber-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 기존 요건 + 추가 공시의무
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {at.items.filter((x: any) => x.urgency === 'medium').map((item: any) => (
              <div key={item.id} className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-bold text-gray-800">{item.requirement}</span>
                  {item.isNew && <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 ml-auto">NEW</Badge>}
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{item.detail}</p>
                <div className="text-[10px] text-gray-400 mt-1 font-mono">{item.basis}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ===== CF WATERFALL + DETAIL ===== */}
      <Card className="border-0 shadow-lg py-0">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold shadow">3</div>
            <CardTitle className="text-sm font-bold">{cf.title}</CardTitle>
            <span className="text-[10px] text-gray-400 ml-1">{cf.description}</span>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          {/* Cash Flow Equation Bar */}
          <div className="bg-emerald-50/50 rounded-lg border border-emerald-200 p-3 mb-4">
            <div className="flex items-center justify-center gap-2 text-sm font-mono flex-wrap">
              <div className="text-center">
                <div className="text-[10px] text-gray-400">기초현금</div>
                <span className="font-bold text-violet-700 text-base">{fmt(cf.flow.beginningCash)}</span>
              </div>
              <span className="text-gray-300 text-lg">+</span>
              <div className="text-center">
                <div className="text-[10px] text-gray-400">영업CF</div>
                <span className="font-bold text-emerald-600 text-base">{fmt(cf.flow.operatingCF)}</span>
              </div>
              <span className="text-gray-300 text-lg">+</span>
              <div className="text-center">
                <div className="text-[10px] text-gray-400">자산매각·회수</div>
                <span className="font-bold text-blue-600 text-base">{fmt(cf.flow.assetRecovery)}</span>
              </div>
              <span className="text-gray-300 text-lg">−</span>
              <div className="text-center">
                <div className="text-[10px] text-gray-400">배당</div>
                <span className="font-bold text-amber-600 text-base">{fmt(Math.abs(cf.flow.financingCF))}</span>
              </div>
              <span className="text-gray-300 text-lg">=</span>
              <div className="text-center bg-blue-50 rounded-lg px-3 py-1 border border-blue-200">
                <div className="text-[10px] text-blue-400">기말현금</div>
                <span className="font-bold text-blue-700 text-lg">{fmt(cf.flow.endingCash)}</span>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 text-xs ml-1">+{fmtPct(cf.flow.netChangePct)}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Waterfall Chart */}
            <div className="bg-white rounded-lg border border-gray-100 p-3">
              <div className="text-xs font-bold text-gray-700 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" /> FY2026E 현금 변동 워터폴 (억원)
                </span>
                <span className="text-[10px] text-gray-400 font-normal">기초 {fmt(cf.flow.beginningCash)} → 기말 {fmt(cf.flow.endingCash)}</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={waterfallData} barCategoryGap="20%" margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6B7280' }} axisLine={{ stroke: '#CBD5E1' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const d = payload[0]?.payload;
                      if (!d) return null;
                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2.5 text-xs">
                          <div className="font-semibold text-slate-800 mb-1">{d.name}</div>
                          <div className={`font-bold ${d.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                            {d.isBeginEnd ? '' : d.valueWithSign > 0 ? '+' : ''}{fmt(d.valueWithSign)}억
                          </div>
                          {!d.isBeginEnd && (
                            <div className="text-slate-500 mt-0.5">누적: {fmt(d.cumulative)}억</div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="base" stackId="waterfall" fill="transparent" />
                  <Bar dataKey="absVal" stackId="waterfall" radius={[3, 3, 0, 0]}>
                    {waterfallData.map((entry, index) => {
                      let fill = entry.isPositive ? '#10B981' : '#EF4444';
                      if (entry.isBeginEnd) fill = entry.name === '기초현금' ? '#7C3AED' : '#2563EB';
                      return <Cell key={index} fill={fill} />;
                    })}
                    <LabelList
                      dataKey="absVal"
                      position="top"
                      content={(props: any) => {
                        const { x, y, width, index } = props;
                        const item = waterfallData[index];
                        if (!item) return null;
                        const val = item.valueWithSign;
                        const label = item.isBeginEnd ? `${val.toFixed(0)}` : `${val > 0 ? '+' : ''}${val.toFixed(0)}`;
                        const color = item.isBeginEnd ? (item.name === '기초현금' ? '#7C3AED' : '#2563EB') : val >= 0 ? '#059669' : '#DC2626';
                        return (
                          <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={10} fontWeight={700} fill={color}>{label}</text>
                        );
                      }}
                    />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                {waterfallData.map((item, i) => {
                  const fill = item.isBeginEnd ? (item.name === '기초현금' ? '#7C3AED' : '#2563EB') : item.isPositive ? '#10B981' : '#EF4444';
                  return (
                    <div key={i} className="flex items-center gap-1 text-[10px]">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: fill }} />
                      <span className="text-gray-500">{item.name}</span>
                      <span className={`font-mono font-bold ${item.isBeginEnd ? 'text-indigo-600' : item.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {item.isBeginEnd ? '' : item.valueWithSign > 0 ? '+' : ''}{fmt(item.valueWithSign)}억
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CF Detail */}
            <div className="bg-white rounded-lg border border-gray-100 p-3 space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-emerald-700">I. 영업활동CF: {fmt(cf.flow.operatingCF)}억</span>
                </div>
                {cf.operatingCFDetail.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] text-gray-600 py-0.5">
                    <span>{item.label}</span>
                    <span className={`font-mono ${item.value < 0 ? 'text-red-500' : 'text-gray-700'}`}>{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-blue-700">II. 자산매각·회수: +{fmt(cf.flow.assetRecovery)}억</span>
                </div>
                {cf.investingCFDetail.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] text-gray-600 py-0.5">
                    <span>{item.label}</span>
                    <span className={`font-mono ${item.value < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-amber-700">III. 재무활동CF: {fmt(cf.flow.financingCF)}억</span>
                </div>
                {cf.financingCFDetail.map((item, i) => (
                  <div key={i} className="flex justify-between text-[11px] text-gray-600 py-0.5">
                    <span>{item.label}</span>
                    <span className="font-mono text-red-500">{fmt(item.value)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[11px] text-gray-400 py-0.5">
                <span>법인세 납부</span>
                <span className="font-mono">{fmt(cf.flow.taxPayment)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ===== MONTHLY CASH FLOW PLAN ===== */}
      <Card className="border-0 shadow-lg py-0">
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-sm font-bold">{mp.title}</CardTitle>
            <Badge className="bg-amber-100 text-amber-800 text-[10px] ml-2">1~2월 실적</Badge>
            <Badge className="bg-blue-100 text-blue-800 text-[10px]">3~12월 추정</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4 pt-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[900px]">
              <thead>
                <tr className="bg-gradient-to-r from-slate-700 to-slate-600 text-white">
                  <th className="text-left py-2 px-3 font-medium w-[130px] sticky left-0 bg-slate-700 z-10">구분</th>
                  {mp.months.map((m, i) => (
                    <th key={i} className={`text-right py-2 px-2 font-medium ${i <= 1 ? 'text-amber-200' : ''}`}>{m}</th>
                  ))}
                  <th className="text-right py-2 px-3 font-bold text-blue-200">연간</th>
                </tr>
              </thead>
              <tbody>
                {/* 기초현금 */}
                <MonthlyRow label="기초현금" values={mp.beginningCash} annual={mp.annual.beginningCash} isBold bgClass="bg-violet-50/50" />
                {/* 영업CF */}
                <MonthlyRow label="영업CF" values={mp.operatingCF} annual={mp.annual.operatingCF} isBold bgClass="bg-emerald-50/50" />
                <MonthlyRow label="  지주부문" values={mp.holdingDiv} annual={mp.annual.holdingDiv} isSubItem />
                <MonthlyRow label="  물류부문" values={mp.logistics} annual={mp.annual.logistics} isSubItem />
                <MonthlyRow label="  기타" values={mp.otherOp} annual={mp.annual.otherOp} isSubItem />
                {/* 투자·조달 */}
                <MonthlyRow label="금융상품회수" values={mp.financialProducts} annual={mp.annual.financialProducts} bgClass="bg-blue-50/30" />
                <MonthlyRow label="역삼사옥매각" values={mp.buildingSale} annual={mp.annual.buildingSale} bgClass="bg-blue-50/30" />
                <MonthlyRow label="배당금지급" values={mp.dividend} annual={mp.annual.dividend} isNegative bgClass="bg-red-50/30" />
                <MonthlyRow label="법인세" values={mp.tax} annual={mp.annual.tax} />
                {/* 기말현금 */}
                <MonthlyRow label="기말현금" values={mp.endingCash} annual={mp.annual.endingCash} isBold highlight bgClass="bg-blue-50/50" />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

/* ===== BS Section Component ===== */
function BSSection({ label, color, items, isExpanded, onToggle, isNegativeGood, isEquity }: any) {
  const cm: any = {
    blue: { bg: 'bg-blue-100/60', hover: 'hover:bg-blue-100/80', text: 'text-blue-800', hdr: 'bg-blue-50/50' },
    red: { bg: 'bg-red-100/60', hover: 'hover:bg-red-100/80', text: 'text-red-800', hdr: 'bg-red-50/50' },
    emerald: { bg: 'bg-emerald-100/60', hover: 'hover:bg-emerald-100/80', text: 'text-emerald-800', hdr: 'bg-emerald-50/50' },
  };
  const c = cm[color];
  return (
    <>
      <TableRow className={`${c.bg} ${c.hover} cursor-pointer`} onClick={onToggle}>
        <TableCell colSpan={6} className="py-2 pl-4">
          <div className={`flex items-center gap-2 font-bold text-sm ${c.text}`}>
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}{label}
          </div>
        </TableCell>
      </TableRow>
      {items.map((item: any, i: number) => {
        if (!(item.isHeader || item.isAlwaysVisible || isExpanded)) return null;
        const mom = calcChange(item.feb26, item.dec25);
        const yoy = calcChange(item.dec26e, item.dec25);
        return (
          <TableRow key={i} className={`${item.isHeader ? `${c.hdr} font-semibold` : ''} ${item.highlight ? 'bg-yellow-50/50' : ''} ${item.isSubItem ? 'text-xs text-gray-600' : 'text-sm'}`}>
            <TableCell className={`${item.isSubItem ? 'pl-10' : item.isHeader ? `pl-6 font-semibold ${c.text}` : isEquity ? `pl-8 font-medium ${c.text}` : 'pl-8'}`}>{item.label}</TableCell>
            <TableCell className="text-right font-mono text-gray-500">{fmt(item.dec25)}</TableCell>
            <TableCell className="text-right font-mono font-semibold bg-amber-50/30">{fmt(item.feb26)}</TableCell>
            <TableCell className={`text-right font-mono ${getChangeColor(mom.diff, isNegativeGood)}`}>{fmt(mom.diff)}</TableCell>
            <TableCell className="text-right font-mono font-semibold text-blue-700 bg-blue-50/20">{fmt(item.dec26e)}</TableCell>
            <TableCell className={`text-right font-mono pr-4 ${getChangeColor(yoy.diff, isNegativeGood)}`}>{item.dec25 !== 0 ? fmtPct(yoy.pct) : '-'}</TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

/* ===== Monthly Row Component ===== */
function MonthlyRow({ label, values, annual, isBold, isSubItem, isNegative, highlight, bgClass }: {
  label: string; values: number[]; annual: number;
  isBold?: boolean; isSubItem?: boolean; isNegative?: boolean; highlight?: boolean; bgClass?: string;
}) {
  return (
    <tr className={`border-b border-gray-100 ${bgClass || ''} ${highlight ? 'border-t-2 border-t-blue-300' : ''}`}>
      <td className={`py-1.5 px-3 sticky left-0 z-10 whitespace-nowrap ${bgClass || 'bg-white'} ${isBold ? 'font-bold text-gray-900' : isSubItem ? 'text-gray-400 pl-6' : 'text-gray-600'}`}>
        {label}
      </td>
      {values.map((v, i) => (
        <td key={i} className={`text-right py-1.5 px-2 font-mono ${i <= 1 ? 'bg-amber-50/30' : ''} ${
          isBold ? 'font-bold text-gray-900' : isSubItem ? 'text-gray-400' :
          v < 0 ? 'text-red-500' : v === 0 ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {v === 0 ? '-' : isBold || highlight ? fmt(v) : (v < 0 ? `(${Math.abs(v).toFixed(1)})` : v.toFixed(1))}
        </td>
      ))}
      <td className={`text-right py-1.5 px-3 font-mono border-l border-gray-200 ${
        isBold ? 'font-bold text-blue-700' : annual < 0 ? 'text-red-500 font-medium' : annual === 0 ? 'text-gray-300' : 'text-gray-700 font-medium'
      }`}>
        {fmt(annual)}
      </td>
    </tr>
  );
}
