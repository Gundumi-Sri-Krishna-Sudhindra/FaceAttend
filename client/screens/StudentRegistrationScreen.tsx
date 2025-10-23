import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, Pressable, Modal, Alert, Platform, Image, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { getTimetableApi, TimetableDay } from '@/api/timetable';
import Dropdown from '@/components/Dropdown';
import { registerStudentApi } from '@/api/students';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function StudentRegistrationScreen() {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [timetable, setTimetable] = useState<TimetableDay[]>([]);
  const [subject, setSubject] = useState<string | null>(null);
  const [section, setSection] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [faceImageBase64, setFaceImageBase64] = useState<string | null>(null);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const faceReady = (!!faceDescriptor && faceDescriptor.length > 0) || !!faceImageBase64;

  const [cameraOpen, setCameraOpen] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        const userRaw = await AsyncStorage.getItem('user');
        if (!userRaw) return;
        const user = JSON.parse(userRaw) as { id: string };
        const res = await getTimetableApi(user.id);
        setTimetable(res.timetable || []);
      } catch (e) {
        console.error('Failed to fetch timetable', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const subjectOptions = useMemo(() => {
    const set = new Set<string>();
    timetable.forEach((d) => d.sessions.forEach((s) => set.add(s.subject)));
    return Array.from(set).map((s) => ({ label: s, value: s }));
  }, [timetable]);

  const sectionOptions = useMemo(() => {
    if (!subject) return [] as { label: string; value: string }[];
    const set = new Set<string>();
    timetable.forEach((d) => d.sessions.filter((s) => s.subject === subject).forEach((s) => set.add(s.section)));
    return Array.from(set).map((s) => ({ label: s, value: s }));
  }, [timetable, subject]);

  const sessionOptions = useMemo(() => {
    if (!subject || !section) return [] as { label: string; value: string }[];
    const set = new Set<string>();
    timetable.forEach((d) => d.sessions.filter((s) => s.subject === subject && s.section === section).forEach((s) => set.add(s.sessionType)));
    return Array.from(set).map((s) => ({ label: s, value: s }));
  }, [timetable, subject, section]);

  const openCamera = async () => {
    // Require context selections first
    if (!subject || !section || !sessionType) {
      Alert.alert('Select Class Context', 'Please select Subject, Section, and Component first.');
      return;
    }
    if (!permission?.granted) {
      const p = await requestPermission();
      if (!p.granted) return;
    }
    setCountdown(3);
    setCameraOpen(true);
  };

  useEffect(() => {
    if (!cameraOpen) return;
    if (countdown <= 0) {
      captureFrame();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cameraOpen, countdown]);

  const captureFrame = async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ base64: true, quality: 0.8 });
      if (!photo?.base64) throw new Error('No frame');
      
      // Process face on client side - MANDATORY
      try {
        // Try client-side processing first
        const { extractSingleFaceDescriptorAsync } = await import('@/utils/face-utils');
        
        const descriptor = await extractSingleFaceDescriptorAsync(photo.base64);
        
        if (descriptor && descriptor.length > 0) {
          setFaceDescriptor(descriptor);
          setFaceImageBase64(null); // Don't need base64 anymore
          setCapturedImageUri(`data:image/jpeg;base64,${photo.base64}`); // Store for thumbnail display
          setCameraOpen(false);
          Alert.alert('Success', 'Face captured and processed successfully! You can now register the student.');
        } else {
          // This is expected behavior - client-side processing returns null, use server-side fallback
          setFaceImageBase64(photo.base64);
          setFaceDescriptor(null);
          setCapturedImageUri(`data:image/jpeg;base64,${photo.base64}`); // Store for thumbnail display
          setCameraOpen(false);
          Alert.alert(
            'Face Captured', 
            'Image captured successfully. Face processing will be done on the server during registration.',
            [
              { text: 'OK', onPress: () => {} }
            ]
          );
        }
      } catch (faceError: any) {
        
        // Fallback: Store base64 for server processing
        setFaceImageBase64(photo.base64);
        setFaceDescriptor(null);
        setCapturedImageUri(`data:image/jpeg;base64,${photo.base64}`); // Store for thumbnail display
        setCameraOpen(false);
        Alert.alert(
          'Face Captured', 
          'Image captured successfully. Face processing will be done on the server during registration.',
          [
            { text: 'OK', onPress: () => {} }
          ]
        );
      }
    } catch (e) {
      console.error('Capture failed', e);
      setCameraOpen(false);
      Alert.alert('Capture Failed', 'Could not take the picture. Please try again.');
    }
  };

  const canSubmit = name && rollNumber && subject && section && sessionType && faceReady;

  const onRegister = async () => {
    if (!canSubmit || !subject || !section || !sessionType || !faceReady) return;
    
    // Face data is mandatory (either descriptor or base64)
    if ((!faceDescriptor || faceDescriptor.length === 0) && !faceImageBase64) {
      Alert.alert('Face Required', 'Please capture a face image before registering the student.');
      return;
    }
    
    try {
      setLoading(true);
      const res = await registerStudentApi({
        name,
        rollNumber,
        subject,
        section,
        sessionType: sessionType as any,
        faceDescriptor: faceDescriptor || [], // Send descriptor if available
        faceImageBase64: faceImageBase64 || undefined, // Send base64 if available
      });
      Alert.alert('Success', 'Student registered successfully!');
      
      // Reset only student-specific fields; keep selected Subject/Section/Component
      setName('');
      setRollNumber('');
      setFaceDescriptor(null);
      setFaceImageBase64(null);
      setCapturedImageUri(null);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Registration failed';
      const hint = e?.response?.data?.hint || '';
      Alert.alert('Registration Failed', `${msg}${hint ? '\n\n' + hint : ''}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{ backgroundColor: 'white', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel="Back to Dashboard"
        >
          <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '600' }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Student Registration</Text>
        <View style={{ width: 60 }} />
      </View>
      
      <View style={{ flex: 1, padding: 16 }}>
        {/* Step 1: Select class context */}
        <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12, marginBottom: 16 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Step 1: Select Class Context</Text>
          <Dropdown label="Subject" value={subject} onChange={(v) => { setSubject(v); setSection(null); setSessionType(null); }} options={subjectOptions} />
          <Dropdown label="Section" value={section} onChange={(v) => { setSection(v); setSessionType(null); }} options={sectionOptions} disabled={!subject} />
          <Dropdown label="Component (Session Type)" value={sessionType} onChange={setSessionType} options={sessionOptions} disabled={!subject || !section} />
        </View>

        {/* Step 2: Student details & face capture (enabled after context) */}
        <View style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 12 }}>
          <Text style={{ fontWeight: '700', marginBottom: 8 }}>Step 2: Student Details</Text>
          <Text style={{ marginBottom: 6, fontWeight: '600', color: !subject || !section || !sessionType ? '#9CA3AF' : '#111827' }}>Student Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={!subject || !section || !sessionType ? 'Select class context first' : 'Enter name'}
            editable={!!subject && !!section && !!sessionType}
            style={{ backgroundColor: !subject || !section || !sessionType ? '#F3F4F6' : 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}
          />

          <Text style={{ marginBottom: 6, fontWeight: '600', color: !subject || !section || !sessionType ? '#9CA3AF' : '#111827' }}>Roll Number</Text>
          <TextInput
            value={rollNumber}
            onChangeText={setRollNumber}
            placeholder={!subject || !section || !sessionType ? 'Select class context first' : 'Enter roll number'}
            autoCapitalize="characters"
            editable={!!subject && !!section && !!sessionType}
            style={{ backgroundColor: !subject || !section || !sessionType ? '#F3F4F6' : 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}
          />

          <Pressable
            onPress={openCamera}
            disabled={!subject || !section || !sessionType}
            style={({ pressed }) => ({ backgroundColor: !subject || !section || !sessionType ? '#9CA3AF' : '#EF4444', paddingVertical: 12, borderRadius: 8, alignItems: 'center', opacity: pressed ? 0.9 : 1, marginBottom: 12 })}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>{faceReady ? 'Retake Face' : 'Capture Face'}</Text>
          </Pressable>

            {faceReady && (
              <View style={{ marginBottom: 12 }}>
                <Text style={{ color: '#10B981', fontWeight: '600', marginBottom: 8 }}>Face captured ✔</Text>
                {capturedImageUri && (
                  <View style={{ alignItems: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
                    <Image
                      source={{ uri: capturedImageUri }}
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        borderWidth: 3,
                        borderColor: '#10B981',
                      }}
                      resizeMode="cover"
                    />
                    <Text style={{ color: '#10B981', fontSize: 12, marginTop: 6, fontWeight: '500' }}>
                      Face Preview
                    </Text>
                  </View>
                )}
              </View>
            )}

          <Pressable
            onPress={onRegister}
            disabled={!canSubmit || !!loading}
            style={({ pressed }) => ({ backgroundColor: !canSubmit ? '#9CA3AF' : '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', opacity: pressed ? 0.95 : 1 })}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>{loading ? 'Registering...' : 'Register'}</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={cameraOpen} animationType="slide" onRequestClose={() => setCameraOpen(false)}>
        <View style={{ flex: 1, backgroundColor: 'black' }}>
          <View style={{ position: 'absolute', top: Platform.OS === 'android' ? 32 : 56, left: 0, right: 0, alignItems: 'center', zIndex: 2 }}>
            <Text style={{ color: 'white', fontSize: 32, fontWeight: '800' }}>{countdown}</Text>
          </View>
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        </View>
      </Modal>
    </SafeAreaView>
  );
}


