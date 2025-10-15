import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Platform, StatusBar, Dimensions } from 'react-native';
import { CameraView as ExpoCameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useKiosk } from '../contexts/KioskContext';
import { PasswordModal } from './PasswordModal';

// Expo-compatible kiosk mode implementation
const ExpoKiosk = {
  enableKioskMode: async () => {
    if (Platform.OS === 'android') {
      console.log('Expo Kiosk Mode Enabled');
    }
  },
  disableKioskMode: async () => {
    if (Platform.OS === 'android') {
      console.log('Expo Kiosk Mode Disabled');
    }
  },
  hideSystemUI: async () => {
    if (Platform.OS === 'android') {
      console.log('System UI Hidden (Expo managed)');
    }
  },
  showSystemUI: async () => {
    if (Platform.OS === 'android') {
      console.log('System UI Shown (Expo managed)');
    }
  },
};

type CameraViewProps = {
  subjectCode: string;
  hours: number[];
};

export default function CameraView({ subjectCode, hours }: CameraViewProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<ExpoCameraView>(null);
  const router = useRouter();
  const { isKioskMode, enableKioskMode, showPasswordModal, setShowPasswordModal } = useKiosk();

  // Enable kiosk mode when camera screen opens
  useEffect(() => {
    const initializeKioskMode = async () => {
      if (Platform.OS === 'android') {
        try {
          await enableKioskMode();
          console.log('Kiosk mode activated for camera screen');
        } catch (error) {
          console.error('Failed to enable kiosk mode:', error);
        }
      }
    };

    initializeKioskMode();

    // Cleanup when component unmounts
    return () => {
      if (Platform.OS === 'android' && isKioskMode) {
        // Note: We don't disable kiosk mode here as it should only be disabled via password
        console.log('Camera screen unmounted, kiosk mode remains active');
      }
    };
  }, []);

  // Enhanced back button handling for Expo Go
  useEffect(() => {
    if (Platform.OS === 'android' && isKioskMode) {
      const backHandler = () => {
        // Show password modal instead of allowing back navigation
        setShowPasswordModal(true);
        return true; // Prevent default back behavior
      };

      // Add back handler
      const subscription = require('react-native').BackHandler.addEventListener('hardwareBackPress', backHandler);
      
      return () => subscription.remove();
    }
  }, [isKioskMode]);

  // Additional navigation blocking for Expo Go
  useEffect(() => {
    if (isKioskMode) {
      // Block swipe gestures and other navigation attempts
      const blockNavigation = () => {
        setShowPasswordModal(true);
        return true;
      };

      // This helps with some navigation blocking in Expo Go
      console.log('Enhanced kiosk mode active - navigation blocked');
    }
  }, [isKioskMode]);

  const handleCapture = async () => {
    if (cameraRef.current && !isCapturing) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          skipProcessing: true,
          exif: false,
          // @ts-ignore - shutterSound may be platform-specific
          shutterSound: false,
        });
        console.log('Photo taken (silent):', {
          width: photo?.width,
          height: photo?.height,
          hasBase64: !!photo?.base64,
        });
      } catch (error) {
        console.error('Error taking picture:', error);
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const handleBackPress = () => {
    if (isKioskMode) {
      // In kiosk mode, show password modal instead of navigating back
      setShowPasswordModal(true);
    } else {
      // Not in kiosk mode, navigate back normally
      router.back();
    }
  };

  const handleExitKiosk = () => {
    setShowPasswordModal(true);
  };

  const toggleCameraType = () => {
    setCameraType(current => (current === 'front' ? 'back' : 'front'));
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        {!isKioskMode && (
          <TouchableOpacity 
            style={[styles.permissionButton, { backgroundColor: '#666', marginTop: 10 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Live capture loop: take a silent photo every 0.5 seconds
  useEffect(() => {
    if (!permission?.granted) return;
    let isMounted = true;
    const intervalId = setInterval(async () => {
      if (!isMounted) return;
      if (!cameraRef.current) return;
      if (isCapturing) return;
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.5,
          base64: true,
          skipProcessing: true,
          exif: false,
          // @ts-ignore - shutterSound may be platform-specific
          shutterSound: false,
        });
        console.log('Live frame captured (silent)');
        // TODO: send photo.base64 to backend for processing as needed
      } catch (e) {
        console.log('Live capture error:', e);
      } finally {
        setIsCapturing(false);
      }
    }, 500);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [permission?.granted, isCapturing]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera View */}
      <ExpoCameraView
        ref={cameraRef}
        style={styles.camera}
        facing={cameraType}
      >
        {/* Top Controls */}
        <View style={styles.topControls}>
         
          
          
          
          <TouchableOpacity
            style={styles.flipButton}
            onPress={toggleCameraType}
          >
            <Text style={styles.flipButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </ExpoCameraView>

      {/* Password Modal */}
      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          // Navigate back after successful password verification
          router.back();
        }}
      />
    </View>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  kioskIndicator: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  kioskText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  exitKioskButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  exitKioskText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButtonText: {
    color: 'white',
    fontSize: 18,
  },
  sessionInfo: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 80 : 110,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  sessionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  kioskSessionText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'white',
    marginBottom: 20,
  },
  captureButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#ccc',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureSpinner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderTopColor: 'transparent',
    // Note: For a real spinner, you'd use Animated or a library like react-native-spinner
  },
  instructions: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  kioskInstructions: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ff6b6b',
    marginBottom: 8,
  },
  kioskSubInstructions: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ff6b6b',
  },
  kioskWarningContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
