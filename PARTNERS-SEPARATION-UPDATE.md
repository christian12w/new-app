# Partners Section Separation Update

This document summarizes the changes made to the Funding Partners section on the About page to separate Donors/Partners from general Partners.

## Changes Made

### 1. Section Restructuring
- Completely restructured the "Funding Partners" section to clearly separate:
  - **Donors & Partners**: SIGHTSAVERS and STEPS
  - **Partners**: ZAFOD, GRZ, ZAPD, and Disability Rights Watch

### 2. Section Title Update
- Changed the main section title from "Funding Partners" to "Our Supporters"

### 3. Category Titles
- Added "Donors & Partners" as a category title for SIGHTSAVERS and STEPS
- Added "Partners" as a category title for the remaining organizations

### 4. Link Updates
- Updated STEPS official site link from https://steps.org.za to https://steps.co.za/

### 5. Visual Design
- Added new CSS styles to clearly differentiate the two categories
- Implemented hover effects and visual enhancements for better user experience
- Added underlines beneath category titles for visual separation

### 6. Accessibility Improvements
- Maintained proper aria-labels for screen readers
- Preserved semantic HTML structure
- Ensured proper focus states for keyboard navigation

## Files Updated

- `c:\Users\HP\Desktop\afz\pages\about.html`

## New Structure

The updated section now has the following structure:

```html
<section class="funding-partners" aria-labelledby="funding-partners-title">
    <div class="container">
        <div class="partners-header">
            <h2 id="funding-partners-title" class="partners-title">Our Supporters</h2>
        </div>
        
        <!-- Donors and Partners -->
        <div class="partners-category">
            <h3 class="category-title">Donors & Partners</h3>
            <div class="partners-logos" role="list" aria-label="Our donors and partners">
                <!-- SIGHTSAVERS and STEPS logos here -->
            </div>
        </div>
        
        <!-- Partners -->
        <div class="partners-category">
            <h3 class="category-title">Partners</h3>
            <div class="partners-logos" role="list" aria-label="Our partners">
                <!-- Other partners logos here -->
            </div>
        </div>
    </div>
</section>
```

## CSS Styles Added

New CSS styles were added to create visual distinction between the two categories:

- Category titles with gold underlines
- Hover effects on partner logos
- Proper spacing and alignment
- Responsive design for mobile devices

These changes ensure that visitors to the website can clearly understand the different types of relationships AFZ has with its supporters, with a clean visual separation between donors/partners and general partners.