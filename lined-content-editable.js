var LinedContentEditable = window.LinedContentEditable || (() => {

  const initialize = (mainform) => {

    const generateRandomUUID = () => {
        let uuid = '';
        const characters = '0123456789abcdef';

        for (let i = 0; i < 32; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            uuid += characters[randomIndex];
        }

        return uuid;
    }

    const uid = generateRandomUUID();
    const dataHeader = mainform.getAttribute(`data-lined-form-header`) || '';
    const dataFooter = mainform.getAttribute(`data-lined-form-footer`) || '';
    const dataPlaceholder = mainform.getAttribute(`data-lined-form-placeholder`) || '';

    mainform.setAttribute(`data-lined-form-container`, true);
    mainform.setAttribute(`data-lined-form-container-${uid}`, true);
    mainform.innerHTML = `

    <div data-lined-form-back-text-content>
      <span data-header>${dataHeader}</span>
      <span data-footer><strong>${dataFooter}</strong></span>
    </div>
    <div data-lined-form-text-content>
      <span data-initial-span style="white-space: pre-wrap; width: 100%; position: absolute; pointer-events: none; user-select: none;">&nbsp;</span>
      <span data-header style="position: relative; opacity: 0; pointer-events: none; user-select: none;">${dataHeader}</span>
      <span data-lined-form-content-editable placeholder="${dataPlaceholder}" contenteditable="plaintext-only" style="white-space: pre-wrap; outline: none;"></span>
    </div>
    <div data-lined-form-back-touch-detector></div>
    <div data-lined-form-custom-caret></div>
    `;

    const createRange = (node, targetPosition) => {
      let range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
  
      let pos = 0;
      const stack = [node];
      while (stack.length > 0) {
          const current = stack.pop();
  
          if (current.nodeType === Node.TEXT_NODE) {
              const len = current.textContent.length;
              if (pos + len >= targetPosition) {
                  range.setStart(current, targetPosition - pos - 1);
                  range.setEnd(current, targetPosition - pos - 1);
                  return range;
              }
              pos += len;
          } else if (current.childNodes && current.childNodes.length > 0) {
              for (let i = current.childNodes.length - 1; i >= 0; i--) {
                  stack.push(current.childNodes[i]);
              }
          }
      }
  
      // The target position is greater than the
      // length of the contenteditable element.
      range.setStart(node, node.childNodes.length);
      range.setEnd(node, node.childNodes.length);
      return range;
    };

    const checkcaret = ((e) => {
      const selection = document.getSelection();
      if (selection && selection.anchorNode) {
        if (selection.anchorNode === e.target) {
          e.target.pastAnchorOffset = e.target.textContent.length;
        } else if (selection.anchorNode.parentElement === e.target) {
          e.target.pastAnchorOffset = selection.anchorOffset;
        }
      }
    })

    const caratUpdate = setInterval(() => {
      const eTarget = document.querySelector(`[data-lined-form-container-${uid}] [data-lined-form-content-editable]`);

      if (!eTarget) {
        clearInterval(caratUpdate);
      }

      const domCaret = mainform.querySelector("[data-lined-form-custom-caret]");

      requestAnimationFrame(() => {
        try {
          const selection = document.getSelection();
          if (selection && selection.anchorNode && selection.anchorNode.parentNode === eTarget && selection.type === "Caret") {
            const range = selection.getRangeAt(0);
            const targetX = range.getClientRects()[0].left - selection.anchorNode.parentElement.parentElement.getClientRects()[0].left;
            const targetY = range.getClientRects()[0].top - selection.anchorNode.parentElement.parentElement.getClientRects()[0].top;
            const exactTargetY = Math.floor( (targetY + 1) / mainform.exactLineHeight ) * mainform.exactLineHeight;
            domCaret.style.left = `${targetX}px`;
            domCaret.style.top = `${exactTargetY + (mainform.exactLineHeight / 4) }px`;
            domCaret.style.height = `${mainform.exactLineHeight / 2}px`;
          } else if (selection && selection.anchorNode && selection.anchorNode === eTarget && selection.type === "Caret") {
            const anchorNodeClientRects = selection.anchorNode.getClientRects();
            const targetX = anchorNodeClientRects[anchorNodeClientRects.length - 1].right - selection.anchorNode.parentElement.getClientRects()[0].left;
            const targetY = anchorNodeClientRects[anchorNodeClientRects.length - 1].top - selection.anchorNode.parentElement.getClientRects()[0].top;
            const exactTargetY = Math.floor( (targetY + 1) / mainform.exactLineHeight ) * mainform.exactLineHeight;
            domCaret.style.left = `${targetX}px`;
            domCaret.style.top = `${exactTargetY + (mainform.exactLineHeight / 4) }px`;
            domCaret.style.height = `${mainform.exactLineHeight / 2}px`;
          }

          if (selection && selection.anchorNode && 
            (selection.anchorNode !== eTarget)
            && 
            (selection.anchorNode.parentNode !== eTarget)
          ) {
            domCaret.style.display = `none`;
          } else {
            domCaret.style.display = `block`;
          }
        } catch (error) {
          //
          console.error(error)
        }

      })

    }, 50)

    const detectNonCondensedSpaces = (inputString) => {
      // Use a regular expression to find instances of two or more consecutive spaces
      let nonCondensedSpaces = inputString.match(/\s{2,}/g);
  
      // Display the non-condensed spaces found in the string
      if (nonCondensedSpaces) {
          console.log('Non-Condensed Spaces Detected:');
          return true;
      } else {
          console.log('No non-condensed spaces found in the string.');
      }
  
      return false;
    }

    const condenseSpaces = (inputString) => {
      // Use a regular expression to replace multiple spaces with a single space
      let condensedString = inputString
      .replace(/\n/g, '')
      .replace(/\s{2,}/g, ' ');
  
      // Display the modified string
      console.log('Original String:', inputString);
      console.log('Condensed String:', condensedString);
  
      return condensedString;
    }
  
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('keypress', checkcaret); // Every character written
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('mousedown', checkcaret); // Click down
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('touchstart', checkcaret); // Mobile
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('input', checkcaret); // Other input events
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('paste', checkcaret); // Clipboard actions
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('cut', checkcaret);
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('mousemove', checkcaret); // Selection, dragging text
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('select', checkcaret); // Some browsers support this event
    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('selectstart', checkcaret); // Some browsers support this event

    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('paste', (e) => {
      const pastedText = condenseSpaces(e.clipboardData.getData('text'));
      e.preventDefault();

      const maxLength = mainform.getAttribute("max-length") || 0;

      var trimmedPastedText = pastedText;

      if (maxLength) {
        const maxVacantLength = Math.max(0, maxLength - e.target.textContent.length);
        trimmedPastedText = pastedText.length > maxVacantLength ? pastedText.substring(0, maxVacantLength) : pastedText;
      }

      const startIdx = e.target.pastAnchorOffset || 0;
      const strOld = e.target.textContent || '';

      const strNew = strOld.slice(0, startIdx) + trimmedPastedText + strOld.slice(startIdx, strOld.length);
      e.target.textContent = condenseSpaces(strNew);

      document.getSelection().removeAllRanges();
      document.getSelection().addRange(createRange(e.target, e.target.pastAnchorOffset + trimmedPastedText.length + 1));

      e.target.pastInnerHTML = e.target.innerHTML;

      checkcaret(e);

      refreshHeights();
    });

    mainform.querySelector('[data-lined-form-content-editable]').addEventListener('input', (e) => {
      
      if (detectNonCondensedSpaces(e.target.textContent)) {
        e.target.textContent = condenseSpaces(e.target.textContent);
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(createRange(e.target, e.target.pastAnchorOffset));
      }

      const maxLength = mainform.getAttribute("max-length") || 0;

      if (maxLength && e.target.textContent.length > maxLength) {
        e.target.innerHTML = e.target.pastInnerHTML;
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(createRange(e.target, e.target.pastAnchorOffset));
      }

      e.target.pastInnerHTML = e.target.innerHTML;

      checkcaret(e);

      refreshHeights();
    });


    const refreshHeights = () => {
      refreshFormTextContentHeights();
      refreshBackTouchDetectorHeights();
    }

    const refreshFormTextContentHeights = () => {
      const exactLineHeight = mainform.exactLineHeight;
      const additionalLineHeight = mainform.additionalLineHeight;

      const formTextContent = mainform.querySelector("[data-lined-form-text-content]");
      const contentEditable = mainform.querySelector("[data-lined-form-content-editable]");
      const footer = mainform.querySelector("[data-footer]");

      const contentEditableClientRects = contentEditable.getClientRects();
      const contentEditableClientLastRect = contentEditableClientRects[contentEditableClientRects.length - 1];

      const footerClientRect = footer.getClientRects()[0];

      if (contentEditableClientLastRect.right > footerClientRect.left) {
        const lineCount = ((contentEditableClientLastRect.top - mainform.getClientRects()[0].top + exactLineHeight + exactLineHeight) / exactLineHeight);
        console.log("A", contentEditableClientLastRect.top, footerClientRect.top  + exactLineHeight, lineCount)
        mainform.style.height = `${ Math.floor(lineCount) * exactLineHeight }px`;
        footer.style.top = `${ mainform.offsetHeight - exactLineHeight }px`;
      } else {
        if (contentEditableClientLastRect.top < footerClientRect.top  + exactLineHeight) {
          const lineCount = ((contentEditableClientLastRect.top - mainform.getClientRects()[0].top + exactLineHeight) / exactLineHeight);
          console.log("B", contentEditableClientLastRect.top, footerClientRect.top  + exactLineHeight, lineCount)
          mainform.style.height = `${ Math.floor(lineCount) * exactLineHeight }px`;
          footer.style.top = `${ mainform.offsetHeight - exactLineHeight }px`;
        } else {
          const lineCount = ((contentEditableClientLastRect.top - mainform.getClientRects()[0].top + exactLineHeight + exactLineHeight) / exactLineHeight);
          console.log("C", contentEditableClientLastRect.top, footerClientRect.top  + exactLineHeight, lineCount)
          mainform.style.height = `${ Math.floor(lineCount) * exactLineHeight }px`;
          footer.style.top = `${ mainform.offsetHeight - exactLineHeight }px`;
        }
      }
    }

    const refreshBackTouchDetectorHeights = () => {
      const formTextContent = mainform.querySelector("[data-lined-form-text-content]");
      const contentEditable = mainform.querySelector("[data-lined-form-content-editable]");
      const backTouchDetector = mainform.querySelector("[data-lined-form-back-touch-detector]");

      const contentEditableClientRects = contentEditable.getClientRects();
      const contentEditableClientLastRect = contentEditableClientRects[contentEditableClientRects.length - 1];
      
      const formTextContentRect = formTextContent.getClientRects()[0];
      const requiredHeight = (formTextContentRect.y + formTextContentRect.height) - (contentEditableClientLastRect.y + contentEditableClientLastRect.height);

      backTouchDetector.style.height = `${Math.max(0, requiredHeight)}px`;

      if (!contentEditable.textContent) {
        backTouchDetector.style.height = `${mainform.clientHeight}px`;
      }
    }

    
    
    // Select the specific DOM element you wish to observe
    const targetElement = mainform.querySelector('[data-lined-form-content-editable]'); // Replace 'yourElementId' with the actual ID of the element

    // Create a new MutationObserver to watch for changes in the element
    const observer = new MutationObserver((mutationsList) => {
        for (let mutation of mutationsList) {
            console.log('Text/Content changed:', targetElement.innerHTML, targetElement.innerHTML.match(/<br\s*\/?>/gi), targetElement.innerHTML.length);

            if (targetElement.innerHTML.match(/\n/gi)) {
              targetElement.innerHTML = targetElement.innerHTML.replace(/\n/gi, '');
            }

        }
    });

    // Configure the observer to watch for childList and characterData changes
    const config = { childList: true, characterData: true };

    // Start observing the target element for changes
    observer.observe(targetElement, config);
    


    mainform.querySelectorAll("[data-lined-form-text-content]").forEach((it) => {
      const initialSpan = it.querySelector("[data-initial-span]");
      const style = window.getComputedStyle(initialSpan);
      const exactLineHeight = initialSpan.offsetHeight;
      it.style.background = `url(data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg height="${exactLineHeight}" width="1" xmlns="http://www.w3.org/2000/svg"><line x1="0" y1="${exactLineHeight}" x2="1" y2="${exactLineHeight}" style="stroke:black;stroke-width:2.0" /></svg>`)})`;
    })

    const initialSpan = mainform.querySelector("[data-initial-span]");
    initialSpan.textContent = " "
    const exactLineHeight = initialSpan.offsetHeight;

    const minLines = mainform.getAttribute("min-lines");
    if (minLines > 0) {
      mainform.style.minHeight = `${minLines * exactLineHeight}px`;
    }

    mainform.exactLineHeight = exactLineHeight;



    mainform.querySelectorAll("[data-lined-form-back-touch-detector]").forEach((it) => {
      it.addEventListener('click', (e) => {
        const contentEditable = mainform.querySelector('[data-lined-form-content-editable]');

        document.getSelection().removeAllRanges();
        document.getSelection().addRange(createRange(contentEditable, contentEditable.textContent.length + 1));

        checkcaret({target: contentEditable});
      })
    })

    refreshHeights();

  }

  return {
    initialize,
  }

})();