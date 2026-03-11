# FNF 26.1월 BS/CF 리포트 - 마스터 가이드

> **프로젝트**: FNF 26.1월 BS/CF 리포트 (3탭 통합 대시보드)
> **작성일**: 2026-03-10
> **기술스택**: Next.js 16.1.1 + React 19 + TypeScript + Tailwind CSS v4 + Recharts 3.6 + shadcn/ui
> **배포 대상**: Vercel

---

## 1. 프로젝트 개요

F&F그룹(OC: F&F, HC: F&F Holdings)의 월간 재무 리포트를 3개 탭으로 통합한 대시보드입니다.

| 탭 | 데이터 파일 | 컴포넌트 | 단위 | 내용 |
|---|---|---|---|---|
| **OC BS** | `oc-bs-2026-01.json` | `OcBsDashboard.tsx` | 백만원 | F&F 재무상태표 (BS + 운전자본 + 회전율 + 여신검증) |
| **OC CF** | `cashflow.json` | `OcCfDashboard.tsx` | 백만원 | F&F 자금계획 (KPI + CF상세 + 투자분석 + 증감내역) |
| **HC** | `hc-financial.json` | `HcDashboard.tsx` | 억원 | F&F Holdings BS/CF (손익→BS→현금 3단계 스토리) |

---

## 2. 디렉토리 구조

```
hc-dashboard/
├── .claude/
│   └── launch.json              # 개발서버 설정 (port 3000)
├── src/
│   ├── app/
│   │   ├── page.tsx             # 탭 쉘 (공통 헤더 + 3탭 전환)
│   │   ├── layout.tsx           # 메타데이터 + 푸터
│   │   └── globals.css          # Tailwind 글로벌 스타일
│   ├── components/
│   │   ├── dashboards/
│   │   │   ├── OcBsDashboard.tsx   # OC BS 대시보드
│   │   │   ├── OcCfDashboard.tsx   # OC CF 대시보드
│   │   │   └── HcDashboard.tsx     # HC 대시보드
│   │   └── ui/                     # shadcn/ui 공통 컴포넌트
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── separator.tsx
│   │       └── table.tsx
│   ├── data/                       # ★ JSON 데이터 (매월 업데이트)
│   │   ├── oc-bs-2026-01.json      # OC BS 데이터 (1,569행)
│   │   ├── cashflow.json           # OC CF 데이터 (1,081행)
│   │   └── hc-financial.json       # HC 데이터 (189행)
│   ├── types/
│   │   └── cashflow.ts             # OC CF 타입 정의
│   └── lib/
│       └── utils.ts                # cn() 유틸리티
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. 탭 쉘 구조 (page.tsx)

```
page.tsx
├── 공통 헤더: "FNF 26.1월 BS/CF 리포트"
│   ├── Badge: "26년 1월", "목표: 26년 12월"
│   └── 탭 바: [OC BS] [OC CF] [HC]
├── 탭 콘텐츠 영역
│   ├── activeTab === 'oc-bs' → <OcBsDashboard />
│   ├── activeTab === 'oc-cf' → <OcCfDashboard />
│   └── activeTab === 'hc'    → <HcDashboard />
└── layout.tsx 푸터
```

**탭 전환 방식**: `useState<TabKey>` 클라이언트 상태 (라우트 없이 즉시 전환)

---

## 4. JSON 데이터 스키마 상세

### 4-1. OC BS: `oc-bs-2026-01.json` (F&F 재무상태표)

**단위: 백만원** | 파일 크기: ~1,569행

```jsonc
{
  "meta": {
    "year": 2026,
    "month": 1,                     // ← 매월 변경
    "reportDate": "2026-01-31",     // ← 매월 변경
    "updatedAt": "2026-02-10",      // ← 업데이트 날짜
    "status": "published"
  },

  // ===== 핵심 재무데이터 =====
  "financialData": {
    // 각 항목: { current, previousMonth, previousYear }
    "revenue": { "current": 1638, "previousMonth": 1644, "previousYear": 1643 },
    "domesticRevenue": { ... },
    "exportRevenue": { ... },
    "cogs": { ... },                 // 매출원가
    "operatingProfit": { ... },
    "totalAssets": { ... },
    "currentAssets": { ... },
    "cash": { ... },
    "receivables": { ... },          // 매출채권
    "inventory": { ... },            // 재고자산
    "totalLiabilities": { ... },
    "borrowings": { ... },           // 차입금
    "payables": { ... },             // 매입채무
    "equity": { ... },
    "retainedEarnings": { ... },
    "domesticDiscountRate": { "current": 29.13, "previous": 30.0, ... },
    "exportShipmentRate": { ... }
  },

  // ===== 손익계산서 =====
  "incomeStatement": {
    "revenue": [                     // 택가, 실판매출, 국내/수출 등
      { "label": "택가", "current": 2998, "previous": 3049, "change": -51, "changePercent": -1.7, "ratio": 183.0 }
    ],
    "costs": [ ... ],                // 매출원가, 매출총이익, 점수수료, 판관비
    "operatingProfit": { ... }
  },

  // ===== 채널/수출 매출 =====
  "channelSales": [
    { "channel": "백화점", "current": 225, "previous": 199, "yoy": 13.1 }
  ],
  "exportSales": [
    { "region": "중국", "current": 810, "previous": 847, "yoy": -4.4 }
  ],

  // ===== 재무상태표 (BS 테이블) =====
  "balanceSheet": {
    "totals": [
      { "label": "자산총계", "jan25": 20267, "dec25": 22155, "jan26": 22938,
        "momChange": 783, "momChangePercent": 3.5,
        "yoyChange": 2671, "yoyChangePercent": 13.2 }
    ],
    "assets": [
      { "label": "현금및현금성자산", "jan25": 990, "dec25": 2709, "jan26": 3158,
        "momChange": 449, "yoyChange": 2168, "yoyChangePercent": 219.0,
        "isAlwaysVisible": true }
    ],
    "liabilities": [ ... ],
    "equity": [ ... ]
  },

  // ===== 운전자본 분석 =====
  "workingCapital": {
    "ar": [                          // 매출채권 상세
      { "label": "국내", "dec25": 917, "jan26": 1271, "change": 354, "changePercent": 38.6, "warning": false }
    ],
    "inventory": [                   // 브랜드별 재고
      { "brand": "Discovery", "items": [ ... ] }
    ]
  },

  // ===== 여신기준 검증 =====
  "creditVerification": [
    { "channel": "국내전체", "nov": 188, "dec": 130, "jan": 152,
      "arBalance": 2350, "arRatio": "500.4", "months": "5.0", "prevMonths": "4.7",
      "status": "danger", "notes": [...] }
  ],

  // ===== 연환산 데이터 (회전율 계산용) =====
  "annualized": {
    "revenue": 19662,                // 26년 1월 매출 × 12
    "cogs": 6897                     // 26년 1월 원가 × 12
  }
}
```

**OC BS 업데이트 시 변경 항목 (매월):**
1. `meta.month`, `meta.reportDate`, `meta.updatedAt`
2. 모든 `financialData.*` → current/previousMonth/previousYear 갱신
3. `balanceSheet.*` → jan26 컬럼에 해당월 데이터 입력
4. `workingCapital.*` → 채권/재고 상세 갱신
5. `creditVerification` → 11월~1월 → 12월~2월 슬라이딩
6. `annualized` → 해당월 매출/원가 × 12

---

### 4-2. OC CF: `cashflow.json` (F&F 자금계획)

**단위: 백만원** | 파일 크기: ~1,081행 | 타입: `src/types/cashflow.ts`

```jsonc
{
  "meta": {
    "title": "F&F 26년 자금계획",
    "period": "2026년 1월 기준",       // ← 매월 변경
    "unit": "백만원",
    "updatedAt": "2026-02-20"          // ← 업데이트 날짜
  },

  // ===== KPI 요약 =====
  "kpi": {
    "beginningCash": 270713,           // 26년 기초현금
    "operatingCF": 488166,             // 26년 영업CF 계
    "investmentCF": -63785,            // 26년 투자CF 계
    "financingCF": 0,                  // 26년 조달CF 계
    "endingCash": 695094,              // 26년 기말현금
    "beginningCashPrev": 54804,        // 25년 기초현금 (YoY용)
    "operatingCFPrev": 479667,
    "investmentCFPrev": -218343,
    "financingCFPrev": -45414,
    "endingCashPrev": 270714
  },

  // ===== 기초현금 (월별) =====
  "beginningCash": {
    "label": "기초현금",
    "y24Annual": 191280,
    "y25Total": 54804,
    "y26Monthly": { "1": 270713, "2": 315757, ... "12": 627091 },
    "y26Total": 270713,
    "isEstimate": { "1": false, "2": true, ... }   // 실적 vs 추정 구분
  },

  // ===== 영업CF =====
  "operating": {
    "total": { "label": "① 영업 CASH FLOW", "y26Monthly": {...}, "y26Total": 488166 },
    "subItems": [
      { "label": "국내수금", "y25Total": 641665, "y26Total": 705707 }
    ]
  },

  // ===== 투자CF =====
  "investment": {
    "total": { "label": "② 투자 CASH FLOW", "y26Monthly": {...}, "y26Total": -63785 },
    "items": [
      { "label": "법인세", "y26Monthly": {...}, "y26Total": -123800 }
    ]
  },

  // ===== 조달CF =====
  "financing": {
    "total": { ... },
    "items": [ ... ]
  },

  // ===== 기말현금 (월별) =====
  "endingCash": { "label": "조달후 기말잔액", "y26Monthly": {...}, "y26Total": 695094 },

  // ===== 분석 데이터 =====
  "monthlyTrend": [                    // 월별 차트 데이터
    { "month": "25-07", "displayLabel": "7월", "endingCash": 116171, "operatingCF": 40190, ... }
  ],
  "operatingCFBridge": {               // 영업CF 구성 수식
    "total": 488166, "operatingProfit": 524024, "workingCapital": -37776, ...
  },
  "workingCapitalDetail": [            // 운전자본 내역 (억원, BS기준)
    { "label": "매출채권", "y25Value": 1966, "y26Value": 2350, "change": 384 }
  ],
  "investmentYoY": [                   // 투자CF 전년비교
    { "label": "법인세", "y25Value": -110330, "y26Value": -123800, "change": -13470, "note": "..." }
  ],
  "yoyComparison": [                   // CF 증감내역 (전년대비)
    { "category": "영업", "label": "국내수금", "y25Value": 641665, "y26Value": 705707, ... }
  ],
  "currencyBalances": [                // 통화별 기말잔액
    { "currency": "KRW", "label": "원화", "amount": 582394, "previousAmount": 182089 }
  ],
  "insights": ["...", "..."],          // CF 인사이트 텍스트
  "actionPlan": ["...", "..."]         // 투자전략/액션플랜 텍스트
}
```

**OC CF 업데이트 시 변경 항목 (매월):**
1. `meta.period`, `meta.updatedAt`
2. `kpi.*` → 전체 KPI 수치 갱신
3. `operating/investment/financing` → y26Monthly의 실적월 isEstimate: false 전환 + 추정 수정
4. `beginningCash`, `endingCash` → 월별 값 갱신
5. `monthlyTrend` → 실적 확정월 추가/수정
6. 분석 텍스트: `insights`, `actionPlan`, `operatingCFAnalysis`

---

### 4-3. HC: `hc-financial.json` (F&F Holdings BS/CF)

**단위: 억원** | 파일 크기: ~189행

```jsonc
{
  "meta": {
    "company": "F&F Holdings",
    "type": "별도",
    "currentMonth": "2026년 1월",      // ← 매월 변경
    "targetYear": "FY2026",
    "unit": "억원",
    "updatedAt": "2026-03-10"          // ← 업데이트 날짜
  },

  // ===== 1. 손익 핵심 요인 =====
  "plDrivers": {
    "drivers": [
      { "id": 1, "label": "OC(F&F) 배당수입 확대",
        "fy2025": 221.3, "fy2026e": 351.5, "change": 130.2, "changePct": 58.8, ... }
    ],
    "plSummary": {
      "revenue":        { "fy2025": 576.5, "fy2026e": 646.4, "change": 69.9, "changePct": 12.1 },
      "operatingProfit": { "fy2025": 375.6, "fy2026e": 444.6, ... },
      "preTaxProfit":    { "fy2025": 352.8, "fy2026e": 623.6, ... },
      "netIncome":       { "fy2025": 357.8, "fy2026e": 553.9, ... }
    }
  },

  // ===== 2. BS → 자금 핵심 영향 =====
  "bsImpact": {
    "keyItems": [
      { "label": "이익잉여금", "dec25": 25007.9, "jan26": 25014.7, "dec26e": 25366.5,
        "change": 358.5, "driver": "순이익 553.9억 - 배당금 195.3억", "highlight": true }
    ]
  },

  // ===== 3. 현금 변동 (워터폴) =====
  "cashImpact": {
    "flow": {
      "beginningCash": 628.1, "operatingCF": 491.5, "assetRecovery": 579.5,
      "financingCF": -195.3, "taxPayment": -0.9, "endingCash": 1502.8,
      "netChange": 874.7, "netChangePct": 139.3
    },
    "waterfall": [
      { "name": "기초현금", "value": 628.1, "type": "begin" },
      { "name": "영업CF", "value": 491.5, "type": "positive" },
      { "name": "배당지급", "value": -195.3, "type": "negative" },
      { "name": "기말현금", "value": 1502.8, "type": "end" }
    ],
    "operatingCFDetail": [ { "label": "지주부문(...)", "value": 352.1 } ],
    "investingCFDetail": [ { "label": "금융상품 회수", "value": 337.2 } ],
    "financingCFDetail": [ { "label": "배당금 지급(...)", "value": -195.3 } ]
  },

  // ===== 4. 재무상태표 테이블 =====
  "balanceSheet": {
    "assets": [
      { "label": "현금및현금성자산", "dec25": 628.1, "jan26": 751.6, "dec26e": 1502.8,
        "isAlwaysVisible": true, "highlight": true }
    ],
    "liabilities": [ ... ],
    "equity": [ ... ],
    "totals": [
      { "label": "자산총계", "dec25": 19754.0, "jan26": 19759.5, "dec26e": 20191.1 }
    ]
  },

  // ===== 5. 재무비율 =====
  "ratios": {
    "debtRatio":      { "label": "부채비율", "dec25": 0.4, "jan26": 0.4, "dec26e": 0.8, "unit": "%" },
    "equityRatio":    { ... },
    "currentRatio":   { ... },
    "operatingMargin": { ... },
    "netMargin":      { ... },
    "roe":            { ... }
  },

  // ===== 6. 자산구성 (파이차트) =====
  "assetComposition": [
    { "name": "투자주식/금융자산", "value": 18075.7, "color": "#3B82F6" }
  ],

  // ===== 7. 자산총계 2조원 규제 =====
  "assetThreshold": {
    "current": { "jan26": 19759.5, "dec26e": 20191.1 },
    "threshold": 20000,
    "items": [
      { "id": 1, "requirement": "감사위원회 설치", "detail": "...",
        "basis": "상법 §542조의11", "urgency": "high", "isNew": false }
    ]
  },

  // ===== 8. 월별 자금계획표 =====
  "monthlyCashPlan": {
    "months": ["1월","2월",...,"12월"],
    "beginningCash": [628.1, 751.6, ...],     // 12개월 배열
    "operatingCF":   [5.4, 18.7, ...],
    "holdingDiv":    [-2.2, 5.2, ...],
    "logistics":     [10.9, 13.5, ...],
    "otherOp":       [-3.2, 0.0, ...],
    "financialProducts": [118.2, 0.0, ...],
    "buildingSale":  [0.0, 0.0, ...],
    "dividend":      [0.0, 0.0, ...],
    "tax":           [0.0, 0.0, ...],
    "endingCash":    [751.6, 770.3, ...],
    "annual": {
      "beginningCash": 628.1, "operatingCF": 491.5, "endingCash": 1502.8, ...
    }
  }
}
```

**HC 업데이트 시 변경 항목 (매월):**
1. `meta.currentMonth`, `meta.updatedAt`
2. `bsImpact.keyItems[*].jan26` → 해당월 실적으로 변경
3. `balanceSheet.assets/liabilities/equity/totals` → jan26 → feb26 등 컬럼명 변경 또는 값 갱신
4. `cashImpact.flow` → 기초/기말현금 실적 반영
5. `monthlyCashPlan` → 실적 확정월 반영
6. `assetThreshold.current.jan26` → 해당월 자산총계 실적

---

## 5. 각 대시보드 컴포넌트 구성

### 5-1. OcBsDashboard.tsx 섹션 구성

| # | 섹션 | 데이터 소스 |
|---|---|---|
| 1 | 재무상태표 테이블 (자산/부채/자본) | `balanceSheet.*` |
| 2 | 운전자본 분석 (매출채권/재고/매입채무) | `workingCapital.*`, `financialData.*` |
| 3 | 회전율 분석 (DIO/DSO/DPO/CCC) | `financialData.*`, `annualized.*` |
| 4 | 여신기준 검증 (채널별) | `creditVerification` |
| 5 | 주요 지표 요약 (부채비율/자기자본비율/순차입금비율) | `balanceSheet.totals` |

### 5-2. OcCfDashboard.tsx 섹션 구성

| # | 섹션 | 데이터 소스 |
|---|---|---|
| 1 | KPI Cards (기초/영업/투자/조달/기말) | `kpi` |
| 2 | CF 인사이트 + 액션플랜 | `insights`, `actionPlan` |
| 3 | 월별 기말현금 추이 차트 + 영업CF 브릿지 | `monthlyTrend`, `operatingCFBridge` |
| 4 | 영업CF 주요 증감 분석 | `operatingCFAnalysis` |
| 5 | CF 상세 테이블 (월별) | `operating/investment/financing/endingCash` |
| 6 | 통화별 기말잔액 | `currencyBalances` |
| 7 | 투자CF 워터폴 + 전년대비 | `investmentYoY` |
| 8 | CF 증감내역 (25년 vs 26년) | `yoyComparison` |

### 5-3. HcDashboard.tsx 섹션 구성

| # | 섹션 | 데이터 소스 |
|---|---|---|
| 1 | BS·자금 핵심 영향 (KPI + 2조원 ALERT) | `bsImpact`, `assetThreshold` |
| 2 | 손익 증가 핵심 요인 + P&L Strip | `plDrivers` |
| 3 | 재무상태표 테이블 + 자산구성 파이차트 + 비율 | `balanceSheet`, `assetComposition`, `ratios` |
| 4 | 자산총계 2조원 초과 대응 요건 | `assetThreshold` |
| 5 | 현금 변동 워터폴 + CF 상세 | `cashImpact` |
| 6 | 월별 자금계획표 | `monthlyCashPlan` |

---

## 6. 개발 환경 설정

### 로컬 개발

```bash
cd "C:\Users\AC1144\AI_Fin_Analysis\Claude\Finance_Report V1\hc-dashboard"
npm run dev          # http://localhost:3000
```

### 빌드

```bash
npm run build        # .next/ 빌드 출력
npm start            # 프로덕션 서버 시작
```

### 주요 의존성

```json
{
  "next": "^16.1.1",
  "react": "^19.2.3",
  "recharts": "^3.6.0",
  "lucide-react": "^0.479.0",
  "tailwindcss": "^4.1.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1"
}
```

---

## 7. Vercel 배포 가이드

### 7-1. 사전 준비

```bash
# 1) Git 초기화 및 커밋
cd "C:\Users\AC1144\AI_Fin_Analysis\Claude\Finance_Report V1\hc-dashboard"
git init
git add .
git commit -m "Initial: FNF 26.1월 BS/CF 리포트 3탭 대시보드"

# 2) GitHub 레포 생성 및 푸시
gh repo create fnf-bs-cf-report --private --source=. --push
```

### 7-2. Vercel 배포

```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 배포
vercel                          # 최초 배포 (설정 프롬프트)
vercel --prod                   # 프로덕션 배포
```

**Vercel 프로젝트 설정:**
- Framework Preset: **Next.js**
- Root Directory: `.` (기본값)
- Build Command: `next build`
- Output Directory: `.next`
- Node.js Version: 20.x

### 7-3. GitHub 연동 자동배포

1. Vercel Dashboard → Import Project → GitHub 레포 연결
2. `main` 브랜치 push 시 자동 배포
3. PR 생성 시 Preview 배포

---

## 8. 월간 데이터 업데이트 가이드 → UPDATE_GUIDE.md 참조

별도 파일 `UPDATE_GUIDE.md`에 26년 2월 업데이트 상세 절차를 기술합니다.

---

## 9. 트러블슈팅

### 자주 발생하는 이슈

| 증상 | 원인 | 해결 |
|---|---|---|
| 차트 안 보임 | Recharts SSR 이슈 | `'use client'` 확인 |
| 포트 충돌 | 기존 서버 미종료 | `netstat -ano | findstr :3000` → kill |
| JSON 파싱 에러 | 콤마/따옴표 누락 | JSON validator 사용 |
| 타입 에러 | cashflow.ts 미일치 | `as any` 또는 타입 업데이트 |
| Tailwind 클래스 미적용 | v4 호환성 | `@tailwindcss/postcss` 확인 |

### 워터폴 차트 핵심 로직 (HC)

```typescript
// 기초/기말: base=0, absVal=전체높이
// 변동항목: base=이전누적(또는 누적+음수값), absVal=|변동|
const base = value >= 0 ? cumulative : cumulative + value;
cumulative += value;
// ComposedChart + stackId="waterfall" 필수
```
