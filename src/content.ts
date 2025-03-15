import DOMMessenger from '@/common/helpers/dom-messenger';

DOMMessenger.registerMessageListener();

void chrome.runtime.sendMessage({
    domain: window.location.hostname,
    url: window.location.href,
});
