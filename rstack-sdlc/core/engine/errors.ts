// A named condition that stops an engine operation without changing state.
export class EngineBlock extends Error {
  code: string;
  detail: Record<string, unknown>;

  constructor(code: string, message: string, detail: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EngineBlock';
    this.code = code;
    this.detail = detail;
  }
}
