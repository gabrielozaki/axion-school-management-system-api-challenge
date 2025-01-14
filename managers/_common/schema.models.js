import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const emojis = require('../../public/emojis.data.json');

export const id = {
  path: 'id',
  type: 'string',
  length: { min: 1, max: 50 },
};
export const username = {
  path: 'username',
  type: 'string',
  length: { min: 3, max: 20 },
  custom: 'username',
};
export const password = {
  path: 'password',
  type: 'string',
  length: { min: 8, max: 100 },
};
export const email = {
  path: 'email',
  type: 'string',
  length: { min: 3, max: 100 },
  regex:
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
};
export const title = {
  path: 'title',
  type: 'string',
  length: { min: 3, max: 300 },
};
export const label = {
  path: 'label',
  type: 'string',
  length: { min: 3, max: 100 },
};
export const shortDesc = {
  path: 'desc',
  type: 'string',
  length: { min: 3, max: 300 },
};
export const longDesc = {
  path: 'desc',
  type: 'string',
  length: { min: 3, max: 2000 },
};
export const url = {
  path: 'url',
  type: 'string',
  length: { min: 9, max: 300 },
};
export const emoji = {
  path: 'emoji',
  type: 'Array',
  items: {
    type: 'string',
    length: { min: 1, max: 10 },
    oneOf: emojis.value,
  },
};
export const price = {
  path: 'price',
  type: 'number',
};
export const avatar = {
  path: 'avatar',
  type: 'string',
  length: { min: 8, max: 100 },
};
export const text = {
  type: 'String',
  length: { min: 3, max: 15 },
};
export const longText = {
  type: 'String',
  length: { min: 3, max: 250 },
};
export const paragraph = {
  type: 'String',
  length: { min: 3, max: 10000 },
};
export const phone = {
  type: 'String',
  length: 13,
};
export const number = {
  type: 'Number',
  length: { min: 1, max: 6 },
};
export const arrayOfStrings = {
  type: 'Array',
  items: {
    type: 'String',
    length: { min: 3, max: 100 },
  },
};
export const obj = {
  type: 'Object',
};
export const bool = {
  type: 'Boolean',
};
export default {
  id,
  username,
  password,
  email,
  title,
  label,
  shortDesc,
  longDesc,
  url,
  emoji,
  price,
  avatar,
  text,
  longText,
  paragraph,
  phone,
  number,
  arrayOfStrings,
  obj,
  bool,
};
