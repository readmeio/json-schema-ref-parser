import { describe, it, expect, assert } from 'vitest';

import $RefParser from '../../..';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

import bundledSchema from './bundled';
import dereferencedSchema from './dereferenced';
import parsedSchema from './parsed';

describe('Schema with circular (recursive) external $refs', () => {
  it('should parse successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.parse(path.rel('specs/circular-external/circular-external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(parsedSchema.schema);
    expect(parser.$refs.paths()).to.deep.equal([path.abs('specs/circular-external/circular-external.yaml')]);

    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it(
    'should resolve successfully',
    helper.testResolve(
      path.rel('specs/circular-external/circular-external.yaml'),
      path.abs('specs/circular-external/circular-external.yaml'),
      parsedSchema.schema,
      path.abs('specs/circular-external/definitions/pet.yaml'),
      parsedSchema.pet,
      path.abs('specs/circular-external/definitions/child.yaml'),
      parsedSchema.child,
      path.abs('specs/circular-external/definitions/parent.yaml'),
      parsedSchema.parent,
      path.abs('specs/circular-external/definitions/person.yaml'),
      parsedSchema.person,
    ),
  );

  it('should dereference successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/circular-external/circular-external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(dereferencedSchema);

    // The "circular" flag should be set
    expect(parser.$refs.circular).to.equal(true);
    expect(parser.$refs.circularRefs).to.have.length(3);
    expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');
    expect(parser.$refs.circularRefs[1]).to.contain('#/properties/spouse');
    expect(parser.$refs.circularRefs[2]).to.contain('#/properties/parents/items');

    // Reference equality
    expect(schema.definitions.person.properties.spouse).to.equal(schema.definitions.person);
    expect(schema.definitions.parent.properties.children.items).to.equal(schema.definitions.child);
    expect(schema.definitions.child.properties.parents.items).to.equal(schema.definitions.parent);
  });

  it('should throw an error if "options.$refs.circular" is false', async () => {
    const parser = new $RefParser();

    try {
      await parser.dereference(path.rel('specs/circular-external/circular-external.yaml'), {
        dereference: { circular: false },
      });
      assert.fail();
    } catch (err) {
      // A ReferenceError should have been thrown
      expect(err).to.be.an.instanceOf(ReferenceError);
      expect(err.message).to.contain('Circular $ref pointer found at ');
      expect(err.message).to.contain('specs/circular-external/circular-external.yaml#/definitions/thing');

      // $Refs.circular should be true
      expect(parser.$refs.circular).to.equal(true);
      expect(parser.$refs.circularRefs).to.have.length(1);
      expect(parser.$refs.circularRefs[0]).to.contain('#/definitions/thing');
    }
  });

  it('should bundle successfully', async () => {
    const parser = new $RefParser();
    const schema = await parser.bundle(path.rel('specs/circular-external/circular-external.yaml'));
    expect(schema).to.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);

    // The "circular" flag should NOT be set
    // (it only gets set by `dereference`)
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });
});
