import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import Swal from 'sweetalert2';

// Override Swal.fire to be completely static and iconless (no animations, no emojis, no icons)
const originalFire = Swal.fire;
Swal.fire = function (...args) {
  let options = args[0];
  if (typeof options === 'string') {
    options = {
      title: args[0] || '',
      text: args[1] || '',
      icon: args[2] || undefined
    };
    args = [options];
  }
  if (typeof options === 'object' && options !== null) {
    options.showClass = { popup: '', backdrop: '' };
    options.hideClass = { popup: '', backdrop: '' };
    options.animation = false;
    delete options.icon;
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2B50}\u{2B55}\u{2934}\u{2935}\u{2190}-\u{21FF}]/gu;
    if (options.title) {
      options.title = options.title.replace(/[¡!]/g, '').replace(emojiRegex, '');
    }
    if (options.text) {
      options.text = options.text.replace(emojiRegex, '');
    }
    if (options.html) {
      options.html = String(options.html).replace(emojiRegex, '');
    }
  }
  return originalFire.apply(Swal, args);
};

import App from './App.jsx';
import './estilos/global.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);