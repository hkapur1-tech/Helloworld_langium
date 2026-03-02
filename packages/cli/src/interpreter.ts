/******************************************************************************
 * Star-style Interpreter for HelloWorld language
 ******************************************************************************/

import type {
    Model,
    Expression,
    BinaryExpression,
} from '../../language/src/generated/ast.js';

export function evaluateModel(model: Model): number[] {
    const results: number[] = [];

    for (const stmt of model.statement) {
        if (stmt.$type === 'Evaluation') {
            const value = evalExpression(stmt.expression);
            results.push(value);
        }
        // Definitions are ignored for now (same as Star examples)
    }

    return results;
}

function evalExpression(expr: Expression): number {
    switch (expr.$type) {

        case 'NumberLiteral':
            return expr.value;

        case 'BinaryExpression':
            return evalBinary(expr);

        case 'IfExpression': {
            const cond = evalExpression(expr.condition);
        if (Boolean(cond)) {
            return evalExpression(expr.thenBranch);
    }   else {
          return evalExpression(expr.elseBranch);
    }
}

        case 'FunctionCall':
            throw new Error('Function calls are not supported yet');

        default:
            // Exhaustiveness check
            const _exhaustive: never = expr;
            return _exhaustive;
    }
}

/**
 * Binary expression evaluation
 */
function evalBinary(expr: BinaryExpression): number {
    const left = evalExpression(expr.left);
    const right = evalExpression(expr.right);

    switch (expr.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '%': return left % right;
        case '^': return Math.pow(left, right);
        case '>':  return left > right ? 1 : 0;
        case '<':  return left < right ? 1 : 0;
        case '>=': return left >= right ? 1 : 0;
        case '<=': return left <= right ? 1 : 0;
        default:
            throw new Error(`Unknown operator: ${expr.operator}`);
    }
}

import { NodeFileSystem } from 'langium/node';
import { createHelloWorldServices } from 'hello-world-language';
import { extractDocument } from './util.js';

export const evalAction = async (fileName: string): Promise<void> => {
    const services = createHelloWorldServices(NodeFileSystem).HelloWorld;
    const document = await extractDocument(fileName, services);
    const model = document.parseResult.value as Model;

    const results = evaluateModel(model);
    for (const result of results) {
        console.log(result);
    }
};