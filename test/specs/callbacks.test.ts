import { describe, it, expect, assert } from 'vitest';

import $RefParser from '../../lib';
import path from '../utils/path';

describe('Callback & Promise syntax', () => {
  describe.each(['parse', 'resolve', 'dereference', 'bundle'])('%s method', method => {
    it('should call the callback function upon success', () => {
      return new Promise((resolve, reject) => {
        const parser = new $RefParser();
        parser[method](path.rel('specs/internal/internal.yaml'), (err, result) => {
          try {
            expect(err).to.equal(null);
            expect(result).to.be.an('object');

            if (method === 'resolve') {
              expect(result).to.equal(parser.$refs);
            } else {
              expect(result).to.equal(parser.schema);
            }
            resolve(true);
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('should call the callback function upon failure', () => {
      return new Promise((resolve, reject) => {
        $RefParser[method](path.rel('specs/invalid/invalid.yaml'), (err, result) => {
          try {
            expect(err.constructor.name).to.equal('ParserError');
            expect(result).to.equal(undefined);
            resolve(true);
          } catch (e) {
            reject(e);
          }
        });
      });
    });

    it('should resolve the Promise upon success', () => {
      const parser = new $RefParser();
      return parser[method](path.rel('specs/internal/internal.yaml')).then(result => {
        expect(result).to.be.an('object');

        if (method === 'resolve') {
          expect(result).to.equal(parser.$refs);
        } else {
          expect(result).to.equal(parser.schema);
        }
      });
    });

    it('should reject the Promise upon failure', () => {
      return $RefParser[method](path.rel('specs/invalid/invalid.yaml'))
        .then(() => {
          assert.fail();
        })
        .catch(err => {
          expect(err.constructor.name).to.equal('ParserError');
        });
    });
  });
});
