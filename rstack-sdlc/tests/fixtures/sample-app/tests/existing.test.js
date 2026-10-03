import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleExport } from '../src/export.js';

function exporterSpy() {
  const calls = [];
  const exporter = (params) => {
    calls.push(params);
    return { rows: 3 };
  };
  return { exporter, calls };
}

test('existing: an authorized request runs the export', () => {
  const { exporter, calls } = exporterSpy();
  const response = handleExport({ user: { authorized: true }, params: { id: 7 } }, { exporter, flags: {} });
  assert.deepEqual(response, { status: 200, data: { rows: 3 } });
  assert.deepEqual(calls, [{ id: 7 }]);
});

test('existing: an unauthorized request is refused', () => {
  const { exporter, calls } = exporterSpy();
  const response = handleExport({ user: null, params: {} }, { exporter, flags: {} });
  assert.equal(response.status, 401);
  assert.equal(calls.length, 0);
});
