const slugify = (text) => {
  const from = 'ãàáäâẽèéëêìíïîõòóöôùúüûñç·/_,:;';
  const to = 'aaaaaeeeeeiiiiooooouuuunc------';
  const newText = text
    .split('')
    .map((letter, i) => letter.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i)));
  return newText
    .toString() // Cast to string
    .toLowerCase() // Convert the string to lowercase letters
    .trim() // Remove whitespace from both sides of a string
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/&/g, '-y-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-'); // Replace multiple - with single -
};
/**
 * check if string can be parsed to positive valid number
 * @param {*} str
 * @returns boolean
 */
const isNormalInteg = (str) => {
  const n = Math.floor(Number(str));
  return n !== Infinity && String(n) === str && n >= 0;
};
/**
 *
 * @param {*} path 'a.b.c'
 * @param {*} obj an object to extract value of
 */
const getDeepValue = (path, obj) => {
  for (let i = 0, p = path.split('.'), len = p.length; i < len; i++) {
    const level = obj[p[i]];
    if (!level) return null;
    obj = level;
  }
  return obj;
};
/**
 * @param {*} path example 'a.b.c'
 * @param {*} value what do you wanaa set at the path ex: 'hello'
 * @param {*} obj the object that will be injected the path and value
 */
const setDeepValue = ({ path, value, obj, marker }) => {
  if (!marker) marker = '.';
  const pfs = path.split(marker);
  let deepRef = obj;
  for (let i = 0; i < pfs.length; i++) {
    if (deepRef[pfs[i]] === undefined || deepRef[pfs[i]] === null) {
      deepRef[pfs[i]] = {};
    }
    if (i === pfs.length - 1) {
      deepRef[pfs[i]] = value;
    } else {
      deepRef = deepRef[pfs[i]];
    }
  }
  return obj;
};
const upCaseFirst = (string) => string.charAt(0).toUpperCase() + string.slice(1);
const nanoTime = () => Number(process.hrtime.bigint());
/* eslint-disable no-restricted-syntax, guard-for-in, no-prototype-builtins, no-continue */
const inverseObj = (obj) => {
  const retobj = {};
  for (const key in obj) {
    retobj[obj[key]] = key;
  }
  return retobj;
};
const flattenObject = (ob, marker) => {
  if (!marker) marker = '.';
  const toReturn = {};
  for (const i in ob) {
    if (!ob.hasOwnProperty(i)) continue;
    if (typeof ob[i] === 'object' && ob[i] !== null) {
      if (Array.isArray(ob[i])) {
        toReturn[i] = ob[i];
      } else {
        const flatObject = flattenObject(ob[i], marker);
        for (const x in flatObject) {
          if (!flatObject.hasOwnProperty(x)) continue;
          toReturn[i + marker + x] = flatObject[x];
        }
      }
    } else {
      toReturn[i] = ob[i];
    }
  }
  return toReturn;
};
/* eslint-enable no-restricted-syntax, guard-for-in, no-prototype-builtins, no-continue */
const arrayToObj = (arr) => {
  const keys = arr.filter((_, index) => index % 2 === 0);
  const values = arr.filter((_, index) => index % 2 !== 0);
  const obj = {};
  keys.reduce((sighting, key, index) => {
    obj[key] = values[index];
    return obj;
  }, {});
  return obj;
};
const hrTime = () => Number(process.hrtime.bigint());
const regExpEscape = (s) => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
const wildcardToRegExp = (s) => new RegExp(`^${s.split(/\*+/).map(regExpEscape).join('.*')}$`);
const match = (str, model) => wildcardToRegExp(model).test(str);
const isChance = (max) => {
  const min = 0;
  const value = Math.floor(Math.random() * (max - min + 1) + min);
  return min === value;
};
export default {
  slugify,
  getDeepValue,
  setDeepValue,
  isNormalInteg,
  upCaseFirst,
  nanoTime,
  inverseObj,
  flattenObject,
  arrayToObj,
  hrTime,
  match,
  isChance,
};
