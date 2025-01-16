import Student from '../entities/student/Student.mongoModel.js';
import SchoolAdministrator from '../entities/school_administrator/SchoolAdministrator.mongoModel.js';
import StudentClassroom from '../entities/student_classroom/StudentClassroom.js';
import HttpError from '../../libs/errors/HttpError.js';
import Classroom from '../entities/classroom/Classroom.mongoModel.js';

class StudentManager {
  constructor({ config }) {
    this.config = config;
    this.httpExposed = [
      'get=getStudent',
      'createStudent',
      'patch=updateStudent',
      'delete=deleteStudent',
      'enroll',
      'patch=unenroll',
      'patch=transfer',
    ];
  }

  /**
   * @openapi
   * /api/student/getStudent:
   *   get:
   *     summary: Retrieve students based on user role and parameters.
   *     description: |
   *       - **Superadmin**: Can retrieve all students.
   *       - **School Administrator**: Can retrieve only students associated with their schools.
   *     tags:
   *       - Student
   *     parameters:
   *       - name: id
   *         in: query
   *         required: false
   *         description: The ID of the student to retrieve.
   *         schema:
   *           type: string
   *           example: "6788239801fa9be2eed031c7"
   *     responses:
   *       200:
   *         description: Student(s) retrieved successfully.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Student not found.
   */
  async getStudent({ __params, __query, __token }) {
    const { id } = __params || {};

    if (id) {
      const student = await Student.findById(id);
      if (!student) {
        throw new HttpError('Student not found', 404);
      }

      if (__token.role !== 'superadmin' && __token.role !== 'schooladministrator') {
        throw new HttpError('Unauthorized to access this student', 403);
      }

      return student;
    }

    if (__token.role === 'superadmin') {
      return Student.find();
    }

    if (__token.role === 'schooladministrator') {
      const accessibleSchools = await SchoolAdministrator.find({ userId: __token.userId });
      const schoolIds = accessibleSchools.map((entry) => entry.schoolId);
      const classrooms = await StudentClassroom.find({ schoolId: { $in: schoolIds } });
      const studentIds = classrooms.map((entry) => entry.studentId);

      return Student.find({ _id: { $in: studentIds } });
    }

    throw new HttpError(
      'Only superadmin or authorized school administrators can retrieve students',
      403,
    );
  }

  /**
   * @openapi
   * /api/student/createStudent:
   *   post:
   *     summary: Create a new student.
   *     description: |
   *       Allows a **superadmin** or a **school administrator** to create a new student.
   *     tags:
   *       - Student
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
   *                 description: Name of the student.
   *                 example: "John Doe"
   *               address:
   *                 type: string
   *                 description: Address of the student.
   *                 example: "123 Main St"
   *               phone:
   *                 type: string
   *                 description: Phone number of the student.
   *                 example: "+1-555-1234"
   *     responses:
   *       201:
   *         description: Student created successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   */
  async createStudent({ __body, __token }) {
    const { name, address, phone } = __body;

    if (__token.role !== 'superadmin' && __token.role !== 'schooladministrator') {
      throw new HttpError('Unauthorized to create a student', 403);
    }

    if (!name || !address || !phone) {
      throw new HttpError('Missing required fields: name, address, or phone', 400);
    }

    return Student.create({ name, address, phone });
  }

  /**
   * @openapi
   * /api/student/updateStudent/{id}:
   *   patch:
   *     summary: Update a student.
   *     description: |
   *       Allows a **superadmin** or a **school administrator** to update student details.
   *     tags:
   *       - Student
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the student to update.
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
   *                 description: New name of the student.
   *                 example: "Jane Doe"
   *               address:
   *                 type: string
   *                 description: New address of the student.
   *                 example: "456 Elm St"
   *               phone:
   *                 type: string
   *                 description: New phone number of the student.
   *                 example: "+1-555-5678"
   *     responses:
   *       200:
   *         description: Student updated successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Student not found.
   */
  async updateStudent({ __body, __params, __token }) {
    const { id } = __params;

    if (!id) {
      throw new HttpError('Missing student ID', 400);
    }

    const student = await Student.findById(id);
    if (!student) {
      throw new HttpError('Student not found', 404);
    }

    if (__token.role !== 'superadmin' && __token.role !== 'schooladministrator') {
      throw new HttpError('Unauthorized to update this student', 403);
    }

    Object.assign(student, __body);
    return student.save();
  }

  /**
   * @openapi
   * /api/student/deleteStudent/{id}:
   *   delete:
   *     summary: Delete a student and associated data.
   *     description: |
   *       Allows a **superadmin** or an authorized **school administrator** to delete a student and associated records.
   *     tags:
   *       - Student
   *     parameters:
   *       - name: id
   *         in: path
   *         required: true
   *         description: The ID of the student to delete.
   *         schema:
   *           type: string
   *           example: "6788239801fa9be2eed031c7"
   *     responses:
   *       200:
   *         description: Student deleted successfully.
   *       400:
   *         description: Missing student ID.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Student not found.
   */
  async deleteStudent({ __params, __token }) {
    const { id } = __params;

    if (!id) {
      throw new HttpError('Missing student ID', 400);
    }

    const student = await Student.findById(id);
    if (!student) {
      throw new HttpError('Student not found', 404);
    }

    if (__token.role !== 'superadmin' && __token.role !== 'schooladministrator') {
      throw new HttpError('Unauthorized to delete this student', 403);
    }

    await StudentClassroom.deleteMany({ studentId: id });
    await student.remove();

    return { message: 'Student and all associated data successfully deleted', student };
  }

  /**
   * @openapi
   * /api/student/enroll/{studentId}:
   *   post:
   *     summary: Enroll a student in a classroom.
   *     description: |
   *       Allows a **superadmin** or a **school administrator** to enroll a student in a specific classroom.
   *     tags:
   *       - Student
   *     parameters:
   *       - name: studentId
   *         in: path
   *         required: true
   *         description: The ID of the student to enroll.
   *         schema:
   *           type: string
   *           example: "6788239801fa9be2eed031c7"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - classroom_id
   *             properties:
   *               classroom_id:
   *                 type: string
   *                 description: The ID of the classroom to enroll the student into.
   *                 example: "6788239801fa9be2eed031c8"
   *     responses:
   *       201:
   *         description: Student enrolled successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Student or classroom not found.
   */
  async enroll({ __params, __body, __token }) {
    const { id } = __params;
    const { classroom_id: classroomId } = __body;

    if (!id || !classroomId) {
      throw new HttpError('Missing required fields: studentId or classroom_id', 400);
    }

    const student = await Student.findById(id);
    if (!student) {
      throw new HttpError('Student not found', 404);
    }

    if (__token.role !== 'superadmin' && __token.role !== 'schooladministrator') {
      throw new HttpError('Unauthorized to enroll this student', 403);
    }

    const existingEnrollment = await StudentClassroom.findOne({
      studentId: id,
      classroomId,
    });
    if (existingEnrollment) {
      throw new HttpError('Student is already enrolled in this classroom', 400);
    }

    if (__token.role === 'schooladministrator') {
      const classroom = await Classroom.findById(classroomId);

      if (!classroom) {
        throw new HttpError('Classroom not found', 404);
      }

      const hasAccess = await SchoolAdministrator.findOne({
        userId: __token.userId,
        schoolId: classroom.schoolId,
      });

      if (!hasAccess) {
        throw new HttpError('Unauthorized to enroll a student in this classroom', 403);
      }
    }

    return StudentClassroom.create({
      studentId: id,
      classroomId,
      active: true,
      startDate: new Date(),
      status: 'Active',
    });
  }

  /**
   * @openapi
   * /api/student/unenroll/{studentId}:
   *   patch:
   *     summary: Unenroll a student from a classroom.
   *     description: |
   *       Allows a **superadmin** or a **school administrator** to unenroll a student from a specific classroom, setting their status to `Inactive`.
   *     tags:
   *       - Student
   *     parameters:
   *       - name: studentId
   *         in: path
   *         required: true
   *         description: The ID of the student to unenroll.
   *         schema:
   *           type: string
   *           example: "67885b86eceb1c44015622ac"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - classroom_id
   *             properties:
   *               classroom_id:
   *                 type: string
   *                 description: The ID of the classroom the student is being unenrolled from.
   *                 example: "67885b95eceb1c44015622ae"
   *     responses:
   *       200:
   *         description: Student unenrolled successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Enrollment not found.
   */
  async unenroll({ __params, __body, __token }) {
    const { id: studentId } = __params;
    const { classroom_id: classroomId } = __body;

    if (!studentId || !classroomId) {
      throw new HttpError('Missing required fields: studentId or classroom_id', 400);
    }

    const enrollment = await StudentClassroom.findOne({ studentId, classroomId });
    if (!enrollment) {
      throw new HttpError('Enrollment not found', 404);
    }

    if (__token.role === 'schooladministrator') {
      const classroom = await Classroom.findById(classroomId);
      if (!classroom) {
        throw new HttpError('Classroom not found', 404);
      }

      const hasAccess = await SchoolAdministrator.findOne({
        userId: __token.userId,
        schoolId: classroom.schoolId,
      });

      if (!hasAccess) {
        throw new HttpError('Unauthorized to unenroll a student from this classroom', 403);
      }
    } else if (__token.role !== 'superadmin') {
      throw new HttpError('Unauthorized to unenroll a student', 403);
    }

    enrollment.status = 'Inactive';
    enrollment.endDate = new Date();
    await enrollment.save();

    return { message: 'Student successfully unenrolled', enrollment };
  }

  /**
   * @openapi
   * /api/student/transfer/{studentId}:
   *   patch:
   *     summary: Transfer a student to a different classroom.
   *     description: |
   *       Allows a **superadmin** or a **school administrator** to transfer a student from one classroom to another.
   *       The status of the current enrollment is set to `Transferred`.
   *     tags:
   *       - Student
   *     parameters:
   *       - name: studentId
   *         in: path
   *         required: true
   *         description: The ID of the student to transfer.
   *         schema:
   *           type: string
   *           example: "67885b86eceb1c44015622ac"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - from_classroom_id
   *               - to_classroom_id
   *             properties:
   *               from_classroom_id:
   *                 type: string
   *                 description: The ID of the classroom the student is leaving.
   *                 example: "67885b95eceb1c44015622ae"
   *               to_classroom_id:
   *                 type: string
   *                 description: The ID of the classroom the student is transferring to.
   *                 example: "6788616511819636909cd92d"
   *     responses:
   *       200:
   *         description: Student transferred successfully.
   *       400:
   *         description: Missing required fields.
   *       403:
   *         description: Unauthorized.
   *       404:
   *         description: Enrollment not found.
   */
  async transfer({ __params, __body, __token }) {
    const { id: studentId } = __params;
    const { from_classroom_id: fromClassroomId, to_classroom_id: toClassroomId } = __body;

    if (!studentId || !fromClassroomId || !toClassroomId) {
      throw new HttpError(
        'Missing required fields: studentId, from_classroom_id, or to_classroom_id',
        400,
      );
    }

    const enrollment = await StudentClassroom.findOne({ studentId, classroomId: fromClassroomId });
    if (!enrollment) {
      throw new HttpError('Enrollment not found in the source classroom', 404);
    }

    if (__token.role === 'schooladministrator') {
      const sourceClassroom = await Classroom.findById(fromClassroomId);
      const targetClassroom = await Classroom.findById(toClassroomId);

      if (!sourceClassroom || !targetClassroom) {
        throw new HttpError('Source or target classroom not found', 404);
      }

      const hasAccess = await SchoolAdministrator.findOne({
        userId: __token.userId,
        schoolId: sourceClassroom.schoolId,
      });

      if (
        !hasAccess ||
        sourceClassroom.schoolId.toString() !== targetClassroom.schoolId.toString()
      ) {
        throw new HttpError('Unauthorized to transfer a student between these classrooms', 403);
      }
    } else if (__token.role !== 'superadmin') {
      throw new HttpError('Unauthorized to transfer a student', 403);
    }

    // Update current enrollment to Transferred
    enrollment.status = 'Transferred';
    enrollment.endDate = new Date();
    await enrollment.save();

    // Create new enrollment in target classroom
    return StudentClassroom.create({
      studentId,
      classroomId: toClassroomId,
      active: true,
      startDate: new Date(),
      status: 'Active',
    });
  }
}

export default StudentManager;
