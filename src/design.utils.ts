const { createCanvas, registerFont } = require('canvas')

export async function updateDesignWithBrand(design, brand) {
  for (const page of design.pages) {
    await Promise.all(page.children.map((child) => processChild(child, brand)))
  }
  return design
}

export async function processChild(child, brand) {
  if (child.type === 'text') {
    child.text = replacePlaceholders(child.name, brand)
    updateFontStyle(child, brand)

    // missing here is capital letters, custom fonts and register fonts
    const newFontSize = await getDynamicFontSize({
      text: child.text,
      maxWidth: child.width,
      maxHeight: child.height,
      fontName: child.fontFamily,
      fontSize: child.fontSize,
      lineHeight: child.lineHeight,
      fontVariants: buildFontVariants(child.fontStyle, child.fontWeight),
    })

    child.fontSize = newFontSize
  }

  if (child.type === 'svg' || child.type === 'image') {
    await updateImageAttributes(child, brand)
  }

  if (child.children) {
    child.children.forEach((nestedChild) => {
      processChild(nestedChild, brand)
    })
  }
}

export function replacePlaceholders(text, brand) {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return brand[key] || match
  })
}

export function updateFontStyle(child, brand) {
  // Determine the required font style from the child element
  const requiresBold = child.fontWeight === 'bold'
  const requiresItalic = child.fontStyle === 'italic'

  // Find the matching font from the brand's fonts
  const matchingFont = brand.fonts.find((font) => {
    const isBoldMatch = font.bold === requiresBold
    const isItalicMatch = font.italic === requiresItalic
    return isBoldMatch && isItalicMatch
  })

  // Apply the font properties to the child element
  if (matchingFont) {
    child.fontFamily = matchingFont.name || child.fontFamily
    // Optionally use `value` or `url` if required
  } else {
    // Fallback logic if no matching font is found
    // You might want to use a default font or handle this case differently
  }
}

export function buildFontVariants(fontStyle, fontWeight) {
  //   let variants = ''

  //   // Add font style if it's italic
  //   if (fontStyle === 'italic') {
  //     variants += 'italic '
  //   }

  //   // Add font weight if it's bold
  //   if (fontWeight === 'bold' || fontWeight === 700) {
  //     variants += 'bold '
  //   }

  //   return variants.trim()

  const isItalic = fontStyle === 'italic'
  const isBold = fontWeight === 'bold' || fontWeight === 700

  const fontVariants = `${isItalic ? 'italic' : ''}${
    isItalic && isBold ? ' ' : ''
  }${isBold ? 'bold' : ''}`
  return fontVariants
}

async function getDynamicFontSize({
  text = '',
  maxWidth = 770,
  maxHeight = 548,
  fontName = 'Arial', // italic bold 10pt Courier
  fontVariants = '',
  fontSize = 120,
  lineHeight = 1.22,
}) {
  const finalLineHeight = lineHeight // + 0.2 // needed for huddle lineHeight diffs
  return await new Promise((resolve, reject) => {
    try {
      const canvas = createCanvas(maxWidth, maxHeight)
      const ctx = canvas.getContext('2d')
      ctx.textBaseline = 'top'
      ctx.font = `${fontVariants ? fontVariants + ' ' : ''}${String(
        fontSize,
      )}px ${fontName}`

      const getLines = (ctx, text, maxWidth, maxHeight) => {
        var words = text.split(' ')
        var lines = []
        var currentLine = words[0]

        for (var i = 1; i < words.length; i++) {
          var word = words[i]
          var width = ctx.measureText(currentLine + ' ' + word).width

          if (width < maxWidth) {
            currentLine += ' ' + word
          } else {
            lines.push(currentLine)
            currentLine = word
          }
        }
        lines.push(currentLine)
        return lines
      }

      let lines = getLines(ctx, text, maxWidth, maxHeight)

      let pixelsLineHeight = finalLineHeight
        ? Math.floor(fontSize * finalLineHeight)
        : fontSize

      const checkHeight = () => {
        var height = pixelsLineHeight * lines.length

        if (height > maxHeight) {
          fontSize--
          pixelsLineHeight = finalLineHeight
            ? Math.floor(fontSize * finalLineHeight)
            : fontSize
          ctx.font = `${fontVariants ? fontVariants + ' ' : ''}${String(
            fontSize,
          )}px ${fontName}`
          lines = getLines(ctx, text, maxWidth, maxHeight)
          checkHeight()
        } else {
          let exceeds = lines.filter((line) => {
            var width = ctx.measureText(line).width
            return width > maxWidth
          })

          if (exceeds && exceeds.length) {
            fontSize--
            pixelsLineHeight = finalLineHeight
              ? Math.floor(fontSize * finalLineHeight)
              : fontSize
            ctx.font = `${fontVariants ? fontVariants + ' ' : ''}${String(
              fontSize,
            )}px ${fontName}`
            checkHeight()
            return
          }

          for (var i = 0; i < lines.length; i++) {
            let y = i > 0 ? pixelsLineHeight * i : 0
            ctx.fillText(lines[i], 0, y)
          }

          var splitFont = ctx.font.split(' ')
          splitFont = splitFont.find((sf) => sf.includes('px'))
          var fontArr = splitFont.match(/^(.*?)px/) // TODO: - change regex
          if (fontArr && fontArr.length) {
            resolve(parseInt(fontArr[1]))
          }
        }
      }

      checkHeight()
    } catch (e) {
      console.log(e)
    }
  })
}

export async function fetchAndSetImage(attribute, srcUrl, child) {
  try {
    const response = await fetch(srcUrl);
    const svgText = await response.text();
    const base64EncodedSvg = btoa(svgText);
    child[attribute] = `data:image/svg+xml;base64,${base64EncodedSvg}`;
  } catch (error) {
    console.error('Error fetching image:', error)
  }
}

export async function updateImageAttributes(child, brand) {
  // Update the src attribute based on the name of the element
  switch (child.name) {
    case '{logo}':
      if (brand.logo) {
        // Check if it's a URL
        if (/^https?:\/\//.test(brand.logo)) {
          await fetchAndSetImage('src', brand.logo, child)
        } else {
          child.src = brand.logo
        }
      }
      break
    case '{icon}':
      if (brand.icon) {
        if (/^https?:\/\//.test(brand.icon)) {
          await fetchAndSetImage('src', brand.icon, child)
        } else {
          child.src = brand.icon
        }
      }
      break
    case '{wordmark}':
      if (brand.wordmark) {
        if (/^https?:\/\//.test(brand.wordmark)) {
          await fetchAndSetImage('src', brand.wordmark, child)
        } else {
          child.src = brand.wordmark
        }
      }
      break
    default:
      // Handle other cases or leave as is
      break
  }

  // Additional logic for SVG color replacements, if applicable
  if (
    child.type === 'svg' &&
    child.colorsReplace &&
    Array.isArray(brand.colors)
  ) {
    // Sort brand colors by rank, ensuring primary color is first
    const sortedColors = brand.colors.slice().sort((a, b) => {
      if (a.primary) return -1
      if (b.primary) return 1
      return (a.rank || 0) - (b.rank || 0)
    })

    // Apply sorted colors to the SVG
    Object.keys(child.colorsReplace).forEach((colorKey, index) => {
      if (sortedColors[index]) {
        child.colorsReplace[colorKey] = sortedColors[index].value
      }
    })
  }
}
