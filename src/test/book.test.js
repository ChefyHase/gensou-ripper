'use strict';

const Book = require('../lib/book.js');
const cheerio = require('cheerio');

test('fetch', async () => {
  const book = new Book('http://coolier.dip.jp/sosowa/ssw_l/219/1530573953');
  await book.fetch();

  expect(book.body).toBeDefined();
  expect(book.text).toBeDefined();
  expect(book.title).toBeDefined();
  expect(book.author).toBeDefined();
});

test('createPages', async () => {
  const book = new Book('http://coolier.dip.jp/sosowa/ssw_l/219/1530573953');
  await book.fetch();

  book.createPages();

  expect(book.pages).toBeDefined();
});

test('arrangement', async () => {
  const book = new Book('http://coolier.dip.jp/sosowa/ssw_l/219/1530573953');
  await book.fetch();

  book.createPages();
  book.arrangement();

  expect(book.pages[0].html).toBeDefined();
});

test('generateHTML', async () => {
  const book = new Book('http://coolier.dip.jp/sosowa/ssw_l/219/1530573953');
  await book.fetch();

  book.createPages();
  book.arrangement();
  book.generateHTML();

  expect(book.pages[0].html).toBeDefined();
});

test('generatePDF', async () => {
  const book = new Book('http://coolier.dip.jp/sosowa/ssw_l/219/1530573953');
  await book.fetch();

  book.createPages();
  book.arrangement();
  book.generateHTML();
  await book.generatePDF('output.pdf');

  // expect(book.pages[0].html).toBeDefined();
});