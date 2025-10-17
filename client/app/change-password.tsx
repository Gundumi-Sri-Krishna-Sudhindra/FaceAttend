import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { changePasswordApi } from '@/api/auth';

export default function ChangePasswordScreen() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = !!oldPassword && !!newPassword && !!confirmPassword && newPassword === confirmPassword && newPassword.length >= 6;

  const onSave = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      await changePasswordApi({ oldPassword, newPassword, confirmPassword });
      Alert.alert('Success', 'Password updated successfully');
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to change password';
      Alert.alert('Error', msg);
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
          accessibilityLabel="Back"
        >
          <Text style={{ fontSize: 16, color: '#EF4444', fontWeight: '600' }}>← Back</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Change Password</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ marginBottom: 6, fontWeight: '600' }}>Old Password</Text>
        <TextInput
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Enter old password"
          secureTextEntry
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ marginBottom: 6, fontWeight: '600' }}>New Password</Text>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password (min 6 chars)"
          secureTextEntry
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ marginBottom: 6, fontWeight: '600' }}>Confirm New Password</Text>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Re-enter new password"
          secureTextEntry
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16 }}
        />

        <Pressable
          onPress={onSave}
          disabled={!canSubmit || loading}
          style={({ pressed }) => ({ backgroundColor: !canSubmit ? '#9CA3AF' : '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', opacity: pressed ? 0.95 : 1 })}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>{loading ? 'Saving...' : 'Update Password'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


