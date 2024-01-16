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
  
  
  export async function updateImageAttributes(child, brand) {
      const elementColorSchemeMatch = child.name.match(/^\{(\w+)(?:_(\w+))?\}$/);
      if (!elementColorSchemeMatch) return;
    
      const elementType = elementColorSchemeMatch[1];
      const colorScheme = elementColorSchemeMatch[2];
    
      // Update the src attribute based on the name of the element
      switch (elementType) {
        case 'logo':
        case 'icon':
        case 'wordmark':
          if (brand[elementType]) {
            if (/^https?:\/\//.test(brand[elementType])) {
              await fetchAndSetImage('src', brand[elementType], child);
            } else {
              child.src = brand[elementType];
            }
          }
          break;
        default:
          // Handle other cases or leave as is
          break;
      }
    
      // Determine color based on colorScheme
      const colorOptions = {
        primary_on_secondary: getColor(brand, "primary", "secondary"),
        secondary_on_primary: getColor(brand, "secondary", "primary"),
        primary_on_black: getColor(brand, "primary", "#000000", "secondary"),
        primary_on_white: getColor(brand, "primary", "#ffffff", "secondary"),
        secondary_on_black: getColor(brand, "secondary", "#000000", "primary"),
        secondary_on_white: getColor(brand, "secondary", "#ffffff", "primary"),
        light_color: getLighterColor(brand, "primary", "secondary"),
        dark_color: getDarkerColor(brand, "primary", "secondary"),
        white: "#ffffff",
        black: "#000000",
      };
    
      // Apply color scheme to colorsReplace if applicable
      if (child.type === 'svg' && child.colorsReplace) {
        const colorValue = colorOptions[colorScheme] || brand.defaultColor; // Use a default color if scheme not found
        Object.keys(child.colorsReplace).forEach(colorKey => {
          child.colorsReplace[colorKey] = colorValue;
        });
      }
    }