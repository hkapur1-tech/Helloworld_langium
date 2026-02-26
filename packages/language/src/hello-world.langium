grammar HelloWorld

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w]*/;
terminal NUMBER returns number: /[0-9]+(\.[0-9]*)?/;

entry Model: (persons+=Person | greetings+=Greeting | statement+=Statement)*;

Person:
    'person' name=ID;

Greeting:
    'Hello' person=[Person] '!';

Statement:
    Definition | Evaluation;
Definition:
    'def' name=ID 
    ('(' args+=DeclaredParameter (',' args+=DeclaredParameter)* ')')?
    ':' expr=Expression ';';

DeclaredParameter: name=ID;
type AbstractDefinition = Definition | DeclaredParameter ;

Evaluation:
    expression=Expression ';';

Expression:
    BinaryExpression;

infix BinaryExpression on PrimaryExpression:
    '%'
    > '^'
    > '*' | '/'
    > '+' | '-';

PrimaryExpression infers Expression:
    '(' Expression ')' |
    {infer NumberLiteral} value=NUMBER |
    {infer FunctionCall} func=[AbstractDefinition] ('(' args+=Expression (',' args+=Expression)* ')')?;

//goal 2+2
