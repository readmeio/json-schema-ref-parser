const chai = require('chai');
const chaiSubset = require('chai-subset');

const $RefParser = require('../../..');
const { JSONParserErrorGroup, ParserError, UnmatchedParserError } = require('../../../lib/util/errors');
const helper = require('../../utils/helper');
const path = require('../../utils/path');

const dereferencedSchema = require('./dereferenced');
const parsedSchema = require('./parsed');

const { expect } = chai;
chai.use(chaiSubset);

describe('References to non-JSON files', function () {
  it('should parse successfully', async function () {
    const schema = await $RefParser.parse(path.rel('specs/parsers/parsers.yaml'));
    expect(schema).to.deep.equal(parsedSchema.schema);
  });

  it(
    'should resolve successfully',
    helper.testResolve(
      path.rel('specs/parsers/parsers.yaml'),
      path.abs('specs/parsers/parsers.yaml'),
      parsedSchema.schema,
      path.abs('specs/parsers/files/README.md'),
      dereferencedSchema.defaultParsers.definitions.markdown,
      path.abs('specs/parsers/files/page.html'),
      dereferencedSchema.defaultParsers.definitions.html,
      path.abs('specs/parsers/files/style.css'),
      dereferencedSchema.defaultParsers.definitions.css,
      path.abs('specs/parsers/files/binary.png'),
      dereferencedSchema.defaultParsers.definitions.binary,
      path.abs('specs/parsers/files/unknown.foo'),
      dereferencedSchema.defaultParsers.definitions.unknown,
      path.abs('specs/parsers/files/empty'),
      dereferencedSchema.defaultParsers.definitions.empty
    )
  );

  it('should dereference successfully', async function () {
    const parser = new $RefParser();
    const schema = await parser.dereference(path.rel('specs/parsers/parsers.yaml'));
    expect(schema).to.equal(parser.schema);
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);

    // The "circular" flag should NOT be set
    expect(parser.$refs.circular).to.equal(false);
    expect(parser.$refs.circularRefs).to.have.length(0);
  });

  it('should bundle successfully', async function () {
    const schema = await $RefParser.bundle(path.rel('specs/parsers/parsers.yaml'));
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it('should parse text as binary if "parse.text" is disabled', async function () {
    const schema = await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
      parse: {
        // Disable the text parser
        text: false,
        // Parse all non-YAML files as binary
        binary: {
          canParse(file) {
            return file.url.substr(-5) !== '.yaml';
          },
        },
      },
    });
    schema.definitions.markdown = helper.convertNodeBuffersToPOJOs(schema.definitions.markdown);
    schema.definitions.html = helper.convertNodeBuffersToPOJOs(schema.definitions.html);
    schema.definitions.css = helper.convertNodeBuffersToPOJOs(schema.definitions.css);
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    schema.definitions.unknown = helper.convertNodeBuffersToPOJOs(schema.definitions.unknown);
    schema.definitions.empty = helper.convertNodeBuffersToPOJOs(schema.definitions.empty);
    expect(schema).to.deep.equal(dereferencedSchema.binaryParser);
  });

  it('should throw an error if no parser can be matched', async function () {
    try {
      await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          yaml: false,
          json: false,
          text: false,
          binary: false,
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(SyntaxError);
      expect(err.message).to.contain('Unable to parse ');
      expect(err.message).to.contain('parsers/parsers.yaml');
    }
  });

  it('should throw an error if no parser returned a result', async function () {
    try {
      await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          yaml: {
            canParse: true,
            parse() {},
          },
          json: false,
          text: false,
          binary: false,
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      // would time out otherwise
      expect(err).to.be.an.instanceOf(ParserError);
      expect(err.message).to.contain('No promise has been returned or callback has been called.');
    }
  });

  it('should throw an error if "parse.text" and "parse.binary" are disabled', async function () {
    try {
      await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), { parse: { text: false, binary: false } });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.an.instanceOf(ParserError);
      expect(err.message).to.contain('Error parsing ');
    }
  });

  it('should use a custom parser with static values', async function () {
    const schema = await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
      parse: {
        // A custom parser that always returns the same value
        staticParser: {
          order: 201,
          canParse: true,
          parse: 'The quick brown fox jumped over the lazy dog',
        },
      },
    });
    expect(schema).to.deep.equal(dereferencedSchema.staticParser);
  });

  it('should use a custom parser that returns a value', async function () {
    const schema = await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse(file) {
            return file.url.substr(-4) === '.foo';
          },
          parse(file) {
            return file.data.toString().split('').reverse().join('');
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it('should use a custom parser that calls a callback', async function () {
    const schema = await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: /\.FOO$/i,
          parse(file, callback) {
            const reversed = file.data.toString().split('').reverse().join('');
            callback(null, reversed);
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it('should use a custom parser that returns a promise', async function () {
    const schema = await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
      parse: {
        // A custom parser that returns the contents of ".foo" files, in reverse
        reverseFooParser: {
          canParse: ['.foo'],
          async parse(file) {
            const reversed = await new Promise(resolve => {
              resolve(file.data.toString().split('').reverse().join(''));
            });
            return reversed;
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.customParser);
  });

  it('should continue parsing if a custom parser fails', async function () {
    const schema = await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
      parse: {
        // A custom parser that always fails,
        // so the built-in parsers will be used as a fallback
        badParser: {
          order: 1,
          canParse: /\.(md|html|css|png)$/i,
          parse(file, callback) {
            callback('BOMB!!!');
          },
        },
      },
    });
    schema.definitions.binary = helper.convertNodeBuffersToPOJOs(schema.definitions.binary);
    expect(schema).to.deep.equal(dereferencedSchema.defaultParsers);
  });

  it('should normalize errors thrown by parsers', async function () {
    try {
      await $RefParser.dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          // A custom parser that always fails,
          // so the built-in parsers will be used as a fallback
          yaml: {
            order: 1,
            parse() {
              throw new Error('Woops');
            },
          },
        },
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(ParserError);
      expect(err.message).to.contain('Error parsing');
      expect(err.message).to.contain('arsers/parsers.yaml: Woops');
    }
  });

  it('should throw a grouped error if no parser can be matched and continueOnError is true', async function () {
    try {
      const parser = new $RefParser();
      await parser.dereference(path.rel('specs/parsers/parsers.yaml'), {
        parse: {
          yaml: false,
          json: false,
          text: false,
          binary: false,
        },
        continueOnError: true,
      });
      helper.shouldNotGetCalled();
    } catch (err) {
      expect(err).to.be.instanceof(JSONParserErrorGroup);
      expect(err.errors.length).to.equal(1);
      expect(err.errors).to.containSubset([
        {
          name: UnmatchedParserError.name,
          message: message => message.startsWith('Could not find parser for'),
          path: [],
          source: message => message.endsWith('specs/parsers/parsers.yaml') || message.startsWith('http://localhost'),
        },
      ]);
    }
  });
});
