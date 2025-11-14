import { getRateImages } from '../data/mortgage'
import {
  findColorByPrimary,
  getColor,
  getDarkerColor,
  getLighterColor,
} from './colors.utils'

// Optional puppeteer fallback for complex SVG retrieval.
// We keep it lazy-loaded and singleton to prevent spawning many Chromium instances.
let puppeteer
try {
  puppeteer = require('puppeteer')
} catch (e) {
  // Puppeteer not available – fallback will be skipped.
}

const BROWSER_PAGE_LIMIT = 1 // Hard limit to avoid resource spikes.
let browserPromise = null
let activePages = 0
const pageQueue = []

async function getBrowser() {
  if (!puppeteer) return null
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    })
  }
  return browserPromise
}

function enqueuePageWork(workFn) {
  return new Promise((resolve, reject) => {
    pageQueue.push({ workFn, resolve, reject })
    processPageQueue()
  })
}

function processPageQueue() {
  while (activePages < BROWSER_PAGE_LIMIT && pageQueue.length) {
    const { workFn, resolve, reject } = pageQueue.shift()
    activePages++
    ;(async () => {
      try {
        const result = await workFn()
        resolve(result)
      } catch (err) {
        reject(err)
      } finally {
        activePages--
        processPageQueue()
      }
    })()
  }
}

async function fetchViaBrowser(url) {
  const browser = await getBrowser()
  if (!browser) return null
  return enqueuePageWork(async () => {
    const page = await browser.newPage()
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 12000 })
      if (!response) return null
      const ct = response.headers()['content-type'] || ''
      if (!ct.includes('image/svg') && !ct.includes('text/xml') && !ct.includes('text/html')) {
        return null
      }
      // Grab raw content (SVGs often served as text/html or image/svg+xml)
      const content = await response.text()
      return content
    } catch (e) {
      return null
    } finally {
      try { await page.close() } catch (_) {}
    }
  })
}

// Deduplicate in-flight fetches by URL (without cache-bust param)
const inFlight = new Map()

const svgo = require('svgo')

const svgOutputSettings = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          inlineStyles: {
            onlyMatchedOnce: false,
          },
          convertPathData: false,
          mergePaths: false,
        },
      },
    },
    {
      name: 'convertStyleToAttrs',
    },
  ],
}

function addNoCacheParam(url) {
  try {
    const u = new URL(url)
    u.searchParams.set('_', Date.now().toString())
    return u.toString()
  } catch (e) {
    const sep = url.includes('?') ? '&' : '?'
    return `${url}${sep}_=${Date.now()}`
  }
}

function stripCacheBust(url) {
  try {
    const u = new URL(url)
    u.searchParams.delete('_')
    return u.toString()
  } catch (e) {
    return url.replace(/([?&])_=[^&]+(&|$)/, '$1').replace(/[?&]$/, '')
  }
}

function shouldUseBrowser(firstAttemptOk, contentType, bodyText) {
  if (firstAttemptOk && contentType.includes('image/svg')) return false
  // If content type ambiguous, very small body, or fetch failed, try browser.
  if (!firstAttemptOk) return true
  if (!contentType || (!contentType.includes('svg') && !contentType.includes('xml') && !contentType.includes('text'))) return true
  if (bodyText && bodyText.length < 50) return true // suspiciously small
  return false
}

export async function fetchImage(srcUrl) {
  const key = stripCacheBust(srcUrl)
  if (inFlight.has(key)) return inFlight.get(key)
  const p = (async () => {
    try {
      // First attempt: plain fetch without aggressive cache-bust to allow CDN validation.
      const attemptUrl = addNoCacheParam(srcUrl) // still bust for freshness, but only one attempt.
      const response = await fetch(attemptUrl, {
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      })
      let bodyText = null
      let contentType = response.headers.get('content-type') || ''
      let ok = response.ok
      if (ok) {
        bodyText = await response.text()
        // If body clearly SVG markup return early.
        if (bodyText.trim().startsWith('<svg')) return bodyText
        // Some servers send data:image/svg+xml;base64
        if (bodyText.startsWith('data:image/svg+xml')) return bodyText
      }

      // Decide if we need browser fallback
      if (!shouldUseBrowser(ok, contentType, bodyText)) {
        return ok ? bodyText : null
      }

      const browserSvg = await fetchViaBrowser(srcUrl)
      return browserSvg || bodyText || null
    } catch (error) {
      // Last resort: browser
      try {
        const browserSvg = await fetchViaBrowser(srcUrl)
        return browserSvg
      } catch (_) {
        return null
      }
    } finally {
      inFlight.delete(key)
    }
  })()
  inFlight.set(key, p)
  return p
}

export function replaceSvgSetting(svg, key, val) {
  const regexKeyExists = new RegExp(`${key}=".*?"`, 'g')
  if (svg.search(regexKeyExists) !== -1) {
    // Replace existing key
    return svg.replace(regexKeyExists, `${key}="${val}"`)
  } else {
    // Add key to all tags
    const regexAddKey = /<(\w+)([^>]*)>/g
    return svg.replace(regexAddKey, `<$1 ${key}="${val}"$2>`)
  }
}

function removeWhiteSpace(svg) {
  let newSvg = svg
  let regex = new RegExp(`viewBox=".*?"`, 'g')
  newSvg = svg.replace(regex, `viewBox="8.8 13.99 85.88 70.36"`)
  return newSvg
}

function updateSvgDimensions(svg, newWidth, newHeight = null) {
  // // console.log('\n\noriginal, newWidth===\n\n', newWidth, newHeight, svg)
  // // Try to extract the current width and height directly from the attributes
  // const widthMatch = svg.match(/width="([\d.]+)"/)
  // const heightMatch = svg.match(/height="([\d.]+)"/)

  // let currentWidth = widthMatch ? parseFloat(widthMatch[1]) : null
  // let currentHeight = heightMatch ? parseFloat(heightMatch[1]) : null

  // // If width and height are not found in attributes, try viewBox
  // if (currentWidth === null || currentHeight === null) {
  //   const viewBoxMatch = svg.match(/viewBox="\d+\s+\d+\s+([\d.]+)\s+([\d.]+)"/)
  //   currentWidth = viewBoxMatch ? parseFloat(viewBoxMatch[1]) : 0
  //   currentHeight = viewBoxMatch ? parseFloat(viewBoxMatch[2]) : 0
  // }

  // // Calculate the aspect ratio
  // const aspectRatio = currentWidth / currentHeight

  // // Calculate new dimensions while maintaining aspect ratio
  // if (
  //   newWidth !== undefined &&
  //   newWidth !== null &&
  //   newHeight !== undefined &&
  //   newHeight !== null
  // ) {
  //   // Determine the limiting factor (width or height)
  //   const widthRatio = currentWidth / newWidth
  //   const heightRatio = currentHeight / newHeight

  //   if (widthRatio > heightRatio) {
  //     // Width is the limiting factor
  //     // newHeight = newWidth / aspectRatio
  //   } else {
  //     // Height is the limiting factor
  //     newWidth = newHeight * aspectRatio
  //   }
  // } else {
  //   // Handle cases where only one of newWidth or newHeight is provided
  //   if (newWidth !== undefined && newWidth !== null) {
  //     // newHeight = newWidth / aspectRatio
  //   } else if (newHeight !== undefined && newHeight !== null) {
  //     newWidth = newHeight * aspectRatio
  //   }
  // }

  // Replace or add width and height attributes
  svg = replaceOrAddAttribute(svg, 'width', newWidth) // .toFixed(2)
  // svg = replaceOrAddAttribute(svg, 'preserveAspectRatio', "xMidYMid meet"); // .toFixed(2)
  svg = replaceOrAddAttribute(svg, 'height', newHeight) // .toFixed(2)
  // svg = replaceOrAddAttribute(svg, 'style', "width: " + newWidth + "; height: " + newHeight + ";"); // .toFixed(2)

  // Replace or add viewBox attribute
  // svg = replaceOrAddAttribute(svg, 'viewBox', `0 0 ${newWidth.toFixed(2)} ${newHeight.toFixed(2)}`);
  // console.log('\n\nupdated===\n\n', svg, newHeight)
  return svg
}

// Function to replace or add an attribute
function replaceOrAddAttribute(svg, attrName, attrValue) {
  const attrRegex = new RegExp(`${attrName}="[^"]*"`)
  if (svg.match(attrRegex)) {
    return svg.replace(attrRegex, `${attrName}="${attrValue}"`)
  } else {
    return svg.replace('<svg', `<svg ${attrName}="${attrValue}"`)
  }
}

async function getOptimizedSVG(svg, brand) {
  svg = await svgo.optimize(svg, svgOutputSettings).data
  return svg
  // let classStyleFill = new RegExp('cls-.*?;}', 'g')
  // let classStyleMatches = svg.match(classStyleFill) //[ 'cls-1{fill:#fe5e15;}', 'cls-2{fill:#131545;}' ]
  // if (classStyleMatches && classStyleMatches.length) {
  //   let classes = classStyleMatches.map((cs) => {
  //     let classReg = new RegExp('cls-.*?{', 'g')
  //     let classMatches = svg.match(classReg) // [ 'cls-1{', 'cls-2{' ]
  //     classMatches = classMatches.map((c) => c.replace('{', ''))

  //     let fillReg = new RegExp('fill:.*?;}', 'g')
  //     let fillMatches = svg.match(fillReg) // [ 'fill:#fe5e15;}', 'fill:#131545;}' ]
  //     fillMatches = fillMatches.map((f) =>
  //       f.replace('fill:', '').replace(';}', ''),
  //     )

  //     if (
  //       classMatches &&
  //       classMatches.length &&
  //       fillMatches &&
  //       fillMatches.length === classMatches.length
  //     ) {
  //       classMatches.map((cm, index) => {
  //         let classesReg = new RegExp(`class="${cm}"`, 'g')
  //         svg = svg.replace(classesReg, `fill="${fillMatches[index]}"`)
  //       })
  //     }
  //   })
  // }

  // remove g and defs tags to remove masks
  let openG = new RegExp('<g.*?>', 'g')
  let closeG = new RegExp(`</g.*?>`, 'g')
  svg = svg.replace(openG, '')
  svg = svg.replace(closeG, '')

  let defs = new RegExp(`<defs.*?defs>`, 'g')
  svg = svg.replace(defs, '')

  // If is all white then use primary color
  // let fills = new RegExp(`fill=".*?"`, 'g')
  // let matches = svg.match(fills)

  // let allWhite =
  //   matches &&
  //   matches.filter((match) => {
  //     return (
  //       match.includes('"#fff"') ||
  //       match.includes('"#ffffff"') ||
  //       match.includes('"white"') ||
  //       match.includes('"rgba(255, 255, 255, 1)"') ||
  //       match.includes('"rgb(255, 255, 255)"') ||
  //       match.includes('"rgba(255,255,255,1)"') ||
  //       match.includes('"rgb(255,255,255)"')
  //     )
  //   }).length === matches.length

  // if (allWhite) {
  //   svg = svg.replace(
  //     fills,
  //     `fill="${findColorByPrimary(brand, true) || '000000'}"`,
  //   )
  // }

  // to split single path use svg.match("d=".*?"")
  // d.replace("M", '"></path><path d=M"')

  return svg
}

async function smartReplacement({key, brand}) {
  if (key.includes('_interest_rate')) {
    const rateImages = await getRateImages({brand})
    const rateMapping = {
      ai_interest_rate_chart: rateImages.rate_chart,
      ai_interest_rate_graph: rateImages.rate_graph,
      ai_interest_rate_range: rateImages.rate_range,
    }

    return rateMapping[key] || key;
  }
}

export async function updateImageAttributes({
  child,
  brand,
  user,
  additional = {},
}) {
  try {
    // Function to check if a value is a URL, SVG, or base64-encoded image
    const isValidValue = (value) => {
      // Regular expression to check for URL or base64-encoded image
      const urlOrBase64Regex =
        /^(https?:\/\/|data:image\/(svg\+xml|png|jpeg|jpg);base64,)/
      return urlOrBase64Regex.test(value)
    }

    // Filter additional object to include only keys with valid values
    const filteredAdditional = Object.keys(additional).reduce((acc, key) => {
      if (isValidValue(additional[key])) {
        acc[key] = additional[key]
      }
      return acc
    }, {})

    // Merge brand with the filtered additional object
    const combinedBrand = { ...brand, ...filteredAdditional }

    // add handle for image type and add avatar
    const elementColorSchemeMatch = child.name.match(/^\{(\w+?)(?:_(.+))?}$/)
    if (!elementColorSchemeMatch) return

    const elementType = elementColorSchemeMatch[1]
    const colorScheme = elementColorSchemeMatch[2]

    if (child.name.includes("ai_")) { // elementType.startsWith('ai')
      child.src = await smartReplacement({key: `${elementType}_${colorScheme}`, brand});
      return;
    }

    if (elementType === 'avatar' && user?.avatar?.length) {
      // && child.type === 'image'
      child.src = user.avatar
      return
    }

    let fetchedAsset = child.src

    if (child.src.startsWith('data:image/svg+xml;base64,')) {
      const cleanedString = child.src.replace(
        /^data:image\/svg\+xml;base64,/,
        '',
      )
      try {
        fetchedAsset = atob(cleanedString)
      } catch (error) {
        console.log('Error decoding SVG:', error)
      }
    }

    var elementTypeIncluded = combinedBrand.hasOwnProperty(elementType)

    var mutateColors = elementTypeIncluded || !colorScheme // if no color scheme that means only a color is provided

    let isBrandSvg = false

    // Update the src attribute based on the name of the element
    if (elementTypeIncluded) {
      // Determine if the brand asset appears to be an SVG by URL
      const assetUrl = combinedBrand[elementType]
      const looksLikeSvg = typeof assetUrl === 'string' && /\.svg(\?|#|$)/i.test(assetUrl)
      if (/^https?:\/\//.test(assetUrl)) {
        if (looksLikeSvg) {
          try {
            fetchedAsset = await fetchImage(assetUrl)
            isBrandSvg = true
          } catch (e) {
            console.log('Error fetching asset:', e)
          }
        } else {
          child.src = addNoCacheParam(assetUrl)
          return
        }
      } else {
        child.src = assetUrl
        return
      }
    }

    let finalSvg = fetchedAsset

    // Handle SVG color replacement
    if (
      mutateColors &&
      child.type === 'svg' &&
      child.colorsReplace &&
      Array.isArray(brand.colors) &&
      fetchedAsset?.length
    ) {
      // Determine colors based on colorScheme
      let colorsToApply = []
      let fillColorToApply

      var colorCase = colorScheme || elementType

      if (colorCase) {
        switch (colorCase) {
          case 'primary_on_secondary':
            colorsToApply = [
              findColorByPrimary(brand, true),
              findColorByPrimary(brand, false),
            ]
            fillColorToApply = getColor(brand, 'primary', 'secondary')
            break
          case 'secondary_on_primary':
            colorsToApply = [
              findColorByPrimary(brand, false),
              findColorByPrimary(brand, true),
            ]
            fillColorToApply = getColor(brand, 'secondary', 'primary')
            break
          case 'primary_on_black':
            colorsToApply = [findColorByPrimary(brand, true), '#000000']
            fillColorToApply = getColor(brand, 'primary', 'black')
            break
          case 'primary_on_white':
            colorsToApply = [findColorByPrimary(brand, true), '#ffffff']
            fillColorToApply = getColor(brand, 'primary', 'white')
            break
          case 'secondary_on_black':
            colorsToApply = [findColorByPrimary(brand, false), '#000000']
            fillColorToApply = getColor(brand, 'secondary', 'black')
            break
          case 'secondary_on_white':
            colorsToApply = [findColorByPrimary(brand, false), '#ffffff']
            fillColorToApply = getColor(brand, 'secondary', 'white')
            break
          case 'white':
            colorsToApply = ['#ffffff']
            break
          case 'black':
            colorsToApply = ['#000000']
            fillColorToApply = '#000000'
            break
          case 'light_color':
            fillColorToApply = getLighterColor(brand, 'primary', 'secondary')
            break
          case 'dark_color':
            fillColorToApply = getDarkerColor(brand, 'primary', 'secondary')
            break
          case 'primary':
            fillColorToApply = findColorByPrimary(brand, true)
            break
          case 'secondary':
            fillColorToApply = findColorByPrimary(brand, false)
            break
          default:
            break
        }

        if (fillColorToApply?.length) {
          finalSvg = replaceSvgSetting(finalSvg, 'fill', fillColorToApply)
          finalSvg = replaceSvgSetting(finalSvg, 'stroke', fillColorToApply)
        }
      }

      finalSvg = await getOptimizedSVG(finalSvg, brand)

      // replace width height
      if (isBrandSvg) {
        finalSvg = updateSvgDimensions(finalSvg, child.width, child.height)
      }

      const base64EncodedSvg = btoa(finalSvg)

      child.src = `data:image/svg+xml;base64,${base64EncodedSvg}`

      child.colorsReplace = {}

      // console.log(colorsToApply, child.colorsReplace)

      // if (!colorsToApply.length) {
      //   // Sort brand colors by rank, ensuring primary color is first
      //   const sortedColors = brand.colors.slice().sort((a, b) => {
      //     if (a.primary) return -1
      //     if (b.primary) return 1
      //     return (a.rank || 0) - (b.rank || 0)
      //   })

      //   // Apply sorted colors to the SVG
      //   colorsToApply = sortedColors.map((color) => color.value)
      // }

      // // Apply colors to the SVG
      // Object.keys(child.colorsReplace).forEach((colorKey, index) => {
      //   if (colorsToApply[index]) {
      //     child.colorsReplace[colorKey] = colorsToApply[index]
      //   }
      // })

      // console.log(child.colorsReplace)
    }
    // Fallback: if we fetched an asset but did not update child.src (non-SVG cases), ensure the direct URL is used with cache-busting
    if (elementTypeIncluded) {
      const assetUrl = combinedBrand[elementType]
      if (typeof assetUrl === 'string' && /^https?:\/\//.test(assetUrl)) {
        // If child.src wasn't set above (e.g., not an SVG or no mutation), set it now with cache busting
        if (!child.src || child.src === fetchedAsset) {
          child.src = addNoCacheParam(assetUrl)
        }
      }
    }
  } catch (error) {
    console.log(error)
  }
}
