// Scans a DOM element for ||spoiler|| patterns and wraps them
// in clickable spoiler elements. Handles both:
// 1. Inline spoilers: ||hidden text|| within a single paragraph
// 2. Block spoilers: || at end of a paragraph, content, then || at start of a paragraph

export function processSpoilers(element) {
    if (!element || !element.querySelectorAll) {
        return;
    }

    const postBodies = element.querySelectorAll('.post-message__text');
    if (postBodies.length === 0) {
        if (element.classList && element.classList.contains('post-message__text')) {
            processContainer(element);
        }
        return;
    }

    postBodies.forEach((body) => {
        processContainer(body);
    });
}

function processContainer(container) {
    if (container.querySelector('.mm-spoiler')) {
        return;
    }

    const html = container.innerHTML;
    if (html.indexOf('||') === -1) {
        return;
    }

    // Process block spoilers first, then inline
    processBlockSpoilers(container);
    processInlineSpoilers(container);
}

// Block spoilers: find || at the end of one element's text and || at the
// start of another element's text, wrapping everything between them.
// The || might be:
//   - At the end of a <p>: <p>some text\n||</p>
//   - The entire content of a <p>: <p>||</p>
//   - At the start of a <p>: <p>|| some text</p>
function processBlockSpoilers(container) {
    let found = true;
    while (found) {
        found = false;
        const children = Array.from(container.childNodes);

        // Scan for opening || marker
        for (let i = 0; i < children.length; i++) {
            const openInfo = findOpenMarker(children[i]);
            if (!openInfo) {
                continue;
            }

            // Now look for the closing || marker in subsequent siblings
            for (let j = i + 1; j < children.length; j++) {
                // Check for closing || - but also handle case where
                // open and close are in same node (already handled by inline)
                const closeInfo = findCloseMarker(children[j]);
                if (!closeInfo) {
                    continue;
                }

                // Found a pair! Wrap everything between them.
                wrapBlockSpoiler(container, children, i, openInfo, j, closeInfo);
                found = true;
                break;
            }

            if (found) {
                break;
            }
        }
    }
}

// Check if a node ends with || (opening marker for block spoiler)
function findOpenMarker(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const trimmed = text.trimEnd();
        if (trimmed.endsWith('||')) {
            return {node, type: 'text'};
        }
        return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        // Get the last text content of this element
        const text = node.textContent;
        const trimmed = text.trimEnd();
        if (trimmed.endsWith('||')) {
            return {node, type: 'element'};
        }
    }

    return null;
}

// Check if a node starts with || (closing marker for block spoiler)
function findCloseMarker(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const trimmed = text.trimStart();
        if (trimmed.startsWith('||')) {
            return {node, type: 'text'};
        }
        return null;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
        const text = node.textContent;
        const trimmed = text.trimStart();
        if (trimmed.startsWith('||')) {
            return {node, type: 'element'};
        }
    }

    return null;
}

function wrapBlockSpoiler(container, children, openIdx, openInfo, closeIdx, closeInfo) {
    const openNode = children[openIdx];
    const closeNode = children[closeIdx];

    // Remove the || from the opening node
    removeTrailingPipes(openNode);

    // Remove the || from the closing node
    const closeIsEmpty = removeLeadingPipes(closeNode);

    // Collect all nodes strictly between open and close
    const contentNodes = [];
    for (let i = openIdx + 1; i < closeIdx; i++) {
        contentNodes.push(children[i]);
    }

    if (contentNodes.length === 0) {
        return;
    }

    // Create spoiler wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'mm-spoiler mm-spoiler--block';
    wrapper.setAttribute('data-spoiler', 'hidden');

    const label = document.createElement('span');
    label.className = 'mm-spoiler__label';
    label.textContent = 'SPOILER';
    wrapper.appendChild(label);

    const content = document.createElement('div');
    content.className = 'mm-spoiler__content';
    contentNodes.forEach((n) => content.appendChild(n));
    wrapper.appendChild(content);

    // Insert the wrapper after the open node
    openNode.after(wrapper);

    // If the close node is now empty, remove it
    if (closeIsEmpty) {
        closeNode.remove();
    }
}

// Remove trailing || from a node's text content
function removeTrailingPipes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/\|\|\s*$/, '').trimEnd();
        return;
    }

    // For element nodes, find the last text node and strip ||
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    let lastText = null;
    let n;
    while ((n = walker.nextNode())) {
        lastText = n;
    }
    if (lastText) {
        lastText.textContent = lastText.textContent.replace(/\|\|\s*$/, '').trimEnd();
        // If the parent element is now empty after removing ||, clean up
        if (!node.textContent.trim()) {
            // Keep the node but it'll be empty - that's fine
        }
    }
}

// Remove leading || from a node's text content.
// Returns true if the node is now empty and should be removed.
function removeLeadingPipes(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = node.textContent.replace(/^\s*\|\|/, '').trimStart();
        return !node.textContent.trim();
    }

    // For element nodes, find the first text node and strip ||
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    const firstText = walker.nextNode();
    if (firstText) {
        firstText.textContent = firstText.textContent.replace(/^\s*\|\|/, '').trimStart();
    }

    // Check if the element is now effectively empty (just whitespace, buttons, etc.)
    // Don't count "Edited" indicators or buttons as meaningful content
    const meaningfulText = node.textContent.trim();
    if (!meaningfulText) {
        return true;
    }

    // If the only remaining content is an "Edited" button, keep the node
    // but it's not empty
    return false;
}

// Inline spoilers: ||text|| within a single text run (no HTML tags between them)
function processInlineSpoilers(container) {
    const html = container.innerHTML;
    const inlineRegex = /\|\|([^|<>]+?)\|\|/g;

    const newHtml = html.replace(inlineRegex, (fullMatch, content) => {
        const stripped = content.trim();
        if (!stripped) {
            return fullMatch;
        }
        return '<span class="mm-spoiler mm-spoiler--inline" data-spoiler="hidden">' +
            '<span class="mm-spoiler__label">SPOILER</span>' +
            '<span class="mm-spoiler__content">' + content + '</span>' +
            '</span>';
    });

    if (newHtml !== html) {
        container.innerHTML = newHtml;
    }
}
