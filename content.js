function getActiveElementType(activeElement) {
  if (
    (activeElement.tagName.toLowerCase() === 'input' &&
      activeElement.type.toLowerCase() === 'text') ||
    activeElement.tagName.toLowerCase() === 'textarea'
  ) {
    return 'inputOrTextarea';
  } else if (activeElement.getAttribute('contenteditable') === 'true') {
    return 'contentEditable';
  } else {
    return 'none';
  }
}

function sendMessage(prompt) {
  console.log('querying chatgpt: ' + prompt);
  chrome.runtime.sendMessage({ mode: 'chat_gpt', message: prompt }, (response) => {
    if (response.mode === 'chat_gpt') {
      const activeElement = document.activeElement;
      const responseWithBreak = response.message + '\n';
      console.log('chatgpt response: ' + response.message);
      const activeElementType = getActiveElementType(activeElement);

      if (activeElementType === 'inputOrTextarea') {
        activeElement.value = activeElement.value.replace('loading...', responseWithBreak);
      } else if (activeElementType === 'contentEditable') {
        activeElement.innerHTML = activeElement.innerHTML.replace('loading...', responseWithBreak);
      } else {
        console.log('No active text field, textarea, or content-editable element found.');
      }
    }
  });
}

function doKeyPress(e) {
  if (e.keyCode === 13) {
    const activeElement = document.activeElement;
    let text = '';

    const activeElementType = getActiveElementType(activeElement);

    if (activeElementType === 'inputOrTextarea') {
      text = activeElement.value;
    } else if (activeElementType === 'contentEditable') {
      text = activeElement.innerText;
    }

    const aiCommandPattern = /(\/ai:)([\s\S]*?)(;|(?=\n|$))/;
    const aiMatch = text.match(aiCommandPattern);

    if (aiMatch) {
      console.log('ai keyword detected!')
      e.preventDefault();
      const aiCommand = aiMatch[0];
      const prompt = aiMatch[2].trim().split(';')[0];

      if (activeElementType === 'inputOrTextarea') {
        activeElement.value = activeElement.value.replace(aiCommand, 'loading...');
        sendMessage(prompt);
      } else if (activeElementType === 'contentEditable') {
        activeElement.innerHTML = activeElement.innerHTML.replace(aiCommand, 'loading...');
        sendMessage(prompt);
      } else {
        console.log('no text field / editable content detected')
      }
    }
  }
}

document.addEventListener('keydown', function (event) {
  if (event.keyCode === 13) {
    const activeElement = document.activeElement;
    let text = '';
    const activeElementType = getActiveElementType(activeElement);

    if (activeElementType === 'inputOrTextarea') {
      text = activeElement.value;
    } else if (activeElementType === 'contentEditable') {
      text = activeElement.innerText;
    }
    if (text.startsWith('/ai:')) {
      event.preventDefault();
    }
  }
});

if (window == top) {
  window.addEventListener('keyup', doKeyPress, false);
}
chrome.runtime.onMessage.addListener((message, sender) => {
  console.log(message)
  if (message.mode === 'context') {
    const activeElement = document.activeElement;
    const responseWithBreak = message.message + '\n';
    console.log('chatgpt response: ' + message.message);
    const activeElementType = getActiveElementType(activeElement);

    if (activeElementType === 'inputOrTextarea') {
      // Check if there is selected text
      if (activeElement.selectionStart !== activeElement.selectionEnd) {
        const selectedText = activeElement.value.substring(activeElement.selectionStart, activeElement.selectionEnd);
        activeElement.value = activeElement.value.substring(0, activeElement.selectionStart) + responseWithBreak + activeElement.value.substring(activeElement.selectionEnd);
      } else {
        activeElement.value = responseWithBreak;
      }
    } else if (activeElementType === 'contentEditable') {
      // Check if there is selected text
      const selection = window.getSelection();
      if (selection.toString() !== "") {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const replacedText = document.createTextNode(responseWithBreak);
        range.insertNode(replacedText);
      } else {
        activeElement.innerHTML = responseWithBreak;
      }
    } else {
      console.log('No active text field, textarea, or content-editable element found.');
    }
  }
});
