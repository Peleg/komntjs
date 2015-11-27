(function (w, d, Comment) {

    'use strict';

    var glob = (module && module.exports) || w.Komnt;

    var DELIMITER = ':';
    var REGEX = /(\?|^|&|#)komnt=(.*)(&|$)/;

    // Determing whether we can use anchor/hash
    var isHashAvailable = !location.hash || REGEX.test(location.hash);

    var Komnt = glob = function () {
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
    require('./Comment')
);