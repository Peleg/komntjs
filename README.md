# KomntJS

Annotate the web!

Komnt lets you highlight and add comments to any text on any page on the web! See the Chrome extension [here](https://chrome.google.com/webstore/detail/komnt/ocopajchgbhmlkcfbppfiegapgjneppa?hl=en)

This is useful esp. when you want to bookmark a page but you care about only a certain paragraph of it. If your friend has Komnt installed too, you can even share specific snippets with them!

![](https://media.giphy.com/media/FmMaRXfuLVi8w/giphy.gif)

But if you just want the script:

## Usage

Require the dist file in your HTML:

```HTML
<script src='dist/komnt.js'></script>
```

```JavaScript
window.onload = function () {
  var komnt = new Komnt();
  komnt.enable();
};
```
