/**
 * Copyright Year Updater for AFZ Platform
 * Automatically updates copyright years across all pages
 */

(function() {
    'use strict';
    
    /**
     * Updates all copyright year elements on the page
     */
    function updateCopyrightYears() {
        const currentYear = new Date().getFullYear();
        
        // Update all elements with class 'current-year' or IDs containing 'current-year'
        const yearElements = document.querySelectorAll('[id*="current-year"], [class*="current-year"]');
        
        yearElements.forEach(element => {
            element.textContent = currentYear;
        });
        
        // Also update any text content that contains a year pattern
        const allElements = document.querySelectorAll('footer, .copyright, [data-translate*="copyright"]');
        allElements.forEach(element => {
            if (element.textContent.includes('2024') || element.textContent.includes('2025')) {
                element.innerHTML = element.innerHTML.replace(/202[0-9]/g, currentYear);
            }
        });
    }
    
    /**
     * Initialize the copyright year updater
     */
    function init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', updateCopyrightYears);
        } else {
            // DOM is already loaded
            updateCopyrightYears();
        }
        
        // Also update when the page is fully loaded (including images)
        window.addEventListener('load', updateCopyrightYears);
    }
    
    // Initialize
    init();
    
    // Export for potential use by other modules
    if (typeof window.AFZ !== 'undefined') {
        window.AFZ.updateCopyrightYears = updateCopyrightYears;
    }
})();