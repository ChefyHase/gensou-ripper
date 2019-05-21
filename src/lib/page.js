class Page {
  constructor(paragraph, book, pagenum) {
    this.paragraph = paragraph;
    this.book = book;
    this.title = book.title;
    this.author = book.author;
    this.pagenum = pagenum;

    this.html;
  }

  arrangement() {
    let title = (this.pagenum === 1) ? `<div id="title"> <h1>${this.title}</h1> <h2>${this.author}</h2> </div>` : '';

    let parafs = '';
    for (let i of this.paragraph[0]) {
      parafs += `<p>${i}</p>`;
    }

    parafs = new String(parafs).replace(/\,/g, '');

    let html = `<div class="page"> <div class="content"> ${title} ${parafs} </div><p class="pageIdx">- ${this.pagenum} -</p></div>`;

    this.html = html;
  }
}

module.exports = Page;