import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { styles } from './styles/dashboard-styles';
import { HourSelectModal } from './hour-select-modal';
import AttendanceReports from './attendance-reports';
import { TimetableDay as ApiTimetableDay, Session as ApiSession } from '@/api/timetable';
import { TIME_SLOTS, getCurrentSession } from '@/utils/timeSlots';

type User = {
  id: string;
  name: string;
  username: string;
};

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

type DashboardProps = {
  user: User;
  timetable: ApiTimetableDay[];
  onLogout?: () => void;
  onTakeAttendance?: (hours: number[]) => void;
  onTimetablePress?: () => void;
  onViewReports?: () => void;
};


export default function Dashboard({ 
  user, 
  timetable,
  onLogout, 
  onTakeAttendance, 
  onTimetablePress,
  onViewReports
}: DashboardProps) {
  const [isHoursModalVisible, setHoursModalVisible] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);

  // Update current session when timetable changes
  useEffect(() => {
    const session = getCurrentSession(timetable);
    setCurrentSession(session);
  }, [timetable]);

  // Update current session every minute to handle time changes
  useEffect(() => {
    const interval = setInterval(() => {
      const session = getCurrentSession(timetable);
      setCurrentSession(session);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [timetable]);
  return (
    <View style={styles.container}>
      {/* Header with logo, app name, and logout */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.headerLogo}
            contentFit="contain"
            accessibilityLabel="FaceAttend logo"
          />
          <Text style={styles.appName}>FaceAttend</Text>
        </View>
        <Pressable
          onPress={() => {
            try {
              // @ts-ignore using expo-router link via global import
              require('expo-router').router.push('/settings');
            } catch {}
          }}
          style={({ pressed }) => [styles.headerLogoutButton, pressed && styles.headerLogoutButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Text style={styles.headerLogoutText}>Settings</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeGreeting}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{user.name}</Text>
        </View>

        {/* Current Session Card */}
        {(() => {
          if (currentSession) {
            return (
              <View style={styles.currentSessionCard}>
                <Text style={styles.currentSessionLabel}>Current Session</Text>
                <View style={styles.currentSessionContent}>
                  <View style={styles.sessionMainInfo}>
                    <Text style={styles.subjectText}>{currentSession.subject}</Text>
                    <View style={styles.sessionTypeBadge}>
                      <Text style={styles.sessionTypeText}>{currentSession.sessionType}</Text>
                    </View>
                  </View>
                  <View style={styles.sessionDetails}>
                    <Text style={styles.detailText}>Section: {currentSession.section}</Text>
                    <Text style={styles.detailText}>Room: {currentSession.roomNumber}</Text>
                    <Text style={styles.detailText}>Time: {currentSession.timeSlot}</Text>
                  </View>
                  <Pressable
                    onPress={() => setHoursModalVisible(true)}
                    style={({ pressed }) => [
                      styles.takeAttendanceButton,
                      pressed && styles.takeAttendanceButtonPressed
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Take attendance for current session"
                  >
                    <Text style={styles.takeAttendanceButtonText}>Take Attendance</Text>
                  </Pressable>
                </View>
                {isHoursModalVisible && (
                  <HourSelectModal
                    visible={isHoursModalVisible}
                    onClose={() => setHoursModalVisible(false)}
                    onSelectHour={(hours) => {
                      setHoursModalVisible(false);
                      onTakeAttendance && onTakeAttendance(hours);
                    }}
                    hours={currentSession.hours}
                    timeSlots={TIME_SLOTS}
                    subject={currentSession.subject}
                    section={currentSession.section}
                    sessionType={currentSession.sessionType}
                  />
                )}
              </View>
            );
          }
          return (
            <View style={styles.noSessionCard}>
              <Text style={styles.noSessionText}>No ongoing session at the moment</Text>
              <Text style={styles.noSessionSubtext}>Check your timetable for upcoming sessions</Text>
            </View>
          );
        })()}

      <View style={styles.actionsContainer}>

        <Pressable
          onPress={onTimetablePress}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Timetable"
        >
          <Text style={styles.actionButtonText}>Timetable</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            // Navigate to student registration screen
            try {
              // @ts-ignore using expo-router link via global import
              require('expo-router').router.push('/student-registration');
            } catch {}
          }}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Register Student"
        >
          <Text style={styles.actionButtonText}>Register Student</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            try {
              // @ts-ignore using expo-router link via global import
              require('expo-router').router.push('/attendance-reports');
            } catch {}
          }}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
          accessibilityRole="button"
          accessibilityLabel="View Reports"
        >
          <Text style={styles.actionButtonText}>View Attendance Reports</Text>
        </Pressable>
      </View>
      </ScrollView>

    </View>
  );
}
