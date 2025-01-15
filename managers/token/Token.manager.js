import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import md5 from 'md5';
import logger from '../../libs/logger.js';
import User from '../entities/user/User.mongoModel.js';
import HttpError from '../../libs/errors/HttpError.js';

export default (class TokenManager {
  constructor({ config }) {
    this.config = config;
    this.longTokenExpiresIn = '3y';
    this.shortTokenExpiresIn = '1y';
    this.httpExposed = ['v1_createShortToken', 'generateToken'];
  }

  /**
   * short token are issue from long token
   * short tokens are issued for 72 hours
   * short tokens are connected to user-agent
   * short token are used on the soft logout
   * short tokens are used for account switch
   * short token represents a device.
   * long token represents a single user.
   *
   * long token contains immutable data and long lived
   * master key must exists on any device to create short tokens
   */
  genLongToken({ userId, role }) {
    return jwt.sign(
      {
        role,
        userId,
      },
      this.config.LONG_TOKEN_SECRET,
      { expiresIn: this.longTokenExpiresIn },
    );
  }

  genShortToken({ userId, role, sessionId, deviceId }) {
    return jwt.sign({ role, userId, sessionId, deviceId }, this.config.SHORT_TOKEN_SECRET, {
      expiresIn: this.shortTokenExpiresIn,
    });
  }

  _verifyToken({ token, secret }) {
    let decoded = null;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      logger.error(err);
    }
    return decoded;
  }

  verifyToken({ token }) {
    const decoded = this.verifyLongToken({ token });
    if (decoded) {
      return decoded;
    }
    return this.verifyShortToken({ token });
  }

  verifyLongToken({ token }) {
    return this._verifyToken({ token, secret: this.config.LONG_TOKEN_SECRET });
  }

  verifyShortToken({ token }) {
    return this._verifyToken({ token, secret: this.config.SHORT_TOKEN_SECRET });
  }

  /** generate shortId based on a longId */
  /**
   * @openapi
   * /api/token/v1_createShortToken:
   *   post:
   *     summary: Generate shortId based on a longId
   *     tags:
   *      - Token
   *     responses:
   *       200:
   *         description: The result token.
   */
  v1_createShortToken({ __longToken, __device }) {
    const decoded = __longToken;
    logger.info(decoded);
    const shortToken = this.genShortToken({
      userId: decoded.userId,
      role: decoded.role,
      sessionId: nanoid(),
      deviceId: md5(__device),
    });
    return { shortToken };
  }

  /**
   * @openapi
   * /api/token/generateToken:
   *   post:
   *     summary: Authenticate user and generate a JWT token.
   *     description: |
   *       This endpoint verifies the user's credentials and returns a **JWT token**
   *       containing the user's role and ID.
   *     tags:
   *       - Token
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user
   *               - password
   *             properties:
   *               user:
   *                 type: string
   *                 description: The username of the user.
   *                 example: "someuser"
   *               password:
   *                 type: string
   *                 description: The password of the user.
   *                 example: "somepassword"
   *     responses:
   *       200:
   *         description: Authentication successful. Returns a JWT token.
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 ok:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: string
   *                   description: The generated JWT token.
   *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                 errors:
   *                   type: array
   *                   description: List of possible validation errors.
   *                   example: []
   *                 message:
   *                   type: string
   *                   example: ""
   *       400:
   *         description: Bad Request. Missing required parameters.
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
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: "HttpError"
   *                     statusCode:
   *                       type: integer
   *                       example: 400
   *                 message:
   *                   type: string
   *                   example: "Missing user or password"
   *       401:
   *         description: Unauthorized. Incorrect username or password.
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
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: "HttpError"
   *                     statusCode:
   *                       type: integer
   *                       example: 401
   *                 message:
   *                   type: string
   *                   example: "Incorrect user and password"
   *       404:
   *         description: User not found.
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
   *                   type: object
   *                   properties:
   *                     name:
   *                       type: string
   *                       example: "HttpError"
   *                     statusCode:
   *                       type: integer
   *                       example: 404
   *                 message:
   *                   type: string
   *                   example: "User not found"
   */
  async generateToken({ __body }) {
    if (!__body.user || !__body.password) {
      throw new HttpError('Missing user or password', 400);
    }

    const user = await User.findOne({ username: __body.user });

    if (!user) {
      throw new HttpError('User not found', 404);
    }

    const isMatch = await user.comparePassword(__body.password);
    if (!isMatch) {
      throw new HttpError('Incorrect user and password', 401);
    }

    return this.genLongToken({ userId: user._id, role: user.role });
  }
});
