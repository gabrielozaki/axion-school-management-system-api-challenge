export default (class LiveDbManager {
  constructor({ cortex }) {
    this.store = {};
    this.cortex = cortex;
    this._sub();
  }

  /** sub to other nodes */
  _sub() {
    this.cortex.sub('internal.liveDb.add', (d) => {
      this.add({ collection: d.collection, key: d.key, value: d.value, exp: d.exp, pub: false });
    });
  }

  /** publish to other nodes */
  _pub({ action, payload }) {
    this.cortex.AsyncEmitToAllOf({
      type: this.cortex.nodeType,
      call: `internal.liveDb.${action}`,
      args: payload,
    });
  }

  db(collection) {
    return {
      add: ({ key, value, exp }) => {
        return this.add({ collection, key, value, exp, pub: true });
      },
      delete: ({ key }) => {
        return this.delete({ collection, key });
      },
      get: ({ key }) => {
        return this.get({ collection, key });
      },
    };
  }

  add({ collection, key, value, exp = -1, pub = false }) {
    if (!this.store[collection]) this.store[collection] = {};
    // eslint-disable-next-line no-multi-assign
    const doc = (this.store[collection][key] = { value, exp });
    if (pub) this._pub({ action: 'add', payload: { collection, key, value, exp } });
    return doc;
  }

  /** get or null */
  get({ collection, key }) {
    const exCol = this.store[collection] || {};
    return exCol[key] || null;
  }

  delete({ collection, key }) {
    const exCol = this.store[collection] || {};
    this.delete(exCol[key]);
  }
});
