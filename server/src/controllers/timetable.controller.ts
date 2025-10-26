import { Request, Response } from 'express';
import { Faculty } from '../models/Faculty';

// Check for overlapping hours within the same day
function hasOverlappingHours(timetable: any[]): { hasOverlap: boolean; conflictDetails?: string } {
  for (const day of timetable) {
    if (!day.sessions || day.sessions.length <= 1) continue;
    
    // Check each session against all other sessions on the same day
    for (let i = 0; i < day.sessions.length; i++) {
      for (let j = i + 1; j < day.sessions.length; j++) {
        const session1 = day.sessions[i];
        const session2 = day.sessions[j];
        
        // Check if any hours overlap
        const hours1 = new Set(session1.hours);
        const hours2 = new Set(session2.hours);
        
        for (const hour of hours1) {
          if (hours2.has(hour)) {
            return {
              hasOverlap: true,
              conflictDetails: `${session1.subject} (${session1.section}) and ${session2.subject} (${session2.section}) both scheduled at hour ${hour} on ${day.day}`
            };
          }
        }
      }
    }
  }
  
  return { hasOverlap: false };
}

export async function updateTimetable(req: Request, res: Response): Promise<void> {
  try {
    const { facultyId } = req.params;
    const { timetable } = req.body;

    if (!timetable || !Array.isArray(timetable)) {
      res.status(400).json({ message: 'Timetable data is required' });
      return;
    }

    // Validate timetable structure
    for (const day of timetable) {
      // Skip validation if no sessions exist (allows empty timetable)
      if (!day.sessions || day.sessions.length === 0) continue;
      
      for (const session of day.sessions) {
        if (!session.subject?.trim()) {
          res.status(400).json({ 
            message: `Subject is required for a session on ${day.day}`,
            field: 'subject'
          });
          return;
        }
        if (!session.section?.trim()) {
          res.status(400).json({ 
            message: `Section is required for ${session.subject} on ${day.day}`,
            field: 'section'
          });
          return;
        }
        if (!session.sessionType || !['Lecture', 'Tutorial', 'Practical', 'Skill'].includes(session.sessionType)) {
          res.status(400).json({ 
            message: `Invalid session type for ${session.subject} on ${day.day}`,
            field: 'sessionType'
          });
          return;
        }
        if (!session.hours || session.hours.length === 0) {
          res.status(400).json({ 
            message: `Time slots are required for ${session.subject} on ${day.day}`,
            field: 'hours'
          });
          return;
        }
        
        // Validate hour range and consecutive hours
        if (!session.hours.every((hour: number) => hour >= 1 && hour <= 24)) {
          res.status(400).json({ 
            message: `Invalid hour range for ${session.subject} on ${day.day}. Hours must be between 1-24`,
            field: 'hours'
          });
          return;
        }
        
        // Validate consecutive hours
        const sortedHours = [...session.hours].sort((a, b) => a - b);
        for (let i = 1; i < sortedHours.length; i++) {
          if (sortedHours[i] - sortedHours[i - 1] !== 1) {
            res.status(400).json({ 
              message: `Hours must be consecutive for ${session.subject} on ${day.day}`,
              field: 'hours'
            });
            return;
          }
        }
      }
    }

    // Check for overlapping hours
    const overlapCheck = hasOverlappingHours(timetable);
    if (overlapCheck.hasOverlap) {
      res.status(400).json({ 
        message: `Schedule conflict detected: ${overlapCheck.conflictDetails}`,
        field: 'hours',
        conflict: overlapCheck.conflictDetails
      });
      return;
    }

    const faculty = await Faculty.findByIdAndUpdate(
      facultyId,
      { timetable },
      { new: true, runValidators: true }
    );

    if (!faculty) {
      res.status(404).json({ message: 'Faculty not found' });
      return;
    }

    res.json({
      message: 'Timetable updated successfully',
      timetable: faculty.timetable
    });
  } catch (err) {
    const error = err as any;
    console.error('Timetable update error:', error);
    
    if (error.name === 'ValidationError' && error.errors) {
      // Extract the first validation error message
      const errorField = Object.keys(error.errors)[0];
      const errorMessage = error.errors[errorField].message;
      res.status(400).json({ 
        message: errorMessage,
        field: errorField.split('.').pop() // Get the last part of the path
      });
    } else {
      res.status(500).json({ message: 'Failed to update timetable' });
    }
  }
}

export async function getTimetable(req: Request, res: Response): Promise<void> {
  try {
    const { facultyId } = req.params;

    const faculty = await Faculty.findById(facultyId).select('timetable');
    
    if (!faculty) {
      res.status(404).json({ message: 'Faculty not found' });
      return;
    }

    // Return proper empty timetable structure if timetable is undefined/null/empty for new users
    const emptyTimetable = [
      { day: 'Monday', sessions: [] },
      { day: 'Tuesday', sessions: [] },
      { day: 'Wednesday', sessions: [] },
      { day: 'Thursday', sessions: [] },
      { day: 'Friday', sessions: [] },
      { day: 'Saturday', sessions: [] },
      { day: 'Sunday', sessions: [] }
    ];
    
    // Check if timetable is undefined, null, or empty array
    const timetableData = (!faculty.timetable || faculty.timetable.length === 0) ? emptyTimetable : faculty.timetable;
    console.log('Server: faculty.timetable:', faculty.timetable);
    console.log('Server: returning timetableData:', timetableData);
    
    res.json({ timetable: timetableData });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ message: 'Failed to get timetable' });
  }
}
