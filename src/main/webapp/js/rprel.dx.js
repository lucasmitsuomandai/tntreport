/*!
 * TNT-Reports
 * Version: 2.19
 *
 * Copyright (c) 2020 Developer Thiago Honorato at TNT Technology
 */
'use strict';

!(function (root, factory) {
  factory(root, jQuery);
})(this, function (root, $) {
  root.RpRel = function ($el, options) {
    this.options = options;
    this.$el = $el;
    this.$body = $('body');
    this.$actions = undefined;
    this.$form = undefined;
    this.$tabs = undefined;
    this.key = util.randomString();
    this.$popups;

    this._components = {};

    if (typeof this.options.actions == 'string') {
      this.$actions = $(this.options.actions);
    } else if (this.options.actions instanceof jQuery) {
      this.$actions = this.options.actions;
    } else if (typeof this.options.actions == 'function') {
      this.$actions = this.options.actions.apply(null);
    }

    if ($.inArray(typeof this.options.form, ['string', 'undefined']) > -1) {
      this.$form = $('#' + this.options.form);

      if (this.$form.length == 0)
        this.$form = $('<form/>', {
          id: this.key + '-f-' + (this.options.form || 'form'),
        }).prependTo(this.$el);

      this.$form.data('created', false);
    }

    if (typeof root.Token == 'object' && typeof root.Session == 'function')
      Object.assign(this.options.params, {
        token: root.Session().token(),

        idctrsession: root.Session().token(),
        idctrusr: root.Session().user.identerp,
      });

    this.init();
  };

  RpRel.getDefaults = function () {
    return {
      id: undefined,
      type: 'PAG', // PAG|REP
      params: {}, // parâmetros da sessão

      filters: {}, // filtros do relatório
      filterDataApplied: false, // indica se o filtro foi aplicado

      actions: undefined, // string|jQuery|function
      form: undefined, // string | boolean (false)
      grids: [],

      custm: {}, // PERSONALIZAR A GRID

      onCellClick: function (e, field, value, row, $element) {},
      onRowClick: function (e, row, $element, field) {},
      onRowDblClick: function (e, row, $element, field) {},
      onSelectionChanged: function (e) {},
      onCellPrepared: function (e) {},
      onRowPrepared: function (e) {},

      onSuccess: function (e) {},
      onError: function () {},

      getTemplateInput: function () {
        return (
          "<span class='md-inputfield %class'>" +
          "<input name='%name' type='text' class='input-sm' disabled/>" +
          '<label>%label</label>' +
          '</span>'
        );
      },
      getTemplateTextarea: function () {
        return (
          "<span class='md-inputfield %class'>" +
          "<textarea name='%name' class='input-sm' disabled></textarea>" +
          '<label>%label</label>' +
          '</span>'
        );
      },
      getTemplateSelect: function () {
        return (
          "<span class='md-inputfield %class'>" +
          "<select name='%name' class='input-sm'></select>" +
          '<label>%label</label>' +
          '</span>'
        );
      },
      getTemplateRadio: function (count, defaultIndex) {
        var template =
          "<div class='md-radiofield %class'>" + "<div class='md-radio'>";

        var index = 0;
        do {
          template +=
            "<label class='radio-inline'>" +
            "<input type='radio' name='%name' value='%value" +
            (typeof count !== 'undefined' ? index : '') +
            "'" +
            (typeof count !== 'undefined' && index === defaultIndex
              ? 'checked'
              : '') +
            '> %label' +
            (typeof count !== 'undefined' ? index : '') +
            '</label>';
        } while (++index < (count || 0));

        template += '</div><label>%grouplabel</label></div>';

        return template;
      },
      getTemplateLabel: function () {
        return "<label class='control-label %class' data-name='%name'>%label</label>";
      },
      getContainerComponent: function () {
        return "<div class='%class' aria-component='%componentKey'></div>";
      },
      getTemplateFieldset: function () {
        return "<fieldset class='%class'><legend>%label</legend></fieldset>";
      },
    };
  };

  RpRel.EVENTS = {
    'cell-click.bs.rprel': 'onCellClick',
    'row-click.bs.rprel': 'onRowClick',
    'row-dblclick.bs.rprel': 'onRowDblClick',
    'selection-changed.bs.rprel': 'onSelectionChanged',
    'cell-prepared.bs.rprel': 'onCellPrepared',
    'row-prepared.bs.rprel': 'onRowPrepared',
    'success.bs.rprel': 'onSuccess',
    'error.bs.rprel': 'onError',
  };

  RpRel.allowedMethods = [
    'refresh',
    'repaint',
    'clearData',
    'destroy',
    'instance',
  ];

  // PARA IDENTIFICAR A COLUNA DO CAMPO NO FORMULÁRIO
  // UTILIZADO PARA EXIBIR OU OCULTAR O CAMPO
  RpRel.fieldParentColumn = [
    '.col-xs-1',
    '.col-sm-1',
    '.col-md-1',
    '.col-lg-1',
    '.col-xs-2',
    '.col-sm-2',
    '.col-md-2',
    '.col-lg-2',
    '.col-xs-3',
    '.col-sm-3',
    '.col-md-3',
    '.col-lg-3',
    '.col-xs-4',
    '.col-sm-4',
    '.col-md-4',
    '.col-lg-4',
    '.col-xs-5',
    '.col-sm-5',
    '.col-md-5',
    '.col-lg-5',
    '.col-xs-6',
    '.col-sm-6',
    '.col-md-6',
    '.col-lg-6',
    '.col-xs-7',
    '.col-sm-7',
    '.col-md-7',
    '.col-lg-7',
    '.col-xs-8',
    '.col-sm-8',
    '.col-md-8',
    '.col-lg-8',
    '.col-xs-9',
    '.col-sm-9',
    '.col-md-9',
    '.col-lg-9',
    '.col-xs-10',
    '.col-sm-10',
    '.col-md-10',
    '.col-lg-10',
    '.col-xs-11',
    '.col-sm-11',
    '.col-md-11',
    '.col-lg-11',
    '.col-xs-12',
    '.col-sm-12',
    '.col-md-12',
    '.col-lg-12',
  ];

  RpRel.prototype.init = function () {
    this.$el.addClass('rprel');

    $.when(this.load())
      .then(
        function () {
          this.$el[(this.data.rprel.redid && 'addClass') || 'removeClass'](
            'rprel-custm'
          );

          if (this.isOpenFilter()) {
            this.showFilter();
          }

          //			ACTIONS ==========================================
          this.actions();

          //    		FORM =============================================
          this.createForm();

          //    		TABS =============================================
          this.tabs();

          //    		COMPONENTS =======================================
          var defs = this.create();

          //			POPUPS
          this.$popups = $('<div/>').appendTo(this.$el);

          $.when.apply($, defs).then(
            $.proxy(function () {
              var e = {},
                args = Array.prototype.slice.apply(arguments);

              for (var i in args) {
                Object.assign(e, args[i]);
              }

              this.trigger('success', e);
            }, this),
            $.proxy(function () {
              this.trigger('error');
            }, this)
          );
        }.bind(this),
        function (error) {
          this.trigger('error', error);
        }.bind(this)
      )
      .catch(
        function (e) {
          console.error(e);
          this.trigger('error');
        }.bind(this)
      );
  };

  RpRel.prototype.actions = function () {
    if (this.$actions) {
      var created = this.$actions.data('rpRelCreated');
      if (!created) {
        this.$actions.data('rpRelCreated', true);

        if (this.data.rprel.filterData.enabled) {
          this.$buttonFilter = $('<button/>', {
            type: 'button',
            class: 'btn btn-sm btn-default',
            title: 'Filtrar Dados',
          })
            .on(
              'click',
              function (e) {
                this.showFilter();
              }.bind(this)
            )
            .append("<i class='btn-icon material-icons'>filter_alt</i>")
            .appendTo(this.$actions);
        }

        if (this.data.links.length > 0) {
          $('<button/>', {
            type: 'button',
            class: 'btn btn-sm btn-default dropdown-toggle',
            'data-toggle': 'dropdown',
            'aria-haspopup': 'true',
            'aria-expanded': 'false',
          })
            .append("<span class='caret'></span>")
            .append("<span class='sr-only'>Toggle Dropdown</span>")
            .appendTo(this.$actions);

          var $dropdown = $('<ul/>', {
            class: 'dropdown-menu dropdown-menu-right',
          }).appendTo(this.$actions);

          $.map(
            this.data.links,
            function (link) {
              if (link.separator) {
                $('<li/>', {
                  class: 'divider',
                  role: 'separator',
                }).appendTo(this.dropdown);
              } else {
                var $link = $('<a/>', {
                  target: link.target.indexOf('_') > -1 ? link.target : null,
                  class: link.class || '',
                })
                  .text(link.title)
                  .appendTo($('<li/>').appendTo(this.dropdown));

                var href = util.getURL(
                  $link,
                  link,
                  Object.assign({}, this.rprel.options.params),
                  this.rprel.options,
                  this.rprel
                );
                var data = Object.assign({}, this.rprel.options.params);

                if (link.target != 'help') {
                  util.attachClickLink(
                    $link,
                    link,
                    data,
                    this.rprel.options,
                    this.rprel
                  );

                  $('<div/>', {
                    class: 'rprel-link-context-menu',
                  })
                    .insertAfter(this.dropdown)
                    .dxContextMenu({
                      dataSource: this.rprel.getItemsContextMenuLink(
                        link,
                        data
                      ),
                      target: $link,
                      onItemClick: function (e) {
                        //popover.hide();
                        e.itemData.onItemClick.apply(e.itemData.onItemClick, [
                          e,
                        ]);
                      },
                    });
                }

                $link.attr({
                  href: href,
                });
              }
            }.bind({
              rprel: this,
              dropdown: $dropdown,
            })
          );

          $dropdown.on(
            'click',
            '.rp-edit-report',
            function (e) {
              e.preventDefault();
              this.editRprelDesc();
            }.bind(this)
          );
        }
      }
    }
  };

  RpRel.prototype.tabs = function () {
    var created = false;
    var first = true;
    var index = 0;
    for (var i in this.data.grid) {
      if (this.data.grid[i].intab) {
        if (!created) {
          this.$tabs = $('<div/>', {
            class: 'tabs-rprel',
          }).appendTo(this.$el);

          // Nav tabs
          $('<ul/>', {
            class: 'nav nav-tabs',
            role: 'tablist',
          }).appendTo(this.$tabs);

          // Tab panes
          $('<div/>', {
            class: 'tab-content',
          }).appendTo(this.$tabs);

          created = true;
        }

        var href = 'tab' + this.data.rprel.id + this.data.grid[i].numrpheader;
        $('<li/>', {
          role: 'presentation',
          class: first ? 'active' : '',
        })
          .appendTo(this.$tabs.children('.nav'))
          .append(
            $('<a/>', {
              href: '#' + href,
              'aria-controls': href,
              role: 'tab',
              'data-toggle': 'tab',
            }).text(this.data.grid[i].tabtitle)
          );

        $('<div/>', {
          role: 'tabpanel',
          'aria-tabindex': index,
          class: 'tab-pane fade' + (first ? ' in active' : ''),
          id: href,
        }).appendTo(this.$tabs.children('.tab-content'));

        first = false;
      }

      index++;
    }
  };

  RpRel.prototype.create = function () {
    var defs = [],
      index = 0;
    for (var i in this.data.grid) defs.push($.Deferred());
    $.each(
      this.data.grid,
      function (key, options) {
        var i = index++,
          gridEl = this.options.grids[i] || this.key + '-g-' + options.id;

        var $el = $('#' + gridEl);
        if ($el.length == 0) {
          $el = $('<div/>', { id: gridEl });
          if (
            this.$form &&
            this.$form.find('[aria-component=' + options.key + ']').length > 0
          ) {
            $el.appendTo(
              this.$form.find('[aria-component=' + options.key + ']')
            );
          } else if (options.intab) {
            $el.appendTo(this.$tabs.find('[aria-tabindex=' + i + ']'));
          } else {
            $el.appendTo(this.$el);
          }
        }

        $el.addClass('dx-components-tnt dx-control-components-tnt');

        this._components[options.key] = {
          $element: $el,
          filters: '',
          options: options,
          widgets: [],
        };

        this.createComponent(
          $el,
          options,
          this.data.rprel.iddt,
          this.options.params,
          false
        ).always(
          function (success, $el, json, e) {
            if (success) {
              defs[i].resolve(json);
            } else {
              defs[i].reject(json);
            }
          }.bind(this)
        );
      }.bind(this)
    );
    return defs;
  };

  RpRel.prototype.createComponent = function (
    $el,
    options,
    iddt,
    params,
    updateOptions
  ) {
    $el.children('.dx-component-tnt').removeClass('active').hide();

    if (options.type == 'dxDataGrid')
      return this.createDataGrid($el, options, iddt, params, updateOptions);
    else if (options.type == 'dxPivotGrid')
      return this.createPivotGrid($el, options, iddt, params, updateOptions);
    else if (options.type == 'dxScheduler')
      return this.createScheduler($el, options, iddt, params, updateOptions);
    else if (options.type == 'dxChart')
      return this.createChart($el, options, iddt, params, updateOptions);
    else return $.Deferred().reject();
  };

  RpRel.prototype.createElementComponent = function ($parent, options, classe) {
    var $element = $parent.children(['.', classe].join(''));
    if ($element.length > 0) return $element.show().addClass('active');
    else
      return $('<div/>', {
        id: $parent.attr('id') + '_' + util.randomString(),
        class: 'dx-component-tnt active ' + (classe || ''),
      })
        .appendTo($parent)
        .data('options', $.extend(true, {}, options)); // JSON.parse(JSON.stringify(options))
  };

  RpRel.prototype.handlers = function ($el, json) {
    $(window).on(
      'resize',
      function () {
        if (!this.is(':visible')) return;
        var component = this.data('dxComponents')[0];
        this[component]('instance').repaint();
      }.bind($el)
    );

    // SOLUÇÃO PARA CRIAR UM HINT NO TÍTULO DAS COLUNAS
    if (json && json.columns) {
      for (var i = 0; i < json.columns.length; i++) {
        Object.assign(json.columns[i], {
          headerCellTemplate: function (header, info) {
            $('<div>')
              .html(info.column.caption)
              .attr('title', info.column.hintHeader || '')
              .appendTo(header);
          },
        });
      }
    }

    // PERSONALIZAÇÃO DO CONTADOR: ADICIONA A PALAVRA NO SINGULAR (singularCounter) E PLURAL (pluralCounter).
    if (json && json.summary && json.summary.groupItems) {
      $.each(json.summary.groupItems, function () {
        if (
          this.summaryType === 'count' &&
          (this.singularCounter || this.pluralCounter)
        ) {
          var that = this;
          Object.assign(this, {
            customizeText: function (data) {
              return data.value > 1
                ? data.value + ' ' + (that.pluralCounter || '').trim()
                : data.value + ' ' + (that.singularCounter || '').trim();
            },
          });
        }
      });
    }
  };

  RpRel.prototype.componentFunctions = function (component) {
    Object.assign(component, {
      headerFilters: function (html) {
        var comp = this.rprel._components[this.component.option().key];

        if (typeof html == 'undefined') return comp.filters;

        this.component._$headerFilters.html(html);

        var $element = this.component._$element,
          options = $element.data('options');

        delete options.toolbar.filterData.filter.defaultLabel;
        delete this.component.option().toolbar.filterData.filter.defaultLabel;

        $element.data('options', options);

        Object.assign(comp, {
          filters: html,
        });
      }.bind({
        component: component,
        rprel: this,
      }),
      stateColumns: function (columns) {
        if (typeof columns != 'undefined') {
          var $element = this._$element;

          var options = $element.data('options');
          Object.assign(options, {
            columns: columns,
          });
        }

        if (this.NAME == 'dxDataGrid')
          return (
            (typeof columns != 'undefined' &&
              this.option({ columns: columns })) ||
            this.state().columns ||
            this.option('columns')
          );
        else if (this.NAME == 'dxPivotGrid')
          return (
            (typeof columns != 'undefined' &&
              this.getDataSource().state({ fields: columns })) ||
            this.getDataSource().state().fields ||
            []
          );
        else return [];
      }.bind(component),
      getGroupedColumns: function () {
        return this.stateColumns().filter(function (column) {
          return column.groupIndex > -1;
        }).length;
      }.bind(component),
    });
  };

  RpRel.prototype.saveState = function (component) {
    var defs = [],
      comp = this._components[component.option().key],
      originalColumns = comp.options.columns.slice();

    defs.push($.Deferred());
    for (var i in comp.widgets) {
      defs.push($.Deferred());
    }

    // REALIZA A CÓPIA DO RELATÓRIO (APENAS QUANDO NÃO EXISTE)
    TNTAjax.manter({
      silent: true,
      data: {
        codfrpst: 'ORIONRPRELCOPY',
        id: this.data.rprel.id,
        iddt: this.data.rprel.iddt,
        idctrusr: this.options.params.idctrusr,
      },
      onSuccess: function (response) {
        if (response.codigo == 0) {
          this.resolve(response);
        } else {
          this.reject();
        }
      }.bind(defs[0]),
      onError: function () {
        this[0].reject();
      }.bind(defs),
    });

    defs[0].done(
      function (response) {
        $.extend(true, this.data, response.data);

        // PERCORRE PELOS COMPONENTS DO RELATÓRIO (TABELA)
        for (var i = 0; i < comp.widgets.length; i++) {
          var widget = comp.widgets[i],
            component = widget.$element[widget.type]('instance'),
            state = component.stateColumns(),
            data = [];

          this.repaintItemsButtonSave(component);

          // PERCORRE PELAS COLUNAS DO RELATÓRIO (TABELA)
          for (var col in originalColumns) {
            var originalColumn = JSON.parse(
              JSON.stringify(originalColumns[col])
            );

            // LOCALIZA A COLUNA CUSTOMIZADA
            var customColumn = state.find(function (currentValue, index, arr) {
              return this.dataField == currentValue.dataField;
            }, originalColumn);

            data.push(customColumn);
          }

          TNTAjax.manter({
            silent: true,
            data: {
              codfrpst: 'ORIONRPRELCUSTM',
              id: this.data.rprel.id,
              idgd: component.option().numrpheader,
              state: JSON.stringify(data),
              type: component.option().type,
              idctrusr: this.options.params.idctrusr,
            },
            onSuccess: function (response) {
              if (response.codigo == 0) {
                this.resolve();
              } else {
                this.reject();
              }
            }.bind(defs[i + 1]),
            onError: function () {
              this.reject();
            }.bind(defs[i + 1]),
          });
        }
      }.bind(this)
    );

    $.when.apply($, defs).then(
      function () {
        $.notify('Suas alterações foram salvas com sucesso!');
        this.$el.addClass('rprel-custm');
      }.bind(this)
    );
  };

  RpRel.prototype.redoState = function () {
    var def = $.Deferred();

    TNTAjax.manter({
      data: {
        codfrpst: 'ORIONRPRELREDO',
        id: this.data.rprel.id,
        iddt: this.data.rprel.iddt,
        idctrusr: this.options.params.idctrusr,
      },
      onSuccess: function (response) {
        if (response.codigo == 0) {
          this.$el.removeClass('rprel-custm');
          def.resolve(response);
        }
      }.bind(this),
      onError: function () {
        def.reject();
      },
    });

    def.done(
      function (response) {
        $.extend(true, this.data, response.data);

        // PERCORRE POR TODAS AS TABELAS
        $.each(
          response.data.grid,
          function (key, options) {
            $.each(
              response.data.grid[key],
              function (key, options) {
                // PERCORRE POR TODOS OS COMPONENTS
                $.each(
                  this._components[key].widgets,
                  function (i, comp) {
                    var component = comp.$element[comp.type]('instance');
                    component.stateColumns(this.options.columns);
                    this.rprel.repaintItemsButtonSave(component);
                  }.bind({
                    options: options,
                    rprel: this,
                  })
                );
              }.bind(this)
            );
          }.bind(this)
        );
      }.bind(this)
    );
  };

  RpRel.prototype.isOpenFilter = function () {
    return (
      !this.options.filterDataApplied &&
      this.data.rprel.filterData &&
      this.data.rprel.filterData.required
    );
  };

  RpRel.prototype.createDataSource = function (
    type,
    $element,
    iddt,
    numrpheader,
    options,
    params
  ) {
    var load = function (loadOptions) {
      var deferred = $.Deferred();

      if (this.$element.data('rpRelDataClear')) {
        this.$element.removeData('rpRelDataClear');
        return deferred.resolve([]);
      }

      if (this.RpRel.isOpenFilter()) {
        return deferred.resolve([], {});
      }

      return this.RpRel.loadData(this.numrpheader, this.iddt, this.params);
    }.bind({
      $element: $element,
      RpRel: this,
      iddt: iddt,
      numrpheader: numrpheader,
      params: params,
      options: options,
    });

    if ($.inArray(type, ['dxDataGrid', 'dxScheduler', 'dxChart']) > -1) {
      if (!options.drillDownDataSource)
        return new DevExpress.data.DataSource({
          key: 'id_row',
          numrpheader: numrpheader,
          load: load,
        });
      else return options.drillDownDataSource;
    } else if (type == 'dxPivotGrid') {
      var fields = options.columns.map(function (column) {
        var field = $.extend(true, {}, column);
        field.visible = true;
        return field;
      });

      var store;

      if (!options.drillDownDataSource)
        store = new DevExpress.data.CustomStore({
          key: 'id_row',
          numrpheader: numrpheader,
          load: load,
        });
      else {
        store = new DevExpress.data.ArrayStore({
          key: 'id_row',
          data: options.drillDownDataSource.items(),
        });
      }

      return new DevExpress.data.PivotGridDataSource({
        store: store,
        fields: fields || [],
        onFieldsPrepared: function () {},
      });
    }
  };

  RpRel.prototype.refresh = function (options) {
    var defs = [];

    Object.assign(this.options.params, (options && options.params) || {});
    Object.assign(this.options.filters, (options && options.filters) || {});

    Object.assign(this.options, {
      filterDataApplied:
        typeof options.filterDataApplied == 'boolean'
          ? options.filterDataApplied
          : this.options.filterDataApplied,
    });

    this.saveParams(
      Object.assign({}, this.options.params, this.options.filters)
    ).then(
      function () {
        //    		FORM =============================================
        var promiseForm;
        if (this.$form) {
          promiseForm = this.loadForm();
          $.when(promiseForm).then(
            function (data) {
              this.$form.formLoad(data, { reset: true });
            }.bind(this)
          );
        } else {
          promiseForm = $.Deferred().resolve({});
        }

        var components = [];
        $.when(promiseForm).then(
          function (dataForm) {
            //				COMPONENTS =======================================
            for (var key in this._components) {
              var option = this._components[key];

              for (var i in option.widgets) {
                var widget = option.widgets[i],
                  component = widget.$element[widget.type]('instance'),
                  dataSource = component.getDataSource();

                if (widget.active) {
                  widget.$element.data(
                    'repainted',
                    widget.$element.is(':visible')
                  );
                  components.push(component);
                  defs.push(dataSource.reload());
                }
              }
            }
          }.bind(this)
        );

        $.when.apply($, defs).then(
          $.proxy(function () {
            var e = {};
            for (var i in components) {
              var comp = components[i],
                json = {};

              var name = comp._$element.attr('id').split('-').join('');

              json[name] = {
                component: comp,
                element: comp._$element,
              };

              Object.assign(e, json);
            }

            this.trigger('success', e);
          }, this),
          $.proxy(function () {
            this.trigger('error');
          }, this)
        );
      }.bind(this)
    );
  };

  RpRel.prototype.repaint = function () {
    $.each(this._grids, function () {
      if (this.$grid.is(':visible')) {
        this.$grid.dxDataGrid('repaint');
      }
    });
  };

  RpRel.prototype.destroy = function (options) {
    this.$el.removeData('rprel');
    if (this.$form instanceof jQuery) this.$form.reset(true);
    $.each(
      this.options.grids,
      $.proxy(function (i, grid) {
        $('#' + grid).dxDataGrid('dispose');
      }, this)
    );
    return this.$el;
  };

  RpRel.prototype.clearData = function (grid) {
    for (var i in this._grids) {
      var grid = this._grids[i],
        component = grid.$grid.dxDataGrid('instance'),
        dataSource = component.getDataSource();

      grid.$grid.data('rpRelDataClear', true);
      dataSource.reload();
    }
  };

  RpRel.prototype.getItemsButtonSave = function () {
    return [
      {
        id: 'saveas',
        name: 'Salvar como',
        icon: 'save',
        disabled: true,
      },
      {
        id: 'redo',
        name: 'Restaurar',
        icon: 'redo',
        disabled: !this.data.rprel.redid,
      },
    ];
  };

  RpRel.prototype.getItemsButtonHelp = function (component) {
    var iconFerramenta = '',
      nameColumns = '',
      visibleLink = true;

    if (component.option().type == 'dxDataGrid') {
      iconFerramenta = 'fa fa-table';
      nameColumns = 'Descrição das colunas';
      visibleLink = true;
    } else if (component.option().type == 'dxPivotGrid') {
      iconFerramenta = 'formula';
      nameColumns = 'Descrição dos campos';
      visibleLink = false;
    }

    var onClick = function (e) {
      this.rprel.help(this.component, e.itemData.type, e.itemData.text);
    }.bind({
      rprel: this,
      component: component,
    });

    var buttons = [];

    buttons.push({
      text: 'Help',
      type: 'comps',
      icon: iconFerramenta,
      beginGroup: true,
      onItemClick: onClick,
    });

    buttons.push({
      text: nameColumns,
      type: 'columns',
      icon: 'columnchooser',
      onItemClick: onClick,
    });

    buttons.push({
      text: 'Links das Colunas',
      type: 'links',
      icon: 'link',
      visible: visibleLink,
      onItemClick: onClick,
    });

    if (this.data.rprel.help.report.edit) {
      buttons.push({
        text: 'Editar Help',
        type: '',
        icon: 'edit',
        onItemClick: function () {
          var data = this.data.rprel.help.comps.grid[component.option().key];
          this.createPopupDesc(data.text, this.saveRpheaderDesc, data.params);
        }.bind(this, component),
      });
    }

    return buttons;
  };

  RpRel.prototype.repaintItemsButtonSave = function (component) {
    if (!(component.option().toolbar && component.option().toolbar.saveState))
      return;

    var button = component._$element
      .find('.dx-save-state-button')
      .dxDropDownButton('instance');
    button.option('items', this.getItemsButtonSave());
  };

  RpRel.prototype.getItemsContextMenuLink = function (link, data) {
    if (link.target == 'transaction') return [];

    var onClick = function (util, link, data, e) {
      var url = util.replaceParamsURL(link, data);

      var $link = $('<a/>', {
        href: url,
        target: e.itemData.type,
      }).appendTo(this.$el);

      util.onClickLink(
        e,
        $link,
        Object.assign({}, link, { target: e.itemData.type }),
        data,
        this.options,
        this
      );
    }.bind(this, util, link, data);

    return [
      {
        text: 'Navegar',
        type: '_self',
        icon: 'fa fa-long-arrow-up',
        onItemClick: onClick,
      },
      {
        text: 'Abrir em uma janela',
        type: 'popup',
        icon: 'fa fa-window-maximize',
        onItemClick: onClick,
      },
      {
        text: 'Abrir em uma nova aba',
        type: '_blank',
        icon: 'fa fa-long-arrow-up rprel-rotate-45deg',
        onItemClick: onClick,
      },
    ];
  };

  RpRel.prototype.help = function (component, item, name) {
    var createDataGrid = function (option) {
      return $('<div/>').dxDataGrid({
        dataSource: option.data,
        columns: option.columns,
        showBorders: true,
        rowAlternationEnabled: true,
        columnAutoWidth: true,
        allowColumnResizing: true,
        allowColumnReordering: true,
        columnResizingMode: 'widget',
        paging: {
          pageSize: 1000,
        },
        onCellPrepared: function (e) {
          if (e.rowType == 'data' && e.column.dataField == 'column') {
            if (this.data.rprel.help.report.edit)
              e.cellElement
                .addClass('link')
                .attr('title', 'Clique para editar a descrição');
          }
        }.bind(this),
        onCellClick: function (e) {
          if (e.rowType == 'data' && this.data.rprel.help.report.edit) {
            var field = e.column && e.column.dataField, // NOME DO CAMPO CLICADO
              value = e.value, // VALOR DO CAMPO CLICADO
              row = e.data, // JSON DA LINHA CLICADA
              $element = $(e.cellElement); // ELEMENTO JQUERY

            if (field == 'column') {
              this.createPopupDesc(
                row.description,
                util.saveColumnDesc.bind({
                  RpRel: this,
                  component: component,
                  dataGrid: e.component,
                  type: item,
                }),
                row
              );
            }
          }
        }.bind(this),
      });
    }.bind(this);

    var help = this.data.rprel.help[item];

    $.dialog({
      title: name,
      classes: 'modal-lg',
      data: {
        maximize: true,
      },
      styles: {
        body: {
          minHeight: '200px',
        },
        footer: {
          display: 'none',
        },
      },
      contentTemplate: function (help, contentElement) {
        if (help.type == 'text') {
          if (help.grid)
            contentElement.html(help.grid[component.option().key].text);
          else contentElement.html(help.text);
        } else
          contentElement.append(
            createDataGrid(help.grid[component.option().key])
          );
      }.bind(this, help),
    });
  };

  RpRel.prototype.createPopupDesc = function (descricao, func, params) {
    $.dialog({
      title: 'Editar Descrição',
      classes: 'modal-lg',
      data: {
        maximize: true,
      },
      buttons: [
        {
          text: 'Salvar',
          loadingText: 'Aguarde...',
          classes: 'btn-primary',
          close: false,
          fn: function (event, $btn, dialog) {
            $btn.button('loading');

            var value = dialog.htmlEditor.option('value');

            // Links podem conter somente textos comuns
            if (this.params.type == 'link') value = $(value).text();

            this.func.apply(this.rpRel, [this.params, value]).then(
              function ($btn) {
                //this.refreshRprelDet();
                $btn.button('reset');
              }.bind(this.rpRel, $btn)
            );
          }.bind({
            rpRel: this,
            func: func,
            params: params,
          }),
        },
        {
          text: 'Cancelar',
        },
      ],
      contentTemplate: function (contentElement, dialog) {
        dialog.htmlEditor = this.createHtmlEditor(contentElement, descricao);
      }.bind(this),
    });
  };

  RpRel.prototype.editRprelDesc = function () {
    var idrprel = this.data.rprel.id;
    var descricao = this.data.rprel.help.report.desc;
    this.createPopupDesc(descricao, this.saveRprelDesc, { idrprel: idrprel });
  };

  RpRel.prototype.saveRprelDesc = function (params, descricao) {
    var def = $.Deferred();

    TNTAjax.manter({
      data: {
        codfrpst: 'ORIONRPRELTXTCTRPROGRNOT',
        idrprel: params.idrprel,
        txtctrprogrnot: descricao.encodeHtml(),
      },
      onSuccess: function (response) {
        if (response && response.codigo == 0) {
          def.resolve();
        } else {
          def.reject();
        }
      },
      onError: function (error) {
        console.error(error);
        def.reject();
      },
    });

    return def;
  };

  RpRel.prototype.saveRpheaderDesc = function (params, descricao) {
    var def = $.Deferred();

    TNTAjax.manter({
      data: {
        codfrpst: 'ORIONRPRELTXTRPHEADERNOT',
        idrprel: params.idrprel,
        numrpheader: params.numrpheader,
        descricao: (descricao || '').encodeHtml(),
      },
      onSuccess: function (response) {
        if (response.codigo == 0) {
          def.resolve();
        } else {
          def.reject();
        }
      },
      onError: function (error) {
        console.error(error);
        def.reject();
      },
    });

    return def;
  };

  RpRel.prototype.instance = function () {
    return this;
  };

  RpRel.prototype.trigger = function (name) {
    var args = Array.prototype.slice.call(arguments, 1);

    name += '.bs.rprel';
    this.options[RpRel.EVENTS[name]].apply(this.options, args);
    this.$el.trigger($.Event(name), args);
  };

  RpRel.prototype.prepareForm = function (form) {
    var promise = $.Deferred();

    if (!form) return promise.resolve({});

    var id = this.key + '_form' + form.id,
      context = '/' + window.location.pathname.split('/')[1];

    var $modal = $('#' + id);

    if ($modal.length > 0) {
      $modal.data('promise', promise).modal('show');
    } else {
      $modal = this.createModal()
        .appendTo(this.$el)
        .attr('id', id)
        .data('promise', promise);

      $modal.on('hidden.bs.modal', function () {
        $(this).data('promise').reject();
        $(this).find('form').reset();
      });

      $modal.find('.modal-title').html(form.title);

      $modal.find('.modal-body').load(
        context + '/a/forms/form' + form.id + '.jsp',
        function ($modal, response, status, xhr) {
          if (status == 'success') {
            $modal.modal('show');
          }
        }.bind(this, $modal)
      );

      var $btnSubmit = $('<button/>', {
        type: 'button',
        class: 'btn btn-primary',
      })
        .text('Confirmar')
        .on(
          'click',
          function (form, e) {
            if (this.find('form').formValid()) {
              this.data('promise').resolve(
                Object.assign(this.find('form').serializeJSON(), {
                  idprograuditing: form.id,
                })
              );
              this.modal('hide');
            }
          }.bind($modal, form)
        );

      var $btnCancel = $('<button/>', {
        type: 'button',
        class: 'btn btn-default',
        'data-dismiss': 'modal',
      }).text('Cancelar');

      $modal.find('.modal-footer').append($btnSubmit).append($btnCancel);
    }

    this.logAccessForm(form.id);

    return promise;
  };

  RpRel.prototype.createModal = function () {
    var $modal = $('<div/>', {
      class: 'modal fade',
      'data-maximize': 'false',
      'data-backdrop': 'false',
      tabindex: '-1',
      role: 'dialog',
    });

    var $dialog = $('<div/>', {
      class: 'modal-dialog',
      role: 'document',
    }).appendTo($modal);

    var $content = $('<div/>', {
      class: 'modal-content',
    }).appendTo($dialog);

    $('<div>', {
      class: 'modal-header',
    })
      .appendTo($content)
      .append(
        $('<button/>', {
          type: 'button',
          class: 'close',
          'data-dismiss': 'modal',
          'aria-label': 'Close',
        }).append("<span aria-hidden='true'>&times;</span>")
      )
      .append($('<h4/>', { class: 'modal-title' }));

    $('<div/>', {
      class: 'modal-body',
    }).appendTo($content);

    $('<div/>', {
      class: 'modal-footer',
    }).appendTo($content);

    return $modal;
  };

  RpRel.prototype.showFilter = function () {
    var options = this.data.rprel.filterData;

    var id = this.key + '_form' + options.filter.id,
      context = '/' + window.location.pathname.split('/')[1];

    var $modal = $('#' + id);

    if ($modal.length > 0) {
      $modal.modal('show');
    } else {
      $modal = this.createModal().attr('id', id).appendTo(this.$el);

      $modal.find('.modal-title').html('Filtrar Dados');

      $modal.find('.modal-body').load(
        context + '/a/forms/form' + options.filter.id + '.jsp',
        function ($modal, options, response, status, xhr) {
          if (status == 'success') {
            if (!$.isEmptyObject(options.filter.defaultData)) {
              $modal.find('form').formLoad(options.filter.defaultData);
            }
            $modal.modal('show');
          }
        }.bind(this, $modal, options)
      );

      var $btnFilter = $('<button/>', {
        type: 'button',
        class: 'btn btn-primary',
      })
        .text('Aplicar Filtro')
        .on(
          'click',
          function ($modal, e) {
            if ($modal.find('form').formValid()) {
              this.$buttonFilter
                .removeClass('btn-default')
                .addClass('btn-primary');

              $modal.modal('hide');

              var data = $modal.find('form').serializeJSON();

              this.refresh({
                filters: Object.assign(data, { filtered: 'S' }),
                filterDataApplied: true,
              });
            }
          }.bind(this, $modal)
        );

      var $btnCancel = $('<button/>', {
        type: 'button',
        class: 'btn btn-default',
        'data-dismiss': 'modal',
      }).text('Cancelar');

      $modal.find('.modal-footer').append($btnFilter).append($btnCancel);
    }
  };

  RpRel.prototype.refreshRprelDet = function () {
    var def = $.Deferred();

    TNTAjax.obter({
      data: {
        codfrpst: 'ORIONRPRELDET',
        id: this.data.rprel.id,
        redid: this.data.rprel.redid,
        iddt: this.data.rprel.iddt,
      },
      onSuccess: function (data) {
        $.extend(true, this.data.rprel, data);
        def.resolve();
      }.bind(this),
    });

    return def;
  };

  var util = {
    getFRPSTParams: function (params) {
      var ret = '';
      for (var key in params) {
        ret += '&' + key + '=' + ($.String(params[key]) || '');
      }
      return ret;
    },
    randomString: function () {
      return 'r' + Math.random().toString(36).substring(7);
    },
    createElem: function (tag) {
      return $('<' + tag + '></' + tag + '>');
    },
    addClassDocument: function (css) {
      var style = util.createElem('style').appendTo('head');
      style.attr('type', 'text/css');
      style.html(css);
      return style;
    },
    alwaysString: function (value) {
      // SEMPRE RETORNA STRING
      if (value == null || typeof value == 'undefined') return '';
      else if (value && typeof value.toString == 'function')
        return value.toString();
      else return value + '';
    },
    ifNumber: function (value) {
      // RETORNA NUMÉRICO SE POSSÍVEL
      if ($.isNumeric(value)) return parseFloat(value);
      else return value;
    },
    addWidget: function (rprel, e) {
      var isControl =
        e.element.parents('.dx-control-components-tnt').length > 0;
      var key = e.component.option().key,
        type = e.element.data('dxComponents')[0],
        component = rprel._components[key];

      if (typeof component != 'undefined') {
        var widgets = component.widgets;

        if (isControl)
          for (var i in widgets) {
            Object.assign(widgets[i], { active: false });
          }

        widgets.push({
          $element: e.element,
          type: type,
          control: isControl,
        });

        Object.assign(rprel._components[key], {
          widgets: widgets,
        });

        util.controlWidgets(e.element, rprel, key, type);
      }
    },
    controlWidgets: function ($element, rprel, key, type) {
      var isControl = $element.parents('.dx-control-components-tnt').length > 0,
        component = rprel._components[key],
        widgets = component.widgets;

      if (isControl)
        for (var i in widgets) {
          var widget = widgets[i];
          Object.assign(widget, { active: widget.type == type });
        }
    },
    popup: function (options) {
      return Object.assign(
        {
          title: 'Popup',
          showTitle: true,
          width: window.innerWidth * 0.9,
          height: window.innerHeight * 0.8,
          minHeight: 600,
          visible: true,
          dragEnabled: true,
          resizeEnabled: true,
          closeOnOutsideClick: false,
          shading: false,
          showCloseButton: true,
          onHidden: function (e) {
            e.component.dispose();
            e.element.remove();
          },
        },
        typeof options == 'object' && options
      );
    },
    saveColumnDesc: function (params, descricao) {
      var defManter = $.Deferred();

      TNTAjax.manter({
        data: Object.assign(params, {
          codfrpst:
            params.type == 'column'
              ? 'ORIONRPRELHINTRPCOLUMNDETAIL'
              : 'ORIONRPRELNOTRPCOLUMNLINK',
          descricao:
            params.type == 'link'
              ? descricao.substring(0, 60)
              : descricao.encodeHtml(),
        }),
        onSuccess: function (response) {
          if (response.codigo == 0) {
            defManter.resolve();
          } else {
            defManter.reject();
          }
        },
        onError: function (error) {
          defManter.reject();
          console.error(error);
        },
      });

      return defManter.then(
        function () {
          this.RpRel.refreshRprelDet().then(
            function () {
              var jsonComp = this.type;
              var key = this.component.option().key;
              var data = this.RpRel.data.rprel.help[jsonComp].grid[key].data;

              this.dataGrid.option('dataSource', data);
            }.bind(this)
          );
        }.bind(this)
      );
    },
    getURL: function (elem, link, data, options, rprel) {
      if (['popup', 'transaction'].indexOf(link.target) > -1) {
        return "javascript:void('" + link.target + "')";
      } else {
        return util.replaceParamsURL(link, data);
      }
    },
    replaceParamsURL: function (link, data) {
      var url = link.url,
        params = link.params || '';

      // SE É JAVASCRIPT, NÃO FAZ NADA
      if (url.indexOf('javascript') == 0) {
      }
      // SE É UM LINK EXTERNO, NÃO FAZ NADA
      else if (url.indexOf('http') == 0) {
      }
      // ADICIONA A BARRA NO INÍCIO DA URL, CASO NÃO TENHA
      else if (url.indexOf('/') > 0) {
        url = '/' + url;
      }

      // SUBSTITUI OS PARÂMETROS
      for (var field in data) {
        if (params.indexOf('?@') > -1) {
          params = params.replace(
            new RegExp('\\?@' + field + '\\b', 'g'),
            data[field]
          );
        } else break;
      }

      // SUBSTITUI OS PARÂMETROS DA URL
      for (var field in data) {
        if (url.indexOf('?@') > -1) {
          url = url.replace(
            new RegExp('\\?@' + field + '\\b', 'g'),
            data[field]
          );
        } else break;
      }

      var URL = url;
      if (params.length > 0) {
        // PARÂMETROS PARA SERVLET
        if (params.indexOf('&') > -1 || params.indexOf('=') > -1) {
          if (URL.indexOf('?') == URL.length - 1)
            // SE O ÚLTIMO CARACTERE É "?" ENTÃO REMOVE
            URL = URL.substring(0, URL.length - 1);

          if (params.indexOf('?') == 0)
            // REMOVE A "?" CASO EXISTA
            params = params.substring(1, params.length);

          if (URL.indexOf('?') > -1) {
            if (params.indexOf('&') > 0)
              // SE O PRIMEIRO CARACTERE NÃO É "&" ENTÃO ADICIONA
              params = '&' + params;
          } else {
            URL += '?';

            if (params.indexOf('&') == 0)
              // SE O PRIMEIRO CARACTERE É "&" ENTÃO REMOVE
              params = params.substring(1, params.length);
          }

          URL += params;

          if (link.idrprel) {
            // O LINK É PARA UM TNT-REPORTS

            var URLpath = URL.substring(0, URL.indexOf('?')),
              URLpars = URL.substring(URL.indexOf('?') + 1);

            URL = URLpath + '?q=' + escape(btoa(URLpars));
          }
        }

        // PARÂMETROS PARA SPA
        else {
          var separator = '/!/'; // SEPARADOR DOS PARÂMETROS

          if (URL.indexOf('/!/') > -1)
            // JÁ TEM PARÂMETRO NA URL
            separator = '/';

          if (URL.substr(URL.length - 1) == '/')
            // REMOVE A BARRA DO FINAL DA URL
            URL = URL.substr(0, URL.length - 1);

          if (params.indexOf('/') == 0)
            params = params.substr(1, params.length); // REMOVE A BARRA DO INÍCIO DOS PARÂMETROS

          URL += separator + params;
        }
      }

      return URL;
    },
    attachClickLink: function (elem, link, data, options, rprel) {
      elem.click(
        function (elem, link, data, options, rprel, event) {
          if (elem.data('clicked')) {
            elem.removeData('clicked');
          } else {
            event.preventDefault && event.preventDefault();
            this.onClickLink(event, elem, link, data, options, rprel);
          }
        }.bind(util, elem, link, data, options, rprel)
      );
    },
    onClickLink: function (event, elem, link, data, options, rprel) {
      root.rpTransactions
        .apply(elem.get(0), [link.before, link, data, options, rprel])
        .then(
          function () {
            var promise;
            if (this.link.target == 'popup') {
              promise = root.rpPopup.apply(this.elem.get(0), [
                this.link,
                this.data,
                this.options,
                this.rprel,
              ]);
            } else if (this.link.target == 'transaction') {
              promise = $.Deferred();
              rprel.prepareForm(link.form).then(
                function (promise, fields) {
                  root.rpTransaction
                    .apply(this.elem.get(0), [
                      this.link.idresource,
                      Object.assign(this.data, fields),
                      this.options,
                      this.rprel,
                    ])
                    .then(
                      function (success, data) {
                        this.resolve(success, data);
                      }.bind(promise)
                    );
                }.bind(this, promise)
              );
            } else {
              this.elem.data('clicked', true);
              this.elem.data('clickedCell', true); // PARA CONTROLE DOS COMPONENTES (onCellClick)
              this.elem.get(0).click();
              promise = $.Deferred().resolve();
            }

            promise.then(
              function () {
                root.rpTransactions.apply(this.elem.get(0), [
                  this.link.after,
                  this.link,
                  this.data,
                  this.options,
                  this.rprel,
                ]);
              }.bind(this)
            );
          }.bind({
            elem: elem,
            link: link,
            data: data,
            options: options,
            rprel: rprel,
          })
        );
    },
    heightWindow: function () {
      var $el = $(this);
      var component = $el[$el.data('dxComponents')[0]]('instance');
      var elTop = $el.positionTo(window).top, // POSIÇÃO DO ELEMENTO NA TELA
        winHeight = window.innerHeight, // ALTURA DA TELA
        gridHeight = winHeight - elTop; // ALTURA QUE A TABELA FICARÁ

      if (gridHeight > 0) return gridHeight;
      else {
        Object.assign(component.option(), {
          heightGrid: 'auto',
        });
        return 'auto';
      }
    },
    heightAuto: function () {
      return 'auto';
    },
    replace: function (string, search, value) {
      string = string.replace(new RegExp(search, 'g'), function () {
        return value || '';
      });
      return string;
    },
    getDateFormatted: function () {
      var timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return new Date().toLocaleString('pt-BR', {
        timeZone: timeZone,
        dateStyle: 'short',
        timeStyle: 'short',
      });
    },
  };

  RpRel.util = util;

  var cleanCssClassDocument = function (component) {
    if (component && component.cssClassGrid) {
      component.cssClassGrid.forEach(function (cssClass) {
        cssClass.style.remove();
      });
      component.cssClassGrid = [];
    }
  };

  root.rpPopup = function (link, data, options) {
    var def = $.Deferred();

    if (link && link.type == 'applet') {
      var url = util.replaceParamsURL(link, data);

      var stringify = function (object) {
        var str = '';
        for (var name in object) str += name + '=' + object[name] + ',';
        return str.substr(0, str.length - 1);
      };

      var size = {
        width: (link.width || 800) + 20,
        height: (link.height || 600) + 20,
      };

      var position = {
        top: Math.round((window.innerHeight - size.height) / 2),
        left: Math.round((window.innerWidth - size.width) / 2),
      };

      var options = {
        top: position.top,
        left: position.left,
        width: size.width,
        height: size.height,
      };

      var popup = root.open(url, '', stringify(options));

      var $backdrop = $('<div/>')
        .css({
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          background: 'rgba(0,0,0,.5)',
          zIndex: 9999,
        })
        .appendTo('BODY')
        .on(
          'click',
          function (e) {
            this.focus();
          }.bind(popup)
        );

      root.popupClosed = function () {
        $backdrop.remove();
      };
    } else {
      $.dialog({
        title: link.title,
        classes: 'modal-lg',
        data: {
          maximize: true,
        },
        autoLoading: true,
        styles: {
          body: {
            paddingBottom: '50px',
          },
          footer: {
            display: 'none',
          },
        },
        onShown: function (e) {
          try {
            e.$body.find('form[name=formRpRelPopup]').get(0).submit();
            e.$body
              .find('iframe[name=iframeRpRelPopup]')
              .get(0).contentDocument.body.style.margin = '0';
          } catch (error) {
            console.warn(error);
          }
        },
        contentTemplate: function (contentElement) {
          var completed = (function (dialog) {
            return function () {
              dialog.$modal.modal('hideLoading');
            };
          })(this);

          if (link && link.type == 'rprel') {
            $('<div/>')
              .appendTo(contentElement)
              .rprel(
                Object.assign({}, options, {
                  id: link.idresource,
                  params: Object.assign(data, {
                    idctrprogr: link.idresource,
                    idresource: link.idresource,
                  }),
                  onSuccess: function (response) {
                    def.resolve();
                    completed();
                  }.bind(this),
                  onError: function (error) {
                    def.resolve();
                    completed();
                    $.notify(
                      'Ocorreu um erro ao carregar os dados.' +
                        (typeof error == 'string' ? '<br/>' + error : ''),
                      'warn'
                    );
                  },
                })
              );
          } else {
            contentElement.css({
              padding: '0',
            });

            var $iframe = $('<iframe/>', {
              name: 'iframeRpRelPopup',
              class: 'iframe',
            }).appendTo(contentElement);

            var url = util.replaceParamsURL(link, data);

            url += (url.indexOf('?') > -1 ? '&' : '?') + 'menubar=hide&popup=S';

            var $form = $('<form/>', {
              target: 'iframeRpRelPopup',
              name: 'formRpRelPopup',
              action: url,
              method: 'POST',
            }).appendTo(contentElement);
          }
        },
      });
    }

    return def;
  };

  /**
   * TRANSAÇÃO A SER EXECUTADA NO LINK
   */
  root.rpTransaction = function (transaction, data, options, rprel) {
    var def = $.Deferred();
    TNTAjax.manter({
      //silent: true,
      data: {
        codfrpst: 'ORIONRPRELTRANSACTION',
        id: rprel.data.rprel.id,
        iddt: rprel.data.rprel.iddt,
        transaction: transaction,
        params: util.getFRPSTParams(data),
        idctrusr: options.params.idctrusr,
      },
      onSuccess: function (response) {
        def.resolve(true, response);
      },
      onError: function () {
        def.resolve(false);
      },
    });

    return def;
  };

  /**
   * TRANSAÇÕES A SEREM EXECUTADAS ANTES OU APÓS O LINK
   */
  root.rpTransactions = function (trns, link, data, options, rprel) {
    var def = $.Deferred(),
      defs = [];
    for (var i in trns) defs.push($.Deferred());

    trns.forEach(function (current, index) {
      root.rpTransaction(current.transaction, data, options, rprel).then(
        function () {
          defs[this].resolve();
        }.bind(index)
      );
    });

    $.when.apply($, defs).then(function () {
      def.resolve();
    });

    return def;
  };

  (function () {
    try {
      // ALTERADO PARA O dxContextMenu do dxDataGrid FUNCIONAR
      // QUANDO ESTIVER EM UM MODAL (ESTAVA FICANDO ATRÁS)
      DevExpress.ui.dxOverlay.baseZIndex(2500);
    } catch (err) {
      console.warn(err);
    }
  })();
});
