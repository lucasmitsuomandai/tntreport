/*!
 * TNT-Reports
 * Version: 2.19
 *
 * Copyright (c) 2020 Developer Victor Badaró at TNT Technology
 */
'use strict';

!(function (root, factory) {
  factory(jQuery, RpRel);
})(this, function ($, RpRel) {
  var util = RpRel.util;

  RpRel.prototype.createHtmlEditor = function (contentElement, text) {
    var $htmlEditor = $('<div />', {
      class: 'html-editor',
    }).appendTo(contentElement);

    var htmlEditor = $htmlEditor
      .dxHtmlEditor({
        height: 450,
        toolbar: {
          items: [
            'undo',
            'redo',
            'separator',
            {
              formatName: 'size',
              formatValues: [
                '8pt',
                '10pt',
                '12pt',
                '14pt',
                '18pt',
                '24pt',
                '36pt',
              ],
            },
            {
              formatName: 'font',
              formatValues: [
                'Arial',
                'Courier New',
                'Georgia',
                'Impact',
                'Lucida Console',
                'Tahoma',
                'Times New Roman',
                'Verdana',
              ],
            },
            'separator',
            'bold',
            'italic',
            'strike',
            'underline',
            'separator',
            'alignLeft',
            'alignCenter',
            'alignRight',
            'alignJustify',
            'separator',
            'orderedList',
            'bulletList',
            'separator',
            {
              formatName: 'header',
              formatValues: [false, 1, 2, 3, 4, 5],
            },
            'separator',
            'subscript',
            'superscript',
            'increaseIndent',
            'decreaseIndent',
            'variable',
            'color',
            'background',
            'separator',
            'link',
            'image',
            'separator',
            'clear',
            'codeBlock',
            'blockquote',
          ],
        },
        mediaResizing: {
          enabled: true,
        },
      })
      .dxHtmlEditor('instance');

    htmlEditor.option('value', text);

    return htmlEditor;
  };
});
