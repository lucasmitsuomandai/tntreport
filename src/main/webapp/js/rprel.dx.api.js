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

  function fetch(url, options) {
    var uri = '/' + window.location.pathname.split('/')[1] + '/rest/a/report';
    return $.ajax(
      Object.assign(
        {
          url: uri + url,
          method: 'GET',
          error: function (response) {
            var status = response && response.status;
            if (status == 401) {
              $.notify('Sessão expirou', 'warn');
              setTimeout(function () {
                window.location.reload();
              }, 3000);
            } else {
              if (typeof options.error == 'function')
                options.error.apply(options.error, [response]);
            }
          },
          beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Basic ' + Session().token());
          },
        },
        options
      )
    );
  }

  RpRel.prototype.load = function () {
    var deferred = $.Deferred();
    try {
      var params = {};
      Object.assign(params, this.options.params);

      if (this.data && this.data.rprel && this.data.rprel.iddt) {
        Object.assign(params, {
          rpdt: this.data.rprel.iddt,
        });
      }

      if (
        !$.isEmptyObject(this.options.grids) &&
        this.options.grids instanceof Array
      ) {
        Object.assign(params, {
          rpgrids: this.options.grids.join(','),
        });
      }

      fetch('/data/' + this.options.type + '/' + this.options.id, {
        data: {
          params: util.getFRPSTParams(params),
        },
        success: function (response) {
          this.data = response;
          deferred.resolve();
        }.bind(this),
        error: function () {
          console.error(arguments);
          deferred.reject();
        },
      });
    } catch (e) {
      console.error(e);
      deferred.reject();
    }
    return deferred.promise();
  };

  RpRel.prototype.loadForm = function () {
    var deferred = $.Deferred();
    try {
      fetch('/form/data/' + this.data.rprel.id, {
        data: Object.assign(
          {
            iddt: this.data.rprel.iddt,
          },
          this.options.params,
          this.options.filters
        ),
        success: function (response) {
          deferred.resolve(response);
        },
        error: function () {
          console.error(arguments);
          deferred.reject();
        },
      });
    } catch (e) {
      console.error(e);
      deferred.reject();
    }
    return deferred.promise();
  };

  RpRel.prototype.loadData = function (numrpheader, iddt, params) {
    var deferred = $.Deferred();
    try {
      fetch('/comp/data/' + this.data.rprel.id + '/' + numrpheader, {
        data: Object.assign(
          {
            iddt: iddt,
          },
          params,
          this.options.filters
        ),
        success: function (response) {
          deferred.resolve(response, {
            totalCount: response.length,
            summary: undefined,
            groupCount: undefined,
          });
        },
        error: function () {
          deferred.reject('Erro no carregamento dos dados');
        },
      });
    } catch (e) {
      console.error(e);
      deferred.reject();
    }
    return deferred.promise();
  };

  RpRel.prototype.logAccessForm = function (idctrprogr) {
    fetch('/log/form/' + idctrprogr, {
      method: 'POST',
      error: function () {
        console.error(arguments);
      },
    });
  };

  RpRel.prototype.saveParams = function (data) {
    var deferred = $.Deferred();
    fetch(
      '/params/' +
        (this.data.rprel.redid || this.data.rprel.id) +
        '/' +
        this.data.rprel.iddt,
      {
        data: data,
        method: 'POST',
        success: function () {
          deferred.resolve();
        },
        error: function () {
          console.error(arguments);
          deferred.reject();
        },
      }
    );
    return deferred.promise();
  };
});
