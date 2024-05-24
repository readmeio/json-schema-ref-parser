import { describe, it, expect } from 'vitest';

import $RefParser from '../../..';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

import parsedSchema from './parsed';

describe('Schema without any $refs', () => {
  it('should parse successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/no-refs/no-refs.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/no-refs/no-refs.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(path.rel('specs/no-refs/no-refs.yaml'), path.abs('specs/no-refs/no-refs.yaml'), parsedSchema),
  );

  it('should dereference successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/no-refs/no-refs.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/no-refs/no-refs.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
  });
});
