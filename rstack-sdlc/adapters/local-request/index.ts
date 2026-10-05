// Local request source: a provided file or manual text, retained with its
// provenance. It never contacts a ticket service.

import { existsSync, readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import type { RequestLocator, RequestSnapshot, RequestSource } from '../../core/contracts/ports.ts';
import { EngineBlock } from '../../core/engine/errors.ts';

export function createLocalRequestSource(now: () => Date = () => new Date()): RequestSource {
  return {
    id: 'local',
    getSnapshot(locator: RequestLocator): RequestSnapshot {
      const captured_at = now().toISOString();
      if (locator.path !== undefined) {
        if (!existsSync(locator.path)) {
          throw new EngineBlock('MISSING_INPUT', 'the request file does not exist', { locator: locator.path });
        }
        return {
          status: 'OK',
          request_id: locator.request_id ?? basename(locator.path, extname(locator.path)),
          bytes: readFileSync(locator.path),
          // The file name only: the retained bytes are the evidence, and a full
          // local path would put a machine-specific location into the record.
          provenance: { adapter: 'local-request', locator: `file:${basename(locator.path)}`, captured_at },
        };
      }
      if (locator.text !== undefined && locator.request_id !== undefined) {
        return {
          status: 'OK',
          request_id: locator.request_id,
          bytes: Buffer.from(locator.text, 'utf8'),
          provenance: { adapter: 'local-request', locator: 'manual-text', captured_at },
        };
      }
      throw new EngineBlock('MISSING_INPUT', 'a request file, or request text with a request id, is required', {});
    },
  };
}
