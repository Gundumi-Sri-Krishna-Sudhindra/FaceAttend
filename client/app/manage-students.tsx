import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView,
  Pressable, 
  StyleSheet, 
  Alert,
  SafeAreaView,
  Modal
} from 'react-native';
import { router } from 'expo-router';
import { getStudentsApi, deleteStudentApi, updateStudentApi } from '@/api/students';
import { getFacultySubjectsApi } from '@/api/auth';
import { getStudentAttendanceDataApi, StudentAttendanceData } from '@/api/attendance';
import EditStudentModal from '@/components/edit-student-modal';
import StudentDetailsModal from '@/components/student-details-modal';

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  subject: string;
  section: string;
  sessionType: string;
  createdAt: string;
};

export default function ManageStudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceData, setAttendanceData] = useState<StudentAttendanceData[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('');
  const [facultySubjects, setFacultySubjects] = useState<string[]>([]);
  const [subjectSections, setSubjectSections] = useState<{ [key: string]: string[] }>({});
  const [subjectSessionTypes, setSubjectSessionTypes] = useState<{ [key: string]: string[] }>({});
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  
  // Student details modal state
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  
  type ActiveDropdown = 'subject' | 'section' | 'sessionType' | null;
  const [activeDropdown, setActiveDropdown] = useState<ActiveDropdown>(null);

  useEffect(() => {
    const loadFacultySubjects = async () => {
      try {
        const response = await getFacultySubjectsApi();
        setFacultySubjects(response.subjects);
        setSubjectSections(response.subjectSections);
        setSubjectSessionTypes(response.subjectSessionTypes);
      } catch (error) {
        console.error('Failed to load faculty subjects:', error);
        Alert.alert('Error', 'Failed to load faculty subjects');
      }
    };
    loadFacultySubjects();
  }, []);

  const loadStudents = async () => {
    try {
      if (!selectedSubject || !selectedSection || !selectedSessionType) {
        setStudents([]);
        setAttendanceData([]);
        return;
      }

      const response = await getStudentsApi(selectedSubject, selectedSection);
      setStudents(response.students);
      
      // Load attendance data
      try {
        const attendanceResponse = await getStudentAttendanceDataApi(selectedSubject, selectedSection, selectedSessionType);
        setAttendanceData(attendanceResponse.students);
      } catch (attendanceErr) {
        console.error('Failed to load attendance data:', attendanceErr);
        setAttendanceData([]);
      }
    } catch (err: any) {
      console.error('Failed to load students:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to load students');
    }
  };

  useEffect(() => {
    if (selectedSubject && selectedSection && selectedSessionType) {
      loadStudents();
    }
  }, [selectedSubject, selectedSection, selectedSessionType]);

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedSection('');
    setSelectedSessionType('');
    setActiveDropdown(null);
  };

  const handleSectionSelect = (section: string) => {
    setSelectedSection(section);
    setSelectedSessionType('');
    setActiveDropdown(null);
  };

  const handleSessionTypeSelect = (sessionType: string) => {
    setSelectedSessionType(sessionType);
    setActiveDropdown(null);
  };

  const openSubjectDropdown = () => {
    setActiveDropdown('subject');
  };

  const openSectionDropdown = () => {
    if (selectedSubject) {
      setActiveDropdown('section');
    }
  };

  const openSessionTypeDropdown = () => {
    if (selectedSection) {
      setActiveDropdown('sessionType');
    }
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (studentId: string, data: { name: string; rollNumber: string; faceImageBase64?: string }) => {
    try {
      await updateStudentApi(studentId, data);
      Alert.alert('Success', 'Student updated successfully');
      loadStudents();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update student';
      Alert.alert('Error', errorMessage);
      throw error; // Re-throw to let the modal handle it
    }
  };

  const handleDeleteStudent = (studentId: string, studentName: string) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${studentName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudentApi(studentId);
              Alert.alert('Success', 'Student deleted successfully');
              loadStudents();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete student');
            }
          }
        }
      ]
    );
  };

  const SingleDropdownModal = () => {
    if (!activeDropdown) {
      return null;
    }

    const getModalData = () => {
      switch (activeDropdown) {
        case 'subject':
          return {
            title: 'Select Subject',
            options: facultySubjects,
            onSelect: handleSubjectSelect
          };
        case 'section':
          return {
            title: 'Select Section',
            options: subjectSections[selectedSubject] || [],
            onSelect: handleSectionSelect
          };
        case 'sessionType':
          return {
            title: 'Select Session Type',
            options: subjectSessionTypes[selectedSubject] || [],
            onSelect: handleSessionTypeSelect
          };
        default:
          return null;
      }
    };

    const modalData = getModalData();
    
    if (!modalData) {
      return null;
    }

    return (
      <Modal
        visible={!!activeDropdown}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
        statusBarTranslucent={true}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={closeDropdown}
        >
          <Pressable 
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>{modalData.title}</Text>
            <ScrollView style={styles.modalOptions} showsVerticalScrollIndicator={false}>
              {modalData.options.length > 0 ? (
                modalData.options.map((option, index) => (
                  <Pressable
                    key={`${activeDropdown}-${option}-${index}`}
                    onPress={() => modalData.onSelect(option)}
                    style={({ pressed }) => [
                      styles.modalOption,
                      pressed && styles.modalOptionPressed
                    ]}
                  >
                    <Text style={styles.modalOptionText}>{option}</Text>
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyModalState}>
                  <Text style={styles.emptyModalTitle}>
                    {activeDropdown === 'subject' ? 'No Subjects Found' : 
                     activeDropdown === 'section' ? 'No Sections Found' : 
                     'No Session Types Found'}
                  </Text>
                  <Text style={styles.emptyModalSubtitle}>
                    {activeDropdown === 'subject' ? 'Go to dashboard to setup timetable.' :
                     activeDropdown === 'section' ? 'Please select a subject first to view available sections.' :
                     'Please select a subject and section first to view session types.'}
                  </Text>
                </View>
              )}
            </ScrollView>
            <Pressable
              onPress={closeDropdown}
              style={({ pressed }) => [
                styles.modalCloseButton,
                pressed && styles.modalCloseButtonPressed
              ]}
            >
              <Text style={styles.modalCloseButtonText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    );
  };

  const containerStyle = styles.container;

  return (
    <SafeAreaView style={containerStyle}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed
          ]}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Manage Students</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Selection Controls */}
      <View style={styles.selectionWrapper}>
        <View style={styles.selectionContainer}>
          <Text style={styles.selectionTitle}>Select Class</Text>
          
          {/* Subject Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Subject</Text>
            <Pressable
              onPress={openSubjectDropdown}
              style={({ pressed }) => [
                styles.dropdownButton,
                pressed && styles.dropdownButtonPressed
              ]}
            >
              <Text style={styles.dropdownButtonText}>
                {selectedSubject || 'Select Subject'}
              </Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </Pressable>
          </View>

          {/* Section Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Section</Text>
            <Pressable
              onPress={openSectionDropdown}
              disabled={!selectedSubject}
              style={({ pressed }) => [
                styles.dropdownButton,
                !selectedSubject && styles.dropdownButtonDisabled,
                pressed && selectedSubject && styles.dropdownButtonPressed
              ]}
            >
              <Text style={[
                styles.dropdownButtonText,
                !selectedSubject && styles.dropdownButtonTextDisabled
              ]}>
                {selectedSection || 'Select Section'}
              </Text>
              <Text style={[
                styles.dropdownArrow,
                !selectedSubject && styles.dropdownArrowDisabled
              ]}>▼</Text>
            </Pressable>
          </View>

          {/* Session Type Dropdown */}
          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Session Type</Text>
            <Pressable
              onPress={openSessionTypeDropdown}
              disabled={!selectedSection}
              style={({ pressed }) => [
                styles.dropdownButton,
                !selectedSection && styles.dropdownButtonDisabled,
                pressed && selectedSection && styles.dropdownButtonPressed
              ]}
            >
              <Text style={[
                styles.dropdownButtonText,
                !selectedSection && styles.dropdownButtonTextDisabled
              ]}>
                {selectedSessionType || 'Select Session Type'}
              </Text>
              <Text style={[
                styles.dropdownArrow,
                !selectedSection && styles.dropdownArrowDisabled
              ]}>▼</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Class Info */}
      {selectedSubject && selectedSection && selectedSessionType && (
        <View style={styles.classInfo}>
          <View style={styles.classInfoLeft}>
            <Text style={styles.classInfoText}>
              {selectedSubject} - Section {selectedSection} - {selectedSessionType}
            </Text>
            <Text style={styles.studentCount}>{students.length} students</Text>
          </View>
          <Pressable
            onPress={() => setShowStudentDetailsModal(true)}
            style={({ pressed }) => [
              styles.viewButton,
              pressed && styles.viewButtonPressed
            ]}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </Pressable>
        </View>
      )}

      {/* Empty State when no class selected */}
      {!selectedSubject || !selectedSection || !selectedSessionType ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Select a class to view students</Text>
          <Text style={styles.emptySubtext}>
            Choose subject, section, and session type to get started
          </Text>
        </View>
      ) : null}

        <SingleDropdownModal />
        
        {/* Edit Student Modal */}
        <EditStudentModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
          onSave={handleUpdateStudent}
          onDelete={handleDeleteStudent}
          student={editingStudent}
        />
        
        {/* Student Details Modal */}
        <StudentDetailsModal
          visible={showStudentDetailsModal}
          onClose={() => setShowStudentDetailsModal(false)}
          students={students}
          attendanceData={attendanceData}
          classInfo={{
            subject: selectedSubject,
            section: selectedSection,
            sessionType: selectedSessionType
          }}
          onEditStudent={handleEditStudent}
        />
      </SafeAreaView>
    );
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  backButtonText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  selectionWrapper: {
    paddingTop: 16,
  },
  selectionContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  // Unified dropdown styles
  dropdownWrapper: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    minHeight: 48,
  },
  dropdownButtonPressed: {
    opacity: 0.7,
  },
  dropdownButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  dropdownButtonTextDisabled: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 8,
  },
  dropdownArrowDisabled: {
    color: '#9CA3AF',
  },
  classInfo: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  classInfoLeft: {
    flex: 1,
  },
  classInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  studentCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  viewButtonPressed: {
    opacity: 0.9,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  // Modal styles
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
    maxWidth: 400,
    maxHeight: '70%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalOptions: {
    maxHeight: 300,
  },
  modalOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionPressed: {
    backgroundColor: '#F3F4F6',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#111827',
  },
  modalCloseButton: {
    backgroundColor: '#6B7280',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  modalCloseButtonPressed: {
    opacity: 0.9,
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty modal state styles
  emptyModalState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyModalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});