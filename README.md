# Axion School Management System API

## Overview
The **Axion School Management System API** is a backend solution designed for efficient management of schools, classrooms, students, and their relationships. It provides robust role-based access control (RBAC), seamless integration with MongoDB, and modern task management using **Bull** queues. The system is built with scalability and maintainability in mind.

---

## Features
- **Role-Based Access Control (RBAC):**
  - **Superadmin:** Full access to manage all entities.
  - **School Administrator:** Limited access to manage entities within their assigned schools.
- **Entity Management:**
  - Schools, classrooms, students, and relationships between them.
  - CRUD operations with permissions validated dynamically.
- **Task Scheduling:**
  - Integrated with **Bull** for robust asynchronous task management.
- **API Documentation:**
  - Automatically generated using **Swagger** (OpenAPI).
- **Secure JWT Authentication:**
  - User roles and permissions embedded securely in tokens.
- **Database Integrity:**
  - Relationships between entities (e.g., students enrolled in classrooms) are maintained.

---

## Prerequisites
- **Node.js**: v22+
- **MongoDB**: Required for storing application data
- **Redis**: Required for Bull queue management and ion-cortex

---

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/axion-school-management-system-api.git
   cd axion-school-management-system-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and configure it as follows:
   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret
   MONGO_URI=mongodb://localhost:27017/axion
   REDIS_URI=redis://localhost:6379
   ```

4. Start the application:
   ```bash
   npm start
   ```

---

## Usage
### **Endpoints**
The API exposes endpoints for managing:
- Users
- Schools
- Classrooms
- Students
- Relationships between entities

### **API Documentation**
Access the Swagger UI for detailed API documentation:
- URL: `http://localhost:3000/api-docs`

### **Example Requests**
#### **Create a School**
```bash
curl -X POST "http://localhost:3000/api/school/createSchool" \
     -H "Authorization: Bearer <your_token>" \
     -H "Content-Type: application/json" \
     -d '{
           "name": "Example School",
           "address": "123 Main St",
           "phone": "+1-555-1234"
         }'
```

#### **Enroll a Student in a Classroom**
```bash
curl -X POST "http://localhost:3000/api/student/enroll/<studentId>" \
     -H "Authorization: Bearer <your_token>" \
     -H "Content-Type: application/json" \
     -d '{
           "classroom_id": "<classroomId>"
         }'
```

---

## Architecture
### **Entities**
1. **User**:
  - Fields: `id`, `username`, `email`, `password`, `role`
  - Roles: `superadmin`, `schooladministrator`
2. **School**:
  - Fields: `id`, `name`, `address`, `phone`
3. **Classroom**:
  - Fields: `id`, `name`, `capacity`, `resources`, `schoolId`
4. **Student**:
  - Fields: `id`, `name`, `address`, `phone`
5. **Relationships**:
  - **SchoolAdministrator**:
    - Fields: `userId`, `schoolId`
  - **StudentClassroom**:
    - Fields: `studentId`, `classroomId`, `active`, `startDate`, `endDate`, `status`

---

## Changelist

- **Forcing code standards by using Eslint + Prettier + Airbnb guidelines**  
  *Why:* Guarantees that all developers follow the same guidelines, making it easier to maintain and onboard new developers.
  **Eslint v8.x is EOL, but Airbnb is still working to [update it to v9](https://github.com/airbnb/javascript/issues/2961)


- **Husky + Commitizen**  
  *Why:* Husky helps enforce linting during commits, and with the help of Commitizen, we can ensure standardized commit messages, making it easier to integrate with `semantic-release`.


- **Semantic Release**  
  *Why:* Automates versioning, changelogs, and package publishing, reducing manual work and human errors. [Read more](https://github.com/semantic-release/semantic-release).


- **Migrating from CommonJS to ESModules**  
  *Why:* Follows the more modern Node.js standard, makes the code easier to read, and improves integration with IDEs.


- **Replacing the files (`config/envs/*.js`) with environment variables (`.env`)**  
  *Why:* We should avoid exposing configurations in files, as described in the [12 Factor App](https://12factor.net/config).  
  Environment variables should be managed at the infrastructure level, as demonstrated in this [ECS example in Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/ecs_task_definition#example-using-container_definitions-and-inference_accelerator) (*search for "environment"*).  
  **This maintains compatibility with the existing project structure while improving security and environment configuration management.**


- **Replacing `console.log` by `winstor`**  
  *Why:* This allows us to have formated logs, with centralized configuration and give us the possibility of exporting to elastic stack


- **Replacing `aeon-machine` by `bull`**  
  *Why:* Aeon was not being updated in the last few months leading to some failure when cortex was updates, so changing it for Bull makes sense because it is a more robust way to schedule tasks, it uses queues on redis so can distribute between multiple application instances without having to rely on ion-cortex, reducing the complexity of the TimeMachine class


- **Swagger**  
  *Why:* Based on JSDocs OpenAPI, it will generate documentation to the API, check on `http://localhost:3000/api-docs/#/`


- **Bearer Token**  
  *Why:* it's more common to use in the Header the `Authorization: Bearer` 


- **Http Errors**  
  *Why:* Permits the better usage of the http status code and error handling

---

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

## Contact
For questions or support, please reach out to `your_email@example.com`.



