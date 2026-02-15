import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { HelloWorldAstType, Person,Model } from './generated/ast.js';
import type { HelloWorldServices } from './hello-world-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: HelloWorldServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.HelloWorldValidator;
    const checks: ValidationChecks<HelloWorldAstType> = {
        Person: validator.checkPersonStartsWithCapital,
        Model: validator.checkPersonAreGreetedAtMostOnce
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class HelloWorldValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

     checkPersonAreGreetedAtMostOnce(model:Model, accept: ValidationAcceptor): void {
        //create a multi-counter variable using a map
        const counts = new Map<Person, number>();
        //initialize the counter for each person to zero
        model.persons.forEach(p => counts.set(p, 0));
        //iterate over all greetings and count the number of greetings for each person
        model.greetings.forEach(g => {
            const person = g.person.ref;
            //Attention! if the linker was unsucessful, person is undefined
            if(person) {
                //set the new value of the counter
                const newValue = counts.get(person)!+1;
                counts.set(person, newValue);
                //if the counter is greater than 1, create a helpful error
                if(newValue > 1) {
                    accept('error', `You can greet each person at most once! This is the ${newValue}${newValue==2?'nd':'th'} greeting to ${person.name}.`, {
                        node: g
                    });
                }
            }
        });
    }

}
