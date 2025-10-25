import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useKiosk } from '../contexts/KioskContext';

type FaceCaptureModalProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  studentName?: string;
};

export default function FaceCaptureModal({
  visible,
  onClose,
  onCapture,
  studentName = 'Student'
}: FaceCaptureModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [autoCaptureStarted, setAutoCaptureStarted] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isKioskMode } = useKiosk();

  const handleCapture = async () => {
    if (cameraRef.current && !isCapturing && cameraReady) {
      setIsCapturing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
          skipProcessing: true,
          exif: false,
        });

        if (photo?.base64) {
          onCapture(photo.base64);
          onClose();
        } else {
          Alert.alert('Error', 'Failed to capture image');
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image');
      } finally {
        setIsCapturing(false);
      }
    }
  };

  const startAutoCapture = () => {
    if (autoCaptureStarted || !cameraReady) return;
    
    setAutoCaptureStarted(true);
    setCountdown(5);
    
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current!);
          handleCapture();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopAutoCapture = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(0);
    setAutoCaptureStarted(false);
  };

  const handleClose = () => {
    stopAutoCapture();
    if (isKioskMode) {
      Alert.alert('Kiosk Mode', 'Cannot exit during face capture');
      return;
    }
    onClose();
  };

  // Start auto-capture when camera is ready
  useEffect(() => {
    if (visible && cameraReady && !autoCaptureStarted) {
      const timer = setTimeout(() => {
        startAutoCapture();
      }, 1000); // Small delay to ensure camera is fully ready
      
      return () => clearTimeout(timer);
    }
  }, [visible, cameraReady, autoCaptureStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoCapture();
    };
  }, []);

  if (!permission) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.container}>
          <StatusBar hidden />
          <Text style={styles.permissionText}>Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.container}>
          <StatusBar hidden />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.permissionButton, styles.cancelButton]} onPress={handleClose}>
            <Text style={styles.permissionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.container}>
        <StatusBar hidden />
        
        {/* Camera View */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="front"
          onCameraReady={() => {
            setCameraReady(true);
          }}
        />
        
        {/* Overlay */}
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Capture Face</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Countdown Display - Only at the very top */}
          {countdown > 0 && (
            <View style={styles.countdownTopContainer}>
              <Text style={styles.countdownTopNumber}>{countdown}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 20 : 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  countdownTopContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 20 : 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  countdownTopNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#10B981',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#6B7280',
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
