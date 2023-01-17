const { POLOTNO_KEY } = require('./config.js')
const { createInstance } = require('./index.js')

async function run(json) {
  try {
    console.time('export')
    // create working instance
    const instance = await createInstance({
      key: POLOTNO_KEY,
    })

    // json.pages.forEach((page, index) => {
    const base64 = await instance.jsonToImageBase64(json, {
      // quality: 0.6,
      // parallel: 7,
    })
    
    console.timeEnd('export')
    // close instance
    instance.close()

    return base64;
  } catch (e) {
    throw e
  }
}

module.exports = {
  run,
}
