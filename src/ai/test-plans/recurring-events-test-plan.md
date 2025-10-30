# 반복 일정 기능 테스트 계획서

## 1. 테스트 전략

### 1.1 테스트 레벨

- **Unit Tests**: 순수 함수 및 유틸리티
  - ✅ `recurrenceUtils.ts`의 `generateInstancesForEvent` - 이미 완전히 테스트됨
  - 추가 테스트 불필요 (기존 테스트가 모든 케이스 커버)

- **Hook Tests**: 커스텀 훅 함수들
  - `useEventOperations`에 추가될 3개 함수:
    - `saveRecurringEvents()` - 반복 인스턴스 일괄 생성
    - `updateRecurringSeries()` - 반복 시리즈 전체 수정
    - `deleteRecurringSeries()` - 반복 시리즈 전체 삭제
  - 단일 수정/삭제 시 `repeat.type` 변환 로직

- **Integration Tests**: 전체 워크플로우
  - 반복 일정 생성 → 표시 → 수정(단일/전체) → 삭제(단일/전체)
  - UI 다이얼로그 인터랙션
  - 반복 아이콘 표시

### 1.2 API 테스트 전략

**Mock API 엔드포인트 (server.js 기반)**:
- `POST /api/events-list` - 벌크 작업 (반복 이벤트 생성)
  - 요청: `{ events: Event[] }`
  - 응답: 각 이벤트에 동일한 `repeat.id` 부여
  
- `PUT /api/recurring-events/:repeatId` - 시리즈 수정
  - 요청: 수정할 필드 (title, description, location, category, notificationTime)
  - 응답: 해당 repeatId를 가진 모든 이벤트 수정
  
- `DELETE /api/recurring-events/:repeatId` - 시리즈 삭제
  - 응답: 해당 repeatId를 가진 모든 이벤트 삭제

- `PUT /api/events/:id` - 단일 이벤트 수정 (기존)
  - 반복 → 단일 전환: `repeat.type: 'none'`, `repeat.id: undefined`

- `DELETE /api/events/:id` - 단일 이벤트 삭제 (기존)

### 1.3 TDD 접근 방식

**Red-Green-Refactor 사이클 적용**:

1. **Red (실패하는 테스트 작성)**
   - 가장 간단한 케이스부터 시작 (예: 매일 반복 생성)
   - 테스트가 실패하는 것 확인
   - 검증: 함수가 존재하지 않거나 예상 동작 안함

2. **Green (최소한의 코드로 통과)**
   - 테스트를 통과할 만큼만 구현
   - 검증: 모든 테스트 통과
   - 최적화나 복잡한 로직은 나중으로 미룸

3. **Refactor (구조 개선)**
   - 중복 제거
   - 명확성 개선
   - 검증: 테스트는 여전히 통과

**각 사이클에서 검증할 사항**:
- Red: 테스트가 올바른 이유로 실패하는가?
- Green: 테스트가 통과하는가? (모든 테스트)
- Refactor: 코드가 더 명확해졌는가? 중복이 제거되었는가?

## 2. 테스트 목록

### 2.1 우선순위 High (핵심 기능)

| 테스트 ID | 테스트 설명 | 검증 사항 | 난이도 | 예상 파일 |
|----------|-----------|---------|-------|----------|
| T-001 | 반복 인스턴스 일괄 생성 API 호출 | `saveRecurringEvents`가 POST /api/events-list 호출, events 배열 전송, 성공 시 이벤트 목록 업데이트 | Medium | hooks/medium.useEventOperations.spec.ts |
| T-002 | 반복 시리즈 전체 수정 API 호출 | `updateRecurringSeries`가 PUT /api/recurring-events/:repeatId 호출, 동일 repeatId의 모든 이벤트 수정 | Medium | hooks/medium.useEventOperations.spec.ts |
| T-003 | 반복 시리즈 전체 삭제 API 호출 | `deleteRecurringSeries`가 DELETE /api/recurring-events/:repeatId 호출, 동일 repeatId의 모든 이벤트 삭제 | Medium | hooks/medium.useEventOperations.spec.ts |
| T-004 | 단일 수정 시 repeat.type 변환 | 반복 일정 단일 수정 시 repeat.type이 'none'으로, repeat.id가 undefined로 변경 | Medium | hooks/medium.useEventOperations.spec.ts |

### 2.2 우선순위 Medium (통합 및 UI)

| 테스트 ID | 테스트 설명 | 검증 사항 | 난이도 | 예상 파일 |
|----------|-----------|---------|-------|----------|
| T-101 | 반복 일정 생성 전체 흐름 | 반복 체크박스 선택 → 유형/간격/종료일 입력 → 생성 → 여러 인스턴스 캘린더에 표시 | Medium | medium.integration.spec.tsx |
| T-102 | 반복 아이콘 표시 | 캘린더 뷰에서 repeat.type !== 'none'인 일정에 반복 아이콘 표시 | Easy | medium.integration.spec.tsx |
| T-103 | 수정 다이얼로그 - 단일 수정 | "예" 선택 → 해당 일정만 수정, 다른 인스턴스 유지 | Medium | medium.integration.spec.tsx |
| T-104 | 수정 다이얼로그 - 전체 수정 | "아니오" 선택 → 모든 반복 인스턴스 수정 | Medium | medium.integration.spec.tsx |
| T-105 | 삭제 다이얼로그 - 단일 삭제 | "예" 선택 → 해당 일정만 삭제, 다른 인스턴스 유지 | Medium | medium.integration.spec.tsx |
| T-106 | 삭제 다이얼로그 - 전체 삭제 | "아니오" 선택 → 모든 반복 인스턴스 삭제 | Medium | medium.integration.spec.tsx |
| T-107 | 단일 일정 수정/삭제 시 다이얼로그 미표시 | repeat.type === 'none'인 일정은 다이얼로그 표시 안함 | Easy | medium.integration.spec.tsx |

### 2.3 우선순위 Low (엣지 케이스 및 에러 처리)

| 테스트 ID | 테스트 설명 | 검증 사항 | 난이도 | 예상 파일 |
|----------|-----------|---------|-------|----------|
| T-201 | 반복 인스턴스 생성 API 실패 | POST /api/events-list 실패 시 에러 스낵바 표시, 이벤트 목록 유지 | Easy | hooks/medium.useEventOperations.spec.ts |
| T-202 | 반복 시리즈 수정 API 실패 (404) | 존재하지 않는 repeatId로 수정 시 에러 스낵바 표시 | Easy | hooks/medium.useEventOperations.spec.ts |
| T-203 | 반복 시리즈 삭제 API 실패 (404) | 존재하지 않는 repeatId로 삭제 시 에러 스낵바 표시 | Easy | hooks/medium.useEventOperations.spec.ts |
| T-204 | repeat.id가 없는 반복 일정 처리 | repeat.type !== 'none'이지만 repeat.id가 없으면 단일 수정/삭제로 처리 | Medium | hooks/medium.useEventOperations.spec.ts |
| T-205 | 반복 종료일 최대값 제한 (2025-12-31) | 종료일이 2025-12-31을 넘지 않는지 확인 | Easy | medium.integration.spec.tsx |
| T-206 | 반복 일정 겹침 검사 제외 확인 | 겹치는 반복 일정 생성 시 겹침 경고 다이얼로그 미표시 | Easy | medium.integration.spec.tsx |

## 3. 엣지 케이스 분석

### 3.1 경계값 테스트

- **반복 종료일 최대값**: 2025-12-31
  - UI에서 max 속성으로 제한
  - generateInstancesForEvent의 rangeEnd도 제한
  
- **반복 간격 최소값**: 1
  - UI에서 min 속성으로 제한
  - 0 또는 음수는 불가

- **인스턴스 최대 개수**: 1000개
  - `generateInstancesForEvent`의 iterationCount < 1000
  - 이미 구현됨 (기존 테스트로 검증 완료)

### 3.2 예외 상황

- **존재하지 않는 repeatId**:
  - PUT/DELETE /api/recurring-events/:repeatId → 404 응답
  - 에러 스낵바 표시: "일정 수정 실패" / "일정 삭제 실패"

- **repeat.id가 없는 반복 일정**:
  - repeat.type !== 'none'이지만 repeat.id === undefined
  - 단일 수정/삭제로 처리 (시리즈 수정/삭제 불가)

- **네트워크 오류**:
  - API 호출 실패 시 에러 스낵바 표시
  - 이벤트 목록 상태 유지 (변경 안됨)

### 3.3 데이터 검증

- **반복 종료일 < 시작일**:
  - 클라이언트 검증 필요
  - 경고 메시지 또는 인스턴스 0개 생성

- **필수 필드 누락**:
  - 제목, 날짜, 시작/종료 시간 필수
  - 기존 검증 로직 재사용

- **시간 유효성**:
  - 종료 시간 > 시작 시간
  - 기존 검증 로직 재사용

### 3.4 특수 날짜 케이스 (이미 테스트됨)

✅ 다음 케이스는 `src/__tests__/unit/easy.recurrenceUtils.spec.ts`에서 이미 완전히 테스트됨:
- **31일 매월 반복**: 31일이 없는 달 건너뛰기
- **윤년 2월 29일 매년 반복**: 윤년이 아닌 해 건너뛰기
- **반복 유형별 인스턴스 생성**: 매일/매주/매월/매년
- **반복 간격**: interval 1, 2 등
- **범위 외 처리**: rangeStart, rangeEnd 밖의 인스턴스 제외

## 4. 테스트 파일 구조

```
src/__tests__/
├── unit/
│   └── easy.recurrenceUtils.spec.ts (✅ 이미 존재, 수정 불필요)
├── hooks/
│   └── medium.useEventOperations.spec.ts (✏️ 4개 함수 테스트 추가)
└── medium.integration.spec.tsx (✏️ 반복 일정 통합 테스트 추가)
```

## 5. 각 테스트 상세 설계

### 테스트 네이밍 규칙 ⚠️

```
✅ 올바른 네이밍:
- describe: 영어 (함수/클래스명)
- it/test: 한글 (무엇을 테스트하는지 명확하게)

예시:
describe('useEventOperations', () => {
  describe('saveRecurringEvents', () => {
    it('반복 인스턴스 배열을 POST /api/events-list로 전송하고 성공적으로 생성해야 한다', () => {
      // ...
    });
  });
});
```

### T-001: 반복 인스턴스 일괄 생성 API 호출

```typescript
describe('useEventOperations', () => {
  describe('saveRecurringEvents', () => {
    it('반복 인스턴스 배열을 POST /api/events-list로 전송하고 성공적으로 생성해야 한다', async () => {
      // Arrange: Mock 핸들러 설정, 반복 일정 폼 준비
      setupMockHandlerRecurringCreation();
      const { result } = renderHook(() => useEventOperations(false));
      
      const eventForm: EventForm = {
        title: '주간 회의',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '',
        category: '업무',
        isRepeating: true,
        repeatType: 'weekly',
        repeatInterval: 1,
        repeatEndDate: '2025-01-31',
        notificationTime: 10,
      };

      // Act: saveRecurringEvents 호출
      await act(async () => {
        await result.current.saveRecurringEvents(eventForm);
      });

      // Assert: 여러 인스턴스가 생성되었는지, 모두 동일한 repeat.id를 가지는지 확인
      expect(result.current.events.length).toBeGreaterThan(1);
      const repeatId = result.current.events[0].repeat.id;
      expect(repeatId).toBeDefined();
      expect(result.current.events.every(e => e.repeat.id === repeatId)).toBe(true);
    });
  });
});
```

### T-002: 반복 시리즈 전체 수정 API 호출

```typescript
describe('useEventOperations', () => {
  describe('updateRecurringSeries', () => {
    it('동일한 repeatId를 가진 모든 이벤트를 수정해야 한다', async () => {
      // Arrange: 반복 이벤트가 이미 존재하는 상태
      setupMockHandlerRecurringUpdate();
      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const repeatId = result.current.events[0].repeat.id!;
      const updateData = { title: '수정된 제목', location: '새 장소' };

      // Act: updateRecurringSeries 호출
      await act(async () => {
        await result.current.updateRecurringSeries(repeatId, updateData);
      });

      // Assert: 동일 repeatId의 모든 이벤트가 수정되었는지 확인
      const updatedEvents = result.current.events.filter(e => e.repeat.id === repeatId);
      expect(updatedEvents.every(e => e.title === '수정된 제목')).toBe(true);
      expect(updatedEvents.every(e => e.location === '새 장소')).toBe(true);
    });
  });
});
```

### T-003: 반복 시리즈 전체 삭제 API 호출

```typescript
describe('useEventOperations', () => {
  describe('deleteRecurringSeries', () => {
    it('동일한 repeatId를 가진 모든 이벤트를 삭제해야 한다', async () => {
      // Arrange: 반복 이벤트가 이미 존재하는 상태
      setupMockHandlerRecurringDelete();
      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const initialCount = result.current.events.length;
      const repeatId = result.current.events[0].repeat.id!;
      const seriesCount = result.current.events.filter(e => e.repeat.id === repeatId).length;

      // Act: deleteRecurringSeries 호출
      await act(async () => {
        await result.current.deleteRecurringSeries(repeatId);
      });

      // Assert: 해당 시리즈의 모든 이벤트가 삭제되었는지 확인
      expect(result.current.events.length).toBe(initialCount - seriesCount);
      expect(result.current.events.every(e => e.repeat.id !== repeatId)).toBe(true);
    });
  });
});
```

### T-004: 단일 수정 시 repeat.type 변환

```typescript
describe('useEventOperations', () => {
  describe('saveEvent (단일 수정)', () => {
    it('반복 일정을 단일 수정하면 repeat.type이 none으로 변경되어야 한다', async () => {
      // Arrange: 반복 이벤트가 존재하는 상태
      setupMockHandlerSingleUpdate();
      const { result } = renderHook(() => useEventOperations(true));
      await act(() => Promise.resolve(null));

      const targetEvent = result.current.events[0];
      expect(targetEvent.repeat.type).not.toBe('none');

      // Act: 단일 이벤트로 수정 (repeat.type을 'none'으로)
      const updatedEvent = {
        ...targetEvent,
        title: '단일 일정으로 변경',
        repeat: { type: 'none' as const, interval: 1 },
      };
      
      await act(async () => {
        await result.current.saveEvent(updatedEvent);
      });

      // Assert: 해당 이벤트만 수정되고 repeat.type이 'none', repeat.id가 undefined
      const modifiedEvent = result.current.events.find(e => e.id === targetEvent.id);
      expect(modifiedEvent?.repeat.type).toBe('none');
      expect(modifiedEvent?.repeat.id).toBeUndefined();
    });
  });
});
```

### T-101 ~ T-107: 통합 테스트 (medium.integration.spec.tsx)

```typescript
describe('반복 일정 통합 테스트', () => {
  it('반복 일정 생성부터 삭제까지 전체 흐름이 정상 작동해야 한다', async () => {
    // Arrange: App 렌더링
    const { user } = setupIntegrationTest();
    render(<App />);

    // Act & Assert 1: 반복 체크박스 선택 → 반복 설정 UI 표시
    const repeatCheckbox = screen.getByLabelText(/반복 일정/i);
    await user.click(repeatCheckbox);
    expect(screen.getByLabelText(/반복 유형/i)).toBeInTheDocument();

    // Act & Assert 2: 반복 일정 입력 및 생성
    await user.type(screen.getByLabelText(/제목/i), '주간 회의');
    await user.selectOptions(screen.getByLabelText(/반복 유형/i), 'weekly');
    await user.type(screen.getByLabelText(/반복 종료일/i), '2025-01-31');
    await user.click(screen.getByRole('button', { name: /일정 추가/i }));

    // Assert: 캘린더에 여러 인스턴스 표시, 반복 아이콘 확인
    const eventElements = await screen.findAllByText(/주간 회의/i);
    expect(eventElements.length).toBeGreaterThan(1);
    
    const repeatIcons = screen.getAllByLabelText(/반복 일정/i);
    expect(repeatIcons.length).toBeGreaterThan(0);

    // Act & Assert 3: 수정 다이얼로그 - 전체 수정
    const firstEvent = eventElements[0];
    const editButton = within(firstEvent.closest('[data-testid="event-item"]')!).getByRole('button', { name: /수정/i });
    await user.click(editButton);

    // 다이얼로그 확인
    expect(screen.getByText(/해당 일정만 수정하시겠어요?/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /아니오/i }));

    // 수정 폼에서 제목 변경
    await user.clear(screen.getByLabelText(/제목/i));
    await user.type(screen.getByLabelText(/제목/i), '전체 수정된 회의');
    await user.click(screen.getByRole('button', { name: /수정/i }));

    // Assert: 모든 인스턴스 제목 변경 확인
    const updatedEvents = await screen.findAllByText(/전체 수정된 회의/i);
    expect(updatedEvents.length).toBe(eventElements.length);

    // Act & Assert 4: 삭제 다이얼로그 - 단일 삭제
    const deleteButton = within(updatedEvents[0].closest('[data-testid="event-item"]')!).getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);
    
    expect(screen.getByText(/해당 일정만 삭제하시겠어요?/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /예/i }));

    // Assert: 하나만 삭제, 나머지는 유지
    const remainingEvents = screen.queryAllByText(/전체 수정된 회의/i);
    expect(remainingEvents.length).toBe(updatedEvents.length - 1);
  });
});
```

### T-201 ~ T-203: 에러 처리 테스트

```typescript
describe('useEventOperations', () => {
  describe('에러 처리', () => {
    it('반복 인스턴스 생성 실패 시 에러 스낵바를 표시해야 한다', async () => {
      // Arrange: API 실패 설정
      server.use(
        http.post('/api/events-list', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));
      
      // Act: saveRecurringEvents 호출
      await act(async () => {
        await result.current.saveRecurringEvents(mockEventForm);
      });

      // Assert: 에러 스낵바 표시
      expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 생성 실패', { variant: 'error' });
      
      server.resetHandlers();
    });

    it('존재하지 않는 repeatId 수정 시 에러 스낵바를 표시해야 한다', async () => {
      // Arrange: 404 응답 설정
      server.use(
        http.put('/api/recurring-events/:repeatId', () => {
          return new HttpResponse(null, { status: 404 });
        })
      );

      const { result } = renderHook(() => useEventOperations(false));

      // Act: updateRecurringSeries 호출
      await act(async () => {
        await result.current.updateRecurringSeries('non-existent-id', { title: '수정' });
      });

      // Assert: 에러 스낵바 표시
      expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 수정 실패', { variant: 'error' });
      
      server.resetHandlers();
    });
  });
});
```

## 6. Mock/Stub 계획

### 6.1 API Mock

**MSW를 사용하여 server.js의 API 모킹**

`src/__mocks__/handlersUtils.ts`에 다음 함수 추가:

```typescript
export const setupMockHandlerRecurringCreation = () => {
  const mockEvents: Event[] = [];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.post('/api/events-list', async ({ request }) => {
      const { events } = (await request.json()) as { events: Event[] };
      
      // 동일한 repeat.id 생성
      const repeatId = `repeat-${Date.now()}`;
      const createdEvents = events.map((event, index) => ({
        ...event,
        id: String(mockEvents.length + index + 1),
        repeat: { ...event.repeat, id: repeatId },
      }));

      mockEvents.push(...createdEvents);
      return HttpResponse.json({ events: createdEvents }, { status: 201 });
    })
  );
};

export const setupMockHandlerRecurringUpdate = () => {
  const mockEvents: Event[] = [
    // 반복 일정 인스턴스 3개 (동일 repeatId)
    {
      id: '1',
      title: '원래 회의',
      date: '2025-01-01',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: 'repeat-1' },
      notificationTime: 10,
    },
    {
      id: '2',
      title: '원래 회의',
      date: '2025-01-08',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: 'repeat-1' },
      notificationTime: 10,
    },
    {
      id: '3',
      title: '원래 회의',
      date: '2025-01-15',
      startTime: '10:00',
      endTime: '11:00',
      description: '',
      location: '회의실',
      category: '업무',
      repeat: { type: 'weekly', interval: 1, id: 'repeat-1' },
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.put('/api/recurring-events/:repeatId', async ({ params, request }) => {
      const { repeatId } = params;
      const updateData = (await request.json()) as Partial<Event>;

      // 동일 repeatId의 모든 이벤트 수정
      mockEvents.forEach((event, index) => {
        if (event.repeat.id === repeatId) {
          mockEvents[index] = { ...event, ...updateData };
        }
      });

      const updatedEvents = mockEvents.filter(e => e.repeat.id === repeatId);
      return HttpResponse.json({ events: updatedEvents });
    })
  );
};

export const setupMockHandlerRecurringDelete = () => {
  const mockEvents: Event[] = [
    // 위와 동일한 반복 일정 3개
    // ... (생략)
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.delete('/api/recurring-events/:repeatId', ({ params }) => {
      const { repeatId } = params;
      
      // 동일 repeatId의 모든 이벤트 삭제
      const indexesToDelete = mockEvents
        .map((e, i) => (e.repeat.id === repeatId ? i : -1))
        .filter(i => i !== -1)
        .reverse(); // 뒤에서부터 삭제

      indexesToDelete.forEach(index => {
        mockEvents.splice(index, 1);
      });

      return new HttpResponse(null, { status: 204 });
    })
  );
};

export const setupMockHandlerSingleUpdate = () => {
  // 반복 일정 → 단일 일정 전환 테스트용
  // repeat.type을 'none'으로 변경, repeat.id 제거
};
```

### 6.2 테스트 데이터

**기본 반복 일정 템플릿**:
```typescript
const baseRecurringEvent: Event = {
  id: '1',
  title: '반복 일정',
  date: '2025-01-01',
  startTime: '10:00',
  endTime: '11:00',
  description: '테스트 반복 일정',
  location: '회의실',
  category: '업무',
  repeat: { 
    type: 'weekly', 
    interval: 1, 
    endDate: '2025-01-31',
    id: 'repeat-123' 
  },
  notificationTime: 10,
};

const baseEventForm: EventForm = {
  title: '새 반복 일정',
  date: '2025-01-01',
  startTime: '10:00',
  endTime: '11:00',
  description: '',
  location: '',
  category: '업무',
  isRepeating: true,
  repeatType: 'weekly',
  repeatInterval: 1,
  repeatEndDate: '2025-01-31',
  notificationTime: 10,
};
```

## 7. 예상 커버리지

- **목표 커버리지**: 90%
- **핵심 기능 커버리지**: 100%
  - `generateInstancesForEvent`: 100% (이미 달성)
  - `saveRecurringEvents`: 100%
  - `updateRecurringSeries`: 100%
  - `deleteRecurringSeries`: 100%
  - 단일 수정/삭제 로직: 100%

## 8. 테스트 작성 순서

TDD Red-Green-Refactor 사이클을 따라 다음 순서로 작성:

### Phase 1: Hook 함수 기본 기능 (T-001 ~ T-004)
1. **T-001**: `saveRecurringEvents` - 반복 인스턴스 일괄 생성
   - Red: 함수 없음 → 테스트 실패
   - Green: 최소 구현 (POST /api/events-list 호출)
   - Refactor: 에러 처리, 중복 제거

2. **T-002**: `updateRecurringSeries` - 반복 시리즈 전체 수정
   - Red: 함수 없음 → 테스트 실패
   - Green: PUT /api/recurring-events/:repeatId 호출
   - Refactor: 중복 제거

3. **T-003**: `deleteRecurringSeries` - 반복 시리즈 전체 삭제
   - Red: 함수 없음 → 테스트 실패
   - Green: DELETE /api/recurring-events/:repeatId 호출
   - Refactor: 중복 제거

4. **T-004**: 단일 수정 시 repeat.type 변환
   - Red: 변환 로직 없음 → 테스트 실패
   - Green: repeat.type을 'none'으로 변경
   - Refactor: 조건 명확화

### Phase 2: 에러 처리 (T-201 ~ T-204)
5. **T-201**: 반복 인스턴스 생성 API 실패
6. **T-202**: 반복 시리즈 수정 404 에러
7. **T-203**: 반복 시리즈 삭제 404 에러
8. **T-204**: repeat.id 없는 반복 일정 처리

### Phase 3: 통합 테스트 (T-101 ~ T-107)
9. **T-102**: 반복 아이콘 표시 (가장 간단)
10. **T-107**: 단일 일정 다이얼로그 미표시
11. **T-101**: 반복 일정 생성 전체 흐름
12. **T-103**: 수정 다이얼로그 - 단일 수정
13. **T-104**: 수정 다이얼로그 - 전체 수정
14. **T-105**: 삭제 다이얼로그 - 단일 삭제
15. **T-106**: 삭제 다이얼로그 - 전체 삭제

### Phase 4: UI 엣지 케이스 (T-205 ~ T-206)
16. **T-205**: 반복 종료일 최대값 제한
17. **T-206**: 반복 일정 겹침 검사 제외

## 9. 다음 단계

### 테스트 작성 에이전트를 위한 인수인계 사항

#### ⚠️ 먼저 작성해야 할 테스트
1. **T-001**: `saveRecurringEvents` (가장 핵심)
2. **T-002**: `updateRecurringSeries`
3. **T-003**: `deleteRecurringSeries`
4. **T-004**: 단일 수정 시 repeat.type 변환

#### 💡 테스트 데이터 준비 방법
- `handlersUtils.ts`에 Mock 핸들러 3개 추가:
  - `setupMockHandlerRecurringCreation`
  - `setupMockHandlerRecurringUpdate`
  - `setupMockHandlerRecurringDelete`
- 반복 일정 인스턴스 3개 이상 포함하는 mockEvents 배열 사용

#### 🔗 참고할 기존 테스트
- **Hook 테스트**: `src/__tests__/hooks/medium.useEventOperations.spec.ts`
  - `renderHook`, `act`, `waitFor` 패턴
  - `setupMockHandlerCreation` 등 Mock 핸들러 사용 패턴
  - notistack mock 패턴

- **통합 테스트**: `src/__tests__/medium.integration.spec.tsx`
  - `render(<App />)`, `user-event` 사용 패턴
  - 다이얼로그 인터랙션 테스트

#### ⚠️ 특별히 주의할 점
1. **repeatId 일관성**: 동일 시리즈의 모든 인스턴스는 동일한 `repeat.id`를 가져야 함
2. **단일 vs 전체 수정/삭제**: 
   - 단일: `PUT/DELETE /api/events/:id` 사용
   - 전체: `PUT/DELETE /api/recurring-events/:repeatId` 사용
3. **repeat.type 변환**: 단일 수정 시 `repeat.type: 'none'`, `repeat.id: undefined`
4. **기존 테스트 영향 없음**: `recurrenceUtils.spec.ts`는 수정하지 않음 (이미 완전함)
5. **네이밍 규칙 준수**: describe는 영어, it은 한글

#### 📁 수정/생성할 파일
1. **수정**: `src/__mocks__/handlersUtils.ts` - Mock 핸들러 3개 추가
2. **수정**: `src/__tests__/hooks/medium.useEventOperations.spec.ts` - 테스트 추가
3. **수정**: `src/__tests__/medium.integration.spec.tsx` - 통합 테스트 추가
4. **확인만**: `src/__tests__/unit/easy.recurrenceUtils.spec.ts` - 수정 불필요

---

## 자체 검토 체크리스트

- [x] 모든 요구사항에 대한 테스트가 설계되었는가?
- [x] 각 테스트의 목적이 명확한가?
- [x] 엣지 케이스가 충분히 커버되는가?
- [x] 테스트 우선순위가 적절한가?
- [x] AAA 패턴이 적용되었는가?
- [x] Kent Beck TDD 원칙이 반영되었는가?
- [x] 테스트 네이밍 규칙을 준수하는가? (describe: 영어, it: 한글)
- [x] 기존 테스트 패턴을 재사용하는가?
- [x] Mock 전략이 명확한가?
- [x] 테스트 작성 순서가 TDD에 적합한가?

