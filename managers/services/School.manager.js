import School from '../entities/school/School.mongoModel.js';
import SchoolAdministrator from '../entities/school_administrator/SchoolAdministrator.mongoModel.js';
import HttpError from '../../libs/errors/HttpError.js';
import Classroom from '../entities/classroom/Classroom.mongoModel.js';
import StudentClassroom from '../entities/student_classroom/StudentClassroom.js';

class SchoolManager {
  constructor({ config }) {
    this.config = config;
    this.httpExposed = [
      'get=getSchool',
      'createSchool',
      'patch=updateSchool',
      'delete=deleteSchool',
    ];
  }

  /**
   * @openapi
   * /api/school/getSchool/{id}:
   *   get:
   *     summary: Retrieve schools based on user role and parameters.
   *     description: |
   *       This endpoint returns schools accessible to the user based on their role.
   *       - **Superadmin**: Can view all schools.
   *       - **School Administrator**: Can only view schools they are associated with.
   *       - Optionally filters by `id` provided in the query parameters.
   *     tags:
   *       - School
   *     parameters:
   *       - name: id
   *         in: path
   *         required: false
   *         description: The ID of the school to filter.
   *         schema:
   *           type: string
   *           example: "67871b17a31934dbbb058a49"
   *     responses:
   *       200:
   *         description: Schools retrieved successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   description: List of schools or a specific school.
   *                   items:
   *                     type: object
   *                     properties:
   *                       _id:
   *                         type: string
   *                         example: "67871b17a31934dbbb058a49"
   *                       name:
   *                         type: string
   *                         example: "Example School"
   *                       address:
   *                         type: string
   *                         example: "Example address"
   *                       phone:
   *                         type: string
   *                         example: "+1-555-2222"
   *                       __v:
   *                         type: integer
   *                         example: 0
   *                 errors:
   *                   type: array
   *                   description: List of validation errors (if any).
   *                   example: []
   *                 message:
   *                   type: string
   *                   example: ""
   *       401:
   *         description: Unauthorized access. User is not authenticated.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: false
   *                 data:
   *                   type: object
   *                   example: {}
   *                 errors:
   *                   type: string
   *                   example: "unauthorized"
   *                 message:
   *                   type: string
   *                   example: ""
   */
  async getSchool({ __token, __params }) {
    const query = {};
    const { id } = __params || {};
    if (id) {
      if (__token.role === 'superadmin') {
        query._id = id;
      } else {
        query.schoolId = id;
      }
    }

    if (__token.role === 'superadmin') {
      return School.find(query);
    }
    query.userId = __token.userId;

    return SchoolAdministrator.find(query).populate('schoolId');
  }

  /**
   * @openapi
   * /api/school/createSchool:
   *   post:
   *     summary: Create a new school.
   *     description: |
   *       This endpoint allows authorized users (**superadmin** or **school administrator**) to create a new school.
   *       - **Superadmin**: Can associate multiple administrators to the school.
   *       - **School Administrator**: Associates the current user as the school administrator.
   *     tags:
   *       - School
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - address
   *               - phone
   *             properties:
   *               name:
   *                 type: string
   *                 description: The name of the school.
   *                 example: "Example Name"
   *               address:
   *                 type: string
   *                 description: The address of the school.
   *                 example: "Example Address, 123"
   *               phone:
   *                 type: string
   *                 description: The contact phone number of the school.
   *                 example: "+1-555-1234"
   *               administratorIds:
   *                 type: array
   *                 description: List of user IDs to be added as school administrators (only for superadmins).
   *                 items:
   *                   type: string
   *                 example: ["userId1", "userId2"]
   *     responses:
   *       201:
   *         description: School created successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: "Example Name"
   *                     address:
   *                       type: string
   *                       example: "Example Address, 123"
   *                     phone:
   *                       type: string
   *                       example: "+1-555-1234"
   *                     _id:
   *                       type: string
   *                       example: "678813e44790c2d4352c28f5"
   *                     __v:
   *                       type: integer
   *                       example: 0
   *                 errors:
   *                   type: array
   *                   description: List of possible validation errors.
   *                   example: []
   *                 message:
   *                   type: string
   *                   example: ""
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized. User is not allowed to create a school.
   */
  async createSchool({ __body, __token }) {
    if (__token.role !== 'superadmin' && __token.role !== 'schooladministrator') {
      throw new HttpError('Unauthorized', 403);
    }

    const { name, address, phone, administratorIds } = __body;
    if (!name || !address || !phone) {
      throw new HttpError('Missing required fields: name, address, or phone', 400);
    }

    const newSchool = await School.create({
      name,
      address,
      phone,
    });

    if (__token.role === 'superadmin' && administratorIds?.length) {
      const admins = administratorIds.map((userId) => ({
        userId,
        schoolId: newSchool._id,
      }));
      await SchoolAdministrator.insertMany(admins);
    } else if (__token.role === 'schooladministrator') {
      // self assign the school to the user
      await SchoolAdministrator.create({
        userId: __token.userId,
        schoolId: newSchool._id,
      });
    }

    return newSchool;
  }

  /**
   * @openapi
   * /api/school/updateSchool/{id}:
   *   patch:
   *     summary: Update school details and administrators.
   *     description: |
   *       This endpoint allows a **superadmin** to update the details of a school, including its administrators.
   *       - If `administratorIds` is provided, it will replace all existing administrators for the school.
   *     tags:
   *       - School
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the school to be updated.
   *         schema:
   *           type: string
   *           example: "678813e44790c2d4352c28f5"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: The new name of the school.
   *                 example: "Updated Example Name"
   *               address:
   *                 type: string
   *                 description: The new address of the school.
   *                 example: "Updated Address, 456"
   *               phone:
   *                 type: string
   *                 description: The new contact phone number.
   *                 example: "+1-555-6789"
   *               administratorIds:
   *                 type: array
   *                 description: List of user IDs to be associated as administrators of the school.
   *                 items:
   *                   type: string
   *                 example: ["userId1", "userId2"]
   *     responses:
   *       200:
   *         description: School updated successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: string
   *                       example: "678813e44790c2d4352c28f5"
   *                     name:
   *                       type: string
   *                       example: "Updated Example Name"
   *                     address:
   *                       type: string
   *                       example: "Updated Address, 456"
   *                     phone:
   *                       type: string
   *                       example: "+1-555-6789"
   *                 errors:
   *                   type: array
   *                   description: List of possible validation errors.
   *                   example: []
   *                 message:
   *                   type: string
   *                   example: ""
   *       400:
   *         description: Missing school ID or invalid input.
   *       403:
   *         description: Unauthorized. User is not allowed to update the school.
   *       404:
   *         description: School not found.
   */
  async updateSchool({ __body, __params, __token }) {
    const { id } = __params;

    if (__token.role !== 'superadmin') {
      throw new HttpError('Only superadmin can update schools', 403);
    }

    if (!id) {
      throw new HttpError('Missing school ID', 400);
    }

    const updatedSchool = await School.findByIdAndUpdate(id, __body, {
      new: true,
      runValidators: true,
    });

    if (Array.isArray(__body?.administratorIds)) {
      await SchoolAdministrator.deleteMany({ schoolId: id });

      const newAdmins = __body.administratorIds.map((userId) => ({
        userId,
        schoolId: id,
      }));
      await SchoolAdministrator.insertMany(newAdmins);
    }

    if (!updatedSchool) {
      throw new HttpError('School not found', 404);
    }

    return updatedSchool;
  }

  /**
   * @openapi
   * /api/school/deleteSchool/{id}:
   *   delete:
   *     summary: Delete a school and its associated data.
   *     description: |
   *       This endpoint allows a **superadmin** to delete a school, along with:
   *       - All associated administrators.
   *       - All classrooms linked to the school.
   *       - All student enrollments in those classrooms.
   *     tags:
   *       - School
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the school to be deleted.
   *         schema:
   *           type: string
   *           example: "678813e44790c2d4352c28f5"
   *     responses:
   *       200:
   *         description: School and associated data deleted successfully.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: "School and all associated data successfully deleted"
   *                 school:
   *                   type: object
   *                   properties:
   *                     _id:
   *                       type: string
   *                       example: "678813e44790c2d4352c28f5"
   *                     name:
   *                       type: string
   *                       example: "Example Name"
   *                     address:
   *                       type: string
   *                       example: "Example Address, 123"
   *                     phone:
   *                       type: string
   *                       example: "+1-555-1234"
   *       400:
   *         description: Missing school ID.
   *       403:
   *         description: Unauthorized. User is not allowed to delete schools.
   *       404:
   *         description: School not found.
   */
  async deleteSchool({ __params, __token }) {
    const { id } = __params;

    if (__token.role !== 'superadmin') {
      throw new HttpError('Only superadmin can delete schools', 403);
    }

    if (!id) {
      throw new HttpError('Missing school ID', 400);
    }

    const classrooms = await Classroom.find({ schoolId: id });
    const classroomIds = classrooms.map((classroom) => classroom._id);

    if (classroomIds.length > 0) {
      await StudentClassroom.deleteMany({ classroomId: { $in: classroomIds } });
    }

    await Classroom.deleteMany({ schoolId: id });

    await SchoolAdministrator.deleteMany({ schoolId: id });

    const deletedSchool = await School.findByIdAndDelete(id);

    if (!deletedSchool) {
      throw new HttpError('School not found', 404);
    }

    await SchoolAdministrator.deleteMany({ schoolId: id });

    return { message: 'School successfully deleted', school: deletedSchool };
  }
}

export default SchoolManager;
