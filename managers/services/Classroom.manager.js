import SchoolAdministrator from '../entities/school_administrator/SchoolAdministrator.mongoModel.js';
import HttpError from '../../libs/errors/HttpError.js';
import Classroom from '../entities/classroom/Classroom.mongoModel.js';
import StudentClassroom from '../entities/student_classroom/StudentClassroom.js';

class ClassroomManager {
  constructor({ config }) {
    this.config = config;
    this.httpExposed = [
      'get=getClassroom',
      'createClassroom',
      'patch=updateClassroom',
      'delete=deleteClassroom',
    ];
  }

  /**
   * @openapi
   * /api/classroom/getClassroom:
   *   get:
   *     summary: Retrieve classrooms based on user role and parameters.
   *     description: |
   *       - **Superadmin**: Can retrieve all classrooms.
   *       - **School Administrator**: Can retrieve only classrooms associated with their schools.
   *     tags:
   *       - Classroom
   *     parameters:
   *       - name: id
   *         in: query
   *         required: false
   *         description: The ID of the classroom to retrieve.
   *         schema:
   *           type: string
   *           example: "6788239801fa9be2eed031c7"
   *     responses:
   *       200:
   *         description: Classroom(s) retrieved successfully.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Classroom not found.
   */
  async getClassroom({ __token, __params, __query }) {
    const { id } = __params || {};

    if (id) {
      const classroom = await Classroom.findById(id);
      if (!classroom) {
        throw new HttpError('Classroom not found', 404);
      }

      if (__token.role === 'schooladministrator') {
        const hasAccess = await SchoolAdministrator.findOne({
          userId: __token.userId,
          schoolId: classroom.schoolId,
        });

        if (!hasAccess) {
          throw new HttpError('Unauthorized to access this classroom', 403);
        }
      }

      return classroom;
    }

    if (__token.role === 'superadmin') {
      return Classroom.find();
    }

    if (__token.role === 'schooladministrator') {
      const accessibleSchools = await SchoolAdministrator.find({ userId: __token.userId });
      const schoolIds = accessibleSchools.map((entry) => entry.schoolId);

      return Classroom.find({ schoolId: { $in: schoolIds } });
    }

    throw new HttpError(
      'Only superadmin or authorized school administrators can retrieve classrooms',
      403,
    );
  }

  /**
   * @openapi
   * /api/classroom/createClassroom:
   *   post:
   *     summary: Create a new classroom.
   *     description: |
   *       Allows a **superadmin** or a **school administrator** (if authorized) to create a new classroom.
   *     tags:
   *       - Classroom
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - capacity
   *               - schoolId
   *             properties:
   *               name:
   *                 type: string
   *                 description: Name of the classroom.
   *                 example: "Physics Lab"
   *               capacity:
   *                 type: number
   *                 description: Capacity of the classroom.
   *                 example: 30
   *               schoolId:
   *                 type: string
   *                 description: ID of the school the classroom belongs to.
   *                 example: "6788239801fa9be2eed031c6"
   *               resources:
   *                 type: object
   *                 description: Optional resources for the classroom.
   *                 properties:
   *                   books:
   *                     type: array
   *                     items:
   *                       type: object
   *                       properties:
   *                         title:
   *                           type: string
   *                           example: "Physics Fundamentals"
   *                         author:
   *                           type: string
   *                           example: "John Doe"
   *                   links:
   *                     type: array
   *                     items:
   *                       type: object
   *                       properties:
   *                         name:
   *                           type: string
   *                           example: "Physics Videos"
   *                         url:
   *                           type: string
   *                           example: "https://example.com/videos"
   *     responses:
   *       201:
   *         description: Classroom created successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   */
  async createClassroom({ __body, __token }) {
    const { name, capacity, schoolId, resources } = __body;

    if (__token.role === 'schooladministrator') {
      const hasAccess = await SchoolAdministrator.findOne({
        userId: __token.userId,
        schoolId,
      });

      if (!hasAccess) {
        throw new HttpError('Unauthorized to create a classroom in this school', 403);
      }
    } else if (__token.role !== 'superadmin') {
      throw new HttpError(
        'Only superadmin or authorized school administrators can create classrooms',
        403,
      );
    }

    if (!name || !capacity || !schoolId) {
      throw new HttpError('Missing required fields: name, capacity, or schoolId', 400);
    }

    return Classroom.create({
      name,
      capacity,
      schoolId,
      resources: resources || {},
    });
  }

  /**
   * @openapi
   * /api/classroom/updateClassroom/{id}:
   *   patch:
   *     summary: Update a classroom's details.
   *     description: |
   *       Allows a **superadmin** or an authorized **school administrator** to update details of a classroom.
   *     tags:
   *       - Classroom
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the classroom to update.
   *         schema:
   *           type: string
   *           example: "6788239801fa9be2eed031c7"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: New name of the classroom.
   *                 example: "Advanced Physics Lab"
   *               capacity:
   *                 type: number
   *                 description: New capacity of the classroom.
   *                 example: 35
   *               resources:
   *                 type: object
   *                 description: Updated resources for the classroom.
   *     responses:
   *       200:
   *         description: Classroom updated successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Classroom not found.
   */
  async updateClassroom({ __body, __params, __token }) {
    const { id } = __params;
    const { resources, ...classroomUpdates } = __body;

    if (!id) {
      throw new HttpError('Missing classroom ID', 400);
    }

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      throw new HttpError('Classroom not found', 404);
    }

    if (__token.role === 'schooladministrator') {
      const hasAccess = await SchoolAdministrator.findOne({
        userId: __token.userId,
        schoolId: classroom.schoolId,
      });

      if (!hasAccess) {
        throw new HttpError('Unauthorized to update this classroom', 403);
      }
    } else if (__token.role !== 'superadmin') {
      throw new HttpError(
        'Only superadmin or authorized school administrators can update classrooms',
        403,
      );
    }

    const updatedClassroom = await Classroom.findByIdAndUpdate(id, classroomUpdates, {
      new: true,
      runValidators: true,
    });

    if (resources) {
      updatedClassroom.resources = resources;
      await updatedClassroom.save();
    }

    return updatedClassroom;
  }

  /**
   * @openapi
   * /api/classroom/deleteClassroom/{id}:
   *   delete:
   *     summary: Delete a classroom and its associated data.
   *     description: |
   *       Allows a **superadmin** or an authorized **school administrator** to delete a classroom and remove all associated student data.
   *     tags:
   *       - Classroom
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the classroom to delete.
   *         schema:
   *           type: string
   *           example: "6788239801fa9be2eed031c7"
   *     responses:
   *       200:
   *         description: Classroom deleted successfully.
   *       400:
   *         description: Missing classroom ID.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Classroom not found.
   */
  async deleteClassroom({ __params, __token }) {
    const { id } = __params;

    if (!id) {
      throw new HttpError('Missing classroom ID', 400);
    }

    const classroom = await Classroom.findById(id);
    if (!classroom) {
      throw new HttpError('Classroom not found', 404);
    }

    if (__token.role === 'schooladministrator') {
      const hasAccess = await SchoolAdministrator.findOne({
        userId: __token.userId,
        schoolId: classroom.schoolId,
      });

      if (!hasAccess) {
        throw new HttpError('Unauthorized to delete this classroom', 403);
      }
    } else if (__token.role !== 'superadmin') {
      throw new HttpError(
        'Only superadmin or authorized school administrators can delete classrooms',
        403,
      );
    }

    const deletedClassroom = await Classroom.findByIdAndDelete(id);

    await StudentClassroom.deleteMany({ classroomId: id });

    return {
      message: 'Classroom and all associated data successfully deleted',
      classroom: deletedClassroom,
    };
  }
}

export default ClassroomManager;
