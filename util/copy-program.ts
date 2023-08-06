// Graciously borrowed from https://github.com/demox-labs/art-factory/tree/main/util
// All credit goes to the original author

import * as fs from 'fs-extra';
import * as path from 'path';
import * as dotenv from 'dotenv';

// load variables from .env file into process.env
dotenv.config({ path: `./.env.local`, override: true });

// define paths relative to this script's directory
const mainAleoPath = path.join(__dirname, '../aleo/newsletter/build/main.aleo');
const outputFilePath = path.join(__dirname, '../src/aleo/newsletter-program.ts');

// get values from .env
const PROGRAM_NAME = process.env.PROGRAM_NAME;
const ADDRESS = process.env.ADDRESS;
console.log(PROGRAM_NAME);

// read the main.aleo file
fs.readFile(mainAleoPath, 'utf8')
  .then((mainAleoContents: string) => {
    // wrap the contents in backticks and export as NewsletterProgram
    const program = mainAleoContents.replace(/newsletter\.aleo/g, PROGRAM_NAME!);

    const outputContents = `export const NewsletterProgramId = '${PROGRAM_NAME}';\n\nexport const NewsletterProgram = \`${program}\`;\n`;

    // write the updated data to a new file
    return fs.writeFile(outputFilePath, outputContents);
  })
  .then(() => {
    console.log('Successfully created and updated the file');
  })
  .catch((err) => {
    console.error('An error occurred:', err);
  });
