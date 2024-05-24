import { describe, it, expect, assert } from 'vitest';

import $RefParser from '../../../lib';
import { JSONParserErrorGroup, InvalidPointerError } from '../../../lib/util/errors';
import path from '../../utils/path';

describe('Schema with invalid pointers', () => {
  it('should throw an error for an invalid pointer', async () => {
    try {
      await $RefParser.dereference(path.rel('specs/invalid-pointers/invalid.json'));
      assert.fail();
    } catch (err) {
      expect(err.constructor.name).to.equal('InvalidPointerError');
      expect(err.message).to.contain('Invalid $ref pointer "./invalid.json#f". Pointers must begin with "#/"');
    }
  });

  it('should throw an error for an invalid reference', async () => {
    try {
      await $RefParser.dereference(path.rel('specs/invalid-pointers/invalid-reference.json'));
      assert.fail();
    } catch (err) {
      expect(err.constructor.name).to.equal('InvalidPointerError');
      expect(err.message).to.contain('Invalid $ref pointer "#components/". Pointers must begin with "#/"');
    }
  });

  it('should throw a grouped error for an invalid pointer if continueOnError is true', async () => {
    const parser = new $RefParser();
    try {
      await parser.dereference(path.rel('specs/invalid-pointers/invalid.json'), { continueOnError: true });
      assert.fail();
    } catch (err) {
      expect(err.constructor.name).to.equal('JSONParserErrorGroup');
      expect(err.files).to.equal(parser);
      expect(err.message).to.equal(
        `1 error occurred while reading '${path.abs('specs/invalid-pointers/invalid.json')}'`,
      );
      expect(err.errors).to.containSubset([
        {
          name: InvalidPointerError.name,
          message: 'Invalid $ref pointer "f". Pointers must begin with "#/"',
          path: ['foo'],
          source: path.unixify(path.abs('specs/invalid-pointers/invalid.json')),
        },
      ]);
    }
  });
});
