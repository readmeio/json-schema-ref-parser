const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const bundledSchema = require('./bundled');
const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with external $refs', function () {
  it('should parse successfully from an absolute path', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.abs('specs/external/external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/external/external.yaml')]);
  });

  it('should parse successfully from a relative path', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/external/external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/external/external.yaml')]);
  });

  it('should parse successfully from a url', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.url('specs/external/external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.url('specs/external/external.yaml')]);
  });

  it(
    'should resolve successfully from an absolute path',
    helper.testResolve(
      path.abs('specs/external/external.yaml'),
      path.abs('specs/external/external.yaml'),
      parsedSchema.schema,
      path.abs('specs/external/definitions/definitions.json'),
      parsedSchema.definitions,
      path.abs('specs/external/definitions/name.yaml'),
      parsedSchema.name,
      path.abs('specs/external/definitions/required-string.yaml'),
      parsedSchema.requiredString,
    ),
  );

  it(
    'should resolve successfully from a relative path',
    helper.testResolve(
      path.rel('specs/external/external.yaml'),
      path.abs('specs/external/external.yaml'),
      parsedSchema.schema,
      path.abs('specs/external/definitions/definitions.json'),
      parsedSchema.definitions,
      path.abs('specs/external/definitions/name.yaml'),
      parsedSchema.name,
      path.abs('specs/external/definitions/required-string.yaml'),
      parsedSchema.requiredString,
    ),
  );

  it(
    'should resolve successfully from a url',
    helper.testResolve(
      path.url('specs/external/external.yaml'),
      path.url('specs/external/external.yaml'),
      parsedSchema.schema,
      path.url('specs/external/definitions/definitions.json'),
      parsedSchema.definitions,
      path.url('specs/external/definitions/name.yaml'),
      parsedSchema.name,
      path.url('specs/external/definitions/required-string.yaml'),
      parsedSchema.requiredString,
    ),
  );

  it('should dereference successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/external/external.yaml'));
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

  it('should bundle successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/external/external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
