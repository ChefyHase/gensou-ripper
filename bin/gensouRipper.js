#!/usr/bin/env node

'use strict';

const program = require('commander');
const Book = require('../index');
const path = require('path');

let novelUrl, output = undefined;

program
  .version('0.1.0')
  .arguments('<url> [path]')
  .action((url, path) => {
    novelUrl = url;
    output = path;
  })

program.parse(process.argv);

if (typeof novelUrl === 'undefined') {
  console.error('no url given!');
  process.exit(1);
}

(async () => {
  const book = new Book(novelUrl);
  await book.fetch();

  book.createPages();
  book.arrangement();
  book.generateHTML();

  console.log(book.title);
  const outputPath = (typeof output !== 'undefined') ? path.resolve(output) : `./${book.title}.pdf`;
  await book.generatePDF(outputPath);
})();