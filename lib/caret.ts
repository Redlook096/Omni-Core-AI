export function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
  const {
    width,
    height,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    letterSpacing,
    lineHeight,
    textTransform,
    wordSpacing,
    textIndent,
    paddingLeft,
    paddingRight,
    paddingTop,
    paddingBottom,
    borderLeftWidth,
    borderRightWidth,
    borderTopWidth,
    borderBottomWidth,
  } = window.getComputedStyle(element);

  const div = document.createElement('div');
  div.id = 'input-textarea-caret-position-mirror-div';
  document.body.appendChild(div);

  const style = div.style;
  style.whiteSpace = 'pre-wrap';
  style.wordWrap = 'break-word';
  style.position = 'absolute';
  style.visibility = 'hidden';

  style.fontFamily = fontFamily;
  style.fontSize = fontSize;
  style.fontWeight = fontWeight;
  style.fontStyle = fontStyle;
  style.letterSpacing = letterSpacing;
  style.lineHeight = lineHeight;
  style.textTransform = textTransform;
  style.wordSpacing = wordSpacing;
  style.textIndent = textIndent;
  
  // Box sizing
  style.width = width;
  style.height = height;
  style.paddingLeft = paddingLeft;
  style.paddingRight = paddingRight;
  style.paddingTop = paddingTop;
  style.paddingBottom = paddingBottom;
  style.borderLeftWidth = borderLeftWidth;
  style.borderRightWidth = borderRightWidth;
  style.borderTopWidth = borderTopWidth;
  style.borderBottomWidth = borderBottomWidth;

  // Transfer content
  const value = element.value.substring(0, position);
  div.textContent = value;

  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(borderTopWidth),
    left: span.offsetLeft + parseInt(borderLeftWidth),
    height: parseInt(lineHeight)
  };

  document.body.removeChild(div);

  return coordinates;
}
