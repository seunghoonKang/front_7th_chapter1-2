import { Event } from '../../types';
import { generateInstancesForEvent } from '../../utils/recurrenceUtils';

describe('generateInstancesForEvent', () => {
  const baseEvent: Event = {
    id: '1',
    title: '반복 일정',
    date: '2025-01-01',
    startTime: '10:00',
    endTime: '11:00',
    description: '테스트 일정',
    location: '회의실',
    category: '업무',
    repeat: { type: 'none', interval: 1 },
    notificationTime: 10,
  };

  describe('매일 반복', () => {
    it('should generate daily instances for 7 days', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        repeat: { type: 'daily', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-01-07');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(7);
      expect(instances[0].date).toBe('2025-01-01');
      expect(instances[6].date).toBe('2025-01-07');
    });

    it('should generate daily instances with interval 2 (every 2 days)', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        repeat: { type: 'daily', interval: 2 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-01-10');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(5);
      expect(instances[0].date).toBe('2025-01-01');
      expect(instances[1].date).toBe('2025-01-03');
      expect(instances[2].date).toBe('2025-01-05');
      expect(instances[3].date).toBe('2025-01-07');
      expect(instances[4].date).toBe('2025-01-09');
    });

    it('should respect endDate when generating daily instances', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        repeat: { type: 'daily', interval: 1, endDate: '2025-01-03' },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-01-10');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(3);
      expect(instances[0].date).toBe('2025-01-01');
      expect(instances[2].date).toBe('2025-01-03');
    });
  });

  describe('매주 반복', () => {
    it('should generate weekly instances for 3 weeks', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        repeat: { type: 'weekly', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-01-21');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(3);
      expect(instances[0].date).toBe('2025-01-01');
      expect(instances[1].date).toBe('2025-01-08');
      expect(instances[2].date).toBe('2025-01-15');
    });

    it('should generate weekly instances with interval 2 (every 2 weeks)', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        repeat: { type: 'weekly', interval: 2 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-01-29');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(3);
      expect(instances[0].date).toBe('2025-01-01');
      expect(instances[1].date).toBe('2025-01-15');
      expect(instances[2].date).toBe('2025-01-29');
    });
  });

  describe('매월 반복', () => {
    it('should generate monthly instances for 3 months', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        date: '2025-01-15',
        repeat: { type: 'monthly', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-03-31');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(3);
      expect(instances[0].date).toBe('2025-01-15');
      expect(instances[1].date).toBe('2025-02-15');
      expect(instances[2].date).toBe('2025-03-15');
    });

    it('should skip months without 31st day when recurring on 31st', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        date: '2025-01-31',
        repeat: { type: 'monthly', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-04-30');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      // 2월은 31일이 없으므로 건너뛰고, 1월과 3월만 생성
      expect(instances).toHaveLength(2);
      expect(instances[0].date).toBe('2025-01-31');
      expect(instances[1].date).toBe('2025-03-31');
    });
  });

  describe('매년 반복', () => {
    it('should generate yearly instances for 3 years', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        date: '2025-03-15',
        repeat: { type: 'yearly', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2027-12-31');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(3);
      expect(instances[0].date).toBe('2025-03-15');
      expect(instances[1].date).toBe('2026-03-15');
      expect(instances[2].date).toBe('2027-03-15');
    });

    it('should skip non-leap years when recurring on Feb 29', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        date: '2024-02-29',
        repeat: { type: 'yearly', interval: 1 },
      };
      const rangeStart = new Date('2024-01-01');
      const rangeEnd = new Date('2028-12-31');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      // 2024와 2028만 윤년 (2025, 2026, 2027은 윤년 아님)
      expect(instances).toHaveLength(2);
      expect(instances[0].date).toBe('2024-02-29');
      expect(instances[1].date).toBe('2028-02-29');
    });
  });

  describe('반복 없음', () => {
    it('should return single instance when repeat type is none', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        repeat: { type: 'none', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-12-31');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(1);
      expect(instances[0].date).toBe('2025-01-01');
    });
  });

  describe('범위 외 처리', () => {
    it('should not generate instances before rangeStart', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        date: '2025-01-01',
        repeat: { type: 'daily', interval: 1 },
      };
      const rangeStart = new Date('2025-01-05');
      const rangeEnd = new Date('2025-01-10');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(6);
      expect(instances[0].date).toBe('2025-01-05');
    });

    it('should not generate instances after rangeEnd', () => {
      // Arrange
      const event: Event = {
        ...baseEvent,
        date: '2025-01-01',
        repeat: { type: 'daily', interval: 1 },
      };
      const rangeStart = new Date('2025-01-01');
      const rangeEnd = new Date('2025-01-05');

      // Act
      const instances = generateInstancesForEvent(event, rangeStart, rangeEnd);

      // Assert
      expect(instances).toHaveLength(5);
      expect(instances[4].date).toBe('2025-01-05');
    });
  });
});
