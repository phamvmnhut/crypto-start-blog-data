import { load } from 'cheerio';
import request from 'request-promise';
import { writeFileSync, readFileSync, createWriteStream } from 'fs';

function download(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    console.log('content-type:', res.headers['content-type']);
    console.log('content-length:', res.headers['content-length']);

    request(uri).pipe(createWriteStream("./images/" + filename)).on('close', callback);
  });
};


const MDX_STRUCTURE = `---
title: '__title__'
thumbnail: '__thumnail__'
date: '__date__'
tags: __tag__
summary: '__summary__'
---\n\n`

const HERE = "here";

const STYLE_TAG = "style";

const H1_TAG = "h1";
const H1_STRUCTURE = "\n# here\n";
const H2_TAG = "h2";
const H2_STRUCTURE = "\n## here\n";
const H3_TAG = "h3";
const H3_STRUCTURE = "\n### here\n";
const H4_TAG = "h4";
const H4_STRUCTURE = "\n#### here\n";
const H5_TAG = "h5";
const H5_STRUCTURE = "\n##### here\n";
const H6_TAG = "h6";
const H6_STRUCTURE = "\n###### here\n";

const BR_TAG = "br";
const IFRAME_TAG = "iframe";

const P_TAG = "p";
const P_FLAG = "p_flag";
const P_STRUCTURE = `${HERE}${P_FLAG}`;

const SPAN_TAG = "span";
const IMG_TAG = "img";
const IMG_STRUCTURE = "![__alt_text__](https://raw.githubusercontent.com/phamvmnhut/crypto-start-blog-data/main/images/__fileName__)"

const A_TAG = "a";
const A_STRUCTURE = "[here](__url__)";

const UL_TAG = "ul";
const UL_STRUCTURE = "\nhere\n"

const LI_TAG = "li";
const LI_FLAG = "li_flag"
const LI_STRUCTURE = "li_flaghere\n";

const DIV_TAG = "div";
const DIV_FLAG = "div_flag";
const DIV_STRUCTURE = `${HERE}${DIV_FLAG}`;

const STRONG_TAG = "strong";
const STORNG_START_FLAG = "strong_start_flag"
const STORNG_END_FLAG = "strong_end_flag"
const STRONG_STRUCTURE = `${STORNG_START_FLAG}here${STORNG_END_FLAG}`;

function main() {
  request('https://coin68.com/tong-hop-nhung-su-kien-noi-bat-trong-quy-22023/', (error, response, html) => {
    if (!error && response.statusCode == 200) {
      const $ = load(html);
      const h1First = $('h1').first();
      const headData = $("head");
      const title = h1First.text();
      const root = h1First.parent();

      const urlThumnail = headData.find("meta[itemprop=image]").prop("content");
      const imageName = urlThumnail.split('/images/')[1];
      download(urlThumnail, imageName, function () {
        console.log('downloaded' + imageName);
      });
      const summaryData = headData.find("meta[property=og:description]").prop("content");
      let dateNow = new Date();

      const data = handleHtml(root);
      const finalFormat = data
        .replaceAll(LI_FLAG, "\n - ")
        .replaceAll(DIV_FLAG, "\n\n")
        .replaceAll(P_FLAG, "\n\n")
        .replaceAll(STORNG_START_FLAG, "**")
        .replaceAll(STORNG_END_FLAG, "** ")
        .replaceAll("****", "")

      const metaData = MDX_STRUCTURE
        .replace("__title__", title)
        .replace("__thumnail__", "https://raw.githubusercontent.com/phamvmnhut/crypto-start-blog-data/main/images/" + imageName)
        .replace("__date__", `${dateNow.getMonth() + 1}/${dateNow.getDate()}/${dateNow.getFullYear()}`)
        .replace("__tag__", "['crypto']")
        .replace("__summary__", summaryData)

      writeFileSync(stringToSlug(title) + ".mdx", metaData + finalFormat);
    }
    else {
      console.log(error);
    }
  });
}

main();

function handleTag(tagName, data, cheerioElement) {
  if (data == undefined) return "";
  const formatData = data.replaceAll(/\s+/g, ' ').trim();

  if (tagName == STYLE_TAG) {
    return "";
  }
  if (tagName == P_TAG) {
    return P_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == H1_TAG) {
    return H1_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == H2_TAG) {
    return H2_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == H3_TAG) {
    return H3_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == H4_TAG) {
    return H4_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == H5_TAG) {
    return H5_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == H6_TAG) {
    return H6_STRUCTURE.replace(HERE, formatData);
  }

  if (tagName == UL_TAG) {
    return UL_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == LI_TAG) {
    return LI_STRUCTURE.replace(HERE, formatData);
  }

  if (tagName == A_TAG) {
    const hrefData = cheerioElement.prop("href");
    return A_STRUCTURE.replace(HERE, formatData).replace("__url__", hrefData);
  }

  if (tagName == IMG_TAG) {
    const srcData = cheerioElement.prop("src");
    const imageName = srcData.split('/images/')[1];
    const altTextData = cheerioElement.prop("alt");
    download(srcData, imageName, function () {
      console.log('downloaded' + imageName);
    });
    return IMG_STRUCTURE.replace("__alt_text__", altTextData).replace("__fileName__", imageName);
  }

  if (tagName == STRONG_TAG) {
    return STRONG_STRUCTURE.replace(HERE, formatData);
  }
  if (tagName == IFRAME_TAG) {
    return ""
  }
  if (tagName == SPAN_TAG || tagName == BR_TAG) {
    return formatData;
  }
  if (tagName == DIV_TAG) {
    return DIV_STRUCTURE.replace(HERE, data);
  }
  return data;
}

function handleHtml(cheerioElement) {
  const listChildren = cheerioElement.children();
  let data = ""
  listChildren.each(function (index, ele) {
    let tagName = ele.tagName;
    console.log(tagName);
    if (!tagName.includes(":p")) {

      let loadEleAgain = load(ele)(tagName);

      let elementCount = loadEleAgain.children().length;
      if (elementCount == 0) {
        data += handleTag(tagName, loadEleAgain.text(), loadEleAgain)
      } else {
        data += handleTag(tagName, handleHtml(loadEleAgain), loadEleAgain);
      }
    }
  })
  return data;
}

async function test() {
  const testHtml = readFileSync('./html_data.html');
  const $ = load(testHtml);

  const root = $('div');

  const data = handleHtml(root);
  const finalFormat = data
    .replaceAll(LI_FLAG, "\n - ")
    .replaceAll(DIV_FLAG, "\n\n")
    .replaceAll(P_FLAG, "\n\n")
    .replaceAll(STORNG_START_FLAG, "**")
    .replaceAll(STORNG_END_FLAG, "** ")
    .replaceAll("****", "")
  writeFileSync("test.md", finalFormat);
}

// test();

function stringToSlug(str) {
  // remove accents
  var from = "àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ",
    to = "aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy";
  for (var i = 0, l = from.length; i < l; i++) {
    str = str.replace(RegExp(from[i], "gi"), to[i]);
  }

  str = str.toLowerCase()
    .trim()
    .replace(/[^a-z0-9\-]/g, '-')
    .replace(/-+/g, '-');

  return str;
}