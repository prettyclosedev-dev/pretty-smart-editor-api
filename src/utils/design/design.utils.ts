import { updateImageAttributes } from "./svg.utils"
import { buildFontVariants, getDynamicFontSize, replacePlaceholders, updateFontStyle } from "./text.utils"

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