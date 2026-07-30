# Manyatta Grill — Images and Assets


## Brand Assets

### manyattagrillogo.jpeg

This is the official Manyatta Grill logo. It appears in the top-left corner of every
page header, in the sidebar of the dashboard, and on the left panel of the login page.
The logo is displayed at different sizes depending on context, ranging from 42 pixels
wide inside the dashboard sidebar to 52 pixels wide on the login screen. It is rendered
with a border radius to give it a rounded square appearance and uses object-fit: cover
to preserve its proportions regardless of the container dimensions.

The logo file is proprietary. It may not be altered, recoloured, stretched, or used
outside of the Manyatta Grill website without written permission.


## Photography

### roasted_meat.avif

This is the hero food photograph shown on the homepage. It depicts a platter of nyama
choma and is used to anchor the visual identity of the brand on the main landing page.
The file is in AVIF format, which offers significantly smaller file sizes compared to
JPEG or PNG at equivalent visual quality, making it well suited for above-the-fold
hero imagery.

The photograph is proprietary to Manyatta Grill. It may not be reproduced, cropped,
redistributed, or used in any external publication, social media post, or marketing
material without explicit written approval from the restaurant.


## Fonts

Manyatta Grill loads two typefaces from Google Fonts. Both are open source and served
via the Google Fonts CDN, so no font files are bundled in this project.

Playfair Display is used for all headings, hero text, page titles, and decorative
display elements throughout the site. It conveys a refined, editorial quality that
suits the restaurant's cultural positioning. It is loaded in regular, bold, heavy,
and italic variants.

Lato is used for all body text, labels, navigation links, form inputs, and interface
copy. It provides clean readability at small sizes and pairs well with the heavier
display weight of Playfair Display.

Both fonts are licensed under the SIL Open Font License and may be used freely in
commercial projects.


## Icons and Decorative Elements

All icons used in the dashboard sidebar, stat cards, activity feed, and quick action
panels are Unicode emoji characters rendered natively by the browser. No external icon
library or icon font is required. This keeps the asset footprint minimal and ensures
the icons render correctly across all modern operating systems without additional
HTTP requests.


## CSS Design Tokens

The visual identity of the site is defined through a set of CSS custom properties
declared in style.css. Any new pages or components should use these tokens rather
than hardcoding colour values, so that a future rebrand only requires changes in
one place.

    --red        #D94F2B    Primary brand colour, used for buttons, accents, and highlights
    --red-dk     #B33A1A    Darker red used for hover states on primary buttons
    --cream      #FDF6EE    Main page background
    --dark       #1A1208    Primary text colour and dark backgrounds such as the header
    --tan        #E8D5B0    Border colour and divider lines
    --tan-lt     #F5EAD8    Light tan used for hover backgrounds and subtle fills
    --gray       #6B5E4E    Secondary text, labels, and subdued interface copy
    --gray-lt    #9A8D7E    Placeholder text and tertiary interface elements
    --white      #ffffff    Pure white used for card backgrounds and form fields
    --shadow     0 4px 24px rgba(0,0,0,.08)    Standard card shadow
    --radius     12px       Default border radius for cards and containers


## Adding New Assets

When adding new images to the project, follow these guidelines to maintain consistency
with the existing asset approach.

Use AVIF or WebP format where possible. Both offer better compression than JPEG at
equivalent quality, which matters for page load speed especially on mobile connections.
Fall back to JPEG only for environments where AVIF and WebP are not supported.

Keep photography consistent with the warm, earthy tones already established by the
brand palette. Images that skew cool or blue will feel out of place alongside the
existing cream and terracotta colour scheme.

Always provide an appropriate alt attribute on every image element. This serves both
accessibility requirements and search engine optimisation.

Store all site assets in the root project folder alongside the HTML files. If the
project grows to include a build pipeline, assets should be moved to a dedicated
assets or static subdirectory and all HTML references updated accordingly.

Optimise all images before committing them to the project. A 136KB logo file or a
60KB hero image is acceptable for a static site, but photography uploaded directly
from a camera without compression can reach several megabytes and will noticeably
slow down page loads for visitors on slower connections.
