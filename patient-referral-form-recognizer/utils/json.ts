/**
 * Sets the value of a given JSON dot notation path.
 * @param string dot notation string of JSON path to update
 * @param obj json lookup object to edit
 * @param value value to be set on this property
 * @returns updated json object
 */
export const set = (string: string, obj: any, value: string) => {
  const [current, ...rest] = string.split(".");
  rest.length >= 1
    ? set(rest.join("."), (obj[current] = obj[current] || {}), value)
    : (obj[current] = value);
  return obj;
};

/**
 * Gets the value of a given JSON dot notation path.
 * @param object json lookup object to edit
 * @param path dot notation of JSON path to update
 * @param defval default value
 * @returns json object
 */
export const get = (object: any, path: string, defval = undefined) => {
  return path
    .split(".")
    .reduce((xs, x) => (xs && xs[x] ? xs[x] : defval), object);
};

/**
 * Peform a basic object check.
 * @param item item to be checked
 * @returns {boolean} true if item is an object
 */
const isObject = (item: any) => {
  return item && typeof item === "object" && !Array.isArray(item);
};

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export const mergeDeep = (target: Object, ...sources: any) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
};
