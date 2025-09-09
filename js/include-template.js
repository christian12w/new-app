/**
 * Template Inclusion System for AFZ
 * Handles w3-include-html attributes for client-side template inclusion
 */

(function() {
    'use strict';
    
    /**
     * Load and include HTML template
     * @param {HTMLElement} el - Element with w3-include-html attribute
     */
    function includeHTML(el) {
        const file = el.getAttribute("w3-include-html");
        if (file) {
            fetch(file)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(html => {
                    el.innerHTML = html;
                    el.removeAttribute("w3-include-html");
                    // Initialize any scripts in the included template
                    initIncludedScripts(el);
                })
                .catch(error => {
                    console.error(`Error loading template ${file}:`, error);
                    el.innerHTML = `<p>Error loading content. Please refresh the page.</p>`;
                });
        }
    }
    
    /**
     * Initialize scripts in included templates
     * @param {HTMLElement} container - Container element
     */
    function initIncludedScripts(container) {
        // Look for script tags in the included content
        const scripts = container.querySelectorAll('script');
        scripts.forEach(script => {
            // Skip already executed scripts
            if (script.dataset.executed) return;
            
            // Mark as executed
            script.dataset.executed = 'true';
            
            // Create a new script element to ensure execution
            const newScript = document.createElement('script');
            Array.from(script.attributes).forEach(attr => {
                newScript.setAttribute(attr.name, attr.value);
            });
            newScript.textContent = script.textContent;
            script.parentNode.replaceChild(newScript, script);
        });
    }
    
    /**
     * Initialize all template inclusions
     */
    function initTemplateInclusion() {
        // Find all elements with w3-include-html attribute
        const elements = document.querySelectorAll("[w3-include-html]");
        elements.forEach(includeHTML);
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTemplateInclusion);
    } else {
        initTemplateInclusion();
    }
    
    // Also expose globally for manual initialization if needed
    window.includeTemplate = initTemplateInclusion;
})();