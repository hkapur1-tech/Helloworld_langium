import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { HelloWorldAstType, Person } from './generated/ast.js';
import type { HelloWorldServices } from './hello-world-module.js';
import { isBinaryExpression, isNumberLiteral, isFunctionCall ,isDefinition} from './generated/ast.js';
import {
    BinaryExpression,
    Expression,
    Model,
    FunctionCall,
} from './generated/ast.js';

/**
 * Register all custom validation checks
 */
export function registerValidationChecks(services: HelloWorldServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.HelloWorldValidator;

    const checks: ValidationChecks<HelloWorldAstType> = {
        Person: validator.checkPersonStartsWithCapital,
        Model: validator.checkPersonAreGreetedAtMostOnce,
        BinaryExpression: validator.checkDivByZero,
        FunctionCall: validator.checktwoArg
    };

    registry.register(checks, validator);
}

/**
 * Custom validations
 */
export class HelloWorldValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        const firstChar = person.name[0];
        if (firstChar && firstChar !== firstChar.toUpperCase()) {
            accept('warning', 'Person name should start with a capital.', {
                node: person,
                property: 'name'
            });
        }
    }

    checkPersonAreGreetedAtMostOnce(model: Model, accept: ValidationAcceptor): void {
        const counts = new Map<Person, number>();
        model.persons.forEach(p => counts.set(p, 0));

        model.greetings.forEach(g => {
            const person = g.person.ref;
            if (!person) return;

            const newValue = (counts.get(person) ?? 0) + 1;
            counts.set(person, newValue);

            if (newValue > 1) {
                accept('error', `You can greet each person at most once!`, {
                    node: g
                });
            }
        });
    }
     
    checktwoArg(call:FunctionCall, accept:ValidationAcceptor): void{
        const def = call.func.ref;
        if (!def || !isDefinition(def)) {
        return;
    }
        const expected = def.args.length;
        const actual = call.args.length;

    if (expected !== actual) {
        accept(
            'error',
            `Function '${def.name}' expects ${expected} argument(s) but got ${actual}.`,
            { node: call }
        );
    }
}
    checkDivByZero(binExpr: BinaryExpression, accept: ValidationAcceptor): void {
    const rightValue = this.evaluateLiteral(binExpr.right);
    if ((binExpr.operator === '/' || binExpr.operator === '%') && rightValue === 0) {
        accept('error', 'Division by zero is detected.', { node: binExpr, property: 'right' });
    }
     
}
   

/** Recursive evaluation of expressions for compile-time literals */
            private evaluateLiteral(expr: Expression): number | undefined {
                if (isNumberLiteral(expr)) {
                    return expr.value;
                } else if (isBinaryExpression(expr)) {
                    const left = this.evaluateLiteral(expr.left);
                    const right = this.evaluateLiteral(expr.right);
                    if (left === undefined || right === undefined) return undefined;

                    switch (expr.operator) {
                        case '+': return left + right;
                        case '-': return left - right;
                        case '*': return left * right;
                        case '/': return right !== 0 ? left / right : undefined;
                        case '%': return right !== 0 ? left % right : undefined;
                        case '^': return Math.pow(left, right);
                    }
                } else if (isFunctionCall(expr)) {
                    // Optionally: evaluate if all args are literals
                    return undefined;
                }
                return undefined;
            }
}