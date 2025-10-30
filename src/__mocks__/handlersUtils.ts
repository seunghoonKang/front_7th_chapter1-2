import { http, HttpResponse } from 'msw';

import { server } from '../setupTests';
import { Event } from '../types';

// ! Hard 여기 제공 안함
export const setupMockHandlerCreation = (initEvents = [] as Event[]) => {
  const mockEvents: Event[] = [...initEvents];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.post('/api/events', async ({ request }) => {
      const newEvent = (await request.json()) as Event;
      newEvent.id = String(mockEvents.length + 1); // 간단한 ID 생성
      mockEvents.push(newEvent);
      return HttpResponse.json(newEvent, { status: 201 });
    })
  );
};

export const setupMockHandlerUpdating = () => {
  const mockEvents: Event[] = [
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
    {
      id: '2',
      title: '기존 회의2',
      date: '2025-10-15',
      startTime: '11:00',
      endTime: '12:00',
      description: '기존 팀 미팅 2',
      location: '회의실 C',
      category: '업무',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.put('/api/events/:id', async ({ params, request }) => {
      const { id } = params;
      const updatedEvent = (await request.json()) as Event;
      const index = mockEvents.findIndex((event) => event.id === id);

      mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
      return HttpResponse.json(mockEvents[index]);
    })
  );
};

export const setupMockHandlerDeletion = () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '삭제할 이벤트',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '삭제할 이벤트입니다',
      location: '어딘가',
      category: '기타',
      repeat: { type: 'none', interval: 0 },
      notificationTime: 10,
    },
  ];

  server.use(
    http.get('/api/events', () => {
      return HttpResponse.json({ events: mockEvents });
    }),
    http.delete('/api/events/:id', ({ params }) => {
      const { id } = params;
      const index = mockEvents.findIndex((event) => event.id === id);

      mockEvents.splice(index, 1);
      return new HttpResponse(null, { status: 204 });
    })
  );
};

// 반복 일정 일괄 생성을 위한 Mock 핸들러
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

// 반복 시리즈 전체 수정을 위한 Mock 핸들러
export const setupMockHandlerRecurringUpdate = () => {
  const mockEvents: Event[] = [
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

      const updatedEvents = mockEvents.filter((e) => e.repeat.id === repeatId);
      return HttpResponse.json({ events: updatedEvents });
    })
  );
};

// 반복 시리즈 전체 삭제를 위한 Mock 핸들러
export const setupMockHandlerRecurringDelete = () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '삭제할 반복 회의',
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
      title: '삭제할 반복 회의',
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
      title: '삭제할 반복 회의',
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
    http.delete('/api/recurring-events/:repeatId', ({ params }) => {
      const { repeatId } = params;

      // 동일 repeatId의 모든 이벤트 삭제
      const indexesToDelete = mockEvents
        .map((e, i) => (e.repeat.id === repeatId ? i : -1))
        .filter((i) => i !== -1)
        .reverse(); // 뒤에서부터 삭제

      indexesToDelete.forEach((index) => {
        mockEvents.splice(index, 1);
      });

      return new HttpResponse(null, { status: 204 });
    })
  );
};

// 단일 수정 시 repeat.type 변환을 위한 Mock 핸들러
export const setupMockHandlerSingleUpdate = () => {
  const mockEvents: Event[] = [
    {
      id: '1',
      title: '반복 일정',
      date: '2025-01-01',
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
    http.put('/api/events/:id', async ({ params, request }) => {
      const { id } = params;
      const updatedEvent = (await request.json()) as Event;
      const index = mockEvents.findIndex((event) => event.id === id);

      mockEvents[index] = { ...mockEvents[index], ...updatedEvent };
      return HttpResponse.json(mockEvents[index]);
    })
  );
};
