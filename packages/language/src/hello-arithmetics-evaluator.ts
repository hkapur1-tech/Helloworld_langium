/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
import { AbstractDefinition,Definition, Evaluation, Expression, IfExpression, Model, Statement } from './generated/ast.js';
import { isBinaryExpression, isDefinition, isEvaluation, isFunctionCall, isNumberLiteral,isIfExpression } from './generated/ast.js';
import { applyOp, Value } from './arithmetics-util.js';

export function interpretEvaluations(module: Model): Map<Evaluation, Value> {
    const ctx = <InterpreterContext>{
        module,
        context: new Map<string, Value | Definition>(),
        result: new Map<Evaluation, Value>()
    };
    return evaluate(ctx);
}

export interface InterpreterContext {
    module: Model,
    // variable name --> value
    context: Map<string, Value | Definition>,
    // expression --> value
    result: Map<Evaluation, Value>
}

function evaluate(ctx: InterpreterContext): Map<Evaluation, Value> {
    ctx.module.statement.forEach(stmt => evalStatement(ctx, stmt));
    return ctx.result;
}

function evalStatement(ctx: InterpreterContext, stmt: Statement): void {
    if (isDefinition(stmt)) {
        evalDefinition(ctx, stmt);
    } else if (isEvaluation(stmt)) {
        evalEvaluation(ctx, stmt);
    } else {
        console.error('Impossible type of Statement.');
    }
}


function evalDefinition(ctx: InterpreterContext, def: Definition): void {
    ctx.context.set(def.name, def.args.length > 0 ? def : evalExpression(def.expr, ctx));
}

function evalEvaluation(ctx: InterpreterContext, evaluation: Evaluation): void {
    ctx.result.set(evaluation, evalExpression(evaluation.expression, ctx));
}

function evalIfExpression(expr: IfExpression): Value {
    const condition = ensureBoolean(evalExpression(expr.condition), 'if condition');
    return condition
        ? evalExpression(expr.thenBranch)
        : evalExpression(expr.elseBranch);
    
}

export function evalExpression(expr: Expression, ctx?: InterpreterContext): Value {
    if(ctx === undefined) {
        ctx = <InterpreterContext>{
            module: expr.$document?.parseResult.value,
            context: new Map<string, number | Definition>(),
            result: new Map<Evaluation, number>()
        };
    }
    if (isBinaryExpression(expr)) {
        const left = evalExpression(expr.left, ctx);
        const right = evalExpression(expr.right, ctx);
        if (right === undefined) return left;
        return applyOp(expr.operator)(left, right);
    }
    if (isNumberLiteral(expr)) {
        return +expr.value;
    }
    if(isIfExpression(expr)){
        return evalIfExpression(expr)
    }
    if (isFunctionCall(expr)) {
        const valueOrDef = ctx.context.get((expr.func.ref as AbstractDefinition).name) as Value | Definition;
        if (!isDefinition(valueOrDef)) {
            return valueOrDef as Value;
        }

        // Check that the number of arguments matches the definition
        if (valueOrDef.args.length !== expr.args.length) {
            throw new Error(
                `Function definition and its call have different number of arguments: ${valueOrDef.name}`
            );
        }

        // Create a local context for function execution
        const localContext = new Map<string, Value | Definition>(ctx.context);

        // Bind each argument (params are strings)
        for (let i = 0; i < valueOrDef.args.length; i++) {
            localContext.set(valueOrDef.args[i].name, evalExpression(expr.args[i], ctx));
        }

        // Evaluate the function body in the local context
        return evalExpression(valueOrDef.expr, { module: ctx.module, context: localContext, result: ctx.result });
    }
    throw new Error('Impossible type of Expression.');
}

function ensureBoolean(value: Value, label: string): boolean {
    if (typeof value !== 'boolean') {
        throw new Error(`Expected ${label} to be a boolean, got ${typeof value}.`);
    }
    return value;
}