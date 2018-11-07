'use strict';

var _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];for (var key in source) {
            if (Object.prototype.hasOwnProperty.call(source, key)) {
                target[key] = source[key];
            }
        }
    }return target;
};

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
    } else {
        obj[key] = value;
    }return obj;
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var CkRepoWidgetConstants = {
    kTitleKey: '##data_uid',
    kNumberKey: '__number',
    kFilterAllValue: 'All',
    kMetaFilterPrefix: '##meta#',
    kRowHiddenKey: '__hidden',
    kDefaultPointRadius: 3.5
};

var CkRepoWidgetUtils = {
    showMessageBox: function showMessageBox(text) {
        let new_window = d3.select('body').append('div')
            .attr('class', 'ck-repo-widget-dialog-wnd')
            .style('z-index', '2');

        let background = d3.select('body').append('div');

        let codeArea = new_window.append('div').append('textarea')
            .attr('readonly', 'readonly')
            .attr('class', 'ck-repo-widget-dialog-code')
            .html(text);

        // Ok button
        new_window.append('input')
            .attr('type', 'button')
            .attr('value', 'OK')
            .attr('class', 'ck-repo-widget-dialog-btn')
            .on('click', function() {
                new_window.remove();
                background.remove();
            });

        // Copy button
        new_window.append('input')
            .attr('type', 'button')
            .attr('value', 'Copy')
            .attr('class', 'ck-repo-widget-dialog-btn')
            .on('click', function() {
                codeArea.node().select();
                document.execCommand('copy');
            });

        // Black background
        background
            .attr('style', 'height:100%;width:100%;position:absolute;top:0;left:0;display:block;background-color:#000;opacity:0.5;')
            .style('z-index', '1');
    },

    getAxisKey: function getAxisKey(dimension) {
        return dimension.from_meta ? dimension.key : dimension.view_key || (dimension.reverse ? dimension.key + '#max' : dimension.key + '#min');
    },

    getVariationMinKey: function getVariationMinKey(dimension) {
        return dimension.key + '#min';
    },

    getVariationMaxKey: function getVariationMaxKey(dimension) {
        return dimension.key + '#max';
    },

    scrollToElement: function scrollToElement(element) {
        scrollTo(0, element.getBoundingClientRect().top - d3.select('.navbar').node().getBoundingClientRect().bottom);
    },

    getRowId: function getRowId(row) {
        return 'ck-repo-widget-row-' + row[CkRepoWidgetConstants.kNumberKey];
    },

    prepareFilters: function prepareFilters(selectors, data) {
        var filterPrefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

        selectors.forEach(function (selector) {
            var values = [];

            data.forEach(function (row) {
                var value = row['' + filterPrefix + selector.key];

                if (!!value && values.indexOf(value) === -1) {
                    values.push(value);
                }
            });

            values.sort();

            values.unshift(CkRepoWidgetConstants.kFilterAllValue);

            selector['values'] = values;
        });
    },

    prepareTableView: function prepareTableView(tableView) {
        tableView.unshift({
            'key': CkRepoWidgetConstants.kNumberKey,
            'name': '#'
        });
    },

    prepareTable: function prepareTable(table) {
        table.forEach(function (row, index) {
            row[CkRepoWidgetConstants.kNumberKey] = index + 1;
        });

        // TODO 'species' view rows
    },

    formatNumber: function formatNumber(x, format) {
        if (Array.isArray(x)) {
            return x.map(function (xi) {
                return CkRepoWidgetUtils.formatNumber(xi, format);
            });
        }

        var xNum = Number(x);

        if (format.endsWith('e')) {
            return xNum.toExponential(format[2]);
        } else if (format.endsWith('f')) {
            return xNum.toFixed(format[2]);
        }

        return xNum;
    },

    encode: function encode(str) {
        return str.replace(/[\s\S]/g, function (escape) {
            return "\\u" + ('0000' + escape.charCodeAt().toString(16)).slice(-4);
        });
    },

    quantum: {
        mean: function mean(data) {
            var sum = data.reduce(function (sum, value) {
                return sum + value;
            }, 0);

            return sum / data.length;
        },

        std: function std(values) {
            var avg = CkRepoWidgetUtils.quantum.mean(values);

            var squareDiffs = values.map(function (value) {
                var diff = value - avg;
                var sqrDiff = diff * diff;
                return sqrDiff;
            });

            var avgSquareDiff = CkRepoWidgetUtils.quantum.mean(squareDiffs);

            return Math.sqrt(avgSquareDiff);
        },

        total_time: function total_time(ts, n_succ, n_tot, p) {
            function ttot(t, s, p) {
                var R = Math.ceil(Math.log(1 - p) / Math.log(1 - s));

                return t * R;
            }

            if (n_succ == 0) {
                return {
                    T_ave: NaN,
                    T_err: NaN,
                    t_ave: NaN,
                    t_err: NaN,
                    s: 0,
                    s_err: 0
                };
            }

            var t_ave = CkRepoWidgetUtils.quantum.mean(ts);
            var t_err = CkRepoWidgetUtils.quantum.std(ts) / Math.pow(ts.length, 0.5);

            if (n_succ == n_tot) {
                return {
                    T_ave: t_ave,
                    T_err: t_err,
                    t_ave: t_ave,
                    t_err: t_err,
                    s: 1,
                    s_err: 0
                };
            }

            var s = n_succ / n_tot;
            var s_err = Math.pow(s * (1 - s) / n_tot, 0.5);
            var T_ave = ttot(t_ave, s, p);
            var T_serr = ttot(t_ave, s + s_err, p);
            var T_serr2 = ttot(t_ave, s - s_err, p);
            var T_err = Math.pow(Math.pow((T_serr2 - T_serr) / 2., 2) + Math.pow(t_err * T_ave / t_ave, 2), 0.5);

            return {
                T_ave: T_ave, T_err: T_err, t_ave: t_ave, t_err: t_err, s: s, s_err: s_err
            };
        },

        benchmark_list_of_runs: function benchmark_list_of_runs(list_of_runs, delta, prob, which_fun_key, which_time_key) {
            var num_repetitions = list_of_runs.length;

            if (!!num_repetitions) {
                var first_run_input = list_of_runs[0]['vqe_input'];
                var classical_energy = first_run_input['classical_energy'];
                var minimizer_src = first_run_input['minimizer_src'];
                var minimizer_method = first_run_input['minimizer_method'];

                var n_succ = 0;
                var list_selected_times = [];
                var list_selected_fun = [];

                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = list_of_runs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var run = _step.value;

                        var vqe_output = run['vqe_output'];
                        var report = run['report'];

                        //let fun = vqe_output['fun'];
                        //let fun_validated = vqe_output['fun_validated'];
                        //let fun_exact = vqe_output['fun_exact'];
                        var fun_selected = vqe_output[which_fun_key];

                        //let q_seconds = report['total_q_seconds'];
                        //let q_shots = report['total_q_shots'];
                        var time_selected = report[which_time_key];

                        if (Math.abs(fun_selected - classical_energy) < delta) {
                            n_succ += 1;
                        }

                        list_selected_times.push(time_selected);
                        list_selected_fun.push(fun_selected);
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }

                var _CkRepoWidgetUtils$qu = CkRepoWidgetUtils.quantum.total_time(list_selected_times, n_succ, num_repetitions, prob),
                    T_ave = _CkRepoWidgetUtils$qu.T_ave,
                    T_err = _CkRepoWidgetUtils$qu.T_err,
                    t_ave = _CkRepoWidgetUtils$qu.t_ave,
                    t_err = _CkRepoWidgetUtils$qu.t_err,
                    s = _CkRepoWidgetUtils$qu.s,
                    s_err = _CkRepoWidgetUtils$qu.s_err;

                return {
                    classical_energy: classical_energy,
                    minimizer_method: minimizer_method,
                    minimizer_src: minimizer_src,
                    n_succ: n_succ,
                    T_ave: T_ave,
                    T_err: T_err,
                    t_ave: t_ave,
                    t_err: t_err,
                    s: s,
                    s_err: s_err,
                    energies: list_selected_fun,
                    times: list_selected_times
                };
            }
        },

        get_classical_energy: function get_classical_energy(data) {
            return data[0]["runs"][0]["vqe_input"]["classical_energy"];
        }
    },

    getColorDomain: function getColorDomain(length, bounds) {
        var min = bounds[0];
        var max = bounds[1];

        var domain = [];

        domain.push(min);

        if (length > 2) {
            var distance = max - min;
            var step = distance / (length - 1);

            for (var i = 1; i < length - 1; ++i) {
                domain.push(min + i * step);
            }
        }

        domain.push(max);

        return domain;
    },

    isNaN: function isNaN(input) {
        if (input === 'NaN' || Number.isNaN(input)) {
            return true;
        }
        return false;
    },

    isNumberAndFinite: function isNumberAndFinite(input) {
        if (CkRepoWidgetUtils.isNaN(input)) {
            return false;
        }
        if (!isNaN(Number(input))) {
            return true;
        }
    }
};

var CkRepoWidgetFilter = function () {
    function CkRepoWidgetFilter() {
        _classCallCheck(this, CkRepoWidgetFilter);

        this.filters = [];
    }

    _createClass(CkRepoWidgetFilter, [{
        key: 'setSelector',
        value: function setSelector(selector, value) {
            var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            var isSame = function isSame(filter) {
                return filter.key === selector.key && filter.prefix === prefix;
            };

            if (value === CkRepoWidgetConstants.kFilterAllValue) {
                this.filters = this.filters.filter(function (filter) {
                    return !isSame(filter);
                });
            } else {
                var filter = this.filters.find(function (filter) {
                    return isSame(filter);
                });

                if (filter) {
                    filter.value = value;
                } else {
                    this.filters.push({
                        key: selector.key,
                        prefix: prefix || '',
                        value: value
                    });
                }
            }
        }
    }, {
        key: 'isRowVisible',
        value: function isRowVisible(row) {
            if (row[CkRepoWidgetConstants.kRowHiddenKey]) {
                return false;
            }

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this.filters[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var filter = _step2.value;

                    if (row['' + filter.prefix + filter.key] !== filter.value) {
                        return false;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
                    }
                }
            }

            return true;
        }
    }, {
        key: 'isColumnVisible',
        value: function isColumnVisible(column) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
                for (var _iterator3 = this.filters[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                    var filter = _step3.value;

                    if ('' + filter.prefix + filter.key === column.key) {
                        return false;
                    }
                }
            } catch (err) {
                _didIteratorError3 = true;
                _iteratorError3 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion3 && _iterator3.return) {
                        _iterator3.return();
                    }
                } finally {
                    if (_didIteratorError3) {
                        throw _iteratorError3;
                    }
                }
            }

            return true;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.filters = [];
        }
    }, {
        key: 'getXWWWFormUrlencoded',
        value: function getXWWWFormUrlencoded() {
            var items = [];

            var _iteratorNormalCompletion4 = true;
            var _didIteratorError4 = false;
            var _iteratorError4 = undefined;

            try {
                for (var _iterator4 = this.filters[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                    var filter = _step4.value;

                    items.push(filter.key + '=' + filter.value);
                }
            } catch (err) {
                _didIteratorError4 = true;
                _iteratorError4 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion4 && _iterator4.return) {
                        _iterator4.return();
                    }
                } finally {
                    if (_didIteratorError4) {
                        throw _iteratorError4;
                    }
                }
            }

            return items.join('&');
        }
    }, {
        key: 'getSelectorValue',
        value: function getSelectorValue(selector) {
            var _iteratorNormalCompletion5 = true;
            var _didIteratorError5 = false;
            var _iteratorError5 = undefined;

            try {
                for (var _iterator5 = this.filters[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                    var filter = _step5.value;

                    if (filter.key === selector.key) {
                        return filter.value;
                    }
                }
            } catch (err) {
                _didIteratorError5 = true;
                _iteratorError5 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion5 && _iterator5.return) {
                        _iterator5.return();
                    }
                } finally {
                    if (_didIteratorError5) {
                        throw _iteratorError5;
                    }
                }
            }

            return CkRepoWidgetConstants.kFilterAllValue;
        }
    }]);

    return CkRepoWidgetFilter;
}();

var CkRepoWidgetHasher = function () {
    function CkRepoWidgetHasher() {
        _classCallCheck(this, CkRepoWidgetHasher);

        this.reset();
    }

    _createClass(CkRepoWidgetHasher, [{
        key: 'hash',
        value: function hash(value) {
            if (typeof value === 'string') {
                var hashedValue = this.hashMap[value];

                if (hashedValue === null || hashedValue === undefined) {
                    this.hashMap[value] = this.lashHashKey++;
                }

                return this.hashMap[value];
            }

            return value;
        }
    }, {
        key: 'reset',
        value: function reset() {
            this.lashHashKey = 0;
            this.hashMap = {};
        }
    }]);

    return CkRepoWidgetHasher;
}();

/*
const tableConfig = {
    filter
};
*/

var CkRepoWidgetTable = function () {
    function CkRepoWidgetTable() {
        _classCallCheck(this, CkRepoWidgetTable);
    }

    _createClass(CkRepoWidgetTable, [{
        key: 'init',
        value: function init(tableConfig, dataConfig) {
            this.tableConfig = tableConfig;
            this.dataConfig = dataConfig;

            this.filter = this.tableConfig.filter;
        }
    }, {
        key: 'build',
        value: function build(data) {
            this.data = data;

            this._build();
        }
    }, {
        key: 'setFilter',
        value: function setFilter(filter) {
            this.filter = filter;

            this._updateCellVisibility();
        }
    }, {
        key: '_build',
        value: function _build() {
            this.rows = this.data; //.filter((row) => this.filter.isRowVisible(row));
            this.columns = this.dataConfig.table_view; //.filter((column) => this.filter.isColumnVisible(column));

            this._tabulate(this.rows, this.columns);
            this._updateCellVisibility();
        }
    }, {
        key: '_tabulate',
        value: function _tabulate(rows, columns) {
            var _this = this;

            var container = this.tableConfig.tableContainer;

            container.selectAll('*').remove();
            var table = container.append('table').attr('class', 'ck-repo-widget-table');
            var thead = table.append('thead').attr('class', 'ck-repo-widget-thead');
            var tbody = table.append('tbody').attr('class', 'ck-repo-widget-tbody');

            // append the header row
            let gHeaders = thead.append('tr')
                .selectAll('th').data(columns)
                .enter().append('th')
                    .attr('class', 'ck-repo-widget-th')
                    .html(function (column) {
                        return column.name;
                    });

            // create a row for each object in the data
            let gRows = tbody
                .selectAll('tr').data(rows)
                .enter().append('tr')
                    .attr('class', 'ck-repo-widget-tr')
                    .attr('id', CkRepoWidgetUtils.getRowId);

            let sortRowsBy = function(column, isAscending) {
                gRows.sort(function(a, b) {
                    let sortKey = function(row, column) {
                        let res = _this._getCellValue(row, column);

                        // This is code? sort by title
                        if (!!res.cmd) {
                            res = res.title;
                        }

                        if (CkRepoWidgetUtils.isNumberAndFinite(res)) {
                            res = Number(res);
                        }

                        if (CkRepoWidgetUtils.isNaN(res)) {
                            res = null;
                        }

                        return res;
                    };

                    if (isAscending) {
                        return d3.ascending(sortKey(a, column), sortKey(b, column));
                    } else {
                        return d3.descending(sortKey(a, column), sortKey(b, column));
                    }
                });
                gHeaders.classed('ck-repo-widget-th-sort', function(d) { return d.key !== column.key; });
                gHeaders.classed('ck-repo-widget-th-sort-down', function(d) { return d.key === column.key && isAscending; });
                gHeaders.classed('ck-repo-widget-th-sort-up', function(d) { return d.key === column.key && !isAscending; });
            };

            gHeaders
                .on('click', function(c) {
                    let cl = this.classList;
                    let isSortOff = cl.contains('ck-repo-widget-th-sort');
                    let isSortDown = cl.contains('ck-repo-widget-th-sort-down');
                    let isSortUp = cl.contains('ck-repo-widget-th-sort-up');

                    let newSortAscending = isSortOff || isSortUp;
                    sortRowsBy(c, newSortAscending);
                });

            // create a cell in each row for each column
            var gCells = gRows.selectAll('td').data(function (row) {
                return columns.map(function (column) {
                    return _this._getCellValue(row, column);
                });
            }).enter().append('td').attr('class', 'ck-repo-widget-td').html(function (item) {
                return _this._getCellHtml(item);
            });

            sortRowsBy(columns[0], true);

            return table;
        }
    }, {
        key: '_getCellValue',
        value: function _getCellValue(row, column) {
            function getExtraKey(originalKey, keyToCheck) {
                return originalKey.substr(0, originalKey.lastIndexOf('#') + 1) + keyToCheck;
            }

            function stripSWKey(key, originalKey) {
                var strippedKey = key.substr(originalKey.length);

                strippedKey = strippedKey.substr(0, strippedKey.indexOf('#'));

                return strippedKey;
            }

            var format = column.format ? function (value) {
                return CkRepoWidgetUtils.formatNumber(value, column.format);
            } : function (value) {
                return value;
            };

            if (column.check_extra_key) {
                var _rowValue = row[column.key];

                if (!!_rowValue) {
                    var rowExtraValue = row[getExtraKey(column.key, column.check_extra_key)];

                    if (!!rowExtraValue) {
                        return format(_rowValue) + ' .. ' + format(rowExtraValue);
                    }

                    return format(_rowValue);
                }

                return '';
            }

            if (column.starts_with) {
                var lines = [];

                for (var key in row) {
                    if (row.hasOwnProperty(key) && key.startsWith(column.key)) {
                        var lineValue = row[key];

                        if (!!lineValue) {
                            lines.push(stripSWKey(key, column.key) + '=' + lineValue);
                        }
                    }
                }

                lines.sort();

                return lines;
            }

            if (column.json_and_pre) {
                var _rowValue2 = row[column.key];

                var pre = [];

                for (var _key in _rowValue2) {
                    if (_rowValue2.hasOwnProperty(_key)) {
                        var item = _rowValue2[_key];

                        if (typeof item === 'string') {
                            pre.push({
                                key: _key,
                                value: item
                            });
                        } else {
                            pre.push({
                                key: _key,
                                value: item.data_name + ' ' + item.version
                            });
                        }
                    }
                }

                pre.sort(function (a, b) {
                    return a.key.localeCompare(b.key);
                });

                return {
                    json: JSON.stringify(_rowValue2, null, 2),
                    list: pre
                };
            }

            var rowValue = row[column.key];

            if (rowValue !== null && rowValue !== undefined) {
                return format(rowValue);
            }

            return '';
        }
    }, {
        key: '_getCellHtml',
        value: function _getCellHtml(item) {
            if (Array.isArray(item)) {
                var html = '';

                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = item[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var line = _step6.value;

                        if (typeof line === 'string') {
                            html += '<div>' + line + '</div>';
                        } else {
                            html += '<div>' + this._getCellHtml(line) + '</div>';
                        }
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                return html;
            }

            if (!!item.cmd) {
                return '<div class=\'ck-repo-widget-cmd-btn\' onclick=\'CkRepoWidgetUtils.showMessageBox("' + CkRepoWidgetUtils.encode(item.cmd) + '");\'><i class="far fa-copy"></i><span class=\'ck-repo-widget-cmd-btn-label\'>' + item.title + '</span></div>';
            }

            if (!!item.key) {
                return '<b>' + item.key + '</b>: ' + item.value;
            }

            if (!!item.list) {
                if (!!item.json) {
                    return '<div class=\'ck-repo-widget-cmd-btn\' onclick=\'CkRepoWidgetUtils.showMessageBox("' + CkRepoWidgetUtils.encode(item.json) + '");\'><i class="far fa-copy"></i><span class=\'ck-repo-widget-cmd-btn-label\'>View JSON</span></div><br>' + this._getCellHtml(item.list);
                }

                return this._getCellHtml(item.list);
            }

            return item;
        }
    }, {
        key: '_updateCellVisibility',
        value: function _updateCellVisibility() {
            var _this2 = this;

            this.tableConfig.tableContainer.select('.ck-repo-widget-thead').selectAll('tr').selectAll('th').data(this.columns).style('display', function (column) {
                return _this2.filter.isColumnVisible(column) ? 'table-cell' : 'none';
            });

            this.tableConfig.tableContainer.select('.ck-repo-widget-tbody').selectAll('tr').selectAll('td').data(this.columns).style('display', function (column) {
                return _this2.filter.isColumnVisible(column) ? 'table-cell' : 'none';
            });

            this.tableConfig.tableContainer.select('.ck-repo-widget-tbody').selectAll('tr').data(this.rows).style('display', function (row) {
                return _this2.filter.isRowVisible(row) ? 'table-row' : 'none';
            });
        }
    }]);

    return CkRepoWidgetTable;
}();

/*
const plotConfig = {
    plotContainerId,
    tooltipContainerId,
    width,
    height,
    margin,
    defaultXDimensionIndex,
    defaultYDimensionIndex,
    defaultCDimensionIndex,
    pointRadius,
    isVariationXVisible,
    isVariationYVisible,
    filter
};
*/

var CkRepoWidgetPlot = function () {
    function CkRepoWidgetPlot() {
        _classCallCheck(this, CkRepoWidgetPlot);
    }

    _createClass(CkRepoWidgetPlot, [{
        key: 'init',
        value: function init(plotConfig, dataConfig) {
            var _this3 = this;

            this.plotConfig = plotConfig;
            this.dataConfig = dataConfig;

            var _plotConfig = this.plotConfig,
                width = _plotConfig.width,
                height = _plotConfig.height,
                margin = _plotConfig.margin,
                plotContainer = _plotConfig.plotContainer,
                tooltipContainer = _plotConfig.tooltipContainer;

            this.svg = plotContainer.append('svg')
                .attr('width', width + margin.left + margin.right)
                .attr('height', height + margin.top + margin.bottom)
                .append('g')
                    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            this.tooltip = tooltipContainer.append('div').attr('class', 'ck-repo-widget-plot-tooltip').style('opacity', 0);

            /*
            this.centerButton = plotContainer.append('div')
                .attr('class', 'ck-repo-widget-plot-center-btn')
                .on('click', () => {
                    this._fitScale();
                });
            */

            this.xDimension = this.dataConfig.dimensions[this.plotConfig.defaultXDimensionIndex];
            this.yDimension = this.dataConfig.dimensions[this.plotConfig.defaultYDimensionIndex];
            this.cDimension = this.dataConfig.dimensions[this.plotConfig.defaultCDimensionIndex];
            this.sDimension = this.dataConfig.dimensions[this.plotConfig.defaultSDimensionIndex];

            this.xHasher = new CkRepoWidgetHasher();
            this.yHasher = new CkRepoWidgetHasher();
            this.cHasher = new CkRepoWidgetHasher();
            this.sHasher = new CkRepoWidgetHasher();

            this.xValue = function (row) {
                return _this3.xHasher.hash(row[CkRepoWidgetUtils.getAxisKey(_this3.xDimension)]);
            };
            this.xValueVariationMin = function (row) {
                return _this3.xHasher.hash(row[CkRepoWidgetUtils.getVariationMinKey(_this3.xDimension)]);
            };
            this.xValueVariationMax = function (row) {
                return _this3.xHasher.hash(row[CkRepoWidgetUtils.getVariationMaxKey(_this3.xDimension)]);
            };
            this.yValue = function (row) {
                return _this3.yHasher.hash(row[CkRepoWidgetUtils.getAxisKey(_this3.yDimension)]);
            };
            this.yValueVariationMin = function (row) {
                return _this3.yHasher.hash(row[CkRepoWidgetUtils.getVariationMinKey(_this3.yDimension)]);
            };
            this.yValueVariationMax = function (row) {
                return _this3.yHasher.hash(row[CkRepoWidgetUtils.getVariationMaxKey(_this3.yDimension)]);
            };
            this.cValue = function (row) {
                return _this3.cHasher.hash(row[CkRepoWidgetUtils.getAxisKey(_this3.cDimension)]);
            };
            this.sValue = function (row) {
                return _this3.sHasher.hash(row[CkRepoWidgetUtils.getAxisKey(_this3.sDimension)]);
            };

            var valueToDisplay = function valueToDisplay(dimension, value) {
                var tView = _this3.dataConfig.table_view.find(function (view) {
                    return view.key.startsWith(dimension.key);
                });

                if (!!tView && tView.format) {
                    return CkRepoWidgetUtils.formatNumber(value, tView.format);
                }

                return value;
            };

            this.xValueToDisplay = function (row) {
                return valueToDisplay(_this3.xDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.xDimension)]);
            };
            this.yValueToDisplay = function (row) {
                return valueToDisplay(_this3.yDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.yDimension)]);
            };
            this.cValueToDisplay = function (row) {
                return valueToDisplay(_this3.cDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.cDimension)]);
            };
            this.sValueToDisplay = function (row) {
                return valueToDisplay(_this3.sDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.sDimension)]);
            };

            this.isVariationXVisible = this.plotConfig.isVariationXVisible;
            this.isVariationYVisible = this.plotConfig.isVariationYVisible;

            this.filter = this.plotConfig.filter;

            this.getRawPointsData = function (data) {
                var result = [];

                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = data[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var row = _step7.value;

                        var xKey = CkRepoWidgetUtils.getAxisKey(_this3.xDimension);
                        var yKey = CkRepoWidgetUtils.getAxisKey(_this3.yDimension);

                        var x = _this3.xValue(row);
                        var y = _this3.yValue(row);

                        if (Array.isArray(x) && Array.isArray(y)) {
                            if (x.length !== y.length) {
                                throw new Error('x.length must be the same as y.length');
                            }

                            for (var i = 0; i < x.length; ++i) {
                                var _extends2;

                                result.push(_extends({}, row, (_extends2 = {}, _defineProperty(_extends2, xKey, x[i]), _defineProperty(_extends2, yKey, y[i]), _extends2)));
                            }
                        } else if (Array.isArray(x)) {
                            for (var _i = 0; _i < x.length; ++_i) {
                                result.push(_extends({}, row, _defineProperty({}, xKey, x[_i])));
                            }
                        } else if (Array.isArray(y)) {
                            for (var _i2 = 0; _i2 < y.length; ++_i2) {
                                result.push(_extends({}, row, _defineProperty({}, yKey, y[_i2])));
                            }
                        } else {
                            result.push(row);
                        }
                    }
                } catch (err) {
                    _didIteratorError7 = true;
                    _iteratorError7 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                            _iterator7.return();
                        }
                    } finally {
                        if (_didIteratorError7) {
                            throw _iteratorError7;
                        }
                    }
                }

                return result;
            };

            this.filterPointsData = function (data) {
                return data.filter(row => _this3.filter.isRowVisible(row));
            }

            this.getColorBounds = function (data) {
                let colorValues = data.map( row => this.cValue(row) )
                    .filter( val => !Number.isNaN(val) );

                return [Math.min(...colorValues), Math.max(...colorValues)];
            }

            this.getLinesData = function (data) {
                var result = [];

                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;

                try {
                    for (var _iterator8 = data[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var row = _step8.value;

                        if (!_this3.filter.isRowVisible(row)) {
                            continue;
                        }

                        var x = _this3.xValue(row);
                        var y = _this3.yValue(row);

                        if (Array.isArray(x) && Array.isArray(y)) {
                            if (x.length !== y.length) {
                                throw new Error('x.length must be the same as y.length');
                            }

                            var path = [];

                            for (var i = 0; i < x.length; ++i) {
                                path.push({
                                    x: x[i],
                                    y: y[i]
                                });
                            }

                            result.push(_extends({}, row, {
                                path: path
                            }));
                        } else if (Array.isArray(x)) {
                            var _path = [];

                            for (var _i3 = 0; _i3 < x.length; ++_i3) {
                                _path.push({
                                    x: x[_i3],
                                    y: y
                                });
                            }

                            result.push(_extends({}, row, {
                                path: _path
                            }));
                        } else if (Array.isArray(y)) {
                            var _path2 = [];

                            for (var _i4 = 0; _i4 < y.length; ++_i4) {
                                _path2.push({
                                    x: x,
                                    y: y[_i4]
                                });
                            }

                            result.push(_extends({}, row, {
                                path: _path2
                            }));
                        }
                    }
                } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                            _iterator8.return();
                        }
                    } finally {
                        if (_didIteratorError8) {
                            throw _iteratorError8;
                        }
                    }
                }

                return result;
            };

            this.getXVariationData = function (data) {
                return data.filter(function (row) {
                    return !!_this3.xValueVariationMin(row) && !!_this3.xValueVariationMax(row);
                });
            };

            this.getYVariationData = function (data) {
                return data.filter(function (row) {
                    return !!_this3.yValueVariationMin(row) && !!_this3.yValueVariationMax(row);
                });
            };

            this.refLines = [];

            this.setRefLines = function(refLines) {
                this.refLines = refLines;
                for (let refLine in this.refLines) {
                    this.refLines[refLine].apply = () => this._applyRefLines();
                }
            }

            this.colorRange = plotConfig.colorRange || ['lightblue', 'darkblue'];
            this.sizeRange = plotConfig.sizeRange || [2.5, 4.5];
        }
    }, {
        key: 'build',
        value: function build(data) {
            this.data = data;

            this.xHasher.reset();
            this.yHasher.reset();
            this.cHasher.reset();

            this.rawPointsData = this.getRawPointsData(data);
            this.pointsData = this.filterPointsData(this.rawPointsData);
            this.colorBounds = this.getColorBounds(this.rawPointsData);

            this.linesData = this.getLinesData(data);
            this.xVariationData = this.getXVariationData(this.pointsData);
            this.yVariationData = this.getYVariationData(this.pointsData);

            this._build();
        }
    }, {
        key: 'setXDimension',
        value: function setXDimension(dimension) {
            this.xDimension = dimension;

            this.xHasher.reset();

            this.rawPointsData = this.getRawPointsData(this.data);
            this.pointsData = this.filterPointsData(this.rawPointsData);
            this.linesData = this.getLinesData(this.data);
            this.xVariationData = this.getXVariationData(this.pointsData);
            this.colorBounds = this.getColorBounds(this.rawPointsData);

            this._build();
        }
    }, {
        key: 'getXDimension',
        value: function getXDimension() {
            return this.xDimension;
        }
    }, {
        key: 'setYDimension',
        value: function setYDimension(dimension) {
            this.yDimension = dimension;

            this.yHasher.reset();

            this.rawPointsData = this.getRawPointsData(this.data);
            this.pointsData = this.filterPointsData(this.rawPointsData);
            this.linesData = this.getLinesData(this.data);
            this.yVariationData = this.getYVariationData(this.pointsData);
            this.colorBounds = this.getColorBounds(this.rawPointsData);

            this._build();
        }
    }, {
        key: 'getYDimension',
        value: function getYDimension() {
            return this.yDimension;
        }
    }, {
        key: 'setCDimension',
        value: function setCDimension(dimension) {
            this.cDimension = dimension;

            this.cHasher.reset();

            this.colorBounds = this.getColorBounds(this.rawPointsData);

            this._applyColorDimension();
        }
    }, {
        key: 'getCDimension',
        value: function getCDimension() {
            return this.cDimension;
        }
    }, {
        key: 'setSDimension',
        value: function setSDimension(dimension) {
            this.sDimension = dimension;

            this.sHasher.reset();

            this._applySizeDimension();
        }
    }, {
        key: 'getSDimension',
        value: function getSDimension() {
            return this.sDimension;
        }
    }, {
        key: 'setXVariationVisibility',
        value: function setXVariationVisibility(isVisible) {
            this.isVariationXVisible = isVisible;

            this._applyXVariationVisibility();
        }
    }, {
        key: 'getXVariationVisibility',
        value: function getXVariationVisibility() {
            return this.isVariationXVisible;
        }
    }, {
        key: 'setYVariationVisibility',
        value: function setYVariationVisibility(isVisible) {
            this.isVariationYVisible = isVisible;

            this._applyYVariationVisibility();
        }
    }, {
        key: 'getYVariationVisibility',
        value: function getYVariationVisibility() {
            return this.isVariationYVisible;
        }
    }, {
        key: 'getRefLine',
        value: function getRefLine(refLineName) {
            return this.refLines[refLineName];
        }
    }, {
        key: 'setFilter',
        value: function setFilter(filter) {
            this.filter = filter;

            /*
            this._applyXVariationVisibility();
            this._applyYVariationVisibility();
            this._applyDotVisibility();
            this._applyLinesVisibility();
            */

            this.build(this.data);
        }
    }, {
        key: '_build',
        value: function _build() {
            var _this4 = this;

            var pointsData = this.pointsData,
                linesData = this.linesData,
                xVariationData = this.xVariationData,
                yVariationData = this.yVariationData,
                svg = this.svg,
                tooltip = this.tooltip;
            var _plotConfig2 = this.plotConfig,
                width = _plotConfig2.width,
                height = _plotConfig2.height,
                margin = _plotConfig2.margin;
            var xValue = this.xValue,
                yValue = this.yValue,
                xValueVariationMax = this.xValueVariationMax,
                xValueVariationMin = this.xValueVariationMin,
                yValueVariationMax = this.yValueVariationMax,
                yValueVariationMin = this.yValueVariationMin,
                xValueToDisplay = this.xValueToDisplay,
                yValueToDisplay = this.yValueToDisplay,
                cValueToDisplay = this.cValueToDisplay,
                sValueToDisplay = this.sValueToDisplay;

            // setup x 

            var xScale = d3.scaleLinear().range([0, width]),


            // value -> display
            xAxis = d3.axisBottom(xScale);

            // setup y
            var yScale = d3.scaleLinear().range([height, 0]),


            // value -> display
            yAxis = d3.axisLeft(yScale);

            // don't want dots overlapping axis, so add in buffer to data domain
            var dKoeff = 25;
            var xMin = d3.min(pointsData, xValue);
            var xMax = d3.max(pointsData, xValue);
            var dx = (xMax - xMin) / dKoeff || 1;
            var yMin = d3.min(pointsData, this.yValue);
            var yMax = d3.max(pointsData, this.yValue);
            var dy = (yMax - yMin) / dKoeff || 1;

            xScale.domain([xMin - dx, xMax + dx]);
            yScale.domain([yMin - dy, yMax + dy]);

            // clear chart
            svg.selectAll('*').remove();

            // setup clipping region
            svg.append('defs').append('clipPath').attr('id', 'clip').append('rect').attr('width', width).attr('height', height);

            var applyScale = function applyScale(xScale, yScale) {
                _this4.xScale = xScale;
                _this4.yScale = yScale;

                // update axes
                gX.call(xAxis.scale(xScale));
                gY.call(yAxis.scale(yScale));

                // update points
                points.data(pointsData).attr('cx', function (d) {
                    return xScale(xValue(d));
                }).attr('cy', function (d) {
                    return yScale(yValue(d));
                });

                lines.data(linesData).attr("d", function (d) {
                    return d3.line().x(function (p) {
                        return xScale(p.x);
                    }).y(function (p) {
                        return yScale(p.y);
                    })(d.path);
                });

                xVariations.data(xVariationData).attr('x1', function (d) {
                    return xScale(xValueVariationMin(d));
                }).attr('y1', function (d) {
                    return yScale(yValue(d));
                }).attr('x2', function (d) {
                    return xScale(xValueVariationMax(d));
                }).attr('y2', function (d) {
                    return yScale(yValue(d));
                });

                yVariations.data(yVariationData).attr('y1', function (d) {
                    return yScale(yValueVariationMin(d));
                }).attr('x1', function (d) {
                    return xScale(xValue(d));
                }).attr('y2', function (d) {
                    return yScale(yValueVariationMax(d));
                }).attr('x2', function (d) {
                    return xScale(xValue(d));
                });

                _this4._applyRefLines();
            };

            // Pan and zoom
            var zoomHandler = function zoomHandler() {
                // create new scale ojects based on event
                var xScaleZoomed = d3.event.transform.rescaleX(xScale);
                var yScaleZoomed = d3.event.transform.rescaleY(yScale);

                applyScale(xScaleZoomed, yScaleZoomed);
            };

            var zoom = d3.zoom().scaleExtent([.5, 20]).extent([[0, 0], [width, height]]).on('zoom', zoomHandler);

            /*
            this._fitScale = () => {
                zoom.transform(gZoom, d3.zoomIdentity.scale(1));
            };
            */

            var gZoom = svg.append('rect').attr('width', width).attr('height', height).style('fill', 'none').style('pointer-events', 'all').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').call(zoom);

            // points & lines container
            var gPoints = svg.append('g').attr('clip-path', 'url(#clip)');
            this.gPoints = gPoints;

            // x-variation lines
            var xVariations = gPoints.selectAll('.ck-repo-widget-plot-variation-x').data(xVariationData).enter().append('line').attr('class', 'ck-repo-widget-plot-variation-x');

            // y-variation lines
            var yVariations = gPoints.selectAll('.ck-repo-widget-plot-variation-y').data(yVariationData).enter().append('line').attr('class', 'ck-repo-widget-plot-variation-y');

            var mouseoverHandler = function mouseoverHandler(d) {
                tooltip.transition().duration(200).style('opacity', .9);
                var hint = d[CkRepoWidgetConstants.kTitleKey] + '<br/>' + _this4.xDimension.name + ': ' + xValueToDisplay(d) + '<br/>' + _this4.yDimension.name + ': ' + yValueToDisplay(d) + '<br/>' + _this4.cDimension.name + ': ' + cValueToDisplay(d) + '<br/>' + (_this4.plotConfig.isSDimensionEnabled ? _this4.sDimension.name + ': ' + sValueToDisplay(d) + '<br/>' : '');
                tooltip.html(hint).style('left', d3.event.pageX + 5 + 'px').style('top', d3.event.pageY - 28 + 'px');
            };
            var mouseoutHandler = function mouseoutHandler(d) {
                tooltip.transition().duration(500).style('opacity', 0);
            };
            var clickHandler = function clickHandler(d) {
                CkRepoWidgetUtils.scrollToElement(d3.select('#' + CkRepoWidgetUtils.getRowId(d)).node());
            };

            // draw lines
            var lines = gPoints.selectAll('.ck-repo-widget-plot-line').data(linesData).enter().append("path").attr('class', 'ck-repo-widget-plot-line');

            // draw dots
            var points = gPoints.selectAll('.ck-repo-widget-plot-dot').data(pointsData).enter().append('circle').attr('class', 'ck-repo-widget-plot-dot').on('mouseover', mouseoverHandler).on('mouseout', mouseoutHandler).on('click', clickHandler);

            // x-axis
            var gX = svg.append('g').attr('class', 'ck-repo-widget-plot-axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);

            gX.append('text').attr('class', 'ck-repo-widget-plot-axis-label').attr('x', width).attr('y', -6).style('text-anchor', 'end').style('fill', 'black').text(this.xDimension.name);

            // y-axis
            var gY = svg.append('g').attr('class', 'ck-repo-widget-plot-axis').call(yAxis);

            gY.append('text').attr('class', 'ck-repo-widget-plot-axis-label').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').style('fill', 'black').text(this.yDimension.name);

            applyScale(xScale, yScale);

            this._applyColorDimension();
            this._applySizeDimension();
            this._applyXVariationVisibility();
            this._applyYVariationVisibility();
            this._applyDotVisibility();
            this._applyLinesVisibility();
            this._applyRefLines();
        }
    }, {
        key: '_applyColorDimension',
        value: function () {
            var svg = this.svg,
                pointsData = this.pointsData,
                linesData = this.linesData,
                xVariationData = this.xVariationData,
                yVariationData = this.yVariationData,
                cValue = this.cValue,
                colorRange = this.colorRange;

            var color = d3.scaleLinear().domain(CkRepoWidgetUtils.getColorDomain(colorRange.length, this.colorBounds)).range(colorRange);

            svg.selectAll('.ck-repo-widget-plot-dot').data(pointsData).style('fill', function (row) {
                return color(cValue(row));
            });

            svg.selectAll('.ck-repo-widget-plot-line').data(linesData).style('stroke', function (row) {
                return color(cValue(row));
            });

            svg.selectAll('.ck-repo-widget-plot-variation-x').data(xVariationData).style('stroke', function (row) {
                return color(cValue(row));
            });

            svg.selectAll('.ck-repo-widget-plot-variation-y').data(yVariationData).style('stroke', function (row) {
                return color(cValue(row));
            });

            if (!!this.plotConfig.colorRange) {
                this._renderCDimensionLegend();
            }
        }
    }, {
        key: '_applySizeDimension',
        value: function _applySizeDimension() {
            var svg = this.svg,
                pointsData = this.pointsData,
                sValue = this.sValue;

            if (this.plotConfig.isSDimensionEnabled) {
                var sizeMapper = d3.scaleLinear().domain([d3.min(pointsData, sValue), d3.max(pointsData, sValue)]).range(this.sizeRange);

                svg.selectAll('.ck-repo-widget-plot-dot').data(pointsData).attr('r', function (row) {
                    return sizeMapper(sValue(row));
                });
            } else {
                svg.selectAll('.ck-repo-widget-plot-dot').data(pointsData).attr('r', CkRepoWidgetConstants.kDefaultPointRadius);
            }
        }
    }, {
        key: '_applyXVariationVisibility',
        value: function _applyXVariationVisibility() {
            var _this5 = this;

            this.svg.selectAll('.ck-repo-widget-plot-variation-x').data(this.xVariationData).style('visibility', function (row) {
                return _this5.isVariationXVisible && _this5.filter.isRowVisible(row) ? 'visible' : 'hidden';
            });
        }
    }, {
        key: '_applyYVariationVisibility',
        value: function _applyYVariationVisibility() {
            var _this6 = this;

            this.svg.selectAll('.ck-repo-widget-plot-variation-y').data(this.yVariationData).style('visibility', function (row) {
                return _this6.isVariationYVisible && _this6.filter.isRowVisible(row) ? 'visible' : 'hidden';
            });
        }
    }, {
        key: '_applyDotVisibility',
        value: function _applyDotVisibility() {
            var _this7 = this;

            this.svg.selectAll('.ck-repo-widget-plot-dot').data(this.pointsData).style('visibility', function (row) {
                return _this7.filter.isRowVisible(row) ? 'visible' : 'hidden';
            });
        }
    }, {
        key: '_applyLinesVisibility',
        value: function _applyLinesVisibility() {
            var _this8 = this;

            this.svg.selectAll('.ck-repo-widget-plot-line').data(this.linesData).style('visibility', function (row) {
                return _this8.filter.isRowVisible(row) ? 'visible' : 'hidden';
            });
        }
    }, {
        key: '_renderCDimensionLegend',
        value: function _renderCDimensionLegend() {
            var colorDomain = CkRepoWidgetUtils.getColorDomain(this.colorRange.length, this.colorBounds);

            var minValue = this.colorBounds[0];
            var maxValue = this.colorBounds[1];

            var axisWidth = this.plotConfig.width / 2;

            var rectCount = 10;
            var rectWidth = axisWidth / rectCount;
            var rectHeight = 5;
            var rectColorStep = (maxValue - minValue) / (rectCount - 1);

            var colors = d3.scaleLinear().domain(colorDomain).range(this.colorRange);

            // c-axis
            var cScale = d3.scaleLinear().range([0, axisWidth]),


            // value -> display
            cAxis = d3.axisTop(cScale);

            cScale.domain([minValue, maxValue]);

            // clear existing legend
            this.svg.select('.ck-repo-widget-plot-axis_color').remove();

            var gC = this.svg.append('g').attr('class', 'ck-repo-widget-plot-axis ck-repo-widget-plot-axis_color').attr('transform', 'translate(' + axisWidth + ',' + -rectHeight + ')').call(cAxis);

            var rects = gC.selectAll(".ck-repo-widget-color-rect")
                .data(d3.range(minValue, maxValue + rectColorStep, rectColorStep))
                .enter().append("rect")
                    .attr("y", 0)
                    .attr("height", rectHeight)
                    .attr("x", function (_, i) { return i * rectWidth; })
                    .attr("width", rectWidth).attr("fill", function (d) { return colors(d); })
                    .attr("class", "ck-repo-widget-color-rect");
        }
    }, {
        key: '_applyRefLines',
        value: function _applyRefLines() {
            let isDimOk = d => this.yDimension.key === d.dimension;
            let toVisibility = b => (b ? 'visible' : 'hidden');
            let deltaIsReadable = v => true; // default value, see reassignment below

            let data = Object.values(this.refLines);

            let nodeRoot = this.svg;

            function rectsIntersects(a, b) {
                if (typeof a === 'undefined' || typeof b === 'undefined') return false;
                let res = (
                    Math.max(a.x, b.x) < Math.min(a.x + a.width, b.x + b.width) &&
                    Math.max(a.y, b.y) < Math.min(a.y + a.height, b.y + b.height) );
                return res;
            };

            // Line
            {
                let className = '-line';
                let line = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                line.enter().append("line")
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('x1', 0)
                        .attr('x2', d => this.plotConfig.width)
                        .style('stroke', 'black')
                    .merge(line)
                        .attr('y1', d => this.yScale(d.value))
                        .attr('y2', d => this.yScale(d.value))
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible));
                line.exit().remove();
            }

            // Label-background
            let labelBg = null;
            {
                let className = '-label-bg';
                labelBg = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                labelBg.enter().append('rect')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('fill', 'white')
                        .attr('stroke', 'black')
                    .merge(labelBg)
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible));
                labelBg.exit().remove();
            }

            // Upper label background
            let upperLabelBg = null;
            {
                let className = '-upper-label-bg';
                upperLabelBg = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                upperLabelBg.enter().append('rect')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('fill', 'white')
                        .attr('stroke', 'black')
                    .merge(upperLabelBg)
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible && deltaIsReadable(d) ));
                upperLabelBg.exit().remove();
            }

            // Lower label background
            let lowerLabelBg = null;
            {
                let className = '-lower-label-bg';
                lowerLabelBg = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                lowerLabelBg.enter().append('rect')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('fill', 'white')
                        .attr('stroke', 'black')
                    .merge(lowerLabelBg)
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible && deltaIsReadable(d) ));
                lowerLabelBg.exit().remove();
            }

            // Label
            var labelBBoxes = null;
            {
                let className = '-label';
                let label = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                label.enter().append('text')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('dy', '0.5em')
                        .attr('x', d => 0)
                        .style('text-anchor', 'end')
                        .text(d => d.name)
                    .merge(label)
                        .attr('y', d => this.yScale(d.value))
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible));
                label.exit().remove();

                labelBBoxes = label.nodes().map(n => n.getBBox());

                // Calc size
                if (label.node()) {
                    let fontSize = window.getComputedStyle(label.node()).fontSize;
                    let lineCount = 2;
                    let deltaVisibilityRange = parseFloat(fontSize) * lineCount;
                    deltaIsReadable = (v) => Math.abs(this.yScale(0) - this.yScale(v.delta())) > deltaVisibilityRange;
                }
            }

            // Upper line
            {
                let className = '-upper-line';
                let upperLine = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                upperLine.enter().append("line")
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('x1', 0)
                        .attr('x2', this.plotConfig.width)
                        .style('stroke', 'black')
                        .attr('stroke-dasharray', '10')
                    .merge(upperLine)
                        .attr('y1', d => this.yScale(d.value + d.delta()))
                        .attr('y2', d => this.yScale(d.value + d.delta()))
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible && d.delta_visible ));
                upperLine.exit().remove();
            }

            // Lower line
            {
                let className = '-lower-line';
                let lowerLine = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                lowerLine.enter().append("line")
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('x1', 0)
                        .attr('x2', this.plotConfig.width)
                        .style('stroke', 'black')
                        .attr('stroke-dasharray', '10')
                    .merge(lowerLine)
                        .attr('y1', d => this.yScale(d.value - d.delta()))
                        .attr('y2', d => this.yScale(d.value - d.delta()))
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible && d.delta_visible ));
                lowerLine.exit().remove();
            }

            // Upper label
            let upperLabelBBoxes = null;
            {
                let className = '-upper-label';
                let upperLabel = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                upperLabel.enter().append('text')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('dy', '0.5em')
                        .attr('x', 0)
                        .style('text-anchor', 'end')
                        .text(d => '+Δ')
                    .merge(upperLabel)
                        .attr('y', d => this.yScale(d.value + d.delta()))
                        .style('visibility', function(d,i) { return toVisibility( isDimOk(d) && d.visible && d.delta_visible && !rectsIntersects(labelBBoxes[i], this.getBBox()) ); } );
                upperLabel.exit().remove();

                upperLabelBBoxes = upperLabel.nodes().map(n => n.getBBox());
            }

            // Lower label
            let lowerLabelBBoxes = null;
            {
                let className = '-lower-label';
                let lowerLabel = nodeRoot.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                lowerLabel.enter().append('text')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('dy', '0.5em')
                        .attr('x', 0)
                        .style('text-anchor', 'end')
                        .text(d => '-Δ')
                    .merge(lowerLabel)
                        .attr('y', d => this.yScale(d.value - d.delta()))
                        .style('visibility', function(d,i) { return toVisibility(isDimOk(d) && d.visible && d.delta_visible && !rectsIntersects(labelBBoxes[i], this.getBBox()) ); });
                lowerLabel.exit().remove();

                lowerLabelBBoxes = lowerLabel.nodes().map(n => n.getBBox());
            }

            labelBg
                .attr('x', (_,i) => labelBBoxes[i].x)
                .attr('y', (_,i) => labelBBoxes[i].y)
                .attr('width', (_,i) => labelBBoxes[i].width)
                .attr('height', (_,i) => labelBBoxes[i].height);

            upperLabelBg
                .attr('x', (_,i) => upperLabelBBoxes[i].x)
                .attr('y', (_,i) => upperLabelBBoxes[i].y)
                .attr('width', (_,i) => upperLabelBBoxes[i].width)
                .attr('height', (_,i) => upperLabelBBoxes[i].height);

            lowerLabelBg
                .attr('x', (_,i) => lowerLabelBBoxes[i].x)
                .attr('y', (_,i) => lowerLabelBBoxes[i].y)
                .attr('width', (_,i) => lowerLabelBBoxes[i].width)
                .attr('height', (_,i) => lowerLabelBBoxes[i].height);
        }
    }]);

    return CkRepoWidgetPlot;
}();

var CkRepoWdiget = function () {
    function CkRepoWdiget() {
        _classCallCheck(this, CkRepoWdiget);
    }

    _createClass(CkRepoWdiget, [{
        key: 'init',
        value: function init(argsMap) {
            var _this9 = this;

            // If this widget is running on local machine, e.g. launched through `ck widget nntest`
            this.isLocalRun = (typeof argsMap.isLocalRun === 'undefined' ? true : argsMap.isLocalRun);
            // Scenario filters available workflows
            this.scenario = argsMap.scenario || '';

            let rootId = argsMap.rootId || '#ck-repo-widget';
            let headerId = argsMap.headerId || '#ck-repo-widget-header';
            let loadingLayerId = argsMap.loadingLayerId || '#ck-repo-widget-loading-layer';

            // Url where to get data from
            const kApiUrl = argsMap.apiUrlPrefix || (this.isLocalRun ? '/web' : 'http://cknowledge.org/repo/json.php');
            var kActionGetData = 'get_raw_data';
            var kActionGetConfig = 'get_raw_config';

            var kPlotMargin = { top: 30, right: 70, bottom: 30, left: 90 };
            var kPlotWidth = 1060 - kPlotMargin.left - kPlotMargin.right;
            var kPlotHeight = 500 - kPlotMargin.top - kPlotMargin.bottom;

            var plot = new CkRepoWidgetPlot();
            var table = new CkRepoWidgetTable();

            this.plot = plot;
            this.table = table;

            var workflowBase = {
                dataPrefix: '',
                configPrefix: '',
                tableProcessor: function tableProcessor(table) {
                    CkRepoWidgetUtils.prepareTable(table);
                },
                config: null,
                data: null,
                isSDimensionEnabled: true,
                refLines: {},
            };

            var defaultQuantumFilterRigetti = new CkRepoWidgetFilter();
            defaultQuantumFilterRigetti.setSelector({ key: '_platform' }, '8q-agave');
            defaultQuantumFilterRigetti.setSelector({ key: '_minimizer_method' }, 'my_cobyla');

            var defaultQuantumFilterIBM = new CkRepoWidgetFilter();
            defaultQuantumFilterIBM.setSelector({ key: '_platform' }, 'local_qasm_simulator');
            defaultQuantumFilterIBM.setSelector({ key: '_minimizer_method' }, 'my_cobyla');

            var workflows = [_extends({}, workflowBase, {
                filter: new CkRepoWidgetFilter(),
                name: 'ReQuEST @ ASPLOS\'18 tournament (Pareto-efficient image classification)',
                moduleUoa: 'request.asplos18',
                defaultXDimensionIndex: 3,
                defaultYDimensionIndex: 4,
                defaultCDimensionIndex: 0,
                defaultSDimensionIndex: 6,
                defaultXVariationVisible: true,
                defaultYVariationVisible: false
            }), _extends({}, workflowBase, {
                filter: new CkRepoWidgetFilter(),
                name: 'NNTest (collaboratively benchmarking and optimizing neural network operations)',
                moduleUoa: 'nntest',
                defaultXDimensionIndex: 0,
                defaultYDimensionIndex: 1,
                defaultCDimensionIndex: 0,
                defaultSDimensionIndex: 3,
                defaultXVariationVisible: false,
                defaultYVariationVisible: false,
                isSDimensionEnabled: false
            }), _extends({}, workflowBase, {
                filter: defaultQuantumFilterIBM,
                name: 'Quantum Hackathon 2018-10-06 (Variational Quantum Eigensolver on IBM) - Solution Convergence',
                moduleUoa: 'hackathon.20181006',
                defaultXDimensionIndex: 2,
                defaultYDimensionIndex: 1,
                defaultCDimensionIndex: 3,
                defaultSDimensionIndex: 5,
                defaultXVariationVisible: false,
                defaultYVariationVisible: false,
                dataPrefix: 'full_',
                configPrefix: 'full_'
            }), _extends({}, workflowBase, {
                filter: new CkRepoWidgetFilter(),
                name: 'Quantum Hackathon 2018-10-06 (Variational Quantum Eigensolver on IBM) - Time To Solution',
                moduleUoa: 'hackathon.20181006',
                defaultXDimensionIndex: 3,
                defaultYDimensionIndex: 2,
                defaultCDimensionIndex: 4,
                defaultSDimensionIndex: 6,
                defaultXVariationVisible: false,
                defaultYVariationVisible: false,
                dataPrefix: 'metrics_',
                configPrefix: 'metrics_',
                props: {
                    '__fun_key': 'fun_exact',
                    '__time_key': 'total_q_shots',
                    '__delta': 0.01,
                    '__prob': 0.8
                },
                tableProcessor: function tableProcessor(table, props) {
                    CkRepoWidgetUtils.prepareTable(table);

                    var delta = props['__delta'];
                    var prob = props['__prob'];
                    var which_fun_key = props['__fun_key'];
                    var which_time_key = props['__time_key'];

                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = table[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var row = _step9.value;

                            var _CkRepoWidgetUtils$qu2 = CkRepoWidgetUtils.quantum.benchmark_list_of_runs(row['runs'], delta, prob, which_fun_key, which_time_key),
                                classical_energy = _CkRepoWidgetUtils$qu2.classical_energy,
                                minimizer_method = _CkRepoWidgetUtils$qu2.minimizer_method,
                                minimizer_src = _CkRepoWidgetUtils$qu2.minimizer_src,
                                n_succ = _CkRepoWidgetUtils$qu2.n_succ,
                                T_ave = _CkRepoWidgetUtils$qu2.T_ave,
                                T_err = _CkRepoWidgetUtils$qu2.T_err,
                                t_ave = _CkRepoWidgetUtils$qu2.t_ave,
                                t_err = _CkRepoWidgetUtils$qu2.t_err,
                                s = _CkRepoWidgetUtils$qu2.s,
                                s_err = _CkRepoWidgetUtils$qu2.s_err,
                                energies = _CkRepoWidgetUtils$qu2.energies,
                                times = _CkRepoWidgetUtils$qu2.times;

                            row['T_ave'] = T_ave;
                            row['T_ave#min'] = T_ave - T_err;
                            row['T_ave#max'] = T_ave + T_err;
                            row['T_err'] = T_err;
                            row['t_ave'] = t_ave;
                            row['t_ave#min'] = t_ave - t_err;
                            row['t_ave#max'] = t_ave + t_err;
                            row['t_err'] = t_err;
                            row['s'] = s;
                            row['s_err'] = s_err;
                            row['__energies'] = energies;
                            row['__times'] = times;

                            row[CkRepoWidgetConstants.kRowHiddenKey] = Number.isNaN(T_ave);
                        }
                    } catch (err) {
                        _didIteratorError9 = true;
                        _iteratorError9 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                _iterator9.return();
                            }
                        } finally {
                            if (_didIteratorError9) {
                                throw _iteratorError9;
                            }
                        }
                    }
                },
                refLines: {
                    "classical_energy": {
                        name: "Exact Answer",
                        dimension: "__energies",
                        get_value: CkRepoWidgetUtils.quantum.get_classical_energy,
                        value: null,
                        delta: () => -1
                    }
                },
                colorRange: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']
            }), _extends({}, workflowBase, {
                filter: defaultQuantumFilterRigetti,
                name: 'Quantum Hackathon 2018-06-15 (Variational Quantum Eigensolver on Rigetti) - Solution Convergence',
                moduleUoa: 'hackathon.20180615',
                defaultXDimensionIndex: 2,
                defaultYDimensionIndex: 1,
                defaultCDimensionIndex: 3,
                defaultSDimensionIndex: 5,
                defaultXVariationVisible: false,
                defaultYVariationVisible: false,
                dataPrefix: 'full_',
                configPrefix: 'full_'
            }), _extends({}, workflowBase, {
                filter: new CkRepoWidgetFilter(),
                name: 'Quantum Hackathon 2018-06-15 (Variational Quantum Eigensolver on Rigetti) - Time To Solution',
                moduleUoa: 'hackathon.20180615',
                defaultXDimensionIndex: 3,
                defaultYDimensionIndex: 2,
                defaultCDimensionIndex: 4,
                defaultSDimensionIndex: 6,
                defaultXVariationVisible: false,
                defaultYVariationVisible: false,
                dataPrefix: 'metrics_',
                configPrefix: 'metrics_',
                props: {
                    '__fun_key': 'fun_exact',
                    '__time_key': 'total_q_shots',
                    '__delta': 0.1,
                    '__prob': 0.5
                },
                tableProcessor: function tableProcessor(table, props) {
                    CkRepoWidgetUtils.prepareTable(table);

                    var delta = props['__delta'];
                    var prob = props['__prob'];
                    var which_fun_key = props['__fun_key'];
                    var which_time_key = props['__time_key'];

                    var _iteratorNormalCompletion9 = true;
                    var _didIteratorError9 = false;
                    var _iteratorError9 = undefined;

                    try {
                        for (var _iterator9 = table[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                            var row = _step9.value;

                            var _CkRepoWidgetUtils$qu2 = CkRepoWidgetUtils.quantum.benchmark_list_of_runs(row['runs'], delta, prob, which_fun_key, which_time_key),
                                classical_energy = _CkRepoWidgetUtils$qu2.classical_energy,
                                minimizer_method = _CkRepoWidgetUtils$qu2.minimizer_method,
                                minimizer_src = _CkRepoWidgetUtils$qu2.minimizer_src,
                                n_succ = _CkRepoWidgetUtils$qu2.n_succ,
                                T_ave = _CkRepoWidgetUtils$qu2.T_ave,
                                T_err = _CkRepoWidgetUtils$qu2.T_err,
                                t_ave = _CkRepoWidgetUtils$qu2.t_ave,
                                t_err = _CkRepoWidgetUtils$qu2.t_err,
                                s = _CkRepoWidgetUtils$qu2.s,
                                s_err = _CkRepoWidgetUtils$qu2.s_err,
                                energies = _CkRepoWidgetUtils$qu2.energies,
                                times = _CkRepoWidgetUtils$qu2.times;

                            row['T_ave'] = T_ave;
                            row['T_ave#min'] = T_ave - T_err;
                            row['T_ave#max'] = T_ave + T_err;
                            row['T_err'] = T_err;
                            row['t_ave'] = t_ave;
                            row['t_ave#min'] = t_ave - t_err;
                            row['t_ave#max'] = t_ave + t_err;
                            row['t_err'] = t_err;
                            row['s'] = s;
                            row['s_err'] = s_err;
                            row['__energies'] = energies;
                            row['__times'] = times;

                            row[CkRepoWidgetConstants.kRowHiddenKey] = Number.isNaN(T_ave);
                        }
                    } catch (err) {
                        _didIteratorError9 = true;
                        _iteratorError9 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                _iterator9.return();
                            }
                        } finally {
                            if (_didIteratorError9) {
                                throw _iteratorError9;
                            }
                        }
                    }
                },
                colorRange: ['#0000FF', '#00FFFF', '#00FF00', '#FFFF00', '#FF0000']
            })];

            // Scenario filters available workflows
            if (this.scenario !== '') {
                workflows = workflows.filter(w => w.moduleUoa == this.scenario);
            }
            var defaultWorkflow = workflows[3] || workflows[0];

            var showWorkflow = function showWorkflow(workflow) {
                _this9.selectedWorkflow = workflow;

                _this9._showLoadingLayer();

                _this9._clearWorkflow();

                function toLocal(obj, prefix) {
                    if (!prefix) {
                        return obj;
                    }

                    var res = {};

                    for (var key in obj) {
                        if (key.startsWith(prefix)) {
                            res[key.substr(prefix.length)] = obj[key];
                        }
                    }

                    return res;
                }

                var serverFilter = new CkRepoWidgetFilter();
                var applyServerFilter = function applyServerFilter(selector, value) {
                    var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                    serverFilter.setSelector(selector, value, prefix);

                    fetch(kApiUrl + '?module_uoa=' + workflow.moduleUoa + '&action=' + kActionGetData, {
                        method: "POST",
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: serverFilter.getXWWWFormUrlencoded()
                    }).then(function (response) {
                        return response.json();
                    }).then(function (data) {
                        var _iteratorNormalCompletion10 = true;
                        var _didIteratorError10 = false;
                        var _iteratorError10 = undefined;

                        try {
                            for (var _iterator10 = workflows[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
                                var eWorkflow = _step10.value;

                                if (eWorkflow.moduleUoa === workflow.moduleUoa) {
                                    eWorkflow.data = toLocal(data, eWorkflow.dataPrefix);

                                    eWorkflow.tableProcessor(eWorkflow.data.table, eWorkflow.props);
                                }
                            }
                        } catch (err) {
                            _didIteratorError10 = true;
                            _iteratorError10 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion10 && _iterator10.return) {
                                    _iterator10.return();
                                }
                            } finally {
                                if (_didIteratorError10) {
                                    throw _iteratorError10;
                                }
                            }
                        }

                        plot.build(workflow.data.table);
                        table.build(workflow.data.table);
                    });
                };
                var isServerFilteringEnabled = false;
                var fetchDataInit = isServerFilteringEnabled ? null : {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: "all=yes"
                };

                var configApplier = function configApplier(config) {
                    plot.init({
                        plotContainer: _this9.dom.plotContainer,
                        tooltipContainer: _this9.dom.plotTooltipContainer,
                        width: kPlotWidth,
                        height: kPlotHeight,
                        margin: kPlotMargin,
                        defaultXDimensionIndex: workflow.defaultXDimensionIndex,
                        defaultYDimensionIndex: workflow.defaultYDimensionIndex,
                        defaultCDimensionIndex: workflow.defaultCDimensionIndex,
                        defaultSDimensionIndex: workflow.defaultSDimensionIndex,
                        isVariationXVisible: workflow.defaultXVariationVisible,
                        isVariationYVisible: workflow.defaultYVariationVisible,
                        filter: workflow.filter,
                        colorRange: workflow.colorRange,
                        sizeRange: workflow.sizeRange,
                        isSDimensionEnabled: workflow.isSDimensionEnabled
                    }, config);

                    table.init({
                        filter: workflow.filter,
                        tableContainer: _this9.dom.tableContainer
                    }, config);
                };

                var dataApplier = function dataApplier(data) {
                    CkRepoWidgetUtils.prepareFilters(workflow.config.selector, data.table, CkRepoWidgetConstants.kMetaFilterPrefix);
                    CkRepoWidgetUtils.prepareFilters(workflow.config.selector2, data.table);

                    // Set reference lines
                    {
                        for (let refLineId in workflow.refLines) {
                            let refLine = workflow.refLines[refLineId];
                            refLine.value = refLine.get_value(data.table);
                            if (workflow.props) {
                                refLine.delta = () => Number(workflow.props['__delta']);
                            }
                            refLine.visible = true;
                            refLine.delta_visible = true;
                        }
                        plot.setRefLines(workflow.refLines);
                    }

                    workflow.config.selector.forEach(function (selector, i) {
                        if (selector.values.length > 1) {
                            _this9._createValueSelector('ck-widget-filter-meta-selector-' + (i + 1), _this9.dom.filterMetaContainer, selector, workflow.filter.getSelectorValue(selector), function (selector, value) {
                                if (isServerFilteringEnabled) {
                                    applyServerFilter(selector, value, CkRepoWidgetConstants.kMetaFilterPrefix);
                                } else {
                                    _this9._applyFilterValue(selector, value, CkRepoWidgetConstants.kMetaFilterPrefix);
                                }
                            });
                        }
                    });

                    workflow.config.selector2.forEach(function (selector, i) {
                        if (selector.values.length > 1) {
                            _this9._createValueSelector('ck-widget-filter-2-selector-' + (i + 1), _this9.dom.filter2Container, selector, workflow.filter.getSelectorValue(selector), function (selector, value) {
                                if (isServerFilteringEnabled) {
                                    applyServerFilter(selector, value);
                                } else {
                                    _this9._applyFilterValue(selector, value);
                                }
                            });
                        }
                    });

                    if (workflow.config.selector_s) {
                        workflow.config.selector_s.forEach(function (selector, i) {
                            if (!selector.values || selector.values.length > 1) {
                                _this9._createValueSelector('ck-widget-filter-s-selector-' + (i + 1), _this9.dom.filterSContainer, selector, workflow.props[selector.key], function (selector, value) {
                                    workflow.props[selector.key] = value;

                                    workflow.tableProcessor(workflow.data.table, workflow.props);

                                    plot.setRefLines(workflow.refLines);

                                    plot.build(workflow.data.table);
                                    table.build(workflow.data.table);
                                });
                            }
                        });
                    }

                    plot.build(data.table);

                    _this9._createPlotSelector('x-axis-selector','Plot dimension X',
                        _this9.dom.plotSelectorContainer, plot.getXDimension(), dimension => plot.setXDimension(dimension),
                        // Variation
                        isVisible => plot.setXVariationVisibility(isVisible), plot.getXVariationVisibility()
                    );

                    _this9._createPlotSelector('y-axis-selector', 'Plot dimension Y',
                        _this9.dom.plotSelectorContainer, plot.getYDimension(), dimension => plot.setYDimension(dimension),
                        // Variation
                        isVisible => plot.setYVariationVisibility(isVisible), plot.getYVariationVisibility()
                    );

                    _this9._createPlotSelector('c-axis-selector', 'Plot color dimension',
                        _this9.dom.plotSelectorContainer, plot.getCDimension(), dimension => plot.setCDimension(dimension) );

                    if (workflow.isSDimensionEnabled) {
                        _this9._createPlotSelector('s-axis-selector', 'Point size dimension',
                        _this9.dom.plotSelectorContainer, plot.getSDimension(), dimension =>  plot.setSDimension(dimension) );
                    }

                    table.build(data.table);

                    _this9._hideLoadingLayer();
                };

                if (!workflow.config || !workflow.data) {
                    return fetch(kApiUrl + '?module_uoa=' + workflow.moduleUoa + '&action=' + kActionGetConfig).then(function (response) {
                        return response.json();
                    }).then(function (config) {
                        var _iteratorNormalCompletion11 = true;
                        var _didIteratorError11 = false;
                        var _iteratorError11 = undefined;

                        try {
                            for (var _iterator11 = workflows[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                                var eWorkflow = _step11.value;

                                if (eWorkflow.moduleUoa === workflow.moduleUoa) {
                                    eWorkflow.config = toLocal(config, eWorkflow.configPrefix);

                                    CkRepoWidgetUtils.prepareTableView(eWorkflow.config.table_view);
                                }
                            }
                        } catch (err) {
                            _didIteratorError11 = true;
                            _iteratorError11 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion11 && _iterator11.return) {
                                    _iterator11.return();
                                }
                            } finally {
                                if (_didIteratorError11) {
                                    throw _iteratorError11;
                                }
                            }
                        }

                        configApplier(workflow.config);
                    }).then(function () {
                        return fetch(kApiUrl + '?module_uoa=' + workflow.moduleUoa + '&action=' + kActionGetData, fetchDataInit);
                    }).then(function (response) {
                        return response.json();
                    }).then(function (data) {
                        var _iteratorNormalCompletion12 = true;
                        var _didIteratorError12 = false;
                        var _iteratorError12 = undefined;

                        try {
                            for (var _iterator12 = workflows[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                                var eWorkflow = _step12.value;

                                if (eWorkflow.moduleUoa === workflow.moduleUoa) {
                                    eWorkflow.data = toLocal(data, eWorkflow.dataPrefix);

                                    eWorkflow.tableProcessor(eWorkflow.data.table, eWorkflow.props);
                                }
                            }
                        } catch (err) {
                            _didIteratorError12 = true;
                            _iteratorError12 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion12 && _iterator12.return) {
                                    _iterator12.return();
                                }
                            } finally {
                                if (_didIteratorError12) {
                                    throw _iteratorError12;
                                }
                            }
                        }

                        dataApplier(workflow.data);
                    });
                } else {
                    setTimeout(function () {
                        configApplier(workflow.config);
                        dataApplier(workflow.data);
                    }, 100);
                }
            };

            this._initDom(d3.select(rootId), d3.select(headerId), d3.select(loadingLayerId));

            this.dom.sidePanelFiltersTabBtn.on('click', function () {
                return _this9._openSidePanelFiltersTab();
            });
            if (!this.isLocalRun) {
                this.dom.sidePanelInfoTabBtn.on('click', function () {
                    return _this9._openSidePanelInfoTab();
                });
            }
            this.dom.sidePanelCloseBtn.on('click', function () {
                return _this9._hideSidePanel();
            });

            this._createWorkflowSelector('ck-widget-filter-workflow-selector', this.dom.workflowSelectContainer, workflows, defaultWorkflow, function (workflow) {
                return showWorkflow(workflow);
            });

            showWorkflow(defaultWorkflow);
        }
    }, {
        key: '_applyFilterValue',
        value: function _applyFilterValue(selector, value) {
            var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

            var filter = this.selectedWorkflow.filter;

            filter.setSelector(selector, value, prefix);

            this.plot.setFilter(filter);
            this.table.setFilter(filter);
        }
    }, {
        key: '_showLoadingLayer',
        value: function _showLoadingLayer() {
            this.dom.loadingLayer.style('visibility', 'visible');
        }
    }, {
        key: '_hideLoadingLayer',
        value: function _hideLoadingLayer() {
            this.dom.loadingLayer.style('visibility', 'hidden');
        }
    }, {
        key: '_showSidePanel',
        value: function _showSidePanel() {
            var translateInterpolator = d3.interpolateString(this.dom.sidePanel.style('transform'), 'translate(-372px, 0px)');

            this.dom.sidePanel.transition().styleTween('transform', function () {
                return translateInterpolator;
            }).duration(750);
        }
    }, {
        key: '_hideSidePanel',
        value: function _hideSidePanel() {
            var translateInterpolator = d3.interpolateString(this.dom.sidePanel.style('transform'), 'translate(0px, 0px)');

            this.dom.sidePanel.transition().styleTween('transform', function () {
                return translateInterpolator;
            }).duration(750);
        }
    }, {
        key: '_openSidePanelFiltersTab',
        value: function _openSidePanelFiltersTab() {
            if (!this.isLocalRun) {
                this.dom.sidePanelFiltersTabBtn.attr('class', 'ck-repo-widget-side-panel-header-tab-btn ck-repo-widget-side-panel-header-tab-btn_active');
                this.dom.sidePanelInfoTabBtn.attr('class', 'ck-repo-widget-side-panel-header-tab-btn');
            }
            this.dom.sidePanelFiltersBody.style('display', 'block');
            this.dom.sidePanelInfoBody.style('display', 'none');

            this._showSidePanel();
        }
    }, {
        key: '_openSidePanelInfoTab',
        value: function _openSidePanelInfoTab() {
            this.dom.sidePanelInfoTabBtn.attr('class', 'ck-repo-widget-side-panel-header-tab-btn ck-repo-widget-side-panel-header-tab-btn_active');
            this.dom.sidePanelFiltersTabBtn.attr('class', 'ck-repo-widget-side-panel-header-tab-btn');
            this.dom.sidePanelInfoBody.style('display', 'block');
            this.dom.sidePanelFiltersBody.style('display', 'none');

            this._showSidePanel();
        }
    }, {
        key: '_createPlotSelector',
        value: function _createPlotSelector(id, name, root, defaultDimension, onChange) {
            var _this10 = this;

            var onChecked =      arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : null;
            var defaultChecked = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : false;

            var div = root.append('div').attr('class', 'ck-repo-widget-filter');

            var title = div.append('div').attr('class', 'ck-repo-widget-filter-title').text(name);

            var select = div.append('select').attr('id', id).attr('class', 'ck-repo-widget-select');

            select.selectAll('option').data(this.selectedWorkflow.config.dimensions)
                .enter().append('option')
                    .attr('value', (_, i) => i)
                    .property('selected', (d) => d === defaultDimension)
                    .text(d => d.name);

            if (onChecked) {
                var variation = div.append('div').attr('class', 'ck-repo-widget-filter-variation').on('click', function () {
                    var variationInput = d3.select('#' + id + '-variation');
                    var isChecked = !variationInput.property('checked');

                    variationInput.property('checked', isChecked);

                    onChecked(isChecked);
                });

                variation.append('input').attr('type', 'checkbox').attr('id', id + '-variation').property('checked', defaultChecked);

                variation.append('div').text('Variation');
            }


            var changeHandler = function changeHandler() {
                var selectDimensionIndex = d3.select('#' + id).property('value');
                var selectedDimension = _this10.selectedWorkflow.config.dimensions[selectDimensionIndex];

                onChange(selectedDimension);
            };

            select.on('change', changeHandler);

            return select;
        }
    }, {
        key: '_createValueSelector',
        value: function _createValueSelector(id, root, selector, defaultValue, onChange) {
            var div = root.append('div').attr('class', 'ck-repo-widget-filter');

            var title = div.append('div').attr('class', 'ck-repo-widget-filter-title').text(selector.name);

            var config = selector.config || {
                type: 'list'
            };

            switch (config.type) {
                case 'list':
                    {
                        var changeHandler = function changeHandler() {
                            var selectedIndex = d3.select('#' + id).property('value');
                            var selectedValue = selector.values[selectedIndex];

                            onChange(selector, selectedValue);
                        };

                        var select = div.append('select').attr('id', id).attr('class', 'ck-repo-widget-select').on('change', changeHandler);

                        select.selectAll('option').data(selector.values).enter().append('option').attr('value', function (_, i) {
                            return i;
                        }).property('selected', function (value) {
                            return value === defaultValue;
                        }).text(function (d) {
                            return d;
                        });

                        return select;
                    }

                case 'number':
                    {
                        var _changeHandler = function _changeHandler() {
                            var selectedValue = d3.select('#' + id).property('value');

                            onChange(selector, selectedValue);
                        };

                        var _select = div.append('input').attr('id', id).attr('class', 'ck-repo-widget-select ck-repo-widget-select_number').attr('type', 'number').attr('min', config.min).attr('max', config.max).attr('step', config.step).attr('value', defaultValue).on('input', _changeHandler);

                        return _select;
                    }
            }
        }
    }, {
        key: '_createWorkflowSelector',
        value: function _createWorkflowSelector(id, root, workflows, defaultWorkflow, onChange) {
            var _this11 = this;

            var changeHandler = function changeHandler() {
                var selectedIndex = d3.select('#' + id).property('value');

                onChange(workflows[selectedIndex]);
            };

            var old_repo = '<center><small><b>[ <a href="http://cKnowledge.org/repo-beta"><b>Other crowd-optimization scenarios</b></a> ]</b></small></center>';

            var select = root.append('div').html(old_repo).attr('class', 'ck-repo-widget-select_workflow-container').append('select').attr('id', id).attr('class', 'ck-repo-widget-select ck-repo-widget-select_workflow').on('change', changeHandler);

            select.selectAll('option').data(workflows).enter().append('option').attr('value', function (_, i) {
                return i;
            }).property('selected', function (d) {
                return d === defaultWorkflow;
            }).text(function (d) {
                return d.name;
            });

            root.append('div').attr('class', 'ck-repo-widget-side-panel-btn').html('<i class="fas fa-sliders-h"></i>').on('click', function () {
                return _this11._openSidePanelFiltersTab();
            });

            if (!this.isLocalRun) {
                root.append('div').attr('class', 'ck-repo-widget-side-panel-btn ck-repo-widget-side-panel-btn_info').html('<i class="fas fa-info"></i>').on('click', function () {
                    return _this11._openSidePanelInfoTab();
                });
            }

            return select;
        }
    }, {
        key: '_initDom',
        value: function _initDom(root, header, loadingLayer) {
            let sidePanelButtonStyle = (this.isLocalRun ? 'ck-repo-widget-side-panel-header-tab' : 'ck-repo-widget-side-panel-header-tab-btn');

            var sidePanel = root.append('div').attr('class', 'ck-repo-widget-side-panel');
            var sidePanelHeader = sidePanel.append('div').attr('class', 'ck-repo-widget-side-panel-header');
            var sidePanelTabsLayout = sidePanelHeader.append('div').attr('class', 'ck-repo-widget-side-panel-header-tabs-layout');
            var sidePanelFiltersTabBtn = sidePanelTabsLayout.append('div').attr('class', sidePanelButtonStyle).text('Filters');
            if (!this.isLocalRun) {
                var sidePanelInfoTabBtn = sidePanelTabsLayout.append('div').attr('class', sidePanelButtonStyle).text('Info');
            }
            var sidePanelCloseBtn = sidePanelHeader.append('div').attr('class', 'ck-repo-widget-side-panel-header-close-btn').html('<i class="fa fa-times"></i>');
            var sidePanelFiltersBody = sidePanel.append('div').attr('class', 'ck-repo-widget-side-panel-body');
            var sidePanelInfoBody = sidePanel.append('div').attr('class', 'ck-repo-widget-side-panel-body').html(this._getInfoHtml());

            this.dom = {
                root: root.attr('class', 'ck-repo-widget'),
                loadingLayer: loadingLayer,

                sidePanel: sidePanel,
                sidePanelHeader: sidePanelHeader,
                sidePanelTabsLayout: sidePanelTabsLayout,
                sidePanelFiltersTabBtn: sidePanelFiltersTabBtn,
                sidePanelInfoTabBtn: sidePanelInfoTabBtn,
                sidePanelCloseBtn: sidePanelCloseBtn,
                sidePanelFiltersBody: sidePanelFiltersBody,
                sidePanelInfoBody: sidePanelInfoBody,

                workflowSelectContainer: header.attr('class', 'ck-repo-widget-workflow-panel'),
                plotSelectorContainer: sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters'),
                filterSContainer: sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters'),
                filterMetaContainer: sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters'),
                filter2Container: sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters'),
                plotContainer: root.append('div').attr('class', 'ck-repo-widget-plot-container'),
                plotTooltipContainer: root.append('div').attr('class', 'ck-repo-widget-plot-tooltip-container'),
                tableContainer: root.append('div').attr('class', 'ck-repo-widget-table-container')
            };
        }
    }, {
        key: '_clearWorkflow',
        value: function _clearWorkflow() {
            var dom = this.dom;

            dom.filterMetaContainer.selectAll('*').remove();
            dom.filter2Container.selectAll('*').remove();
            dom.filterSContainer.selectAll('*').remove();
            dom.plotContainer.selectAll('*').remove();
            dom.plotSelectorContainer.selectAll('*').remove();
            dom.plotTooltipContainer.selectAll('*').remove();
            dom.tableContainer.selectAll('*').remove();
        }
    }, {
        key: '_getInfoHtml',
        value: function _getInfoHtml() {
            return '\n        <div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container ck-repo-widget-info-value-container">\n                    <div class="ck-repo-widget-info-title">Participated</div>\n                    <a href="https://github.com/ctuning/ck/wiki/Crowdsourcing-optimization" class="ck-repo-widget-info-github-link-container">\n                        <i class="fab fa-github"></i>\n                        <div class="ck-repo-widget-info-link ck-repo-widget-info-link_small">How to participate</div>\n                    </a>\n                </div>\n                <div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=experiment.user" class="ck-repo-widget-info-link">Users</a>\n                        <div class="ck-repo-widget-info-value">995</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform" class="ck-repo-widget-info-link">Platforms</a>\n                        <div class="ck-repo-widget-info-value">1,030</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.os" class="ck-repo-widget-info-link">OS</a>\n                        <div class="ck-repo-widget-info-value">299</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.cpu" class="ck-repo-widget-info-link">CPU</a>\n                        <div class="ck-repo-widget-info-value">310</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.gpu" class="ck-repo-widget-info-link">GPU</a>\n                        <div class="ck-repo-widget-info-value">124</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.gpgpu" class="ck-repo-widget-info-link">GPGPU</a>\n                        <div class="ck-repo-widget-info-value">27</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="http://cknowledge.org/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.nn" class="ck-repo-widget-info-link">NN</a>\n                        <div class="ck-repo-widget-info-value">2</div>\n                    </div>\n                </div>\n            </div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container">\n                    <div class="ck-repo-widget-info-title">Motivation</div>\n                </div>\n                <div>\n                    <a href="https://www.slideshare.net/GrigoriFursin/adapting-to-a-cambrian-aiswhw-explosion-with-open-codesign-competitions-and-collective-knowledge" class="ck-repo-widget-info-link ck-repo-widget-info-link_divided">Adapting to a Cambrian AI/SW/HW explosion with open co-design competitions and Collective Knowledge</a>\n                    <div class="ck-repo-widget-info-link">ReQuEST-cfp-asplos2018</div>\n                </div>\n            </div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container">\n                    <div class="ck-repo-widget-info-title">Papers</div>\n                </div>\n                <div>\n                    <a href="https://arxiv.org/abs/1801.08024" class="ck-repo-widget-info-link ck-repo-widget-info-link_divided">1. A Collective Knowledge workflow for collaborative research into multi-objective autotuning and machine learning techniques</a>\n                    <a href="https://arxiv.org/abs/1506.06256" class="ck-repo-widget-info-link ck-repo-widget-info-link_divided">2. Collective Mind, Part II: Towards Performance- and Cost-Aware Software Engineering as a Natural Science</a>\n                    <a href="https://www.researchgate.net/publication/304010295_Collective_Knowledge_Towards_RD_Sustainability" class="ck-repo-widget-info-link">3. Collective Knowledge: Towards R&D Sustainability</a>\n                </div>\n            </div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container">\n                    <div class="ck-repo-widget-info-title">Helpful links</div>\n                </div>\n                <div>\n                    <a href="https://play.google.com/store/apps/details?id=openscience.crowdsource.video.experiments&hl=en" class="ck-repo-widget-info-link">Android application (Google PalyStore)</a>\n                    <a href="http://cknowledge.org/repo/web.php?wcid=42b9a1221eb50259:collective_training_set" class="ck-repo-widget-info-link">Collective training set</a>\n                    <a href="http://cknowledge.org/ai" class="ck-repo-widget-info-link">Unified AI</a>\n                </div>\n            </div>\n        </div>\n        ';
        }
    }]);

    return CkRepoWdiget;
}();
