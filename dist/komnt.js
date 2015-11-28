/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "/static/";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	(function (w, d, Comment) {

	  'use strict';

	  __webpack_require__(2);

	  var DELIMITER = ':';
	  var REGEX = /(\?|^|&|#)komnt=(.*)(&|$)/;

	  // Determing whether we can use anchor/hash
	  var isHashAvailable = !location.hash || REGEX.test(location.hash);

	  w.Komnt = function Komnt () {
	    [
	      'mouseupHandler',
	      'hideAllBodies',
	      'layoutComments',
	      'bindCommentClicks'
	    ].forEach(function (method) {
	      this[method] = this[method].bind(this);
	    }.bind(this));

	    this.comments = [];

	    this.parseCommentsFromUri();

	    // TODO: deboune on DOM insertion instead of onload. Re-layout then as well.
	    setTimeout(this.layoutComments, 1000);
	  };

	  Komnt.prototype.toggle = function () {
	    return this[Komnt._isEnabled ? 'disable' : 'enable']();
	  };

	  /**
	   * Binds listener to highlight (new comment)
	   */
	  Komnt.prototype.enable = function () {
	    this.showAllHighlights();

	    if (!Komnt._isEnabled) {
	      d.addEventListener('mouseup', this.mouseupHandler);
	      d.addEventListener('click', this.hideAllBodies);
	    }

	    return Komnt._isEnabled = true;
	  };

	  Komnt.prototype.disable = function () {
	    this.hideAll();
	    if (Komnt._isEnabled) {
	      d.removeEventListener('mouseup', this.mouseupHandler);
	      d.removeEventListener('click', this.hideAllBodies);
	    }

	    return Komnt._isEnabled = false;
	  };


	  /**
	   * Parses comments from URI and stores in this.comments
	   */
	  Komnt.prototype.parseCommentsFromUri = function () {
	    var comment;
	    var matches = location.hash.match(REGEX) || location.search.match(REGEX);
	    if (matches && (matches = matches[2]))
	      this.comments = matches
	        .split(DELIMITER)
	        .map(Comment.fromUri.bind(this));
	  };

	  /**
	   * Updates the URI in the address bar based on the comments
	   */
	  Komnt.prototype.updateUri = function () {
	    var newAddition = this.comments.map(function (comment) {
	      return comment.toUri();
	    }).join(DELIMITER);

	    newAddition && (newAddition = 'komnt=' + newAddition);

	    if (isHashAvailable)
	      newAddition = '#' + newAddition;
	    else {
	      var search = location.search;
	      if (search) {
	        newAddition = REGEX.test(search)
	          ? search.replace(REGEX, "$1" + newAddition + "$3")
	          : search + '&' + newAddition;
	      } else {
	        newAddition = '?' + newAddition;
	      }

	      newAddition += location.hash;
	    }

	    w.history.pushState(null, null, newAddition);
	  };

	  /**
	   * Copies share link to clipboard
	   */
	  Komnt.prototype.shareLink = function () {
	    if (!Komnt._isEnabled)
	      return;

	    this.updateUri();
	    var handler = function (e) {
	      e.preventDefault();
	      e.clipboardData.setData('Text', location.href);
	      alert('Copied to clipboard');
	      d.removeEventListener('click', handler);
	    };
	    d.addEventListener('copy', handler);
	    d.execCommand("Copy", false, null);
	  };

	  /**
	   * Lays out all comments on the page
	   */
	  Komnt.prototype.layoutComments = function () {
	    this.comments.forEach(function (comment) {
	      // abort if el not on page or underlying text changed
	      if (comment.highlight.anchorEl && !comment.hasTextChanged())
	        comment.layout(this.bindCommentClicks);
	    }.bind(this));
	  };

	  /**
	   * New range/comment
	   */
	  Komnt.prototype.mouseupHandler = function (e) {
	    if (e.ctrlKey || e.metaKey) {
	      var selection = d.getSelection();

	      // dont count our spans
	      var nodeIndex = [].filter.call(e.target.childNodes, function (node) {
	        return !node.className || !~node.className.indexOf('komnt');
	      }).indexOf(selection.anchorNode);

	      if (selection.type === 'Range' && ~nodeIndex)
	        return this.addComment(e.target, {
	          'nodeIndex' : nodeIndex,
	          'start'   : Math.min(selection.anchorOffset, selection.focusOffset),
	          'stop'    : Math.max(selection.anchorOffset, selection.focusOffset)
	        });
	    }

	    return true;
	  };

	  /**
	   * Komnt clicks
	   */
	  Komnt.prototype.clickHandler = function (e, comment) {
	    var action, el = e.currentTarget;

	    if (action = e.target.dataset.komnt_action || el.dataset.komnt_action) {
	      e.preventDefault();
	      e.stopPropagation();
	      return this[action + 'Comment'](comment);
	    }
	  };

	  /**
	   * TODO: dont think this is a good way
	   * Bind Komnt's clickHandler to the underlying elements
	   */
	  Komnt.prototype.bindCommentClicks = function (comment) {
	    var clickHandler = function (e) {
	      this.clickHandler(e, comment);
	    }.bind(this);

	    comment.highlight.element().addEventListener('click', clickHandler);
	    comment.body.element().addEventListener('click', clickHandler);
	  };

	  Komnt.prototype.addComment = function (element, range) {
	    var comment = new Comment(element, range);
	    this.comments.push(comment
	      .layout(this.bindCommentClicks)
	      .show()
	      .edit()
	    );
	  };

	  /**
	   * Remove comment from DOM and from this.comments
	   */
	  Komnt.prototype.removeComment = function (comment) {
	    comment.remove();
	    // remove comment from array
	    this.comments.splice(this.comments.indexOf(comment), 1);
	    this.updateUri();
	  };

	  Komnt.prototype.editComment = function (comment) {
	    comment.edit();
	  };

	  Komnt.prototype.saveComment = function (comment) {
	    comment.save();
	    this.updateUri();
	  };

	  Komnt.prototype.showComment = function (comment) {
	    this.comments.forEach(function (comment) {
	      comment.body.element().classList.remove('active');
	    });
	    comment.show();
	  };

	  Komnt.prototype.showAllHighlights = function () {
	    if (Komnt._isEnabled)
	      this.comments.forEach(function (comment) {
	        comment.highlight.show();
	      });
	  };

	  Komnt.prototype.hideAllBodies = function () {
	    this.comments.forEach(function (comment) {
	      comment.hide();
	    });
	    this.updateUri();
	  };

	  Komnt.prototype.hideAll = function () {
	    this.comments.forEach(function (comment) {
	      comment.hide(true);
	    });
	    this.updateUri();
	  };

	  Komnt.prototype.showAll = function () {
	    if (Komnt._isEnabled)
	      this.comments.forEach(function (comment) {
	        comment.highlight.show();
	        comment.body.show();
	      });
	  };

	  /**
	   * Batch remove
	   */
	  Komnt.prototype.removeAll = function (comment) {
	    if (confirm('Are you sure?')) {
	      while (comment = this.comments.pop())
	        comment.remove();
	      this.updateUri();
	    }
	  };

	})(
	  window,
	  document,
	  __webpack_require__(6)
	);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	// style-loader: Adds some css to the DOM by adding a <style> tag

	// load the styles
	var content = __webpack_require__(3);
	if(typeof content === 'string') content = [[module.id, content, '']];
	// add the styles to the DOM
	var update = __webpack_require__(5)(content, {});
	if(content.locals) module.exports = content.locals;
	// Hot Module Replacement
	if(false) {
		// When the styles change, update the <style> tags
		if(!content.locals) {
			module.hot.accept("!!./../node_modules/css-loader/index.js!./komnt.css", function() {
				var newContent = require("!!./../node_modules/css-loader/index.js!./komnt.css");
				if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
				update(newContent);
			});
		}
		// When the module is disposed, remove the <style> tags
		module.hot.dispose(function() { update(); });
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	exports = module.exports = __webpack_require__(4)();
	// imports


	// module
	exports.push([module.id, "/**\n * Misc.\n */\n\n.komnt_comment.komnt_disabled .komnt_edit,\n.komnt_comment .komnt_no_edit {\n    display: none;\n}\n\n.komnt_comment.komnt_disabled .komnt_no_edit {\n    display: block;\n}\n\n/**\n * Highlight Element\n */\n\n.komnt_hlt {\n    background-color: #f4d313 !important;\n    cursor: default;\n    -webkit-touch-callout: none;\n    -webkit-user-select: none;\n    -khtml-user-select: none;\n    -moz-user-select: none;\n    -ms-user-select: none;\n    user-select: none;\n}\n\n.komnt_hlt.komnt_hidden {\n    background-color: transparent !important;\n    cursor: text;\n    -webkit-touch-callout: inherit;\n    -webkit-user-select: inherit;\n    -khtml-user-select: inherit;\n    -moz-user-select: inherit;\n    -ms-user-select: inherit;\n    user-select: inherit;\n}\n\n/**\n * Comment Body Element\n */\n\n.komnt_comment {\n    background-color: #EDEFF1;\n    color: #333 !important;\n    text-transform: none !important;\n    width: 240px;\n    padding: 5px;\n    margin-left: 5px;\n    position: absolute;\n    z-index: 99999;\n    border-radius: 3px;\n    border: 1px solid rgba(52, 73, 94, 0.2);\n    box-sizing: border-box;\n    box-shadow: rgba(0, 0, 0, 0.2) 0px 3px 6px 0px;\n}\n\n.komnt_comment.active,\n.komnt_comment:active,\n.komnt_comment:focus {\n    z-index: 100000;\n}\n\n/**\n * Textarea\n */\n\n.komnt_comment textarea {\n    line-height: 1 !important;\n    height: 50px !important;\n    resize: none !important;\n    width: 100% !important;\n    padding: 3px 5px !important;\n    font-family: Arial !important;\n    font-size: 12px;\n    color: #34495e;\n    border: 1px solid #bdc3c7;\n    border-radius: 3px;\n    box-sizing: border-box;\n    box-shadow: none;\n    -webkit-transition: border .25s linear,color .25s linear,background-color .25s linear;\n    transition: border .25s linear,color .25s linear,background-color .25s linear;\n    vertical-align: baseline !important;\n}\n\n.komnt_comment textarea:focus {\n    border-color: rgba(52, 73, 94, 0.5);\n    outline: none;\n}\n\n.komnt_comment.komnt_disabled textarea {\n    background-color: transparent;\n    color: #333;\n}\n\n.komnt_comment.komnt_disabled .komnt_text {\n    position: relative;\n}\n\n.komnt_comment.komnt_disabled .komnt_text:after {\n    content: '';\n    left: 0;\n    top: 0;\n    width: 100%;\n    height: 100%;\n    position: absolute;\n}\n\n\n/**\n * Button Normal\n */\n\n.komnt_btn-normal {\n    background-color: #1abc9c;\n}\n\n.komnt_btn-normal:hover {\n    background-color: #48c9b0;\n    border-color: #48c9b0;\n}\n\n.komnt_btn-normal:active {\n    background: #16a085;\n    border-color: #16a085;\n}\n\n/**\n * Button Success\n */\n\n.komnt_btn-success {\n    background-color: #34495e;\n}\n\n.komnt_btn-success:hover {\n    background-color: #415b76;\n    border-color: #415b76;\n}\n\n.komnt_btn-success:active {\n    background: #2c3e50;\n    border-color: #2c3e50;\n}\n\n/**\n * Button Danger\n */\n\n.komnt_btn-danger {\n    background-color: #e74c3c;\n}\n\n.komnt_btn-danger:hover {\n    background-color: #ec7063;\n    border-color: #ec7063;\n}\n\n.komnt_btn-danger:active {\n    background: #c44133;\n    border-color: #c44133;\n}\n\n/**\n * Button Basic\n */\n\n.komnt_comment button,\nbutton.komnt_btn {\n    letter-spacing: 0 !important;\n    text-transform: none !important;\n    line-height: 1 !important;\n    padding: 3px 10px !important;\n    font-size: 11px !important;\n    font-family: Arial !important;\n    font-weight: 400 !important;\n    line-height: 1.4 !important;\n    border: none !important;\n    border-radius: 3px !important;\n    -webkit-transition: border .25s linear,color .25s linear,background-color .25s linear;\n    transition: border .25s linear,color .25s linear,background-color .25s linear;\n    -webkit-font-smoothing: subpixel-antialiased;\n    color: white !important;\n    margin: 2px 5px 0 0 !important;\n}\n\n.komnt_btn:hover {\n    cursor: pointer;\n}\n\n.komnt_btn:active,\n.komnt_btn:focus {\n    outline: 0;\n    box-shadow: none\n}\n\n", ""]);

	// exports


/***/ },
/* 4 */
/***/ function(module, exports) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	// css base code, injected by the css-loader
	module.exports = function() {
		var list = [];

		// return the list of modules as css string
		list.toString = function toString() {
			var result = [];
			for(var i = 0; i < this.length; i++) {
				var item = this[i];
				if(item[2]) {
					result.push("@media " + item[2] + "{" + item[1] + "}");
				} else {
					result.push(item[1]);
				}
			}
			return result.join("");
		};

		// import a list of modules into the list
		list.i = function(modules, mediaQuery) {
			if(typeof modules === "string")
				modules = [[null, modules, ""]];
			var alreadyImportedModules = {};
			for(var i = 0; i < this.length; i++) {
				var id = this[i][0];
				if(typeof id === "number")
					alreadyImportedModules[id] = true;
			}
			for(i = 0; i < modules.length; i++) {
				var item = modules[i];
				// skip already imported module
				// this implementation is not 100% perfect for weird media query combinations
				//  when a module is imported multiple times with different media queries.
				//  I hope this will never occur (Hey this way we have smaller bundles)
				if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
					if(mediaQuery && !item[2]) {
						item[2] = mediaQuery;
					} else if(mediaQuery) {
						item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
					}
					list.push(item);
				}
			}
		};
		return list;
	};


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	/*
		MIT License http://www.opensource.org/licenses/mit-license.php
		Author Tobias Koppers @sokra
	*/
	var stylesInDom = {},
		memoize = function(fn) {
			var memo;
			return function () {
				if (typeof memo === "undefined") memo = fn.apply(this, arguments);
				return memo;
			};
		},
		isOldIE = memoize(function() {
			return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
		}),
		getHeadElement = memoize(function () {
			return document.head || document.getElementsByTagName("head")[0];
		}),
		singletonElement = null,
		singletonCounter = 0,
		styleElementsInsertedAtTop = [];

	module.exports = function(list, options) {
		if(false) {
			if(typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
		}

		options = options || {};
		// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
		// tags it will allow on a page
		if (typeof options.singleton === "undefined") options.singleton = isOldIE();

		// By default, add <style> tags to the bottom of <head>.
		if (typeof options.insertAt === "undefined") options.insertAt = "bottom";

		var styles = listToStyles(list);
		addStylesToDom(styles, options);

		return function update(newList) {
			var mayRemove = [];
			for(var i = 0; i < styles.length; i++) {
				var item = styles[i];
				var domStyle = stylesInDom[item.id];
				domStyle.refs--;
				mayRemove.push(domStyle);
			}
			if(newList) {
				var newStyles = listToStyles(newList);
				addStylesToDom(newStyles, options);
			}
			for(var i = 0; i < mayRemove.length; i++) {
				var domStyle = mayRemove[i];
				if(domStyle.refs === 0) {
					for(var j = 0; j < domStyle.parts.length; j++)
						domStyle.parts[j]();
					delete stylesInDom[domStyle.id];
				}
			}
		};
	}

	function addStylesToDom(styles, options) {
		for(var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];
			if(domStyle) {
				domStyle.refs++;
				for(var j = 0; j < domStyle.parts.length; j++) {
					domStyle.parts[j](item.parts[j]);
				}
				for(; j < item.parts.length; j++) {
					domStyle.parts.push(addStyle(item.parts[j], options));
				}
			} else {
				var parts = [];
				for(var j = 0; j < item.parts.length; j++) {
					parts.push(addStyle(item.parts[j], options));
				}
				stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
			}
		}
	}

	function listToStyles(list) {
		var styles = [];
		var newStyles = {};
		for(var i = 0; i < list.length; i++) {
			var item = list[i];
			var id = item[0];
			var css = item[1];
			var media = item[2];
			var sourceMap = item[3];
			var part = {css: css, media: media, sourceMap: sourceMap};
			if(!newStyles[id])
				styles.push(newStyles[id] = {id: id, parts: [part]});
			else
				newStyles[id].parts.push(part);
		}
		return styles;
	}

	function insertStyleElement(options, styleElement) {
		var head = getHeadElement();
		var lastStyleElementInsertedAtTop = styleElementsInsertedAtTop[styleElementsInsertedAtTop.length - 1];
		if (options.insertAt === "top") {
			if(!lastStyleElementInsertedAtTop) {
				head.insertBefore(styleElement, head.firstChild);
			} else if(lastStyleElementInsertedAtTop.nextSibling) {
				head.insertBefore(styleElement, lastStyleElementInsertedAtTop.nextSibling);
			} else {
				head.appendChild(styleElement);
			}
			styleElementsInsertedAtTop.push(styleElement);
		} else if (options.insertAt === "bottom") {
			head.appendChild(styleElement);
		} else {
			throw new Error("Invalid value for parameter 'insertAt'. Must be 'top' or 'bottom'.");
		}
	}

	function removeStyleElement(styleElement) {
		styleElement.parentNode.removeChild(styleElement);
		var idx = styleElementsInsertedAtTop.indexOf(styleElement);
		if(idx >= 0) {
			styleElementsInsertedAtTop.splice(idx, 1);
		}
	}

	function createStyleElement(options) {
		var styleElement = document.createElement("style");
		styleElement.type = "text/css";
		insertStyleElement(options, styleElement);
		return styleElement;
	}

	function createLinkElement(options) {
		var linkElement = document.createElement("link");
		linkElement.rel = "stylesheet";
		insertStyleElement(options, linkElement);
		return linkElement;
	}

	function addStyle(obj, options) {
		var styleElement, update, remove;

		if (options.singleton) {
			var styleIndex = singletonCounter++;
			styleElement = singletonElement || (singletonElement = createStyleElement(options));
			update = applyToSingletonTag.bind(null, styleElement, styleIndex, false);
			remove = applyToSingletonTag.bind(null, styleElement, styleIndex, true);
		} else if(obj.sourceMap &&
			typeof URL === "function" &&
			typeof URL.createObjectURL === "function" &&
			typeof URL.revokeObjectURL === "function" &&
			typeof Blob === "function" &&
			typeof btoa === "function") {
			styleElement = createLinkElement(options);
			update = updateLink.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
				if(styleElement.href)
					URL.revokeObjectURL(styleElement.href);
			};
		} else {
			styleElement = createStyleElement(options);
			update = applyToTag.bind(null, styleElement);
			remove = function() {
				removeStyleElement(styleElement);
			};
		}

		update(obj);

		return function updateStyle(newObj) {
			if(newObj) {
				if(newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap)
					return;
				update(obj = newObj);
			} else {
				remove();
			}
		};
	}

	var replaceText = (function () {
		var textStore = [];

		return function (index, replacement) {
			textStore[index] = replacement;
			return textStore.filter(Boolean).join('\n');
		};
	})();

	function applyToSingletonTag(styleElement, index, remove, obj) {
		var css = remove ? "" : obj.css;

		if (styleElement.styleSheet) {
			styleElement.styleSheet.cssText = replaceText(index, css);
		} else {
			var cssNode = document.createTextNode(css);
			var childNodes = styleElement.childNodes;
			if (childNodes[index]) styleElement.removeChild(childNodes[index]);
			if (childNodes.length) {
				styleElement.insertBefore(cssNode, childNodes[index]);
			} else {
				styleElement.appendChild(cssNode);
			}
		}
	}

	function applyToTag(styleElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(media) {
			styleElement.setAttribute("media", media)
		}

		if(styleElement.styleSheet) {
			styleElement.styleSheet.cssText = css;
		} else {
			while(styleElement.firstChild) {
				styleElement.removeChild(styleElement.firstChild);
			}
			styleElement.appendChild(document.createTextNode(css));
		}
	}

	function updateLink(linkElement, obj) {
		var css = obj.css;
		var media = obj.media;
		var sourceMap = obj.sourceMap;

		if(sourceMap) {
			// http://stackoverflow.com/a/26603875
			css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
		}

		var blob = new Blob([css], { type: "text/css" });

		var oldSrc = linkElement.href;

		linkElement.href = URL.createObjectURL(blob);

		if(oldSrc)
			URL.revokeObjectURL(oldSrc);
	}


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	(function (d, CommentHighlight, CommentBody) {

	  'use strict';

	  var DELIMITER = ',';

	  var Comment = module.exports = function (element, range, text, hash) {
	    this.highlight = new CommentHighlight(element, range);
	    this.body    = new CommentBody(text);
	    this._hash   = hash;

	    this._isEditting = false;
	  };

	  /**
	   * Parses one comment from URI and instantiate it
	   */
	  Comment.fromUri = function (uri) {
	    var args = uri.split(DELIMITER).map(decodeURIComponent);
	    return new Comment(
	      args[0], // element / cssPath
	      {
	        nodeIndex : args[1],
	        start   : args[2],
	        stop    : args[3]
	      },
	      args[4], // text
	      args[5] // hash
	    );
	  };

	  /**
	   * Converts comment to URL valid string
	   */
	  Comment.prototype.toUri = function () {
	    return [
	      this.highlight.cssPath,
	      this.highlight.range.nodeIndex,
	      this.highlight.range.start,
	      this.highlight.range.stop,
	      this.body.body,
	      this.hash()
	    ].map(encodeURIComponent)
	      .join(DELIMITER);
	  };

	  Comment.prototype.layout = function (cb) {
	    this.highlight.inject();
	    this.body.inject(this.highlight.element());
	    cb(this);
	    return this;
	  };

	  Comment.prototype.show = function () {
	    this.highlight.show();
	    this.body.show();
	    return this;
	  };

	  Comment.prototype.hide = function (hideHighlight) {
	    this._isEditting && this.save();
	    hideHighlight && this.highlight.hide();
	    this.body.hide();
	    return this;
	  };

	  Comment.prototype.save = function () {
	    this._isEditting = false;
	    this.body.save();
	    return this;
	  };

	  Comment.prototype.edit = function () {
	    this._isEditting = true;
	    this.body.edit();
	    return this;
	  };

	  Comment.prototype.remove = function () {
	    this.highlight.remove();
	    this.body.remove();
	    return this;
	  };

	  /**
	   * Used to determine whether the page has changed since the comment was
	   * added.
	   */
	  Comment.prototype.hasTextChanged = function () {
	    return this.hash() !== hashCode(this.highlight.underlyingText());
	  };

	  /**
	   * Gives the comment a hash based on the text in the underlying node
	   */
	  Comment.prototype.hash = function () {
	    return this._hash ||
	      (this._hash = hashCode(this.highlight.underlyingText()));
	  };

	  /**
	   * Borrowed from:
	   * http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
	   */
	  function hashCode (str) {
	    var hash = 0, c;
	    for (var i = 0; i < str.length; i++) {
	      c = str.charCodeAt(i);
	      hash = ((hash << 5) - hash) + c;
	      hash = hash & hash; // Convert to 32bit integer
	    }
	    return hash.toString(36);
	  }


	})(
	  document,
	  __webpack_require__(7),
	  __webpack_require__(9)
	);


/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	(function (d, CssPath) {

	  'use strict';

	  var CommentHighlight = module.exports = function (anchorEl, range) {
	    // Highlight range for the DOM element
	    this.range = range;

	    // The DOM element the comment is regarding to
	    this.anchorEl = typeof anchorEl === 'string'
	      ? d.querySelector(anchorEl)
	      : anchorEl;

	    this.cssPath = this.anchorEl && CssPath.shortest(this.anchorEl);
	  };

	  /**
	   * The span used to highlight the text
	   */
	  CommentHighlight.prototype.element = function () {
	    if (!this._element) {
	      this._element = d.createElement('span');
	      this._element.className = 'komnt_hlt';
	      this._element.dataset.komnt_action = 'show';
	      this._element.innerText = this.underlyingText().substr(
	        this.range.start,
	        this.range.stop - this.range.start
	      );
	    }
	    return this._element;
	  };

	  CommentHighlight.prototype.inject = function () {
	    this.anchorEl.replaceChild([
	      d.createTextNode(this.underlyingText().substr(0, this.range.start)),
	      this.element(),
	      d.createTextNode(this.underlyingText().substr(this.range.stop))
	    ].reduce(function (frag, node) {
	      frag.appendChild(node);
	      return frag;
	    }, d.createDocumentFragment()), this.textNode());
	  };

	  CommentHighlight.prototype.show = function () {
	    this.element().classList.remove('komnt_hidden');
	    return this;
	  };

	  CommentHighlight.prototype.hide = function () {
	    this.element().classList.add('komnt_hidden');
	    return this;
	  };

	  CommentHighlight.prototype.remove = function () {
	    this.anchorEl.replaceChild(
	      d.createTextNode(this.element().textContent),
	      this.element()
	    );
	    this.anchorEl.normalize(); // re-join text nodes after we broke them
	    return this;
	  };

	  /**
	   * The text in the text node
	   */
	  CommentHighlight.prototype.underlyingText = function () {
	    return this._underlyingText ||
	      (this._underlyingText = this.textNode().textContent);
	  };

	  /**
	   * The text node the highlight is within
	   * TODO: shitty. we have the same logic in Komnt.mouseupHandler
	   */
	  CommentHighlight.prototype.textNode = function () {
	    // TODO: This is shit and will bite us in the ass:
	    // it is a result of having a nodeIndex based on mutated textNode.
	    if (!this._textNode) {

	      // dont count our own spans
	      var newPool = [].filter.call(this.anchorEl.childNodes, function (node) {
	        return !node.className || !~node.className.indexOf('komnt');
	      });

	      this._textNode = newPool[Math.min(this.range.nodeIndex, newPool.length - 1)];
	    }

	    return this._textNode;
	  };

	})(
	  document,
	  __webpack_require__(8)
	);


/***/ },
/* 8 */
/***/ function(module, exports) {

	(function (d) {

	  'use strict';

	  var CssPath = module.exports = function CssPath (element) {
	    this.element = element;
	    this.path = this.full();
	  };

	  CssPath.shortest = function(element) {
	    return new CssPath(element).shortest();
	  };

	  /**
	   * No spaces
	   */
	  CssPath.prototype.shortest = function () {
	    return this.compact().replace(/\s+/g, '');
	  };

	  /**
	   * Removes unecessary nesting and tag names.
	   * Checks validity of new path using querySelector
	   */
	  CssPath.prototype.compact = function () {
	    var selectorRegex = /(^|[\.#\s:])([\w_-\d]|\(\d+\))+\s?>?/;
	    var compact, _path = this.path;
	    do {
	      compact = _path;
	      _path = _path.replace(selectorRegex, '');
	    } while (
	      selectorRegex.test(compact) &&
	      _path.trim() &&
	      d.querySelector(_path) === this.element
	    );
	    return compact;
	  };

	  /**
	   * Returns the CSS path to the element
	   *
	   * All the following code was taken from
	   * https://gist.github.com/asfaltboy/8aea7435b888164e8563
	   * which is ported from the original code found in Chromiumn as can be seen here:
	   * https://chromium.googlesource.com/chromium/blink/+/master/Source/devtools/front_end/components/DOMPresentationUtils.js
	   *
	   */
	  CssPath.prototype.full = function (optimized) {
	    if (this.element.nodeType !== Node.ELEMENT_NODE)
	      return "";
	    var steps = [];
	    var contextNode = this.element;
	    while (contextNode) {
	      var step = _cssPathStep(contextNode, !!optimized, contextNode === this.element);
	      if (!step)
	        break; // Error - bail out early.
	      steps.push(step);
	      if (step.optimized)
	        break;
	      contextNode = contextNode.parentNode;
	    }
	    steps.reverse();
	    return steps.join(" > ");
	  };

	  function _cssPathStep (node, optimized, isTargetNode) {
	    if (node.nodeType !== Node.ELEMENT_NODE)
	      return null;

	    var id = node.getAttribute("id");
	    if (optimized) {
	      if (id)
	        return new DOMNodePathStep(idSelector(id), true);
	      var nodeNameLower = node.nodeName.toLowerCase();
	      if (nodeNameLower === "body" || nodeNameLower === "head" || nodeNameLower === "html")
	        return new DOMNodePathStep(node.nodeName.toLowerCase(), true);
	    }
	    var nodeName = node.nodeName.toLowerCase();

	    if (id)
	      return new DOMNodePathStep(nodeName.toLowerCase() + idSelector(id), true);
	    var parent = node.parentNode;
	    if (!parent || parent.nodeType === Node.DOCUMENT_NODE)
	      return new DOMNodePathStep(nodeName.toLowerCase(), true);

	    /**
	     * @param {DOMNode} node
	     * @return {Array.<string>}
	     */
	    function prefixedElementClassNames(node) {
	      var classAttribute = node.getAttribute("class");
	      if (!classAttribute)
	        return [];

	      return classAttribute.split(/\s+/g).filter(Boolean).map(function(name) {
	        // The prefix is required to store "__proto__" in a object-based map.
	        return "$" + name;
	      });
	     }

	    /**
	     * @param {string} id
	     * @return {string}
	     */
	    function idSelector(id) {
	      return "#" + escapeIdentifierIfNeeded(id);
	    }

	    /**
	     * @param {string} ident
	     * @return {string}
	     */
	    function escapeIdentifierIfNeeded(ident) {
	      if (isCSSIdentifier(ident))
	        return ident;
	      var shouldEscapeFirst = /^(?:[0-9]|-[0-9-]?)/.test(ident);
	      var lastIndex = ident.length - 1;
	      return ident.replace(/./g, function(c, i) {
	        return ((shouldEscapeFirst && i === 0) || !isCSSIdentChar(c)) ? escapeAsciiChar(c, i === lastIndex) : c;
	      });
	    }

	    /**
	     * @param {string} c
	     * @param {boolean} isLast
	     * @return {string}
	     */
	    function escapeAsciiChar(c, isLast) {
	      return "\\" + toHexByte(c) + (isLast ? "" : " ");
	    }

	    /**
	     * @param {string} c
	     */
	    function toHexByte(c) {
	      var hexByte = c.charCodeAt(0).toString(16);
	      if (hexByte.length === 1)
	        hexByte = "0" + hexByte;
	      return hexByte;
	    }

	    /**
	     * @param {string} c
	     * @return {boolean}
	     */
	    function isCSSIdentChar(c) {
	      if (/[a-zA-Z0-9_-]/.test(c))
	        return true;
	      return c.charCodeAt(0) >= 0xA0;
	    }

	    /**
	     * @param {string} value
	     * @return {boolean}
	     */
	    function isCSSIdentifier(value) {
	      return /^-?[a-zA-Z_][a-zA-Z0-9_-]*$/.test(value);
	    }

	    var prefixedOwnClassNamesArray = prefixedElementClassNames(node);
	    var needsClassNames = false;
	    var needsNthChild = false;
	    var ownIndex = -1;
	    var siblings = parent.children;
	    for (var i = 0; (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
	      var sibling = siblings[i];
	      if (sibling === node) {
	        ownIndex = i;
	        continue;
	      }
	      if (needsNthChild)
	        continue;
	      if (sibling.nodeName.toLowerCase() !== nodeName.toLowerCase())
	        continue;

	      needsClassNames = true;
	      var ownClassNames = prefixedOwnClassNamesArray;
	      var ownClassNameCount = 0;
	      for (var name in ownClassNames)
	        ++ownClassNameCount;
	      if (ownClassNameCount === 0) {
	        needsNthChild = true;
	        continue;
	      }
	      var siblingClassNamesArray = prefixedElementClassNames(sibling);
	      for (var j = 0; j < siblingClassNamesArray.length; ++j) {
	        var siblingClass = siblingClassNamesArray[j];
	        if (ownClassNames.indexOf(siblingClass))
	          continue;
	        delete ownClassNames[siblingClass];
	        if (!--ownClassNameCount) {
	          needsNthChild = true;
	          break;
	        }
	      }
	    }

	    var result = nodeName.toLowerCase();
	    if (isTargetNode && nodeName.toLowerCase() === "input" && node.getAttribute("type") && !node.getAttribute("id") && !node.getAttribute("class"))
	      result += "[type=\"" + node.getAttribute("type") + "\"]";
	    if (needsNthChild) {
	      result += ":nth-child(" + (ownIndex + 1) + ")";
	    } else if (needsClassNames) {
	      for (var prefixedName in prefixedOwnClassNamesArray)
	      // for (var prefixedName in prefixedOwnClassNamesArray.keySet())
	        result += "." + escapeIdentifierIfNeeded(prefixedOwnClassNamesArray[prefixedName].substr(1));
	    }

	    return new DOMNodePathStep(result, false);
	  }

	  /**
	   * @constructor
	   * @param {string} value
	   * @param {boolean} optimized
	   */
	  var DOMNodePathStep = function(value, optimized) {
	    this.value = value;
	    this.optimized = optimized || false;
	  };

	  DOMNodePathStep.prototype = {
	    /**
	     * @return {string}
	     */
	    toString: function() {
	      return this.value;
	    }
	  };
	})(document);


/***/ },
/* 9 */
/***/ function(module, exports) {

	(function (w, d) {

	  'use strict';

	  var CommentBody = module.exports = function (body) {
	    // Comment text body
	    this.body = body || '';
	  };

	  CommentBody.prototype.show = function () {
	    this.element().style.display = 'block';
	    this.element().classList.add('active');
	    return this;
	  };

	  CommentBody.prototype.hide = function () {
	    this.element().style.display = 'none';
	    return this;
	  };

	  CommentBody.prototype.element = function () {
	    if (!this._element) {
	      this._element = d.createElement('div');
	      this._element.className = 'komnt_comment komnt_disabled';
	      this._element.dataset.komnt_action = 'show';
	      this._element.innerHTML =
	        '<div class="komnt_text"><textarea placeholder="Comment...">' + this.body + '</textarea></div>' +
	        '<button class="komnt_edit komnt_btn komnt_btn-success" data-komnt_action="save">Save</button>' +
	        '<button class="komnt_edit komnt_btn komnt_btn-danger" data-komnt_action="remove">Delete</button>' +
	        '<button class="komnt_no_edit komnt_btn komnt_btn-normal" data-komnt_action="edit">Edit</button>';
	    }

	    return this._element;
	  };

	  /**
	   * Create element containing comment body and place near its highlighted range
	   */
	  CommentBody.prototype.inject = function (highlightEl) {
	    var rect = highlightEl.getBoundingClientRect();
	    this.element().style.top = rect.top + w.scrollY + 'px';
	    this.element().style.left = rect.left + rect.width + w.scrollX + 'px';

	    this.hide();
	    d.body.appendChild(this.element());
	  };

	  CommentBody.prototype.save = function () {
	    this.body = this.element().children[0].children[0].value; // TODO
	    this.element().classList.add('komnt_disabled');
	    return this;
	  };

	  CommentBody.prototype.edit = function () {
	    // hide btns and disable editing when in editing mode
	    this.element().classList.remove('komnt_disabled');
	    this.element().querySelector('textarea').focus();
	    return this;
	  };

	  CommentBody.prototype.remove = function () {
	    this.element().remove();
	    return this;
	  };

	})(
	  window,
	  document
	);


/***/ }
/******/ ]);