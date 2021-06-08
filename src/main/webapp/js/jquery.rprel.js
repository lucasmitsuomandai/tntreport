/*!
 * TNT-Reports
 * Version: 2.19
 *
 * Copyright (c) 2020 Developer Thiago Honorato at TNT Technology
 */
'use strict';

!(function (root, factory) {
  factory(jQuery, RpRel);
})(this, function ($, RpRel) {
  $.fn.rprel = function (option) {
    var args = Array.prototype.slice.apply(arguments),
      argsMethod = Array.prototype.slice.call(arguments, 1),
      value;

    this.each(function (i, _element) {
      var $el = $(_element),
        options = Object.assign(
          {},
          RpRel.getDefaults(),
          $el.data(),
          typeof option === 'object' && option
        ),
        rprel = $el.data('rprel');

      if (typeof option === 'string') {
        // method

        if ($.inArray(option, RpRel.allowedMethods) < 0) {
          throw new Error('Unknown method: ' + option);
        }

        if (!rprel) {
          return;
        }

        value = rprel[option].apply(rprel, argsMethod);
      }
      // new instance
      else if (!rprel) {
        rprel = new RpRel($el, options);
        $el.data('rprel', rprel);
      }
      // refresh
      else if (rprel) {
        value = rprel['refresh'].apply(rprel, args);
      }
    });

    return typeof value === 'undefined' ? this : value;
  };

  $.fn.rprel.Constructor = RpRel;
  $.fn.rprel.defaults = RpRel.getDefaults();
  $.fn.rprel.methods = RpRel.allowedMethods;
  $.fn.rprel.fieldParentColumn = RpRel.fieldParentColumn;
});
