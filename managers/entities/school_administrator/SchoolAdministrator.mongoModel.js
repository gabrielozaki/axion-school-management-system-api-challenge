import mongoose from 'mongoose';

const SchoolAdministratorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
});

const SchoolAdministrator = mongoose.model('SchoolAdministrator', SchoolAdministratorSchema);
export default SchoolAdministrator;
