import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface AttendanceRecord {
  studentId: Types.ObjectId;
  studentName: string;
  rollNumber: string;
  isPresent: boolean;
  markedAt: Date;
  confidence?: number; // Face matching confidence score
}

export interface AttendanceSession {
  facultyId: Types.ObjectId;
  subject: string;
  section: string;
  sessionType: 'Lecture' | 'Tutorial' | 'Practical' | 'Skill';
  hours: number[];
  date: Date;
  records: AttendanceRecord[];
  totalStudents: number;
  presentStudents: number;
  absentStudents: number;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    accuracy?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSessionDocument extends Document, AttendanceSession {}

const AttendanceRecordSchema = new Schema<AttendanceRecord>({
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  rollNumber: { type: String, required: true },
  isPresent: { type: Boolean, required: true, default: false },
  markedAt: { type: Date, default: Date.now },
  confidence: { type: Number, min: 0, max: 1.01 }
});

const AttendanceSessionSchema = new Schema<AttendanceSessionDocument>({
  facultyId: { type: Schema.Types.ObjectId, ref: 'Faculty', required: true },
  subject: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  sessionType: { 
    type: String, 
    required: true, 
    enum: ['Lecture', 'Tutorial', 'Practical', 'Skill'] 
  },
  hours: { type: [Number], required: true },
  date: { type: Date, required: true },
  records: { type: [AttendanceRecordSchema], default: [] },
  totalStudents: { type: Number, default: 0 },
  presentStudents: { type: Number, default: 0 },
  absentStudents: { type: Number, default: 0 },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    address: { type: String },
    accuracy: { type: Number }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient queries
AttendanceSessionSchema.index({ facultyId: 1, date: 1 });
AttendanceSessionSchema.index({ facultyId: 1, subject: 1, section: 1 });
AttendanceSessionSchema.index({ 'records.studentId': 1 });

export const AttendanceSession: Model<AttendanceSessionDocument> =
  mongoose.models.AttendanceSession || mongoose.model<AttendanceSessionDocument>('AttendanceSession', AttendanceSessionSchema);
