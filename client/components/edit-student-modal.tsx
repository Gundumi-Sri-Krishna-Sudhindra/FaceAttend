import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import FaceCaptureModal from './face-capture-modal';

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  subject: string;
  section: string;
  sessionType: string;
  createdAt: string;
};

type EditStudentModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (studentId: string, data: { name: string; rollNumber: string; faceImageBase64?: string }) => Promise<void>;
  onDelete: (studentId: string, studentName: string) => void;
  student: Student | null;
};

export default function EditStudentModal({
  visible,
  onClose,
  onSave,
  onDelete,
  student
}: EditStudentModalProps) {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [capturedFaceImage, setCapturedFaceImage] = useState<string | null>(null);

  // Update form when student changes
  React.useEffect(() => {
    if (student) {
      setName(student.name);
      setRollNumber(student.rollNumber);
      setCapturedFaceImage(null);
    }
  }, [student]);

  const handleSave = async () => {
    if (!student) return;

    // Check if at least one field has been modified
    const hasNameChange = name.trim() !== student.name;
    const hasRollNumberChange = rollNumber.trim() !== student.rollNumber;
    const hasFaceChange = capturedFaceImage !== null;

    if (!hasNameChange && !hasRollNumberChange && !hasFaceChange) {
      Alert.alert('No Changes', 'Please make at least one change before saving');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: { name?: string; rollNumber?: string; faceImageBase64?: string } = {};
      
      if (hasNameChange && name.trim()) {
        updateData.name = name.trim();
      }
      if (hasRollNumberChange && rollNumber.trim()) {
        updateData.rollNumber = rollNumber.trim();
      }
      if (hasFaceChange && capturedFaceImage) {
        updateData.faceImageBase64 = capturedFaceImage;
      }

      await onSave(student.id, updateData);
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFaceCapture = (base64Image: string) => {
    setCapturedFaceImage(base64Image);
    setShowFaceCapture(false);
  };

  const handleDelete = () => {
    if (!student) return;
    
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            onDelete(student.id, student.name);
            onClose();
          }
        }
      ]
    );
  };

  const handleClose = () => {
    if (isSaving) return;
    setName('');
    setRollNumber('');
    setCapturedFaceImage(null);
    onClose();
  };

  if (!student) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.headerTitle}>Edit Student</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  disabled={isSaving}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.form}>
                {/* Name Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputLabel}>Name</Text>
                    {name.trim() !== student?.name && name.trim() && (
                      <Text style={styles.modifiedIndicator}>Modified</Text>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      name.trim() !== student?.name && name.trim() && styles.modifiedInput
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter student name (optional)"
                    editable={!isSaving}
                    autoCapitalize="words"
                  />
                </View>

                {/* Roll Number Input */}
                <View style={styles.inputGroup}>
                  <View style={styles.labelContainer}>
                    <Text style={styles.inputLabel}>Roll Number</Text>
                    {rollNumber.trim() !== student?.rollNumber && rollNumber.trim() && (
                      <Text style={styles.modifiedIndicator}>Modified</Text>
                    )}
                  </View>
                  <TextInput
                    style={[
                      styles.textInput,
                      rollNumber.trim() !== student?.rollNumber && rollNumber.trim() && styles.modifiedInput
                    ]}
                    value={rollNumber}
                    onChangeText={setRollNumber}
                    placeholder="Enter roll number (optional)"
                    editable={!isSaving}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Face Capture Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Face Data</Text>
                  <View style={styles.faceCaptureContainer}>
                    {capturedFaceImage ? (
                      <View style={styles.avatarContainer}>
                        <Image
                          source={{ uri: `data:image/jpeg;base64,${capturedFaceImage}` }}
                          style={styles.avatar}
                        />
                        <View style={styles.avatarOverlay}>
                          <Text style={styles.avatarText}>New Face</Text>
                        </View>
                      </View>
                    ) : null}
                    <TouchableOpacity
                      style={styles.faceCaptureButton}
                      onPress={() => setShowFaceCapture(true)}
                      disabled={isSaving}
                    >
                      <Text style={styles.faceCaptureButtonText}>
                        {capturedFaceImage ? '🔄 Recapture Face' : '📷 Capture Face'}
                      </Text>
                    </TouchableOpacity>
                    {capturedFaceImage && (
                      <Text style={styles.faceCaptureStatus}>
                        ✅ New face data captured
                      </Text>
                    )}
                    <Text style={styles.faceCaptureHint}>
                      {capturedFaceImage 
                        ? 'New face data will be used for attendance recognition'
                        : 'Optional: Capture new face data for better recognition'
                      }
                    </Text>
                  </View>
                </View>

                {/* Student Info */}
                <View style={styles.studentInfo}>
                  <Text style={styles.studentInfoTitle}>Current Class</Text>
                  <Text style={styles.studentInfoText}>
                    {student.subject} - Section {student.section} - {student.sessionType}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.deleteButton]}
                  onPress={handleDelete}
                  disabled={isSaving}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, isSaving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Face Capture Modal */}
      <FaceCaptureModal
        visible={showFaceCapture}
        onClose={() => setShowFaceCapture(false)}
        onCapture={handleFaceCapture}
        studentName={student.name}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  modifiedIndicator: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  modifiedInput: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  faceCaptureContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  faceCaptureButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  faceCaptureButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  faceCaptureStatus: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  faceCaptureHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 16,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#10B981',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -30,
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  avatarText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  studentInfo: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  studentInfoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  studentInfoText: {
    fontSize: 14,
    color: '#374151',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
