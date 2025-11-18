declare class Buffer extends Uint8Array {
  static from(data: string, encoding?: string): Buffer;
  static from(data: ArrayBuffer | ArrayLike<number>): Buffer;
  toString(encoding?: string): string;
}

declare function require(name: string): any;

declare module 'crypto' {
  export interface Hmac {
    update(data: string | Buffer): Hmac;
    digest(): Buffer;
  }
  export function createHmac(algorithm: string, key: string | Buffer): Hmac;
}
