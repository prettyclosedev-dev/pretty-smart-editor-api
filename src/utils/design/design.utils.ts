import { updateImageAttributes } from './svg.utils'
import {
  buildFontVariants,
  getDynamicFontSize,
  replacePlaceholders,
  updateFontStyle,
  updateTextColorAttributes,
} from './text.utils'

import * as fs from 'fs'
import * as path from 'path'

import { createInstance } from 'polotno-node'
import {
  findColorByPrimary,
  getColor,
  getDarkerColor,
  getLighterColor,
} from './colors.utils'

require('dotenv').config()

export async function updateDesignWithBrand({
  design,
  brand,
  withPreview,
  user,
  previewOptions = { pixelRatio: 0.5, mimeType: 'image/png' },
  additional,
}) {
  if (!design) {
    throw new Error('Design is required');
  }

  // Process each page and its children
  for (const page of design.pages) {
    await Promise.all(
      page.children.map((child) =>
        processChild({ child, brand, additional, withPreview, user }),
      ),
    );
  }

  // Generate preview if requested
  if (withPreview) {
    try {
      const instance = await createInstance({
        key: process.env.POLOTNO_KEY,
      });

      let data;
      if (previewOptions.mimeType === 'application/pdf') {
        // Generate PDF preview
        data = await instance.jsonToPDFBase64(design, previewOptions);
      } else {
        // Generate image preview (JPEG or PNG)
        data = await instance.jsonToImageBase64(design, previewOptions);
      }

      design.preview = data;
      instance.close();
    } catch (e) {
      console.error(e);
    }
  }

  return design;
}

export async function processChild({ child, brand, additional, withPreview, user }) {
  if (child.type === 'text') {
    await replacePlaceholders({child, user, brand, additional})
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

    updateColorAttributes(child, brand)
  }

  if (child.type === 'svg' || child.type === 'image') {
    await updateImageAttributes({child, brand, user, additional})
  }

  if (child.type === 'figure' || child.type === 'line') {
    await updateColorAttributes(child, brand)
  }

  if (child.children) {
    child.children.forEach((nestedChild) => {
      processChild({ child: nestedChild, brand, withPreview, user })
    })
  }
}

export function splitColorClass(colorClass) {
  const parts = colorClass.split('_on_')
  return parts.length === 2 ? parts : [colorClass, null]
}

export async function updateColorAttributes(child, brand) {
  const classes = [
    'primary',
    'secondary',
    'black',
    'white',
    'light_color',
    'dark_color',
    'primary_on_secondary',
    'secondary_on_primary',
    'primary_on_black',
    'primary_on_white',
    'secondary_on_black',
    'secondary_on_white',
  ]

  let fillColor, strokeColor, color

  classes.forEach((colorClass) => {
    if (child.name.includes(`fill_${colorClass}`)) {
      const [top, bottom] = splitColorClass(colorClass)
      fillColor = getColor(brand, top, bottom)
    }
    if (child.name.includes(`stroke_${colorClass}`)) {
      const [top, bottom] = splitColorClass(colorClass)
      strokeColor = getColor(brand, top, bottom)
    }
    if (child.name.includes(colorClass) && !fillColor && !strokeColor) {
      const [top, bottom] = splitColorClass(colorClass)
      fillColor = strokeColor = color = getColor(brand, top, bottom)
    }
  })

  // Dual Attribute Colors
  const dualPattern = /fill_([a-zA-Z]+)_stroke_([a-zA-Z]+)/
  const dualMatch = child.name.match(dualPattern)
  if (dualMatch) {
    const [top1, bottom1] = splitColorClass(dualMatch[1])
    fillColor = getColor(brand, top1, bottom1)
    const [top2, bottom2] = splitColorClass(dualMatch[2])
    strokeColor = getColor(brand, top2, bottom2)
  }

  // Apply the colors
  if (fillColor && child.hasOwnProperty('fill')) {
    child.fill = fillColor
  }
  if (strokeColor && child.hasOwnProperty('stroke')) {
    child.stroke = strokeColor
  }
  if (color && child.hasOwnProperty('color')) {
    child.color = color
  }
}
