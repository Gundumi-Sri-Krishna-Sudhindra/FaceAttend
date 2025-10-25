import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { styles } from './styles/timetable-view-styles';
import { TIME_SLOTS, getTimeRange, getSessionDuration } from '@/utils/timeSlots';

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

type TimetableViewProps = {
  timetable: TimetableDay[];
  onEdit?: () => void;
  onAdd?: () => void;
  onBack?: () => void;
};


export default function TimetableView({ timetable, onEdit, onAdd, onBack }: TimetableViewProps) {

  // More robust check for empty timetable
  const hasTimetable = () => {
    if (!timetable || !Array.isArray(timetable)) {
      console.log('TimetableView: timetable is not an array:', timetable);
      return false;
    }
    if (timetable.length === 0) {
      console.log('TimetableView: timetable is empty array');
      return false;
    }
    
    // Check if any day has sessions
    const hasSessions = timetable.some(day => day && day.sessions && Array.isArray(day.sessions) && day.sessions.length > 0);
    console.log('TimetableView: hasSessions:', hasSessions, 'timetable:', JSON.stringify(timetable, null, 2));
    return hasSessions;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Timetable</Text>
        {hasTimetable() && (
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.headerEditButton, pressed && styles.headerEditButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Edit Timetable"
          >
            <Text style={styles.headerEditButtonText}>Edit</Text>
          </Pressable>
        )}
        {!hasTimetable() && <View style={styles.placeholder} />}
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {!hasTimetable() ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Timetable Set</Text>
            <Text style={styles.emptySubtitle}>
              Set up your teaching schedule to manage your classes effectively.
            </Text>
            <Pressable
              onPress={onAdd}
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Add Timetable"
            >
              <Text style={styles.addButtonText}>+ Add Timetable</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.timetableContainer}>
            {timetable.map((day, dayIndex) => (
              <View key={day.day} style={styles.dayContainer}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayName}>{day.day}</Text>
                  <Text style={styles.sessionCount}>
                    {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
                  </Text>
                </View>

                {day.sessions.length === 0 ? (
                  <View style={styles.noSessions}>
                    <Text style={styles.noSessionsText}>No sessions scheduled</Text>
                  </View>
                ) : (
                  <View style={styles.sessionsContainer}>
                    {day.sessions.map((session, sessionIndex) => (
                      <View key={sessionIndex} style={styles.sessionCard}>
                        <View style={styles.sessionHeader}>
                          <Text style={styles.subjectName}>{session.subject}</Text>
                          <View style={styles.sessionTypeBadge}>
                            <Text style={styles.sessionTypeText}>{session.sessionType}</Text>
                          </View>
                        </View>
                        
                        <View style={styles.sessionDetails}>
                          <View style={styles.sessionInfo}>
                            <Text style={styles.sectionText}>Section: {session.section}</Text>
                            <Text style={styles.roomText}>Room: {session.roomNumber}</Text>
                          </View>
                          <Text style={styles.timeText}>
                            {getTimeRange(session.hours)} ({getSessionDuration(session.hours)})
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}

          </View>
        )}
      </ScrollView>
    </View>
  );
}
