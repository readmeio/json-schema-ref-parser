const nodePath = require('path');
const nodeUrl = require('url');

const { host } = require('@jsdevtools/host-environment');

const testsDir = nodePath.resolve(__dirname, '..');

// Run all tests from the "test" directory
// eslint-disable-next-line vitest/require-hook
process.chdir(nodePath.join(__dirname, '..'));

const path = {
  /**
   * Returns the relative path of a file in the "test" directory
   */
  rel(file) {
    return nodePath.normalize(file);
  },

  /**
   * Returns the absolute path of a file in the "test" directory
   */
  abs(file) {
    return nodePath.join(testsDir, file || nodePath.sep);
  },

  /**
   * Returns the path with normalized, UNIX-like, slashes. Disk letter is lower-cased, if present.
   */
  unixify(file) {
    return file.replace(/\\/g, '/').replace(/^[A-Z](?=:\/)/, letter => letter.toLowerCase());
  },

  /**
   * Returns the path of a file in the "test" directory as a URL.
   * (e.g. "file://path/to/json-schema-ref-parser/test/files...")
   */
  url(file) {
    let pathname = path.abs(file);

    if (host.os.windows) {
      pathname = pathname.replace(/\\/g, '/'); // Convert Windows separators to URL separators
    }

    return nodeUrl.format({
      protocol: 'file:',
      slashes: true,
      pathname,
    });
  },

  /**
   * Returns the absolute path of the current working directory.
   */
  cwd() {
    return nodePath.join(process.cwd(), nodePath.sep);
  },
};

module.exports = path;
