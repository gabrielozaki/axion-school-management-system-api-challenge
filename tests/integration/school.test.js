import request from 'supertest';
import { generateSuperadminTestToken } from './common/generateTestToken.js';

describe('School API', () => {
  const API_URL =
    process.env.TEST_ENV === 'container' ? 'http://axion_server:3000' : 'http://localhost:3000';
  const token = generateSuperadminTestToken();

  it('should retrieve the list of schools and verify the initial ones', async () => {
    const res = await request(API_URL)
      .get('/api/school/getSchool')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const schoolIds = res.body.data.map((school) => school._id);
    expect(schoolIds).toContain('64b0c0c0c0c0c0c0c0c0c003');
    expect(schoolIds).toContain('64b0c0c0c0c0c0c0c0c0c004');
  });

  it('should create, update, and delete a school', async () => {
    // Step 1: Create a new school
    const createRes = await request(API_URL)
      .post('/api/school/createSchool')
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        name: 'Test School',
        address: '123 Test St',
        phone: '+1-555-0000',
      });

    expect(createRes.status).toBe(200);
    expect(createRes.body.ok).toBe(true);
    expect(createRes.body.data).toBeDefined();

    const createdSchoolId = createRes.body.data._id;
    expect(createdSchoolId).toBeDefined();

    // Step 2: Update the created school
    const updateRes = await request(API_URL)
      .patch(`/api/school/updateSchool/${createdSchoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json')
      .send({
        name: 'Updated Test School',
        address: '456 Updated St',
        phone: '+1-555-1111',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.ok).toBe(true);
    expect(updateRes.body.data).toBeDefined();
    expect(updateRes.body.data.name).toBe('Updated Test School');
    expect(updateRes.body.data.address).toBe('456 Updated St');
    expect(updateRes.body.data.phone).toBe('+1-555-1111');

    // Step 3: Delete the created school
    const deleteRes = await request(API_URL)
      .delete(`/api/school/deleteSchool/${createdSchoolId}`)
      .set('Authorization', `Bearer ${token}`)
      .set('Content-Type', 'application/json');

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.ok).toBe(true);
    expect(deleteRes.body.data.message).toContain('successfully deleted');
  });
});
