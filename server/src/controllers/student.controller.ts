import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Student } from '../models/Student';
import { Faculty } from '../models/Faculty';
import { getFaceEmbedding } from '../services/facenet.service';

export async function registerStudent(req: Request, res: Response): Promise<void> {
  console.log('=== STUDENT REGISTRATION REQUEST ===');
  console.log('Headers:', req.headers);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  console.log('Faculty ID:', req.userId);
  
  try {
    const facultyId = req.userId;
    if (!facultyId || !mongoose.isValidObjectId(facultyId)) {
      console.log('❌ Invalid faculty ID:', facultyId);
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    
    console.log('✅ Faculty ID valid:', facultyId);

    const { name, rollNumber, subject, section, sessionType, faceDescriptor, faceImageBase64 } = req.body as {
      name: string;
      rollNumber: string;
      subject: string;
      section: string;
      sessionType: 'Lecture' | 'Tutorial' | 'Practical' | 'Skill';
      faceDescriptor?: number[]; // Client-processed face descriptor (preferred)
      faceImageBase64?: string; // Fallback: base64 image for server processing
    };

    if (!name || !rollNumber || !subject || !section || !sessionType) {
      console.log('❌ Missing required fields:', { name: !!name, rollNumber: !!rollNumber, subject: !!subject, section: !!section, sessionType: !!sessionType });
      res.status(400).json({ message: 'name, rollNumber, subject, section and sessionType are required' });
      return;
    }
    
    console.log('✅ All required fields present');

    // Face data is MANDATORY for student registration
    if (!faceImageBase64) {
      console.log('❌ No face image provided - face processing is mandatory');
      res.status(400).json({ 
        message: 'Face image is required for student registration',
        hint: 'Please capture a face image using the camera.'
      });
      return;
    }
    
    // Generate FaceNet embedding from the image
    console.log('🔄 Processing face image with FaceNet...');
    let faceEmbedding: number[];
    
    try {
      faceEmbedding = await getFaceEmbedding(faceImageBase64);
      console.log('✅ FaceNet embedding generated, length:', faceEmbedding.length);
    } catch (error: any) {
      console.error('❌ FaceNet processing error:', error);
      res.status(400).json({ 
        message: error.message || 'Failed to process face image',
        hint: 'Please ensure the image contains a clear face and try again'
      });
      return;
    }

    // Verify subject/section/sessionType exists in faculty timetable
    console.log('🔍 Verifying timetable for faculty:', facultyId);
    const faculty = await Faculty.findById(facultyId).select('timetable');
    if (!faculty) {
      console.log('❌ Faculty not found');
      res.status(404).json({ message: 'Faculty not found' });
      return;
    }

    console.log('✅ Faculty found, timetable sessions:', faculty.timetable?.length || 0);
    
    // Check if faculty has any timetable data
    if (!faculty.timetable || faculty.timetable.length === 0) {
      console.log('⚠️ Faculty has no timetable - allowing registration for testing');
      // For now, allow registration even without timetable for testing
    } else {
      const isValidOffering = (faculty.timetable || []).some((day) =>
        (day.sessions || []).some((s) => s.subject === subject && s.section === section && s.sessionType === sessionType)
      );

      if (!isValidOffering) {
        console.log('❌ Invalid offering - not in timetable');
        res.status(400).json({ 
          message: 'Selected subject/section/sessionType is not in your timetable. Please set up your timetable first.',
          hint: 'Go to the Timetable section in the app to add this subject/section/sessionType combination.'
        });
        return;
      }
      
      console.log('✅ Offering verified in timetable');
    }

    // Upsert by rollNumber; add enrollment if not present
    console.log('🔍 Checking for existing student with roll number:', rollNumber);
    const existing = await Student.findOne({ rollNumber });
    const enrollmentKey = `${subject}::${section}::${facultyId}`;

    if (existing) {
      console.log('✅ Student exists, updating...');
      const hasEnrollment = (existing.enrollments || []).some((e) =>
        e.subject === subject && e.section === section && String(e.facultyId) === String(facultyId)
      );

      if (!hasEnrollment) {
        console.log('➕ Adding new enrollment');
        existing.enrollments.push({ subject, section, facultyId: new mongoose.Types.ObjectId(facultyId) });
      } else {
        console.log('ℹ️ Enrollment already exists');
      }

      // Update embeddings with latest capture (keep legacy faceDescriptor for compatibility)
      existing.faceDescriptor = faceEmbedding; // Keep legacy field
      existing.embeddings = [faceEmbedding]; // Add to FaceNet embeddings

      await existing.save();
      console.log('✅ Student updated successfully');
      res.status(200).json({ message: 'Student updated', studentId: existing.id });
      return;
    }

    console.log('➕ Creating new student...');
    const created = await Student.create({
      name,
      rollNumber,
      enrollments: [{ subject, section, facultyId: new mongoose.Types.ObjectId(facultyId) }],
      faceDescriptor: faceEmbedding, // Keep legacy field
      embeddings: [faceEmbedding], // Add to FaceNet embeddings
    });

    console.log('✅ Student created successfully with ID:', created.id);
    res.status(201).json({ message: 'Student registered', studentId: created.id });
  } catch (error) {
    console.error('❌ Student registration error:', error);
    res.status(500).json({ message: 'Failed to register student' });
  }
}

export async function getStudents(req: Request, res: Response): Promise<void> {
  try {
    const facultyId = req.userId;
    if (!facultyId || !mongoose.isValidObjectId(facultyId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { subject, section } = req.query as { subject?: string; section?: string };
    
    if (!subject || !section) {
      res.status(400).json({ message: 'subject and section are required' });
      return;
    }

    // Find students enrolled in the specific subject/section with this faculty
    const students = await Student.find({
      'enrollments.subject': subject,
      'enrollments.section': section,
      'enrollments.facultyId': new mongoose.Types.ObjectId(facultyId)
    }).select('name rollNumber enrollments createdAt').lean();

    // Transform the data to include session type from enrollments
    const transformedStudents = students.map(student => {
      const enrollment = student.enrollments.find(e => 
        e.subject === subject && 
        e.section === section && 
        String(e.facultyId) === String(facultyId)
      );
      
      return {
        id: student._id.toString(),
        name: student.name,
        rollNumber: student.rollNumber,
        subject: subject,
        section: section,
        sessionType: enrollment?.sessionType || 'Lecture', // Default to Lecture if not specified
        createdAt: student.createdAt
      };
    });

    res.json({ students: transformedStudents });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
}

export async function deleteStudent(req: Request, res: Response): Promise<void> {
  try {
    const facultyId = req.userId;
    if (!facultyId || !mongoose.isValidObjectId(facultyId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { studentId } = req.params;
    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      res.status(400).json({ message: 'Valid student ID is required' });
      return;
    }

    // Find the student and verify they are enrolled with this faculty
    const student = await Student.findById(studentId);
    if (!student) {
      res.status(404).json({ message: 'Student not found' });
      return;
    }

    // Check if student is enrolled with this faculty
    const hasEnrollment = student.enrollments.some(e => 
      String(e.facultyId) === String(facultyId)
    );

    if (!hasEnrollment) {
      res.status(403).json({ message: 'You can only delete students enrolled in your classes' });
      return;
    }

    // Remove enrollment for this faculty
    student.enrollments = student.enrollments.filter(e => 
      String(e.facultyId) !== String(facultyId)
    );

    // If no enrollments left, delete the student entirely
    if (student.enrollments.length === 0) {
      await Student.findByIdAndDelete(studentId);
      res.json({ message: 'Student deleted successfully' });
    } else {
      // Otherwise, just remove the enrollment
      await student.save();
      res.json({ message: 'Student enrollment removed successfully' });
    }
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ message: 'Failed to delete student' });
  }
}


