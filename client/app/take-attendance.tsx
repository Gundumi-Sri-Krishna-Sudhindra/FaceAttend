import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, Alert, ActivityIndicator } from 'react-native';
import LiveAttendance from '../components/live-attendance';
import { startAttendanceSessionApi } from '@/api/attendance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

const TakeAttendancePage = () => {
  const params = useLocalSearchParams<{ subject: string; hours: string; section: string; sessionType: string }>();
  const hours = params.hours ? JSON.parse(params.hours) : [];
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingAttendance, setExistingAttendance] = useState<any>(null);
  const [isSessionCreating, setIsSessionCreating] = useState(false);

  useEffect(() => {
    const startSession = async () => {
      if (isSessionCreating || sessionId) return; // Prevent multiple calls and re-creation
      
      try {
        setIsSessionCreating(true);
        setLoading(true);
        
        // Get faculty info
        const userRaw = await AsyncStorage.getItem('user');
        if (!userRaw) {
          setError('User not logged in');
          return;
        }
        
        const user = JSON.parse(userRaw);
        
        // Get current location
        let locationData = undefined;
        try {
          const { status } = await Location.getForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
            });
            
            // Get address from coordinates
            const addressResponse = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            
            const address = addressResponse[0];
            const addressString = [
              address?.street,
              address?.city,
              address?.region,
              address?.country
            ].filter(Boolean).join(', ');
            
            locationData = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              address: addressString,
              accuracy: location.coords.accuracy || undefined
            };
          }
        } catch (locationError) {
          console.warn('Failed to get location:', locationError);
          // Continue without location data
        }
        
        // Start attendance session
        const result = await startAttendanceSessionApi({
          subject: params.subject || '',
          section: params.section || '',
          sessionType: (params.sessionType as any) || 'Lecture',
          hours: hours,
          location: locationData
        });
        
        setSessionId(result.sessionId);
        
        // Check if this is an existing session with attendance data
        if (result.presentStudents !== undefined && result.absentStudents !== undefined) {
          setExistingAttendance({
            presentStudents: result.presentStudents,
            absentStudents: result.absentStudents,
            markedStudents: result.students.map((student: any) => ({
              id: student.id,
              name: student.name,
              rollNumber: student.rollNumber,
              isPresent: student.isPresent || false
            }))
          });
        }
        
        console.log('Attendance session started:', result);
        
      } catch (err: any) {
        console.error('Failed to start attendance session:', err);
        setError(err?.response?.data?.message || 'Failed to start attendance session');
      } finally {
        setLoading(false);
        setIsSessionCreating(false);
      }
    };

    startSession();
  }, [params.subject, params.section, params.sessionType, hours]); // Removed isSessionCreating from deps

  const handleAttendanceMarked = (data: any) => {
    console.log('Attendance marked:', data);
    // You can add additional logic here, like showing notifications
  };

  const handleClose = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
          Starting attendance session...
        </Text>
      </View>
    );
  }

  if (error) {
    // Check for different types of errors
    const isNoStudentsError = error.includes('No students enrolled') || error.includes('No students registered');
    const isRateLimitError = error.includes('Please wait before creating another session') || error.includes('429');
    
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 20 }}>
        <Text style={{ fontSize: 18, color: isNoStudentsError ? '#6B7280' : isRateLimitError ? '#F59E0B' : '#EF4444', textAlign: 'center', marginBottom: 16 }}>
          {isNoStudentsError ? 'No Students Registered' : 
           isRateLimitError ? 'Please Wait' : 
           `Error: ${error}`}
        </Text>
        <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>
          {isNoStudentsError 
            ? `No students are registered for ${params.subject} - Section ${params.section} - ${params.sessionType}`
            : isRateLimitError
            ? 'Please wait a moment before trying to start attendance again.'
            : 'Please check your internet connection and try again.'
          }
        </Text>
        {isNoStudentsError && (
          <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
            Please register students for this course first.
          </Text>
        )}
        {isRateLimitError && (
          <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center' }}>
            This prevents creating duplicate sessions too quickly.
          </Text>
        )}
      </View>
    );
  }

  if (!sessionId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Text style={{ fontSize: 18, color: '#6B7280' }}>
          Session not found
        </Text>
      </View>
    );
  }

  return (
    <LiveAttendance
      sessionId={sessionId}
      subject={params.subject || ''}
      section={params.section || ''}
      sessionType={params.sessionType || 'Lecture'}
      hours={hours}
      totalStudents={0} // Will be updated by the session
      onAttendanceMarked={handleAttendanceMarked}
      onClose={handleClose}
      existingAttendance={existingAttendance}
    />
  );
};

export default TakeAttendancePage;
