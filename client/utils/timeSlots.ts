// Shared time slots configuration for the entire application
// This ensures consistency between client and server

export interface TimeSlot {
  hour: number;
  time: string;
  startMinutes?: number;
  endMinutes?: number;
  duration?: string;
}

// College time slots (12 working hours)
export const TIME_SLOTS: TimeSlot[] = [
  { hour: 1, time: '7:10 - 8:00', startMinutes: 7 * 60 + 10, endMinutes: 8 * 60 + 0, duration: '50 mins' },
  { hour: 2, time: '8:00 - 8:50', startMinutes: 8 * 60 + 0, endMinutes: 8 * 60 + 50, duration: '50 mins' },
  { hour: 3, time: '9:20 - 10:10', startMinutes: 9 * 60 + 20, endMinutes: 10 * 60 + 10, duration: '50 mins' },
  { hour: 4, time: '10:10 - 11:00', startMinutes: 10 * 60 + 10, endMinutes: 11 * 60 + 0, duration: '50 mins' },
  { hour: 5, time: '11:10 - 12:00', startMinutes: 11 * 60 + 10, endMinutes: 12 * 60 + 0, duration: '50 mins' },
  { hour: 6, time: '12:00 - 12:50', startMinutes: 12 * 60 + 0, endMinutes: 12 * 60 + 50, duration: '50 mins' },
  { hour: 7, time: '12:55 - 1:45', startMinutes: 12 * 60 + 55, endMinutes: 13 * 60 + 45, duration: '50 mins' },
  { hour: 8, time: '1:50 - 2:40', startMinutes: 13 * 60 + 50, endMinutes: 14 * 60 + 40, duration: '50 mins' },
  { hour: 9, time: '2:40 - 3:30', startMinutes: 14 * 60 + 40, endMinutes: 15 * 60 + 30, duration: '50 mins' },
  { hour: 10, time: '3:50 - 4:40', startMinutes: 15 * 60 + 50, endMinutes: 16 * 60 + 40, duration: '50 mins' },
  { hour: 11, time: '4:40 - 5:30', startMinutes: 16 * 60 + 40, endMinutes: 17 * 60 + 30, duration: '50 mins' },
  { hour: 12, time: '5:30 - 6:20', startMinutes: 17 * 60 + 30, endMinutes: 18 * 60 + 20, duration: '50 mins' },
];

// Days of the week
export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Session types
export const SESSION_TYPES = ['Lecture', 'Tutorial', 'Practical', 'Skill'] as const;

// Utility functions
export const getTimeSlotByHour = (hour: number): TimeSlot | undefined => {
  return TIME_SLOTS.find(slot => slot.hour === hour);
};

export const getTimeRange = (hours: number[]): string => {
  if (hours.length === 0) return '';
  const sorted = [...hours].sort((a, b) => a - b);
  const startSlot = getTimeSlotByHour(sorted[0]);
  const endSlot = getTimeSlotByHour(sorted[sorted.length - 1]);
  if (startSlot && endSlot) {
    return `${startSlot.time.split(' - ')[0]} - ${endSlot.time.split(' - ')[1]}`;
  }
  return '';
};

export const getSessionDuration = (hours: number[]): string => {
  if (hours.length === 1) return '1 hour';
  if (hours.length === 2) return '2 hours';
  return `${hours.length} hours`;
};

export const validateConsecutiveHours = (hours: number[]): boolean => {
  if (hours.length <= 1) return true;
  const sorted = [...hours].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== 1) {
      return false;
    }
  }
  return true;
};

// Get current session based on time
export const getCurrentSession = (timetable: any[], currentTime?: Date) => {
  const now = currentTime || new Date();
  const currentDay = DAYS[now.getDay()];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Find today's schedule
  const todaySchedule = timetable && Array.isArray(timetable) && timetable.length > 0 
    ? timetable.find(day => day && day.day === currentDay) 
    : null;
  if (!todaySchedule || !todaySchedule.sessions || todaySchedule.sessions.length === 0) return null;

  // Current time in minutes since midnight (24h)
  const currentTimeInMinutes = currentHour * 60 + currentMinute;

  // Find current session
  for (const session of todaySchedule.sessions) {
    const timeSlots = session.hours.map((hour: number) => getTimeSlotByHour(hour)).filter(Boolean);
    if (timeSlots.length === 0) continue;

    // Get combined time range
    const firstSlot = timeSlots[0];
    const lastSlot = timeSlots[timeSlots.length - 1];
    if (!firstSlot || !lastSlot) continue;

    const sessionStartTime = firstSlot.startMinutes as number;
    const sessionEndTime = lastSlot.endMinutes as number;

    if (currentTimeInMinutes >= sessionStartTime && currentTimeInMinutes <= sessionEndTime) {
      const [, endTime] = lastSlot.time.split(' - ');
      const timeRange = `${firstSlot.time.split(' - ')[0]} - ${endTime}`;
      return {
        ...session,
        timeSlot: timeRange,
        timeSlots: timeSlots,
      };
    }
  }

  return null;
};
