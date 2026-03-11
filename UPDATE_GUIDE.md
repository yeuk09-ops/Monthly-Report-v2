# FNF 대시보드 - 월간 업데이트 기준서

> **목적**: 26년 1월 → 2월(이후 매월) 데이터 업데이트 시 JSON 파일만 수정하여 대시보드 갱신
> **원칙**: 컴포넌트(TSX) 코드 수정 없이, JSON 데이터 교체만으로 완료
> **작성일**: 2026-03-10

---

## 업데이트 흐름 요약

```
1. 원천 데이터 수집 (ERP/재무팀)
     ↓
2. JSON 파일 3개 수정
   ├── oc-bs-2026-01.json  → oc-bs-2026-02.json (신규)
   ├── cashflow.json       → 기존 파일 갱신
   └── hc-financial.json   → 기존 파일 갱신
     ↓
3. 코드 변경 (import 경로)
   └── OcBsDashboard.tsx의 import 경로만 변경
     ↓
4. page.tsx 헤더 텍스트 변경 (26.1월 → 26.2월)
     ↓
5. npm run build → 검증 → git push → Vercel 자동배포
```

---

## 1. OC BS 업데이트 (F&F 재무상태표)

### 1-1. 파일 생성

```bash
# 1월 파일 복사 → 2월 파일 생성
cp src/data/oc-bs-2026-01.json src/data/oc-bs-2026-02.json
```

### 1-2. JSON 수정 항목 체크리스트

#### ✅ meta 섹션
```jsonc
{
  "meta": {
    "year": 2026,
    "month": 2,                          // 1 → 2
    "reportDate": "2026-02-28",          // 01-31 → 02-28
    "updatedAt": "2026-03-15",           // 실제 업데이트 날짜
    "status": "published"
  }
}
```

#### ✅ financialData (핵심 재무데이터)

**모든 항목에 대해 3개 값 갱신:**

| 필드 | current | previousMonth | previousYear |
|---|---|---|---|
| 의미 | **26년 2월** (신규) | **26년 1월** (이전 current) | **25년 2월** |

```jsonc
"revenue": {
  "current": 1700,          // ← 26년 2월 실적
  "previousMonth": 1638,    // ← 이전 current값 (26년 1월)
  "previousYear": 1580      // ← 25년 2월 실적
}
// 동일 패턴: domesticRevenue, exportRevenue, cogs, operatingProfit,
//           totalAssets, currentAssets, cash, receivables, inventory,
//           totalLiabilities, borrowings, payables, equity, retainedEarnings
```

#### ✅ balanceSheet (재무상태표 테이블)

**totals 배열 - 3개 항목(자산/부채/자본):**
```jsonc
"totals": [
  {
    "label": "자산총계",
    "jan25": 20267,           // 그대로 유지 (전년 1월)
    "dec25": 22155,           // 그대로 유지
    "jan26": 23500,           // ← 26년 2월 값으로 교체 (컬럼명 jan26 유지 또는 feb26으로 변경)
    "momChange": 562,         // ← 2월 - 1월
    "momChangePercent": 2.4,  // ← (562/23500)*100
    "yoyChange": 3233,        // ← 2월26 - 2월25
    "yoyChangePercent": 15.9  // ← 비율
  }
]
```

> **주의**: `jan26` 키 이름은 대시보드 헤더에 "26년 1월"로 하드코딩되어 있지 않음 (테이블 헤더는 JSON 외부). 값만 2월 데이터로 교체하면 됨.

**assets/liabilities/equity 배열** - 각 행의 `jan26` 값 갱신:
```jsonc
{ "label": "현금및현금성자산", "jan25": 990, "dec25": 2709, "jan26": 3300, ... }
//                                                          ↑ 2월 값으로 변경
```

#### ✅ workingCapital (운전자본)
- `ar[]` → 매출채권 상세 (dec25, jan26 → dec25 유지, jan26을 2월값으로)
- `inventory[]` → 브랜드별 재고 (동일 패턴)

#### ✅ creditVerification (여신기준 검증)
- 3개월 슬라이딩: `nov/dec/jan` → `dec/jan/feb`
- `arBalance` → 2월말 채권잔액
- `months`, `prevMonths` → 재계산

#### ✅ annualized (연환산)
```jsonc
"annualized": {
  "revenue": 20400,      // 2월 매출 × 12
  "cogs": 7200           // 2월 원가 × 12
}
```

### 1-3. import 경로 변경

```typescript
// src/components/dashboards/OcBsDashboard.tsx (4행)
// 변경 전:
import rawData from '@/data/oc-bs-2026-01.json';
// 변경 후:
import rawData from '@/data/oc-bs-2026-02.json';
```

---

## 2. OC CF 업데이트 (F&F 자금계획)

### 2-1. 파일: `src/data/cashflow.json` (기존 파일 직접 수정)

#### ✅ meta 섹션
```jsonc
"meta": {
  "title": "F&F 26년 자금계획",
  "period": "2026년 2월 기준",       // 1월 → 2월
  "updatedAt": "2026-03-20"          // 실제 날짜
}
```

#### ✅ kpi (KPI 요약)
```jsonc
"kpi": {
  "beginningCash": 270713,     // 그대로 (연초 기초)
  "operatingCF": 500000,       // ← 연간 영업CF 갱신 (추정 수정)
  "investmentCF": -65000,      // ← 연간 투자CF 갱신
  "financingCF": 0,
  "endingCash": 705000,        // ← 연간 기말현금 갱신
  // Prev 값은 그대로 유지 (25년 실적 고정)
}
```

#### ✅ 월별 데이터 갱신 (핵심)

**실적 확정 처리 (1→2월):**

```jsonc
"operating": {
  "total": {
    "y26Monthly": {
      "1": 41281,       // 1월 실적 (확정 유지)
      "2": 70000,       // ← 2월 실적으로 교체 (이전 추정 67312 → 실적)
      "3": 28000,       // ← 추정치 수정 가능
      ...
    },
    "isEstimate": {
      "1": false,       // 실적 (유지)
      "2": false,       // ← true → false (실적 확정!)
      "3": true,        // 추정 (유지)
      ...
    }
  }
}
```

**동일 패턴 적용 대상:**
- `beginningCash.y26Monthly`
- `operating.total.y26Monthly`
- `investment.total.y26Monthly` + `investment.items[*].y26Monthly`
- `financing.total.y26Monthly` + `financing.items[*].y26Monthly`
- `endingCash.y26Monthly`

#### ✅ monthlyTrend (차트 데이터)
- 2월 실적 데이터 추가/수정
- `isEstimate: false`로 변경

#### ✅ 분석 텍스트 갱신
- `insights[]` → 2월 기준 인사이트
- `actionPlan[]` → 업데이트된 전략
- `operatingCFAnalysis.items[*]` → 실적 반영
- `workingCapitalDetail` → 2월말 기준 BS

#### ✅ yoyComparison (전년비교)
- `y26Value` → 2월까지 반영된 연간 추정

---

## 3. HC 업데이트 (F&F Holdings BS/CF)

### 3-1. 파일: `src/data/hc-financial.json` (기존 파일 직접 수정)

#### ✅ meta 섹션
```jsonc
"meta": {
  "currentMonth": "2026년 2월",       // 1월 → 2월
  "updatedAt": "2026-03-20"
}
```

#### ✅ bsImpact (BS 핵심영향)
```jsonc
"keyItems": [
  { "label": "이익잉여금",
    "dec25": 25007.9,
    "jan26": 25020.0,          // ← 2월 실적으로 변경 (키명 jan26 유지)
    "dec26e": 25366.5,         // ← 연말 추정 수정 가능
    "change": 358.5,
    "driver": "순이익 553.9억 - 배당금 195.3억" }
]
```

#### ✅ cashImpact (현금변동)
- `flow.*` → 기초/기말현금 실적 반영
- `waterfall[]` → 값 갱신 (기초현금, 영업CF 등)
- `*Detail[]` → CF 상세 내역 갱신

#### ✅ balanceSheet (BS 테이블)
- `assets/liabilities/equity` → `jan26` 값을 2월 실적으로 교체
- `totals[]` → 자산/부채/자본총계 갱신

#### ✅ ratios (재무비율)
```jsonc
"debtRatio": { "label": "부채비율", "dec25": 0.4, "jan26": 0.5, "dec26e": 0.8, "unit": "%" }
//                                                  ↑ 2월 실적
```

#### ✅ assetComposition (파이차트)
- 각 항목의 `value` → 2월말 기준

#### ✅ assetThreshold (2조원 규제)
```jsonc
"current": { "jan26": 19800.0, "dec26e": 20191.1 }
//                     ↑ 2월 자산총계 실적
```

#### ✅ monthlyCashPlan (월별 자금계획표)
- `beginningCash[1]` (2월) → 실적 반영
- `operatingCF[1]` (2월) → 실적 반영
- `endingCash[1]` (2월) → 실적 반영
- 3월 이후 추정치 수정 가능

---

## 4. 공통 코드 변경

### 4-1. page.tsx (탭 쉘 헤더)

```typescript
// src/app/page.tsx - 헤더 텍스트 변경
<h1>FNF 26.2월 BS/CF 리포트</h1>      // 26.1월 → 26.2월
<Badge>26년 2월</Badge>                // 26년 1월 → 26년 2월
```

### 4-2. layout.tsx (메타데이터/푸터)

```typescript
// title, footer 텍스트 변경
title: 'FNF 26.2월 BS/CF 리포트'
footer: 'FNF 26.2월 BS/CF 리포트 | F&F · F&F Holdings'
```

---

## 5. 검증 체크리스트

업데이트 후 반드시 확인:

```
□ npm run dev → http://localhost:3000 정상 로드
□ OC BS 탭
  □ 재무상태표 숫자 정상
  □ 운전자본 분석 숫자 일치
  □ 회전율 DIO/DSO/DPO 계산 정상
  □ 여신기준 3개월 슬라이딩 정상
□ OC CF 탭
  □ KPI 카드 5개 숫자 정상
  □ 월별 차트 2월 실적 반영
  □ CF 상세 테이블 값 일치
  □ 투자CF 워터폴 차트 정상
□ HC 탭
  □ BS 핵심영향 KPI 4개 정상
  □ 2조원 ALERT 배너 수치 정상
  □ BS 테이블 숫자 정상
  □ 워터폴 차트 정상 (기초→기말)
  □ 월별 자금계획표 정상
□ 콘솔 에러 없음
□ npm run build 성공
```

---

## 6. 배포

```bash
# 1. 변경 커밋
git add src/data/ src/app/page.tsx src/app/layout.tsx
git add src/components/dashboards/OcBsDashboard.tsx  # import 경로 변경 시
git commit -m "Update: 26년 2월 데이터 반영"

# 2. 푸시 → Vercel 자동배포
git push origin main
```

---

## 부록: 데이터 수집 체크리스트

### OC (F&F) 데이터 소스

| 항목 | 소스 | 담당 |
|---|---|---|
| 매출/원가/영업이익 | ERP 손익 마감 | 재경팀 |
| BS (자산/부채/자본) | ERP BS 마감 | 재경팀 |
| 매출채권 상세 (채널별) | 채권관리 시스템 | 재경팀 |
| 재고자산 상세 (브랜드별) | WMS/ERP | 물류팀 |
| 자금계획 (월별 CF) | 자금팀 월간 리포트 | 자금팀 |
| 통화별 잔액 | 은행 계좌 조회 | 재경팀 |

### HC (F&F Holdings) 데이터 소스

| 항목 | 소스 | 담당 |
|---|---|---|
| 별도 BS/P&L | ERP 별도재무제표 | 재경팀 |
| 배당수입/처분이익 | 이사회 결의/계약 | 재경팀 |
| 월별 자금계획 | 지주 자금팀 | 자금팀 |
| 규제 요건 변동 | 법무팀/외부자문 | 법무팀 |
