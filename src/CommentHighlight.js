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
    require('./CssPath')
);
