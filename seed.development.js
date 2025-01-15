import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './managers/entities/user/User.mongoModel.js';
import School from './managers/entities/school/School.mongoModel.js';
import SchoolAdministrator from './managers/entities/school_administrator/SchoolAdministrator.mongoModel.js';
import logger from './libs/logger.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {});

    let superadmin = await User.findOne({ username: 'superadmin' });
    if (!superadmin) {
      logger.info('creating superadmin');
      superadmin = new User({
        username: 'superadmin',
        email: 'superadmin@email.com',
        password: 'superadminpassword',
        role: 'superadmin',
      });
      await superadmin.save();
    }

    logger.info(superadmin);

    let firstSchoolAdminUser = await User.findOne({ username: 'firstSchoolAdmin' });
    if (!firstSchoolAdminUser) {
      logger.info('creating schooladministrator');
      firstSchoolAdminUser = new User({
        username: 'firstSchoolAdmin',
        email: 'firstSchoolAdmin@email.com',
        password: 'firstschooladminpassword',
        role: 'schooladministrator',
      });
      await firstSchoolAdminUser.save();
    }
    logger.info(firstSchoolAdminUser);

    let firstSchool = await School.findOne({ name: 'First School' });
    if (!firstSchool) {
      logger.info('creating school');
      firstSchool = new School({
        name: 'First School',
        address: 'First School address',
        phone: '+1-555-1111',
      });
      await firstSchool.save();
    }
    logger.info(firstSchool);

    let secondSchool = await School.findOne({ name: 'Second School' });
    if (!secondSchool) {
      logger.info('creating second school');
      secondSchool = new School({
        name: 'Second School',
        address: 'Second School address',
        phone: '+1-555-2222',
      });
      await secondSchool.save();
    }
    logger.info(secondSchool);

    let firstSchoolAdmin = await SchoolAdministrator.findOne({
      userId: firstSchoolAdminUser._id,
      schoolId: firstSchool._id,
    })
      .populate('userId')
      .populate('schoolId');

    if (!firstSchoolAdmin) {
      logger.info('creating ref');
      firstSchoolAdmin = new SchoolAdministrator({
        userId: firstSchoolAdminUser._id,
        schoolId: firstSchool._id,
      });
      await firstSchoolAdmin.save();
    }
    logger.info(firstSchoolAdmin);

    // eslint-disable-next-line no-process-exit
    process.exit(0);
  } catch (err) {
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  }
};

if (process.env.NODE_ENV === 'development') {
  seedDatabase();
}
