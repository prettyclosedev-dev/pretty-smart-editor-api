const { createCanvas, registerFont } = require('canvas')

export function replacePlaceholders(child, brand) {
  const brandKeys = Object.keys(brand);
  const deepNameCopy = child.name;
  // Create a regex pattern to identify placeholders within {}
  const placeholderPattern = /{([^}]+)}/g;
  // Extract keys from child.name and replace in child.text
  deepNameCopy.match(placeholderPattern)?.forEach((match) => {
    const key = match.slice(1, -1); // Remove the curly braces to get the key
    for (const brandKey of brandKeys) {
      if (key.includes(brandKey)) {
        child.text = deepNameCopy.replace(new RegExp(`{${key}}`, 'g'), brand[brandKey]);
      }
    }
  });
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

export async function getDynamicFontSize({
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

      const getLines = (ctx, text = '', maxWidth, maxHeight) => {
        var words = text?.split(' ')
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
