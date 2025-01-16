import jwt from 'jsonwebtoken';

export function generateSuperadminTestToken() {
  return jwt.sign(
    {
      role: 'superadmin',
      userId: '64b0c0c0c0c0c0c0c001',
    },
    'supersecrettokenlong',
    { expiresIn: '1h' },
  );
}

export function generateSchooladministratorTestToken() {
  return jwt.sign(
    {
      role: 'schooladministrator',
      userId: '64b0c0c0c0c0c0c0c002',
    },
    'supersecrettokenlong',
    { expiresIn: '1h' },
  );
}

export default { generateSuperadminTestToken, generateSchooladministratorTestToken };
