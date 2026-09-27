import { expect, it } from 'vitest';
import {
  parseImport,
  classifyImport,
} from '../src/modules/flashcards/import-parser.js';
const parse = (text: string, format: 'csv' | 'tsv' = 'csv') =>
  parseImport(Buffer.from(text), format);
it('parses BOM, repeated headers, quoted delimiters, doubled quotes and multiline CSV/TSV with physical line numbers', () => {
  const result = parse(
    '\uFEFFx,x\r\n"a,b","say ""yes"""\r\n"first\r\nsecond",answer\r\n,,\r\nnext,last\r\n',
  );
  expect(result.columns).toEqual(['x', 'x']);
  expect(result.records).toEqual([
    { line: 2, fields: ['a,b', 'say "yes"'] },
    { line: 3, fields: ['first\r\nsecond', 'answer'] },
    { line: 6, fields: ['next', 'last'] },
  ]);
  expect(parse('frente\tverso\n"a\tb"\t"c\nd"', 'tsv').records).toEqual([
    { line: 2, fields: ['a\tb', 'c\nd'] },
  ]);
});
it('rejects malformed structures, invalid encoding/formats and bounded file/record/column limits', () => {
  for (const text of [
    '',
    '  ',
    'a;b\nx;y',
    'a,b\n"bad,b',
    'a,b\na"b,c',
    'a,b\n"a"x,b',
    'a,b\n\0,c',
  ])
    expect(() => parse(text)).toThrow();
  expect(() => parseImport(Buffer.from([0xc3, 0x28]), 'csv')).toThrow(/UTF-8/);
  expect(() => parse('a,b\nx,y', 'tsv')).toThrow();
  expect(() => parse('a,b\n' + 'x,y\n'.repeat(1001))).toThrow(/1.000/);
  expect(
    parse('a,b\n' + 'x,y\n'.repeat(1000) + ' \n'.repeat(40)).records,
  ).toHaveLength(1000);
  expect(() => parse(Array.from({ length: 101 }, () => 'a').join(','))).toThrow(
    /100 colunas/,
  );
  const exact = 'a,b\n' + 'x'.repeat(2_097_152 - 6) + ',y';
  expect(Buffer.byteLength(exact)).toBe(2_097_152);
  expect(parse(exact).records).toHaveLength(1);
  expect(() => parse(exact + 'x')).toThrow(/2 MiB/);
});
it('rejects before deduplication and normalizes only external spaces, Unicode NFC and case', () => {
  const parsed = parse(
    'x,x\n Old , ANSWER \n Cafe\u0301 , Sim \nCAFÉ,sim\n A  B , C \nA B,C\n ,x\nwrong\n' +
      'x'.repeat(2001) +
      ',x\n',
  );
  const { preview, cards } = classifyImport(
    parsed,
    { frontColumn: 0, backColumn: 1 },
    [{ front: 'old', back: 'answer' }],
  );
  expect(preview.counts).toEqual({
    records: 8,
    imported: 3,
    ignored: 2,
    rejected: 3,
  });
  expect(cards).toEqual([
    { front: 'Cafe\u0301', back: 'Sim' },
    { front: 'A  B', back: 'C' },
    { front: 'A B', back: 'C' },
  ]);
  expect(preview.errors.map((error) => error.line)).toEqual([7, 8, 9]);
  expect(
    classifyImport(
      parse('a,b\nleft,right'),
      { frontColumn: 1, backColumn: 0 },
      [],
    ).cards,
  ).toEqual([{ front: 'right', back: 'left' }]);
  expect(
    classifyImport(
      parse('a,b\n' + 'a,b\n'.repeat(30)),
      { frontColumn: 0, backColumn: 1 },
      [],
    ).preview.sample,
  ).toHaveLength(20);
});
