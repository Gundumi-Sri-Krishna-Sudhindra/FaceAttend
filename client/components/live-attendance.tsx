import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  Platform, 
  StatusBar, 
  Dimensions,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useKiosk } from '../contexts/KioskContext';
import { PasswordModal } from './PasswordModal';
import { markAttendanceApi, MarkAttendanceInput } from '@/api/attendance';
import { extractSingleFaceDescriptorAsync } from '@/utils/face-utils';

type LiveAttendanceProps = {
  sessionId: string;
  subject: string;
  section: string;
  sessionType: string;
  hours: number[];
  totalStudents: number;
  onAttendanceMarked: (data: any) => void;
  onClose: () => void;
};

type AttendanceStats = {
  present: number;
  absent: number;
  total: number;
};

export default function LiveAttendance({ 
  sessionId, 
  subject, 
  section, 
  sessionType, 
  hours, 
  totalStudents,
  onAttendanceMarked,
  onClose 
}: LiveAttendanceProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    present: 0,
    absent: totalStudents,
    total: totalStudents
  });
  const [recentlyMarked, setRecentlyMarked] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [markedStudents, setMarkedStudents] = useState<Set<string>>(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const markedStudentsRef = useRef<Set<string>>(new Set());
  const isDetectingRef = useRef<boolean>(false);
  const { isKioskMode, enableKioskMode, showPasswordModal, setShowPasswordModal } = useKiosk();

  // Enable kiosk mode when component mounts
  useEffect(() => {
    const initializeKioskMode = async () => {
      if (Platform.OS === 'android') {
        try {
          await enableKioskMode();
          console.log('Kiosk mode activated for live attendance');
        } catch (error) {
          console.error('Failed to enable kiosk mode:', error);
        }
      }
    };

    initializeKioskMode();
  }, []);

  // Start continuous face detection
  const startFaceDetection = useCallback(() => {
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
      setIsDetecting(false);
      isDetectingRef.current = false;
    }
    
    if (!isInitialized) {
      return;
    }
    
    setIsDetecting(true);
    isDetectingRef.current = true;
    
    // Small delay to ensure state is set
    setTimeout(() => {
      detectionIntervalRef.current = setInterval(async () => {
      
      if (isProcessing || !cameraRef.current || !isInitialized || !isDetectingRef.current) {
        return;
      }
      
      try {
        setIsProcessing(true);
        
        // Capture frame
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        
        if (!photo?.base64) {
          setIsProcessing(false);
          return;
        }
        
        // Prevent processing the same image multiple times
        const imageHash = photo.base64.substring(0, 100); // Use first 100 chars as simple hash
        if (lastProcessedImage === imageHash) {
          setIsProcessing(false);
          return;
        }
        setLastProcessedImage(imageHash);
        
        // Process face descriptor
        let faceDescriptor: number[] | null = null;
        try {
          
          faceDescriptor = await extractSingleFaceDescriptorAsync(photo.base64);
          
          if (faceDescriptor) {
            
          } else {
            
          }
        } catch (faceError: any) {
          setIsProcessing(false);
          return;
        }
        
        // Since we're now using server-side processing, we'll always send the image
        
        // Mark attendance with image data for server-side processing
        const markData: MarkAttendanceInput = {
          sessionId,
          faceImageBase64: photo.base64 // Send image for server-side processing
        };
        
        try {
            const result = await markAttendanceApi(markData);
            
            // Check if student was already marked to prevent duplicates
            const studentId = result.student.id;
            if (!markedStudentsRef.current.has(studentId)) {
              // Update UI
              setAttendanceStats({
                present: result.attendance.present,
                absent: result.attendance.absent,
                total: result.attendance.total
              });
              
              // Add to marked students set
              markedStudentsRef.current.add(studentId);
              setMarkedStudents(new Set(markedStudentsRef.current));
              
              // Show success feedback
              setShowSuccessMessage(`✅ ${result.student.name} marked present!`);
              setRecentlyMarked(prev => [result.student.name, ...prev.slice(0, 4)]);
              onAttendanceMarked(result);
              
              // Clear success message after 2 seconds
              setTimeout(() => {
                setShowSuccessMessage(null);
              }, 2000);
              
              // Clear recent list after 5 seconds
              setTimeout(() => {
                setRecentlyMarked(prev => prev.slice(1));
              }, 5000);
            } else {
              // Show duplicate punch message
              setShowSuccessMessage(`⚠️ ${result.student.name} already marked`);
              setTimeout(() => {
                setShowSuccessMessage(null);
              }, 1500);
            }
          } catch (apiError: any) {
            
            // Show user-friendly error message
            if (apiError.response?.status === 404) {
              setShowSuccessMessage('❌ No matching student found');
            } else if (apiError.response?.status === 400) {
              setShowSuccessMessage('❌ Face not recognized');
            } else {
              setShowSuccessMessage('❌ Detection failed');
            }
            
            setTimeout(() => {
              setShowSuccessMessage(null);
            }, 2000);
          }
        } catch (error: any) {
          // Silently handle errors to avoid interrupting detection
        } finally {
          setIsProcessing(false);
        }
      }, 3000); // Check every 3 seconds for stability
      }, 100); // Small delay to ensure state is set
    }, [sessionId, isInitialized, onAttendanceMarked]);

  // Stop face detection
  const stopFaceDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    setIsDetecting(false);
    isDetectingRef.current = false;
    setIsProcessing(false);
    setLastProcessedImage(null); // Clear image hash
    markedStudentsRef.current.clear(); // Clear marked students
    setMarkedStudents(new Set());
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopFaceDetection();
    };
  }, [stopFaceDetection]);

  // Initialize after permission is granted and camera is ready
  useEffect(() => {
    if (permission?.granted && cameraReady && !isInitialized) {
      const timer = setTimeout(() => {
        setIsInitialized(true);
        console.log('Camera fully initialized and ready');
        // Don't auto-start detection - let user control it
      }, 1000); // Reduced wait time since camera is already ready
      
      return () => clearTimeout(timer);
    }
  }, [permission?.granted, cameraReady, isInitialized]);

  const handleBackPress = () => {
    if (isKioskMode) {
      setShowPasswordModal(true);
    } else {
      onClose();
    }
  };

  const toggleDetection = () => {
    if (isButtonDisabled) return;
    
    setIsButtonDisabled(true);
    
    if (isDetecting) {
      stopFaceDetection();
    } else if (isInitialized) {
      startFaceDetection();
    }
    
    // Re-enable button after a short delay
    setTimeout(() => {
      setIsButtonDisabled(false);
    }, 1000);
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
            onPress={onClose}
          >
            <Text style={styles.permissionButtonText}>Go Back</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={() => {
          console.log('Camera ready');
          setCameraReady(true);
        }}
        onMountError={(error) => {
          console.error('Camera mount error:', error);
        }}
      />
      
      {/* Overlay UI */}
      <View style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionText}>{subject} - {section}</Text>
            <Text style={styles.sessionSubtext}>{sessionType} • Hours: {hours.join(', ')}</Text>
          </View>
        </View>

        {/* Detection Status */}
        <View style={styles.detectionStatus}>
          {!permission?.granted ? (
            <View style={[styles.statusIndicator, styles.statusInitializing]}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.statusText}>Requesting Camera Permission...</Text>
            </View>
          ) : !cameraReady ? (
            <View style={[styles.statusIndicator, styles.statusInitializing]}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.statusText}>Starting Camera...</Text>
            </View>
          ) : !isInitialized ? (
            <View style={[styles.statusIndicator, styles.statusInitializing]}>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.statusText}>Initializing...</Text>
            </View>
          ) : (
            <>
              <View style={[styles.statusIndicator, isDetecting ? styles.statusActive : styles.statusInactive]}>
                <Text style={styles.statusText}>
                  {isDetecting ? '🔍 Detecting Faces...' : '⏸️ Detection Paused'}
                </Text>
              </View>
              {isProcessing && (
                <View style={styles.processingIndicator}>
                  <ActivityIndicator size="small" color="#10B981" />
                  <Text style={styles.processingText}>Processing...</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Attendance Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendanceStats.present}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendanceStats.absent}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{attendanceStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Success Message */}
        {showSuccessMessage && (
          <View style={styles.successMessage}>
            <Text style={styles.successMessageText}>{showSuccessMessage}</Text>
          </View>
        )}

        {/* Recently Marked Students */}
        {recentlyMarked.length > 0 && (
          <View style={styles.recentlyMarked}>
            <Text style={styles.recentlyMarkedTitle}>Recently Marked:</Text>
            {recentlyMarked.map((name, index) => (
              <Text key={index} style={styles.recentlyMarkedItem}>
                ✅ {name}
              </Text>
            ))}
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[
              styles.controlButton, 
              !isInitialized || isButtonDisabled ? styles.controlButtonDisabled : 
              isDetecting ? styles.stopButton : styles.startButton
            ]}
            onPress={toggleDetection}
            disabled={!isInitialized || isButtonDisabled}
          >
            <Text style={[
              styles.controlButtonText,
              (!isInitialized || isButtonDisabled) && styles.controlButtonTextDisabled
            ]}>
              {!permission?.granted ? '⏳ Requesting Permission...' :
               !cameraReady ? '⏳ Starting Camera...' :
               !isInitialized ? '⏳ Initializing...' : 
               isButtonDisabled ? '⏳ Processing...' :
               isDetecting ? '⏸️ Pause Detection' : '▶️ Start Detection'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Password Modal */}
      <PasswordModal
        visible={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          onClose();
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
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
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionInfo: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  sessionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sessionSubtext: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 2,
  },
  detectionStatus: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 100 : 130,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  statusIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  statusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  statusInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  statusInitializing: {
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  processingText: {
    color: '#10B981',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  statsContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 180 : 210,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#ccc',
    fontSize: 12,
    marginTop: 4,
  },
  recentlyMarked: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 280 : 310,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    maxHeight: 120,
  },
  recentlyMarkedTitle: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recentlyMarkedItem: {
    color: 'white',
    fontSize: 12,
    marginBottom: 4,
  },
  successMessage: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 250 : 280,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  successMessageText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 30 : 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
  },
  stopButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
  },
  controlButtonDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.8)',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  controlButtonTextDisabled: {
    color: '#D1D5DB',
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
