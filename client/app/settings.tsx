import React, { useMemo } from 'react';
import { SafeAreaView, View, Text, Pressable, ScrollView, Switch, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

export default function SettingsScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = React.useState<Location.LocationPermissionResponse | null>(null);

  // Check location permission on component mount
  React.useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();
        setLocationPermission(permission);
      } catch (error) {
        console.error('Error checking location permission:', error);
      }
    };
    checkLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(permission);
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Location access is required for attendance tracking. You can enable it in App Settings.');
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      Alert.alert('Error', 'Failed to request location permission.');
    }
  };

  const onLogout = async () => {
    try {
      // Clear token and any user session if needed
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    } catch {}
    try {
      // @ts-ignore
      router.replace('/');
    } catch {}
  };

  const ActionButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, opacity: pressed ? 0.95 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>{title}</Text>
    </Pressable>
  );

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
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        <ActionButton title="Edit Profile" onPress={() => {
          try {
            // @ts-ignore
            router.push('/edit-profile');
          } catch {}
        }} />
        <ActionButton title="Change Password" onPress={() => {
          try {
            // @ts-ignore
            router.push('/change-password');
          } catch {}
        }} />
        <ActionButton title="Manage Students" onPress={() => {
          try {
            // @ts-ignore
            router.push('/manage-students');
          } catch {}
        }} />

        {/* Camera Permission Toggle */}
        <View style={{ backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Camera Permission</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {permission?.granted ? 'Granted' : 'Not granted'}
              </Text>
            </View>
            <Switch
              value={!!permission?.granted}
              onValueChange={async (next) => {
                if (next) {
                  const res = await requestPermission();
                  if (!res.granted) {
                    Alert.alert('Permission Denied', 'Camera access is required for attendance. You can enable it in App Settings.');
                  }
                } else {
                  Alert.alert(
                    'Manage Permission',
                    'To revoke camera permission, open your system App Settings.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Open Settings', onPress: () => { try { Linking.openSettings(); } catch {} } },
                    ]
                  );
                }
              }}
            />
          </View>
        </View>

        {/* Location Permission */}
        <View style={{ backgroundColor: 'white', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>Location Permission</Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                {locationPermission?.granted ? 'Granted' : 'Not granted'}
              </Text>
            </View>
            <Switch
              value={!!locationPermission?.granted}
              onValueChange={async (next) => {
                if (next) {
                  await requestLocationPermission();
                } else {
                  Alert.alert(
                    'Manage Permission',
                    'To revoke location permission, open your system App Settings.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Open Settings', onPress: () => { try { Linking.openSettings(); } catch {} } },
                    ]
                  );
                }
              }}
            />
          </View>
        </View>

        <View style={{ marginTop: 24, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 }}>
        <Pressable
            onPress={onLogout}
            style={({ pressed }) => ({
            backgroundColor: pressed ? '#DC2626' : '#EF4444', // solid red with press effect
            paddingVertical: 14,
            paddingHorizontal: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: '#DC2626',
            opacity: pressed ? 0.9 : 1,
            })}
            accessibilityRole="button"
            accessibilityLabel="Logout"
        >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' }}>
            Logout
            </Text>
        </Pressable>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={{ padding: 12, alignItems: 'center' }}>
        <Text style={{ color: '#9CA3AF', fontSize: 12 }}>FaceAttend © {new Date().getFullYear()}</Text>
      </View>
    </SafeAreaView>
  );
}


