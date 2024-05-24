import { describe, it, expect } from 'vitest';

import $RefParser from '../../..';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

import bundledSchema from './bundled';
import dereferencedSchema from './dereferenced';
import parsedSchema from './parsed';

describe('When executed in the context of root directory', () => {
  it('should parse successfully from an absolute path', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.abs('specs/absolute-root/absolute-root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/absolute-root/absolute-root.yaml')]);
  });

  it('should parse successfully from a url', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.url('specs/absolute-root/absolute-root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url('specs/absolute-root/absolute-root.yaml')]);
  });

  it(
    'should resolve successfully from an absolute path',
    helper.testResolve(
      path.abs('specs/absolute-root/absolute-root.yaml'),
      path.abs('specs/absolute-root/absolute-root.yaml'),
      parsedSchema.schema,
      path.abs('specs/absolute-root/definitions/definitions.json'),
      parsedSchema.definitions,
      path.abs('specs/absolute-root/definitions/name.yaml'),
      parsedSchema.name,
      path.abs('specs/absolute-root/definitions/required-string.yaml'),
      parsedSchema.requiredString,
    ),
  );

  it(
    'should resolve successfully from a url',
    helper.testResolve(
      path.url('specs/absolute-root/absolute-root.yaml'),
      path.url('specs/absolute-root/absolute-root.yaml'),
      parsedSchema.schema,
      path.url('specs/absolute-root/definitions/definitions.json'),
      parsedSchema.definitions,
      path.url('specs/absolute-root/definitions/name.yaml'),
      parsedSchema.name,
      path.url('specs/absolute-root/definitions/required-string.yaml'),
      parsedSchema.requiredString,
    ),
  );

  it('should dereference successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.abs('specs/absolute-root/absolute-root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);

    // Reference equality
    expect(schema.properties.name).to.equal(schema.definitions.name);
    expect(schema.definitions['required string'])
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
    const schema = await parser.bundle(path.abs('specs/absolute-root/absolute-root.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
