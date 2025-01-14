import Queue from 'bull';

export default class BullInstance {
  constructor(redisUrl) {
    this.redisUrl = redisUrl;
  }

  createQueue(queueName) {
    return new Queue(queueName, this.redisUrl);
  }
}
