export async function updateDesignWithBrand(design, brand) {
  design.pages.forEach((page) => {
    page.children.forEach((child) => {
      processChild(child, brand)
    })
  })
  return design;
}

export function processChild(child, brand) {
  if (child.type === 'text') {
    child.text = replacePlaceholders(child.name, brand)
    updateFontStyle(child, brand)
  }

  if (child.type === 'svg' || child.type === 'image') {
    updateImageAttributes(child, brand)
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

export function updateImageAttributes(child, brand) {
  // Update the src attribute based on the name of the element
  switch (child.name) {
    case '{logo}':
      if (brand.logo) {
        child.src = brand.logo
      }
      break
    case '{icon}':
      if (brand.icon) {
        child.src = brand.icon
      }
      break
    case '{wordmark}':
      if (brand.wordmark) {
        child.src = brand.wordmark
      }
      break
    default:
      // Handle other cases or leave as is
      break
  }

  // Additional logic for SVG color replacements, if applicable
  if (child.type === 'svg' && child.colorsReplace && Array.isArray(brand.colors)) {
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
