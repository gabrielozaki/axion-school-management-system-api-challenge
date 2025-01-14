import glob from 'glob';

export default (pattern) => {
  const files = glob.sync(pattern);
  const modules = [];
  files.forEach((_) => {});
  return modules;
};
