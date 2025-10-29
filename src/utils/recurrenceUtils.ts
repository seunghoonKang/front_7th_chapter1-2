import { Event } from '../types';

/**
 * 반복 일정의 모든 인스턴스를 생성합니다.
 * @param event 원본 반복 일정
 * @param rangeStart 표시 범위 시작일
 * @param rangeEnd 표시 범위 종료일 (최대 2025-12-31)
 */
export function generateInstancesForEvent(event: Event, rangeStart: Date, rangeEnd: Date): Event[] {
  // 반복이 없으면 단일 인스턴스만 반환
  if (event.repeat.type === 'none') {
    const eventDate = new Date(event.date);
    if (eventDate >= rangeStart && eventDate <= rangeEnd) {
      return [event];
    }
    return [];
  }

  const instances: Event[] = [];
  const startDate = new Date(event.date);
  const endLimit = event.repeat.endDate ? new Date(event.repeat.endDate) : rangeEnd;
  const effectiveEnd = endLimit < rangeEnd ? endLimit : rangeEnd;

  let currentDate = new Date(startDate);
  let iterationCount = 0;
  let instanceId = 0;

  while (currentDate <= effectiveEnd && iterationCount < 1000) {
    // 범위 내의 유효한 날짜인지 확인
    if (currentDate >= rangeStart && currentDate <= effectiveEnd) {
      const dateString = formatDate(currentDate);

      // 인스턴스 생성
      instances.push({
        ...event,
        id: `${event.id}-${instanceId}`,
        date: dateString,
      });
      instanceId++;
    }

    // 다음 반복 날짜 계산
    iterationCount++;
    const nextDate = getNextOccurrence(
      startDate,
      event.repeat.type,
      event.repeat.interval,
      iterationCount
    );

    // 날짜가 변경되지 않으면 (건너뛰기 실패) 무한 루프 방지
    if (nextDate.getTime() === currentDate.getTime()) {
      break;
    }

    currentDate = nextDate;
  }

  return instances;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷합니다.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 다음 반복 날짜를 계산합니다.
 * 유효하지 않은 날짜(31일이 없는 달, 윤년이 아닌 해의 2/29)는 건너뜁니다.
 */
function getNextOccurrence(
  startDate: Date,
  repeatType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'none',
  interval: number,
  count: number
): Date {
  const originalDay = startDate.getDate();
  const originalMonth = startDate.getMonth();

  switch (repeatType) {
    case 'daily': {
      const result = new Date(startDate);
      result.setDate(startDate.getDate() + interval * count);
      return result;
    }

    case 'weekly': {
      const result = new Date(startDate);
      result.setDate(startDate.getDate() + interval * count * 7);
      return result;
    }

    case 'monthly': {
      let attempts = 0;
      let monthsToAdd = interval * count;

      while (attempts < 24) {
        // 최대 2년치 시도
        const targetYear =
          startDate.getFullYear() + Math.floor((startDate.getMonth() + monthsToAdd) / 12);
        const targetMonth = (startDate.getMonth() + monthsToAdd) % 12;
        const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

        // 원래 날짜가 해당 달에 존재하는지 확인
        if (originalDay <= lastDayOfTargetMonth) {
          const result = new Date(targetYear, targetMonth, originalDay);
          result.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
          return result;
        }

        // 이 달은 건너뛰고 다음 달로
        monthsToAdd += interval;
        attempts++;
      }

      // 안전 장치: 찾지 못하면 먼 미래 날짜 반환
      return new Date(9999, 11, 31);
    }

    case 'yearly': {
      let yearsToAdd = interval * count;
      let attempts = 0;

      while (attempts < 10) {
        // 최대 10년치 시도
        const targetYear = startDate.getFullYear() + yearsToAdd;

        // 윤년 2월 29일 처리
        if (originalMonth === 1 && originalDay === 29) {
          if (isLeapYear(targetYear)) {
            const result = new Date(targetYear, originalMonth, originalDay);
            result.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
            return result;
          }
          // 윤년이 아니면 다음 해로
          yearsToAdd += interval;
          attempts++;
        } else {
          const result = new Date(targetYear, originalMonth, originalDay);
          result.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
          return result;
        }
      }

      // 안전 장치: 찾지 못하면 먼 미래 날짜 반환
      return new Date(9999, 11, 31);
    }

    default:
      return new Date(startDate);
  }
}

/**
 * 윤년 확인
 */
function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
