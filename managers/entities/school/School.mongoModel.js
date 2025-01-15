import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
});

const School = mongoose.model('School', SchoolSchema);
export default School;
