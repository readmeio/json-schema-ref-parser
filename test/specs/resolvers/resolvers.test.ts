import { describe, it, expect, assert } from 'vitest';

import $RefParser from '../../..';
import { UnmatchedResolverError } from '../../../lib/util/errors';
import path from '../../utils/path';

import dereferencedSchema from './dereferenced';
import parsedSchema from './parsed';

describe('options.resolve', function () {
  it('should not resolve external links if "resolve.external" is disabled', async function () {
    const schema = await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: { external: false },
    });
    expect(schema).to.deep.equal(parsedSchema);
  });

  it('should throw an error for unrecognized protocols', async function () {
    try {
      await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'));
      assert.fail();
    } catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.equal('Unable to resolve $ref pointer "foo://bar.baz"');
    }
  });

  it('should use a custom resolver with static values', async function () {
    const schema = await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read: { bar: { baz: 'hello world' } },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it('should use a custom resolver that returns a value', async function () {
    const schema = await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read(_file) {
            return { bar: { baz: 'hello world' } };
          },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it('should use a custom resolver that calls a callback', async function () {
    const schema = await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: {
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read(_file, callback) {
            callback(null, { bar: { baz: 'hello world' } });
          },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  if (typeof Promise === 'function') {
    it('should use a custom resolver that returns a promise', async function () {
      const schema = await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
        resolve: {
          // A custom resolver for "foo://" URLs
          foo: {
            canRead: /^foo:\/\//i,
            read(_file) {
              return Promise.resolve({ bar: { baz: 'hello world' } });
            },
          },
        },
      });
      expect(schema).to.deep.equal(dereferencedSchema);
    });
  }

  it('should continue resolving if a custom resolver fails', async function () {
    const schema = await $RefParser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
      resolve: {
        // A custom resolver that always fails
        badResolver: {
          order: 1,
          canRead: true,
          read(_file) {
            throw new Error('BOMB!!!');
          },
        },
        // A custom resolver for "foo://" URLs
        foo: {
          canRead: /^foo:\/\//i,
          read: { bar: { baz: 'hello world' } },
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema);
  });

  it('should normalize errors thrown by resolvers', async function () {
    try {
      await $RefParser.dereference(
        { $ref: path.abs('specs/resolvers/resolvers.yaml') },
        {
          resolve: {
            // A custom resolver that always fails
            file: {
              order: 1,
              canRead: true,
              parse() {
                throw new Error('Woops');
              },
            },
          },
        },
      );
      assert.fail();
    } catch (err) {
      expect(err.constructor.name).to.equal('ResolverError');
      expect(err.message).to.contain('Error opening file');
    }
  });

  it('should throw an error if no resolver returned a result', async function () {
    try {
      await $RefParser.dereference(path.rel('specs/resolvers/resolvers.yaml'), {
        resolve: {
          http: false,
          file: {
            order: 1,
            canRead: true,
            read() {},
          },
        },
      });
      assert.fail();
    } catch (err) {
      // would time out otherwise
      expect(err.constructor.name).to.equal('ResolverError');
    }
  });

  it('should throw a grouped error if no resolver can be matched and continueOnError is true', async function () {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs('specs/resolvers/resolvers.yaml'), {
        resolve: {
          file: false,
          http: false,
        },
        continueOnError: true,
      });
      assert.fail();
    } catch (err) {
      expect(err.constructor.name).to.equal('JSONParserErrorGroup');
      expect(err.errors.length).to.equal(1);
      expect(err.errors).to.containSubset([
        {
          name: UnmatchedResolverError.name,
          message: message => message.startsWith('Could not find resolver for'),
          path: [],
          source: message => message.endsWith('specs/resolvers/resolvers.yaml'),
        },
      ]);
    }
  });
});
