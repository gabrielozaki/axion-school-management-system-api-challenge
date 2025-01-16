db = db.getSiblingDB('axion'); // Use o banco de dados axion

db.users.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c001'),
  username: 'superadmin',
  email: 'superadmin@example.com',
  password: '$2b$10$ucwBSXFsZqpiH9Qbxf2oAu/5Lvh1xhP2U6HSSAtp91/1k24KkVxo2',
  role: 'superadmin',
});

db.users.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c002'),
  username: 'firstSchoolAdmin',
  email: 'firstSchoolAdmin@example.com',
  password: '$2b$10$HWr8RuneZNLlDVUrC.M35eALbggw8awFxWzlI83Ya9LtaR8Em.JZS',
  role: 'schooladministrator',
});

db.schools.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c003'),
  name: 'Fixed School',
  address: 'Address Example',
  phone: '+1 555-1234',
});

db.schools.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c004'),
  name: 'ToBe Deleted School',
  address: 'Address Example',
  phone: '+1 555-1234',
});

db.classrooms.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c005'),
  name: 'Fixed Classroom',
  capacity: 30,
  schoolId: ObjectId('64b0c0c0c0c0c0c0c0c0c003'),
  resources: {
    books: [{ title: 'Mathematics Basics', author: 'Author One' }],
    links: [{ name: 'Math Videos', url: 'http://example.com/math' }],
  },
});

db.classrooms.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c006'),
  name: 'ToBe Deleted Classroom',
  capacity: 25,
  schoolId: ObjectId('64b0c0c0c0c0c0c0c0c0c004'),
  resources: {
    books: [{ title: 'Science Basics', author: 'Author Two' }],
    links: [{ name: 'Science Videos', url: 'http://example.com/science' }],
  },
});

db.students.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c007'),
  name: 'Fixed Student',
  address: '123 Example Street',
  phone: '+1 555-5678',
});

db.students.insertOne({
  _id: ObjectId('64b0c0c0c0c0c0c0c0c0c008'),
  name: 'ToBe Deleted Student',
  address: '456 Example Avenue',
  phone: '+1 555-8765',
});
