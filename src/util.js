(function () {

  'use strict';

  var Util = module.exports = {

    bind: function () {
      var args = [].slice.call(arguments);
      var context = args.pop();
      args.forEach(function (funcName) {
        context[funcName] = context[funcName].bind(context);
      });
    },

    debounce: function (func, ms) {
      this.debounce.timers || (this.debounce.timers = {});
      var timer = this.debounce.timers[func.toString()];
      var newFunc = function () {
        var args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          func.apply(this, args);
          this._debounceCallback && this._debounceCallback();
        }, ms);
      };

      // add a place for adding a cb w/out messing w/ method arity
      newFunc._debounceCallback = false;

      return newFunc;
    },

    /**
     * This function takes a list of function names and the context for 'this'
     * as its last argument. It overwrites the method in the context to halt
     * DOM observation when they execute
     *
     * TODO: DOM Observer logic should be its own class
     */
    haltDOMObservers: function () {
      var args = [].slice.call(arguments);
      var context = args.pop();

      args.forEach(function (funcName) {
        var _func = context[funcName];
        context[funcName] = function () {
          Util.haltAllDOMObservers();
          if (typeof _func._debounceCallback !== 'undefined') {
            _func._debounceCallback = Util.resumeAllDOMObservers;
            return _func.apply(this, arguments);
          }
          var returnValue = _func.apply(this, arguments);
          Util.resumeAllDOMObservers();
          return returnValue;
        };
      });
    },

    onDOMChange: function (observed, func) {
      var observer = {
        observer: new MutationObserver(func),
        on: function () {
          this.observer.observe(observed, {
            characterData: true,
            childList: true,
            subtree: true
          });
        },
        off: function () {
          this.observer.disconnect();
        }
      };

      observer.on();

      this.onDOMChange.observers || (this.onDOMChange.observers = []);
      this.onDOMChange.observers.push(observer);
    },

    haltAllDOMObservers: function () {
      Util.onDOMChange.observers.forEach(function (obs) {
        obs.off();
      });
    },

    resumeAllDOMObservers: function () {
      Util.onDOMChange.observers.forEach(function (obs) {
        obs.on();
      });
    }

  };

})();
