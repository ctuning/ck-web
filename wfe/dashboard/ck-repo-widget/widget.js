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
        if (typeof dimension === 'undefined') { return null; }
        return dimension.from_meta ? dimension.key : dimension.view_key || (dimension.reverse ? dimension.key + '#max' : dimension.key + '#min');
    },

    getVariationMinKey: function getVariationMinKey(dimension) {
        if (typeof dimension === 'undefined') { return null; }
        return dimension.key + '#min';
    },

    getVariationMaxKey: function getVariationMaxKey(dimension) {
        if (typeof dimension === 'undefined') { return null; }
        return dimension.key + '#max';
    },

    scrollToElement: function scrollToElement(element) {
        scrollTo(0, element.getBoundingClientRect().top - d3.select('.navbar').node().getBoundingClientRect().bottom);
    },

    scrollToTop: function scrollToTop() {
        scrollTo(0, 0);
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

            if (values.length > 1 || values.length == 0) {
                values.unshift(CkRepoWidgetConstants.kFilterAllValue);
            }

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
                        let classical_energy = run['vqe_input']['classical_energy'];

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

        benchmarkTableProcessor: function benchmarkTableProcessor(table, workflow) {
            CkRepoWidgetUtils.prepareTable(table);

            var delta = workflow.props['__delta'];
            var prob = workflow.props['__prob'];
            var which_fun_key = workflow.props['__fun_key'];
            var which_time_key = workflow.props['__time_key'];

            var _iteratorNormalCompletion9 = true;
            var _didIteratorError9 = false;
            var _iteratorError9 = undefined;

            try {
                for (var _iterator9 = table[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                    var row = _step9.value;

                    var _CkRepoWidgetUtils$qu2 = CkRepoWidgetUtils.quantum.benchmark_list_of_runs(row['runs'], delta, prob, which_fun_key, which_time_key),
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

        get_exact_answer_molecule: function get_exact_answer_molecule(data, molecule) {
            let values = [];
            for(let d of data) {
                if (d["_molecule"] != molecule) {
                    continue;
                }

                for(let r of d["runs"]) {
                    return r["vqe_input"]["classical_energy"];
                }
            }
            return null;
        },

        get_exact_answer_qiskit_hydrogen: function get_exact_answer_qiskit_hydrogen(data) {
            return CkRepoWidgetUtils.quantum.get_exact_answer_molecule(data, "qiskit_hydrogen")
        },

        get_exact_answer_hydrogen: function get_exact_answer_hydrogen(data) {
            return CkRepoWidgetUtils.quantum.get_exact_answer_molecule(data, "hydrogen")
        },

        get_exact_answer_helium: function get_exact_answer_helium(data) {
            return CkRepoWidgetUtils.quantum.get_exact_answer_molecule(data, "helium")
        }
    },

    mlperf: {
        get_reference_accuracy_resnet: function get_reference_accuracy_resnet(data) {
            return 76.456
        },
        get_reference_accuracy_mobilenet: function get_reference_accuracy_mobilenet(data) {
            return 71.676
        },
        get_reference_accuracy_ssd_large: function get_reference_accuracy_ssd_large(data) {
            return 20.000
        },
        get_reference_accuracy_ssd_small: function get_reference_accuracy_ssd_small(data) {
            return 23.000
        },
        get_reference_accuracy_gnmt: function get_reference_accuracy_gnmt(data) {
            return 23.900
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
    },

    filterByPrefix: function filterByPrefix(obj, prefix) {
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
        value: function hash(value, convertToString = false) {
            if (convertToString) {
                value = String(value);
            }

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
    }, {
        key: 'prepareValues',
        value: function prepareValues(values, convertToString) {
            for (let v of values) {
                this.hash(v, convertToString);
            }
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
            this.tbody = tbody;

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
            let gCells = gRows.selectAll('td').data( curRow => columns.map(curCol => { return { row:curRow, column: curCol }; } ) )
                .enter().append('td')
                    .attr('class', 'ck-repo-widget-td')
                    .each( function(d) { _this._fillCell(d3.select(this), d.column, d.row); })

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
                return '<div class=\'ck-repo-widget-cmd-btn\' onclick=\'CkRepoWidgetUtils.showMessageBox("' + CkRepoWidgetUtils.encode(item.cmd) + '");\'><span class=\'ck-repo-widget-cmd-btn-label\'>' + item.title + '</span></div>';
            }

            if (!!item.key) {
                return '<b>' + item.key + '</b>: ' + item.value;
            }

            if (!!item.list) {
                if (!!item.json) {
                    return '<div class=\'ck-repo-widget-cmd-btn\' onclick=\'CkRepoWidgetUtils.showMessageBox("' + CkRepoWidgetUtils.encode(item.json) + '");\'><span class=\'ck-repo-widget-cmd-btn-label\'>View JSON</span></div><br>' + this._getCellHtml(item.list);
                }

                return this._getCellHtml(item.list);
            }

            return item;
        }
    }, {
        key: '_fillCell',
        value: function _fillCell(node, column, row) {
            if (column.key === CkRepoWidgetConstants.kNumberKey) {
                node.append('span')
                    .attr('class', 'ck-repo-widget-cmd-btn ck-repo-widget-cmd-btn-label')
                    .text('#' + row[column.key])
                    .on('click', d => {
                        this.tableConfig.pointSelectionCallback( row[column.key] );
                        CkRepoWidgetUtils.scrollToTop();
                    })
            } else {
                node.html( this._getCellHtml( this._getCellValue(row, column) ) )
            }
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
    }, {
        key: 'onPointSelect',
        value: function onPointSelect(id) {
            this.tbody.selectAll('tr').attr('class', d => (d[CkRepoWidgetConstants.kNumberKey] == id ? 'ck-repo-widget-tr-selected' : 'ck-repo-widget-tr' ))
        }
    }]);

    return CkRepoWidgetTable;
}();

class CkRepoWidgetMarker {
    constructor() {
        this.markerCache = {};
    }

    getMarker(shapeSet, setIdx, markerIdx) {
        if (typeof setIdx === 'undefined' || setIdx >= Object.keys(shapeSet).length) {
            setIdx = 0;
        }

        let setKey = Object.keys(shapeSet)[setIdx];

        if (markerIdx >= shapeSet[setKey].length) {
            markerIdx = shapeSet[setKey].length - 1;
        }

        return this.marker( shapeSet[setKey][markerIdx] );
    }

    marker(name) {
        if (typeof this.markerCache[name] !== 'undefined') {
            return this.markerCache[name];
        }

        let c = d3.path();
        if (name === 'triangle') {
            c.moveTo(-1, 1);
            c.lineTo(0, -1);
            c.lineTo(1, 1);
            c.closePath();
        } else if (name === 'rect') {
            c.rect(-1, -1, 2, 2);
        } else if (name === 'pentagon') {
            let c1 = 0.31;
            let c2 = 0.81;
            let s1 = 0.95;
            let s2 = 0.59;
            c.moveTo(0, -1);
            c.lineTo(s1, -c1);
            c.lineTo(s2, c2);
            c.lineTo(-s2, c2);
            c.lineTo(-s1, -c1);
            c.closePath();
        } else if (name === 'hexagon') {
            c.moveTo(1, 0);
            c.lineTo(0.5, -1);
            c.lineTo(-0.5, -1);
            c.lineTo(-1, 0);
            c.lineTo(-0.5, 1);
            c.lineTo(0.5, 1);
            c.closePath();
        } else if (name === 'triangle_down') {
            c.moveTo(-1, -1);
            c.lineTo(0, 1);
            c.lineTo(1, -1);
            c.closePath();
        } else if (name === 'diamond') {
            c.moveTo(-1, 0);
            c.lineTo(0, -1);
            c.lineTo(1, 0);
            c.lineTo(0, 1);
            c.closePath();
        } else if (name === 'star') {
            let c1 = 0.31;
            let c2 = 0.81;
            let s1 = 0.95;
            let s2 = 0.59;
            c.moveTo(0, -1);
            c.lineTo(s2, c2);
            c.lineTo(-s1, -c1);
            c.lineTo(s1, -c1);
            c.lineTo(-s2, c2);
            c.closePath();
        } else if (name === 'circle') {
            c.moveTo(1, 0);
            c.arc(0, 0, 1, 0, 2 * Math.PI);
        } else if (name === 'sector_1_4') {
            c.moveTo(0, -1);
            c.lineTo(0, 0);
            c.lineTo(1, 0)
            c.arc(0, 0, 1, 0, -0.5 * Math.PI, true);
        } else if (name === 'sector_1_3') {
            c.moveTo(/* -1/2 */ -0.50, /* -sqrt(3)/2 */ -0.86);
            c.lineTo(0, 0);
            c.lineTo(1, 0);
            c.arc(0, 0, 1, 0, /* -2/3 */ -0.66 * Math.PI, true);
        } else if (name === 'sector_1_2') {
            c.moveTo(-1, 0);
            c.lineTo(1, 0)
            c.arc(0, 0, 1, 0, -1 * Math.PI, true);
        } else if (name === 'sector_3_4') {
            c.moveTo(0, 1);
            c.lineTo(0, 0)
            c.lineTo(1, 0)
            c.arc(0, 0, 1, 0, -1.5 * Math.PI, true);
        } else if (name === 'vline') {
            c.moveTo(0, -1);
            c.lineTo(0, 1);
        } else if (name === 'hline') {
            c.moveTo(-1, 0);
            c.lineTo(1, 0);
        } else if (name === 'cross') {
            c.moveTo(-1, -1);
            c.lineTo(1, 1);
            c.moveTo(1, -1);
            c.lineTo(-1, 1);
        } else if (name === 'plus') {
            c.moveTo(0, -1);
            c.lineTo(0, 1);
            c.moveTo(-1, 0);
            c.lineTo(1, 0);
        } else if (name === 'dot') {
            c.moveTo(0.3, 0);
            c.arc(0, 0, 0.3, 0, 2 * Math.PI);
        } else {
            c = null;
        }

        if (c != null) {
            this.markerCache[name] = c.toString();
            return this.markerCache[name];
        } else {
            return null;
        }
    }
}

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
            this.selectedPointId = null;

            this.markerShapes = new CkRepoWidgetMarker();
            this.markerDimensionSetIdx = 0;
            this.markerOverlayDimensionSetIdx = 0;

            /*
            this.centerButton = plotContainer.append('div')
                .attr('class', 'ck-repo-widget-plot-center-btn')
                .on('click', () => {
                    this._fitScale();
                });
            */

            this.xDimension = this.dataConfig.dimensions.find(d => d.key === this.plotConfig.xDimension);
            this.yDimension = this.dataConfig.dimensions.find(d => d.key === this.plotConfig.yDimension);
            this.cDimension = this.dataConfig.dimensions.find(d => d.key === this.plotConfig.colorDimension);
            this.sDimension = this.dataConfig.dimensions.find(d => d.key === this.plotConfig.sizeDimension);
            this.markerDimension = this.dataConfig.dimensions.find(d => d.key === this.plotConfig.markerDimension);
            this.markerOverlayDimension = this.dataConfig.dimensions.find(d => d.key === this.plotConfig.markerOverlayDimension);

            this.xHasher = new CkRepoWidgetHasher();
            this.yHasher = new CkRepoWidgetHasher();
            this.cHasher = new CkRepoWidgetHasher();
            this.sHasher = new CkRepoWidgetHasher();
            this.markerHasher = new CkRepoWidgetHasher();
            this.markerOverlayHasher = new CkRepoWidgetHasher();

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
            this.getValue = function(row, dimension, hasher, convertToString = false) {
                return hasher.hash(row[CkRepoWidgetUtils.getAxisKey(dimension)], convertToString);
            }
            this.markerValue = row => this.getValue(row, this.markerDimension, this.markerHasher, true);
            this.markerOverlayValue = row => this.getValue(row, this.markerOverlayDimension, this.markerOverlayHasher, true);

            this.valueToDisplay = function valueToDisplay(dimension, value) {
                var tView = _this3.dataConfig.table_view.find(function (view) {
                    if (dimension) {
                        return view.key.startsWith(dimension.key);
                    } else {
                        return false;
                    }
                });

                if (!!tView && tView.format) {
                    return CkRepoWidgetUtils.formatNumber(value, tView.format);
                }

                return value;
            };

            this.xValueToDisplay = function (row) {
                return _this3.valueToDisplay(_this3.xDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.xDimension)]);
            };
            this.yValueToDisplay = function (row) {
                return _this3.valueToDisplay(_this3.yDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.yDimension)]);
            };
            this.cValueToDisplay = function (row) {
                return _this3.valueToDisplay(_this3.cDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.cDimension)]);
            };
            this.sValueToDisplay = function (row) {
                return _this3.valueToDisplay(_this3.sDimension, row[CkRepoWidgetUtils.getAxisKey(_this3.sDimension)]);
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

            this.getDataUniqueValues = function (data, valueGetter) {
                let values = data.map( row => valueGetter(row) )
                    .filter( val => !Number.isNaN(val) );
                let unique = values.filter(function(item, i, ar){ return ar.indexOf(item) === i; });
                unique.sort();
                return unique;
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

            this._updateMarkerHasher = function() {
                let values = this.getDataUniqueValues(this.rawPointsData, row => row[CkRepoWidgetUtils.getAxisKey(this.markerDimension)]);
                this.markerHasher.reset();
                this.markerHasher.prepareValues(values, true);
            }

            this._updateMarkerOverlayHasher = function() {
                let values = this.getDataUniqueValues(this.rawPointsData, row => row[CkRepoWidgetUtils.getAxisKey(this.markerOverlayDimension)]);
                this.markerOverlayHasher.reset();
                this.markerOverlayHasher.prepareValues(values, true);
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

            this._updateMarkerHasher();
            this._updateMarkerOverlayHasher();

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
        key: 'getMarkerDimension',
        value: function getMarkerDimension() {
            return this.markerDimension;
        }
    }, {
        key: 'getMarkerDimensionSetIdx',
        value: function getMarkerDimensionSetIdx() {
            return this.markerDimensionSetIdx;
        }
    }, {
        key: 'setMarkerDimensionSetIdx',
        value: function setMarkerDimensionSetIdx(newSetIdx) {
            this.markerDimensionSetIdx = newSetIdx;
            this._applyPoints(["marker"]);
        }
    }, {
        key: 'setMarkerDimension',
        value: function setMarkerDimension(dimension) {
            this.markerDimension = dimension;
            this._updateMarkerHasher();
            this._applyPoints(["marker"]);
        }
    }, {
        key: 'getMarkerOverlayDimension',
        value: function getMarkerOverlayDimension() {
            return this.markerOverlayDimension;
        }
    }, {
        key: 'setMarkerOverlayDimension',
        value: function setMarkerOverlayDimension(dimension) {
            this.markerOverlayDimension = dimension;
            this._updateMarkerOverlayHasher();
            this._applyPoints(["markerOverlay"]);
        }
    }, {
        key: 'getMarkerOverlayDimensionSetIdx',
        value: function getMarkerOverlayDimensionSetIdx() {
            return this.markerOverlayDimensionSetIdx;
        }
    }, {
        key: 'setMarkerOverlayDimensionSetIdx',
        value: function setMarkerOverlayDimensionSetIdx(newSetIdx) {
            this.markerOverlayDimensionSetIdx = newSetIdx;
            this._updateMarkerOverlayHasher();
            this._applyPoints(["markerOverlay"]);
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

                _this4._applyPoints(["pos"]);
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

            // draw lines
            var lines = gPoints.selectAll('.ck-repo-widget-plot-line').data(linesData).enter().append("path").attr('class', 'ck-repo-widget-plot-line');

            // x-axis
            var gX = svg.append('g').attr('class', 'ck-repo-widget-plot-axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);

            gX.append('text').attr('class', 'ck-repo-widget-plot-axis-label').attr('x', width).attr('y', -6).style('text-anchor', 'end').style('fill', 'black').text(this.xDimension.name);

            // y-axis
            var gY = svg.append('g').attr('class', 'ck-repo-widget-plot-axis').call(yAxis);

            gY.append('text').attr('class', 'ck-repo-widget-plot-axis-label').attr('transform', 'rotate(-90)').attr('y', 6).attr('dy', '.71em').style('text-anchor', 'end').style('fill', 'black').text(this.yDimension.name);

            applyScale(xScale, yScale);

            this._applyPoints();
            this._applyColorDimension();
            this._applyXVariationVisibility();
            this._applyYVariationVisibility();
            this._applyLinesVisibility();
            this._applyRefLines();
        }
    }, {
        key: '_applyPoints',
        value: function (dirtyFlags = null) {
            let thisPlot = this;

            let mouseoverHandler = function mouseoverHandler(d) {
                let id = d[CkRepoWidgetConstants.kNumberKey];

                if (!thisPlot.selectedPointId || thisPlot.selectedPointId === id) {
                    thisPlot._showTooltip(true, d, [ d3.event.pageX, d3.event.pageY ]);
                }
            };
            let mouseoutHandler = function mouseoutHandler(d) {
                if (thisPlot.selectedPointId === null) {
                    thisPlot._showTooltip(false);
                }
            };
            let clickHandler = function clickHandler(d) {
                let id = d[CkRepoWidgetConstants.kNumberKey];
                if (thisPlot.selectedPointId === id) {
                    thisPlot.plotConfig.pointSelectionCallback(null);
                } else {
                    thisPlot.plotConfig.pointSelectionCallback( d[CkRepoWidgetConstants.kNumberKey] );
                    thisPlot._showTooltip(true, d, [d3.event.pageX, d3.event.pageY]);
                }
            };

            let points = this.gPoints.selectAll('.ck-repo-widget-plot-dot').data(this.pointsData);

            let isMarkersActive = typeof this.markerDimension !== 'undefined';
            let isMarkerOverlaysActive = typeof this.markerOverlayDimension !== 'undefined';

            let pointOverlays = (isMarkerOverlaysActive ? this.gPoints.selectAll('.ck-repo-widget-plot-dot-overlay').data(this.pointsData) : null);

            // Create
            if (isMarkersActive) {
                points.enter()
                    .append('path')
                        .attr('class', 'ck-repo-widget-plot-dot')
                        .on('mouseover', mouseoverHandler)
                        .on('mouseout', mouseoutHandler)
                        .on('click', clickHandler)
                points.exit().remove();
            } else {
                points.enter()
                    .append('circle')
                        .attr('class', 'ck-repo-widget-plot-dot')
                        .on('mouseover', mouseoverHandler)
                        .on('mouseout', mouseoutHandler)
                        .on('click', clickHandler)
                points.exit().remove();
            }

            // Create (overlays)
            if (pointOverlays) {
                pointOverlays.enter()
                    .append('path')
                        .attr('class', 'ck-repo-widget-plot-dot-overlay')
                        .attr('stroke', 'black')
                        .attr('stroke-width', '0.2')
                        .style('pointer-events', 'all');
                pointOverlays.exit().remove();
            }

            // Pos & Scale
            if (!dirtyFlags || dirtyFlags.includes("pos") || dirtyFlags.includes("size")) {
                let sizeMapper = d3.scaleLinear().domain([d3.min(this.pointsData, this.sValue), d3.max(this.pointsData, this.sValue)]).range(this.sizeRange);
                let pointSize = (this.plotConfig.sizeDimension !== ''
                    ? (row => sizeMapper(this.sValue(row)))
                    : (row => CkRepoWidgetConstants.kDefaultPointRadius)
                );

                let translateFn = d => 'translate(' + this.xScale(this.xValue(d)) + ', ' + this.yScale(this.yValue(d)) + ')';
                let scaleFn = d => 'scale(' + pointSize(d) + ')';

                if (isMarkersActive) {
                    points.attr('transform', d => translateFn(d) + ' ' + scaleFn(d));
                } else {
                    points
                        .attr('cx', d => this.xScale(this.xValue(d)))
                        .attr('cy', d => this.yScale(this.yValue(d)))
                        .attr('r', d => pointSize(d))
                }

                if (pointOverlays){
                    pointOverlays.attr('transform', d => translateFn(d) + ' ' + scaleFn(d));
                }

                if (this.selectedPointId) {
                    this._showTooltip(false);
                }
            }

            if (!dirtyFlags || dirtyFlags.includes("select")) {
                let strokeWidth = (isMarkersActive ? 0.2 : 2);
                points
                    .attr('stroke', d => (d[CkRepoWidgetConstants.kNumberKey] == this.selectedPointId ? '#0000FF' : 'none'))
                    .attr('stroke-width', d => (d[CkRepoWidgetConstants.kNumberKey] == this.selectedPointId ? strokeWidth : 0));
            }

            // Color
            if (!dirtyFlags || dirtyFlags.includes("color") || dirtyFlags.includes("select")) {
                let color = d3.scaleLinear().domain(CkRepoWidgetUtils.getColorDomain(this.colorRange.length, this.colorBounds)).range(this.colorRange);

                function hightlightIfSelected(value, selectedPointId, row) {
                    if (row[CkRepoWidgetConstants.kNumberKey] === selectedPointId) {
                        return '#FFFF00';
                    } else {
                        return value;
                    }
                }

                points.style('fill', row => hightlightIfSelected( color(this.cValue(row)), this.selectedPointId, row ) );
            }

            // Visibility
            if (!dirtyFlags || dirtyFlags.includes("visibility")) {
                points.style('visibility', row => (this.filter.isRowVisible(row) ? 'visible' : 'hidden'));
                if (pointOverlays) {
                    pointOverlays.style('visibility', row => (this.filter.isRowVisible(row) ? 'visible' : 'hidden'));
                }
            }

            // Marker
            if (isMarkersActive) {
                if (!dirtyFlags || dirtyFlags.includes("marker")) {
                    points.attr('d', d => this.markerShapes.getMarker(this.plotConfig.markerDimensionSets, this.markerDimensionSetIdx, this.markerValue(d)) );
                }

                if (pointOverlays) {
                    // Marker overlay
                    if (!dirtyFlags || dirtyFlags.includes("markerOverlay")) {
                        pointOverlays.attr('d', d => this.markerShapes.getMarker(this.plotConfig.markerOverlayDimensionSets, this.markerOverlayDimensionSetIdx, this.markerOverlayValue(d)) );
                    }
                }
            }
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

            this._applyPoints(["color"]);

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
            this._applyPoints(["size"]);
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
            this._applyPoints(["visibility"]);
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

            // clear existing legend
            this.svg.select('.ck-repo-widget-plot-axis_color').remove();

            // check if color band would make sense
            {
                let row = this.pointsData[0];
                if ( ! CkRepoWidgetUtils.isNumberAndFinite( row[CkRepoWidgetUtils.getAxisKey(this.cDimension)] ) ) {
                    return;
                }
            }

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
            let whiteBg = '#f7f9fa'; // todo: hack, this is background-color of body
            let textXOffsetFromAxis = -5;
            let deltaLineVisible = d => d.visible && d.delta_visible;
            let linesIsInBounds = v => 0 < this.yScale(v) && this.yScale(v) < this.plotConfig.height;

            let data = Object.values(this.refLines);

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
                let line = this.gPoints.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
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
                labelBg = this.svg.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                labelBg.enter().append('rect')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('fill', whiteBg)
                    .merge(labelBg)
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible));
                labelBg.exit().remove();
            }

            // Upper label background
            let upperLabelBg = null;
            {
                let className = '-upper-label-bg';
                upperLabelBg = this.svg.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                upperLabelBg.enter().append('rect')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('fill', whiteBg)
                upperLabelBg.exit().remove();
            }

            // Lower label background
            let lowerLabelBg = null;
            {
                let className = '-lower-label-bg';
                lowerLabelBg = this.svg.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                lowerLabelBg.enter().append('rect')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('fill', whiteBg)
                lowerLabelBg.exit().remove();
            }

            // Label
            var labelBBoxes = null;
            {
                let className = '-label';
                let label = this.svg.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                label.enter().append('text')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('dy', '0.5em')
                        .attr('x', d => textXOffsetFromAxis)
                        .style('text-anchor', 'end')
                        .text(d => d.name)
                    .merge(label)
                        .attr('y', d => this.yScale(d.value))
                        .style('visibility', d => toVisibility(isDimOk(d) && d.visible && linesIsInBounds(d.value) ));
                label.exit().remove();

                labelBBoxes = label.nodes().map(n => n.getBBox());
            }

            // Upper line
            {
                let className = '-upper-line';
                let upperLine = this.gPoints.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                upperLine.enter().append("line")
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('x1', 0)
                        .attr('x2', this.plotConfig.width)
                        .style('stroke', 'black')
                        .attr('stroke-dasharray', '10')
                    .merge(upperLine)
                        .attr('y1', d => this.yScale(d.value + d.delta()))
                        .attr('y2', d => this.yScale(d.value + d.delta()))
                        .style('visibility', d => toVisibility(isDimOk(d) && deltaLineVisible(d) ));
                upperLine.exit().remove();
            }

            // Lower line
            {
                let className = '-lower-line';
                let lowerLine = this.gPoints.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                lowerLine.enter().append("line")
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('x1', 0)
                        .attr('x2', this.plotConfig.width)
                        .style('stroke', 'black')
                        .attr('stroke-dasharray', '10')
                    .merge(lowerLine)
                        .attr('y1', d => this.yScale(d.value - d.delta()))
                        .attr('y2', d => this.yScale(d.value - d.delta()))
                        .style('visibility', d => toVisibility(isDimOk(d) && deltaLineVisible(d) ));
                lowerLine.exit().remove();
            }

            // Upper label
            let upperLabelBBoxes = null;
            {
                let className = '-upper-label';
                let upperLabel = this.svg.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                upperLabel.enter().append('text')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('dy', '0.5em')
                        .attr('x', textXOffsetFromAxis)
                        .style('text-anchor', 'end')
                        .text(d => d.name + ' +Δ')
                    .merge(upperLabel)
                        .attr('y', d => this.yScale(d.value + d.delta()))
                        .style('visibility', function(d,i) { return toVisibility( isDimOk(d) && deltaLineVisible(d) && !rectsIntersects(labelBBoxes[i], this.getBBox()) && linesIsInBounds(d.value + d.delta()) ); } );
                upperLabel.exit().remove();

                upperLabelBBoxes = upperLabel.nodes().map(n => n.getBBox());
            }

            // Lower label
            let lowerLabelBBoxes = null;
            {
                let className = '-lower-label';
                let lowerLabel = this.svg.selectAll('.ck-repo-widget-plot-refline' + className).data(data);
                lowerLabel.enter().append('text')
                        .attr('class', 'ck-repo-widget-plot-refline' + className)
                        .attr('dy', '0.5em')
                        .attr('x', textXOffsetFromAxis)
                        .style('text-anchor', 'end')
                        .text(d => d.name + ' -Δ')
                    .merge(lowerLabel)
                        .attr('y', d => this.yScale(d.value - d.delta()))
                        .style('visibility', function(d,i) { return toVisibility(isDimOk(d) && deltaLineVisible(d) && !rectsIntersects(labelBBoxes[i], this.getBBox()) && linesIsInBounds(d.value - d.delta()) ); });
                lowerLabel.exit().remove();

                lowerLabelBBoxes = lowerLabel.nodes().map(n => n.getBBox());
            }

            let labelMargin = {left: 5, right: 5, top: 5, bottom: 5};
            labelBg
                .attr('x', (_,i) => -1 * this.plotConfig.margin.left)
                .attr('y', (_,i) => labelBBoxes[i].y - labelMargin.top)
                .attr('width', (_,i) => this.plotConfig.margin.left) //labelBBoxes[i].x + labelBBoxes[i].width + labelMargin.right)
                .attr('height', (_,i) => labelBBoxes[i].height + labelMargin.bottom + labelMargin.top);

            upperLabelBg
                .attr('x', (_,i) => -1 * this.plotConfig.margin.left)
                .attr('y', (_,i) => upperLabelBBoxes[i].y - labelMargin.top)
                .attr('width', (_,i) => this.plotConfig.margin.left) //upperLabelBBoxes[i].x + upperLabelBBoxes[i].width + labelMargin.right)
                .attr('height', (_,i) => upperLabelBBoxes[i].height + labelMargin.bottom + labelMargin.top)
                .style('visibility', function(d,i) { return toVisibility(isDimOk(d) && deltaLineVisible(d) && !rectsIntersects(labelBBoxes[i], this.getBBox()) && linesIsInBounds(d.value + d.delta()) ); } );

            lowerLabelBg
                .attr('x', (_,i) => -1 * this.plotConfig.margin.left)
                .attr('y', (_,i) => lowerLabelBBoxes[i].y - labelMargin.top)
                .attr('width', (_,i) => this.plotConfig.margin.left) //labelBBoxes[i].x + labelBBoxes[i].width + labelMargin.right)
                .attr('height', (_,i) => labelBBoxes[i].height + labelMargin.bottom + labelMargin.top)
                .style('visibility', function(d,i) { return toVisibility(isDimOk(d) && deltaLineVisible(d) && !rectsIntersects(labelBBoxes[i], this.getBBox()) && linesIsInBounds(d.value - d.delta())); } );
        }
    }, {
        key: '_showTooltip',
        value: function _showTooltip(isShow, updateHintForPointId = null, pos = null) {
            if (isShow) {
                this.tooltip
                    .style('pointer-events', 'all')
                    .transition()
                    .duration(200)
                    .style('opacity', .9);
            } else {
                this.tooltip
                    .style('pointer-events', 'none')
                    .transition()
                    .duration(100)
                    .style('opacity', 0);
            }

            if (updateHintForPointId) {
                console.log(updateHintForPointId);
                this.tooltip.call( this._fillTooltipHints, this, updateHintForPointId );
            }

            if (pos) {
                console.log(pos);
                this.tooltip
                    .style('left', pos[0] + 15 + 'px')
                    .style('top', pos[1] + 5 + 'px');
            }
        }
    }, {
        key: '_fillTooltipHints',
        value: function _fillTooltipHints(tooltip, thisPlot, row) {
            let dimensionNames = thisPlot.plotConfig.tooltipValues;

            if (dimensionNames.indexOf(thisPlot.xDimension.key) < 0)    dimensionNames.push(thisPlot.xDimension.key);
            if (dimensionNames.indexOf(thisPlot.yDimension.key) < 0)    dimensionNames.push(thisPlot.yDimension.key);
            if (dimensionNames.indexOf(thisPlot.cDimension.key) < 0)    dimensionNames.push(thisPlot.cDimension.key);

            if (thisPlot.plotConfig.markerDimension !== '')  {
                if (dimensionNames.indexOf(thisPlot.markerDimension.key) < 0)           dimensionNames.push(thisPlot.markerDimension.key);
            }

            if (thisPlot.plotConfig.markerOverlayDimension !== '')  {
                if (dimensionNames.indexOf(thisPlot.markerOverlayDimension.key) < 0)    dimensionNames.push(thisPlot.markerOverlayDimension.key);
            }

            if (thisPlot.plotConfig.sizeDimension !== '')  {
                if (dimensionNames.indexOf(thisPlot.sDimension.key) < 0)    dimensionNames.push(thisPlot.sDimension.key);
            }

            let dims = dimensionNames
                .filter( dimName => dimName !== '')
                .map( dimName => thisPlot.dataConfig.dimensions.find(d => d.key === dimName) )
                .filter( dim => typeof dim !== 'undefined' )
                .map( dim => dim.name + ': ' + thisPlot.valueToDisplay(dim, row[CkRepoWidgetUtils.getAxisKey(dim)]) )
                .join('<br/>');

            tooltip.html(dims);
            tooltip.append('br').lower();
            tooltip.insert('span')
                .attr('class', 'ck-repo-widget-plot-tooltip-link')
                .on('click', _ => CkRepoWidgetUtils.scrollToElement(d3.select( '#' + CkRepoWidgetUtils.getRowId(row) ).node()))
                .text('#' + row[CkRepoWidgetConstants.kNumberKey])
                .lower();
        }
    }, {
        key: 'onPointSelect',
        value: function onPointSelect(id) {
            this.selectedPointId = id;
            this._applyPoints(["select"]);
            this._showTooltip(false);
         }
    }]);

    return CkRepoWidgetPlot;
}();

var CkRepoWidget = function () {
    function CkRepoWidget() {
        _classCallCheck(this, CkRepoWidget);
    }

    _createClass(CkRepoWidget, [{
        key: 'init',
        value: function init(argsMap) {
            var _this9 = this;

            // If this widget is running on local machine, e.g. launched through `ck display dashboard`
            this.isLocalRun = (typeof argsMap.isLocalRun === 'undefined' ? true : argsMap.isLocalRun);
            // Scenario filters available workflows
            this.scenario = argsMap.scenario || '';

            let rootId = argsMap.rootId || '#ck-repo-widget';
            let headerId = argsMap.headerId || '#ck-repo-widget-header';
            let loadingLayerId = argsMap.loadingLayerId || '#ck-repo-widget-loading-layer';

            this.onWorkflowChange = argsMap.onWorkflowChange || null;

            // Url where to get data from
            const kApiUrl = argsMap.apiUrlPrefix || (this.isLocalRun ? '/web' : '/repo/json.php');
            var kActionGetData = 'get_raw_data';
            var kActionGetConfig = 'get_raw_config';

            var kPlotMargin = { top: 30, right: 70, bottom: 30, left: 90 };
            var kPlotWidth = 1060 - kPlotMargin.left - kPlotMargin.right;
            var kPlotHeight = 500 - kPlotMargin.top - kPlotMargin.bottom;

            var plot = new CkRepoWidgetPlot();
            var table = new CkRepoWidgetTable();

            this.plot = plot;
            this.table = table;

            fetch(argsMap.workflows)
                .then(response => response.json())
                .then(workflowsDesc => {
                    this.workflows = this._prepareWorkflows(workflowsDesc);
                    let defIdx = workflowsDesc.defaultWorkflowIndex;
                    defIdx = (this.scenario === '' ? defIdx : 0);
                    return this.workflows[ defIdx ];
                })
                .then(function(defaultWorkflow) {
                    var showWorkflow = function showWorkflow(workflow) {
                        _this9.selectedWorkflow = workflow;

                        _this9._showLoadingLayer();

                        _this9._clearWorkflow();

                        if (_this9.onWorkflowChange) {
                            _this9.onWorkflowChange(workflow.name);
                        }

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
                        var urlWithModule = kApiUrl + '?module_uoa=' + workflow.moduleUoa
                        var callAttribs = workflow.call_attribs || {}
                        for (var attrib_name in callAttribs) {
                            if (!callAttribs.hasOwnProperty(attrib_name)) continue;

                            urlWithModule += '&' + attrib_name + '=' + callAttribs[attrib_name]
                        }

                        var applyServerFilter = function applyServerFilter(selector, value) {
                            var prefix = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';

                            serverFilter.setSelector(selector, value, prefix);

                            fetch(urlWithModule + '&action=' + kActionGetData, {
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

                                            eWorkflow.tableProcessor(eWorkflow.data.table, eWorkflow);
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
                                xDimension: workflow.xDimension,
                                yDimension: workflow.yDimension,
                                colorDimension: workflow.colorDimension,
                                sizeDimension: workflow.sizeDimension,
                                markerDimension: workflow.markerDimension,
                                markerOverlayDimension: workflow.markerOverlayDimension,
                                markerDimensionSets: workflow.markerDimensionSets,
                                markerOverlayDimensionSets: workflow.markerOverlayDimensionSets,
                                isVariationXVisible: workflow.xVariationVisible,
                                isVariationYVisible: workflow.yVariationVisible,
                                filter: workflow.filter,
                                colorRange: workflow.colorRange,
                                sizeRange: workflow.sizeRange,
                                tooltipValues: workflow.tooltipValues,
                                pointSelectionCallback: id => _this9._pointSelectionCallback(id),
                            }, config);

                            table.init({
                                filter: workflow.filter,
                                tableContainer: _this9.dom.tableContainer,
                                pointSelectionCallback: id => _this9._pointSelectionCallback(id),
                            }, config);
                        };

                        var dataApplier = function dataApplier(data) {
                            CkRepoWidgetUtils.prepareFilters(workflow.config.selector, data.table, CkRepoWidgetConstants.kMetaFilterPrefix);
                            CkRepoWidgetUtils.prepareFilters(workflow.config.selector2, data.table);

                            _this9._plotSetRefLines(workflow);

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
                            _this9.dom.filterMetaContainer.style('display', (workflow.config.selector.length > 0 ? 'block' : 'none'));

                            workflow.config.selector2.forEach(function (selector, i) {
                                _this9._createValueSelector('ck-widget-filter-2-selector-' + (i + 1), _this9.dom.filter2Container, selector, workflow.filter.getSelectorValue(selector), function (selector, value) {
                                    if (isServerFilteringEnabled) {
                                        applyServerFilter(selector, value);
                                    } else {
                                        _this9._applyFilterValue(selector, value);
                                    }
                                });
                            });
                            _this9.dom.filter2Container.style('display', (workflow.config.selector2.length > 0 ? 'block' : 'none'));

                            if (workflow.config.selector_s) {
                                workflow.config.selector_s.forEach(function (selector, i) {
                                    if (!selector.values || selector.values.length > 1) {
                                        _this9._createValueSelector('ck-widget-filter-s-selector-' + (i + 1), _this9.dom.filterSContainer, selector, workflow.props[selector.key], function (selector, value) {
                                            workflow.props[selector.key] = value;

                                            workflow.tableProcessor(workflow.data.table, workflow);

                                            _this9._plotSetRefLines(workflow);

                                            plot.build(workflow.data.table);
                                            table.build(workflow.data.table);
                                        });
                                    }
                                });
                            }
                            _this9.dom.filterSContainer.style('display', ((workflow.config.selector_s && workflow.config.selector_s.length > 0) ? 'block' : 'none'));

                            plot.build(data.table);

                            _this9._createPlotSelector('x-axis-selector','X dimension',
                                _this9.dom.plotSelectorContainer, plot.getXDimension(), dimension => plot.setXDimension(dimension),
                                // Variation
                                isVisible => plot.setXVariationVisibility(isVisible), plot.getXVariationVisibility()
                            );

                            _this9._createPlotSelector('y-axis-selector', 'Y dimension',
                                _this9.dom.plotSelectorContainer, plot.getYDimension(), dimension => plot.setYDimension(dimension),
                                // Variation
                                isVisible => plot.setYVariationVisibility(isVisible), plot.getYVariationVisibility()
                            );

                            _this9._createPlotSelector('c-axis-selector', 'Color dimension',
                                _this9.dom.plotSelectorContainer, plot.getCDimension(), dimension => plot.setCDimension(dimension) );

                            if (workflow.sizeDimension !== '') {
                                _this9._createPlotSelector('s-axis-selector', 'Size dimension',
                                _this9.dom.plotSelectorContainer, plot.getSDimension(), dimension =>  plot.setSDimension(dimension) );
                            }

                            if (workflow.markerDimension !== '') {
                                _this9._createPlotSelector('marker-axis-selector', 'Marker dimension',
                                    _this9.dom.plotSelectorContainer, plot.getMarkerDimension(), dimension => plot.setMarkerDimension(dimension) );
                            }

                            if (workflow.markerOverlayDimension !== '') {
                                _this9._createPlotSelector('marker-overlay-axis-selector', 'Marker overlay dimension',
                                    _this9.dom.plotSelectorContainer, plot.getMarkerOverlayDimension(), dimension => plot.setMarkerOverlayDimension(dimension) );
                            }

                            if (workflow.markerDimension !== '') {
                                let markersListSelector = {
                                    name: 'Marker shapes',
                                    config: { type: 'list' },
                                    values: Object.keys(workflow.markerDimensionSets),
                                };

                                _this9._createValueSelector('marker-set-selector',
                                        _this9.dom.plotSelectorContainer,
                                        markersListSelector,
                                        plot.getMarkerDimensionSetIdx(),
                                        (_, value) => plot.setMarkerDimensionSetIdx( markersListSelector.values.indexOf(value) )
                                );
                            }

                            if (workflow.markerOverlayDimension !== '') {
                                let markersOverlayListSelector = {
                                    name: 'Overlay shapes',
                                    config: { type: 'list' },
                                    values: Object.keys(workflow.markerOverlayDimensionSets),
                                };

                                _this9._createValueSelector('marker-overlay-set-selector',
                                        _this9.dom.plotSelectorContainer,
                                        markersOverlayListSelector,
                                        plot.getMarkerOverlayDimensionSetIdx(),
                                        (_, value) => plot.setMarkerOverlayDimensionSetIdx( markersOverlayListSelector.values.indexOf(value) )
                                );
                            }

                            table.build(data.table);

                            _this9._hideLoadingLayer();
                        };

                        if (!workflow.config || !workflow.data) {
                            return fetch(urlWithModule + '&action=' + kActionGetConfig).then(function (response) {
                                return response.json();
                            }).then(function (config) {
                                var _iteratorNormalCompletion11 = true;
                                var _didIteratorError11 = false;
                                var _iteratorError11 = undefined;

                                try {
                                    for (var _iterator11 = _this9.workflows[Symbol.iterator](), _step11; !(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done); _iteratorNormalCompletion11 = true) {
                                        var eWorkflow = _step11.value;

                                        if (eWorkflow.moduleUoa === workflow.moduleUoa && JSON.stringify(eWorkflow.call_attribs || {}) === JSON.stringify(workflow.call_attribs || {}) ) {
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
                                return fetch(urlWithModule + '&action=' + kActionGetData, fetchDataInit);
                            }).then(function (response) {
                                return response.json();
                            }).then(function (data) {
                                var _iteratorNormalCompletion12 = true;
                                var _didIteratorError12 = false;
                                var _iteratorError12 = undefined;

                                try {
                                    for (var _iterator12 = _this9.workflows[Symbol.iterator](), _step12; !(_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done); _iteratorNormalCompletion12 = true) {
                                        var eWorkflow = _step12.value;

                                        if (eWorkflow.moduleUoa === workflow.moduleUoa) {
                                            eWorkflow.data = toLocal(data, eWorkflow.dataPrefix);

                                            eWorkflow.tableProcessor(eWorkflow.data.table, eWorkflow);
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

                    _this9._initDom(d3.select(rootId), d3.select(headerId), d3.select(loadingLayerId));

                    _this9.dom.sidePanelFiltersTabBtn.on('click', function () {
                        return _this9._openSidePanelFiltersTab();
                    });
                    if (!_this9.isLocalRun) {
                        _this9.dom.sidePanelInfoTabBtn.on('click', function () {
                            return _this9._openSidePanelInfoTab();
                        });
                    }
                    _this9.dom.sidePanelCloseBtn.on('click', function () {
                        return _this9._hideSidePanel();
                    });

                    _this9._createWorkflowSelector('ck-widget-filter-workflow-selector', _this9.dom.workflowSelectContainer, _this9.workflows, defaultWorkflow, function (workflow) {
                        return showWorkflow(workflow);
                    });

                    showWorkflow(defaultWorkflow);
                })
                .catch(reason => console.log(reason));
        }
    }, {
        key: '_prepareWorkflows',
        value: function _prepareWorkflows(rawWorkflowDesc) {
            let defaultTableProcessor = (table => CkRepoWidgetUtils.prepareTable(table));

            let makeFunctionFromStr = function(name) {
                if (typeof name === 'undefined') {
                    return undefined;
                }
                name = name.toString();
                if (!name.startsWith('CkRepoWidgetUtils.')) {
                    throw new Error("workflows[].tableProcessor should start with 'CkRepoWidgetUtils.'");
                }
                return eval(name);
            }

            let makeFilters = function(filtersDict) {
                let res = new CkRepoWidgetFilter();
                for(let key in filtersDict) {
                    res.setSelector({ key: key }, filtersDict[key]);
                }
                return res;
            }

            let res = [];

            for (let wf of rawWorkflowDesc.workflows) {
                let newWf = {
                    name: wf.name || '',
                    moduleUoa: wf.moduleUoa || '',
                    dataPrefix: wf.dataPrefix || '',
                    configPrefix: wf.configPrefix|| '',
                    tableProcessor: makeFunctionFromStr(wf.tableProcessor) || defaultTableProcessor,
                    config: null,
                    data: null,
                    xDimension: wf.xDimension || '',
                    yDimension: wf.yDimension || '',
                    colorDimension: wf.colorDimension || '',
                    colorRange: wf.colorRange,
                    sizeDimension: wf.sizeDimension || '',
                    markerDimension: wf.markerDimension || '',
                    markerOverlayDimension: wf.markerOverlayDimension || '',
                    markerDimensionSets: wf.markerDimensionSets || {},
                    markerOverlayDimensionSets: wf.markerOverlayDimensionSets || {},
                    xVariationVisible: wf.xVariationVisible || false,
                    yVariationVisible: wf.yVariationVisible || false,
                    filter: makeFilters(wf.filters || {}),
                    props: wf.props || {},
                    refLines: wf.refLines || [],
                    sizeRange: wf.sizeRange,
                    tooltipValues: wf.tooltipValues || [],
                    call_attribs: wf.call_attribs || {},
                };

                for (let refLine of newWf.refLines) {
                    refLine.get_value = makeFunctionFromStr(refLine.get_value) || (d => null);
                }

                // Scenario filters available workflows
                if (this.scenario !== '' && newWf.moduleUoa !== this.scenario) {
                    continue;
                }

                res.push(newWf);
            }

            return res;
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
            }).duration(750).on('end', _ => {
                this.dom.sidePanelVisible = true
            });
        }
    }, {
        key: '_hideSidePanel',
        value: function _hideSidePanel() {
            var translateInterpolator = d3.interpolateString(this.dom.sidePanel.style('transform'), 'translate(0px, 0px)');

            this.dom.sidePanel.transition().styleTween('transform', function () {
                return translateInterpolator;
            }).duration(750).on('start', _ => {
                this.dom.sidePanelVisible = false
            });
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
                        })
                        .text(d => (selector.format && d != CkRepoWidgetConstants.kFilterAllValue) ? CkRepoWidgetUtils.formatNumber(d, selector.format) : d);

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

            var old_repo = '';

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
        key: '_plotSetRefLines',
        value: function _plotSetRefLines(workflow) {
            let refLines = [];
            for (let refLineId in workflow.refLines) {
                try {
                    let refLine = workflow.refLines[refLineId];
                    refLine.value = refLine.get_value(workflow.data.table);
                    if (!refLine.value) {
                        continue;
                    }

                    if (workflow.props) {
                        refLine.delta = () => Number(workflow.props['__delta']);
                    } else {
                        refLine.delta = () => 0;
                    }

                    refLine.visible = true;
                    refLine.delta_visible = true;
                    refLines.push(refLine);
                } catch (err) { /* todo: log */ }
            }
            this.plot.setRefLines(refLines);
        }
    }, {
        key: '_pointSelectionCallback',
        value: function _pointSelectionCallback(pointId) {
            this.plot.onPointSelect(pointId);
            this.table.onPointSelect(pointId);
        }
    }, {
        key: '_initDom',
        value: function _initDom(root, header, loadingLayer) {
            let sidePanelButtonStyle = (this.isLocalRun ? 'ck-repo-widget-side-panel-header-tab' : 'ck-repo-widget-side-panel-header-tab-btn');

            let sidePanelContainer = d3.select(root.node().parentNode).append('div');

            var sidePanel = sidePanelContainer.append('div').attr('class', 'ck-repo-widget-side-panel');
            var sidePanelHeader = sidePanel.append('div').attr('class', 'ck-repo-widget-side-panel-header');
            var sidePanelTabsLayout = sidePanelHeader.append('div').attr('class', 'ck-repo-widget-side-panel-header-tabs-layout');
            var sidePanelFiltersTabBtn = sidePanelTabsLayout.append('div').attr('class', sidePanelButtonStyle).text('Filters');
            if (!this.isLocalRun) {
                var sidePanelInfoTabBtn = sidePanelTabsLayout.append('div').attr('class', sidePanelButtonStyle).text('Info');
            }
            var sidePanelCloseBtn = sidePanelHeader.append('div').attr('class', 'ck-repo-widget-side-panel-header-close-btn').html('<i class="fa fa-times"></i>');
            var sidePanelFiltersBody = sidePanel.append('div').attr('class', 'ck-repo-widget-side-panel-body');
            var sidePanelInfoBody = sidePanel.append('div').attr('class', 'ck-repo-widget-side-panel-body').html(this._getInfoHtml());

            let filter2Container = sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters');
            let filterSContainer = sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters');
            let filterMetaContainer = sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters');

            let plotSelectorLink = sidePanelFiltersBody.append('div').text('More options').attr('class', 'ck-repo-widget-filter-title-link');
            let plotSelectorContainer = sidePanelFiltersBody.append('div').attr('class', 'ck-repo-widget-selectors-container ck-repo-widget-selectors-container_filters');
            let plotSelectorLinkArrow = plotSelectorLink.append('i').attr('class', 'far fa-caret-square-down').style('margin-right', '0.5em').lower();

            // More options...
            plotSelectorLink.on('click', function() {
                let wasVis = plotSelectorContainer.style('display') === 'block';
                plotSelectorContainer.style('display', (wasVis ? 'none' : 'block'));
                plotSelectorLinkArrow.attr('class', wasVis ? 'far fa-caret-square-down' : 'far fa-caret-square-up');

            });
            plotSelectorContainer.style('display', 'none');

            // Close side panel on click outside of it
            root.on('mousedown.hidefilters', _ => { if (this.dom.sidePanelVisible) { this._hideSidePanel(); } }, true);

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
                sidePanelVisible: false,

                workflowSelectContainer: header.attr('class', 'ck-repo-widget-workflow-panel'),
                plotSelectorContainer: plotSelectorContainer,
                filterSContainer: filterSContainer,
                filterMetaContainer: filterMetaContainer,
                filter2Container: filter2Container,
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
            return '\n        <div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container ck-repo-widget-info-value-container">\n                    <div class="ck-repo-widget-info-title">Participated</div>\n                    <a href="https://github.com/ctuning/ck/wiki/Crowdsourcing-optimization" class="ck-repo-widget-info-github-link-container">\n                        <i class="fab fa-github"></i>\n                        <div class="ck-repo-widget-info-link ck-repo-widget-info-link_small">How to participate</div>\n                    </a>\n                </div>\n                <div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=experiment.user" class="ck-repo-widget-info-link">Users</a>\n                        <div class="ck-repo-widget-info-value">995</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform" class="ck-repo-widget-info-link">Platforms</a>\n                        <div class="ck-repo-widget-info-value">1,030</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.os" class="ck-repo-widget-info-link">OS</a>\n                        <div class="ck-repo-widget-info-value">299</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.cpu" class="ck-repo-widget-info-link">CPU</a>\n                        <div class="ck-repo-widget-info-value">310</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.gpu" class="ck-repo-widget-info-link">GPU</a>\n                        <div class="ck-repo-widget-info-value">124</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.gpgpu" class="ck-repo-widget-info-link">GPGPU</a>\n                        <div class="ck-repo-widget-info-value">27</div>\n                    </div>\n                    <div class="ck-repo-widget-info-value-container">\n                        <a href="/repo/web.php?action=index&module_uoa=wfe&native_action=show&native_module_uoa=platform.nn" class="ck-repo-widget-info-link">NN</a>\n                        <div class="ck-repo-widget-info-value">2</div>\n                    </div>\n                </div>\n            </div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container">\n                    <div class="ck-repo-widget-info-title">Motivation</div>\n                </div>\n                <div>\n                    <a href="https://www.slideshare.net/GrigoriFursin/adapting-to-a-cambrian-aiswhw-explosion-with-open-codesign-competitions-and-collective-knowledge" class="ck-repo-widget-info-link ck-repo-widget-info-link_divided">Adapting to a Cambrian AI/SW/HW explosion with open co-design competitions and Collective Knowledge</a>\n                    <div class="ck-repo-widget-info-link">ReQuEST-cfp-asplos2018</div>\n                </div>\n            </div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container">\n                    <div class="ck-repo-widget-info-title">Papers</div>\n                </div>\n                <div>\n                    <a href="https://arxiv.org/abs/1801.08024" class="ck-repo-widget-info-link ck-repo-widget-info-link_divided">1. A Collective Knowledge workflow for collaborative research into multi-objective autotuning and machine learning techniques</a>\n                    <a href="https://arxiv.org/abs/1506.06256" class="ck-repo-widget-info-link ck-repo-widget-info-link_divided">2. Collective Mind, Part II: Towards Performance- and Cost-Aware Software Engineering as a Natural Science</a>\n                    <a href="https://www.researchgate.net/publication/304010295_Collective_Knowledge_Towards_RD_Sustainability" class="ck-repo-widget-info-link">3. Collective Knowledge: Towards R&D Sustainability</a>\n                </div>\n            </div>\n            <div class="ck-repo-widget-info-section">\n                <div class="ck-repo-widget-info-title-container">\n                    <div class="ck-repo-widget-info-title">Helpful links</div>\n                </div>\n                <div>\n                    <a href="http://cknowledge.org/android-demo.html" class="ck-repo-widget-info-link">Android application</a>\n                    <a href="/repo/web.php?wcid=42b9a1221eb50259:collective_training_set" class="ck-repo-widget-info-link">Collective training set</a>\n                </div>\n            </div>\n        </div>\n        ';
        }
    }]);

    return CkRepoWidget;
}();
