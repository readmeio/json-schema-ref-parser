import { describe, it, expect } from 'vitest';

import $RefParser from '../../..';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

import bundledSchema from './bundled';
import dereferencedSchema from './dereferenced';
import parsedSchema from './parsed';

describe('Schema with internal $refs', () => {
  it('should parse successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/internal/internal.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/internal/internal.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(
      path.rel('specs/internal/internal.yaml'),
      path.abs('specs/internal/internal.yaml'),
      parsedSchema,
    ),
  );

  it('should dereference successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/internal/internal.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);

    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions.requiredString)
      .to.equal(schema.definitions.name.properties.first)
      .to.equal(schema.definitions.name.properties.last)
      .to.equal(schema.properties.name.properties.first)
      .to.equal(schema.properties.name.properties.last);

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/internal/internal.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
