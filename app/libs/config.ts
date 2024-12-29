export class Config {
  constructor(private configJson: Record<string, unknown>) {}

  get<T = unknown>(key: string): T | undefined {
    return this.configJson?.[key] as T | undefined;
  }

  getMany<T = unknown>(...keys: string[]): (T | undefined)[] {
    return keys.map(key => this.configJson?.[key] as T | undefined);
  }
}
