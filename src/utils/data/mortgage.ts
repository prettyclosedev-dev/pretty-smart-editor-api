import axios from 'axios'
import * as cheerio from 'cheerio'
const { createCanvas } = require('canvas')

// Function to fetch rates
export async function getRates() {
  const rate_titles = {
    rate_30: '30 Yr. Fixed',
    rate_15: '15 Yr. Fixed',
    rate_fha: '30 Yr. FHA',
    rate_arm: '5/1 ARM',
  }

  const mBaseUrl = 'https://www.mortgagenewsdaily.com'
  const mBaseRatesUrl = `${mBaseUrl}/mortgage-rates`

  const rates = {}

  try {
    const { data } = await axios.get(mBaseRatesUrl)
    const $ = cheerio.load(data)

    $('.body-content .rate-options')
      .find('.rate-product')
      .each((index, elm) => {
        let aElm = $(elm).find('.rate-product-name a')
        let rateTitle = $(aElm).text().trim().split('\n')[0]
        let rate = $(elm).find('.clearfix .rate').text().trim().split('\n')[0]

        let rateKey = Object.keys(rate_titles).find(
          (key) => rate_titles[key] === rateTitle,
        )

        if (rateKey) {
          rates[rateKey] = rate
        }
      })

    return rates
  } catch (error) {
    console.error('Error fetching rates:', error)
    throw error
  }
}

// Function to generate the range SVG based on brand attributes
export function getRangeSvg(low, high, rateRange, brand) {
  const maxHeight = 32.5
  const canvas = createCanvas(300, maxHeight)
  const ctx = canvas.getContext('2d')
  const barWidth = 195
  const barX = 15
  const textY = 8.125
  const textMargin = 10

  // Set up brand-specific font
  const primaryFont = brand.fonts.find((font) => font.primary) || brand.fonts[0] // Get primary or fallback font
  ctx.font = `12px ${primaryFont.name || 'Arial'}` // Use brand's font or fallback to Arial

  // Set up brand-specific colors
  const primaryColor =
    brand.colors.find((color) => color.primary)?.value || '#1A428A' // Default to a blue color if none found
  const secondaryColor =
    brand.colors.find((color) => !color.primary)?.value || '#D5BA8C' // Default to a gold-like secondary color

  // Render the low value on the left side
  ctx.textBaseline = 'top'
  ctx.fillText(low, 0, textY)

  const lW = ctx.measureText(low).width
  ctx.beginPath()
  ctx.moveTo(lW + textMargin, barX)
  ctx.lineTo(barWidth, barX)

  ctx.lineWidth = 12
  ctx.strokeStyle = primaryColor // Use the brand's primary color
  ctx.stroke()

  // Calculate the percentage for the rateRange and position the marker
  const percent = (barWidth / 100) * parseInt(rateRange, 10)

  ctx.beginPath()
  ctx.moveTo(percent, 0)
  ctx.lineTo(percent, maxHeight)

  ctx.lineWidth = 3
  ctx.strokeStyle = secondaryColor // Use the brand's secondary color
  ctx.stroke()

  // Render the high value on the right side
  ctx.fillText(high, barWidth + textMargin, textY)

  // Finalize the canvas
  trimCanvas(ctx)

  // Return the image as base64 PNG
  return canvas.toDataURL('image/png')
}

// Utility function to trim any extra transparent space around the canvas
function trimCanvas(ctx) {
  const canvas = ctx.canvas
  const width = canvas.width
  const height = canvas.height
  const imgData = ctx.getImageData(0, 0, width, height)
  const data = new Uint32Array(imgData.data.buffer)

  let top = 0,
    left = 0,
    right = width - 1,
    bottom = height - 1,
    found = false

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] !== 0) {
        top = y
        found = true
        break
      }
    }
    if (found) break
  }

  found = false
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      if (data[y * width + x] !== 0) {
        bottom = y
        found = true
        break
      }
    }
    if (found) break
  }

  found = false
  for (let x = 0; x < width; x++) {
    for (let y = top; y <= bottom; y++) {
      if (data[y * width + x] !== 0) {
        left = x
        found = true
        break
      }
    }
    if (found) break
  }

  found = false
  for (let x = width - 1; x >= 0; x--) {
    for (let y = top; y <= bottom; y++) {
      if (data[y * width + x] !== 0) {
        right = x
        found = true
        break
      }
    }
    if (found) break
  }

  const croppedWidth = right - left + 1
  const croppedHeight = bottom - top + 1

  // Adjust the canvas to the new cropped size
  const croppedCanvas = createCanvas(croppedWidth, croppedHeight)
  const croppedCtx = croppedCanvas.getContext('2d')
  croppedCtx.putImageData(imgData, -left, -top)

  return croppedCanvas.toDataURL('image/png')
}

// Function to fetch chart images (including rate range image)
export async function getRateImages({ brand }) {
  const mBaseUrl = 'https://www.mortgagenewsdaily.com'
  const mBaseRatesUrl = `${mBaseUrl}/mortgage-rates`

  try {
    const { data } = await axios.get(mBaseRatesUrl)
    const $ = cheerio.load(data)

    const images = {}

    // Fetch small chart image
    const small_chart_url = $('.header-chart .chart img').attr('src')
    if (small_chart_url) {
      const { data: small_chart } = await axios.get(
        `${mBaseUrl}${small_chart_url}`,
      )
      const small_chart_svg = small_chart.substring(small_chart.indexOf('<svg'))
      images.rate_chart = `data:image/svg+xml;utf8,${small_chart_svg}`
    }

    // Fetch large chart image
    const large_chart_url = `https://shot.screenshotapi.net/screenshot?token=PMR3BHX-AMKMW7D-J35XS5Z-0AD25DW&url=https%3A%2F%2Fwww.mortgagenewsdaily.com%2Fcharts%2Fembed%2Fmnd-mtg-rates-30&full_page=true&fresh=true&output=json&file_type=png&wait_for_event=load`
    try {
      const { data: large_chart_data } = await axios.get(large_chart_url)
      if (large_chart_data && large_chart_data.screenshot) {
        const { data: imageData } = await axios.get(large_chart_data.screenshot, {
          responseType: 'arraybuffer',
        })
        const base64Image = Buffer.from(imageData, 'binary').toString('base64')
        images.rate_graph = `data:image/png;base64,${base64Image}`
      }
    } catch (error) {
      console.error(
        'Error fetching and converting the large chart image:',
        error,
      )
    }

    // Generate rate range image
    const firstRateElm = $('.body-content .rate-options')
      .find('.rate-product')
      .first()
    const rateRangeImage = getRangeSvg(
      $(firstRateElm).find('.low').text(),
      $(firstRateElm).find('.high').text(),
      $(firstRateElm).find('.rate-range .current').css('left').replace('%', ''),
      brand,
    )
    images.rate_range = rateRangeImage

    return images
  } catch (error) {
    console.error('Error fetching rate images:', error)
    throw error
  }
}
