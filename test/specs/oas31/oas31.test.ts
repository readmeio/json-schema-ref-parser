import { describe, it, expect } from 'vitest';

import $RefParser from '../../../lib';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

import dereferencedSchema from './dereferenced';
import parsedSchema from './parsed';

describe('Schema with OpenAPI 3.1 $ref description/schema overrides', () => {
  it('should parse successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/oas31/oas31.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/oas31/oas31.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(path.rel('specs/oas31/oas31.yaml'), path.abs('specs/oas31/oas31.yaml'), parsedSchema),
  );

  it('should dereference successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/oas31/oas31.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/oas31/oas31.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
  });
});
