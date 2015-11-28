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
