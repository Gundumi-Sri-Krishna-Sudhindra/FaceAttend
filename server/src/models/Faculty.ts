import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface Session {
  subject: string;
  sessionType: 'Lecture' | 'Tutorial' | 'Practical' | 'Skill';
  section: string;
  roomNumber: string;
  hours: number[];
}

export interface TimetableDay {
  day: string;
  sessions: Session[];
}

export interface FacultyDocument extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  timetable: TimetableDay[];
  comparePassword(candidate: string): Promise<boolean>;
}

const SessionSchema = new Schema<Session>({
  subject: { type: String, required: true, trim: true },
  sessionType: { 
    type: String, 
    required: true, 
    enum: ['Lecture', 'Tutorial', 'Practical', 'Skill'] 
  },
  section: { type: String, required: true, trim: true },
  roomNumber: { type: String, required: true, trim: true },
  hours: [{ type: Number, required: true, min: 1, max: 24 }]
});

const TimetableDaySchema = new Schema<TimetableDay>({
  day: { type: String, required: true, trim: true },
  sessions: [SessionSchema]
});

const FacultySchema = new Schema<FacultyDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    timetable: [TimetableDaySchema]
  },
  { timestamps: true }
);

FacultySchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

FacultySchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const Faculty: Model<FacultyDocument> = mongoose.models.Faculty || mongoose.model<FacultyDocument>('Faculty', FacultySchema);


