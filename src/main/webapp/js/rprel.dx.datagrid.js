/*!
 * TNT-Reports
 * Version: 2.19
 *
 * Copyright (c) 2020 Developer Thiago Honorato at TNT Technology
 */
'use strict';

!(function (root, factory) {
  factory(jQuery, root, RpRel);
})(this, function ($, root, RpRel) {
  var util = RpRel.util;

  RpRel.prototype.createDataGrid = function (
    $parent,
    options,
    iddt,
    params,
    updateOptions
  ) {
    var def = $.Deferred(),
      that = this,
      condFormat = options.conditionalFormatting;

    var $gridEl = this.createElementComponent(
      $parent,
      options,
      'dx-datagrid-tnt'
    );

    try {
      var dataGrid = $gridEl.dxDataGrid('instance');
      if (updateOptions) dataGrid.option(options);

      var dataSource = dataGrid.getDataSource();

      util.controlWidgets($gridEl, this, options.key, options.type);

      $.when(dataSource.reload()).then(
        function () {
          def.resolve(true, $gridEl);
        },
        function () {
          def.resolve(false);
        }
      );

      return def;
    } catch (e) {}

    delete options['id'];
    delete options['conditionalFormatting'];

    var settings = $.extend(
      true,
      options,
      {
        searchPanel: {
          visible: false,
        },
      },
      this.options.custm,
      {
        numrpheader: options.numrpheader,
        dataSource: this.createDataSource(
          'dxDataGrid',
          $gridEl,
          iddt,
          options.numrpheader,
          options,
          params
        ),
        onCellClick: function (e) {
          if (e.rowType == 'data') {
            if ($(e.event.target).data('clickedCell')) {
              $(e.event.target).removeData('clickedCell');
            } else {
              var field = e.column && e.column.dataField, // NOME DO CAMPO CLICADO
                value = e.value, // VALOR DO CAMPO CLICADO
                row = e.data, // JSON DA LINHA CLICADA
                $element = $(e.cellElement); // ELEMENTO JQUERY

              that.trigger('cell-click', e, field, value, row, $element);
            }
          }
        },
        onRowClick: function (e) {
          if (e.rowType == 'data') {
            var cell;
            if ($(e.event.target).is('td')) {
              cell = e.event.target;
            } else {
              cell = $(e.event.target).parent('td').get(0);
            }

            var row = e.data, // JSON DA LINHA CLICADA
              $element = $(e.rowElement), // ELEMENTO JQUERY
              field = e.columns[cell.cellIndex].dataField; // NOME DO CAMPO CLICADO

            var initialClick = function () {
              e.component.clickCount = 1;
              e.component.clickKey = e.key;
              e.component.clickDate = new Date();

              that.trigger('row-click', e, row, $element, field);
            };

            var doubleClick = function () {
              e.component.clickCount = 0;
              e.component.clickKey = 0;
              e.component.clickDate = null;

              that.trigger('row-dblclick', e, row, $element, field);
            };

            if (
              !e.component.clickCount ||
              e.component.clickCount != 1 ||
              e.component.clickKey != e.key
            ) {
              initialClick();
            } else if (e.component.clickKey == e.key) {
              if (new Date() - e.component.clickDate <= 300) doubleClick();
              else initialClick();
            }
          }
        },
        onSelectionChanged: function (e) {
          that.trigger('selection-changed', e);
        },
        onCellPrepared: function (e) {
          if (e.rowType == 'header') {
            // CSS
            utilGrid.addCssClassDocument(e.component, {
              class: e.column.cssClass,
              cssclass: e.column.cssStyle,
            });
          } else if (e.rowType == 'data') {
            // HINT
            //if ( e.column.hint )
            //	e.cellElement.attr({"title":e.column.hint});

            // ICON
            if (e.column.icon)
              $(e.column.icon).appendTo(e.cellElement).addClass('dx-cell-icon');

            // LINK
            utilGrid.createLinkColumn(that, e, e.column.links);
          }

          that.trigger('cell-prepared', e);
        },
        onRowPrepared: function (e) {
          utilGrid.conditionalFormatting(e, condFormat);
          that.trigger('row-prepared', e);
        },
        masterDetail: {
          template: function (container, options) {
            var $elem = $('<div/>', {
              id: this.key + '-g-detail-' + options.key,
              class: 'dx-components-tnt',
            }).appendTo(container);

            this.createComponent(
              $elem,
              options.component.option().masterDetail.detail,
              null,
              options.data
            );
          }.bind(this),
        },
        onSuccess: function (e) {
          var name = e.element.attr('id').split('-').join('').split('_')[0];

          var json = {};
          json[name] = e;

          var comp = this._components[e.component.option().key];
          if (typeof comp == 'object') {
            e.component.headerFilters(comp.filters);
          }

          def.resolve(true, $gridEl, json, e);
        }.bind(this),
        onError: function () {
          def.resolve(false);
        },
      }
    );

    this.dxDataGrid($gridEl, settings, updateOptions);

    return def;
  };

  RpRel.prototype.dxDataGrid = function ($el, options, updateOptions) {
    $el.data('repainted', $el.is(':visible'));

    var settings = Object.assign({}, options);

    // CONFIGURAÇÃO SIMPLES
    var simpleGrid = {
      key: undefined,
      heightGrid: 'auto',
      toolbarButtons: function (e) {
        return [];
      },

      allowColumnResizing: true,
      rowAlternationEnabled: true,
      showBorders: true,
      columnResizingMode: 'widget', // widget|nextColumn
      wordWrapEnabled: true,
      columnAutoWidth: true,
      sorting: {
        mode: 'none',
      },
      paging: {
        enabled: false,
      },
      pager: {
        infoText: '{2} registro(s)',
        showInfo: true,
        showNavigationButtons: false,
        showPageSizeSelector: false,
        visible: false,
      },
      export: {
        enabled: false,
        excelFilterEnabled: true,
        excelWrapTextEnabled: true,
        fileName: settings.exportFileName || 'export',
      },
      //				Esse tipo de exportação apresentou uma grande lentidão
      //				onExporting: function(e) { // Excel
      //					var workbook = new ExcelJS.Workbook();
      //					var worksheet = workbook.addWorksheet(e.component.option().exportFileName);
      //
      //					DevExpress.excelExporter.exportDataGrid({
      //						component: e.component,
      //						worksheet: worksheet,
      //						autoFilterEnabled: true
      //					}).then(function() {
      //						workbook.xlsx.writeBuffer().then(function(buffer) {
      //							saveAs(new Blob([buffer], { type: 'application/octet-stream' }), [e.component.option().exportFileName,"xlsx"].join("."));
      //						});
      //					});
      //					e.cancel = true;
      //				},
      loadPanel: {
        text: 'Carregando...',
      },
      noDataText: 'Sem dados',

      // OPÇÕES DA BARRA SUPERIOR DO COMPONENTE
      toolbar: {
        toggleGrid: false, // HABILITA/DESABILITA A MUDANÇA DA VISÃO DOS DADOS
        toggleHeight: false, // HABILITA/DESABILITA A OPÇÃO DA ALTURA DO COMPONENTE (LIMITA A ALTURA DA JANELA OU DE ACORDO COM OS DADOS)
        toggleGrouping: false, // HABILITA/DESABILITA OS BOTÕES QUE MANIPULAM O AGRUPAMENTO DAS COLUNAS
        saveState: false, // HABILITA/DESABILITA O BOTÃO DE SALVA AS ALTERAÇÕES FEITAS PELO USUÁRIO (CRIA UMA CUSTOMIZAÇÃO)
        helper: false, // HABILITA/DESABILITA AS INFORMAÇÕES DE AJUDA
        gridSettings: false, // HABILITA/DESABILITA AS POSSÍVEIS CONFIGURAÇÕES DO COMPONENTE
        exportToPDF: false, // HABILITA/DESABILITA O RECURSO DE EXPORTAR PARA PDF
      },
      onInitialized: function (e) {
        this.componentFunctions(e.component);
      }.bind(this),
      onContentReady: function (e) {
        if (!e.component.created) {
          util.addWidget(this, e);

          var $headerPanel = e.element.find('.dx-datagrid-header-panel');
          if (
            $headerPanel.children('.dx-datagrid-header-filters-applied')
              .length == 0
          ) {
            e.component._$headerFilters = $('<div/>', {
              class: 'dx-datagrid-header-filters-applied',
            }).appendTo($headerPanel);
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

        if (typeof e.component.getGroupedColumns == 'function')
          e.element[
            e.component.getGroupedColumns() > 0 ? 'addClass' : 'removeClass'
          ]('dx-columns-grouped');
      }.bind(this),
      onToolbarPreparing: function (e) {
        var toolbar = e.component.option().toolbar;

        // BOTÃO DE EXPORTAR PARA PDF
        if (toolbar.exportToPDF) {
          e.toolbarOptions.items.unshift({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxButton',
            name: 'exportToPDF',
            showText: 'inMenu',
            cssClass: 'dx-item-export-to-pdf',
            options: {
              disabled: false,
              icon: 'exportpdf', //or your custom icon
              hint: 'Exportar para PDF (beta)',
              text: 'Exportar para PDF (beta)',
              elementAttr: {
                class: 'dx-item-export-to-pdf',
              },
              onClick: function (component, eBtn) {
                utilGrid.print(this, component);
              }.bind(this, e.component),
            },
          });
        }

        // BOTÃO DE SALVAR ALTERAÇÕES
        if (toolbar.saveState) {
          e.toolbarOptions.items.unshift({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxDropDownButton',
            name: 'saveStateButton',
            showText: 'inMenu',
            options: {
              disabled: false,
              icon: 'save', //or your custom icon
              hint: 'Salvar alterações',
              text: '',

              splitButton: true,
              displayExpr: 'name',
              keyExpr: 'id',
              items: this.getItemsButtonSave(),
              dropDownOptions: {
                width: '150px',
              },
              elementAttr: {
                class: 'dx-save-state-button',
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
            },
          });
        }

        // BOTÃO DOS AGRUPADORES
        if (toolbar.toggleGrouping) {
          e.toolbarOptions.items.unshift({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxButton',
            name: 'expandAllButton',
            showText: 'inMenu',
            cssClass: 'dx-item-expand-all',
            options: {
              disabled: false,
              icon: 'spindown', //or your custom icon
              hint: 'Abrir todos agrupamentos',
              text: 'Abrir todos agrupamentos',
              elementAttr: {
                class: 'dx-expand-all-button',
              },
              onClick: function (eBtn) {
                this.component.expandAll();
              }.bind(e),
            },
          });

          e.toolbarOptions.items.unshift({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxButton',
            name: 'collapseAllButton',
            showText: 'inMenu',
            cssClass: 'dx-item-collapse-all',
            options: {
              disabled: false,
              icon: 'spinright', //or your custom icon
              hint: 'Fechar todos agrupamentos',
              text: 'Fechar todos agrupamentos',
              elementAttr: {
                class: 'dx-collapse-all-button',
              },
              onClick: function (eBtn) {
                this.component.collapseAll();
              }.bind(e),
            },
          });
        }

        // BOTÃO QUE ALTERA A ALTURA DA TABELA
        if (toolbar.toggleHeight) {
          e.toolbarOptions.items.unshift({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxButton',
            name: 'changeHeightButton',
            showText: 'inMenu',
            options: {
              disabled: false,
              icon: 'pinright', //or your custom icon
              hint: 'Alterar a altura da tabela',
              text: 'Alterar a altura da tabela',
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
            },
          });
        }

        // BOTÃO QUE ALTERA A VISÃO DO RELATÓRIO PARA O PIVOT GRID
        if (toolbar.toggleGrid) {
          e.toolbarOptions.items.unshift({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxButton',
            name: 'pivotGridButton',
            showText: 'inMenu',
            options: {
              disabled: false,
              icon: 'formula', //or your custom icon
              hint: 'Alterar para o Pivot Grid',
              text: 'Pivot Grid',
              elementAttr: {
                class: 'dx-toggle-pivot-grid-button',
              },
              onClick: function (eBtn) {
                var $element = this.component._$element,
                  $parent = $element.parents('.dx-components-tnt').eq(0),
                  options = Object.assign({}, $element.data('options'), {
                    type: 'dxPivotGrid',
                  });

                this.rprel.createComponent(
                  $parent,
                  options,
                  this.rprel.data.rprel.iddt,
                  this.rprel.options.params,
                  this.updateOptions
                );
              }.bind({
                rprel: this,
                component: e.component,
                updateOptions: updateOptions,
              }),
            },
          });
        }

        // BOTÃO QUE EXIBE INFORMAÇÕES DE AJUDA PARA O USUÁRIO
        if (toolbar.helper) {
          e.toolbarOptions.items.push({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxDropDownButton',
            name: 'helpButton',
            showText: 'inMenu',
            options: {
              disabled: false,
              icon: 'help', //or your custom icon
              hint: 'Help',
              text: '',

              splitButton: true,
              displayExpr: 'text',
              keyExpr: 'type',
              items: this.getItemsButtonHelp(e.component),
              dropDownOptions: {
                width: '190px',
              },
              elementAttr: {
                class: 'dx-help-button',
              },

              onButtonClick: function (e) {
                var item = e.component.option('items')[0];
                item.onItemClick({ itemData: item });
              },
              onItemClick: function (e) {
                e.itemData.onItemClick(e);
              },
            },
          });
        }

        // BOTÃO QUE MOSTRA AS POSSÍVEIS CONFIGURAÇÕES DO DATA GRID
        if (toolbar.gridSettings) {
          e.toolbarOptions.items.push({
            location: 'after',
            locateInMenu: 'auto',
            widget: 'dxButton',
            name: 'settingsButton',
            showText: 'inMenu',
            options: {
              disabled: false,
              icon: 'preferences', //or your custom icon
              hint: 'Configurações',
              text: 'Configurações',
              elementAttr: {
                class: 'dx-setings-button',
              },
              onClick: function (eBtn) {
                utilGrid.showModalSettingGrid(this.component);
              }.bind(e),
            },
          });
        }

        var buttons = e.component.option().toolbarButtons.apply(this, [e]);
        (buttons || []).forEach(function (button) {
          e.toolbarOptions.items.unshift(button);
        });
      }.bind(this),
      onContextMenuPreparing: function (e) {
        var component = e.component,
          element = e.element,
          column = e.column,
          links = column.links,
          data = e.row.data,
          rowIndex = e.rowIndex;

        if (links.length > 0 && e.target === 'content') {
          if (links.length == 1) {
            var items = this.getItemsContextMenuLink(
              links[0],
              Object.assign({}, this.options.params, data)
            );
            Array.prototype.push.apply(
              (e.items != null && e.items) || (e.items = []),
              items
            );
          } else if (links.length > 1) {
            var cellElement = component.getCellElement(
              rowIndex,
              column.dataField
            );

            var onClick = function (cellElement, e) {
              cellElement.get(0).click();
            }.bind(this, cellElement);

            var items = [];
            items.push({
              text: 'Abrir opções de link',
              type: '_options',
              icon: 'bulletlist',
              onItemClick: onClick,
            });

            Array.prototype.push.apply(
              (e.items != null && e.items) || (e.items = []),
              items
            );
          }
        } else {
          Array.prototype.push.apply(
            (e.items != null && e.items) || (e.items = []),
            this.getItemsButtonHelp(e.component)
          );
        }
      }.bind(this),
    };

    // CONFIGURAÇÃO PADRÃO
    var completeGrid = {
      allowColumnReordering: true,
      allowColumnResizing: true,
      allowSortingBySummary: true,
      allowSorting: true,
      allowExpandAll: true,
      autoExpandAll: true,
      allowColumnDragging: true,
      rowAlternationEnabled: true,
      columnHidingEnabled: false,
      headerFilter: {
        visible: true,
        texts: {
          cancel: 'Cancelar',
          emptyValue: '(Vazios)',
          ok: 'Aplicar',
        },
      },
      columnChooser: {
        enabled: true,
        //					title: "Selecionar campos",
        //					emptyPanelText: "Solte a coluna aqui",
        mode: 'select',
      },

      // OPÇÕES DA BARRA SUPERIOR DO COMPONENTE
      toolbar: {
        toggleHeight: true, // HABILITA/DESABILITA A OPÇÃO DA ALTURA DO COMPONENTE (LIMITA A ALTURA DA JANELA OU DE ACORDO COM OS DADOS)
        toggleGrouping: true, // HABILITA/DESABILITA OS BOTÕES QUE MANIPULAM O AGRUPAMENTO DAS COLUNAS
        helper: true, // HABILITA/DESABILITA AS INFORMAÇÕES DE AJUDA
        gridSettings: false, // HABILITA/DESABILITA AS POSSÍVEIS CONFIGURAÇÕES DO COMPONENTE
        exportToPDF: true, // HABILITA/DESABILITA O RECURSO DE EXPORTAR PARA PDF
      },

      groupPanel: {
        visible: 'auto',
        //					emptyPanelText: "Solte a coluna aqui",
      },
      grouping: {
        allowCollapsing: true,
        contextMenuEnabled: true,
        expandMode: 'buttonClick',
        //					texts:{
        //						groupByThisColumn: "Agrupe esta coluna",
        //						groupContinuedMessage: "",
        //						groupContinuesMessage : "",
        //						ungroup: "Desagrupar",
        //						ungroupAll: "Desagrupar todos"
        //					}
      },
      sorting: {
        //					ascendingText: "Ordernar ascendente",
        //					descendingText: "Ordernar descendente",
        //					clearText: "Limpar ordernação",
        mode: 'single',
      },
      paging: {
        enabled: true,
      },
      pager: {
        infoText: '{2} registro(s)',
        showInfo: true,
        visible: true,
      },
      export: {
        enabled: true,
        //					excelFilterEnabled: true,
        //					excelWrapTextEnabled: true,
        //		            fileName: settings.exportFileName || "export"
      },
      selection: {
        mode: 'single',
      },
      searchPanel: {
        placeholder: 'Procurar...',
        searchVisibleColumnsOnly: true,
        width: 300,
        visible: true,
      },
      filterRow: {
        visible: true,
      },
    };

    if (settings.data) delete settings['data'];

    //		if ( settings.exportFileName )
    //			delete settings["exportFileName"];

    var optionsGrid = {};
    if (settings.simpleGrid) {
      optionsGrid = $.extend(true, {}, simpleGrid);
    } else {
      optionsGrid = $.extend(true, {}, simpleGrid, completeGrid);
    }

    $.extend(true, optionsGrid, settings);

    // FILTRO DAS COLUNAS // CAMPO DE PESQUISA
    if (optionsGrid.filterRow && optionsGrid.filterRow.visible == true) {
      optionsGrid = $.extend(
        true,
        {
          filterRow: {
            visible: true,
            applyFilterText: 'Aplicar filtro',
            betweenEndText: 'Fim',
            betweenStartText: 'Inicio',
            operationDescriptions: {
              between: 'Entre',
              contains: 'Contém',
              endsWith: 'Termina com',
              equal: 'Igual',
              greaterThan: 'Maior que',
              greaterThanOrEqual: 'Maior ou igual',
              lessThan: 'Menor que',
              lessThanOrEqual: 'Menor ou igual',
              notContains: 'Não contém',
              notEqual: 'Não é igual',
              startsWith: 'Começa com',
            },
            resetOperationText: 'Apagar',
            showAllText: '(Todos)',
          },
        },
        optionsGrid
      );
    }

    // PAGINAÇÃO
    if (optionsGrid.paging && optionsGrid.paging.enabled == true) {
      optionsGrid = $.extend(
        true,
        {
          paging: {
            enabled: true,
            pageSize: 150,
          },
        },
        optionsGrid,
        {
          pager: {
            allowedPageSizes: [50, 150, 500, 1000, 5000, 10000],
            infoText: 'Pagina {0} de {1} ({2} registro(s))',
            showInfo: true,
            showNavigationButtons: true,
            showPageSizeSelector: true,
            visible: true,
          },
        }
      );
    } else {
      $el.addClass('dx-datagrid-nopaging');
    }

    // SCROLLING
    optionsGrid = $.extend(
      true,
      {
        scrolling: {
          showScrollbar: 'always',
          useNative: true,
        },
      },
      optionsGrid
    );

    // HEIGHT
    Object.assign(optionsGrid, {
      height:
        optionsGrid.height ||
        (optionsGrid.heightGrid == 'window'
          ? util.heightWindow
          : util.heightAuto),
    });

    this.handlers($el, optionsGrid);
    $el.dxDataGrid(optionsGrid);
  };

  var utilGrid = {
    conditionalFormatting: function (e, condFormat) {
      if (!$.isEmptyObject(condFormat) && e.rowType == 'data') {
        $.each(condFormat, function (field) {
          var cond = this.find(function (current, index, arr) {
            var value = util.ifNumber(
                util.alwaysString(this[current.fieldName])
              ),
              valueFrom = util.ifNumber(util.alwaysString(current.valueFrom)),
              valueTo = util.ifNumber(util.alwaysString(current.valueTo));

            if (current.condition == '=') {
              // IGUAL A
              return value == valueFrom;
            } else if (current.condition == '<') {
              // MENOR QUE
              return value < valueFrom;
            } else if (current.condition == '>') {
              // MAIOR QUE
              return value > valueFrom;
            } else if (current.condition == '<=') {
              // MENOR OU IGUAL A
              return value <= valueFrom;
            } else if (current.condition == '>=') {
              // MAIOR OU IGUAL A
              return value >= valueFrom;
            } else if (current.condition == '<>') {
              // DIFERENTE DE
              return value != valueFrom;
            } else if (current.condition == 'B+') {
              // ENTRE
              return valueFrom <= value && value <= valueTo;
            } else if (current.condition == 'B-') {
              // NÃO ESTÁ ENTRE
              return valueFrom > value || value > valueTo;
            } else {
              return false;
            }
          }, e.data);

          if (typeof cond == 'object') {
            var $el;

            if (cond.type == 'row') $el = e.rowElement;
            else {
              var cell = e.cells.find(function (cell) {
                return cell.column.dataField == this;
              }, field);
              if (cell) $el = cell.cellElement;
            }

            if ($el) {
              $el.addClass(cond.cssClass.class);
              utilGrid.addCssClassDocument(e.component, cond.cssClass);
            }
          }
        });
      }
    },
    addCssClassDocument: function (component, cssClass) {
      if (typeof component.cssClassGrid == 'undefined') {
        Object.assign(component, {
          cssClassGrid: [],
        });
      }

      var exists = component.cssClassGrid.find(function (current) {
        return current.class == this.class;
      }, cssClass);

      if (typeof exists == 'undefined') {
        var style = util.addClassDocument(cssClass.cssclass);
        Object.assign(cssClass, {
          style: style,
        });
        component.cssClassGrid.push(cssClass);
      }
    },
    createLinkColumn: function (rprel, e, links) {
      if (!e.value || $.isEmptyObject(links)) return;

      e.cellElement.addClass('cell-link');

      if (links.length == 1) {
        // ADICIONA O LINK DIRETO
        var link = links[0];

        var $link = $('<a/>', {
          target: link.target.indexOf('_') > -1 ? link.target : null,
        }).append(e.cellElement.html());

        var href;
        if (link.url)
          href = util.getURL(
            $link,
            link,
            Object.assign({}, rprel.options.params, e.data),
            rprel.options,
            rprel
          );
        else {
          if (!utilGrid.isValidUrl(e.value)) {
            e.cellElement.removeClass('cell-link');
            return;
          }

          href = e.value;
        }

        util.attachClickLink(
          $link,
          link,
          Object.assign({}, rprel.options.params, e.data),
          rprel.options,
          rprel
        );

        $link.attr({
          href: href,
        });

        e.cellElement.html($link).attr({
          title: link.label || '',
        });
      } else {
        e.cellElement
          .html(
            $('<a/>', {
              href: "javascript:void('Clique para ver as opções de link');",
            }).append(
              $('<span/>', { class: 'click-popover' }).html(
                e.cellElement.html()
              )
            )
          )
          .attr({ title: 'Clique para ver as opções de link' });

        // CRIA AS OPÇÕES DE LINKS
        e.cellElement.on(
          'click',
          $.proxy(
            function (links, eClick) {
              var that = this;

              // FECHA O POPOVER CASO EXISTA ALGUM ABERTO
              dxComponents.dxPopover = dxComponents.dxPopover.filter(function (
                dxPopover
              ) {
                dxPopover.hide();
                return false;
              });

              var popover = $('<div/>', {
                class: 'dx-popover-links',
              })
                .appendTo('BODY')
                .dxPopover({
                  target: this.cellElement.find('.click-popover').eq(0),
                  showEvent: 'dxclick',
                  position: 'top',
                  width: 'auto',
                  visible: true,
                  closeOnOutsideClick: true,
                  //shading: true,
                  //shadingColor: "rgba(0, 0, 0, 0.5)",
                  contentTemplate: function () {
                    var container = $('<div/>', {
                      class: 'dx-scrollview-links',
                    });

                    var $ul = $('<ul/>', {
                      class: 'dx-grid-column-link-list',
                    }).appendTo(container);
                    links.forEach(function (link) {
                      var title;
                      if (link.target.indexOf('_') > -1) title = 'Ir para';
                      else if (link.target == 'popup') title = 'Ir para';
                      else if (link.target == 'transaction') title = '';

                      var $link = $('<a/>', {
                        target:
                          link.target.indexOf('_') > -1 ? link.target : null,
                        title: title,
                      }).text(link.label);

                      var data = Object.assign(
                        {},
                        rprel.options.params,
                        that.data
                      );

                      var href;
                      if (link.url)
                        href = util.getURL(
                          $link,
                          link,
                          data,
                          rprel.options,
                          rprel
                        );
                      else {
                        if (!utilGrid.isValidUrl(that.value)) {
                          return;
                        }

                        href = that.value;
                      }

                      util.attachClickLink(
                        $link,
                        link,
                        data,
                        rprel.options,
                        rprel
                      );

                      $link.attr({
                        href: href,
                      });

                      var $li = $('<li/>')
                        .appendTo($ul)
                        .append($link)
                        .on('click', 'a', function (e) {
                          popover.hide();
                          popover.dxPopover('hide');
                        });

                      $('<div/>', {
                        class: 'rprel-link-context-menu',
                      })
                        .appendTo(container)
                        .dxContextMenu({
                          dataSource: rprel.getItemsContextMenuLink(link, data),
                          target: $li,
                          onItemClick: function (e) {
                            popover.hide();
                            e.itemData.onItemClick.apply(
                              e.itemData.onItemClick,
                              [e]
                            );
                          },
                        });
                    });

                    container.dxScrollView({
                      width: '100%',
                      height: '100%',
                      useNative: true,
                    });

                    return container;
                  },
                  onHidden: function (e) {
                    e.component.dispose();
                    e.element.remove();
                  },
                });

              dxComponents.dxPopover.push(popover);

              // FECHA O POPOVER COM A TECLA ESC
              $(document).on(
                'keyup.popover',
                $.proxy(function (e) {
                  if (e.keyCode == 27) {
                    this.hide();
                    $(document).off('keyup.popover');
                  }
                }, popover)
              );
            },
            e,
            links
          )
        );
      }
    },
    showModalSettingGrid: function (component) {
      var themeDataGrid =
          $("link[href*='dx.light.compact.css']").length > 0
            ? 'light.compact'
            : 'light',
        data = {
          themeDataGrid: themeDataGrid,
        };

      if (typeof component._popupSetting == 'undefined') {
        var $popup = $('<div/>', {
          class: 'dx-datagrid-grid-settings-popup',
        }).appendTo('BODY');
        var popup = $popup
          .dxPopup({
            width: 'auto',
            height: 'auto',
            showTitle: true,
            title: 'Configurações',
            visible: false,
            dragEnabled: true,
            closeOnOutsideClick: false,
            shading: false,
            minWidth: 300,
            minHeight: 250,
            showCloseButton: true,
            position: {
              at: 'right bottom',
              boundaryOffset: '2 2',
              collision: 'fit',
              my: 'right bottom',
              of: component._$element.find('.dx-datagrid-rowsview').eq(0),
              offset: '-2 -2',
            },
            contentTemplate: function () {
              var $form = $('<div/>').appendTo('BODY');
              var dxForm = $form
                .dxForm({
                  formData: data,
                  items: [
                    {
                      itemType: 'group',
                      colCount: 2,
                      items: [
                        {
                          dataField: 'themeDataGrid',
                          label: {
                            text: 'Modo de exibição (beta)',
                            visible: true,
                          },
                          colSpan: 2,
                          editorType: 'dxSelectBox',
                          editorOptions: {
                            displayExpr: 'txt',
                            displayValue: 'cod',
                            valueExpr: 'cod',
                            placeholder: 'Selecione...',
                            value: themeDataGrid,
                            items: [
                              {
                                cod: 'light',
                                txt: 'Padrão',
                              },
                              {
                                cod: 'light.compact',
                                txt: 'Compacto',
                              },
                            ],
                            onValueChanged: function (data) {
                              if (
                                data.value !=
                                localStorage.getItem(this._options.name)
                              ) {
                                $(
                                  "link[href*='dx." + data.previousValue + "']"
                                ).each(function () {
                                  this.href = this.href.replace(
                                    data.previousValue,
                                    data.value
                                  );
                                });
                                localStorage.setItem(
                                  this._options.name,
                                  data.value
                                );
                              }
                            },
                          },
                        },
                      ],
                    },
                  ],
                })
                .dxForm('instance');

              Object.assign(popup, {
                _dxForm: dxForm,
              });

              return $form;
            },
          })
          .dxPopup('instance');

        Object.assign(component, {
          _popupSetting: popup,
        });
      } else {
        component._popupSetting._dxForm.updateData(data);
      }
      component._popupSetting.show();
    },
    isValidUrl: function (url) {
      try {
        new URL(url);
        return true;
      } catch (e) {
        return false;
      }
    },
    print: function (rprel, component) {
      if (typeof window.jsPDF === 'undefined') {
        window.jsPDF = window.jspdf.jsPDF;
        applyPlugin(window.jsPDF);
      }

      $.dialog({
        title: 'Configurações de impressão',
        contentTemplate: function (container, dialog) {
          var $form = $('<form/>', {
            class: 'form-horizontal',
          }).appendTo(container);

          var $row = $('<div/>', {
            class: 'row',
          }).appendTo($form);

          var templateRadioOrientation = util.replace(
            util.replace(
              util.replace(
                util.replace(
                  util.replace(
                    util.replace(
                      util.replace(
                        this.options.getTemplateRadio(2),
                        '%name',
                        'orientation'
                      ),
                      '%class',
                      ''
                    ),
                    '%grouplabel',
                    'Orientação'
                  ),
                  '%label0',
                  'Retrato'
                ),
                '%label1',
                'Paisagem'
              ),
              '%value0',
              'portrait'
            ),
            '%value1',
            'landscape'
          );
          var templateSelectFormat = util.replace(
            util.replace(
              util.replace(this.options.getTemplateSelect(), '%name', 'format'),
              '%class',
              ''
            ),
            '%label',
            'Tamanho do papel'
          );
          $('<div/>', { class: 'col-xs-12' })
            .appendTo($row)
            .append(templateRadioOrientation);

          var $selectFormat = $('<div/>', { class: 'col-xs-12' })
            .appendTo($row)
            .append(templateSelectFormat)
            .find('select');

          var formats = [
            {
              value: 'a0',
              text: 'A0 (841mm x 1189mm)',
            },
            {
              value: 'a1',
              text: 'A1 (594mm x 841mm)',
            },
            {
              value: 'a2',
              text: 'A2 (420mm x 594mm)',
            },
            {
              value: 'a3',
              text: 'A3 (297mm x 420mm)',
            },
            {
              value: 'a4',
              text: 'A4 (210mm x 297mm)',
            },
            {
              value: 'a5',
              text: 'A5 (148mm x 210mm)',
            },
            {
              value: 'a6',
              text: 'A6 (105mm x 148mm)',
            },
            {
              value: 'a7',
              text: 'A7 (74mm x 105mm)',
            },
            {
              value: 'a8',
              text: 'A8 (52mm x 74mm)',
            },
            {
              value: 'a9',
              text: 'A9 (37mm x 52mm)',
            },
            {
              value: 'a10',
              text: 'A10 (26mm x 37mm)',
            },
            {
              value: 'b4',
              text: 'B4 (250mm x 353mm)',
            },
            {
              value: 'b5',
              text: 'B5 (176mm x 250mm)',
            },
            {
              value: 'letter',
              text: 'Carta (8,5" x 11")',
            },
            {
              value: 'legal',
              text: 'Ofício (8,5" x 14")',
            },
            {
              value: 'ledger',
              text: 'Tablóide (11" x 17")',
            },
          ];

          formats.forEach(function (format) {
            $('<option/>', {
              value: format.value,
            })
              .text(format.text)
              .appendTo($selectFormat);
          });
        }.bind(rprel),
        onShown: function (dialog) {
          dialog.$body.find('form').formLoad({
            orientation: 'portrait',
            format: 'a4',
          });
        },
        buttons: [
          {
            text: 'Imprimir',
            classes: 'btn-primary',
            focus: true,
            close: false,
            fn: function (component, event, $btn, dialog) {
              var orientation = dialog.$body
                .find('[name=orientation]:checked')
                .val();
              var format = dialog.$body.find('[name=format]').val();

              var doc = new jsPDF({
                orientation: orientation,
                format: format,
              });

              var dateCurrent = util.getDateFormatted();
              var footerText =
                'Gerado por TNT-Reports em ' +
                dateCurrent +
                ' - TNT Technology';
              var totalPagesExp = '{p}';

              DevExpress.pdfExporter
                .exportDataGrid({
                  jsPDFDocument: doc,
                  component: component,
                  autoTableOptions: {
                    theme: 'striped',
                    alternateRowStyles: {
                      fillColor: [245, 245, 245],
                    },
                    bodyStyles: {
                      lineColor: 200,
                    },
                    margin: {
                      top: 10,
                      left: 10,
                      right: 10,
                      bottom: 15,
                    },
                    didDrawPage: function (data) {
                      var pageSize = doc.internal.pageSize;
                      var pageHeight = pageSize.height
                        ? pageSize.height
                        : pageSize.getHeight();
                      var pageWidth = pageSize.width
                        ? pageSize.width
                        : pageSize.getWidth();

                      var positionFooter = {
                        top: pageHeight - 10,
                        left: data.settings.margin.left,
                        right: pageWidth - 10,
                      };

                      doc.line(
                        positionFooter.left,
                        positionFooter.top - 3,
                        pageWidth - 10,
                        positionFooter.top - 3
                      );

                      doc.setTextColor('#323232');

                      doc.setFontSize(7);
                      doc.setFont('Helvetica', 'italic');
                      doc.text(
                        footerText,
                        positionFooter.left,
                        positionFooter.top
                      );

                      var pagination =
                        'Página ' +
                        doc.internal.getNumberOfPages() +
                        ' de ' +
                        totalPagesExp;
                      doc.setFontSize(8);
                      doc.setFont('Helvetica', 'normal');
                      doc.text(
                        pagination,
                        positionFooter.right,
                        positionFooter.top,
                        { align: 'right' }
                      );
                    },
                  },
                  customizeCell: function (e) {
                    var styles = {
                      fontSize: 8,
                      textColor: 50,
                      fontStyle: 'normal',
                      cellPadding: 1,
                    };

                    if (e.gridCell.rowType === 'header') {
                      Object.assign(styles, {
                        halign: 'center',
                        fillColor: [210, 210, 210],
                      });
                    } else if (e.gridCell.rowType === 'group') {
                      Object.assign(styles, {
                        fillColor: [225, 225, 225],
                      });
                    } else if (e.gridCell.rowType === 'data') {
                      Object.assign(styles, {
                        lineColor: 200,
                      });
                    } else if (e.gridCell.rowType === 'totalFooter') {
                      Object.assign(styles, {
                        fillColor: [210, 210, 210],
                      });
                    }

                    Object.assign(e.pdfCell.styles, styles);
                  },
                })
                .then(function () {
                  //									var numberOfPages = doc.internal.getNumberOfPages();
                  //									var dateCurrent = util.getDateFormatted();
                  //
                  //									for (var index = 1; index <= numberOfPages; index++) {
                  //										doc.setPage(index);
                  //
                  //										doc.setFont("Arial", "italic");
                  //										doc.setFontSize(10);
                  //										doc.text("Gerado por TNT-Reports em " + dateCurrent, 16, 16);
                  //									}

                  doc.putTotalPages(totalPagesExp);
                  doc.save(
                    [component.option().exportFileName, 'pdf'].join('.')
                  );
                });
            }.bind(rprel, component),
          },
          {
            text: 'Cancelar',
          },
        ],
      });
    },
  };

  var dxComponents = {
    dxPopover: [],
  };
});
