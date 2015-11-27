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
    require('./CommentHighlight'),
    require('./CommentBody')
);
