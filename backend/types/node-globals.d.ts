declare class Buffer extends Uint8Array {
  static from(data: string, encoding?: string): Buffer;
  static from(data: ArrayBuffer | ArrayLike<number>): Buffer;
  static alloc(size: number): Buffer;
  static concat(list: Buffer[]): Buffer;
  static byteLength(input: string): number;
  toString(encoding?: string): string;
  writeBigUInt64BE(value: bigint, offset?: number): number;
  readUInt32BE(offset: number): number;
  subarray(start?: number, end?: number): Buffer;
}

declare function require(name: string): any;

declare module 'crypto' {
  export interface Hmac {
    update(data: string | Buffer): Hmac;
    digest(encoding?: string): Buffer;
  }
  export interface Hash {
    update(data: string): Hash;
    digest(): Buffer;
  }
  export interface Cipher {
    update(data: string, inputEncoding?: string): Buffer;
    final(): Buffer;
    getAuthTag(): Buffer;
  }
  export interface Decipher {
    update(data: Buffer): Buffer;
    final(): Buffer;
    setAuthTag(tag: Buffer): void;
  }
  export function createHmac(algorithm: string, key: string | Buffer): Hmac;
  export function createHash(algorithm: string): Hash;
  export function createCipheriv(algorithm: string, key: Buffer, iv: Buffer): Cipher;
  export function createDecipheriv(algorithm: string, key: Buffer, iv: Buffer): Decipher;
  export function randomBytes(size: number): Buffer;
}

declare module 'net' {
  import { EventEmitter } from 'events';
  interface Socket extends EventEmitter {
    write(data: string | Buffer): void;
    end(): void;
    on(event: 'connect', listener: () => void): this;
    on(event: 'data', listener: (chunk: Buffer) => void): this;
    on(event: 'end', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
  }
  export function createConnection(options: { host: string; port: number }): Socket;
}

declare module 'events' {
  export class EventEmitter {
    on(event: string, listener: (...args: any[]) => void): this;
  }
}

declare module 'url' {
  export class URL {
    constructor(input: string, base?: string);
    hostname: string;
    port: string;
    password: string;
  }
}
