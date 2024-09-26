import { getRates } from '../data/mortgage'
const { createCanvas, registerFont } = require('canvas')

export async function smartReplacement({ key, brand }) {
  if (key.includes('_interest_rate')) {
    const rates = await getRates({ brand })
    const rateMapping = {
      ai_interest_rate_30: rates.rate_30,
      ai_interest_rate_15: rates.rate_15,
      ai_interest_rate_chart: rates.rate_chart,
      ai_interest_rate_graph: rates.rate_graph,
    }

    // Check if key contains any of the base rate identifiers
    const baseKey = Object.keys(rateMapping).find((base) => key.includes(base))
    return rateMapping[baseKey] || key
  }
  return key
}

// The following can be passed in additional to be replace if passed and found matching child.name
// amount
// address
// house_image
// detail1
// detail2
// detail3
// detail4
// date
// mortgage_rate

export async function replacePlaceholders({
  child,
  user,
  brand,
  additional = {},
}) {
  // Merge brand and additional objects. Properties in additional will overwrite those in brand if there's a conflict.
  const combinedKeysObject = { ...brand, ...additional }
  const combinedKeys = Object.keys(combinedKeysObject)

  // Create a regex pattern to identify placeholders within {}
  const placeholderPattern = /{([^}]+)}/g

  let replacementsMade = false

  // Use a loop to handle async replacements
  let updatedText = child.name;
  const matches = updatedText.match(placeholderPattern) || [];

  for (const match of matches) {
    const key = match.slice(1, -1); // Remove the curly braces from the placeholder
    let replaced = match; // Default to not replacing

    if (key.startsWith('ai_')) {
      replaced = await smartReplacement({ key, brand }); // Fetch rate or chart info
      replacementsMade = true;
    } else if (key.includes('name') && user && user.name) {
      // If the placeholder is "name", prioritize user firstName and lastName
      replaced = user.name;
      replacementsMade = true;
    } else {
      // Check each combined key to see if it's included in the placeholder key
      for (const combinedKey of combinedKeys) {
        if (
          key.includes(combinedKey) &&
          combinedKeysObject.hasOwnProperty(combinedKey)
        ) {
          replaced = combinedKeysObject[combinedKey];
          replacementsMade = true;
          break; // Once a replacement is made, no need to check further
        }
      }
    }

    // Replace the placeholder with the resolved value
    updatedText = updatedText.replace(match, replaced);
  }

  // Only update child.text if replacements were made
  if (replacementsMade) {
    child.text = updatedText;
  }
  // If no replacements were made, child.text remains unchanged
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
