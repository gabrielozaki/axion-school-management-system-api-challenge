import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import md5 from 'md5';
import logger from '../../../libs/logger.js';

export default (class TokenManager {
  constructor({ config }) {
    this.config = config;
    this.longTokenExpiresIn = '3y';
    this.shortTokenExpiresIn = '1y';
    this.userExposed = ['v1_createShortToken']; // exposed functions
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

  verifyLongToken({ token }) {
    return this._verifyToken({ token, secret: this.config.LONG_TOKEN_SECRET });
  }

  verifyShortToken({ token }) {
    return this._verifyToken({ token, secret: this.config.SHORT_TOKEN_SECRET });
  }

  /** generate shortId based on a longId */
  v1_createShortToken({ __headers, __device }) {
    const { token } = __headers;
    if (!token) return { error: 'missing token ' };
    logger.info('found token', token);
    const decoded = this.verifyLongToken({ token });
    if (!decoded) {
      return { error: 'invalid' };
    }
    const shortToken = this.genShortToken({
      userId: decoded.userId,
      role: decoded.role,
      sessionId: nanoid(),
      deviceId: md5(__device),
    });
    return { shortToken };
  }
});
