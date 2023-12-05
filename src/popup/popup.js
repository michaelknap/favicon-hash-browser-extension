/**
 * Favicon Hash Browser Extension
 * 
 * Description:
 * This script is part of a Firefox extension that extracts favicons from the currently active tab,
 * converts them to a base64 format, and then calculates their MurmurHash3 (mmh3) hash values as 
 * expected by Shodan Search Engine. 
 * 
 * 
 * Author: Michael Knap
 * Created: 5/12/2023
 * License: MIT
 * Repository: https://github.com/michaelknap/favicon-hash-browser-extension
 */
'use strict';


// Event listener for DOMContentLoaded to ensure the DOM is fully loaded before executing script.
document.addEventListener('DOMContentLoaded', function() {
  // Getting references to the DOM elements used in the script.
  const favicons_container = document.getElementById('favicons-container');

  // Converts an ArrayBuffer to a Base64 string, formatted as per Shodan's expected input.
  function array_buffer_to_base64(buffer) {
    let data = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      data += String.fromCharCode(bytes[i]);
    }
    // Adding newline characters after every 76 characters and at the end
    // because Shodan, in their implementation, chose to use base64.encodebytes() or
    // codecs.encode(data, "base64") as opposed to base64.b64encode() like a sane person would.
    return window.btoa(data)
      .match(/.{1,76}/g)
      .join('\n') + '\n';
  }

  const fetch_and_hash_favicon = (favicon_url, callback) => {
    fetch(favicon_url)
      .then(response => {
        if (!response.ok) {
          throw new Error('Favicon not found');
        }
        return response.arrayBuffer();
      })
      .then(array_buffer => {
        const base64_string = array_buffer_to_base64(array_buffer);
        const hash = mmh3(base64_string); //Compute mmh3 hash. 
        callback(favicon_url, hash);
      })
      .catch(error => console.error('Error fetching favicon:', error));
  };

  function display_favicon_and_hash(url, hash) {
    // Create elements
    const row_element = document.createElement('tr');
    const img_cell = document.createElement('td');
    const hash_cell = document.createElement('td');
    const url_cell = document.createElement('td');

    // Set contents safely
    const img_element = document.createElement('img');
    img_element.src = url;
    img_element.width = 48;
    img_element.height = 48;
    const link_1 = document.createElement('a');
    link_1.href = url;
    link_1.target = '_blank';
    link_1.appendChild(img_element);
    img_cell.appendChild(link_1);

    const link_2 = document.createElement('a');
    link_2.href =
      `https://www.shodan.io/search?query=http.favicon.hash:${hash}`;
    link_2.textContent = hash;
    hash_cell.appendChild(link_2);

    const link_3 = document.createElement('a');
    link_3.href = url;
    link_3.target = '_blank';
    link_3.classList.add('tiny-link');
    link_3.textContent = url;
    url_cell.appendChild(link_3);

    // Append cells to row
    row_element.appendChild(img_cell);
    row_element.appendChild(hash_cell);
    row_element.appendChild(url_cell);

    // Append row to table
    favicons_container.appendChild(row_element);
  }

  // Executes a script in the context of the currently active tab to extract favicon URLs.
  function get_favicon_urls_from_dom(callback) {
    browser.tabs.executeScript({
      code: `(${in_content_script})()`
    }, function(results) {
      if (browser.runtime.lastError || !results || !results[0]) {
        callback([]);
      } else {
        // Remove duplicates
        const unique_urls = [...new Set(results[0])];
        callback(unique_urls);
      }
    });

    // Script to be executed in the context of the webpage to find icon links.
    function in_content_script() {
      const link_elements = document.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="icon shortcut"]'
      );
      return Array.from(link_elements)
        .map(el => el.href);
    }
  }

  // Starts the process of fetching and displaying favicon hashes.
  function start_favicon_process() {
    browser.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      let current_tab = tabs[0];
      if (!current_tab) return;

      // Fetch favicon URLs from the current tab and process each one.
      get_favicon_urls_from_dom(function(favicon_urls) {
        const root_favicon = new URL('/favicon.ico', current_tab.url)
          .href;
        if (!favicon_urls.includes(root_favicon)) {
          favicon_urls.push(root_favicon);
        }
        favicon_urls.forEach(url => {
          fetch_and_hash_favicon(url, display_favicon_and_hash);
        });
      });
    });
  }

  start_favicon_process();
});
