import { host } from '@jsdevtools/host-environment';
import { describe, it, expect, assert } from 'vitest'

import $RefParser from '../../..';
import { InvalidPointerError, ResolverError, MissingPointerError } from '../../../lib/util/errors';
import path from '../../utils/path';

// Some tests tests don't support Windows file paths that contain spaces.
const shouldSkipWindows = host.node && host.os.windows && path.cwd().includes(' ');

describe('Report correct error source and path for', () => {
  it('schema with broken reference', async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference({ foo: { bar: { $ref: 'I do not exist' } } }, { continueOnError: true });
      assert.fail();
    } catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: source => typeof source === 'string',
          path: ['foo', 'bar'],
          message: message => typeof message === 'string',
        },
      ]);
    }
  });

  it.skipIf(shouldSkipWindows)('schema with a local reference pointing at property with broken external reference', async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs('specs/error-source/broken-external.json'), { continueOnError: true });
      assert.fail();
    } catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: ResolverError.name,
          source: path.unixify(path.abs('specs/error-source/broken-external.json')),
          path: ['components', 'schemas', 'testSchema', 'properties', 'test'],
          message: message => typeof message === 'string',
        },
      ]);
    }
  });

  it.skipIf(shouldSkipWindows)(
    'schema with a missing local pointer and reference pointing at external file with broken external',
    async () => {
      const parser = new $RefParser();
      try {
        await parser.dereference(path.abs('specs/error-source/invalid-external.json'), { continueOnError: true });
        assert.fail();
      } catch (err) {
        expect(err.errors).to.containSubset([
          {
            name: MissingPointerError.name,
            source: path.unixify(path.abs('specs/error-source/invalid-external.json')),
            path: ['foo', 'bar'],
            message: message => typeof message === 'string',
          },
          {
            name: ResolverError.name,
            source: path.unixify(path.abs('specs/error-source/broken-external.json')),
            path: ['components', 'schemas', 'testSchema', 'properties', 'test'],
            message: message => typeof message === 'string',
          },
        ]);
      }
    },
  );

  it.skipIf(shouldSkipWindows)('schema with an invalid pointer', async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.abs('specs/error-source/invalid-pointer.json'), { continueOnError: true });
      assert.fail();
    } catch (err) {
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          source: path.unixify(path.abs('specs/error-source/invalid-pointer.json')),
          path: ['foo', 'baz'],
          message: message => typeof message === 'string',
        },
      ]);
    }
  });
});
