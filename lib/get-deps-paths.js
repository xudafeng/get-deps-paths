'use strict';

const fs = require('fs');
const path = require('path');

const nodeModulesRE = /\/node_modules\//;
const cwd = process.cwd();

module.exports = (root = cwd, opts = {}) => {
  let next;
  if (!path.isAbsolute(root)) {
    throw Error('`root` argument must be an absolute path');
  }
  if (opts.ignore == null) {
    opts.ignore = /^$/;
  }
  const paths = [];
  let queue = [root];
  const visited = new Set(queue);
  // Search the "node_modules" of the given package.
  const search = (root) => {
    const depsDir = path.join(root, 'node_modules');
    if (!fs.existsSync(depsDir)) {
      return;
    }
    let pack = path.join(root, 'package.json');
    try {
      pack = require(pack);
    } catch (error) {
      return typeof opts.onError === 'function' ? opts.onError(error) : void 0;
    }
    // We only care about non-dev dependencies.
    const deps = {
      ...pack.dependencies,
      ...pack.optionalDependencies,
    };

    const addPath = (dep) => {
      var target;
      if (!fs.lstatSync(dep).isSymbolicLink()) {
        return;
      }
      try {
        target = fs.realpathSync.native(dep);
      } catch (error) {
        return typeof opts.onError === "function" ? opts.onError(error) : void 0;
      }
      // Skip target paths with "/node_modules/" in them.
      if (nodeModulesRE.test(target)) {
        return typeof opts.onError === "function" ? opts.onError(new Error(`Target path cannot contain /node_modules/: '${dep}'`)) : void 0;
      }
      if (opts.preserveLinks) {
        paths.push(dep);
      }
      if (!visited.has(target)) {
        visited.add(target);
        if (!opts.preserveLinks) {
          paths.push(target);
        }
        queue.push(dep);
      }
    };
    // Search the "node_modules" directory.
    return fs.readdirSync(depsDir).forEach(function(name) {
      var scope;
      if (name[0] === '.') { // Skip hidden directories.
        return;
      }
      if (name[0] === '@') {
        scope = name;
        fs.readdirSync(path.join(depsDir, name)).forEach(function(name) {
          name = scope + '/' + name;
          if (deps[name] && !opts.ignore.test(name)) {
            return addPath(path.join(depsDir, name));
          }
        });
      } else if (deps[name] && !opts.ignore.test(name)) {
        addPath(path.join(depsDir, name));
      }
    });
  };
  // Perform a breadth-first search.
  while (queue.length) {
    next = queue;
    queue = [];
    next.forEach(search);
  }
  return paths;
};
