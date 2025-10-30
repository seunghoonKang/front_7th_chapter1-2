# 테스트 설계 → 테스트 작성 인수인계

## 작업 요약

- **설계된 테스트**: 총 17개
  - 우선순위 High: 4개 (Hook 함수 핵심 기능)
  - 우선순위 Medium: 7개 (통합 테스트 및 UI)
  - 우선순위 Low: 6개 (엣지 케이스 및 에러 처리)
- **테스트 파일**:
  - `src/__mocks__/handlersUtils.ts` (Mock 핸들러 3개 추가)
  - `src/__tests__/hooks/medium.useEventOperations.spec.ts` (테스트 추가)
  - `src/__tests__/medium.integration.spec.tsx` (통합 테스트 추가)
  - `src/__tests__/unit/easy.recurrenceUtils.spec.ts` (수정 불필요 - 이미 완전함)

## 주요 결정사항

### 1. 기존 유틸리티 테스트 재사용
**결정**: `recurrenceUtils.spec.ts`의 기존 테스트를 그대로 사용
- 이유: `generateInstancesForEvent`, `getNextOccurrence` 함수가 이미 완벽하게 테스트되어 있음
- 31일 매월 반복, 윤년 2월 29일 매년 반복 등 모든 엣지 케이스 커버됨
- 결과: 새로운 유닛 테스트 작성 불필요

### 2. 테스트 우선순위 기준
**High (핵심 기능)**:
- 반복 일정 CRUD의 핵심 Hook 함수들
- 단일 vs 전체 수정/삭제 분기 로직

**Medium (UI/통합)**:
- 사용자 인터랙션 전체 흐름
- 다이얼로그 표시 및 선택
- 반복 아이콘 표시

**Low (엣지 케이스)**:
- API 에러 처리
- 경계값 테스트
- 예외 상황

### 3. Mock 전략
**MSW 기반 API 모킹**:
- `setupMockHandlerRecurringCreation`: POST /api/events-list
  - 여러 인스턴스에 동일한 `repeat.id` 부여
- `setupMockHandlerRecurringUpdate`: PUT /api/recurring-events/:repeatId
  - 동일 repeatId의 모든 이벤트 수정
- `setupMockHandlerRecurringDelete`: DELETE /api/recurring-events/:repeatId
  - 동일 repeatId의 모든 이벤트 삭제

### 4. 테스트 네이밍 규칙
**일관성 유지**:
- describe: 영어 (함수명, 컴포넌트명)
- it: 한글 (무엇을 테스트하는지 명확하게)
- 예: `describe('saveRecurringEvents', () => { it('반복 인스턴스 배열을 성공적으로 생성해야 한다', ...) })`

### 5. TDD Red-Green-Refactor 적용
**각 테스트마다 사이클 적용**:
1. Red: 실패하는 테스트 작성 (함수 없음 또는 잘못된 동작)
2. Green: 최소한의 코드로 통과
3. Refactor: 중복 제거, 명확성 개선

## 테스트 작성 에이전트를 위한 노트

### ⚠️ 먼저 작성해야 할 테스트 (Phase 1)

**순서대로 작성 (TDD 사이클 적용)**:

1. **T-001**: `saveRecurringEvents` - 반복 인스턴스 일괄 생성
   - 가장 중요한 핵심 기능
   - Mock: `setupMockHandlerRecurringCreation`
   - 검증: POST /api/events-list 호출, 여러 인스턴스 생성, 동일 repeatId

2. **T-002**: `updateRecurringSeries` - 반복 시리즈 전체 수정
   - Mock: `setupMockHandlerRecurringUpdate`
   - 검증: PUT /api/recurring-events/:repeatId 호출, 모든 인스턴스 수정

3. **T-003**: `deleteRecurringSeries` - 반복 시리즈 전체 삭제
   - Mock: `setupMockHandlerRecurringDelete`
   - 검증: DELETE /api/recurring-events/:repeatId 호출, 모든 인스턴스 삭제

4. **T-004**: 단일 수정 시 repeat.type 변환
   - Mock: 기존 `setupMockHandlerUpdating` 활용
   - 검증: repeat.type이 'none'으로, repeat.id가 undefined로 변경

### 💡 테스트 데이터 준비 방법

#### Mock 핸들러 데이터 구조

```typescript
// setupMockHandlerRecurringCreation
const mockEvents: Event[] = []; // 비어있는 상태에서 시작

// POST /api/events-list 응답
{
  events: [
    { id: '1', ..., repeat: { type: 'weekly', interval: 1, id: 'repeat-123' } },
    { id: '2', ..., repeat: { type: 'weekly', interval: 1, id: 'repeat-123' } }, // 동일 repeatId
    { id: '3', ..., repeat: { type: 'weekly', interval: 1, id: 'repeat-123' } },
  ]
}

// setupMockHandlerRecurringUpdate
const mockEvents: Event[] = [
  // 이미 3개의 반복 인스턴스 존재
  { id: '1', title: '원래 회의', date: '2025-01-01', ..., repeat: { ..., id: 'repeat-1' } },
  { id: '2', title: '원래 회의', date: '2025-01-08', ..., repeat: { ..., id: 'repeat-1' } },
  { id: '3', title: '원래 회의', date: '2025-01-15', ..., repeat: { ..., id: 'repeat-1' } },
];

// PUT /api/recurring-events/repeat-1 요청
{ title: '수정된 제목', location: '새 장소' }

// 응답: 3개 모두 수정됨
{
  events: [
    { id: '1', title: '수정된 제목', location: '새 장소', ... },
    { id: '2', title: '수정된 제목', location: '새 장소', ... },
    { id: '3', title: '수정된 제목', location: '새 장소', ... },
  ]
}
```

#### 테스트에서 사용할 EventForm

```typescript
const recurringEventForm: EventForm = {
  title: '주간 회의',
  date: '2025-01-01',
  startTime: '10:00',
  endTime: '11:00',
  description: '',
  location: '회의실',
  category: '업무',
  isRepeating: true,
  repeatType: 'weekly',
  repeatInterval: 1,
  repeatEndDate: '2025-01-31',
  notificationTime: 10,
};
```

### 🔗 참고할 기존 테스트

#### 1. Hook 테스트 패턴 (medium.useEventOperations.spec.ts)

```typescript
// 기존 패턴 예시
it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // Mock 설정
  
  const { result } = renderHook(() => useEventOperations(false));
  await act(() => Promise.resolve(null)); // 초기 로딩 대기

  const newEvent: Event = { /* ... */ };

  await act(async () => {
    await result.current.saveEvent(newEvent); // 함수 호출
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]); // 검증
});
```

**적용 방법**:
- `setupMockHandlerRecurringCreation()` 호출
- `renderHook(() => useEventOperations(false))`
- `act` 안에서 `result.current.saveRecurringEvents(eventForm)` 호출
- `result.current.events` 검증

#### 2. 에러 처리 패턴 (medium.useEventOperations.spec.ts)

```typescript
// 기존 패턴 예시
it("이벤트 로딩 실패 시 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 }); // 에러 응답
    })
  );

  renderHook(() => useEventOperations(true));
  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers(); // 핸들러 리셋
});
```

**적용 방법**:
- `server.use()` 로 에러 응답 설정
- 함수 호출 후 `enqueueSnackbarFn` 검증
- `server.resetHandlers()` 호출 필수

#### 3. notistack Mock 패턴 (medium.useEventOperations.spec.ts)

```typescript
// 파일 상단에 이미 존재
const enqueueSnackbarFn = vi.fn();

vi.mock('notistack', async () => {
  const actual = await vi.importActual('notistack');
  return {
    ...actual,
    useSnackbar: () => ({
      enqueueSnackbar: enqueueSnackbarFn,
    }),
  };
});
```

**재사용**: 이미 medium.useEventOperations.spec.ts에 설정되어 있으므로 그대로 사용

### ⚠️ 특별히 주의할 점

#### 1. repeatId 일관성 보장

**중요**: 동일 시리즈의 모든 인스턴스는 동일한 `repeat.id`를 가져야 함

```typescript
// ✅ 올바른 예
const createdEvents = events.map((event, index) => ({
  ...event,
  id: String(mockEvents.length + index + 1),
  repeat: { ...event.repeat, id: repeatId }, // 동일한 repeatId
}));

// ❌ 잘못된 예
const createdEvents = events.map((event, index) => ({
  ...event,
  repeat: { ...event.repeat, id: `repeat-${index}` }, // 각각 다른 ID
}));
```

#### 2. 단일 vs 전체 수정/삭제 API 구분

| 동작 | API 엔드포인트 | 함수 |
|-----|--------------|-----|
| 단일 수정 | `PUT /api/events/:id` | `saveEvent(event)` |
| 전체 수정 | `PUT /api/recurring-events/:repeatId` | `updateRecurringSeries(repeatId, data)` |
| 단일 삭제 | `DELETE /api/events/:id` | `deleteEvent(id)` |
| 전체 삭제 | `DELETE /api/recurring-events/:repeatId` | `deleteRecurringSeries(repeatId)` |

#### 3. repeat.type 변환 로직

**단일 수정 시 필수 변경사항**:
```typescript
{
  ...originalEvent,
  repeat: {
    type: 'none',  // 'weekly' 등에서 'none'으로 변경
    interval: 1,
    // endDate, id는 제거 또는 undefined
  }
}
```

#### 4. Mock 데이터의 상태 관리

**주의**: `setupMockHandlerXXX` 함수 내의 `mockEvents` 배열은 함수 스코프 내에서 유지됨

```typescript
export const setupMockHandlerRecurringUpdate = () => {
  const mockEvents: Event[] = [...]; // 초기 데이터

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents }); // 현재 상태 반환
    }),
    http.put('/api/recurring-events/:repeatId', async ({ params, request }) => {
      // mockEvents 배열을 직접 수정
      mockEvents.forEach((event, index) => {
        if (event.repeat.id === repeatId) {
          mockEvents[index] = { ...event, ...updateData }; // 상태 변경
        }
      });
      // ...
    })
  );
};
```

#### 5. 기존 테스트 영향 없음

**확인 사항**:
- `src/__tests__/unit/easy.recurrenceUtils.spec.ts`는 전혀 수정하지 않음
- 기존 `useEventOperations.spec.ts`의 테스트들은 그대로 유지
- 새로운 테스트만 추가

#### 6. 통합 테스트 시 data-testid 활용

**기존 코드베이스에 data-testid가 있다면 활용**:
```typescript
const eventItem = screen.getByTestId('event-item-1');
const editButton = within(eventItem).getByRole('button', { name: /수정/i });
```

**없다면 역할과 텍스트로 찾기**:
```typescript
const editButtons = screen.getAllByRole('button', { name: /수정/i });
await user.click(editButtons[0]);
```

### 📋 테스트 체크리스트 (작성 시 확인)

#### Phase 1: Hook 함수 기본 기능
- [ ] T-001: saveRecurringEvents - 성공
- [ ] T-002: updateRecurringSeries - 성공
- [ ] T-003: deleteRecurringSeries - 성공
- [ ] T-004: 단일 수정 시 repeat.type 변환

#### Phase 2: 에러 처리
- [ ] T-201: saveRecurringEvents - API 실패
- [ ] T-202: updateRecurringSeries - 404 에러
- [ ] T-203: deleteRecurringSeries - 404 에러
- [ ] T-204: repeat.id 없는 반복 일정 처리

#### Phase 3: 통합 테스트
- [ ] T-102: 반복 아이콘 표시
- [ ] T-107: 단일 일정 다이얼로그 미표시
- [ ] T-101: 반복 일정 생성 전체 흐름
- [ ] T-103: 수정 다이얼로그 - 단일 수정
- [ ] T-104: 수정 다이얼로그 - 전체 수정
- [ ] T-105: 삭제 다이얼로그 - 단일 삭제
- [ ] T-106: 삭제 다이얼로그 - 전체 삭제

#### Phase 4: UI 엣지 케이스
- [ ] T-205: 반복 종료일 최대값 제한
- [ ] T-206: 반복 일정 겹침 검사 제외

### 🎯 각 Phase별 목표

**Phase 1 완료 후**:
- 3개의 새로운 Hook 함수가 구현됨
- 단일 수정 로직이 구현됨
- 모든 테스트 통과
- 커밋: `[테스트작성] test: 반복 일정 Hook 함수 테스트 추가`

**Phase 2 완료 후**:
- 모든 API 에러 처리 로직 구현됨
- 사용자에게 명확한 에러 메시지 제공
- 커밋: `[테스트작성] test: 반복 일정 에러 처리 테스트 추가`

**Phase 3 완료 후**:
- 전체 사용자 흐름이 동작함
- UI 다이얼로그 인터랙션 구현됨
- 커밋: `[테스트작성] test: 반복 일정 통합 테스트 추가`

**Phase 4 완료 후**:
- 모든 엣지 케이스 처리됨
- 최종 완성
- 커밋: `[테스트작성] test: 반복 일정 엣지 케이스 테스트 추가`

### 📂 작업 파일 목록

#### 1. src/__mocks__/handlersUtils.ts
**추가할 내용**:
- `setupMockHandlerRecurringCreation()` 함수
- `setupMockHandlerRecurringUpdate()` 함수
- `setupMockHandlerRecurringDelete()` 함수

**예상 라인 수**: +100~150 라인

#### 2. src/__tests__/hooks/medium.useEventOperations.spec.ts
**추가할 내용**:
- `describe('saveRecurringEvents')` 블록
- `describe('updateRecurringSeries')` 블록
- `describe('deleteRecurringSeries')` 블록
- 에러 처리 테스트들

**예상 라인 수**: +200~250 라인

#### 3. src/__tests__/medium.integration.spec.tsx
**추가할 내용**:
- `describe('반복 일정 통합 테스트')` 블록
- 전체 워크플로우 테스트 (생성→수정→삭제)
- 다이얼로그 인터랙션 테스트

**예상 라인 수**: +150~200 라인

## 참조

- **테스트 계획서**: `src/ai/test-plans/recurring-events-test-plan.md`
- **기능 명세서**: `src/ai/specs/recurring-events-spec.md`
- **기능 설계 인수인계**: `src/ai/handoffs/기능설계-to-테스트설계.md`
- **Kent Beck TDD 원칙**: `src/ai/docs/kent-beck-tdd.md`

## 예상 소요 시간

- Phase 1 (Hook 기본 기능): 1-2시간
- Phase 2 (에러 처리): 30분-1시간
- Phase 3 (통합 테스트): 2-3시간
- Phase 4 (엣지 케이스): 1시간

**총 예상 시간**: 4.5-7시간

## 성공 기준

- [ ] 17개 테스트 모두 작성 완료
- [ ] 모든 테스트 통과 (Green)
- [ ] 테스트 커버리지 90% 이상
- [ ] 핵심 기능 커버리지 100%
- [ ] Lint 에러 없음
- [ ] 타입스크립트 컴파일 에러 없음
- [ ] 각 Phase별 커밋 완료 (총 4개 커밋)

