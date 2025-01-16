import request from 'supertest';

describe('Token API', () => {
  const API_URL =
    process.env.TEST_ENV === 'container' ? 'http://axion_server:3000' : 'http://localhost:3000';

  it('should generate a JWT token for valid credentials', async () => {
    const res = await request(API_URL)
      .post('/api/token/generateToken')
      .set('Content-Type', 'application/json')
      .send({
        user: 'superadmin',
        password: 'superadminpassword',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data).toBe('string');
  });
});
