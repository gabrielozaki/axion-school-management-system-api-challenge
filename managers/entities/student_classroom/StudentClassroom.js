import mongoose from 'mongoose';

const StudentClassroomSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  active: { type: Boolean, default: true },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ['Active', 'Inactived', 'Transfered'],
    required: true,
    default: 'Active',
  },
});

const StudentClassroom = mongoose.model('StudentClassroom', StudentClassroomSchema);
export default StudentClassroom;
