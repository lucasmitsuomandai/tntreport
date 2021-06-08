/*!
 * TNT-Reports
 * Version: 2.19
 *
 * Copyright (c) 2021 Developer Thiago Honorato at TNT Technology
 */
'use strict';

!(function (root, factory) {
  factory(jQuery, RpRel);
})(this, function ($, RpRel) {
  var util = RpRel.util;

  RpRel.prototype.createForm = function () {
    if (this.$form) {
      var created = this.$form.data('created');

      if (!created) {
        this.$form.data('created', true);
        this.$form.addClass('form-horizontal');

        var $formHeader = this.$form.children('.form-header'),
          $formFooter = this.$form.children('.form-footer');

        var rows = this.data.form.rows;
        for (var i = 0; i < rows.length; i++) {
          var cols = rows[i],
            $row = $('<div/>', {
              class: 'row row-rprel',
            });

          if ($formHeader.length > 0) $row.insertAfter($formHeader);
          else if ($formFooter.length > 0) $row.insertBefore($formFooter);
          else $row.appendTo(this.$form);

          for (var x = 0; x < cols.length; x++) {
            var col = cols[x],
              $col = this.createElementForm(col);

            $row.append($col);

            if (col.children.length > 0) {
              var $line = $('<div/>', {
                class: 'row row-rprel',
              });

              $col.find('fieldset').append($line);

              for (var y = 0; y < col.children.length; y++) {
                $line.append(this.createElementForm(col.children[y]));
              }
            }
          }
        }
      }

      this.$form.formLoad(this.data.form.data, {
        reset: true,
        complete: function () {
          if (
            typeof window.autosize == 'function' &&
            this.$form.find('textarea').length > 0
          )
            window.autosize(this.$form.find('textarea'));
        }.bind(this),
      });
    }
  };

  RpRel.prototype.createElementForm = function (el) {
    var $column, $element, template;

    if (el.type == 'input') {
      template = this.options.getTemplateInput();
    } else if (el.type == 'textarea') {
      template = this.options.getTemplateTextarea();
    } else if (el.type == 'label') {
      template = this.options.getTemplateLabel();
    } else if (el.type == 'table' || el.type == 'component') {
      template = this.options.getContainerComponent();
    } else if (el.type == 'fieldset') {
      template = this.options.getTemplateFieldset();
    }

    template = util.replace(
      util.replace(
        util.replace(
          util.replace(
            util.replace(template, '%name', el.name),
            '%class',
            el.cssClass.class
          ),
          '%label',
          el.label
        ),
        '%align',
        el.align
      ),
      '%componentKey',
      el.componentKey
    );

    $element = $(template);

    utilForm.addCssClassDocument(el.cssClass);

    $column = utilForm.getColumn(this, el);
    $column.append($element);

    if (!el.visible) $column.hide();

    return $column;
  };

  var utilForm = {
    getColumn: function (that, json) {
      var classe = '';
      if ('cl' == json.dwidth.toLowerCase()) {
        classe = 'col-xs-' + json.width;
      } else {
        classe = util.randomString();

        var style = '';
        //style += "@media (min-width: 768px) {";
        style += '.' + classe + ' {';
        style += 'width:' + json.width + json.dwidth.toLowerCase() + ';';
        style += '}'; // classe
        //style += "}"; // @media

        util.addClassDocument(style);
      }
      return $(
        util.replace("<div class='col-rprel %class'></div>", '%class', classe)
      );
    },
    addCssClassDocument: function (cssClass) {
      var fonts = $('body').data('rprel.fonts') || [];
      var exists = fonts.find(function (cssClass) {
        return cssClass.class == this.class;
      }, cssClass);

      if (typeof exists == 'undefined') {
        util.addClassDocument(cssClass.css);
        fonts.push(cssClass);
        $('body').data('rprel.fonts', fonts);
      }
    },
  };
});
