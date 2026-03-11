'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import HcDashboard from '@/components/dashboards/HcDashboard';
import OcBsDashboard from '@/components/dashboards/OcBsDashboard';
import OcCfDashboard from '@/components/dashboards/OcCfDashboard';

type TabKey = 'oc-bs' | 'oc-cf' | 'hc';

const tabs: { key: TabKey; label: string; sublabel: string }[] = [
  { key: 'oc-bs', label: 'OC BS', sublabel: 'F&F 재무상태표' },
  { key: 'oc-cf', label: 'OC CF', sublabel: 'F&F 자금계획' },
  { key: 'hc',    label: 'HC',    sublabel: 'F&F Holdings BS/CF' },
];

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>('oc-bs');

  return (
    <div className="min-h-screen">
      {/* ===== SHARED HEADER ===== */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-indigo-800 px-6 py-5 shadow-xl">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">FNF 26.1월 BS/CF 리포트</h1>
              <p className="text-slate-300 text-sm mt-1">F&F · F&F Holdings | 재무상태표 · 자금계획</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs px-3 py-1">26년 1월</Badge>
              <Badge className="bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs px-3 py-1">목표: 26년 12월</Badge>
            </div>
          </div>

          {/* ===== TAB BAR ===== */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`
                  px-5 py-2.5 rounded-t-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.key
                    ? 'bg-white text-slate-800 shadow-lg -mb-px'
                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                  }
                `}
              >
                <span className="font-bold">{tab.label}</span>
                <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-slate-500' : 'text-slate-400'}`}>
                  {tab.sublabel}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="bg-white/50 min-h-[calc(100vh-200px)]">
        {activeTab === 'oc-bs' && <OcBsDashboard />}
        {activeTab === 'oc-cf' && <OcCfDashboard />}
        {activeTab === 'hc' && <HcDashboard />}
      </div>
    </div>
  );
}
