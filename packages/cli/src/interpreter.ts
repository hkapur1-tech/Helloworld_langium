/******************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/

import { Model } from '../../language/src/generated/ast.js';
import { NodeFileSystem } from 'langium/node';
import { createHelloWorldServices} from 'hello-world-language';
import { extractDocument } from './util.js';
import chalk from 'chalk';
import { interpretEvaluations } from 'hello-world-language';

export const evalAction = async (fileName: string): Promise<void> => {
    const services = createHelloWorldServices(NodeFileSystem).HelloWorld;
       const document = await extractDocument(fileName, services);
    // console.log(JSON.stringify(document.parseResult.value, null, 2));
    const model = document.parseResult.value as Model;
    for (const [evaluation, value] of interpretEvaluations(model)) {
        const cstNode = evaluation.expression.$cstNode;
        if (cstNode) {
            const line = cstNode.range.start.line + 1;
            console.log(`line ${line}:`, chalk.green(cstNode.text), '===>', value);
        }
    }
};