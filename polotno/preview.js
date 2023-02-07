const { POLOTNO_KEY } = require('./config.js')
const { createInstance } = require('./index.js')


//   export interface ExportOptions {
  //     pixelRatio?: number;
  //     ignoreBackground?: boolean;
  //     pageId?: string;
  //     includeBleed?: boolean;
  //     mimeType?: 'image/png' | 'image/jpeg';
  //     quality?: number;
  // }
  //save as Image fileName
async function jsonToImageBase64(json, attrs) {
  try {
    console.time('export')
    const instance = await createInstance({
      key: POLOTNO_KEY,
    })

    // json.pages.forEach((page, index) => { // multiple pages need multiple image exports not like pdf
    const base64 = await instance.jsonToImageBase64(json, attrs)
    console.timeEnd('export')
    instance.close()
    return base64;
  } catch (e) {
    throw e
  }
}

async function jsonToDataURL(json, attrs) {
  try {
    console.time('export')
    const instance = await createInstance({
      key: POLOTNO_KEY,
    })
    const dataURL = await instance.jsonToDataURL(json, attrs)
    console.timeEnd('export')
    instance.close()
    return dataURL;
  } catch (e) {
    throw e
  }
}

// export interface PDFExportOptions extends ExportOptions {
  //     dpi?: number;
  //     parallel?: number;
  //     pageIds?: Array<string>;
  //     unit?: 'pt' | 'mm' | 'cm' | 'in';
  //     pixelUnitRatio?: number;
  //fileName
  // }
async function jsonToPDFBase64(json, attrs) {
  try {
    console.time('export')
    const instance = await createInstance({
      key: POLOTNO_KEY,
    })
    const base64 = await instance.jsonToPDFBase64(json, attrs)
    console.timeEnd('export')
    instance.close()
    return base64;
  } catch (e) {
    throw e
  }
}

async function jsonToPDFDataURL(json, attrs) {
  try {
    console.time('export')
    const instance = await createInstance({
      key: POLOTNO_KEY,
    })
    const dataURL = await instance.jsonToPDFDataURL(json, attrs)
    console.timeEnd('export')
    instance.close()
    return dataURL;
  } catch (e) {
    throw e
  }
}

module.exports = {
  jsonToImageBase64,
  jsonToDataURL,
  jsonToPDFBase64,
  jsonToPDFDataURL,
}
