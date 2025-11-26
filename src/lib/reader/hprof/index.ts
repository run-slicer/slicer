import { type Buffer, EOF, wrap } from "./buffer";

// based on https://github.com/katana-project/hprof, but stripped of unused code
// SpiderMonkey's JIT is not very good at optimizing the library, so we need to do it like this

// https://github.com/openjdk/jdk/blob/master/src/jdk.hotspot.agent/share/classes/sun/jvm/hotspot/utilities/HeapHprofBinWriter.java

const enum Tag {
    UTF8 = 0x01,
    LOAD_CLASS = 0x02,
    UNLOAD_CLASS = 0x03,
    FRAME = 0x04,
    TRACE = 0x05,
    ALLOC_SITES = 0x06,
    HEAP_SUMMARY = 0x07,
    START_THREAD = 0x0a,
    END_THREAD = 0x0b,
    HEAP_DUMP = 0x0c,
    CPU_SAMPLES = 0x0d,
    CONTROL_SETTINGS = 0x0e,
    HEAP_DUMP_SEGMENT = 0x1c,
    HEAP_DUMP_END = 0x2c,
}

const enum HeapDumpTag {
    GC_ROOT_UNKNOWN = 0xff,
    GC_ROOT_JNI_GLOBAL = 0x01,
    GC_ROOT_JNI_LOCAL = 0x02,
    GC_ROOT_JAVA_FRAME = 0x03,
    GC_ROOT_NATIVE_STACK = 0x04,
    GC_ROOT_STICKY_CLASS = 0x05,
    GC_ROOT_THREAD_BLOCK = 0x06,
    GC_ROOT_MONITOR_USED = 0x07,
    GC_ROOT_THREAD_OBJ = 0x08,
    GC_CLASS_DUMP = 0x20,
    GC_INSTANCE_DUMP = 0x21,
    GC_OBJ_ARRAY_DUMP = 0x22,
    GC_PRIM_ARRAY_DUMP = 0x23,
}

enum Type {
    ARRAY_OBJECT = 1,
    NORMAL_OBJECT = 2,
    BOOLEAN = 4,
    CHAR = 5,
    FLOAT = 6,
    DOUBLE = 7,
    BYTE = 8,
    SHORT = 9,
    INT = 10,
    LONG = 11,
}

export const enum SlurpEntryType {
    INSTANCE,
    OBJ_ARRAY,
    PRIM_ARRAY,
}

export interface SlurpEntry {
    type: SlurpEntryType;
    id: bigint;
    name?: string;

    count: number;
    totalSize: number;
    largestSize: number;
}

export interface ArraySlurpEntry extends SlurpEntry {
    type: SlurpEntryType.OBJ_ARRAY | SlurpEntryType.PRIM_ARRAY;
    elemCount: number;
}

export interface SlurpResult {
    idSize: number;
    timestamp: Date;
    entries: SlurpEntry[];
}

interface ClassInfo {
    id: bigint;
    instSize: number;
    superClsId: bigint;
}

interface EntryProto {
    type: SlurpEntryType;
    id: bigint;

    count: number;
}

interface ArrayEntryProto extends EntryProto {
    type: SlurpEntryType.OBJ_ARRAY | SlurpEntryType.PRIM_ARRAY;
    elemCount: number;
    maxCount: number;
}

const valueSizes: Record<number, number> = {
    [Type.ARRAY_OBJECT]: -1,
    [Type.NORMAL_OBJECT]: -1,
    [Type.BOOLEAN]: 1,
    [Type.CHAR]: 2,
    [Type.FLOAT]: 4,
    [Type.DOUBLE]: 8,
    [Type.BYTE]: 1,
    [Type.SHORT]: 2,
    [Type.INT]: 4,
    [Type.LONG]: 8,
};

const valueSize = (type: number | Type, idSize: number = -1): number => {
    let size = valueSizes[type];
    if (!size) {
        throw new Error(`Unsupported value type ${type}`);
    }

    return size === -1 ? idSize : size;
};

type ReaderFunc<T> = () => T | PromiseLike<T>;

interface ReaderContext {
    buffer: Buffer;
    idSize: number;

    readId: ReaderFunc<bigint>;

    classes: Map<bigint, ClassInfo>;
    instances: Map<bigint, EntryProto>;
    objArrays: Map<bigint, ArrayEntryProto>;
    primArrays: Map<number, ArrayEntryProto>;
}

const idReader = (buffer: Buffer, size: number): ReaderFunc<bigint> => {
    switch (size) {
        case 8:
            return buffer.getBigInt64.bind(buffer);
        case 4:
            return async () => BigInt(await buffer.getInt32());
    }

    throw new Error(`Unsupported identifier size ${size}`);
};

const readClassDumpRec = async (ctx: ReaderContext): Promise<number> => {
    const { buffer, idSize, readId } = ctx;

    let length = idSize * 7 + 8;

    const clsObjId = await readId();
    buffer.skip(4);
    const superObjId = await readId();
    buffer.skip(idSize * 5);
    const instSize = await buffer.getUint32();

    const constPoolSize = await buffer.getUint16();
    length += 2;

    for (let i = 0; i < constPoolSize; i++) {
        buffer.skip(2);
        const size = valueSize(await buffer.getUint8(), idSize);
        buffer.skip(size);

        length += 3 + size;
    }

    const numStaticFields = await buffer.getUint16();
    length += 2;

    for (let i = 0; i < numStaticFields; i++) {
        buffer.skip(idSize);
        const size = valueSize(await buffer.getUint8(), idSize);
        buffer.skip(size);

        length += idSize + 1 + size;
    }

    const numInstFields = await buffer.getUint16();
    const size = (1 + idSize) * numInstFields;
    buffer.skip(size);

    length += 2 + size;

    ctx.classes.set(clsObjId, {
        id: clsObjId,
        instSize,
        superClsId: superObjId,
    });

    return length;
};

const readInstanceDumpRec = async (ctx: ReaderContext): Promise<number> => {
    const { buffer, idSize, readId } = ctx;

    buffer.skip(idSize + 4);
    const clsObjId = await readId();
    const numBytes = await buffer.getUint32();
    buffer.skip(numBytes);

    let entry = ctx.instances.get(clsObjId);
    if (!entry) {
        entry = {
            type: SlurpEntryType.INSTANCE,
            id: clsObjId,
            count: 0,
        };
        ctx.instances.set(clsObjId, entry);
    }

    entry.count++;

    return idSize * 2 + 8 + numBytes;
};

const readObjArrayDumpRec = async (ctx: ReaderContext): Promise<number> => {
    const { buffer, idSize, readId } = ctx;

    buffer.skip(idSize + 4);
    const numElems = await buffer.getUint32();
    const arrClsId = await readId();
    buffer.skip(idSize * numElems);

    let entry = ctx.objArrays.get(arrClsId);
    if (!entry) {
        entry = {
            type: SlurpEntryType.OBJ_ARRAY,
            id: arrClsId,
            count: 0,
            elemCount: 0,
            maxCount: 0,
        };
        ctx.objArrays.set(arrClsId, entry);
    }

    entry.count++;
    entry.elemCount += numElems;
    entry.maxCount = Math.max(entry.maxCount, numElems);

    return idSize * (2 + numElems) + 8;
};

const readPrimArrayDumpRec = async (ctx: ReaderContext): Promise<number> => {
    const { buffer, idSize } = ctx;

    buffer.skip(idSize + 4);
    const numElems = await buffer.getUint32();
    const elemType = await buffer.getUint8();
    const size = valueSize(elemType, idSize);
    buffer.skip(numElems * size);

    let entry = ctx.primArrays.get(elemType);
    if (!entry) {
        entry = {
            type: SlurpEntryType.PRIM_ARRAY,
            id: BigInt(elemType),
            count: 0,
            elemCount: 0,
            maxCount: 0,
        };
        ctx.primArrays.set(elemType, entry);
    }

    entry.count++;
    entry.elemCount += numElems;
    entry.maxCount = Math.max(entry.maxCount, numElems);

    return idSize + 9 + numElems * size;
};

const readSubRecord = async (ctx: ReaderContext): Promise<number> => {
    const { buffer, idSize } = ctx;

    const tag = await buffer.getUint8();
    switch (tag) {
        case HeapDumpTag.GC_INSTANCE_DUMP:
            return 1 + (await readInstanceDumpRec(ctx));
        case HeapDumpTag.GC_OBJ_ARRAY_DUMP:
            return 1 + (await readObjArrayDumpRec(ctx));
        case HeapDumpTag.GC_PRIM_ARRAY_DUMP:
            return 1 + (await readPrimArrayDumpRec(ctx));
        case HeapDumpTag.GC_CLASS_DUMP:
            return 1 + (await readClassDumpRec(ctx));
        case HeapDumpTag.GC_ROOT_UNKNOWN:
            buffer.skip(idSize);
            return 1 + idSize;
        case HeapDumpTag.GC_ROOT_THREAD_OBJ:
            buffer.skip(idSize + 8);
            return 1 + idSize + 8;
        case HeapDumpTag.GC_ROOT_JNI_GLOBAL:
            buffer.skip(idSize * 2);
            return 1 + idSize * 2;
        case HeapDumpTag.GC_ROOT_JNI_LOCAL:
            buffer.skip(idSize + 8);
            return 1 + idSize + 8;
        case HeapDumpTag.GC_ROOT_JAVA_FRAME:
            buffer.skip(idSize + 8);
            return 1 + idSize + 8;
        case HeapDumpTag.GC_ROOT_NATIVE_STACK:
            buffer.skip(idSize + 4);
            return 1 + idSize + 4;
        case HeapDumpTag.GC_ROOT_STICKY_CLASS:
            buffer.skip(idSize);
            return 1 + idSize;
        case HeapDumpTag.GC_ROOT_THREAD_BLOCK:
            buffer.skip(idSize + 4);
            return 1 + idSize + 4;
        case HeapDumpTag.GC_ROOT_MONITOR_USED:
            buffer.skip(idSize);
            return 1 + idSize;
    }

    throw new Error(`Unsupported heap dump sub-record tag ${tag}`);
};

const primDescs: Record<number, string> = {
    [Type.BOOLEAN]: "Z",
    [Type.CHAR]: "C",
    [Type.FLOAT]: "F",
    [Type.DOUBLE]: "D",
    [Type.BYTE]: "B",
    [Type.SHORT]: "S",
    [Type.INT]: "I",
    [Type.LONG]: "J",
};

const decoder = new TextDecoder();

export const read = async (blob: Blob): Promise<SlurpResult> => {
    console.time("hprof read");
    const buffer = wrap(blob);

    while (true) {
        const byte = await buffer.getUint8();
        if (byte === 0) {
            // skip until header null terminator
            break;
        }
    }

    const idSize = await buffer.getUint32();
    const timestamp = new Date(Number(await buffer.getBigUint64()));
    const readId = idReader(buffer, idSize);

    const ctx: ReaderContext = {
        buffer,
        idSize,
        readId,
        classes: new Map<bigint, ClassInfo>(),
        instances: new Map<bigint, EntryProto>(),
        objArrays: new Map<bigint, ArrayEntryProto>(),
        primArrays: new Map<number, ArrayEntryProto>(),
    };

    const strings = new Map<bigint, string>();
    const classNames = new Map<bigint, string>();

    try {
        while (true) {
            const tag = await buffer.getUint8();
            buffer.skip(4);
            const length = await buffer.getUint32();

            switch (tag) {
                case Tag.UTF8:
                    strings.set(await readId(), decoder.decode(await buffer.get(length - idSize)));
                    break;
                case Tag.LOAD_CLASS: {
                    buffer.skip(4);
                    const objId = await readId();
                    buffer.skip(4);
                    const nameId = await readId();

                    const value = strings.get(nameId);
                    if (value) {
                        classNames.set(objId, value);
                    }
                    break;
                }
                case Tag.HEAP_DUMP:
                case Tag.HEAP_DUMP_SEGMENT: {
                    let remaining = length;
                    while (remaining > 0) {
                        remaining -= await readSubRecord(ctx);
                    }

                    if (remaining !== 0) {
                        throw new Error("Buffer underflow");
                    }
                    break;
                }
                default:
                    buffer.skip(length);
                    break;
            }
        }
    } catch (e) {
        if (e !== EOF) {
            throw e;
        }
    }

    console.timeEnd("hprof read");
    console.time("hprof slurp");

    strings.clear();

    // https://shipilev.net/blog/2014/heapdump-is-a-lie/
    // we can't know the object size for sure, so we at least make an educated estimate
    let objectHeader = idSize + 4;
    objectHeader += objectHeader % idSize; // alignment

    const entries: SlurpEntry[] = [];
    for (const [id, inst] of ctx.instances) {
        const entry: SlurpEntry = {
            ...inst,
            name: classNames.get(id),
            totalSize: -1,
            largestSize: -1,
        };

        const cls = ctx.classes.get(id);
        if (cls) {
            let size = objectHeader + cls.instSize;

            let superClsId = cls.superClsId;
            while (superClsId !== 0n) {
                const superCls = ctx.classes.get(superClsId);
                if (!superCls) {
                    break;
                }

                size += superCls.instSize;
                superClsId = superCls.superClsId;
            }

            size += size % idSize; // alignment
            entry.largestSize = size;
            entry.totalSize = size * entry.count;
        }

        entries.push(entry);
    }
    ctx.instances.clear();
    ctx.classes.clear();

    const arrayHeader = idSize + 8; // already aligned for both 32- and 64-bit

    // not including the objects' sizes - only the reference sizes
    for (const [id, inst] of ctx.objArrays) {
        const allHeaders = arrayHeader * inst.count;
        const allRefs = idSize * inst.elemCount;

        entries.push({
            ...inst,
            name: classNames.get(id),
            totalSize: allHeaders + allRefs,
            largestSize: arrayHeader + idSize * inst.maxCount,
        });
    }
    ctx.objArrays.clear();
    classNames.clear();

    for (const [id, inst] of ctx.primArrays) {
        const value = valueSize(id, idSize);

        const allHeaders = arrayHeader * inst.count;
        const allValues = value * inst.elemCount;
        const allPadding = inst.count * 4; /* 4 bytes per array - estimate, this data is lost */

        let largestArr = arrayHeader + value * inst.maxCount;
        largestArr += largestArr % idSize; // alignment

        entries.push({
            ...inst,
            name: `[${primDescs[id]}`,
            totalSize: allHeaders + allValues + allPadding,
            largestSize: largestArr,
        });
    }
    ctx.primArrays.clear();

    console.timeEnd("hprof slurp");

    return { idSize, timestamp, entries };
};
