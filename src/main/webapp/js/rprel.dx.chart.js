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

  RpRel.prototype.createChart = function (
    $parent,
    options,
    iddt,
    params,
    updateOptions
  ) {
    var def = $.Deferred(),
      $chartEl = this.createElementComponent($parent, options, 'dx-chart-tnt');

    try {
      var chart = $chartEl.dxChart('instance');
      if (updateOptions) chart.option(options);

      var dataSource = chart.getDataSource();

      util.controlWidgets($chartEl, this, options.key, options.type);

      $.when(dataSource.reload()).then(
        function () {
          def.resolve(true, $chartEl);
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

        def.resolve(true, $chartEl, json, e);
      }.bind(this),
    });

    this.dxChart($chartEl, settings, iddt, params);

    return def;
  };

  RpRel.prototype.dxChart = function ($el, options, iddt, params) {
    var optionsChart = {
      dataSource: this.createDataSource(
        'dxChart',
        $el,
        iddt,
        options.numrpheader,
        options,
        params
      ),
      commonSeriesSettings: {
        aggregation: {
          enabled: true,
          method: 'count',
        },
        label: {
          visible: true,
          backgroundColor: '#304967',
        },
      },
      argumentAxis: {
        aggregateByCategory: true,
      },
      valueAxis: {},
      legend: {
        verticalAlignment: 'bottom',
        horizontalAlignment: 'center',
      },
      export: {
        enabled: true,
      },
      //			tooltip: {
      //				enabled: true,
      //				customizeTooltip: function(arg) {
      //					return {
      //						text: arg.valueText + " matrícula(s)",
      //					}
      //				},
      //			},
      onInitialized: function (e) {
        this.componentFunctions(e.component);
      }.bind(this),
      onDone: function (e) {
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

    $.extend(true, optionsChart, options);

    this.handlers($el, optionsChart);
    $el.dxChart(optionsChart);
  };
});
