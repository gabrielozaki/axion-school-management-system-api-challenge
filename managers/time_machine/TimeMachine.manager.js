import logger from '../../libs/logger.js';

export default (class TimeMachine {
  // eslint-disable-next-line no-unused-vars
  constructor({ cortex, config, managers, oyster, bull }) {
    this.cortex = cortex;
    this.oyster = oyster;
    this.cortexExposed = ['removeInitialScoreByTime', 'dailyDecreasePostScore', 'mixTopics'];

    // create one queue per function
    this.removeScoreQueue = bull.createQueue('removeInitialScoreByTimeQueue');
    this.decreaseScoreQueue = bull.createQueue('dailyDecreasePostScoreQueue');

    // configure a worker to each queue
    this.removeScoreQueue.process(async (job) => {
      const { createdPost, darbId, iterations, interval, decrease } = job.data;
      await this.removeInitialScoreByTime({ createdPost, darbId, iterations, interval, decrease });
    });

    this.decreaseScoreQueue.process(async (job) => {
      const { createdPost, darbId, iterations, interval } = job.data;
      await this.dailyDecreasePostScore({ createdPost, darbId, iterations, interval });
    });
  }

  async removeInitialScoreByTime({ createdPost, darbId, iterations, interval, decrease }) {
    await this.oyster.call('update_relations', {
      _id: `topic:${darbId}|${createdPost.topic}`,
      incrBy: {
        _members: [`${createdPost._id}~-${decrease}:!`],
      },
    });
    logger.info(iterations);
    iterations -= 1;
    if (iterations > 0) {
      await this.removeScoreQueue.add(
        { createdPost, darbId, iterations, interval, decrease },
        { delay: interval },
      );
    }
  }

  async dailyDecreasePostScore({ darbId, createdPost, interval, iterations }) {
    const topicId = `topic:${darbId}|${createdPost.topic}`;
    const currentScore = await this.oyster.call('relation_score', {
      relation: '_members',
      _id: topicId,
      items: [createdPost._id],
    });
    const dailyDecrease = Math.floor(parseInt(currentScore[createdPost._id], 10) * 0.05);
    this.oyster.call('update_relations', {
      _id: `topic:${darbId}|${createdPost.topic}`,
      incrBy: {
        _members: [`${createdPost._id}~-${dailyDecrease}:!`],
      },
    });
    iterations -= 1;
    if (iterations > 0) {
      await this.decreaseScoreQueue.add(
        { createdPost, darbId, iterations, interval },
        { delay: interval },
      );
    }
  }

  async mixTopics({ darbId }) {
    const mixTopic = `topic:${darbId.split(':')[1]}|mix`;
    const topics = await this.oyster.call('nav_relation', {
      relation: '_members',
      label: 'topic',
      _id: 'darb:m1cSJ2Xei',
      sort: 'h2l',
      withScores: true,
    });
    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const topic of Object.keys(topics)) {
      const posts = await this.oyster.call('nav_relation', {
        relation: '_members',
        label: 'post',
        _id: topic,
        sort: 'h2l',
        withScores: true,
      });
      const postKeys = Object.keys(posts);
      if (postKeys.length !== 0) {
        const trimmedPosts = postKeys.splice(0, Math.ceil(postKeys.length * 0.15));
        this.oyster.call('update_relations', { _id: mixTopic, add: { _members: trimmedPosts } });
      }
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */
  }

  async interceptor({ data, cb, _meta, fnName }) {
    if (this.cortexExposed.includes(fnName)) {
      const result = await this[`${fnName}`](data);
      cb(result);
    } else {
      cb({ error: `${fnName} is not executable` });
    }
  }
});
