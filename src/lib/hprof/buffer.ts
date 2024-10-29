// A streaming DataView abstraction. (c) 2024 zlataovce (github.com/zlataovce)
// License: Public domain (or MIT if needed). Attribution appreciated.
// https://gist.github.com/zlataovce/7db8bc7cfe8b7897816495bf2ec3858d
const DEFAULT_LITTLE_ENDIAN = false;
const MIN_READ = 1024 * 1024 * 20; // 20 MiB
const INITIAL_BUF_SIZE = MIN_READ * 1.5; // 30 MiB

type Awaitable<T> = T | PromiseLike<T>;

export const EOF = new Error("End of stream");

export interface Buffer {
    reader: ReadableStreamDefaultReader<Uint8Array>;
    littleEndian?: boolean;

    view: DataView;
    offset: number;

    get(length: number): Awaitable<Uint8Array>;
    skip(length: number): Awaitable<void>;
    take(termValue: number): Awaitable<Uint8Array>; // exclusive
    getFloat32(): Awaitable<number>;
    getFloat64(): Awaitable<number>;
    getInt8(): Awaitable<number>;
    getInt16(): Awaitable<number>;
    getInt32(): Awaitable<number>;
    getUint8(): Awaitable<number>;
    getUint16(): Awaitable<number>;
    getUint32(): Awaitable<number>;
    getBigInt64(): Awaitable<bigint>;
    getBigUint64(): Awaitable<bigint>;
}

const arrayToView = (arr: Uint8Array): DataView => {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
};

const nextChunk = async (buffer: Buffer, length: number) => {
    const chunks: Uint8Array[] = [];

    let chunksLength = 0;
    if (buffer.offset < buffer.view.byteLength) {
        // unread data
        chunksLength = buffer.view.byteLength - buffer.offset;
        chunks.push(new Uint8Array(buffer.view.buffer, buffer.view.byteOffset + buffer.offset, chunksLength));
    }

    const toRead = Math.max(length, MIN_READ);
    while (toRead > chunksLength) {
        const { done, value } = await buffer.reader.read();
        if (done) {
            throw EOF;
        }

        chunksLength += value.byteLength;
        chunks.push(value);
    }

    // try to reuse old buffer
    let arrayBuf = buffer.view.buffer;
    if (arrayBuf.byteLength < chunksLength) {
        arrayBuf = new ArrayBuffer(chunksLength);
    }

    const combined = new Uint8Array(arrayBuf, 0, chunksLength);

    let offset = 0;
    for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.byteLength;
    }

    buffer.offset = 0;
    buffer.view = arrayToView(combined);
};

export const wrap = (stream: ReadableStream<Uint8Array>, littleEndian: boolean = DEFAULT_LITTLE_ENDIAN): Buffer => {
    return {
        reader: stream.getReader(),
        littleEndian,
        view: new DataView(new ArrayBuffer(INITIAL_BUF_SIZE), 0, 0),
        offset: 0,

        _get(length: number, copy: boolean): Uint8Array {
            const offset = this.view.byteOffset + this.offset;
            const value = copy
                ? new Uint8Array(this.view.buffer.slice(offset, offset + length))
                : new Uint8Array(this.view.buffer, offset, length);

            this.offset += length;
            return value;
        },

        get(length: number, copy: boolean = false): Awaitable<Uint8Array> {
            if (this.offset + length > this.view.byteLength) {
                return nextChunk(this, length).then(() => this._get(length, copy));
            }

            return this._get(length, copy);
        },

        async _skip(length: number) {
            while (length > 0) {
                const available = this.view.byteLength - this.offset;
                if (available >= length) {
                    this.offset += length;
                    return;
                }

                length -= available;

                const { done, value } = await this.reader.read();
                if (done) {
                    throw EOF;
                }

                this.view = arrayToView(value);
                this.offset = 0;
            }
        },

        skip(length: number): Awaitable<void> {
            if (this.view.byteLength - this.offset >= length) {
                this.offset += length;
                return;
            }

            return this._skip(length);
        },

        _getBigInt64(): bigint {
            const value = this.view.getBigInt64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;
        },

        getBigInt64(): Awaitable<bigint> {
            if (this.offset + 8 > this.view.byteLength) {
                return nextChunk(this, 8).then(() => this._getBigInt64());
            }

            return this._getBigInt64();
        },

        _getBigUint64(): bigint {
            const value = this.view.getBigUint64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;
        },

        getBigUint64(): Awaitable<bigint> {
            if (this.offset + 8 > this.view.byteLength) {
                return nextChunk(this, 8).then(() => this._getBigUint64());
            }

            return this._getBigUint64();
        },

        _getFloat32(): number {
            const value = this.view.getFloat32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;
        },

        getFloat32(): Awaitable<number> {
            if (this.offset + 4 > this.view.byteLength) {
                return nextChunk(this, 4).then(() => this._getFloat32());
            }

            return this._getFloat32();
        },

        _getFloat64(): number {
            const value = this.view.getFloat64(this.offset, this.littleEndian);
            this.offset += 8;
            return value;
        },

        getFloat64(): Awaitable<number> {
            if (this.offset + 8 > this.view.byteLength) {
                return nextChunk(this, 8).then(() => this._getFloat64());
            }

            return this._getFloat64();
        },

        _getInt16(): number {
            const value = this.view.getInt16(this.offset, this.littleEndian);
            this.offset += 2;
            return value;
        },

        getInt16(): Awaitable<number> {
            if (this.offset + 2 > this.view.byteLength) {
                return nextChunk(this, 2).then(() => this._getInt16());
            }

            return this._getInt16();
        },

        _getInt32(): number {
            const value = this.view.getInt32(this.offset, this.littleEndian);
            this.offset += 4;
            return value;
        },

        getInt32(): Awaitable<number> {
            if (this.offset + 4 > this.view.byteLength) {
                return nextChunk(this, 4).then(() => this._getInt32());
            }

            return this._getInt32();
        },

        _getInt8(): number {
            const value = this.view.getInt8(this.offset);
            this.offset += 1;
            return value;
        },

        getInt8(): Awaitable<number> {
            if (this.offset + 1 > this.view.byteLength) {
                return nextChunk(this, 1).then(() => this._getInt8());
            }

            return this._getInt8();
        },

        _getUint16(): number {
            const value = this.view.getUint16(this.offset, littleEndian);
            this.offset += 2;
            return value;
        },

        getUint16(): Awaitable<number> {
            if (this.offset + 2 > this.view.byteLength) {
                return nextChunk(this, 2).then(() => this._getUint16());
            }

            return this._getUint16();
        },

        _getUint32(): number {
            const value = this.view.getUint32(this.offset, littleEndian);
            this.offset += 4;
            return value;
        },

        getUint32(): Awaitable<number> {
            if (this.offset + 4 > this.view.byteLength) {
                return nextChunk(this, 4).then(() => this._getUint32());
            }

            return this._getUint32();
        },

        _getUint8(): number {
            const value = this.view.getUint8(this.offset);
            this.offset += 1;
            return value;
        },

        getUint8(): Awaitable<number> {
            if (this.offset + 1 > this.view.byteLength) {
                return nextChunk(this, 1).then(() => this._getUint8());
            }

            return this._getUint8();
        },

        async take(termValue: number): Promise<Uint8Array> {
            const result: number[] = [];
            while (true) {
                const byte = await this.getUint8();
                if (byte === termValue) {
                    break;
                }

                result.push(byte);
            }

            return new Uint8Array(result);
        },
    } as any;
};
