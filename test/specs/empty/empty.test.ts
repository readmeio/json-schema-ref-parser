/* eslint-disable no-unused-expressions */
import { describe, it, expect, assert } from 'vitest';

import $RefParser from '../../../lib';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

describe('Empty schema', () => {
  it('should parse successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/empty/empty.json'));
    expect(schema).to.be.an('object');
    expect(schema).to.be.empty;
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(path.rel('specs/empty/empty.json'), path.abs('specs/empty/empty.json'), {}),
  );

  it('should dereference successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/empty/empty.json'));
    expect(schema).to.be.an('object');
    expect(schema).to.be.empty;
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/empty/empty.json'));
    expect(schema).to.be.an('object');
    expect(schema).to.be.empty;
    expect(parser.schema).to.equal(schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/empty/empty.json')]);
  });

  it('should throw an error if "parse.json.allowEmpty" is disabled', async () => {
    try {
      await $RefParser.parse(path.rel('specs/empty/empty.json'), { parse: { json: { allowEmpty: false } } });
      assert.fail();
    } catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.contain('Error parsing ');
      expect(err.message).to.contain('empty/empty.json"');
      expect(err.message).to.contain('Parsed value is empty');
    }
  });
});
