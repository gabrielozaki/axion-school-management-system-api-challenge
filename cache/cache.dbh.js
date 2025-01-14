import { performance } from 'perf_hooks';
import utils from '../libs/utils.js';
import { createClient } from './redis-client.js';
import logger from '../libs/logger.js';

const keyCheck = (key) => {
  if (!key) throw Error('Cache Key is missing');
};
export default ({ prefix, url }) => {
  if (!prefix || !url) throw Error('missing in memory arguments');
  /** creating inmemory client */
  const redisClient = { createClient }.createClient({
    prefix,
    url,
  });
  return {
    search: {
      /**
       *
       * @param {string} index reperesent the index name ex: 'object:index'
       */
      // eslint-disable-next-line no-shadow
      createIndex: async ({ index, prefix, schema }) => {
        if (!schema || !prefix || !index) {
          throw Error('missing args');
        }
        /** check if index already exists */
        const indices = await redisClient.call('FT._LIST');
        logger.info('indices', indices);
        /** drop index if exists */
        if (indices.includes(index)) {
          await redisClient.call('FT.DROPINDEX', index);
          /** index already exists */
        }
        const schemaArgs = [];
        const schemaKeys = Object.keys(schema);
        for (let i = 0; i < schemaKeys.length; i++) {
          const skey = schemaKeys[i];
          schemaArgs.push(skey);
          const fieldType = schema[skey].store;
          schemaArgs.push(fieldType);
          if (schema[skey].sortable) {
            schemaArgs.push('SORTABLE');
          }
        }
        const args = [
          'FT.CREATE',
          index,
          'ON',
          'hash',
          'PREFIX',
          '1',
          prefix,
          'SCHEMA',
          ...schemaArgs,
        ];
        await redisClient.call(...args);
      },
      find: async ({ query, searchIndex, populate, offset, limit }) => {
        const startTime = performance.now();
        let res = [];
        offset = offset || 0;
        limit = limit || 50;
        try {
          let args = ['FT.SEARCH', searchIndex, query, 'LIMIT', offset, limit];
          if (populate) {
            args = args.concat(['RETURN', populate.length], populate);
          }
          logger.info('search -->', args.join(' '));
          res = await redisClient.call(...args);
        } catch (error) {
          logger.error(error);
          return { error: error.message || 'unable to execute' };
        }
        const [count, ...foundKeysAndSightings] = res;
        const foundSightings = foundKeysAndSightings.filter((entry, index) => index % 2 !== 0);
        const sightings = foundSightings.map((sightingArray) => {
          const keys = sightingArray.filter((_, index) => index % 2 === 0);
          const values = sightingArray.filter((_, index) => index % 2 !== 0);
          return keys.reduce((sighting, key, index) => {
            sighting[key] = values[index];
            return sighting;
          }, {});
        });
        const endTime = performance.now();
        return {
          count,
          docs: sightings,
          time: `${Math.trunc(endTime - startTime)}ms`,
        };
      },
    },
    hyperlog: {
      add: async ({ key, items }) => {
        const args = [key].concat(items);
        try {
          await redisClient.call('PFADD', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
      count: async ({ key }) => {
        let count = 0;
        try {
          count = await redisClient.call('PFCOUNT', key);
        } catch (err) {
          logger.error(err);
        }
        return count;
      },
      merge: async ({ keys }) => {
        let count = 0;
        try {
          count = await redisClient.call('PFMERGE', ...keys);
        } catch (err) {
          logger.error(err);
        }
        return count;
      },
    },
    hash: {
      set: async ({ key, data }) => {
        const keys = Object.keys(data);
        const args = [key];
        for (let i = 0; i < keys.length; i++) {
          args.push(keys[i]);
          args.push(data[keys[i]]);
        }
        const result = await redisClient.hset(...args);
        return result;
      },
      remove: async ({ key, fields }) => {
        let args = [key];
        args = args.concat(fields);
        const result = await redisClient.hdel(...args);
        return result;
      },
      incrby: async ({ key, field, incr }) => {
        const result = await redisClient.hincrby(key, field, incr || 1);
        return result;
      },
      get: async ({ key }) => {
        const result = await redisClient.hgetall(key);
        return result;
      },
      setField: async ({ key, fieldKey, data }) => {
        const result = await redisClient.hset(key, fieldKey, data);
        return result;
      },
      getField: async ({ key, fieldKey }) => {
        const result = await redisClient.hget(key, fieldKey);
        return result;
      },
      getFields: async ({ key, fields }) => {
        const result = await redisClient.hmget(key, ...fields);
        /** resuts are retruned as an array of values with the same order of the fields */
        if (result) {
          const obj = {};
          for (let i = 0; i < fields.length; i++) {
            obj[fields[i]] = result[i];
          }
          return obj;
        }
        return result;
      },
    },
    key: {
      expire: async ({ key, expire }) => {
        const result = await redisClient.expire(key, expire);
        return result;
      },
      exists: async ({ key }) => {
        const result = await redisClient.exists(key);
        return result === 1;
      },
      delete: async ({ key }) => {
        keyCheck(key);
        let result = false;
        try {
          await redisClient.del(key);
          result = true;
          return result;
        } catch (err) {
          logger.info(`failed to get result for key ${key}`);
        }
        return result;
      },
      set: async ({ key, data, ttl }) => {
        keyCheck(key);
        let result = false;
        let args = [key, data];
        if (ttl) args = args.concat(['EX', ttl]);
        try {
          await redisClient.set(...args);
          result = true;
        } catch (err) {
          logger.error('Failed to save to reddit');
        }
        return result;
      },
      get: async ({ key }) => {
        keyCheck(key);
        let result = '';
        try {
          result = await redisClient.get(key);
        } catch (err) {
          logger.info(`failed to get result for key ${key}`);
        }
        /** redis returned string 'null' when the key is not found */
        return result;
      },
    },
    set: {
      add: async ({ key, arr }) => {
        keyCheck(key);
        const result = await redisClient.sadd(key, ...arr);
        return result;
      },
      remove: async ({ key, arr }) => {
        keyCheck(key);
        const result = await redisClient.srem(key, ...arr);
        return result;
      },
      /** get whole set */
      get: async ({ key }) => {
        const result = await redisClient.smembers(key);
        return result;
      },
    },
    sorted: {
      get: async ({ sort, key, withScores = false, start, end, _limit }) => {
        keyCheck(key);
        let res = null;
        if (!start) start = 0;
        if (!end) end = 50;
        const min = start;
        const max = end;
        let args = ['ZRANGE'];
        args = args.concat([key, min, max]);
        if (!sort) sort = 'H2L';
        if (sort.toUpperCase() === 'H2L') {
          args.push('REV');
        }
        if (withScores) args.push('WITHSCORES');
        try {
          res = await redisClient.call(...args);
        } catch (err) {
          return { error: err.message ? err.message : err };
        }
        if (withScores) res = utils.arrayToObj(res);
        return res || [];
      },
      update: async ({ key, scores }) => {
        const args = [key].concat(scores);
        try {
          await redisClient.call('ZADD', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
      addIfNotExists: async ({ key, scores }) => {
        const args = [key, 'NX'].concat(scores);
        try {
          await redisClient.call('ZADD', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
      set: async ({ key, scores }) => {
        const args = [key].concat(scores);
        try {
          await redisClient.call('ZADD', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
      incrBy: async ({ key, field, score }) => {
        const args = [key, score, field];
        try {
          await redisClient.call('ZINCRBY', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
      remove: async ({ key, field }) => {
        const args = [key, field];
        try {
          await redisClient.call('ZREM', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
      getRandom: async ({ key, count }) => {
        const args = [key, count];
        try {
          await redisClient.call('ZRANDMEMBER', ...args);
        } catch (err) {
          logger.error(err);
        }
      },
    },
  };
  // return {
  //     getTimeSeries: async({
  //         key
  //     })=>{
  //         keyCheck(key);
  //         let result = [];
  //         key = prefix+":"+key;
  //         try{
  //             result = await redisClient.call('TS.GET', key);
  //         } catch(err){
  //             logger.info(`!${key} not found. restart the cluster.`);
  //         }
  //         return result;
  //     },
  //     // addToTimeSeries: async({
  //     // }),
  //     appendTimeSeries: async({
  //         ktv // array of arrays key value timestamp array
  //     })=>{
  //         //an array of key value and timestamp
  //         let args = [];
  //         ktv.forEach(i=>{
  //             i[0]=prefix+":"+i[0];
  //             args = args.concat(i);
  //         });
  //         await redisClient.call('TS.MADD', ...args);
  //     },
  //     createTimeSeries: async({
  //         key,
  //         retention,
  //         labels, //key value
  //     })=>{
  //         try {
  //             let labelsArr = [];
  //             Object.keys(labels).forEach(i=>labelsArr.push(i, labels[i]));
  //             await redisClient.call('TS.CREATE', prefix+":"+key,  'RETENTION', retention, ...labelsArr);
  //         } catch(err){
  //             logger.info('timeseries key already exists');
  //         }
  //     },
  //     getMulti: async ({ keys }) => {
  //         if (!keys || keys.length == 0) return;
  //         let results = await redisClient.mget(keys);
  //         return results || [];
  //     },
  //     incrby: async ({ key, n }) => {
  //         let result = await redisClient.incrby(key, n || 1);
  //         return result;
  //     },
  //     setCounter: async ({ key, counter, expire }) => {
  //         let args = [key, counter];
  //         if (expire) args = args.concat(['EX', expire]);
  //         let result = await redisClient.set(...args);
  //         return result;
  //     },
  //     pushOne: async ({ key, data }) => {
  //         keyCheck(key);
  //         let r = await redisClient.lpush(key, data);
  //         return r;
  //     },
  //     limitList: async ({ key, limit }) => {
  //         keyCheck(key);
  //         let r = await redisClient.ltrim(key, 0, limit);
  //         return r;
  //     },
  //     getList: async ({ key, from, to }) => {
  //         keyCheck(key);
  //         let r = await redisClient.lrange(key, from, to);
  //         return r;
  //     },
  //     getFullSorted: async ({ key }) => {
  //         keyCheck(key);
  //         let r = null;
  //         try {
  //             r = await redisClient.zrange(key, '0', '-1');
  //         } catch(err){
  //             logger.error(err);
  //         }
  //         return r;
  //     },
  //     addToSet: async ({ key, data }) => {
  //         keyCheck(key);
  //         let result = await redisClient.sadd(key, data);
  //         return result;
  //     },
  //     getSetLength: async ({ key }) => {
  //         let result = await redisClient.scard(key);
  //         return result;
  //     },
  //     getSet: async ({ key }) => {
  //         let result = await redisClient.smembers(key);
  //         return result;
  //     },
  //     setHas: async({key, data})=>{
  //         let result = await redisClient.sismember(key, data);
  //         return result
  //     },
  //     removeSortedMember: async({key, member})=>{
  //         logger.info(`_removeSortedMember-redis------- key: ${key} member: ${member}`)
  //         keyCheck(key);
  //         let args = [key, member];
  //         try {
  //             await redisClient.zrem(...args);
  //         } catch (err) {
  //             logger.error(err);
  //             logger.info(`failed to removeSortedMember for key ${key}`);
  //         }
  //     },
  //     incrSortedMember: async({key, member, score})=>{
  //         keyCheck(key);
  //         let args = [key, score, member];
  //         try {
  //             await redisClient.zincrby(...args);
  //         } catch (err) {
  //             logger.error(err);
  //             logger.info(`failed to incrSortedMember for key ${key}`);
  //         }
  //     },
  //     getSortedMemberScore: async({key, member})=>{
  //         keyCheck(key);
  //         let args = [key, member];
  //         let score = false;
  //         try {
  //             score = await redisClient.zscore(...args);
  //         } catch (err) {
  //             logger.error(err);
  //             logger.info(`failed to incrSortedMember for key ${key}`);
  //         }
  //         return score;
  //     },
  //     getLowestScore: async({key})=>{
  //         keyCheck(key);
  //         let args = [key, '-inf', '+inf', 'withScoresS', 'LIMIT', '0', '1'];
  //         let result = null
  //         try {
  //             let out = await redisClient.zrangebyscore(...args);
  //             if(out){
  //                 result = {member: out[0], score: parseInt(out[1])};
  //             }
  //         } catch (err) {
  //             logger.error(err);
  //             logger.info(`failed to getLowestScore for key ${key}`);
  //         }
  //         return result;
  //         // ZRANGEBYSCORE myset -inf +inf withScoresS LIMIT 0 1
  //     },
  //     addToSortedList: async ({ key, list }) => {
  //         keyCheck(key);
  //         let args = [key];
  //         list.forEach(i => {
  //             args.push(i.score);
  //             args.push(i.member);
  //         });
  //         try {
  //             await redisClient.zadd(...args);
  //         } catch (err) {
  //             logger.error(err);
  //             logger.info(`failed to list for key ${key}`);
  //         }
  //     },
  //     addStream: async({key, json})=>{
  //         keyCheck(key);
  //         key = prefix+":"+key;
  //         let flatten = utils.flattenObject(json);
  //         if(flatten.length==0)return;
  //         let args = [key, '*'].concat(flatten);
  //         try {
  //             await redisClient.call('XADD', ...args);
  //         } catch(err){
  //             logger.error(err);
  //         }
  //     },
  //     readStreamLast: async({key, count})=>{
  //         keyCheck(key);
  //         key=prefix+":"+key;
  //         let args = [key, '+', '-', 'COUNT', count||1]
  //         let result = null;
  //         try {
  //             result = await redisClient.call('XREVRANGE', ...args);
  //         } catch(err){
  //             logger.error(err);
  //         }
  //         return result;
  //     },
  // }
};
