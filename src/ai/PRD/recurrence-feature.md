# 📘 PRD: 반복 일정(Recurrence) 기능

## 1. 목적

달력 애플리케이션에서 일정을 반복 생성/표시/수정/삭제하는 기능을 **Kent Beck의 TDD 방법론**으로 구현한다.  
이 PRD는 **Context-Engineered Development** 방식으로 작성되어, TDD-Engineer가 테스트를 먼저 작성할 수 있도록 모든 컨텍스트를 제공한다.

## 2. 기능 범위

### 2.1 반복 일정 생성

- 반복 유형: 매일(daily) / 매주(weekly) / 매월(monthly) / 매년(yearly)
- 반복 간격: 설정 가능 (기본값: 1)
- 반복 종료일: 설정 가능 (최대 2025-12-31)
- 반복 일정은 일정 겹침 검사에서 제외됨

### 2.2 반복 일정 표시

- 캘린더 뷰(월/주)에서 반복 일정을 아이콘으로 구분 표시
- 반복 일정의 모든 인스턴스를 해당 범위에서 표시

### 2.3 반복 일정 수정

- **단일 수정**: 해당 인스턴스만 수정 (반복에서 분리되어 일반 일정으로 변경)
- **전체 수정**: 반복 일정의 모든 인스턴스 수정 (반복 속성 유지)

### 2.4 반복 일정 삭제

- **단일 삭제**: 해당 인스턴스만 삭제
- **전체 삭제**: 반복 일정의 모든 인스턴스 삭제

## 3. 도메인 모델

### 3.1 타입 정의

```typescript
type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

interface RepeatInfo {
  type: RepeatType;
  interval: number; // 반복 간격 (예: 2 = 2일/주/월/년마다)
  endDate?: string; // YYYY-MM-DD 형식, 최대 2025-12-31
}

interface Event {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD 형식
  startTime: string; // HH:mm 형식
  endTime: string; // HH:mm 형식
  description: string;
  location: string;
  category: string;
  repeat: RepeatInfo;
  notificationTime: number;
}
```

### 3.2 확장 타입 (인스턴스 표시용)

```typescript
interface ExpandedEvent extends Event {
  isRecurringInstance?: boolean; // 반복 일정 인스턴스인지 여부
  originalEventId?: string; // 원본 반복 일정의 ID
}
```

## 4. 핵심 함수 명세

### 4.1 `generateInstancesForEvent`

**목적**: 반복 일정의 모든 인스턴스를 생성한다.

**시그니처**:

```typescript
function generateInstancesForEvent(event: Event, rangeStart: Date, rangeEnd: Date): Event[];
```

**동작**:

- `event.repeat.type`에 따라 인스턴스 생성
- `rangeStart`부터 `rangeEnd`까지 (또는 `event.repeat.endDate`까지) 범위 내의 인스턴스 생성
- 각 인스턴스는 고유한 `id`와 `date`를 가짐
- 원본 `event`의 다른 속성은 모두 유지

**엣지 케이스**:

- `monthly` + 31일: 31일이 없는 달은 건너뛰기
- `yearly` + 2월 29일: 윤년이 아닌 해는 건너뛰기
- `endDate`가 `rangeEnd`보다 작으면 `endDate`까지만 생성

### 4.2 `editInstance`

**목적**: 반복 일정의 단일 인스턴스를 수정한다. (반복에서 분리)

**시그니처**:

```typescript
function editInstance(originalEvent: Event, instanceDate: string, updates: Partial<Event>): Event;
```

**동작**:

- 반복 일정에서 분리된 독립적인 일정 생성
- `repeat.type`을 `'none'`으로 변경
- `updates`로 전달된 속성만 업데이트

### 4.3 `editAll`

**목적**: 반복 일정의 모든 인스턴스를 수정한다.

**시그니처**:

```typescript
function editAll(recurringEvents: Event[], updates: Partial<Event>): Event[];
```

**동작**:

- `recurringEvents`는 같은 `originalEventId`를 가진 모든 인스턴스
- 모든 인스턴스에 `updates` 적용
- 반복 속성(`repeat`)은 유지

### 4.4 `deleteInstance`

**목적**: 반복 일정의 단일 인스턴스를 삭제한다.

**시그니처**:

```typescript
function deleteInstance(recurringEvents: Event[], instanceDate: string): Event[];
```

**동작**:

- `instanceDate`와 일치하는 인스턴스만 제거
- 나머지 인스턴스는 유지

### 4.5 `deleteAll`

**목적**: 반복 일정의 모든 인스턴스를 삭제한다.

**시그니처**:

```typescript
function deleteAll(recurringEvents: Event[], recurringId: string): Event[];
```

**동작**:

- `recurringId`와 일치하는 모든 인스턴스 제거

### 4.6 `expandRecurringEvents`

**목적**: 반복 일정을 해당 범위의 인스턴스로 확장한다.

**시그니처**:

```typescript
function expandRecurringEvents(events: Event[], rangeStart: Date, rangeEnd: Date): ExpandedEvent[];
```

**동작**:

- `events`에서 `repeat.type !== 'none'`인 일정 찾기
- 각 반복 일정을 `generateInstancesForEvent`로 확장
- 일반 일정(`repeat.type === 'none'`)은 그대로 유지
- 반환된 배열에 `isRecurringInstance` 플래그 추가

## 5. 테스트 시나리오 (TDD Blueprint)

### 5.1 Easy: 기본 반복 생성

**시나리오 1: 매일 반복**

```
Given: 일정이 2025-01-01부터 매일 반복
When: generateInstancesForEvent 호출 (rangeStart: 2025-01-01, rangeEnd: 2025-01-07)
Then: 7개의 인스턴스 생성 (2025-01-01 ~ 2025-01-07)
```

**시나리오 2: 매주 반복**

```
Given: 일정이 2025-01-01부터 매주 반복
When: generateInstancesForEvent 호출 (rangeStart: 2025-01-01, rangeEnd: 2025-01-21)
Then: 3개의 인스턴스 생성 (2025-01-01, 2025-01-08, 2025-01-15)
```

**시나리오 3: 종료일 제한**

```
Given: 일정이 2025-01-01부터 매일 반복, 종료일: 2025-01-03
When: generateInstancesForEvent 호출 (rangeStart: 2025-01-01, rangeEnd: 2025-01-07)
Then: 3개의 인스턴스만 생성 (2025-01-01 ~ 2025-01-03)
```

### 5.2 Medium: 엣지 케이스

**시나리오 4: 매월 반복 - 31일 처리**

```
Given: 일정이 2025-01-31부터 매월 반복
When: generateInstancesForEvent 호출 (rangeStart: 2025-01-01, rangeEnd: 2025-04-30)
Then: 31일이 있는 달만 생성 (2025-01-31, 2025-03-31)
Note: 2월은 31일이 없으므로 건너뛰기
```

**시나리오 5: 매년 반복 - 윤년 처리**

```
Given: 일정이 2024-02-29부터 매년 반복
When: generateInstancesForEvent 호출 (rangeStart: 2024-01-01, rangeEnd: 2028-12-31)
Then: 윤년의 2월 29일만 생성 (2024-02-29, 2028-02-29)
Note: 2025, 2026, 2027은 건너뛰기
```

**시나리오 6: 반복 간격 2**

```
Given: 일정이 2025-01-01부터 2주마다 반복
When: generateInstancesForEvent 호출 (rangeStart: 2025-01-01, rangeEnd: 2025-01-28)
Then: 2주 간격으로 생성 (2025-01-01, 2025-01-15, 2025-01-29)
```

### 5.3 Medium: 수정/삭제

**시나리오 7: 단일 수정**

```
Given: 반복 일정의 인스턴스 (2025-01-15)
When: editInstance 호출하여 제목 수정
Then: 새로운 독립 일정 생성 (repeat.type: 'none')
And: 원본 반복 일정은 유지됨
```

**시나리오 8: 전체 수정**

```
Given: 반복 일정의 모든 인스턴스들
When: editAll 호출하여 제목 수정
Then: 모든 인스턴스의 제목이 수정됨
And: 반복 속성은 유지됨
```

**시나리오 9: 단일 삭제**

```
Given: 반복 일정의 인스턴스들 (2025-01-01, 2025-01-08, 2025-01-15)
When: deleteInstance 호출 (instanceDate: '2025-01-08')
Then: 해당 인스턴스만 제거됨
And: 나머지 인스턴스는 유지됨
```

**시나리오 10: 전체 삭제**

```
Given: 반복 일정의 모든 인스턴스들
When: deleteAll 호출
Then: 모든 인스턴스가 제거됨
```

### 5.4 Easy: 이벤트 확장

**시나리오 11: 반복 일정 확장**

```
Given: 이벤트 배열 (일반 일정 1개, 반복 일정 1개)
When: expandRecurringEvents 호출
Then: 반복 일정은 인스턴스로 확장됨
And: 일반 일정은 그대로 유지됨
And: 각 인스턴스에 isRecurringInstance: true 플래그
```

## 6. UI 요구사항

### 6.1 반복 일정 폼

- 반복 체크박스 활성화
- 반복 유형 선택 드롭다운 (매일/매주/매월/매년)
- 반복 간격 입력 필드
- 반복 종료일 입력 필드 (최대 2025-12-31)

### 6.2 반복 아이콘 표시

- Material-UI의 `Repeat` 또는 `Loop` 아이콘 사용
- 캘린더 뷰(월/주)의 일정 항목 옆에 표시
- 일정 목록에서도 표시

### 6.3 수정/삭제 다이얼로그

- **수정 다이얼로그**: "해당 일정만 수정하시겠어요?"
  - "예": 단일 수정
  - "아니오": 전체 수정
  - "취소": 취소
- **삭제 다이얼로그**: "해당 일정만 삭제하시겠어요?"
  - "예": 단일 삭제
  - "아니오": 전체 삭제
  - "취소": 취소

## 7. 제약사항

- 반복 종료일 최대값: **2025-12-31**
- 반복 일정은 **일정 겹침 검사에서 제외**됨
- 반복 간격 최소값: **1** (음수 불가)
- 매월 31일 반복 시, 31일이 없는 달은 **건너뛰기** (오류 아님)
- 매년 2월 29일 반복 시, 윤년이 아닌 해는 **건너뛰기** (오류 아님)

## 8. 성공 기준

- [ ] 모든 테스트 케이스 통과
- [ ] 테스트 커버리지 80% 이상
- [ ] 반복 일정 생성 동작 확인
- [ ] 반복 일정 표시 (아이콘) 확인
- [ ] 단일/전체 수정 동작 확인
- [ ] 단일/전체 삭제 동작 확인
- [ ] 엣지 케이스 처리 확인
- [ ] UI/UX 개선 완료

## 9. 참고 사항

- 기존 코드베이스의 테스트 패턴 참고: `src/__tests__/unit/easy.eventUtils.spec.ts`
- TDD 원칙 참고: `src/ai/docs/kent-beck-tdd.md`
- TDD-Engineer 가이드: `src/ai/agents/TDD-Engineer.md`
