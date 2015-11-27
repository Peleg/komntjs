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
	                    'start'     : Math.min(selection.anchorOffset, selection.focusOffset),
	                    'stop'      : Math.max(selection.anchorOffset, selection.focusOffset)
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
	            while(comment = this.comments.pop())
	                comment.remove();
	            this.updateUri();
	        }
	    };

	})(
	    window,
	    document,
	    __webpack_require__(2)
	);

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	(function (d, CommentHighlight, CommentBody) {

	    'use strict';

	    var DELIMITER = ',';

	    var Comment = module.exports = function (element, range, text, hash) {
	        this.highlight = new CommentHighlight(element, range);
	        this.body      = new CommentBody(text);
	        this._hash     = hash;

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
	                start     : args[2],
	                stop      : args[3]
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
	    __webpack_require__(3),
	    __webpack_require__(5)
	);


/***/ },
/* 3 */
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
	    __webpack_require__(4)
	);


/***/ },
/* 4 */
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
	    }

	    DOMNodePathStep.prototype = {
	        /**
	         * @return {string}
	         */
	        toString: function() {
	            return this.value;
	        }
	    }
	})(document);


/***/ },
/* 5 */
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