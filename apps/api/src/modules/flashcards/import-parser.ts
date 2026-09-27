import {
  createCardSchema,
  importMaxBytes,
  importMaxRecords,
  importMaxColumns,
} from '@study-platform/contracts';
import type {
  ImportFormat,
  ImportMapping,
  ImportPreview,
} from '@study-platform/contracts';
import { HttpError } from '../../shared/http-error.js';
export interface ImportRecord {
  line: number;
  fields: string[];
}
export interface ParsedImport {
  columns: string[];
  records: ImportRecord[];
}
const invalid = (message: string) =>
  new HttpError(400, 'INVALID_IMPORT_FILE', message);
export function parseImport(bytes: Buffer, format: ImportFormat): ParsedImport {
  if (bytes.length > importMaxBytes)
    throw new HttpError(
      413,
      'IMPORT_TOO_LARGE',
      'O arquivo deve ter no máximo 2 MiB.',
    );
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw invalid('Use um arquivo UTF-8 válido.');
  }
  if (!text.trim() || text.includes('\0'))
    throw invalid('O arquivo está vazio ou contém conteúdo inválido.');
  const delimiter = format === 'csv' ? ',' : '\t';
  let field = '',
    fields: string[] = [],
    state: 'plain' | 'quoted' | 'closed' = 'plain';
  let line = 1,
    recordLine = 1;
  const rows: ImportRecord[] = [];
  function endField() {
    fields.push(field);
    field = '';
    state = 'plain';
    if (fields.length > importMaxColumns)
      throw invalid('Use no máximo 100 colunas.');
  }
  function endRecord() {
    endField();
    // Retain the first record as header, then ignore entirely blank records.
    if (!rows.length || fields.some((value) => value.trim()))
      rows.push({ line: recordLine, fields });
    fields = [];
    if (rows.length > importMaxRecords + 1)
      throw invalid('Use no máximo 1.000 registros de cartões.');
  }
  for (let index = 0; index < text.length; index++) {
    const char = text[index]!;
    if (state === 'quoted') {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index++;
        } else state = 'closed';
      } else {
        if (char === '\r' && text[index + 1] === '\n') {
          field += '\r\n';
          index++;
          line++;
        } else {
          field += char;
          if (char === '\n' || char === '\r') line++;
        }
      }
      continue;
    }
    if (char === delimiter) {
      endField();
      continue;
    }
    if (char === '\n' || char === '\r') {
      endRecord();
      if (char === '\r' && text[index + 1] === '\n') index++;
      line++;
      recordLine = line;
      continue;
    }
    if (state === 'closed') throw invalid(`Aspas inválidas na linha ${line}.`);
    if (char === '"') {
      if (field) throw invalid(`Aspas inválidas na linha ${line}.`);
      state = 'quoted';
    } else field += char;
  }
  if (state === 'quoted')
    throw invalid('O arquivo contém aspas sem fechamento.');
  if (field || fields.length || state === 'closed') endRecord();
  const header = rows.shift();
  if (
    !header ||
    header.fields.length < 2 ||
    !header.fields.some((value) => value.trim())
  )
    throw invalid(
      'Inclua um cabeçalho com pelo menos duas colunas usando o delimitador do formato escolhido.',
    );
  return { columns: header.fields, records: rows };
}
export const pairKey = (front: string, back: string) =>
  JSON.stringify([
    front.trim().normalize('NFC').toLowerCase(),
    back.trim().normalize('NFC').toLowerCase(),
  ]);
export function classifyImport(
  parsed: ParsedImport,
  mapping: ImportMapping,
  existing: Array<{ front: string; back: string }>,
) {
  const seen = new Set(existing.map((card) => pairKey(card.front, card.back)));
  const cards: Array<{ front: string; back: string }> = [];
  const preview: ImportPreview = {
    mapping,
    counts: {
      records: parsed.records.length,
      imported: 0,
      ignored: 0,
      rejected: 0,
    },
    sample: [],
    errors: [],
  };
  for (const record of parsed.records) {
    const front = (record.fields[mapping.frontColumn] ?? '').trim(),
      back = (record.fields[mapping.backColumn] ?? '').trim();
    let reason: string | undefined;
    if (record.fields.length !== parsed.columns.length)
      reason = 'Quantidade de colunas diferente do cabeçalho.';
    else {
      const result = createCardSchema.safeParse({ front, back });
      if (!result.success)
        reason = result.error.issues
          .map((issue) =>
            issue.path[0] === 'front'
              ? 'Frente vazia ou acima de 2.000 caracteres.'
              : 'Verso vazio ou acima de 4.000 caracteres.',
          )
          .join(' ');
    }
    const key = pairKey(front, back);
    const status = reason ? 'rejected' : seen.has(key) ? 'ignored' : 'imported';
    preview.counts[status]++;
    if (reason) preview.errors.push({ line: record.line, reason });
    if (status === 'imported') {
      seen.add(key);
      cards.push({ front, back });
    }
    if (preview.sample.length < 20)
      preview.sample.push({
        line: record.line,
        front,
        back,
        status,
        ...(reason ? { reason } : {}),
      });
  }
  return { preview, cards };
}
