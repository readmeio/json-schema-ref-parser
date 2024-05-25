import { describe, it, expect } from 'vitest';

import $RefParser from '../../..';
import path from '../../utils/path';

import bundledSchema from './bundled';

describe('multiple circular $refs at the same depth in the schema', () => {
  it('should bundle successfully', async () => {
    const parser = new $RefParser();

    const schema = await parser.bundle(path.rel('specs/circular-multi/definitions/root.json'));
    expect(schema).to.deep.equal(parser.schema);
    expect(schema).to.deep.equal(bundledSchema);
  });
});
