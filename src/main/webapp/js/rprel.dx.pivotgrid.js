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

  RpRel.prototype.createPivotGrid = function (
    $parent,
    options,
    iddt,
    params,
    updateOptions
  ) {
    var def = $.Deferred(),
      $pivotEl = this.createElementComponent(
        $parent,
        options,
        'dx-pivotgrid-tnt'
      );

    try {
      var pivotGrid = $pivotEl.dxPivotGrid('instance');
      if (updateOptions) pivotGrid.option(options);

      var dataSource = pivotGrid.getDataSource();

      util.controlWidgets($pivotEl, this, options.key, options.type);

      $.when(dataSource.reload()).then(
        function () {
          def.resolve(true, $pivotEl);
        },
        function () {
          def.resolve(false);
        }
      );

      return def;
    } catch (e) {}

    var defaults = {
      onSuccess: function (e) {
        var name = e.element.attr('id').split('-').join('');

        var json = {};
        json[name] = e;

        var comp = this._components[e.component.option().key];
        if (typeof comp == 'object') {
          e.component.headerFilters(comp.filters);
        }

        def.resolve(true, $pivotEl, json, e);
      }.bind(this),
    };

    var drillDown = {
      onCellClick: function (e) {
        if (e.area == 'data') {
          this.rprel.openFactsPivotGrid(
            e,
            this.iddt,
            this.options,
            this.params
          );
        }
      }.bind({
        rprel: this,
        iddt: iddt,
        options: options,
        params: params,
      }),
      onCellPrepared: function (e) {
        if (e.area == 'data') {
          var $link = $('<a/>', {
            href: "javascript:void('Clique para ver os dados')",
          }).append(e.cellElement.html());

          e.cellElement
            .html($link)
            .attr({
              title: 'Clique para ver os dados',
            })
            .css({
              cursor: 'pointer',
            });
        }
      },
    };

    var settings = $.extend(
      true,
      {},
      defaults,
      options,
      options.drillDownPivot && drillDown
    );

    this.dxPivotGrid($pivotEl, settings, iddt, params, updateOptions);

    return def;
  };

  RpRel.prototype.dxPivotGrid = function (
    $el,
    options,
    iddt,
    params,
    updateOptions
  ) {
    // TRATAMENTO ANTES
    $.each(options.columns, function () {
      // APAGA O groupIndex POIS DÁ ERRO NO PIVOTGRID
      delete this.groupIndex;
    });

    var simpleGrid = {
      allowSorting: true,
      allowExpandAll: true,
      //
      allowSortingBySummary: true,
      allowFiltering: true,
      showBorders: false,

      showColumnGrandTotals: true,
      showRowGrandTotals: true,

      showRowTotals: false,
      showColumnTotals: false,

      //				showTotalsPrior: "rows",
      //		        rowHeaderLayout: "tree",
      fieldPanel: {
        allowFieldDragging: true,
        showColumnFields: true,
        showDataFields: true,
        showFilterFields: true,
        showRowFields: true,
        visible: true,
      },
      loadPanel: {
        text: 'Carregando...',
      },
      noDataText: 'Sem dados',
      fieldChooser: {
        enabled: false,
      },
      export: {
        enabled: false,
      },
      //				Esse tipo de exportação apresentou uma grande lentidão
      //				onExporting: function(e) { // Excel
      //					var workbook = new ExcelJS.Workbook();
      //					var worksheet = workbook.addWorksheet(e.component.option().exportFileName);
      //
      //					DevExpress.excelExporter.exportPivotGrid({
      //						component: e.component,
      //						worksheet: worksheet
      //					}).then(function() {
      //						workbook.xlsx.writeBuffer().then(function(buffer) {
      //							saveAs(new Blob([buffer], { type: 'application/octet-stream' }), [e.component.option().exportFileName,"xlsx"].join("."));
      //						});
      //					});
      //					e.cancel = true;
      //				},
      scrolling: {
        mode: 'standard',
        useNative: true,
      },

      // OPÇÕES DA BARRA SUPERIOR DO COMPONENTE
      toolbar: {
        toggleGrid: false, // HABILITA/DESABILITA A MUDANÇA DA VISÃO DOS DADOS
        toggleHeight: false, // HABILITA/DESABILITA A OPÇÃO DA ALTURA DO COMPONENTE (LIMITA A ALTURA DA JANELA OU DE ACORDO COM OS DADOS)
        chart: false, // HABILITA/DESABILITA A VISÃO EM GRÁFICO
        saveState: false, // HABILITA/DESABILITA O BOTÃO DE SALVA AS ALTERAÇÕES FEITAS PELO USUÁRIO (CRIA UMA CUSTOMIZAÇÃO)
        helper: false, // HABILITA/DESABILITA AS INFORMAÇÕES DE AJUDA
        gridSettings: false, // HABILITA/DESABILITA AS POSSÍVEIS CONFIGURAÇÕES DO COMPONENTE
      },

      numrpheader: options.numrpheader,
      dataSource: this.createDataSource(
        'dxPivotGrid',
        $el,
        iddt,
        options.numrpheader,
        options,
        params
      ),
      onContextMenuPreparing: function (e) {
        Array.prototype.push.apply(
          (e.items != null && e.items) || (e.items = []),
          this.getItemsButtonHelp(e.component)
        );
      }.bind(this),
      onInitialized: function (e) {
        this.componentFunctions(e.component);
      }.bind(this),
      onContentReady: function (e) {
        if (!e.component.created) {
          util.addWidget(this, e);

          var $toolbar = e.element.find('.dx-pivotgrid-toolbar');

          var $headerPanel = e.element.find('.dx-filter-header');
          if (
            $headerPanel.children('.dx-pivotgrid-header-filters-applied')
              .length == 0
          ) {
            e.component._$headerFilters = $('<div/>', {
              class: 'dx-pivotgrid-header-filters-applied',
            }).appendTo($headerPanel);
          }

          var $btnChooser = $toolbar.find('.dx-pivotgrid-field-chooser-button'),
            $btnExport = $toolbar.find('.dx-pivotgrid-export-button');

          $btnChooser.addClass('dx-pivotgrid-buttons-rprel');
          $btnExport.addClass('dx-pivotgrid-buttons-rprel');

          $btnExport.insertBefore($btnChooser);

          var toolbar = e.component.option().toolbar;

          // BOTÃO DE SALVAR ALTERAÇÕES
          if (toolbar.saveState) {
            $('<div/>', {
              class: 'dx-save-state-button dx-pivotgrid-buttons-rprel',
            })
              .dxDropDownButton({
                icon: 'save', //or your custom icon
                hint: 'Salvar alterações',

                splitButton: true,
                displayExpr: 'name',
                keyExpr: 'id',
                items: this.getItemsButtonSave(),
                dropDownOptions: {
                  width: '150px',
                },

                onButtonClick: function (eBtn) {
                  this.rprel.saveState(this.component);
                }.bind({
                  rprel: this,
                  component: e.component,
                }),
                onItemClick: function (eItem) {
                  if (eItem.itemData.id == 'redo') {
                    this.redoState();
                  }
                }.bind(this),
              })
              .prependTo($toolbar);
          }

          // BOTÃO QUE ALTERA A ALTURA DA TABELA
          if (toolbar.toggleHeight) {
            $('<div/>', {
              class: 'dx-toggle-data-grid-button dx-pivotgrid-buttons-rprel',
            })
              .dxButton({
                disabled: false,
                icon: 'pinright', //or your custom icon
                hint: 'Alterar a altura da tabela',
                elementAttr: {
                  class:
                    'dx-toggle-height-button btn-height-grid btn-height-' +
                    (e.component.option().heightGrid || 'auto'),
                },
                onClick: function (eBtn) {
                  Object.assign(this.component.option(), {
                    heightGrid:
                      this.component.option().heightGrid == 'window'
                        ? 'auto'
                        : 'window',
                  });

                  eBtn.element
                    .removeClass('btn-height-window btn-height-auto')
                    .addClass(
                      'btn-height-' +
                        (this.component.option().heightGrid || 'auto')
                    );

                  this.component.option(
                    'height',
                    this.component.option().heightGrid == 'window'
                      ? util.heightWindow
                      : util.heightAuto
                  );
                }.bind(e),
              })
              .prependTo($toolbar);
          }

          // BOTÃO QUE ALTERA A VISÃO DO RELATÓRIO PARA O DATA GRID
          if (toolbar.toggleGrid) {
            $('<div/>', {
              class: 'dx-toggle-data-grid-button dx-pivotgrid-buttons-rprel',
            })
              .dxButton({
                hint: 'Alterar para o Data Grid',
                icon: 'fa fa-table',
                onClick: function () {
                  var $element = this.component._$element,
                    $parent = $element.parents('.dx-components-tnt').eq(0),
                    options = Object.assign({}, $element.data('options'), {
                      type: 'dxDataGrid',
                    });

                  this.rprel.createComponent(
                    $parent,
                    options,
                    this.rprel.data.rprel.iddt,
                    this.rprel.options.params,
                    this.updateOptions
                  );
                }.bind({
                  component: e.component,
                  rprel: this,
                  updateOptions: updateOptions,
                }),
              })
              .prependTo($toolbar);
          }

          // BOTÃO QUE HABILITA A VISÃO DO RELATÓRIO EM GRÁFICO
          if (toolbar.chart) {
            $('<div/>', { class: 'dx-chart-button dx-pivotgrid-buttons-rprel' })
              .dxButton({
                hint: 'Habilitar Gráfico',
                icon: 'chart',
                onClick: function (e) {
                  this.rprel.createPivotGridChart(e.component, this.component);
                }.bind({
                  component: e.component,
                  rprel: this,
                }),
              })
              .prependTo($toolbar);
          }

          // BOTÃO QUE EXIBE INFORMAÇÕES DE AJUDA PARA O USUÁRIO
          if (toolbar.helper) {
            $('<div/>', { class: 'dx-help-button dx-pivotgrid-buttons-rprel' })
              .dxDropDownButton({
                hint: 'Ajuda',
                icon: 'help',

                splitButton: true,
                displayExpr: 'text',
                keyExpr: 'type',
                items: this.getItemsButtonHelp(e.component),
                dropDownOptions: {
                  width: '190px',
                },

                onButtonClick: function (e) {
                  var item = e.component.option('items')[0];
                  item.onItemClick({ itemData: item });
                },
                onItemClick: function (e) {
                  e.itemData.onItemClick(e);
                },
              })
              .appendTo($toolbar);
          }

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

    var completeGrid = {
      export: {
        enabled: true,
        fileName: options.exportFileName || 'export',
      },
      fieldChooser: {
        enabled: true,
        layout: 0,
        title: 'Selecionar campos',
      },

      // OPÇÕES DA BARRA SUPERIOR DO COMPONENTE
      toolbar: {
        toggleHeight: true, // HABILITA/DESABILITA A OPÇÃO DA ALTURA DO COMPONENTE (LIMITA A ALTURA DA JANELA OU DE ACORDO COM OS DADOS)
        chart: true, // HABILITA/DESABILITA A VISÃO EM GRÁFICO
        helper: true, // HABILITA/DESABILITA AS INFORMAÇÕES DE AJUDA
        gridSettings: false, // HABILITA/DESABILITA AS POSSÍVEIS CONFIGURAÇÕES DO COMPONENTE
      },
    };

    if (options.data) delete options['data'];
    if (options.columns) delete options['columns'];
    //		if ( options.exportFileName ) delete options["exportFileName"];

    var optionsGrid = {};
    if (options.simpleGrid) {
      optionsGrid = $.extend(true, {}, simpleGrid);
    } else {
      optionsGrid = $.extend(true, {}, simpleGrid, completeGrid);
    }

    $.extend(true, optionsGrid, options);

    // HEIGHT
    Object.assign(optionsGrid, {
      height:
        optionsGrid.height ||
        (optionsGrid.heightGrid == 'window'
          ? util.heightWindow
          : util.heightAuto),
    });

    this.handlers($el, optionsGrid);
    $el.dxPivotGrid(optionsGrid);
  };

  RpRel.prototype.openFactsPivotGrid = function (e, iddt, options, params) {
    //if ( typeof e.component.$drillDown == "undefined" ) {
    var $drillDown = $('<div/>', {
      class: 'drill-down-pivot-grid dx-components-tnt',
      style: 'height:100%;',
    });

    Object.assign(e.component, {
      $drillDown: $drillDown,
    });
    //}

    $.dialog({
      title: options.description,
      classes: 'modal-lg',
      //autoDestroy: false,
      data: {
        maximize: true,
      },
      customFooter: function (dialog, footer) {
        footer.hide();
      },
      onShow: function (e) {
        var $component = this.pivot.component.$drillDown.children(
            '.dx-component-tnt.active'
          ),
          type =
            ($component.length == 1 && $component.data('dxComponents')[0]) ||
            'dxDataGrid';

        var drillDownDataSource = this.pivot.component
          .getDataSource()
          .createDrillDownDataSource(this.pivot.cell);

        var options = $.extend(
          true,
          {},
          this.rprel._components[this.pivot.component.option().key].options,
          {
            type: type,
            drillDownDataSource: drillDownDataSource,
            toolbar: {
              toggleHeight: false,
              toggleGrid: false,
            },
            width: '100%',
            height: '100%',
          }
        );

        this.rprel.createComponent(
          this.pivot.component.$drillDown,
          $.extend(true, options, {
            dataSource: this.rprel.createDataSource(
              type,
              $component,
              this.iddt,
              options.numrpheader,
              options,
              this.params
            ),
          }),
          this.iddt,
          this.params,
          true
        );
      }.bind({
        rprel: this,
        pivot: e,
        iddt: iddt,
        params: params,
      }),
      onShown: function (e) {
        this.$drillDown
          .children('.dx-datagrid-tnt')
          .dxDataGrid('instance')
          .updateDimensions();
      }.bind(e.component),
      message: function (contentElement) {
        this.component.$drillDown.appendTo(contentElement);
      }.bind({
        component: e.component,
      }),
    });
  };

  RpRel.prototype.createPivotGridChart = function (button, pivotGrid) {
    if (!pivotGrid._$element.hasClass('dx-pivot-grid-chart-integrated')) {
      var identify = util.randomString();

      button.option('hint', 'Desabilitar Gráfico');
      pivotGrid._$element
        .addClass('dx-pivot-grid-chart-integrated')
        .attr('data-chart', '#' + identify);

      var pivotGridChart = $('<div/>', {
        id: identify,
        class: 'dx-chart-tnt',
      })
        .insertAfter(pivotGrid._$element) // appendTo|insertAfter
        .dxChart({
          commonSeriesSettings: {
            type: 'bar',
          },
          tooltip: {
            enabled: true,
            customizeTooltip: function (args) {
              var valueText =
                args.seriesName.indexOf('Total') != -1
                  ? Globalize.formatCurrency(args.originalValue, 'USD', {
                      maximumFractionDigits: 0,
                    })
                  : args.originalValue;

              return {
                html:
                  args.seriesName +
                  "<div class='currency'>" +
                  valueText +
                  '</div>',
              };
            },
          },
          size: {
            height: 320,
          },
          adaptiveLayout: {
            width: 450,
          },
        })
        .dxChart('instance');

      pivotGrid.bindChart(pivotGridChart, {
        dataFieldsDisplayMode: 'splitPanes',
        alternateDataFields: false,
      });
    } else {
      button.option('hint', 'Habilitar Gráfico');
      pivotGrid.bindChart(null);
      var identify = pivotGrid._$element.data('chart');

      pivotGrid._$element
        .removeClass('dx-pivot-grid-chart-integrated')
        .removeAttr('data-chart');

      var chart = pivotGrid._$element.siblings(identify).dxChart('instance');
      chart.dispose();
      chart._$element.remove();
    }
  };
});
