import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Platform,
  StatusBar
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import Papa from 'papaparse';
import { getAttendanceReportsApi, AttendanceReportsResponse } from '@/api/attendance';

type AttendanceReportsProps = {
  onClose: () => void;
};

export default function AttendanceReports({ onClose }: AttendanceReportsProps) {
  const [reports, setReports] = useState<AttendanceReportsResponse['sessions']>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Helpers: Export
  const buildCsv = (session: any) => {
    const headerSection = [[
      'Subject','Section','Type','Date','Hours','Present','Absent','Total','Attendance %'
    ], [
      session.subject,
      session.section,
      session.sessionType,
      new Date(session.date).toISOString(),
      (session.hours || []).join(' '),
      session.presentStudents,
      session.absentStudents,
      session.totalStudents,
      session.attendancePercentage
    ]];
    const presentHeader = [['Present Students']];
    const presentRows = [['Name','Roll','Marked At','Confidence'], ...(
      (session.presentStudentsList || []).map((st: any) => [
        st.name,
        st.rollNumber,
        st.markedAt ? new Date(st.markedAt).toISOString() : '',
        st.confidence != null ? Math.round(st.confidence * 100) + '%' : ''
      ])
    )];
    const absentHeader = [['Absent Students']];
    const absentRows = [['Name','Roll'], ...(
      (session.absentStudentsList || []).map((st: any) => [st.name, st.rollNumber])
    )];

    const all = [
      ...headerSection,
      [],
      ...presentHeader,
      ...presentRows,
      [],
      ...absentHeader,
      ...absentRows,
    ];
    return Papa.unparse(all, { quotes: true });
  };

  const exportAsCsv = async (session: any) => {
    // Add UTF-8 BOM so Excel opens correctly
    const csv = "\uFEFF" + buildCsv(session);
    const safe = (s: string) => String(s || '').replace(/\s+/g, '_');
    const fileName = `attendance_${safe(session.subject)}_${safe(session.section)}_${Date.now()}.csv`;
    const Sharing = require('expo-sharing');
    const tryWriteAndShare = async (dir: string | null | undefined) => {
      if (!dir) throw new Error('No writable directory');
      const fileUri = dir + fileName;
      await FileSystem.writeAsStringAsync(fileUri, csv);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Attendance (CSV)',
          UTI: 'public.comma-separated-values-text',
        });
      } else {
        Alert.alert('Saved', `CSV saved to: ${fileUri}`);
      }
    };
    try {
      await tryWriteAndShare((FileSystem as any).documentDirectory);
    } catch (err1) {
      try {
        await tryWriteAndShare((FileSystem as any).cacheDirectory);
      } catch (err2) {
        Alert.alert('Export Failed', 'Could not export CSV.');
      }
    }
  };

  const buildHtml = (session: any) => {
    const fmt = (d: any) => d ? new Date(d).toLocaleString() : '';
    const pres = (session.presentStudentsList || []).map((st: any) => `
      <tr>
        <td>${st.name}</td>
        <td>${st.rollNumber}</td>
        <td>${fmt(st.markedAt)}</td>
        <td>${st.confidence != null ? Math.round(st.confidence * 100) + '%' : ''}</td>
      </tr>
    `).join('');
    const abss = (session.absentStudentsList || []).map((st: any) => `
      <tr>
        <td>${st.name}</td>
        <td>${st.rollNumber}</td>
      </tr>
    `).join('');
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, Roboto, Arial, sans-serif; padding: 16px; }
            h1 { font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
            th { background: #f3f4f6; text-align: left; }
            .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
            .pill { display: inline-block; padding: 2px 6px; background: #111827; color: #fff; border-radius: 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Attendance Report</h1>
          <div class="grid">
            <div><strong>Subject:</strong> ${session.subject}</div>
            <div><strong>Section:</strong> ${session.section}</div>
            <div><strong>Type:</strong> ${session.sessionType}</div>
            <div><strong>Date:</strong> ${fmt(session.date)}</div>
            <div><strong>Hours:</strong> ${(session.hours || []).join(', ')}</div>
            <div><strong>Summary:</strong> <span class="pill">${session.presentStudents}/${session.totalStudents} present</span></div>
          </div>
          <h2>Present Students</h2>
          <table>
            <thead><tr><th>Name</th><th>Roll</th><th>Marked At</th><th>Confidence</th></tr></thead>
            <tbody>${pres || '<tr><td colspan="4">None</td></tr>'}</tbody>
          </table>
          <h2>Absent Students</h2>
          <table>
            <thead><tr><th>Name</th><th>Roll</th></tr></thead>
            <tbody>${abss || '<tr><td colspan="2">None</td></tr>'}</tbody>
          </table>
        </body>
      </html>
    `;
  };

  const exportAsPdf = async (session: any) => {
    try {
      const html = buildHtml(session);
      const Print = require('expo-print');
      const Sharing = require('expo-sharing');
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Export Attendance (PDF)' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Export Failed', 'Could not export PDF.');
    }
  };

  const loadReports = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getAttendanceReportsApi();
      setReports(response.sessions);
    } catch (err: any) {
      console.error('Failed to load attendance reports:', err);
      setError(err?.response?.data?.message || 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

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

  const formatHours = (hours: number[]) => {
    return hours.map(hour => `H${hour}`).join(', ');
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return '#10B981'; // Green
    if (percentage >= 60) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const handleSessionPress = (session: any) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  const containerStyle = [styles.container, { paddingTop: Platform.OS === 'android' ? (StatusBar as any)?.currentHeight || 0 : 0 }];

  if (loading) {
    return (
      <View style={containerStyle}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={containerStyle}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <Pressable onPress={() => loadReports()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Header removed; handled at screen level */}

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadReports(true)}
            colors={['#10B981']}
          />
        }
      >
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No attendance records found</Text>
            <Text style={styles.emptySubtext}>
              Start taking attendance to see reports here
            </Text>
          </View>
        ) : (
          reports.map((session) => (
            <Pressable
              key={session.id}
              style={styles.sessionCard}
              onPress={() => handleSessionPress(session)}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionSubject}>{session.subject}</Text>
                <View style={[
                  styles.attendanceBadge,
                  { backgroundColor: getAttendanceColor(session.attendancePercentage) }
                ]}>
                  <Text style={styles.attendancePercentage}>
                    {session.attendancePercentage}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionInfo}>
                  {session.section} • {session.sessionType}
                </Text>
                <Text style={styles.sessionHours}>
                  Hours: {formatHours(session.hours)}
                </Text>
                <Text style={styles.sessionDate}>
                  {formatDate(session.date)}
                </Text>
              </View>
              
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{session.presentStudents}</Text>
                  <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{session.absentStudents}</Text>
                  <Text style={styles.statLabel}>Absent</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{session.totalStudents}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
              <Text style={styles.cardHint}>Tap to view session details</Text>
            </Pressable>
          ))
        )}
      </ScrollView>

      {/* Detailed Session Modal */}
      <Modal
        visible={showDetailsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Details</Text>
            <Pressable 
              onPress={() => setShowDetailsModal(false)} 
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </Pressable>
          </View>
          {/* Export bar */}
          <View style={styles.exportBar}>
            <Pressable
              onPress={() => setShowExportModal(true)}
              style={({ pressed }) => [styles.exportButton, pressed && { opacity: 0.9 }]}
              accessibilityRole="button"
              accessibilityLabel="Export session"
            >
              <Text style={styles.exportButtonText}>Export</Text>
            </Pressable>
          </View>

          {selectedSession && (
            <ScrollView style={styles.modalContent}>
              {/* Session Info */}
              <View style={styles.sessionInfoCard}>
                <Text style={styles.sessionInfoTitle}>{selectedSession.subject}</Text>
                <Text style={styles.sessionInfoText}>
                  {selectedSession.section} • {selectedSession.sessionType}
                </Text>
                <Text style={styles.sessionInfoText}>
                  Hours: {formatHours(selectedSession.hours)}
                </Text>
                <Text style={styles.sessionInfoText}>
                  Date: {formatDate(selectedSession.date)}
                </Text>
                <View style={styles.sessionStats}>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>{selectedSession.presentStudents}</Text>
                    <Text style={styles.sessionStatLabel}>Present</Text>
                  </View>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>{selectedSession.absentStudents}</Text>
                    <Text style={styles.sessionStatLabel}>Absent</Text>
                  </View>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>{selectedSession.totalStudents}</Text>
                    <Text style={styles.sessionStatLabel}>Total</Text>
                  </View>
                  <View style={styles.sessionStatItem}>
                    <Text style={styles.sessionStatNumber}>{selectedSession.attendancePercentage}%</Text>
                    <Text style={styles.sessionStatLabel}>Attendance</Text>
                  </View>
                </View>
              </View>

              {/* Present Students */}
              {selectedSession.presentStudentsList && selectedSession.presentStudentsList.length > 0 && (
                <View style={styles.studentsSection}>
                  <Text style={styles.studentsSectionTitle}>
                    ✅ Present Students ({selectedSession.presentStudentsList.length})
                  </Text>
                  {selectedSession.presentStudentsList.map((student: any, index: number) => (
                    <View key={student.id} style={styles.studentCard}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
                      </View>
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentMarkedVia}>{student.markedVia}</Text>
                        <Text style={styles.studentMarkedAt}>
                          {formatDate(student.markedAt)}
                        </Text>
                        {student.confidence && (
                          <Text style={styles.studentConfidence}>
                            Confidence: {Math.round(student.confidence * 100)}%
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Absent Students */}
              {selectedSession.absentStudentsList && selectedSession.absentStudentsList.length > 0 && (
                <View style={styles.studentsSection}>
                  <Text style={styles.studentsSectionTitle}>
                    ❌ Absent Students ({selectedSession.absentStudentsList.length})
                  </Text>
                  {selectedSession.absentStudentsList.map((student: any, index: number) => (
                    <View key={student.id} style={styles.studentCard}>
                      <View style={styles.studentInfo}>
                        <Text style={styles.studentName}>{student.name}</Text>
                        <Text style={styles.studentRoll}>Roll: {student.rollNumber}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Export format chooser */}
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
                if (selectedSession) {
                  await exportAsPdf(selectedSession);
                }
              }}
              style={({ pressed }) => [styles.exportOption, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.exportOptionText}>PDF</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                setShowExportModal(false);
                if (selectedSession) {
                  await exportAsCsv(selectedSession);
                }
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // Header removed in component to avoid duplicate headers
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
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
  sessionCard: {
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
  cardHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sessionSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  attendancePercentage: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  sessionInfo: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sessionHours: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exportBar: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  exportButton: {
    backgroundColor: '#111827',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  exportButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
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
    width: '80%',
    padding: 16,
  },
  exportTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  exportOption: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  exportCancel: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  exportCancelText: {
    color: 'white',
    fontWeight: '700',
  },
  // Session info styles
  sessionInfoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sessionInfoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  sessionInfoText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sessionStatItem: {
    alignItems: 'center',
  },
  sessionStatNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  sessionStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  // Students section styles
  studentsSection: {
    marginBottom: 20,
  },
  studentsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  studentRoll: {
    fontSize: 14,
    color: '#6B7280',
  },
  studentDetails: {
    alignItems: 'flex-end',
  },
  studentMarkedVia: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 2,
  },
  studentMarkedAt: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentConfidence: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
  },
});
