document.addEventListener('DOMContentLoaded', function () {
  // Set default values if not set
  chrome.storage.local.get(['openaiApiKey', 'systemMessage', 'maxTokenLength'], (result) => {
    if (result.openaiApiKey) {
      document.getElementById('openaiApiKey').value = result.openaiApiKey;
    }

    if (!result.systemMessage) {
      document.getElementById('systemMessage').value = 'You are a helpful assistant.';
    } else {
      document.getElementById('systemMessage').value = result.systemMessage;
    }

    if (!result.maxTokenLength) {
      document.getElementById('maxTokenLength').value = 500;
    } else {
      document.getElementById('maxTokenLength').value = result.maxTokenLength;
    }
  });
});

document.getElementById('settingsForm').addEventListener('submit', function (event) {
  event.preventDefault();

  const openaiApiKey = document.getElementById('openaiApiKey').value;
  const systemMessage = document.getElementById('systemMessage').value;
  const maxTokenLength = document.getElementById('maxTokenLength').value;

  chrome.storage.local.set({
    openaiApiKey: openaiApiKey,
    systemMessage: systemMessage,
    maxTokenLength: maxTokenLength,
  });

  window.close();
});
