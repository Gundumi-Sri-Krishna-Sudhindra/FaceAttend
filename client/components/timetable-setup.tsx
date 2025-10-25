import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { styles } from './styles/timetable-setup-styles';
import { TIME_SLOTS, SESSION_TYPES, getTimeRange, getSessionDuration, validateConsecutiveHours } from '@/utils/timeSlots';

type Session = {
  subject: string;
  sessionType: 'Lecture' | 'Tutorial' | 'Practical' | 'Skill';
  section: string;
  roomNumber: string;
  hours: number[];
};

type TimetableDay = {
  day: string;
  sessions: Session[];
};

type TimetableSetupProps = {
  existingTimetable?: TimetableDay[];
  onSubmit?: (timetable: TimetableDay[]) => Promise<void> | void;
  onSkip?: () => void;
  isSubmitting?: boolean;
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Common section patterns (numbers only)
const COMMON_SECTIONS = [
  '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'
];

export default function TimetableSetup({ existingTimetable, onSubmit, onSkip, isSubmitting = false }: TimetableSetupProps) {
  const [expandedSessions, setExpandedSessions] = useState<{[key: string]: boolean}>({});
  const [timetable, setTimetable] = useState<TimetableDay[]>(() => {
    
    if (existingTimetable && Array.isArray(existingTimetable) && existingTimetable.length > 0) {
      // Make sure all fields exist in the existing timetable
      const processedTimetable = existingTimetable.map(day => ({
        day: day.day,
        sessions: (day.sessions || []).map(session => ({
          subject: session.subject || '',
          sessionType: session.sessionType || 'Lecture',
          section: session.section || '',
          roomNumber: session.roomNumber || '',
          hours: session.hours || []
        }))
      }));
      return processedTimetable;
    }
    
    // Initialize empty timetable with all days
    const emptyTimetable = DAYS.map(day => ({ day, sessions: [] }));
    return emptyTimetable;
  });

  const createEmptySession = (): Session => ({
    subject: '',
    sessionType: 'Lecture',
    section: '',
    roomNumber: '',
    hours: []
  });

  const addSession = (dayIndex: number) => {
    const newSession = createEmptySession();
    
    const updatedTimetable = [...timetable];
    updatedTimetable[dayIndex].sessions.push(newSession);
    setTimetable(updatedTimetable);
  };

  const updateSession = (dayIndex: number, sessionIndex: number, field: keyof Session, value: any) => {
    const updatedTimetable = [...timetable];
    const currentSession = updatedTimetable[dayIndex].sessions[sessionIndex] || createEmptySession();
    updatedTimetable[dayIndex].sessions[sessionIndex] = {
      ...currentSession,
      [field]: value
    };
    setTimetable(updatedTimetable);
  };

  const removeSession = (dayIndex: number, sessionIndex: number) => {
    const updatedTimetable = [...timetable];
    updatedTimetable[dayIndex].sessions.splice(sessionIndex, 1);
    setTimetable(updatedTimetable);
  };

  const toggleHour = (dayIndex: number, sessionIndex: number, hour: number) => {
    const updatedTimetable = [...timetable];
    const session = updatedTimetable[dayIndex].sessions[sessionIndex];
    const hours = session.hours.includes(hour)
      ? session.hours.filter(h => h !== hour)
      : [...session.hours, hour].sort();
    
    updateSession(dayIndex, sessionIndex, 'hours', hours);
  };

  const getSessionDuration = (hours: number[]) => {
    if (hours.length === 1) return '1 hour (50 mins)';
    if (hours.length === 2) return '2 hours (100 mins)';
    return `${hours.length} hours`;
  };

  const validateConsecutiveHours = (hours: number[]) => {
    if (hours.length === 0) return true;
    const sorted = [...hours].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        return false;
      }
    }
    return true;
  };

  const getTimeRange = (hours: number[]) => {
    if (hours.length === 0) return '';
    const sorted = [...hours].sort((a, b) => a - b);
    const startSlot = TIME_SLOTS.find(slot => slot.hour === sorted[0]);
    const endSlot = TIME_SLOTS.find(slot => slot.hour === sorted[sorted.length - 1]);
    if (startSlot && endSlot) {
      return `${startSlot.time.split(' - ')[0]} - ${endSlot.time.split(' - ')[1]}`;
    }
    return '';
  };

  const toggleSessionExpand = (dayIndex: number, sessionIndex: number) => {
    const key = `${dayIndex}-${sessionIndex}`;
    setExpandedSessions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSessionExpanded = (dayIndex: number, sessionIndex: number) => {
    const key = `${dayIndex}-${sessionIndex}`;
    return expandedSessions[key] || false;
  };

  const handleSubmit = async () => {
    try {
      // Allow empty timetables - no need to validate for sessions
      // Users can clear their entire timetable if needed

      // Validate all required fields only for sessions that exist
      let hasEmptyFields = false;
      let dayWithError = '';
      let sessionNumber = 0;

      for (const day of timetable) {
        // Only validate if there are sessions
        if (day.sessions && day.sessions.length > 0) {
          for (let i = 0; i < day.sessions.length; i++) {
            const session = day.sessions[i];
            if (!session?.subject?.trim() || !session?.section?.trim() || !session?.roomNumber?.trim() || !session?.hours?.length) {
              hasEmptyFields = true;
              dayWithError = day.day;
              sessionNumber = i + 1;
              break;
            }
          }
        }
        if (hasEmptyFields) break;
      }

      if (hasEmptyFields) {
        Alert.alert(
          'Incomplete Session',
          `Please fill in all required fields (Subject, Section, Room Number, and Time Slots) for Session ${sessionNumber} on ${dayWithError}.`
        );
        return;
      }

      // Validate consecutive hours only for sessions that exist
      const hasInvalidHours = timetable.some(day => 
        day.sessions && day.sessions.length > 0 && 
        day.sessions.some(session => !validateConsecutiveHours(session.hours))
      );
      if (hasInvalidHours) {
        Alert.alert('Invalid Hours', 'Please make sure all sessions have consecutive hours.');
        return;
      }

      if (onSubmit) {
        await onSubmit(timetable);
      } else {
        console.log('Timetable data:', timetable);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to save timetable. Please make sure all required fields are filled.'
      );
      console.error('Failed to save timetable:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{existingTimetable && existingTimetable.length > 0 ? 'Edit Your Timetable' : 'Set Up Your Timetable'}</Text>
      <Text style={styles.subtitle}>{existingTimetable && existingTimetable.length > 0 ? 'Modify your teaching sessions' : 'Add your teaching sessions for each day'}</Text>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {timetable.map((day, dayIndex) => {
          return (
          <View key={day.day} style={styles.dayContainer}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayName}>{day.day}</Text>
              <Pressable
                onPress={() => addSession(dayIndex)}
                style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
                accessibilityRole="button"
                accessibilityLabel={`Add session for ${day.day}`}
              >
                <Text style={styles.addButtonText}>+ Add Session</Text>
              </Pressable>
            </View>

            {day.sessions.map((session, sessionIndex) => (
              <Pressable
                key={sessionIndex}
                onPress={() => toggleSessionExpand(dayIndex, sessionIndex)}
                style={({ pressed }) => [
                  styles.sessionContainer,
                  !isSessionExpanded(dayIndex, sessionIndex) && styles.sessionContainerCollapsed,
                  pressed && styles.sessionContainerPressed
                ]}
              >
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionTitleContainer}>
                    <Text style={styles.sessionNumber}>Session {sessionIndex + 1}</Text>
                    {!isSessionExpanded(dayIndex, sessionIndex) && (
                      <Text style={styles.sessionSummary}>
                        {session.subject || 'No subject'} • {session.section || 'No section'} • {getTimeRange(session.hours) || 'No time'}
                      </Text>
                    )}
                  </View>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      removeSession(dayIndex, sessionIndex);
                    }}
                    style={({ pressed }) => [styles.removeButton, pressed && styles.removeButtonPressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Remove session"
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </Pressable>
                </View>

                {isSessionExpanded(dayIndex, sessionIndex) && (
                  <View style={styles.sessionDetails}>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Subject <Text style={styles.requiredStar}>*</Text></Text>
                      <TextInput
                        value={session.subject}
                        onChangeText={(value) => updateSession(dayIndex, sessionIndex, 'subject', value)}
                        placeholder="e.g., Mathematics"
                        style={[styles.input, !session.subject?.trim() && styles.inputRequired]}
                        editable={!isSubmitting}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Session Type</Text>
                      <View style={styles.sessionTypeContainer}>
                        {SESSION_TYPES.map((type) => (
                          <Pressable
                            key={type}
                            onPress={() => updateSession(dayIndex, sessionIndex, 'sessionType', type)}
                            style={({ pressed }) => [
                              styles.sessionTypeButton,
                              session.sessionType === type && styles.sessionTypeButtonSelected,
                              pressed && styles.sessionTypeButtonPressed
                            ]}
                          >
                            <Text style={[
                              styles.sessionTypeText,
                              session.sessionType === type && styles.sessionTypeTextSelected
                            ]}>
                              {type}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Section <Text style={styles.requiredStar}>*</Text></Text>
                      <TextInput
                        value={session.section}
                        onChangeText={(value) => updateSession(dayIndex, sessionIndex, 'section', value)}
                        placeholder="e.g., S11, S24, S101, or custom"
                        style={[styles.input, !session.section?.trim() && styles.inputRequired]}
                        editable={!isSubmitting}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Room Number <Text style={styles.requiredStar}>*</Text></Text>
                      <TextInput
                        value={session.roomNumber}
                        onChangeText={(value) => updateSession(dayIndex, sessionIndex, 'roomNumber', value)}
                        placeholder="e.g., 101, Lab-1, Smart Class 3"
                        style={[styles.input, !session.roomNumber?.trim() && styles.inputRequired]}
                        editable={!isSubmitting}
                      />
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Time Slots (Select consecutive hours)</Text>
                      <Text style={styles.durationText}>
                        Duration: {getSessionDuration(session.hours)}
                        {session.hours.length > 0 && ` • ${getTimeRange(session.hours)}`}
                      </Text>
                      {session.hours.length > 0 && !validateConsecutiveHours(session.hours) && (
                        <Text style={styles.warningText}>
                          ⚠️ Please select consecutive hours only
                        </Text>
                      )}
                      <View style={styles.hoursContainer}>
                        {TIME_SLOTS.map((slot) => (
                          <Pressable
                            key={slot.hour}
                            onPress={() => toggleHour(dayIndex, sessionIndex, slot.hour)}
                            style={({ pressed }) => [
                              styles.hourButton,
                              session.hours.includes(slot.hour) && styles.hourButtonSelected,
                              pressed && styles.hourButtonPressed
                            ]}
                          >
                            <Text style={[
                              styles.hourText,
                              session.hours.includes(slot.hour) && styles.hourTextSelected
                            ]}>
                              {slot.hour}
                            </Text>
                            <Text style={[
                              styles.timeText,
                              session.hours.includes(slot.hour) && styles.timeTextSelected
                            ]}>
                              {slot.time}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
          );
        })}
      </ScrollView>

      <View style={styles.buttonContainer}>
        {!existingTimetable && (
          <Pressable
            onPress={onSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Skip timetable setup"
          >
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          </Pressable>
        )}

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Save timetable"
        >
          <Text style={styles.submitButtonText}>{existingTimetable ? 'Update Timetable' : 'Save Timetable'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
