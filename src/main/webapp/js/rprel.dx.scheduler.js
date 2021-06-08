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
  var util = RpRel.util;

  RpRel.prototype.createScheduler = function (
    $parent,
    options,
    iddt,
    params,
    updateOptions
  ) {
    var def = $.Deferred(),
      $schedulerEl = this.createElementComponent(
        $parent,
        options,
        'dx-scheduler-tnt'
      );

    try {
      var scheduler = $schedulerEl.dxScheduler('instance');
      if (updateOptions) scheduler.option(options);

      var dataSource = scheduler.getDataSource();

      util.controlWidgets($schedulerEl, this, options.key, options.type);

      $.when(dataSource.reload()).then(
        function () {
          def.resolve(true, $schedulerEl);
        },
        function () {
          def.resolve(false);
        }
      );

      return def;
    } catch (e) {}

    var defaults = {};

    var settings = $.extend(true, defaults, options, {
      onSuccess: function (e) {
        var name = e.element.attr('id').split('-').join('');

        var json = {};
        json[name] = e;

        def.resolve(true, $schedulerEl, json, e);
      }.bind(this),
    });

    this.dxScheduler($schedulerEl, settings, iddt, params);

    return def;
  };

  RpRel.prototype.dxScheduler = function ($el, options, iddt, params) {
    var optionsScheduler = {
      editing: {
        allowAdding: false,
        allowDeleting: false,
        allowUpdating: false,
        allowResizing: false,
        allowDragging: false,
      },
      appointmentTemplate: function (data, index, contentTemplate) {
        var options = this.option(),
          title = options.textExpr,
          startDate = options.startDateExpr,
          endDate = options.endDateExpr,
          allDay = options.allDayExpr;

        $('<div/>', {
          class: 'dx-scheduler-appointment-title',
        })
          .text(data.appointmentData[title])
          .appendTo(contentTemplate);

        $('<div/>', {
          class: 'dx-scheduler-appointment-content-details',
        })
          .appendTo(contentTemplate)
          .append(
            $('<div/>', {
              class: 'dx-scheduler-appointment-content-date',
            }).text(
              [
                Globalize.formatDate(
                  moment(data.appointmentData[startDate]).toDate(),
                  { time: 'short' }
                ),
                Globalize.formatDate(
                  moment(data.appointmentData[endDate]).toDate(),
                  { time: 'short' }
                ),
              ].join(' - ')
            )
          );

        if (data.appointmentData[allDay]) {
          contentTemplate
            .parent()
            .addClass('dx-scheduler-all-day-appointment-tnt');
        }
      },
      onAppointmentFormOpening: function (e) {
        var options = e.component.option();

        if (options.formItems.length > 0) {
          e.form.option({
            colCount: 1,
            colCountByScreen: {
              lg: 1,
              md: 1,
              sm: 1,
              xs: 1,
            },
            items: options.formItems,
          });

          e.form.updateData(e.appointmentData);
        } else {
          e.form.itemOption('mainGroup.description', {
            editorOptions: {
              autoResizeEnabled: true,
            },
          });
        }

        e.popup.option({
          title: options.popupTitle || '',
          showTitle: true,
          dragEnabled: true,
          resizeEnabled: true,
          closeOnOutsideClick: false,
          shading: false,
          showCloseButton: true,
        });
      },
      dataSource: this.createDataSource(
        'dxScheduler',
        $el,
        iddt,
        options.numrpheader,
        options,
        params
      ),
      onInitialized: function (e) {
        this.componentFunctions(e.component);
      }.bind(this),
      onContentReady: function (e) {
        e.component.option(
          'height',
          function (type) {
            if (type === 'month') {
              this.css('minHeight', '');
              return this.innerWidth() / 1.5;
            } else {
              this.css('minHeight', '300px');
              return 'auto';
            }
          }.bind(e.element, e.component._currentView.type)
        );

        if (!e.component.created) {
          util.addWidget(this, e);

          Object.assign(e.component, {
            created: true,
          });

          if (typeof e.component.option().onSuccess == 'function') {
            e.component
              .option()
              .onSuccess.apply(e.component.option().onSuccess, [e]);
          }
        }
      }.bind(this),
    };

    $.extend(true, optionsScheduler, options);

    this.handlers($el, optionsScheduler);
    $el.dxScheduler(optionsScheduler);
  };
});
