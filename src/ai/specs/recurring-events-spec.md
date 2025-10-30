# 반복 일정 기능 명세서

## 1. 기능 목적 및 목표

### 왜 이 기능이 필요한가?
- 사용자가 매일, 매주, 매월, 매년 반복되는 일정을 효율적으로 관리할 수 있도록 함
- 반복되는 일정을 일일이 생성하지 않고 한 번의 입력으로 여러 인스턴스를 자동 생성
- 반복 일정의 일괄 수정/삭제 또는 개별 수정/삭제를 선택할 수 있는 유연성 제공

### 이 기능으로 달성하고자 하는 목표는?
- 반복 일정 생성, 표시, 수정, 삭제의 완전한 CRUD 구현
- 특수한 날짜 케이스(31일, 윤년 2월 29일) 올바른 처리
- 사용자에게 명확한 피드백 제공 (반복 아이콘, 다이얼로그)

## 2. 구체적인 요구사항

### 2.1 기능적 요구사항

#### F1. 반복 유형 선택
- **입력**: 일정 생성/수정 폼에서 "반복 일정" 체크박스를 선택
- **동작**:
  - 체크박스 선택 시 반복 설정 UI 표시
  - 반복 유형 선택 드롭다운: `매일`, `매주`, `매월`, `매년`
  - 반복 간격 입력 필드: 숫자 (기본값: 1, 최소값: 1)
  - 반복 종료일 선택: 날짜 선택기 (최대: 2025-12-31)
- **출력**: 
  - `repeat.type`: `'daily' | 'weekly' | 'monthly' | 'yearly'`
  - `repeat.interval`: 양의 정수
  - `repeat.endDate`: YYYY-MM-DD 형식 문자열 (최대 2025-12-31)
  - `repeat.id`: 반복 시리즈 식별자 (서버에서 생성)

#### F2. 특수 날짜 처리
- **31일 매월 반복**:
  - 31일에 매월 반복 선택 시, 31일이 존재하는 달에만 일정 생성
  - 예: 1월 31일 → 3월 31일 → 5월 31일... (2월, 4월 등은 건너뜀)
- **윤년 2월 29일 매년 반복**:
  - 2월 29일에 매년 반복 선택 시, 윤년에만 일정 생성
  - 예: 2024-02-29 → 2028-02-29 → 2032-02-29...
- **구현**: `recurrenceUtils.ts`의 기존 `getNextOccurrence` 함수 사용

#### F3. 반복 일정 생성
- **API 호출**: `POST /api/events-list`
- **입력**: 
  ```typescript
  {
    events: Event[] // generateInstancesForEvent로 생성된 인스턴스 배열
  }
  ```
- **동작**:
  1. 사용자가 반복 일정 정보 입력 및 "일정 추가" 클릭
  2. `generateInstancesForEvent` 함수로 시작일부터 종료일까지 모든 인스턴스 생성
  3. 생성된 인스턴스 배열을 `/api/events-list`에 전송
  4. 서버에서 모든 인스턴스에 동일한 `repeat.id` 부여
- **검증**:
  - ✅ 반복 일정은 일정 겹침 검사를 하지 않음
  - 필수 필드 검증 (제목, 날짜, 시작/종료 시간)
  - 시간 유효성 검증 (종료 시간 > 시작 시간)

#### F4. 반복 일정 표시
- **캘린더 뷰**:
  - 반복 일정 옆에 반복 아이콘 표시 (예: 🔁 또는 MUI Repeat 아이콘)
  - 반복 일정과 단일 일정을 시각적으로 구분
- **이벤트 리스트**:
  - 반복 정보 표시: "반복: {interval}{단위}마다 (종료: {endDate})"
  - 예: "반복: 1주마다 (종료: 2025-12-31)"

#### F5. 반복 일정 수정
- **트리거**: 반복 일정의 수정 버튼 클릭
- **다이얼로그 표시**:
  - 제목: "반복 일정 수정"
  - 내용: "해당 일정만 수정하시겠어요?"
  - 버튼: "예" / "아니오"
  
- **F5-1. 단일 수정 ("예" 선택)**:
  - **API 호출**: `PUT /api/events/:id`
  - **동작**:
    1. 해당 일정의 `repeat.type`을 `'none'`으로 변경
    2. `repeat.id` 제거 (또는 undefined)
    3. 단일 일정으로 변환
  - **결과**:
    - 해당 일정만 수정됨
    - 반복 아이콘 사라짐
    - 다른 반복 일정 인스턴스는 유지

- **F5-2. 전체 수정 ("아니오" 선택)**:
  - **API 호출**: `PUT /api/recurring-events/:repeatId`
  - **입력**: 수정할 필드 (title, description, location, category, notificationTime 등)
  - **동작**:
    1. 동일한 `repeat.id`를 가진 모든 일정 조회
    2. 모든 인스턴스의 공통 필드 일괄 수정
    3. 날짜/시간은 각 인스턴스마다 유지
  - **결과**:
    - 모든 반복 일정 인스턴스 수정됨
    - 반복 아이콘 유지
  - **제약사항**:
    - 날짜와 시간은 변경되지 않음 (각 인스턴스의 날짜는 그대로)
    - 반복 유형/간격/종료일은 변경 불가 (새로 생성 필요)

#### F6. 반복 일정 삭제
- **트리거**: 반복 일정의 삭제 버튼 클릭
- **다이얼로그 표시**:
  - 제목: "반복 일정 삭제"
  - 내용: "해당 일정만 삭제하시겠어요?"
  - 버튼: "예" / "아니오"

- **F6-1. 단일 삭제 ("예" 선택)**:
  - **API 호출**: `DELETE /api/events/:id`
  - **동작**: 해당 일정만 삭제
  - **결과**: 다른 반복 일정 인스턴스는 유지

- **F6-2. 전체 삭제 ("아니오" 선택)**:
  - **API 호출**: `DELETE /api/recurring-events/:repeatId`
  - **동작**: 동일한 `repeat.id`를 가진 모든 일정 삭제
  - **결과**: 해당 반복 시리즈의 모든 인스턴스 삭제

### 2.2 비기능적 요구사항

#### 성능 요구사항
- 최대 1000개의 반복 인스턴스 생성 제한 (무한 루프 방지)
- 반복 종료일 최대값: 2025-12-31

#### 접근성 요구사항
- 다이얼로그는 키보드로 조작 가능 (Tab, Enter, Esc)
- 반복 아이콘에 aria-label 제공
- 폼 필드에 적절한 label 연결

#### 사용성 요구사항
- 수정/삭제 다이얼로그의 문구는 명확해야 함:
  - "해당 일정만 수정하시겠어요?" / "해당 일정만 삭제하시겠어요?"
- 반복 종료일 입력 시 max="2025-12-31" 속성 설정
- 성공/실패 시 명확한 스낵바 메시지

## 3. 제외 범위 (Out of Scope)

### 3.1 이 기능에서 다루지 않는 것들
- ❌ 반복 일정의 날짜/시간 일괄 변경 (F5-2에서 제외)
- ❌ 반복 유형/간격/종료일 수정 (새로 생성해야 함)
- ❌ 특정 날짜부터 이후만 수정/삭제 ("이 일정 및 향후 일정" 옵션)
- ❌ 반복 예외 추가 (특정 날짜 제외)
- ❌ 복잡한 반복 규칙 (매월 첫째 주 월요일 등)
- ❌ 반복 일정 겹침 검사 (요구사항에서 명시적으로 제외)

### 3.2 향후 버전에서 고려할 사항
- 반복 일정의 부분 수정/삭제 ("이 일정 및 향후 일정")
- 반복 예외 날짜 관리
- 더 복잡한 반복 규칙 (요일 기반, 상대적 날짜 등)

## 4. 성공 기준 (Acceptance Criteria)

### AC1. 반복 일정 생성
- ✅ 반복 체크박스 선택 시 반복 설정 UI가 표시됨
- ✅ 매일/매주/매월/매년 중 선택 가능
- ✅ 반복 간격 입력 가능 (최소 1)
- ✅ 반복 종료일 선택 가능 (최대 2025-12-31)
- ✅ "일정 추가" 클릭 시 모든 반복 인스턴스가 생성됨
- ✅ 31일 매월 반복 시 31일이 없는 달은 건너뜀
- ✅ 윤년 29일 매년 반복 시 윤년만 생성됨
- ✅ 반복 일정은 겹침 검사를 하지 않음

### AC2. 반복 일정 표시
- ✅ 캘린더 뷰에서 반복 일정에 아이콘이 표시됨
- ✅ 이벤트 리스트에서 반복 정보가 표시됨
- ✅ 반복 일정과 단일 일정이 시각적으로 구분됨

### AC3. 반복 일정 수정
- ✅ 반복 일정 수정 시 "해당 일정만 수정하시겠어요?" 다이얼로그가 표시됨
- ✅ "예" 선택 시:
  - 해당 일정만 수정됨
  - 단일 일정으로 변환됨 (repeat.type = 'none')
  - 반복 아이콘이 사라짐
- ✅ "아니오" 선택 시:
  - 모든 반복 인스턴스의 공통 필드가 수정됨
  - 반복 아이콘이 유지됨
  - 날짜/시간은 변경되지 않음

### AC4. 반복 일정 삭제
- ✅ 반복 일정 삭제 시 "해당 일정만 삭제하시겠어요?" 다이얼로그가 표시됨
- ✅ "예" 선택 시 해당 일정만 삭제됨
- ✅ "아니오" 선택 시 모든 반복 인스턴스가 삭제됨

### AC5. 사용자 피드백
- ✅ 성공/실패 시 적절한 스낵바 메시지 표시
- ✅ 다이얼로그는 Esc 키로 닫을 수 있음

## 5. 기존 코드베이스 분석

### 5.1 관련 기존 기능

#### ✅ 재사용 가능한 Utils
1. **`src/utils/recurrenceUtils.ts`** ⭐ 핵심 유틸리티
   - `generateInstancesForEvent(event, rangeStart, rangeEnd)`: 반복 인스턴스 생성
   - `getNextOccurrence()`: 다음 반복 날짜 계산 (31일, 윤년 처리 포함)
   - `isLeapYear()`: 윤년 확인
   - **상태**: ✅ 이미 구현됨, 재사용 가능
   
2. **`src/utils/eventUtils.ts`**
   - `getFilteredEvents()`: 이벤트 필터링
   - **활용**: 반복 인스턴스 필터링에 재사용

3. **`src/utils/dateUtils.ts`**
   - `formatDate()`, `getWeekDates()`, `getWeeksAtMonth()` 등
   - **활용**: 날짜 포맷팅에 재사용

#### ✅ 재사용 가능한 Hooks
1. **`src/hooks/useEventOperations.ts`**
   - `saveEvent()`: 단일 이벤트 저장 (PUT /api/events/:id)
   - `deleteEvent()`: 단일 이벤트 삭제 (DELETE /api/events/:id)
   - **필요한 추가 기능**:
     - `saveRecurringEvents()`: 반복 인스턴스 일괄 생성 (POST /api/events-list)
     - `updateRecurringSeries()`: 반복 시리즈 수정 (PUT /api/recurring-events/:repeatId)
     - `deleteRecurringSeries()`: 반복 시리즈 삭제 (DELETE /api/recurring-events/:repeatId)

2. **`src/hooks/useEventForm.ts`**
   - 반복 관련 state는 이미 존재 (`isRepeating`, `repeatType`, `repeatInterval`, `repeatEndDate`)
   - **상태**: ✅ 재사용 가능, 수정 불필요

3. **`src/hooks/useCalendarView.ts`**
   - 뷰 관리 및 날짜 네비게이션
   - **상태**: ✅ 재사용 가능, 수정 불필요

#### ✅ 재사용 가능한 컴포넌트
- MUI 다이얼로그: 겹침 경고 다이얼로그 패턴 재사용
- MUI 아이콘: `Repeat` 아이콘 사용

### 5.2 수정이 필요한 부분

#### 1. **`src/types.ts`** - RepeatInfo 타입 확장
**현재**:
```typescript
export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
}
```

**필요한 변경**:
```typescript
export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
  id?: string; // 반복 시리즈 식별자 (서버에서 부여)
}
```

#### 2. **`src/hooks/useEventOperations.ts`** - 반복 API 함수 추가
**추가 필요**:
- `saveRecurringEvents(eventForm: EventForm): Promise<void>`
- `updateRecurringSeries(repeatId: string, updateData: Partial<Event>): Promise<void>`
- `deleteRecurringSeries(repeatId: string): Promise<void>`

#### 3. **`src/App.tsx`** - UI 및 로직 수정
**필요한 변경**:
- 441-478라인 반복 설정 UI 주석 해제 및 활성화
- 캘린더 뷰에서 반복 아이콘 표시 로직 추가
- 수정/삭제 버튼 클릭 시 반복 일정 확인 다이얼로그 추가
- `addOrUpdateEvent` 함수 수정: 반복 일정 생성 로직 추가
- 반복 종료일 max 속성 추가: `max="2025-12-31"`

#### 4. **새로 추가할 파일 없음** ✅
- 모든 필요한 유틸리티와 훅은 이미 존재하거나 기존 파일에 추가 가능

### 5.3 영향 받는 부분

#### 영향 받을 수 있는 기능
1. **검색 기능** (`useSearch`)
   - 반복 인스턴스가 증가하므로 검색 결과 증가 가능
   - 현재 로직으로 자동 처리됨 (수정 불필요)

2. **알림 기능** (`useNotifications`)
   - 반복 일정의 각 인스턴스마다 알림 설정
   - 현재 로직으로 자동 처리됨 (수정 불필요)

3. **이벤트 필터링** (`getFilteredEvents`)
   - 반복 인스턴스가 자동으로 포함됨
   - 수정 불필요

#### 영향 받지 않는 기능
- ❌ 겹침 검사: 반복 일정은 겹침 검사를 하지 않음 (요구사항)
- ✅ 캘린더 뷰: 반복 인스턴스가 자동으로 표시됨
- ✅ 일정 리스트: 반복 정보 표시 로직 이미 존재 (558-568라인)

## 6. 기술적 고려사항

### 6.1 API 설계

#### API 엔드포인트 (server.js 기반)
모든 필요한 API는 이미 구현되어 있음:

1. **반복 인스턴스 생성**
   - `POST /api/events-list`
   - 요청 본문:
     ```json
     {
       "events": [
         {
           "title": "주간 회의",
           "date": "2024-11-01",
           "startTime": "10:00",
           "endTime": "11:00",
           "description": "",
           "location": "",
           "category": "업무",
           "repeat": {
             "type": "weekly",
             "interval": 1,
             "endDate": "2024-12-31"
           },
           "notificationTime": 10
         },
         // ... 생성된 모든 인스턴스
       ]
     }
     ```
   - 응답: 서버에서 각 이벤트에 id와 repeat.id 부여

2. **반복 시리즈 수정**
   - `PUT /api/recurring-events/:repeatId`
   - 요청 본문:
     ```json
     {
       "title": "새 제목",
       "description": "새 설명",
       "location": "새 위치",
       "category": "개인",
       "notificationTime": 60
     }
     ```
   - 동작: 해당 repeatId를 가진 모든 이벤트의 필드 수정

3. **반복 시리즈 삭제**
   - `DELETE /api/recurring-events/:repeatId`
   - 동작: 해당 repeatId를 가진 모든 이벤트 삭제

4. **단일 이벤트 수정/삭제** (기존 API)
   - `PUT /api/events/:id`: 반복 → 단일 전환 시 사용
   - `DELETE /api/events/:id`: 단일 삭제 시 사용

### 6.2 기술 스택

#### 프론트엔드
- **UI 라이브러리**: Material-UI (MUI) v5
  - `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`
  - `Repeat` 아이콘 (from `@mui/icons-material`)
  - `Select`, `MenuItem`, `TextField`, `Checkbox`
  
- **상태 관리**: React Hooks (useState, useEffect)
  - 기존 커스텀 훅 활용
  
- **알림**: notistack (`enqueueSnackbar`)

#### 백엔드
- **서버**: Express.js (server.js)
- **데이터 저장**: JSON 파일 (`realEvents.json`, `e2e.json`)
- **API**: RESTful

#### 데이터 모델
```typescript
interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  description: string;
  location: string;
  category: string;
  repeat: {
    type: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string; // YYYY-MM-DD
    id?: string; // 반복 시리즈 식별자
  };
  notificationTime: number; // 분 단위
}
```

### 6.3 아키텍처 패턴

#### 레이어 구조
```
┌─────────────────────────────────────┐
│        UI Layer (App.tsx)           │
│  - 반복 설정 폼                       │
│  - 수정/삭제 다이얼로그                │
│  - 캘린더 뷰 (반복 아이콘)             │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│    Hooks Layer (useEventOperations) │
│  - saveRecurringEvents()            │
│  - updateRecurringSeries()          │
│  - deleteRecurringSeries()          │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│  Utils Layer (recurrenceUtils)      │
│  - generateInstancesForEvent()      │
│  - getNextOccurrence()              │
└─────────────────────────────────────┘
            ↓
┌─────────────────────────────────────┐
│    API Layer (server.js)            │
│  - POST /api/events-list            │
│  - PUT /api/recurring-events/:id    │
│  - DELETE /api/recurring-events/:id │
└─────────────────────────────────────┘
```

#### 데이터 흐름
1. **생성 흐름**:
   - 사용자 입력 → EventForm state → generateInstancesForEvent() → saveRecurringEvents() → POST /api/events-list → 서버에서 repeat.id 부여

2. **수정 흐름**:
   - 수정 버튼 클릭 → 다이얼로그 표시 → 사용자 선택
   - "예": updateEvent(id, {..., repeat: {type: 'none'}}) → PUT /api/events/:id
   - "아니오": updateRecurringSeries(repeatId, updateData) → PUT /api/recurring-events/:repeatId

3. **삭제 흐름**:
   - 삭제 버튼 클릭 → 다이얼로그 표시 → 사용자 선택
   - "예": deleteEvent(id) → DELETE /api/events/:id
   - "아니오": deleteRecurringSeries(repeatId) → DELETE /api/recurring-events/:repeatId

## 7. 엣지 케이스

### EC1. 날짜 관련
1. **31일 매월 반복**
   - 시나리오: 1월 31일에 매월 반복 생성
   - 예상 동작: 31일이 있는 달에만 생성 (1, 3, 5, 7, 8, 10, 12월)
   - 구현: `getNextOccurrence`에서 처리됨 ✅

2. **윤년 2월 29일 매년 반복**
   - 시나리오: 2024-02-29에 매년 반복 생성
   - 예상 동작: 윤년에만 생성 (2024, 2028, 2032...)
   - 구현: `getNextOccurrence`에서 처리됨 ✅

3. **반복 종료일 초과**
   - 시나리오: 반복 종료일이 2025-12-31을 초과하는 경우
   - 예상 동작: 입력 필드에서 max="2025-12-31" 제한
   - 구현: TextField의 max 속성 설정 필요

4. **과거 날짜로 반복 생성**
   - 시나리오: 과거 날짜에 반복 일정 생성
   - 예상 동작: 생성은 되지만 캘린더 뷰에 표시 안됨 (범위 밖)
   - 구현: 현재 로직으로 처리됨 (특별한 처리 불필요)

### EC2. 수정/삭제 관련
1. **단일 일정을 반복으로 착각**
   - 시나리오: repeat.type === 'none'인 일정 수정/삭제
   - 예상 동작: 다이얼로그 표시 안함, 바로 수정/삭제
   - 구현: `repeat.type !== 'none'` 조건으로 다이얼로그 표시 제어

2. **반복 일정을 단일로 전환 후 재수정**
   - 시나리오: 반복 → 단일 전환 후 다시 수정
   - 예상 동작: 다이얼로그 표시 안함 (이미 단일 일정)
   - 구현: repeat.type 확인으로 처리

3. **반복 ID가 없는 경우**
   - 시나리오: repeat.type !== 'none'이지만 repeat.id가 없음
   - 예상 동작: 단일 수정/삭제로 처리
   - 구현: `repeat.id` 존재 여부 확인

### EC3. API 관련
1. **네트워크 오류**
   - 시나리오: API 호출 실패
   - 예상 동작: 에러 스낵바 표시, 이벤트 목록 갱신 안됨
   - 구현: try-catch로 처리 (기존 패턴 재사용)

2. **1000개 이상 인스턴스 생성**
   - 시나리오: 매일 반복 + 긴 종료일
   - 예상 동작: `generateInstancesForEvent`에서 1000개 제한
   - 구현: while 루프 iterationCount < 1000 조건 ✅

3. **존재하지 않는 repeatId**
   - 시나리오: 서버에서 해당 repeatId를 찾을 수 없음
   - 예상 동작: 404 에러, 에러 스낵바 표시
   - 구현: 서버에서 처리 (142-151라인) ✅

### EC4. UI/UX 관련
1. **다이얼로그 중복 표시**
   - 시나리오: 빠르게 여러 번 수정/삭제 버튼 클릭
   - 예상 동작: 한 번만 표시 (state로 제어)
   - 구현: `isDialogOpen` state로 제어

2. **반복 종료일 < 시작일**
   - 시나리오: 시작일보다 이전 날짜를 종료일로 선택
   - 예상 동작: 인스턴스 생성 안됨 또는 경고
   - 구현: 클라이언트 검증 추가 필요

## 8. 다음 단계

### 테스트 설계 에이전트를 위한 인수인계 사항

#### 주요 테스트 포인트
1. **유닛 테스트**:
   - ✅ `recurrenceUtils.ts`: 이미 테스트 존재 가능성 확인 필요
   - 새로운 hook 함수들 (saveRecurringEvents, updateRecurringSeries, deleteRecurringSeries)

2. **통합 테스트**:
   - 반복 일정 생성 → 표시 → 수정 (단일/전체) → 삭제 (단일/전체) 전체 흐름

3. **엣지 케이스 테스트**:
   - 31일 매월 반복
   - 윤년 2월 29일 매년 반복
   - 반복 종료일 최대값 제한

#### 우선순위
1. **High**: 반복 인스턴스 생성 (generateInstancesForEvent), 수정/삭제 다이얼로그
2. **Medium**: 반복 아이콘 표시, API 에러 처리
3. **Low**: UI 접근성, 경계 조건

#### 참고할 기존 테스트 패턴
- `src/__tests__/unit/easy.recurrenceUtils.spec.ts`: 반복 유틸 테스트 (확인 필요)
- `src/__tests__/hooks/medium.useEventOperations.spec.ts`: 이벤트 CRUD 테스트 패턴
- `src/__tests__/medium.integration.spec.tsx`: 통합 테스트 패턴

