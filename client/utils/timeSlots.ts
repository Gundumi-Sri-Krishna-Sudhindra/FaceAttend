// Shared time slots configuration for the entire application
// This ensures consistency between client and server

export interface TimeSlot {
  hour: number;
  time: string;
  startMinutes?: number;
  endMinutes?: number;
  duration?: string;
}

// Flexible time slots (supports 24 hours - add more as needed)
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
  { hour: 13, time: '12:00 - 12:50', startMinutes: 0 * 60 + 0, endMinutes: 0 * 60 + 50, duration: '50 mins' },
  // Additional time slots - add more as needed for 24-hour flexibility
  // { hour: 14, time: '6:30 - 7:20', startMinutes: 18 * 60 + 30, endMinutes: 19 * 60 + 20, duration: '50 mins' },
  // { hour: 15, time: '7:30 - 8:20', startMinutes: 19 * 60 + 30, endMinutes: 20 * 60 + 20, duration: '50 mins' },
  // { hour: 16, time: '8:30 - 9:20', startMinutes: 20 * 60 + 30, endMinutes: 21 * 60 + 20, duration: '50 mins' },
  // { hour: 17, time: '9:30 - 10:20', startMinutes: 21 * 60 + 30, endMinutes: 22 * 60 + 20, duration: '50 mins' },
  // { hour: 18, time: '10:30 - 11:20', startMinutes: 22 * 60 + 30, endMinutes: 23 * 60 + 20, duration: '50 mins' },
  // { hour: 19, time: '11:30 - 12:20', startMinutes: 23 * 60 + 30, endMinutes: 24 * 60 + 20, duration: '50 mins' },
  // { hour: 20, time: '1:00 - 1:50', startMinutes: 1 * 60 + 0, endMinutes: 1 * 60 + 50, duration: '50 mins' },
  // { hour: 21, time: '2:00 - 2:50', startMinutes: 2 * 60 + 0, endMinutes: 2 * 60 + 50, duration: '50 mins' },
  // { hour: 22, time: '3:00 - 3:50', startMinutes: 3 * 60 + 0, endMinutes: 3 * 60 + 50, duration: '50 mins' },
  // { hour: 23, time: '4:00 - 4:50', startMinutes: 4 * 60 + 0, endMinutes: 4 * 60 + 50, duration: '50 mins' },
  // { hour: 24, time: '5:00 - 5:50', startMinutes: 5 * 60 + 0, endMinutes: 5 * 60 + 50, duration: '50 mins' },
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
