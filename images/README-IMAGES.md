# AFZ Image Guidelines and Optimization

This document provides guidelines for image optimization and management for the AFZ website.

## Image Directory Structure

```
images/
├── gallery/                    # Main gallery images
├── programs/                   # Program-specific images
├── community-events/           # Community event photos
├── outreach/                   # Outreach program images
├── awareness-campaigns/        # Campaign and advocacy images
├── partners/                   # Partner organization logos
├── team/                      # Team member photos
└── icons/                     # Icons and small graphics
```

## Image Optimization Guidelines

### File Formats
- **JPEG**: For photographs and complex images
- **PNG**: For logos, icons, and images requiring transparency
- **SVG**: For simple graphics, icons, and logos
- **WebP**: Preferred modern format when supported

### Image Sizes
- **Hero Images**: 1920x1080px (16:9 ratio)
- **Gallery Images**: 800x600px (4:3 ratio)
- **Thumbnails**: 300x200px (3:2 ratio)
- **Profile Photos**: 400x400px (1:1 ratio)
- **Partner Logos**: 200x100px (2:1 ratio)

### Quality Settings
- **High Quality**: 85-95% (for hero images)
- **Standard Quality**: 70-85% (for gallery images)
- **Thumbnail Quality**: 60-75% (for small images)

## Accessibility Requirements

### Alt Text Guidelines
1. **Descriptive**: Describe what's in the image
2. **Contextual**: Include relevant context for the page
3. **Concise**: Keep under 125 characters when possible
4. **Meaningful**: Avoid "image of" or "picture of"

### Examples
- ✅ Good: "Children with albinism receiving sunscreen at AFZ outreach event"
- ❌ Poor: "Image of children"

### Loading Attributes
- Use `loading="lazy"` for images below the fold
- Use `loading="eager"` for hero images and above-the-fold content

## Implementation

### HTML Structure
```html
<img src="./images/gallery/event-photo.jpg" 
     alt="AFZ community gathering and support meeting" 
     loading="lazy"
     width="800" 
     height="600">
```

### Responsive Images
```html
<picture>
    <source media="(min-width: 768px)" srcset="./images/hero-large.webp" type="image/webp">
    <source media="(min-width: 768px)" srcset="./images/hero-large.jpg" type="image/jpeg">
    <source srcset="./images/hero-small.webp" type="image/webp">
    <img src="./images/hero-small.jpg" alt="AFZ community outreach program" loading="eager">
</picture>
```

## Image Compression Tools

### Recommended Tools
1. **TinyPNG/TinyJPG**: Online compression
2. **ImageOptim**: Mac application
3. **GIMP**: Free image editor with compression options
4. **Photoshop**: Professional with "Save for Web" feature

### Bulk Processing
- Use ImageMagick for batch processing
- Consider automating with build tools

## Current Image Status

### Existing Images
- ✅ Partner logos (SVG format, optimized)
- ✅ Team member photos (good quality, proper sizing)
- ✅ Placeholder SVG (fallback system implemented)

### Missing Images (Need to be replaced)
- ❌ Hero section backgrounds
- ❌ Program slideshow images
- ❌ Gallery content images
- ❌ News article images
- ❌ Event photos

## Fallback System

The website includes an automatic fallback system:
- Failed image loads automatically switch to placeholder
- Proper error handling prevents broken image displays
- Alt text always provides content description

## Performance Considerations

### Loading Strategy
1. **Critical Images**: Load immediately (hero, logo)
2. **Visible Images**: Standard loading
3. **Below-fold Images**: Lazy loading
4. **Background Images**: CSS with fallbacks

### File Size Targets
- **Hero Images**: < 200KB
- **Gallery Images**: < 100KB
- **Thumbnails**: < 50KB
- **Icons/Logos**: < 20KB

## SEO Benefits

### Image SEO
- Descriptive filenames (e.g., `afz-sunscreen-distribution.jpg`)
- Proper alt text for screen readers
- Structured data markup when applicable
- Sitemap inclusion for important images

## Maintenance

### Regular Tasks
1. Review image performance monthly
2. Update alt text based on user feedback
3. Compress new images before upload
4. Test on various devices and connections
5. Monitor Core Web Vitals impact

### Quality Checklist
- [ ] Image serves its purpose
- [ ] Alt text is descriptive and accurate
- [ ] File size is optimized
- [ ] Proper format chosen
- [ ] Loading attribute set correctly
- [ ] Dimensions specified in HTML

---

For technical support with image optimization:
- Email: info@afz.org.zm
- Reference this guide for best practices