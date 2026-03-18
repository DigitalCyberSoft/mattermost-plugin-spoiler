import {processSpoilers} from './spoiler_hook';
import './spoiler.css';

class SpoilerPlugin {
    initialize(registry) {
        // Click handler for revealing/hiding spoilers
        this.clickHandler = (e) => {
            const spoiler = e.target.closest('.mm-spoiler');
            if (!spoiler) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            const current = spoiler.getAttribute('data-spoiler');
            spoiler.setAttribute('data-spoiler', current === 'hidden' ? 'revealed' : 'hidden');
        };
        document.addEventListener('click', this.clickHandler, true);

        // Use MutationObserver to process new posts as they appear in the DOM
        this.observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        processSpoilers(node);
                    }
                }
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
        });

        // Process any already-rendered posts
        processSpoilers(document.body);
    }

    uninitialize() {
        if (this.clickHandler) {
            document.removeEventListener('click', this.clickHandler, true);
        }
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

window.registerPlugin('com.github.mattermost-plugin-spoiler', new SpoilerPlugin());
