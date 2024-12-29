type Direction = "ASC" | "DESC";

export class Sort<K extends string> implements Map<K, Direction> {
  private map: Map<K, Direction>;
  private _orderedKeys: K[];

  constructor(entries?: readonly (readonly [K, Direction])[] | null) {
    this.map = new Map(entries);

    if (entries !== null && entries !== undefined) {
      this._orderedKeys = entries.map(([key]) => key);
    } else {
      this._orderedKeys = [];
    }
  }

  get orderedKeys() {
    return this._orderedKeys;
  }

  get(key: K) {
    return this.map.get(key);
  }

  has(key: K) {
    return this.map.has(key);
  }

  set(key: K, value: Direction) {
    this.map.set(key, value);
    this._orderedKeys = [...this._orderedKeys.filter((k) => k !== key), key];
    return this;
  }

  get size() {
    return this.map.size;
  }

  delete(key: K) {
    const success = this.map.delete(key);
    this._orderedKeys = this._orderedKeys.filter((k) => k !== key);
    return success;
  }

  clear() {
    this.map.clear();
    this._orderedKeys = [];
  }

  forEach(
    callbackfn: (value: Direction, key: K, map: Map<K, Direction>) => void,
    thisArg?: unknown,
  ) {
    this._orderedKeys.forEach((k) =>
      callbackfn.call(thisArg, this.map.get(k) as Direction, k, this),
    );
  }

  entries() {
    return this._orderedKeys
      .map((k) => [k, this.get(k)] as [K, Direction])
      .values();
  }

  keys() {
    return this._orderedKeys.values();
  }

  values() {
    return this._orderedKeys.map((k) => this.get(k) as Direction).values();
  }

  [Symbol.iterator]() {
    return this.map[Symbol.iterator]();
  }

  get [Symbol.toStringTag]() {
    return "Sort";
  }
}
