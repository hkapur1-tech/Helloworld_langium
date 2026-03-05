/******************************************************************************
 * Copyright 2023 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import type { ResolvedReference } from 'langium';
import { isDefinition, type BinaryExpression, type Definition, type FunctionCall } from './generated/ast.js';

export type Value = number | boolean

export function applyOp(op: BinaryExpression['operator']): (x: Value, y: Value) => Value {
    switch (op) {
        case '+': return (x, y) => ensureNumber(x, 'left') + ensureNumber(y, 'right');
        case '-': return (x, y) =>ensureNumber(x, 'left') - ensureNumber(y, 'right');
        case '*': return (x, y) => ensureNumber(x, 'left') * ensureNumber(y, 'right');
        case '^': return (x, y) => Math.pow(ensureNumber(x, 'left'), ensureNumber(y, 'right'));
        case '%': return (x, y) => ensureNumber(x, 'left') % ensureNumber(y, 'right');
        case '/': return (x, y) => {
            if (y === 0) {
                throw new Error('Division by zero');
            }
            return ensureNumber(x, 'left') / ensureNumber(y, 'right');
        };
        case '<': return (x, y) => ensureNumber(x, 'left') < ensureNumber(y, 'right');
        case '>': return (x, y) => ensureNumber(x, 'left') > ensureNumber(y, 'right');
        case '<=' : return (x, y) => ensureNumber(x, 'left') <= ensureNumber(y, 'right');
        case '>=': return (x, y) => ensureNumber(x, 'left') >= ensureNumber(y, 'right');
        default: throw new Error('Unknown operator: ' + op);
    }
}

export type ResolvedFunctionCall = FunctionCall & {
    func: ResolvedReference<Definition>
}

export function isResolvedFunctionCall(functionCall: FunctionCall): functionCall is ResolvedFunctionCall {
    return isDefinition(functionCall.func.ref);
}

function ensureNumber(value: Value, label: string): number {
    if (typeof value !== 'number') {
        throw new Error(`Expected ${label} to be a number, got ${typeof value}.`);
    }
    return value;
}

