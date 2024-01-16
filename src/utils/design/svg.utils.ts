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

export async function fetchAndSetImage(attribute, srcUrl, child) {
  try {
    const response = await fetch(srcUrl)
    const svgText = await response.text()
    const base64EncodedSvg = btoa(svgText)
    child[attribute] = `data:image/svg+xml;base64,${base64EncodedSvg}`
  } catch (error) {
    console.error('Error fetching image:', error)
  }
}

export function replaceSvgSetting(svg, key, val) {
  let newSvg = svg
  if (svg.indexOf(key) > -1) {
    let regex = new RegExp(`${key}=".*?"`, 'g')
    newSvg = svg.replace(regex, `${key}="${val}"`) // `fill="${val}"`
  } else {
    const split = svg.split('<svg')
    if (split && split.length > 1) {
      if (!split[1].includes('fill')) {
        // check if we have defined fill on main svg attr
        newSvg = svg.replace('viewBox', `fill="${val}" viewBox`)
      }
    }
  }

  return newSvg
}

function removeWhiteSpace(svg) {
  let newSvg = svg
  let regex = new RegExp(`viewBox=".*?"`, 'g')
  newSvg = svg.replace(regex, `viewBox="8.8 13.99 85.88 70.36"`)
  return newSvg
}

function getColor(
  brand,
  top,
  bottom: null | string,
  fallback: null | string = null,
) {
  let topColorValue =
    top === 'primary'
      ? findColorByPrimary(brand, true)
      : findColorByPrimary(brand, false)
  let bottomColorValue =
    bottom === 'primary'
      ? findColorByPrimary(brand, true)
      : bottom === 'secondary'
      ? findColorByPrimary(brand, false)
      : bottom
  let fallbackColorValue =
    fallback === 'primary'
      ? findColorByPrimary(brand, true)
      : fallback === 'secondary'
      ? findColorByPrimary(brand, false)
      : fallback

  let hex = topColorValue

  if (topColorValue && bottom) {
    let pass = colorPass(topColorValue, bottomColorValue)

    if (!pass) {
      let brightness = lightOrDark(bottomColorValue)

      if (brightness === 'light') {
        hex = '#000000'
      } else {
        hex = '#ffffff'
      }
    }
  } else if (fallback) {
    let pass = colorPass(topColorValue, fallbackColorValue)

    if (!pass) {
      let fallbackBrightness = lightOrDark(fallbackColorValue)

      if (fallbackBrightness === 'light') {
        hex = '#000000'
      } else if (fallbackBrightness === 'dark') {
        hex = '#ffffff'
      }
    }
  }

  return hex
}

export function getDarkerColor(brand, top, bottom) {
  let topColorValue =
    top === 'primary'
      ? findColorByPrimary(brand, true)
      : findColorByPrimary(brand, false)
  let bottomColorValue =
    bottom === 'primary'
      ? findColorByPrimary(brand, true)
      : findColorByPrimary(brand, false)

  if (topColorValue && bottomColorValue) {
    let topLuminance = luminance(hexToRgb(topColorValue))
    let bottomLuminance = luminance(hexToRgb(bottomColorValue))
    return topLuminance < bottomLuminance ? topColorValue : bottomColorValue
  } else {
    return undefined
  }
}

export function getLighterColor(brand, top, bottom) {
  let topColorValue =
    top === 'primary'
      ? findColorByPrimary(brand, true)
      : findColorByPrimary(brand, false)
  let bottomColorValue =
    bottom === 'primary'
      ? findColorByPrimary(brand, true)
      : findColorByPrimary(brand, false)

  if (topColorValue && bottomColorValue) {
    let topLuminance = luminance(hexToRgb(topColorValue))
    let bottomLuminance = luminance(hexToRgb(bottomColorValue))
    return topLuminance > bottomLuminance ? topColorValue : bottomColorValue
  } else {
    return undefined
  }
}

function lightOrDark(color) {
  // Variables for red, green, blue values
  var r, g, b, hsp

  // Check the format of the color, HEX or RGB?
  if (color.match(/^rgb/)) {
    // If RGB --> store the red, green, blue values in separate variables
    color = color.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/,
    )

    r = color[1]
    g = color[2]
    b = color[3]
  } else {
    // If hex --> Convert it to RGB: http://gist.github.com/983661
    color = +('0x' + color.slice(1).replace(color.length < 5 && /./g, '$&$&'))

    r = color >> 16
    g = (color >> 8) & 255
    b = color & 255
  }

  // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
  hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b))

  // Using the HSP value, determine whether the color is light or dark
  if (hsp > 127.5) {
    return 'light'
  } else {
    return 'dark'
  }
}

function hexToRgb(hex) {
  var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, function (m, r, g, b) {
    return r + r + g + g + b + b
  })

  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null
}

function luminance(rgb) {
  var a = rgb.map(function (v) {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

function contrast(rgb1, rgb2) {
  const luminanceFront = luminance(rgb1)
  const luminanceBack = luminance(rgb2)
  return luminanceBack > luminanceFront
    ? (luminanceFront + 0.05) / (luminanceBack + 0.05)
    : (luminanceBack + 0.05) / (luminanceFront + 0.05)
}

function colorPass(color1, color2) {
  const ratio = contrast(hexToRgb(color1), hexToRgb(color2))
  //return ratio < 0.14285 ? true : false;
  return ratio < 0.22222 ? true : false
}

async function getOptimizedSVG(svg, brand) {
  svg = await svgo.optimize(svg, svgOutputSettings).data

  let classStyleFill = new RegExp('cls-.*?;}', 'g')
  let classStyleMatches = svg.match(classStyleFill) //[ 'cls-1{fill:#fe5e15;}', 'cls-2{fill:#131545;}' ]
  if (classStyleMatches && classStyleMatches.length) {
    let classes = classStyleMatches.map((cs) => {
      let classReg = new RegExp('cls-.*?{', 'g')
      let classMatches = svg.match(classReg) // [ 'cls-1{', 'cls-2{' ]
      classMatches = classMatches.map((c) => c.replace('{', ''))

      let fillReg = new RegExp('fill:.*?;}', 'g')
      let fillMatches = svg.match(fillReg) // [ 'fill:#fe5e15;}', 'fill:#131545;}' ]
      fillMatches = fillMatches.map((f) =>
        f.replace('fill:', '').replace(';}', ''),
      )

      if (
        classMatches &&
        classMatches.length &&
        fillMatches &&
        fillMatches.length === classMatches.length
      ) {
        classMatches.map((cm, index) => {
          let classesReg = new RegExp(`class="${cm}"`, 'g')
          svg = svg.replace(classesReg, `fill="${fillMatches[index]}"`)
        })
      }
    })
  }

  // remove g and defs tags to remove masks
  let openG = new RegExp('<g.*?>', 'g')
  let closeG = new RegExp(`</g.*?>`, 'g')
  svg = svg.replace(openG, '')
  svg = svg.replace(closeG, '')

  let defs = new RegExp(`<defs.*?defs>`, 'g')
  svg = svg.replace(defs, '')

  // If is all white then use primary color
  let fills = new RegExp(`fill=".*?"`, 'g')
  let matches = svg.match(fills)

  let allWhite =
    matches &&
    matches.filter((match) => {
      return (
        match.includes('"#fff"') ||
        match.includes('"#ffffff"') ||
        match.includes('"white"') ||
        match.includes('"rgba(255, 255, 255, 1)"') ||
        match.includes('"rgb(255, 255, 255)"') ||
        match.includes('"rgba(255,255,255,1)"') ||
        match.includes('"rgb(255,255,255)"')
      )
    }).length === matches.length

  if (allWhite) {
    svg = svg.replace(
      fills,
      `fill="${(brand && brand.colors && brand.colors.primary) || '000000'}"`,
    )
  }

  // to split single path use svg.match("d=".*?"")
  //d.replace("M", '"></path><path d=M"')

  return svg
}

function findColorByPrimary(brand, isPrimary) {
  // First, try to find a color marked as primary (or secondary, based on the isPrimary flag)
  let foundColor = brand.colors?.find((color) => color.primary === isPrimary)

  // If no primary/secondary color is found, find the color with the highest rank (i.e., rank 0)
  if (!foundColor) {
    // Sort the colors by rank in descending order and take the first one
    let sortedColors = [...brand.colors]?.sort((a, b) => b.rank - a.rank)
    foundColor = sortedColors?.[0]
  }

  return foundColor ? foundColor.value : undefined
}

export async function updateImageAttributes(child, brand) {
  const elementColorSchemeMatch = child.name.match(/^\{(\w+)(?:_(\w+))?}$/)
  if (!elementColorSchemeMatch) return // Exit if the name doesn't match the pattern

  const elementType = elementColorSchemeMatch[1]
  const colorScheme = elementColorSchemeMatch[2]

  // Update the src attribute based on the name of the element
  switch (elementType) {
    case 'logo':
    case 'icon':
    case 'wordmark':
      if (brand[elementType]) {
        if (/^https?:\/\//.test(brand[elementType])) {
          await fetchAndSetImage('src', brand[elementType], child)
        } else {
          child.src = brand[elementType]
        }
      }
      break
    default:
      // Handle other cases or leave as is
      break
  }

  // Handle SVG color replacement
  if (
    child.type === 'svg' &&
    child.colorsReplace &&
    Array.isArray(brand.colors)
  ) {
    // Determine colors based on colorScheme
    let colorsToApply = []
    if (colorScheme) {
      switch (colorScheme) {
        case 'primary_on_secondary':
          colorsToApply = [
            findColorByPrimary(brand, true),
            findColorByPrimary(brand, false),
          ]
          break
        case 'secondary_on_primary':
          colorsToApply = [
            findColorByPrimary(brand, false),
            findColorByPrimary(brand, true),
          ]
          break
        case 'primary_on_black':
          colorsToApply = [findColorByPrimary(brand, true), '#000000']
          break
        case 'primary_on_white':
          colorsToApply = [findColorByPrimary(brand, true), '#ffffff']
          break
        case 'secondary_on_black':
          colorsToApply = [findColorByPrimary(brand, false), '#000000']
          break
        case 'secondary_on_white':
          colorsToApply = [findColorByPrimary(brand, false), '#ffffff']
          break
        case 'white':
          colorsToApply = ['#ffffff']
          break
        case 'black':
          colorsToApply = ['#000000']
          break
        // Add additional cases here as needed
        default:
          break
      }
    }

    if (!colorsToApply.length) {
      // Sort brand colors by rank, ensuring primary color is first
      const sortedColors = brand.colors.slice().sort((a, b) => {
        if (a.primary) return -1
        if (b.primary) return 1
        return (a.rank || 0) - (b.rank || 0)
      })

      // Apply sorted colors to the SVG
      colorsToApply = sortedColors.map((color) => color.value)
    }

    // Apply colors to the SVG
    Object.keys(child.colorsReplace).forEach((colorKey, index) => {
      if (colorsToApply[index]) {
        child.colorsReplace[colorKey] = colorsToApply[index]
      }
    })
  }
}
