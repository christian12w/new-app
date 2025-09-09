# Funding Partners Section Update

This document summarizes the changes made to the Funding Partners section on the About page to clarify the distinctions between donors/partners and partners.

## Changes Made

### 1. Section Title Update
- Changed from "Funding Partners" to "Donors, Partners & Supporters" to better reflect the different types of relationships

### 2. Link Updates
- Updated STEPS official site link from https://steps.org.za to https://steps.co.za/

### 3. Clarification of Roles
- Added "- Donor/Partner" to the aria-label and alt text for SIGHTSAVERS to clarify their role
- Added "- Donor/Partner" to the aria-label and alt text for STEPS to clarify their role

### 4. Accessibility Improvements
- Updated aria-label for the partners section from "Our funding partners and supporters" to "Our donors, partners and supporters"

## Files Updated

- `c:\Users\HP\Desktop\afz\pages\about.html`

## Specific Changes

1. Line with section title:
   ```html
   <h2 id="funding-partners-title" class="partners-title">Donors, Partners & Supporters</h2>
   ```

2. Updated STEPS link:
   ```html
   <a href="https://steps.co.za/" target="_blank" rel="noopener" role="listitem" aria-label="STEPS Clubfoot Care - Donor/Partner">
       <img src="../images/partners/steps.png" alt="STEPS logo - Donor/Partner">
   </a>
   ```

3. Updated SIGHTSAVERS link with clarification:
   ```html
   <a href="https://www.sightsavers.org/" target="_blank" rel="noopener" role="listitem" aria-label="Sightsavers - Donor/Partner">
       <img src="../images/partners/sightsavers.svg" alt="Sightsavers logo - Donor/Partner">
   </a>
   ```

4. Updated aria-label for partners section:
   ```html
   <div class="partners-logos" role="list" aria-label="Our donors, partners and supporters">
   ```

These changes ensure that visitors to the website can clearly understand the different types of relationships AFZ has with its supporters, while maintaining accessibility standards and updating outdated links.