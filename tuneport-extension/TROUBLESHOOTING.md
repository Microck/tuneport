# tuneport extension troubleshooting

## popup layout issues (scroll, positioning, white space)

### root cause
the popup layout depends on specific css rules in `src/popup/index.html` inline styles. these MUST remain inline and override `src/popup/index.css`.

### working configuration (v2.2.0)

**`src/popup/index.html`** must have these inline styles:
```html
<style>
  html, body {
    width: 380px;
    min-height: 520px;
    max-height: 600px;
    margin: 0;
    padding: 0;
    overflow-x: hidden;
    overflow-y: auto;
  }
  #app {
    min-height: 520px;
  }
</style>
```

### what breaks it

1. **moving these styles to index.css** - the cascade order matters, inline must come after
2. **using `height: 600px` instead of `min-height/max-height`** - breaks dynamic sizing
3. **using `overflow: hidden` on html** - blocks scrolling entirely
4. **removing `overflow-y: auto`** - disables scroll when content overflows

### symptoms when broken

- popup shifted to the right
- settings scroll not working
- sync/activity tabs have wrong height (big white square at bottom)
- content gets cut off

### quick fix

restore the inline styles in `src/popup/index.html` as shown above. do NOT move them to external css.

### history

- v2.2.0: working (inline styles in html)
- v2.2.1: broken (moved to css with wrong values)
- v2.2.2: still broken
- v2.2.3: still broken
