# FNF 대시보드 - 월간 업데이트 기준서

> **목적**: 매월 OC BS / OC CF / HC 데이터를 소스 대시보드에서 가져와 통합 대시보드 갱신
> **원칙**: 소스 대시보드의 JSON 파일을 복사하여 반영 (컴포넌트 코드 수정 최소화)
> **작성일**: 2026-03-13

---

## 소스 대시보드 위치

| 탭 | 소스 프로젝트 경로 | JSON 파일 | 비고 |
|---|---|---|---|
| **OC BS** | `C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf-dashboard_v2\` | `src/data/YYYY-MM.json` (예: `2026-02.json`) | 매월 새 파일 생성됨 |
| **OC CF** | `C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf_CF\cf-dashboard\` | `src/data/cashflow.json` | 기존 파일 갱신 |
| **HC** | (엑셀 원천) `C:\Users\AC1144\AI_Fin_Analysis\Claude\Finance_Report V1\` | `26년 HC 재무제표(26.MM).xlsx` | 수동 JSON 변환 필요 |

---

## 업데이트 흐름 요약

```
1. 소스 대시보드에서 기준월 JSON 확인
   ├── OC BS: Monthly_Report\fnf-dashboard_v2\src\data\YYYY-MM.json
   ├── OC CF: Monthly_Report\fnf_CF\cf-dashboard\src\data\cashflow.json
   └── HC:    Finance_Report V1\26년 HC 재무제표(26.MM).xlsx → hc-financial.json
     ↓
2. JSON 파일 복사/반영
   ├── OC BS: 소스 JSON → hc-dashboard\src\data\oc-bs-YYYY-MM.json
   ├── OC CF: 소스 JSON → hc-dashboard\src\data\cashflow.json (직접 복사)
   └── HC:    hc-financial.json 수동 갱신
     ↓
3. 코드 변경
   ├── OcBsDashboard.tsx: import 경로 + 컬럼명 매핑 확인
   ├── page.tsx: 헤더 텍스트 (26.N월)
   └── layout.tsx: 메타데이터/푸터
     ↓
4. npm run build → 검증 → git push → Vercel 자동배포
```

---

## 1. OC CF 업데이트 (가장 간단)

### 1-1. 소스 확인

```
소스: C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf_CF\cf-dashboard\src\data\cashflow.json
대상: C:\Users\AC1144\AI_Fin_Analysis\Claude\Finance_Report V1\hc-dashboard\src\data\cashflow.json
```

### 1-2. 복사 명령

```bash
cp "C:/Users/AC1144/AI_Fin_Analysis/Claude/Monthly_Report/fnf_CF/cf-dashboard/src/data/cashflow.json" \
   "C:/Users/AC1144/AI_Fin_Analysis/Claude/Finance_Report V1/hc-dashboard/src/data/cashflow.json"
```

### 1-3. 확인 포인트

- `meta.period`: 기준월 확인 (예: "2026년 2월 기준")
- `kpi.*`: KPI 5개 수치 (기초/영업/투자/조달/기말)
- `isEstimate`: 실적 확정월은 `false`, 추정월은 `true`
- `monthlyTrend`: 차트 데이터 정상 여부
- `operatingCFBridge`: 영업CF 구성 수식
- 코드 변경 불필요 (동일한 CashFlowReport 타입)

---

## 2. OC BS 업데이트

### 2-1. 소스 확인

```
소스: C:\Users\AC1144\AI_Fin_Analysis\Claude\Monthly_Report\fnf-dashboard_v2\src\data\
      └── YYYY-MM.json (예: 2026-02.json, 2026-03.json ...)
      └── index.json (사용 가능한 월 목록)
대상: C:\Users\AC1144\AI_Fin_Analysis\Claude\Finance_Report V1\hc-dashboard\src\data\oc-bs-YYYY-MM.json
```

### 2-2. 복사 명령 (예시: 26년 3월)

```bash
cp "C:/Users/AC1144/AI_Fin_Analysis/Claude/Monthly_Report/fnf-dashboard_v2/src/data/2026-03.json" \
   "C:/Users/AC1144/AI_Fin_Analysis/Claude/Finance_Report V1/hc-dashboard/src/data/oc-bs-2026-03.json"
```

### 2-3. ⚠️ 컬럼 구조 차이 (중요)

**소스(fnf-dashboard_v2)와 hc-dashboard의 balanceSheet 컬럼명이 다릅니다:**

| 구분 | 소스 (fnf-dashboard_v2) | hc-dashboard (OcBsDashboard.tsx) |
|---|---|---|
| 비교 기준 | 전년동월 / 전년말 / **당월** / 당년말(e) | 전년동월 / **전월** / **당월** |
| 컬럼명 예시 | `feb25` / `dec25` / `feb26` / `dec26e` | `feb25` / `jan26` / `feb26` |
| 테이블 헤더 | 25년 2월 / 25년 12월 / 26년 2월 / 26년 12월(e) | 25년 2월 / 26년 1월 / 26년 2월 |

**OcBsDashboard.tsx에서 참조하는 컬럼명:**

```
balanceSheet.totals[*]:  feb25, jan26, feb26, momChange, yoyChange, ...
balanceSheet.assets[*]:  feb25, jan26, feb26, momChange, yoyChange, ...
workingCapital.ar[*]:    jan26, feb26, change, changePercent
workingCapital.inventory[*].items[*]: jan26, feb26, change, changePercent
creditVerification[*]:   nov, dec, jan (3개월 슬라이딩)
```

**소스 데이터의 실제 컬럼명:**

```
balanceSheet.totals[*]:  feb25, dec25, feb26, dec26e, momChange, yoyChange, ...
balanceSheet.assets[*]:  feb25, dec25, feb26, dec26e, momChange, yoyChange, ...
workingCapital.ar[*]:    dec25, feb26, change, changePercent
workingCapital.inventory[*].items[*]: dec25, feb26, change, changePercent
creditVerification[*]:   dec, jan, feb (3개월 슬라이딩)
```

### 2-4. 반영 방법 (2가지 중 택 1)

#### 방법 A: 컴포넌트 수정 (권장 - 1회 수정 후 매월 직접 복사 가능)

OcBsDashboard.tsx를 소스의 컬럼명에 맞게 수정:

1. **balanceSheet 테이블 헤더**: "26년 1월" → "25년 12월", 4열 추가 시 "26년 12월(e)"
2. **컬럼 참조**: `jan26` → `dec25`, `dec26e` 추가
3. **workingCapital.ar**: `jan26` → `dec25`
4. **workingCapital.inventory**: `jan26` → `dec25`
5. **creditVerification**: `nov/dec/jan` → `dec/jan/feb`

#### 방법 B: JSON 변환 (코드 수정 없이)

소스 JSON을 hc-dashboard 형식으로 변환:

```
dec25 → jan26 (이전 비교월 컬럼에 매핑)
dec/jan/feb → nov/dec/jan (여신검증 컬럼 시프트)
```

### 2-5. import 경로 변경

```typescript
// src/components/dashboards/OcBsDashboard.tsx (4행)
// 변경 전:
import rawData from '@/data/oc-bs-2026-02.json';
// 변경 후:
import rawData from '@/data/oc-bs-2026-03.json';
```

---

## 3. HC 업데이트

### 3-1. 소스

```
엑셀: C:\Users\AC1144\AI_Fin_Analysis\Claude\Finance_Report V1\26년 HC 재무제표(26.MM).xlsx
대상: hc-dashboard\src\data\hc-financial.json
```

### 3-2. 수동 갱신 항목

HC 데이터는 엑셀에서 수동으로 JSON을 갱신해야 합니다:

1. `meta.currentMonth`, `meta.updatedAt`
2. `bsImpact.keyItems[*].jan26` → 해당월 실적으로 변경
3. `balanceSheet.assets/liabilities/equity/totals` → 해당월 실적
4. `cashImpact.flow` → 기초/기말현금 실적
5. `monthlyCashPlan` → 실적 확정월 반영
6. `assetThreshold.current.jan26` → 해당월 자산총계 실적
7. `ratios` → 재무비율 갱신

---

## 4. 공통 코드 변경

### 4-1. page.tsx (탭 쉘 헤더)

```typescript
// src/app/page.tsx
<h1>FNF 26.N월 BS/CF 리포트</h1>      // N = 기준월
<Badge>26년 N월</Badge>                // N = 기준월
```

### 4-2. layout.tsx (메타데이터/푸터)

```typescript
title: 'FNF 26.N월 BS/CF 리포트'
footer: 'FNF 26.N월 BS/CF 리포트 | F&F · F&F Holdings'
```

---

## 5. 검증 체크리스트

```
□ npm run dev → http://localhost:3000 정상 로드
□ OC BS 탭
  □ 재무상태표 숫자 정상
  □ 운전자본 분석 숫자 일치
  □ 회전율 DIO/DSO/DPO 계산 정상
  □ 여신기준 3개월 슬라이딩 정상
□ OC CF 탭
  □ KPI 카드 5개 숫자 정상
  □ 월별 차트 실적 반영
  □ CF 상세 테이블 값 일치
  □ 영업CF Bridge 수식 정상
□ HC 탭
  □ BS 핵심영향 KPI 정상
  □ 2조원 ALERT 배너 수치 정상
  □ BS 테이블 숫자 정상
  □ 워터폴 차트 정상
  □ 월별 자금계획표 정상
□ 콘솔 에러 없음
□ npm run build 성공
```

---

## 6. 배포

```bash
git add src/data/ src/app/page.tsx src/app/layout.tsx
git add src/components/dashboards/OcBsDashboard.tsx  # BS import 경로 변경 시
git commit -m "Update: 26년 N월 데이터 반영"
git push origin main  # → Vercel 자동배포
```

---

## 부록: 데이터 소스 요약

### OC BS 소스 JSON 구조 (`fnf-dashboard_v2/src/data/YYYY-MM.json`)

```
├── meta: { year, month, reportDate, updatedAt, status }
├── financialData: { revenue, cogs, operatingProfit, totalAssets, cash, receivables, inventory, ... }
│     └── 각 항목: { current, currentYtd, previousMonth, previousYear, previousYearYtd }
├── incomeStatement: { revenue[], costs[], operatingProfit }
├── channelSales: [{ channel, current, previous, yoy }]
├── exportSales: [{ region, current, previous, yoy }]
├── brandSales: [{ brand, current, previous, yoy }]
├── balanceSheet: { assets[], liabilities[], equity[], totals[] }
│     └── 컬럼: feb25, dec25, feb26, dec26e (기준월에 따라 변동)
├── workingCapital: { nwc, components[], ar[], arNote, inventory[] }
│     └── ar[]: { label, dec25, feb26, change, changePercent }
│     └── inventory[]: { brand, items[{ label, dec25, feb26, change, changePercent }] }
├── creditVerification: [{ channel, dec, jan, feb, arBalance, arRatio, months, status, notes[] }]
├── annualized: { revenue, cogs, operatingProfit, ... }
├── aiInsights: { positive[], warning[] }
├── ratios: { profitability, stability, activity }
├── notes: []
└── unifiedInsights: { positive[], warning[] }
```

### OC CF 소스 JSON 구조 (`cf-dashboard/src/data/cashflow.json`)

```
├── meta: { title, period, unit, updatedAt }
├── kpi: { beginningCash, operatingCF, investmentCF, financingCF, endingCash, *Prev }
├── beginningCash: { label, y24Annual, y25H1, y25Monthly, y25Total, y26Monthly, y26Total, isEstimate }
├── operating: { total: CashFlowLineItem, subItems[] }
├── investment: { total: CashFlowLineItem, items[] }
├── financing: { total: CashFlowLineItem, items[] }
├── endingCash: CashFlowLineItem
├── ocBorrowingBalance: CashFlowLineItem
├── currencyBalances: [{ currency, label, amount, previousAmount, yearEndEstimate, note }]
├── totalAssets: CashFlowLineItem
├── yoyComparison: [{ category, label, y25Value, y26Value, change, note, isSummary?, isSpacer? }]
├── highlights: [{ label, value, detail, change, changeNote }]
├── monthlyTrend: [{ month, displayLabel, operatingCF, investmentCF, endingCash, isEstimate }]
├── insights: []
├── warnings: []
├── actionPlan: []
├── operatingCFAnalysis: { summary, items[] }
├── operatingCFBridge: { total, operatingProfit, workingCapital, nonCash, others }
├── workingCapitalDetail: [{ label, y26Value, y25Value, change }]
├── investmentYoY: [{ label, y25Value, y26Value, change, note }]
└── fxDepositAnalysis: { title, unit, comparison[], interestDiff, scenarios[] }
```
