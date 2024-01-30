export function getColor(
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

export function lightOrDark(color) {
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

export function hexToRgb(hex) {
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

export function luminance(rgb) {
  var a = rgb.map(function (v) {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

export function contrast(rgb1, rgb2) {
  const luminanceFront = luminance(rgb1)
  const luminanceBack = luminance(rgb2)
  return luminanceBack > luminanceFront
    ? (luminanceFront + 0.05) / (luminanceBack + 0.05)
    : (luminanceBack + 0.05) / (luminanceFront + 0.05)
}

export function colorPass(color1, color2) {
  const ratio = contrast(hexToRgb(color1), hexToRgb(color2))
  //return ratio < 0.14285 ? true : false;
  return ratio < 0.22222 ? true : false
}

export function findColorByPrimary(brand, isPrimary) {
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
