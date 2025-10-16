import React from 'react';
import { SafeAreaView, View, Text, Pressable } from 'react-native';
import AttendanceReports from '@/components/attendance-reports';
import { router } from 'expo-router';

export const options = {
  headerShown: false,
};

export default function AttendanceReportsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <View style={{ backgroundColor: 'white', paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => ({ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6, opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '600' }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Attendance Reports</Text>
        <View style={{ width: 60 }} />
      </View>
      <AttendanceReports onClose={() => router.back()} />
    </SafeAreaView>
  );
}


