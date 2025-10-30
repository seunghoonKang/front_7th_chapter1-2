# 테스트 작성 → 코드 작성 인수인계

## 작업 요약

### ✅ 완료된 작업
- **작성된 테스트**: 총 17개
  - Phase 1 (핵심 기능): 4개
  - Phase 2 (에러 처리): 4개
  - Phase 3 (통합 테스트): 8개
  - Phase 4 (엣지 케이스): 1개
- **테스트 파일**:
  - `src/__mocks__/handlersUtils.ts` (Mock 핸들러 4개 추가)
  - `src/__tests__/hooks/medium.useEventOperations.spec.ts` (Hook 테스트 8개 추가)
  - `src/__tests__/medium.integration.spec.tsx` (통합 테스트 9개 추가)
- **총 커밋 수**: 4개
- **현재 상태**: 모든 테스트 실패 (예상대로 - RED 단계 완료)

### 📦 커밋 목록
1. `e98deed` - Phase 1: 반복 일정 핵심 기능 테스트 추가
2. `522e39d` - Phase 2: 반복 일정 에러 처리 테스트 추가
3. `dfbe1ad` - Phase 3: 반복 일정 통합 테스트 추가
4. `1aaeca4` - Phase 4: 반복 일정 UI 엣지 케이스 테스트 추가

---

## 주요 결정사항

### 1. Mock 전략
**MSW 기반 API 모킹**:
- `setupMockHandlerRecurringCreation`: POST /api/events-list
  - 여러 인스턴스에 동일한 `repeat.id` 부여
- `setupMockHandlerRecurringUpdate`: PUT /api/recurring-events/:repeatId
  - 동일 repeatId의 모든 이벤트 수정
- `setupMockHandlerRecurringDelete`: DELETE /api/recurring-events/:repeatId
  - 동일 repeatId의 모든 이벤트 삭제
- `setupMockHandlerSingleUpdate`: PUT /api/events/:id
  - 단일 이벤트 수정 시 repeat.type 변환 검증

### 2. 테스트 네이밍 규칙 준수
- `describe`: 영어 (함수/컴포넌트명)
- `it`: 한글 (무엇을 테스트하는지 명확하게)

### 3. AAA 패턴 엄격히 적용
모든 테스트에서 Arrange-Act-Assert 구조 명확히 구분

---

## 코드 작성 에이전트를 위한 노트

### ⚠️ 먼저 통과시켜야 할 테스트 (권장 순서)

#### 1단계: Hook 함수 구현 (가장 중요)
**파일**: `src/hooks/useEventOperations.ts`

```typescript
// 추가할 3개 함수:

1. saveRecurringEvents(events: Event[]): Promise<void>
   - POST /api/events-list 호출
   - events 배열을 { events } 형태로 전송
   - 응답으로 받은 이벤트들을 상태에 추가
   - 성공: '일정 생성 완료' 스낵바
   - 실패: '일정 생성 실패' 에러 스낵바

2. updateRecurringSeries(repeatId: string, updateData: Partial<Event>): Promise<void>
   - PUT /api/recurring-events/:repeatId 호출
   - updateData를 body로 전송
   - 응답으로 받은 수정된 이벤트들로 상태 업데이트
   - 성공: '일정 수정 완료' 스낵바
   - 실패: '일정 수정 실패' 에러 스낵바

3. deleteRecurringSeries(repeatId: string): Promise<void>
   - DELETE /api/recurring-events/:repeatId 호출
   - 해당 repeatId를 가진 모든 이벤트를 상태에서 제거
   - 성공: '일정 삭제 완료' 스낵바
   - 실패: '일정 삭제 실패' 에러 스낵바
```

**이 함수들이 구현되면 Phase 1, 2의 7개 테스트가 통과됩니다.**

#### 2단계: 반복 일정 생성 UI 구현
**파일**: `src/components/EventForm.tsx` (또는 유사한 폼 컴포넌트)

```typescript
// 추가할 UI 요소:

1. 반복 일정 체크박스
   - label: "반복 일정"
   - 체크 시 반복 설정 UI 표시

2. 반복 유형 선택 (select)
   - label: "반복 유형"
   - options: daily, weekly, monthly, yearly
   - 기본값: weekly

3. 반복 간격 입력 (number input)
   - label: "반복 간격"
   - min: 1
   - 기본값: 1

4. 반복 종료일 입력 (date input)
   - label: "반복 종료일"
   - type: "date"
   - max: "2025-12-31" ⚠️ 중요!

5. 제출 시 로직:
   - 반복 일정이면: generateInstancesForEvent() 호출 → saveRecurringEvents() 호출
   - 단일 일정이면: 기존 saveEvent() 호출
```

**이것이 구현되면 T-101, T-205 테스트가 통과됩니다.**

#### 3단계: 반복 아이콘 표시
**파일**: `src/components/EventList.tsx` 또는 `EventItem.tsx`

```typescript
// 추가할 로직:

if (event.repeat.type !== 'none') {
  // 반복 아이콘 표시
  <RepeatIcon aria-label="반복 일정 아이콘" />
}
```

**이것이 구현되면 T-102 테스트가 통과됩니다.**

#### 4단계: 수정/삭제 다이얼로그 구현
**새 컴포넌트**: `src/components/RecurringEventDialog.tsx`

```typescript
interface RecurringEventDialogProps {
  open: boolean;
  type: 'edit' | 'delete';
  onClose: () => void;
  onSingleAction: () => void;
  onSeriesAction: () => void;
}

// 다이얼로그 내용:
// - 수정: "해당 일정만 수정하시겠어요?"
// - 삭제: "해당 일정만 삭제하시겠어요?"
// - 버튼: "예" (단일), "아니오" (전체)
```

**수정 버튼 클릭 시 로직**:
```typescript
const handleEdit = (event: Event) => {
  if (event.repeat.type !== 'none' && event.repeat.id) {
    // 다이얼로그 표시
    setRecurringDialogOpen(true);
    setRecurringDialogType('edit');
  } else {
    // 바로 수정 폼 표시
    openEditForm(event);
  }
};

const handleSingleEdit = () => {
  // repeat.type을 'none'으로 변경
  const updatedEvent = {
    ...selectedEvent,
    repeat: { type: 'none', interval: 1 }
  };
  saveEvent(updatedEvent);
};

const handleSeriesEdit = () => {
  // 수정 폼 표시 → 제출 시 updateRecurringSeries 호출
  openEditFormForSeries(selectedEvent);
};
```

**삭제 버튼 클릭 시 로직**:
```typescript
const handleDelete = (event: Event) => {
  if (event.repeat.type !== 'none' && event.repeat.id) {
    // 다이얼로그 표시
    setRecurringDialogOpen(true);
    setRecurringDialogType('delete');
  } else {
    // 바로 삭제
    deleteEvent(event.id);
  }
};

const handleSingleDelete = () => {
  deleteEvent(selectedEvent.id);
};

const handleSeriesDelete = () => {
  deleteRecurringSeries(selectedEvent.repeat.id!);
};
```

**이것이 구현되면 T-103~T-107 테스트가 통과됩니다.**

#### 5단계: 겹침 검사 제외
**파일**: 겹침 검사 로직이 있는 파일

```typescript
// 반복 일정 생성 시 겹침 검사 건너뛰기
const checkOverlap = (event: Event) => {
  if (isCreatingRecurringEvent) {
    return; // 반복 일정은 겹침 검사 안함
  }
  // 기존 겹침 검사 로직
};
```

**이것이 구현되면 T-206 테스트가 통과됩니다.**

---

## 💡 구현 시 주의사항

### 1. repeatId 일관성 보장 ⚠️
**중요**: 동일 시리즈의 모든 인스턴스는 동일한 `repeat.id`를 가져야 함

```typescript
// ✅ 올바른 구현
const repeatId = `repeat-${Date.now()}`;
instances.forEach(instance => {
  instance.repeat.id = repeatId; // 모두 동일한 ID
});

// ❌ 잘못된 구현
instances.forEach((instance, index) => {
  instance.repeat.id = `repeat-${index}`; // 각각 다른 ID (X)
});
```

### 2. 단일 vs 전체 수정/삭제 API 구분

| 동작 | API 엔드포인트 | 함수 | repeat.type 변환 |
|-----|--------------|-----|----------------|
| 단일 수정 | `PUT /api/events/:id` | `saveEvent(event)` | 'none'으로 변경 |
| 전체 수정 | `PUT /api/recurring-events/:repeatId` | `updateRecurringSeries(repeatId, data)` | 유지 |
| 단일 삭제 | `DELETE /api/events/:id` | `deleteEvent(id)` | - |
| 전체 삭제 | `DELETE /api/recurring-events/:repeatId` | `deleteRecurringSeries(repeatId)` | - |

### 3. repeat.type 변환 로직 ⚠️
**단일 수정 시 필수 변경사항**:
```typescript
const handleSingleEdit = (event: Event) => {
  const updatedEvent = {
    ...event,
    repeat: {
      type: 'none' as const,  // 'weekly' → 'none'
      interval: 1,
      // endDate, id는 제거 또는 undefined
    }
  };
  await saveEvent(updatedEvent);
};
```

### 4. repeat.id가 없는 경우 처리
```typescript
// repeat.type !== 'none'이지만 repeat.id가 없으면
// 단일 수정/삭제로 처리
if (event.repeat.type !== 'none' && event.repeat.id) {
  // 다이얼로그 표시
} else {
  // 단일 수정/삭제
}
```

### 5. 반복 종료일 최대값 제한
```typescript
<input
  type="date"
  max="2025-12-31"  // ⚠️ 필수!
  aria-label="반복 종료일"
/>
```

### 6. generateInstancesForEvent 사용
**파일**: `src/utils/recurrenceUtils.ts`

```typescript
import { generateInstancesForEvent } from '../utils/recurrenceUtils';

// 반복 일정 생성 시
const instances = generateInstancesForEvent(
  baseEvent,
  new Date(baseEvent.date),
  new Date(repeatEndDate)
);

// 생성된 인스턴스를 saveRecurringEvents로 저장
await saveRecurringEvents(instances);
```

---

## 🔗 참고할 기존 코드

### 1. Hook 패턴
**파일**: `src/hooks/useEventOperations.ts`

기존 `saveEvent`, `deleteEvent` 패턴을 참고하여 새 함수 추가:
```typescript
// 기존 패턴
const saveEvent = async (event: Event) => {
  try {
    const method = event.id ? 'PUT' : 'POST';
    const url = event.id ? `/api/events/${event.id}` : '/api/events';
    const response = await fetch(url, { method, body: JSON.stringify(event) });
    // ... 상태 업데이트
    enqueueSnackbar('일정 저장 완료', { variant: 'success' });
  } catch (error) {
    enqueueSnackbar('일정 저장 실패', { variant: 'error' });
  }
};

// 새로운 함수도 동일한 패턴으로
const saveRecurringEvents = async (events: Event[]) => {
  try {
    const response = await fetch('/api/events-list', {
      method: 'POST',
      body: JSON.stringify({ events })
    });
    // ... 상태 업데이트
    enqueueSnackbar('일정 생성 완료', { variant: 'success' });
  } catch (error) {
    enqueueSnackbar('일정 생성 실패', { variant: 'error' });
  }
};
```

### 2. 통합 테스트에서 사용된 컴포넌트
**예상 파일 구조**:
- `src/components/EventForm.tsx` - 일정 입력 폼
- `src/components/EventList.tsx` - 일정 목록 표시
- `src/App.tsx` - 최상위 컴포넌트

**필요한 aria-label / testId**:
- `data-testid="event-submit-button"` - 제출 버튼
- `data-testid="event-list"` - 이벤트 목록
- `aria-label="Edit event"` - 수정 버튼
- `aria-label="Delete event"` - 삭제 버튼
- `aria-label="반복 일정 아이콘"` - 반복 아이콘

### 3. 기존 유틸리티 함수
**파일**: `src/utils/recurrenceUtils.ts`

```typescript
// 이미 구현되어 있고 모든 테스트 통과
export function generateInstancesForEvent(
  event: Event,
  rangeStart: Date,
  rangeEnd: Date
): Event[];

export function getNextOccurrence(
  date: Date,
  type: RepeatType,
  interval: number
): Date;
```

---

## 📊 테스트 실패 메시지 분석

### Phase 1, 2: Hook 함수 없음
```
❌ result.current.saveRecurringEvents is not a function
❌ result.current.updateRecurringSeries is not a function
❌ result.current.deleteRecurringSeries is not a function
```
**해결**: `useEventOperations` 훅에 3개 함수 추가

### Phase 3: UI 요소 없음
```
❌ Unable to find an element with the text: /반복 일정/i
❌ Unable to find an element with the text: /해당 일정만 수정하시겠어요?/i
❌ Unable to find an element by: [aria-label="반복 일정 아이콘"]
```
**해결**: 반복 체크박스, 다이얼로그, 아이콘 UI 추가

### Phase 4: 속성 없음
```
❌ expect(element).toHaveAttribute('max', '2025-12-31')
```
**해결**: 반복 종료일 input에 max="2025-12-31" 추가

---

## 📁 수정/생성할 파일 목록

### 1. `src/hooks/useEventOperations.ts` (수정)
**추가할 내용**:
- `saveRecurringEvents` 함수
- `updateRecurringSeries` 함수
- `deleteRecurringSeries` 함수
- Hook의 return에 3개 함수 추가

**예상 라인 수**: +80~100 라인

### 2. `src/components/EventForm.tsx` (수정 또는 생성)
**추가할 내용**:
- 반복 일정 체크박스
- 반복 유형 선택
- 반복 간격 입력
- 반복 종료일 입력 (max="2025-12-31")
- 제출 로직 분기 (단일/반복)

**예상 라인 수**: +100~150 라인

### 3. `src/components/RecurringEventDialog.tsx` (생성)
**새 컴포넌트**:
- 단일/전체 선택 다이얼로그
- 수정/삭제 모드 지원
- "예" / "아니오" 버튼

**예상 라인 수**: +60~80 라인

### 4. `src/components/EventList.tsx` 또는 `EventItem.tsx` (수정)
**추가할 내용**:
- 반복 아이콘 표시 로직
- 수정 버튼 클릭 시 다이얼로그 로직
- 삭제 버튼 클릭 시 다이얼로그 로직

**예상 라인 수**: +40~60 라인

### 5. `src/App.tsx` (수정 가능)
**추가 필요 시**:
- 다이얼로그 상태 관리
- 반복 일정 생성 플로우 연결

**예상 라인 수**: +30~50 라인

### 6. `src/types.ts` (확인)
**현재 타입**:
```typescript
export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
  id?: string;  // 이미 정의되어 있는지 확인 필요
}
```

**필요 시 추가**: `id?: string;`

---

## ✅ 완료 조건

다음 모든 조건이 충족되면 **GREEN 단계 완료**:

- [ ] `useEventOperations` 훅에 3개 함수 구현
- [ ] 반복 일정 생성 UI 구현
- [ ] 반복 아이콘 표시
- [ ] 수정/삭제 다이얼로그 구현
- [ ] 단일 수정 시 repeat.type 변환
- [ ] 반복 종료일 max 속성 설정
- [ ] 반복 일정 겹침 검사 제외
- [ ] **모든 17개 테스트 통과** ✅
- [ ] 타입스크립트 컴파일 에러 없음
- [ ] Lint 에러 없음

---

## 🧪 테스트 실행 방법

```bash
# Hook 테스트만 실행
pnpm test medium.useEventOperations.spec.ts --run

# 통합 테스트만 실행
pnpm test medium.integration.spec.tsx --run

# 전체 테스트 실행
pnpm test --run
```

---

## 📚 참고 문서

- **기능 명세서**: `src/ai/specs/recurring-events-spec.md`
- **테스트 계획서**: `src/ai/test-plans/recurring-events-test-plan.md`
- **Kent Beck TDD 원칙**: `src/ai/docs/kent-beck-tdd.md`
- **서버 API**: `server.js` (실제 API 엔드포인트 구현 확인)

---

## 🎯 우선순위 요약

**가장 중요한 순서**:

1. ⭐⭐⭐ Hook 3개 함수 구현 (7개 테스트 통과)
2. ⭐⭐ 반복 생성 UI + 다이얼로그 (8개 테스트 통과)
3. ⭐ 반복 아이콘 + 엣지 케이스 (2개 테스트 통과)

**예상 소요 시간**: 3~5시간

---

## 🚨 절대 수정하면 안 되는 것

- ❌ **테스트 파일 수정 금지**
  - `src/__tests__/hooks/medium.useEventOperations.spec.ts`
  - `src/__tests__/medium.integration.spec.tsx`
  - `src/__mocks__/handlersUtils.ts`
- ❌ **기존 유틸리티 함수 수정 금지**
  - `src/utils/recurrenceUtils.ts` (이미 완벽하게 테스트됨)
- ❌ **기존 테스트 통과율 유지**
  - 새로운 코드가 기존 테스트를 깨뜨리면 안됨

---

## 최종 체크리스트

작업 시작 전 확인:
- [ ] 테스트 계획서를 읽었는가?
- [ ] 인수인계 문서를 이해했는가?
- [ ] Kent Beck TDD 원칙을 숙지했는가?
- [ ] 기존 코드 구조를 파악했는가?

작업 완료 후 확인:
- [ ] 모든 17개 테스트가 통과하는가?
- [ ] 기존 테스트들도 여전히 통과하는가?
- [ ] Lint 에러가 없는가?
- [ ] 타입 에러가 없는가?
- [ ] 코드가 명확하고 이해하기 쉬운가?

---

**모든 테스트가 통과하면 다음 에이전트(리팩터링)로 진행합니다!** 🚀

