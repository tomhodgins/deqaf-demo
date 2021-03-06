export default function(selector='', ...extra) {

  // Built-in element query tests
  const eq = {
    minWidth: (el, number) => number <= el.offsetWidth,
    maxWidth: (el, number) => number >= el.offsetWidth,
    minHeight: (el, number) => number <= el.offsetHeight,
    maxHeight: (el, number) => number >= el.offsetHeight,
    minChildren: (el, number) => number <= el.children.length,
    totalChildren: (el, number) => number === el.children.length,
    maxChildren: (el, number) => number >= el.children.length,
    minCharacters: (el, number) => number <= (el.value ? el.value.length : el.textContent.length),
    characters: (el, number) => number === (el.value ? el.value.length : el.textContent.length),
    maxCharacters: (el, number) => number >= (el.value ? el.value.length : el.textContent.length),
    minScrollX: (el, number) => number <= el.scrollLeft,
    maxScrollX: (el, number) => number >= el.scrollLeft,
    minScrollY: (el, number) => number <= el.scrollTop,
    maxScrollY: (el, number) => number >= el.scrollTop,
    minAspectRatio: (el, number) => number <= el.offsetWidth / el.offsetHeight,
    maxAspectRatio: (el, number) => number >= el.offsetWidth / el.offsetHeight,
    orientation: (el, string) => ({
      portrait: el => el.offsetWidth < el.offsetHeight,
      square: el => el.offsetWidth === el.offsetHeight,
      landscape: el => el.offsetHeight < el.offsetWidth
    })[string](el)
  }

  let options = {}
  let plugins = eq
  let stylesheet = ''

  switch (extra.length) {

    // If 2 arguments present, use as options and custom plugin
    case 3:
      options = extra[0]
      plugins = Object.assign(extra[1], plugins)
      stylesheet = extra[2]
    break

    // If 1 argument present, use as options
    case 2:
      options = extra[0]
      stylesheet = extra[1]
    break

    // If no arguments present, run as scoped style
    case 1:
      stylesheet = extra[0]
    break

  }

  // Create a custom data attribute we can assign if the tag matches
  const attr = (selector + Object.entries(options)).replace(/\W/g, '')

  // For each tag in the document matching the CSS selector
  const result = Array.from(document.querySelectorAll(selector))

    // Process each tag and return a string of CSS that tag needs
    .reduce((output, tag, count) => {

      // Test tag to see if it passes all conditions
      if (

        // Pass if every condition given is true
        Object.keys(options).every(test => {

          // If condition is a property of the tag, test the property
          if (
            tag[test] !== null 
            && typeof options[test] === 'function'
          ) return options[test](tag[test])

          // Otherwise if condition is a method of the tag, run the method
          else if (tag[test]) return options[test] === tag[test]

          // Otherwise if condition matches a loaded plugin, run the plugin
          else if (plugins[test]) return plugins[test](tag, options[test])

        })

      ) {

        // If the tag passes, set a custom data attribute
        output.add.push({tag: tag, count: count})

        // Add CSS stylesheet to output, replacing [--self] with the current tag
        output.styles.push(
          stylesheet.replace(
            /:self|\$this|\[--self\]/g,
            `${selector}[data-element-atRule-${attr}="${count}"]`
          )
        )

      } else {

        // Otherwise if tag fails tests, remove custom data attribute value
        output.remove.push(tag)

      }

      return output

    }, {styles: [], add: [], remove: []})

    result.add.forEach(
      tag => tag.tag.setAttribute(`data-element-atRule-${attr}`, tag.count)
    )

    result.remove.forEach(
      tag => tag.setAttribute(`data-element-atRule-${attr}`, '')
    )

    return result.styles.join('\n')

}