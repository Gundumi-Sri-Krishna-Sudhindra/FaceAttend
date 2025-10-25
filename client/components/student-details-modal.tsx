import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import Papa from 'papaparse';

type Student = {
  id: string;
  name: string;
  rollNumber: string;
  subject: string;
  section: string;
  sessionType: string;
  createdAt: string;
};

type StudentDetailsModalProps = {
  visible: boolean;
  onClose: () => void;
  students: Student[];
  classInfo: {
    subject: string;
    section: string;
    sessionType: string;
  };
  onEditStudent: (student: Student) => void;
};

export default function StudentDetailsModal({
  visible,
  onClose,
  students,
  classInfo,
  onEditStudent
}: StudentDetailsModalProps) {
  const [showExportModal, setShowExportModal] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export functions
  const buildCsv = () => {
    const headerSection = [[
      'Subject', 'Section', 'Session Type', 'Total Students', 'Export Date'
    ], [
      classInfo.subject,
      classInfo.section,
      classInfo.sessionType,
      students.length,
      new Date().toISOString()
    ]];
    
    const studentHeader = [['Student Details']];
    const studentRows = [['Name', 'Roll Number', 'Registered Date'], ...(
      students.map((student) => [
        student.name,
        student.rollNumber,
        new Date(student.createdAt).toISOString()
      ])
    )];

    const all = [
      ...headerSection,
      [],
      ...studentHeader,
      ...studentRows,
    ];
    return Papa.unparse(all, { quotes: true });
  };

  const exportAsCsv = async () => {
    try {
      const csv = buildCsv();
      const fileName = `students_${classInfo.subject}_${classInfo.section}_${new Date().toISOString().split('T')[0]}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csv);
      
      const Sharing = require('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Students (CSV)' });
      } else {
        Alert.alert('Export Successful', `CSV file saved: ${fileName}`);
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export CSV file.');
    }
  };

  const buildHtml = () => {
    const studentRows = students.map(student => `
      <tr>
        <td>${student.name}</td>
        <td>${student.rollNumber}</td>
        <td>${new Date(student.createdAt).toLocaleString()}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Student List - ${classInfo.subject}</title>
           <style>
             body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
             h1 { color: #111827; }
             .class-info { background: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
             .class-info div { margin-bottom: 8px; }
             .class-info div:last-child { margin-bottom: 0; }
             table { width: 100%; border-collapse: collapse; margin-top: 20px; }
             th, td { border: 1px solid #D1D5DB; padding: 12px; text-align: left; }
             th { background: #F9FAFB; font-weight: 600; }
             .pill { background: #10B981; color: white; padding: 4px 8px; border-radius: 4px; }
           </style>
        </head>
        <body>
          <h1>Student List</h1>
          <div class="class-info">
            <div><strong>Subject:</strong> ${classInfo.subject}</div>
            <div><strong>Section:</strong> ${classInfo.section}</div>
            <div><strong>Session Type:</strong> ${classInfo.sessionType}</div>
            <div><strong>Total Students:</strong> <span class="pill">${students.length}</span></div>
            <div><strong>Export Date:</strong> ${new Date().toLocaleString()}</div>
          </div>
          <h2>Student Details</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll Number</th>
                <th>Registered Date</th>
              </tr>
            </thead>
            <tbody>
              ${studentRows || '<tr><td colspan="3">No students found</td></tr>'}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const exportAsPdf = async () => {
    try {
      const html = buildHtml();
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Students (PDF)' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export PDF.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.backButtonPressed
            ]}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Student Details</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Class Info */}
        <View style={styles.classInfoCard}>
          <View style={styles.classInfoHeader}>
            <Text style={styles.classInfoTitle}>Class Information</Text>
            <Pressable
              onPress={() => setShowExportModal(true)}
              style={({ pressed }) => [
                styles.exportButton,
                pressed && styles.exportButtonPressed
              ]}
            >
              <Text style={styles.exportButtonText}>Export</Text>
            </Pressable>
          </View>
          <Text style={styles.classInfoText}>
            {classInfo.subject} - Section {classInfo.section}
          </Text>
          <Text style={styles.sessionTypeText}>
            Session Type: {classInfo.sessionType}
          </Text>
          <Text style={styles.studentCountText}>
            Total Students: {students.length}
          </Text>
        </View>

        {/* Students List */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {students.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No students found</Text>
              <Text style={styles.emptySubtext}>
                Students registered for this class will appear here
              </Text>
            </View>
          ) : (
            students.map((student, index) => (
              <View key={student.id} style={styles.studentCard}>
                <View style={styles.studentHeader}>
                  <Text style={styles.studentNumber}>#{index + 1}</Text>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Pressable
                    onPress={() => onEditStudent(student)}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.editButtonPressed
                    ]}
                  >
                    <Text style={styles.editButtonText}>Edit</Text>
                  </Pressable>
                </View>
                <View style={styles.studentDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Roll Number:</Text>
                    <Text style={styles.detailValue}>{student.rollNumber}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Registered:</Text>
                    <Text style={styles.detailValue}>{formatDate(student.createdAt)}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* Export Modal */}
        <Modal
          visible={showExportModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExportModal(false)}
        >
          <View style={styles.exportOverlay}>
            <View style={styles.exportSheet}>
              <Text style={styles.exportTitle}>Export as</Text>
              <Pressable
                onPress={async () => {
                  setShowExportModal(false);
                  await exportAsPdf();
                }}
                style={({ pressed }) => [styles.exportOption, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.exportOptionText}>PDF</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  setShowExportModal(false);
                  await exportAsCsv();
                }}
                style={({ pressed }) => [styles.exportOption, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.exportOptionText}>CSV</Text>
              </Pressable>
              <Pressable
                onPress={() => setShowExportModal(false)}
                style={({ pressed }) => [styles.exportCancel, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.exportCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: Platform.OS === 'android' ? 20 : 0,
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
  classInfoCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  classInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  classInfoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  exportButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  exportButtonPressed: {
    opacity: 0.9,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  classInfoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sessionTypeText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  studentCountText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
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
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 12,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 12,
  },
  editButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonPressed: {
    opacity: 0.9,
  },
  editButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  studentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  // Export modal styles
  exportOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exportSheet: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 20,
  },
  exportOption: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  exportOptionText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  exportCancel: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
