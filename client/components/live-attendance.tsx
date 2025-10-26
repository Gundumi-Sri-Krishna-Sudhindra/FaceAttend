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

type LiveAttendanceProps = {
  sessionId: string;
  subject: string;
  section: string;
  sessionType: string;
  hours: number[];
  totalStudents: number;
  onAttendanceMarked: (data: any) => void;
  onClose: () => void;
  existingAttendance?: {
    presentStudents: number;
    absentStudents: number;
    markedStudents: Array<{
      id: string;
      name: string;
      rollNumber: string;
      isPresent: boolean;
    }>;
  };
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
  onClose,
  existingAttendance
}: LiveAttendanceProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>(() => {
    if (existingAttendance) {
      return {
        present: existingAttendance.presentStudents,
        absent: existingAttendance.absentStudents,
        total: totalStudents
      };
    }
    return {
      present: 0,
      absent: totalStudents,
      total: totalStudents
    };
  });
  const [recentlyMarked, setRecentlyMarked] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [markedStudents, setMarkedStudents] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'duplicate' | 'notfound' | 'error' | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [lastProcessedImage, setLastProcessedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const markedStudentsRef = useRef<Set<string>>(new Set());
  const isDetectingRef = useRef<boolean>(false);
  const { isKioskMode, enableKioskMode, showPasswordModal, setShowPasswordModal } = useKiosk();

  // Initialize marked students with existing attendance data
  useEffect(() => {
    if (existingAttendance) {
      const alreadyMarked = new Set(
        existingAttendance.markedStudents
          .filter(student => student.isPresent)
          .map(student => student.id)
      );
      markedStudentsRef.current = alreadyMarked;
      setMarkedStudents(alreadyMarked);
      
      // Add recently marked students to the display
      const recentlyMarkedNames = existingAttendance.markedStudents
        .filter(student => student.isPresent)
        .map(student => `${student.name} (${student.rollNumber})`)
        .slice(0, 4);
      setRecentlyMarked(recentlyMarkedNames);
    }
  }, [existingAttendance]);

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
        // All face recognition is handled by the Python FaceNet microservice
        // We'll send the image directly for server-side processing
        
        // Mark attendance with image data for server-side processing
        const markData: MarkAttendanceInput = {
          sessionId,
          faceImageBase64: photo.base64 // Send image for server-side processing
        };
        
        try {
            const result = await markAttendanceApi(markData);
            
            // Check server response message to determine if it's a duplicate
            const studentId = result.student.id;
            const isAlreadyMarked = result.message === 'Student already marked present';
            
            if (!isAlreadyMarked) {
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
              setStatusType('success');
              setStatusMessage(`✅ ${result.student.name} (ID: ${result.student.rollNumber}) marked present!`);
              setRecentlyMarked(prev => [`${result.student.name} (${result.student.rollNumber})`, ...prev.slice(0, 4)]);
              onAttendanceMarked(result);
              
              // Clear success message after 2 seconds
              setTimeout(() => {
                setStatusMessage(null);
                setStatusType(null);
              }, 2000);
              
              // Clear recent list after 5 seconds
              setTimeout(() => {
                setRecentlyMarked(prev => prev.slice(1));
              }, 5000);
            } else {
              // Show duplicate punch message
              setStatusType('duplicate');
              setStatusMessage(`⚠️ ${result.student.name} (ID: ${result.student.rollNumber}) already marked`);
              setTimeout(() => {
                setStatusMessage(null);
                setStatusType(null);
              }, 1500);
            }
          } catch (apiError: any) {
            
            // Show user-friendly error message
            if (apiError.response?.status === 404) {
              setStatusType('notfound');
              setStatusMessage('❌ No matching student found');
            } else if (apiError.response?.status === 400) {
              setStatusType('notfound');
              setStatusMessage('❌ Face not recognized');
            } else {
              setStatusType('error');
              setStatusMessage('❌ Detection failed');
            }
            
            setTimeout(() => {
              setStatusMessage(null);
              setStatusType(null);
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
    // DO NOT clear markedStudentsRef - we want to maintain the list of already marked students
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

        {/* Attendance Stats removed per request */}

        {/* Status messages moved to bottomControls to avoid overlap */}

        {/* Recently Marked Students panel removed per request */}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          {statusMessage && (
            <View style={[
              styles.statusBanner,
              styles.statusBannerTopInControls,
              statusType === 'success' && styles.statusBannerSuccess,
              statusType === 'duplicate' && styles.statusBannerDuplicate,
              statusType === 'notfound' && styles.statusBannerNotFound,
              statusType === 'error' && styles.statusBannerError,
            ]}>
              <Text style={styles.statusBannerText}>{statusMessage}</Text>
            </View>
          )}
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
  // Removed old successMessage styles
  statusBanner: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  statusBannerSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.95)',
  },
  statusBannerDuplicate: {
    backgroundColor: 'rgba(234, 179, 8, 0.95)',
  },
  statusBannerNotFound: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
  },
  statusBannerError: {
    backgroundColor: 'rgba(239, 68, 68, 0.95)',
  },
  statusBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  statusBannerTopInControls: {
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  statusBannerBottomInControls: {
    marginTop: 12,
    alignSelf: 'stretch',
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
