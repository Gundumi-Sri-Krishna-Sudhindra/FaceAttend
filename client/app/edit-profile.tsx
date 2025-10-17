import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfileApi, UpdateProfileInput, getProfileApi } from '@/api/auth';

export default function EditProfileScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { user } = await getProfileApi();
        setName(user?.name || '');
        setUsername(user?.username || '');
        setEmail(user?.email || '');
        // keep local cache in sync
        await AsyncStorage.setItem('user', JSON.stringify(user));
      } catch {
        // fallback to local cache if API fails
        try {
          const userRaw = await AsyncStorage.getItem('user');
          if (userRaw) {
            const u = JSON.parse(userRaw) as { name?: string; username?: string; email?: string };
            setName(u?.name || '');
            setUsername(u?.username || '');
            setEmail(u?.email || '');
          }
        } catch {}
      }
    };
    load();
  }, []);

  const canSubmit = !!name?.trim() && !!username?.trim() && !!email?.trim();

  const onSave = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const payload: UpdateProfileInput = { name: name.trim(), username: username.trim(), email: email.trim() };
      const res = await updateProfileApi(payload);
      // Persist updated user locally
      const updatedUser = { id: res.user.id, name: res.user.name, username: res.user.username, email: email.trim() };
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Failed to update profile';
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
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Edit Profile</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ marginBottom: 6, fontWeight: '600' }}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ marginBottom: 6, fontWeight: '600' }}>Username</Text>
        <TextInput
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          autoCapitalize="none"
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 12 }}
        />

        <Text style={{ marginBottom: 6, fontWeight: '600' }}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          style={{ backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 16 }}
        />

        <Pressable
          onPress={onSave}
          disabled={!canSubmit || loading}
          style={({ pressed }) => ({ backgroundColor: !canSubmit ? '#9CA3AF' : '#10B981', paddingVertical: 12, borderRadius: 8, alignItems: 'center', opacity: pressed ? 0.95 : 1 })}
        >
          <Text style={{ color: 'white', fontWeight: '700' }}>{loading ? 'Saving...' : 'Save Changes'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}


