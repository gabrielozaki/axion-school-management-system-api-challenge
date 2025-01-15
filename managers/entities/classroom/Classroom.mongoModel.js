import mongoose from 'mongoose';

const ClassroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  resources: {
    books: [
      {
        title: { type: String, required: true },
        author: { type: String, required: true },
      },
    ],
    links: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
  },
});

const Classroom = mongoose.model('Classroom', ClassroomSchema);
export default Classroom;
