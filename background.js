function get_config(callback) {
  chrome.storage.local.get(['openaiApiKey', 'systemMessage', 'maxTokenLength'], (config) => {
    const openaiApiKey = config.openaiApiKey;
    const systemMessage = config.systemMessage || 'you are a helpful assistant';
    const maxTokenLength = parseInt(config.maxTokenLength) || 500;
    const result = {
      openaiApiKey: openaiApiKey,
      systemMessage: systemMessage,
      maxTokenLength: maxTokenLength
    };
    callback(result);
  });
}

function sendMessageToActiveTab(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, { mode: 'context', message: message });
  });
}


// Create the context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'AdaDeEn',
    title: 'Deutsch - Englisch',
    contexts: ['selection'], // Show the menu item only in editable elements (textboxes, textareas, etc.)
  });
  chrome.contextMenus.create({
    id: 'AdaEnDe',
    title: 'Englisch - Deutsch',
    contexts: ['selection'], // Show the menu item only in editable elements (textboxes, textareas, etc.)
  });
  chrome.contextMenus.create({
    id: 'AdaSummarize',
    title: 'Zusammenfassung',
    contexts: ['selection'], // Show the menu item only in editable elements (textboxes, textareas, etc.)
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const { menuItemId, selectionText } = info;
  let prompt = ''; // Declare and initialize the prompt variable

  if (info.menuItemId === 'AdaDeEn') {
    prompt = "Übersetze den Text von Deutsch auf Englisch: " + selectionText;
  } else if (info.menuItemId === 'AdaEnDe') {
    prompt = "Übersetze den Text von Englisch auf Deutsch: " + selectionText;
  }
  else if (info.menuItemId === 'AdaSummarize') {
    prompt = "Fasse den Text zusammen: " + selectionText;
  }

  if (prompt !== '') {
    get_config((config) => {
      openAIChatCompletion(prompt, config)
        .then(function (response) {
          console.log('response backend: ' + response);
          sendMessageToActiveTab(response);
        })
        .catch(function (error) {
          console.log('response backend: ' + error);
          sendMessageToActiveTab(error);
        });
    });
  }
});


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.mode === 'chat_gpt') {
    get_config((config) => {
      if (!config.openaiApiKey || config.openaiApiKey.trim() === '' || config.openaiApiKey === undefined) {
        sendResponse({ mode: 'chat_gpt', status: 'error', message: 'Api key not set!' });
      } else {
        const prompt = request.message;
        console.log('prompt: ' + prompt);
        openAIChatCompletion(prompt, config)
          .then(function (response) {
            console.log('response backend: ' + response);
            sendResponse({ mode: 'chat_gpt', status: 'ok', message: response });
          })
          .catch(function (error) {
            sendResponse({ mode: 'chat_gpt', status: 'error', message: error.message });
          });
      }
    });
    return true; // return true to indicate that a response will be sent asynchronously
  }
});

async function openAIChatCompletion(prompt, config) {

  const systemMessage = config.systemMessage || 'you are a helpful assistant';
  const maxTokenLength = parseInt(config.maxTokenLength) || 500;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openaiApiKey}`
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: maxTokenLength,
      temperature: 0.0,
    }),
  });

  const data = await res.json();

  // Check if data.choices is defined and has at least one element
  if (data.choices && data.choices.length > 0) {
    return data.choices[0].message.content;
  } else {
    // Log the response data for debugging purposes
    console.error("Unexpected API response:", data);

    // Handle the error by throwing a custom message
    throw new Error("Unexpected API response. Please check the console for details.");
  }
}
