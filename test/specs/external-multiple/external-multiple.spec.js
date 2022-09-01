const { expect } = require('chai');

const $RefParser = require('../../..');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const bundledSchema = require('./bundled');
const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

describe('Schema with multiple external $refs to different parts of a file', function () {
  it('should parse successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.parse(path.abs('specs/external-multiple/external-multiple.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/external-multiple/external-multiple.yaml')]);
  });

  it(
    'should resolve successfully',
    helper.testResolve(
      path.rel('specs/external-multiple/external-multiple.yaml'),
      path.abs('specs/external-multiple/external-multiple.yaml'),
      parsedSchema.schema,
      path.abs('specs/external-multiple/definitions.yaml'),
      parsedSchema.definitions
    )
  );

  it('should dereference successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/external-multiple/external-multiple.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);
    // Reference equality
    expect(schema.properties.user.example).to.equal(schema.example.user);
    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
  });

  it('should bundle successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/external-multiple/external-multiple.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
