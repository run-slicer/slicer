import { Opcode, OPCODE_MNEMONICS, ConstantType, HandleKind, ArrayCode } from "@run-slicer/asm/spec";
import type {
    Pool,
    Entry,
    ClassEntry,
    UTF8Entry,
    DynamicEntry,
    NameTypeEntry,
    RefEntry,
    NumericEntry,
    WideNumericEntry,
    StringEntry,
    MethodTypeEntry,
    ModularEntry,
    HandleEntry,
} from "@run-slicer/asm/pool";
import type {
    Instruction,
    TypeInstruction,
    PushInstruction,
    IncrementInstruction,
    WideInstruction,
    InvokeInstruction,
    ConstantInstruction,
    LoadStoreInstruction,
    ArrayInstruction,
} from "@run-slicer/asm/insn";

const formatPoolEntry = (entry: Entry, pool: Pool): string => {
    switch (entry.type) {
        case ConstantType.UTF8:
            return (entry as UTF8Entry).decode();
        case ConstantType.INTEGER:
        case ConstantType.FLOAT:
            return (entry as NumericEntry).value.toString();
        case ConstantType.LONG:
        case ConstantType.DOUBLE:
            const data = (entry as WideNumericEntry).data;
            const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

            const func = entry.type === ConstantType.LONG ? view.getBigInt64 : view.getFloat64;
            return func(0, false).toString();
        case ConstantType.CLASS:
            return formatPoolEntry(pool[(entry as ClassEntry).name]!, pool);
        case ConstantType.STRING:
            return `"${formatPoolEntry(pool[(entry as StringEntry).data]!, pool)}"`;
        case ConstantType.METHOD_TYPE:
            return formatPoolEntry(pool[(entry as MethodTypeEntry).descriptor]!, pool);
        case ConstantType.MODULE:
        case ConstantType.PACKAGE:
            return formatPoolEntry(pool[(entry as ModularEntry).name]!, pool);
        case ConstantType.FIELDREF:
        case ConstantType.METHODREF:
        case ConstantType.INTERFACE_METHODREF: {
            const refEntry = entry as RefEntry;

            return `${formatPoolEntry(pool[refEntry.ref]!, pool)} ${formatPoolEntry(pool[refEntry.nameType]!, pool)}`;
        }
        case ConstantType.NAME_AND_TYPE: {
            const ntEntry = entry as NameTypeEntry;

            return `${(pool[ntEntry.name] as UTF8Entry).decode()} ${(pool[ntEntry.type_] as UTF8Entry).decode()}`;
        }
        case ConstantType.DYNAMIC:
        case ConstantType.INVOKE_DYNAMIC: {
            const dynEntry = entry as DynamicEntry;

            return `${dynEntry.bsmIndex} ${formatPoolEntry(pool[dynEntry.nameType]!, pool)}`;
        }
        case ConstantType.METHOD_HANDLE:
            const handleEntry = entry as HandleEntry;

            return `${HandleKind[handleEntry.kind].toLowerCase()} ${formatPoolEntry(pool[handleEntry.ref]!, pool)}`;
        default:
            throw new Error("Unrecognized constant pool tag " + entry.type);
    }
};

export const formatInsn = (insn: Instruction, pool: Pool): string => {
    let value = OPCODE_MNEMONICS[insn.opcode] || "<unknown opcode>";
    switch (insn.opcode) {
        case Opcode.ALOAD:
        case Opcode.ASTORE:
        case Opcode.DLOAD:
        case Opcode.DSTORE:
        case Opcode.FLOAD:
        case Opcode.FSTORE:
        case Opcode.ILOAD:
        case Opcode.ISTORE:
        case Opcode.LLOAD:
        case Opcode.LSTORE:
        case Opcode.RET:
            value += ` ${(insn as LoadStoreInstruction).index}`;
            break;
        case Opcode.GETFIELD:
        case Opcode.GETSTATIC:
        case Opcode.PUTFIELD:
        case Opcode.PUTSTATIC:
            value += ` ${formatPoolEntry(pool[(insn as LoadStoreInstruction).index]!, pool)}`;
            break;
        case Opcode.IINC: {
            const iincInsn = insn as IncrementInstruction;

            value += ` ${iincInsn.index} ${iincInsn.const}`;
            break;
        }
        case Opcode.WIDE:
            value += ` ${formatInsn((insn as WideInstruction).insn, pool)}`;
            break;
        case Opcode.INVOKEDYNAMIC:
        case Opcode.INVOKEINTERFACE:
        case Opcode.INVOKESPECIAL:
        case Opcode.INVOKESTATIC:
        case Opcode.INVOKEVIRTUAL:
            value += ` ${formatPoolEntry(pool[(insn as InvokeInstruction).ref]!, pool)}`;
            break;
        case Opcode.LDC:
        case Opcode.LDC_W:
        case Opcode.LDC2_W:
            value += ` ${formatPoolEntry(pool[(insn as ConstantInstruction).index]!, pool)}`;
            break;
        case Opcode.CHECKCAST:
        case Opcode.INSTANCEOF:
        case Opcode.NEW:
            value += ` ${formatPoolEntry(pool[(insn as TypeInstruction).index]!, pool)}`;
            break;
        case Opcode.BIPUSH:
        case Opcode.SIPUSH:
            value += ` ${(insn as PushInstruction).value}`;
            break;
        case Opcode.ANEWARRAY:
        case Opcode.NEWARRAY:
        case Opcode.MULTIANEWARRAY: {
            const arrayInsn = insn as ArrayInstruction;
            const arrayCode = ArrayCode[arrayInsn.type];

            value += ` ${arrayCode ? arrayCode.substring(2).toLowerCase() : formatPoolEntry(pool[arrayInsn.type]!, pool)}`;
            if (arrayInsn.opcode === Opcode.MULTIANEWARRAY) {
                value += ` ${arrayInsn.dimensions}`;
            }
            break;
        }
    }

    return value;
};
