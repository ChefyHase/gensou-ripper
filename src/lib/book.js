'use strict';

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const Page = require('./page.js');
const fs = require('fs');
const path = require('path');
const tempfile = require('tempfile');
const puppeteer = require('puppeteer');

class Book {
  constructor(url) {
    this.url = url;

    this.html;
    this.body;
    this.text;

    this.title;
    this.author;

    this.pages = [];
  }

  async fetch() {
    try {
      const res = await fetch(this.url);
      const body = await res.text();
      this.html = body;

      const $ = cheerio.load(body, {
        decodeEntities: false
      });

      this.body = $.html('#contentBody');
      this.text = $('div', '#content').text();
      this.title = $('h1').text();
      this.author = $('address').children('a').slice(0, 1).text();
    } catch (e) {
      throw e;
    }
  }

  createPages() {
    const row = 34;
    const col = 16;
    const titleOffset = 7;

    let parafs = [];

    this.body = this.body.replace('<div id="contentBody">', '');
    this.body = this.body.replace(/\ /g, '　');
    this.body = this.body.replace(/（/g, ' (');
    this.body = this.body.replace(/「/g, ' [');
    this.body = this.body.replace('</div>', '<br><br>');

    while (true) {
      let index = this.body.search(/\<br\>\<br\>/g);
      let sliced = this.body.substring(0, index);
      parafs.push(sliced);
      this.body = this.body.replace(sliced + '<br><br>', '');

      if (index === -1) break;
    }

    let paragraph = [];

    for (let p of parafs) {
      let paraf = [];
      let par = p;

      while (true) {
        let index = par.search(/\<br\>/g);
        if (index === -1) {
          paraf.push(par);
          break;
        }
        let sliced = par.substring(0, index);
        paraf.push(sliced);
        let replaced = par.replace(sliced + '<br>', '');
        par = replaced;
      }

      paragraph.push(paraf);
    }

    let indexCounter = 0;

    indexCounter += titleOffset * row;
    for (let j = 0; j < paragraph.length; j++) {
      for (let i = 0; i < paragraph[j].length; i++) {
        if (paragraph[j][i] !== '') {
          for (let k = 0; k < paragraph[j][i].length; k++) {
            if (indexCounter >= row * col) {
              let temp = paragraph[j][i].substring(k, paragraph[j][i].length);
              paragraph[j][i] = paragraph[j][i].substring(0, k);
              paragraph[j].splice(i + 1, i, temp);

              indexCounter = 0;

              k = paragraph[j][i].length;
            } else {
              indexCounter++;
            }
          }
          // console.log(paragraph[j][i], indexCounter, indexCounter - row * col, row - (paragraph[j][i].length % row));
          indexCounter += row - (paragraph[j][i].length % row);
        }
      }
    }

    // console.log(paragraph);

    let constr = [];
    let praTmp = [];
    for (let j = 0; j < paragraph.length; j++) {
      for (let i = 0; i < paragraph[j].length; i++) {
        if (paragraph[j][i] !== ('　' || ' ') && (paragraph[j][i][0] == '　' || (paragraph[j][i][0] === ' ' && (paragraph[j][i][1] === '(' || '[')))) {
          let fixed = paragraph[j][i].replace(/ \(/g, '（');
          fixed = fixed.replace(/ \[/g, '「');

          praTmp.push(fixed);
        } else {
          constr.push(praTmp);

          let page = new Page(constr, this, this.pages.length + 1);
          this.pages.push(page);

          constr = [];
          praTmp = [];

          if (paragraph[j][i] !== ('　' || ' ')) {
            let fixed = paragraph[j][i].replace(/ \(/g, '（');
            fixed = fixed.replace(/ \[/g, '「');

            praTmp.push(fixed);
          }
        }
      }
    }
  }

  arrangement() {
    for (let p of this.pages) {
      p.arrangement();
    }
  }

  generateHTML() {
    const head = `<html> <meta charset="utf-8"> <style>html{font-size: 9pt;}@page{size: 106mm 149mm; margin: 0mm;}p{margin: 0 0rem;}h1{font-size: 1.8rem; margin: 1rem;}h2{font-size: 1.2rem; text-align: right; margin: 1rem;}.page{float: right; margin: 15mm 15mm; height: -webkit-calc(149mm - 30mm); width: -webkit-calc(106mm - 30mm); overflow: hidden;}.page #title{padding: 1rem;}.content{float: right; width: 18rem; height: 34rem; writing-mode: tb-rl; writing-mode: vertical-rl; /writing-mode: tb-rl; _writing-mode: tb-rl; -ms-writing-mode: tb-rl; -moz-writing-mode: vertical-rl; -webkit-writing-mode: vertical-rl; -o-writing-mode: vertical-rl;}.pageIdx{margin-right:auto; margin-left:auto; height: 1rem; width: 5rem; padding: 1rem 0 0 0; text-align: center;}.gothic{font-family: 'ヒラギノ角ゴ Pro W3', 'Hiragino Kaku Gothic Pro', '游ゴシック', 'Yu Gothic', '游ゴシック体', 'YuGothic', 'Meiryo UI', 'メイリオ', Meiryo, 'MS ゴシック', 'MS Gothic', sans-serif;}.mincho{font-family: 'ヒラギノ明朝 Pro W3', 'Hiragino Mincho Pro', 'HiraMinProN-W3', '游明朝', 'Yu Mincho', '游明朝体', 'YuMincho', 'HGS明朝E', 'HG明朝E', 'MS 明朝', 'MS Mincho', serif;}</style> <body>`;

    let html = '';
    for (let i of this.pages) {
      html += i.html;
    };

    const bottom = `</body></html>`;

    this.html = head + String(html).replace(/\,/g, '') + bottom;
  }

  async generatePDF(output) {
    const html = this.html;
    const tmpfile = tempfile('.html');
    fs.writeFileSync(tmpfile, html);

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`file://${tmpfile}`);

    await page.pdf({
      path: path.resolve(output),
      width: 106,
      height: 149,
    });

    browser.close();
  }
}

module.exports = Book;