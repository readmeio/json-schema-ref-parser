import { describe, it, expect, assert } from 'vitest';

import $RefParser from '../../..';
import * as helper from '../../utils/helper';
import path from '../../utils/path';

import dereferencedSchema from './dereferenced';
import parsedSchema from './parsed';

describe('Blank files', () => {
  describe('main file', () => {
    it('should throw an error for a blank YAML file', async () => {
      try {
        await $RefParser.parse(path.rel('specs/blank/files/blank.yaml'));
        assert.fail();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('blank/files/blank.yaml');
        expect(err.message).to.contain('is not a valid JSON Schema');
      }
    });

    it('should throw a different error if "parse.yaml.allowEmpty" is disabled', async () => {
      try {
        await $RefParser.parse(path.rel('specs/blank/files/blank.yaml'), { parse: { yaml: { allowEmpty: false } } });
        assert.fail();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('blank/files/blank.yaml');
        expect(err.message).to.contain('Parsed value is empty');
      }
    });

    it('should throw an error for a blank JSON file', async () => {
      try {
        await $RefParser.parse(path.rel('specs/blank/files/blank.json'), { parse: { json: { allowEmpty: false } } });
        assert.fail();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('blank/files/blank.json');
      }
    });
  });

  describe('referenced files', () => {
    it('should parse successfully', async () => {
      const schema = await $RefParser.parse(path.rel('specs/blank/blank.yaml'));
      expect(schema).to.deep.equal(parsedSchema.schema);
    });

    it(
      'should resolve successfully',
      helper.testResolve(
        path.rel('specs/blank/blank.yaml'),
        path.abs('specs/blank/blank.yaml'),
        parsedSchema.schema,
        path.abs('specs/blank/files/blank.yaml'),
        parsedSchema.yaml,
        path.abs('specs/blank/files/blank.json'),
        parsedSchema.json,
        path.abs('specs/blank/files/blank.txt'),
        parsedSchema.text,
        path.abs('specs/blank/files/blank.png'),
        parsedSchema.binary,
        path.abs('specs/blank/files/blank.foo'),
        parsedSchema.unknown,
      ),
    );

    it('should dereference successfully', async () => {
      const schema = await $RefParser.dereference(path.rel('specs/blank/blank.yaml'));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it('should bundle successfully', async () => {
      const schema = await $RefParser.bundle(path.rel('specs/blank/blank.yaml'));
      schema.binary = helper.convertNodeBuffersToPOJOs(schema.binary);
      expect(schema).to.deep.equal(dereferencedSchema);
    });

    it('should throw an error if "allowEmpty" is disabled', async () => {
      try {
        await $RefParser.dereference(path.rel('specs/blank/blank.yaml'), { parse: { binary: { allowEmpty: false } } });
        assert.fail();
      } catch (err) {
        expect(err).to.be.an.instanceOf(SyntaxError);
        expect(err.message).to.contain('Error parsing ');
        expect(err.message).to.contain('blank/files/blank.png');
        expect(err.message).to.contain('Parsed value is empty');
      }
    });
  });
});
