const CHUNK_SIZE = 1024 * 1024 * 25; // 25 MiB

type Awaitable<T> = T | PromiseLike<T>;

export const EOF = new Error("End of stream");

export interface Buffer {
    blob: Blob;
    littleEndian?: boolean;

    view: DataView;
    offset: number;
    globalOffset: number;

    get(length: number): Awaitable<Uint8Array>;
    skip(length: number): void;
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

const nextChunk = async (buffer: Buffer, length: number) => {
    if (buffer.globalOffset >= buffer.blob.size) throw EOF;

    const baseOffset = buffer.globalOffset - (buffer.view.byteLength - buffer.offset);
    if (baseOffset + length > buffer.blob.size) throw EOF;

    buffer.globalOffset = Math.min(buffer.blob.size, baseOffset + Math.max(length, CHUNK_SIZE));

    const blob = buffer.blob.slice(baseOffset, buffer.globalOffset);

    buffer.offset = 0;
    buffer.view = new DataView(await blob.arrayBuffer());
};

export const wrap = (blob: Blob, littleEndian: boolean = false): Buffer => {
    return {
        blob,
        littleEndian,
        view: new DataView(new ArrayBuffer(0)),
        offset: 0,
        globalOffset: 0,

        _get(length: number): Uint8Array {
            const value = new Uint8Array(this.view.buffer, this.offset, length);

            this.offset += length;
            return value;
        },

        get(length: number): Awaitable<Uint8Array> {
            if (this.offset + length > this.view.byteLength) {
                return nextChunk(this, length).then(() => this._get(length));
            }

            return this._get(length);
        },

        skip(length: number) {
            this.offset += length;
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
    } as any;
};
