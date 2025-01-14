import loader from './_common/fileLoader.js';

export default (class ResourceMeshLoader {
  constructor(injectable) {
    this.nodes = {};
    this.injectable = injectable;
  }

  load() {
    this.nodes = loader('./mws/**/*.rnode.js');
    /** validate nodes */
    return this.nodes;
  }
});
