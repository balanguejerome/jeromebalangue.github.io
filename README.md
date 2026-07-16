# Jerome Balangue Portfolio

Static portfolio website prepared for GitHub Pages.

## Project structure

```text
index.html                  Main page markup
static/
  css/
    main.css                Site styles and local font declarations
  js/
    head.js                 Early page setup
    main.js                 Navigation and animation behavior
    print-3d.js             Editable Three.js model source
    print-3d.bundle.js      Local browser-ready 3D bundle
  fonts/
    *.woff2                 Self-hosted font files
    OFL-*.txt               Font licenses
  media/
    images/                 Portfolio images
    textures/               Cropped artwork used by 3D models
    videos/                 Portfolio videos
  vendor/
    three/                  Local Three.js library and license
```

The site does not depend on Bootstrap, jQuery, a CDN, or remote JavaScript.
Google Fonts were downloaded and are served locally from `static/fonts`.
