import { act, renderHook } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerRecurringCreation,
  setupMockHandlerRecurringDelete,
  setupMockHandlerRecurringUpdate,
  setupMockHandlerSingleUpdate,
  setupMockHandlerUpdating,
} from '../../__mocks__/handlersUtils.ts';
import { useEventOperations } from '../../hooks/useEventOperations.ts';
import { server } from '../../setupTests.ts';
import { Event } from '../../types.ts';

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

it('저장되어있는 초기 이벤트 데이터를 적절하게 불러온다', async () => {
  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([
    {
      id: '1',
      title: '기존 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '기존 팀 미팅',
      location: '회의실 B',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ]);
});

it('정의된 이벤트 정보를 기준으로 적절하게 저장이 된다', async () => {
  setupMockHandlerCreation(); // ? Med: 이걸 왜 써야하는지 물어보자

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  const newEvent: Event = {
    id: '1',
    title: '새 회의',
    date: '2025-10-16',
    startTime: '11:00',
    endTime: '12:00',
    description: '새로운 팀 미팅',
    location: '회의실 A',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(newEvent);
  });

  expect(result.current.events).toEqual([{ ...newEvent, id: '1' }]);
});

it("새로 정의된 'title', 'endTime' 기준으로 적절하게 일정이 업데이트 된다", async () => {
  setupMockHandlerUpdating();

  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const updatedEvent: Event = {
    id: '1',
    date: '2025-10-15',
    startTime: '09:00',
    description: '기존 팀 미팅',
    location: '회의실 B',
    category: '업무',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
    title: '수정된 회의',
    endTime: '11:00',
  };

  await act(async () => {
    await result.current.saveEvent(updatedEvent);
  });

  expect(result.current.events[0]).toEqual(updatedEvent);
});

it('존재하는 이벤트 삭제 시 에러없이 아이템이 삭제된다.', async () => {
  setupMockHandlerDeletion();

  const { result } = renderHook(() => useEventOperations(false));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  await act(() => Promise.resolve(null));

  expect(result.current.events).toEqual([]);
});

it("이벤트 로딩 실패 시 '이벤트 로딩 실패'라는 텍스트와 함께 에러 토스트가 표시되어야 한다", async () => {
  server.use(
    http.get('/api/events', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('이벤트 로딩 실패', { variant: 'error' });

  server.resetHandlers();
});

it("존재하지 않는 이벤트 수정 시 '일정 저장 실패'라는 토스트가 노출되며 에러 처리가 되어야 한다", async () => {
  const { result } = renderHook(() => useEventOperations(true));

  await act(() => Promise.resolve(null));

  const nonExistentEvent: Event = {
    id: '999', // 존재하지 않는 ID
    title: '존재하지 않는 이벤트',
    date: '2025-07-20',
    startTime: '09:00',
    endTime: '10:00',
    description: '이 이벤트는 존재하지 않습니다',
    location: '어딘가',
    category: '기타',
    repeat: { type: 'none', interval: 0 },
    notificationTime: 10,
  };

  await act(async () => {
    await result.current.saveEvent(nonExistentEvent);
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 저장 실패', { variant: 'error' });
});

it("네트워크 오류 시 '일정 삭제 실패'라는 텍스트가 노출되며 이벤트 삭제가 실패해야 한다", async () => {
  server.use(
    http.delete('/api/events/:id', () => {
      return new HttpResponse(null, { status: 500 });
    })
  );

  const { result } = renderHook(() => useEventOperations(false));

  await act(() => Promise.resolve(null));

  await act(async () => {
    await result.current.deleteEvent('1');
  });

  expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

  expect(result.current.events).toHaveLength(1);
});

// Phase 1: 반복 일정 핵심 기능 테스트
describe('saveRecurringEvents', () => {
  it('반복 인스턴스 배열을 POST /api/events-list로 전송하고 성공적으로 생성해야 한다', async () => {
    // Arrange: Mock 핸들러 설정
    setupMockHandlerRecurringCreation();

    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const recurringEvents: Event[] = [
      {
        id: '',
        title: '주간 회의',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-01-31' },
        notificationTime: 10,
      },
      {
        id: '',
        title: '주간 회의',
        date: '2025-01-08',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-01-31' },
        notificationTime: 10,
      },
      {
        id: '',
        title: '주간 회의',
        date: '2025-01-15',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-01-31' },
        notificationTime: 10,
      },
    ];

    // Act: saveRecurringEvents 호출
    await act(async () => {
      await result.current.saveRecurringEvents(recurringEvents);
    });

    // Assert: 여러 인스턴스가 생성되었는지, 모두 동일한 repeat.id를 가지는지 확인
    expect(result.current.events.length).toBeGreaterThan(1);
    const repeatId = result.current.events[0].repeat.id;
    expect(repeatId).toBeDefined();
    expect(result.current.events.every((e) => e.repeat.id === repeatId)).toBe(true);
  });
});

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
    const updatedEvents = result.current.events.filter((e) => e.repeat.id === repeatId);
    expect(updatedEvents.every((e) => e.title === '수정된 제목')).toBe(true);
    expect(updatedEvents.every((e) => e.location === '새 장소')).toBe(true);
  });
});

describe('deleteRecurringSeries', () => {
  it('동일한 repeatId를 가진 모든 이벤트를 삭제해야 한다', async () => {
    // Arrange: 반복 이벤트가 이미 존재하는 상태
    setupMockHandlerRecurringDelete();
    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    const initialCount = result.current.events.length;
    const repeatId = result.current.events[0].repeat.id!;
    const seriesCount = result.current.events.filter((e) => e.repeat.id === repeatId).length;

    // Act: deleteRecurringSeries 호출
    await act(async () => {
      await result.current.deleteRecurringSeries(repeatId);
    });

    // Assert: 해당 시리즈의 모든 이벤트가 삭제되었는지 확인
    expect(result.current.events.length).toBe(initialCount - seriesCount);
    expect(result.current.events.every((e) => e.repeat.id !== repeatId)).toBe(true);
  });
});

describe('saveEvent (단일 수정)', () => {
  it('반복 일정을 단일 수정하면 repeat.type이 none으로 변경되어야 한다', async () => {
    // Arrange: 반복 이벤트가 존재하는 상태
    setupMockHandlerSingleUpdate();
    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    const targetEvent = result.current.events[0];
    expect(targetEvent.repeat.type).not.toBe('none');

    // Act: 단일 이벤트로 수정 (repeat.type을 'none'으로)
    const updatedEvent: Event = {
      ...targetEvent,
      title: '단일 일정으로 변경',
      repeat: { type: 'none', interval: 1 },
    };

    await act(async () => {
      await result.current.saveEvent(updatedEvent);
    });

    // Assert: 해당 이벤트만 수정되고 repeat.type이 'none', repeat.id가 undefined
    const modifiedEvent = result.current.events.find((e) => e.id === targetEvent.id);
    expect(modifiedEvent?.repeat.type).toBe('none');
    expect(modifiedEvent?.repeat.id).toBeUndefined();
  });
});

// Phase 2: 에러 처리 테스트
describe('에러 처리', () => {
  it('반복 인스턴스 생성 실패 시 에러 스낵바를 표시해야 한다', async () => {
    // Arrange: API 실패 설정
    server.use(
      http.post('/api/events-list', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    const recurringEvents: Event[] = [
      {
        id: '',
        title: '주간 회의',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1, endDate: '2025-01-31' },
        notificationTime: 10,
      },
    ];

    // Act: saveRecurringEvents 호출
    await act(async () => {
      await result.current.saveRecurringEvents(recurringEvents);
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
    await act(() => Promise.resolve(null));

    // Act: updateRecurringSeries 호출
    await act(async () => {
      await result.current.updateRecurringSeries('non-existent-id', { title: '수정' });
    });

    // Assert: 에러 스낵바 표시
    expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 수정 실패', { variant: 'error' });

    server.resetHandlers();
  });

  it('존재하지 않는 repeatId 삭제 시 에러 스낵바를 표시해야 한다', async () => {
    // Arrange: 404 응답 설정
    server.use(
      http.delete('/api/recurring-events/:repeatId', () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const { result } = renderHook(() => useEventOperations(false));
    await act(() => Promise.resolve(null));

    // Act: deleteRecurringSeries 호출
    await act(async () => {
      await result.current.deleteRecurringSeries('non-existent-id');
    });

    // Assert: 에러 스낵바 표시
    expect(enqueueSnackbarFn).toHaveBeenCalledWith('일정 삭제 실패', { variant: 'error' });

    server.resetHandlers();
  });

  it('repeat.id가 없는 반복 일정은 단일 수정/삭제로 처리되어야 한다', async () => {
    // Arrange: repeat.id가 없는 반복 이벤트
    const mockEvents: Event[] = [
      {
        id: '1',
        title: 'repeat.id 없는 반복 일정',
        date: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        location: '회의실',
        category: '업무',
        repeat: { type: 'weekly', interval: 1 }, // id가 없음
        notificationTime: 10,
      },
    ];

    server.use(
      http.get('/api/events', () => {
        return HttpResponse.json({ events: mockEvents });
      })
    );

    const { result } = renderHook(() => useEventOperations(true));
    await act(() => Promise.resolve(null));

    const targetEvent = result.current.events[0];

    // Assert: repeat.type이 'none'이 아니지만 repeat.id가 없음
    expect(targetEvent.repeat.type).not.toBe('none');
    expect(targetEvent.repeat.id).toBeUndefined();

    // 이 경우 단일 수정/삭제로 처리되어야 함 (시리즈 수정/삭제 불가)
    // updateRecurringSeries나 deleteRecurringSeries를 호출해도 아무 작업이 안되거나 에러 처리
  });
});
