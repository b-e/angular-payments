angular.module('angularPayments')


    .factory('_Format',['Cards', 'Common', '$filter', function(Cards, Common, $filter){

        var _formats = {}

        var _hasTextSelected = function($target) {
            var ref;

            if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== $target.prop('selectionEnd')) {
                return true;
            }

            if (typeof document !== "undefined" && document !== null ? (ref = document.selection) != null ? typeof ref.createRange === "function" ? ref.createRange().text : void 0 : void 0 : void 0) {
                return true;
            }

            return false;
        };

        // card formatting

        var _formatCardNumber = function(e) {
            var $target, card, digit, length, re, upperLength, value;

            digit = String.fromCharCode(e.which);
            $target = angular.element(e.currentTarget);
            value = $target.val();
            card = Cards.fromNumber(value + digit);
            length = (value.replace(/\D/g, '') + digit).length;

            upperLength = 16;

            if (card) {
                upperLength = card.length[card.length.length - 1];
            }

            if (length >= upperLength) {
                return;
            }

            if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
                e.preventDefault();
                return;
            }

            if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
                return;
            }

            re = Cards.defaultInputFormat();
            if (card) {
                re = card.inputFormat;
            }

            if (re.test(value)) {
                e.preventDefault();
                return $target.val(value + ' ' + digit);

            } else if (re.test(value + digit)) {
                e.preventDefault();
                return $target.val(value + digit + ' ');

            }
        };

        var _restrictCardNumber = function(e) {
            var $target, card, digit, value;

            $target = angular.element(e.currentTarget);
            digit = String.fromCharCode(e.which);

            if(!/^\d+$/.test(digit)) {
                return;
            }

            if(_hasTextSelected($target)) {
                return;
            }

            value = ($target.val() + digit).replace(/\D/g, '');
            card = Cards.fromNumber(value);

            if(card) {
                if(!(value.length <= card.length[card.length.length - 1])){
                    e.preventDefault();
                }
            } else {
                if(!(value.length <= 16)){
                    e.preventDefault();
                }
            }
        };

        var _formatBackCardNumber = function(e) {
            var $target, value;

            $target = angular.element(e.currentTarget);
            value = $target.val();

            if(e.meta) {
                return;
            }

            if(e.which !== 8) {
                return;
            }

            if(($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
                return;
            }

            if(/\d\s$/.test(value) && !e.meta && e.keyCode >= 46) {
                e.preventDefault();
                return $target.val(value.replace(/\d\s$/, ''));
            } else if (/\s\d?$/.test(value)) {
                e.preventDefault();
                return $target.val(value.replace(/\s\d?$/, ''));
            }
        };

        var _getFormattedCardNumber = function(num) {
            var card, groups, upperLength, ref;

            card = Cards.fromNumber(num);

            if (!card) {
                return num;
            }

            upperLength = card.length[card.length.length - 1];
            num = num.replace(/\D/g, '');
            num = num.slice(0, +upperLength + 1 || 9e9);

            if(card.format.global) {
                return (ref = num.match(card.format)) != null ? ref.join(' ') : void 0;
            } else {
                groups = card.format.exec(num);

                if (groups != null) {
                    groups.shift();
                }

                return groups != null ? groups.join(' ') : void 0;
            }
        };

        var _reFormatCardNumber = function(e) {
            return setTimeout(function() {
                var $target, value;
                $target = angular.element(e.target);

                value = $target.val();
                value = _getFormattedCardNumber(value);
                return $target.val(value);
            });
        };

        var _parseCardNumber = function(value) {
            return value != null ? value.replace(/\s/g, '') : value;
        };

        var _cardType = function(num) {
            var _ref;
            if (!num) {
                return null;
            }
            return ((_ref = Cards.fromNumber(num)) != null ? _ref.type : void 0) || null;
        };

        var _setCardType = function(e) {
            var $target, allTypes, card, cardType, val;
            $target = angular.element(e.currentTarget);
            val = $target.val();
            cardType = _cardType(val) || 'unknown';
            if (!$target.hasClass(cardType)) {
                allTypes = (function() {
                    var _i, _len, _results;
                    _results = [];
                    for (_i = 0, _len = cards.length; _i < _len; _i++) {
                        card = cards[_i];
                        _results.push(card.type);
                    }
                    return _results;
                })();
                $target.removeClass('unknown');
                $target.removeClass(allTypes.join(' '));
                $target.addClass(cardType);
                $target.toggleClass('identified', cardType !== 'unknown');
                return $target.trigger('payment.cardType', cardType);
            }
        };

        _formats['card'] = function(elem, ctrl){
            elem.on('keypress', _restrictCardNumber);
            elem.on('keypress', _formatCardNumber);
            elem.on('keydown', _formatBackCardNumber);
            //elem.on('keyup', _setCardType);
            elem.on('paste', _reFormatCardNumber);
            elem.on('change', _reFormatCardNumber);
            elem.on('input', _reFormatCardNumber);
            //elem.on('input', _setCardType);

            ctrl.$parsers.push(_parseCardNumber);
            ctrl.$formatters.push(_getFormattedCardNumber);
        }


        // cvc

        _formatCVC = function(e){
            $target = angular.element(e.currentTarget);
            digit = String.fromCharCode(e.which);

            if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
                e.preventDefault();
                return;
            }

            val = $target.val() + digit;

            if(val.length <= 4){
                return;
            } else {
                e.preventDefault();
                return;
            }
        }

        _formats['cvc'] = function(elem){
            elem.on('keypress', _formatCVC)
        }

        // expiry

        _restrictExpiry = function(e) {
            var $target, digit, value;

            $target = angular.element(e.currentTarget);
            digit = String.fromCharCode(e.which);

            if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
                e.preventDefault();
                return;
            }

            if(_hasTextSelected($target)) {
                return;
            }

            value = $target.val() + digit;
            value = value.replace(/\D/g, '');

            if (value.length > 6) {
                e.preventDefault()
                return;
            }
        };

        _formatExpiry = function(e) {
            var $target, digit, val;

            digit = String.fromCharCode(e.which);

            if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
                e.preventDefault();
                return;
            }

            $target = angular.element(e.currentTarget);
            val = $target.val() + digit;

            if (/^\d$/.test(val) && (val !== '0' && val !== '1')) {
                e.preventDefault();
                return $target.val("0" + val + " / ");

            } else if (/^\d\d$/.test(val)) {
                e.preventDefault();
                return $target.val("" + val + " / ");

            }
        };

        _formatForwardExpiry = function(e) {
            var $target, digit, val;

            digit = String.fromCharCode(e.which);

            if (!/^\d+$/.test(digit) && !e.meta && e.keyCode >= 46) {
                return;
            }

            $target = angular.element(e.currentTarget);
            val = $target.val();

            if (/^\d\d$/.test(val)) {
                return $target.val("" + val + " / ");
            }
        };

        _formatForwardSlash = function(e) {
            var $target, val, which;
            which = String.fromCharCode(e.which);
            if (!(which === '/' || which === ' ')) {
                return;
            }
            $target = angular.element(e.currentTarget);
            val = $target.val();
            if (/^\d$/.test(val) && val !== '0') {
                return $target.val("0" + val + " / ");
            }
        };

        _formatBackExpiry = function(e) {
            var $target, value;

            if (e.meta) {
                return;
            }

            $target = angular.element(e.currentTarget);
            value = $target.val();
            if (e.which !== 8) {
                return;
            }

            if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
                return;
            }

            if (/\d(\s|\/)+$/.test(value)) {
                e.preventDefault();
                return $target.val(value.replace(/\d(\s|\/)*$/, ''));

            } else if (/\s\/\s?\d?$/.test(value)) {
                e.preventDefault();
                return $target.val(value.replace(/\s\/\s?\d?$/, ''));

            }
        };

        var _parseExpiry = function(value) {
            if(value != null) {
                var obj = Common.parseExpiry(value);
                var expiry = new Date(obj.year, obj.month-1);
                return $filter('date')(expiry, 'MM/yyyy');
            }
            return null;
        };

        var _getFormattedExpiry = function(value) {
            if(value != null) {
                var obj = Common.parseExpiry(value);
                var expiry = new Date(obj.year, obj.month-1);
                return $filter('date')(expiry, 'MM / yyyy');
            }
            return null;
        };

        var _formatExpiryMobile = function(expiry) {
            var mon, parts, sep, year;
            parts = expiry.match(/^\D*(\d{1,2})(\D+)?(\d{1,4})?/);
            if (!parts) {
                return '';
            }
            console.log(parts);
            mon = parts[1] || '';
            sep = parts[2] || '';
            year = parts[3] || '';
            if (year.length > 0 || (sep.length > 0 && !(/\ \/?\ ?/.test(sep)))) {
                sep = ' / ';
            }
            if (mon.length === 1 && (mon !== '0' && mon !== '1')) {
                mon = "0" + mon;
                sep = ' / ';
            } else if (mon.length == 2 && sep.length == 0) {
                sep = ' / ';
            } else if (mon.length== 2 && sep == ' /') {
                mon = mon.substring(0, 1);
                year = '';
                sep = '';
            }
            return mon + sep + year;
        };

        var _reFormatExpiry = function(e) {
            return setTimeout(function() {
                var $target, value;
                $target = angular.element(e.target);
                value = $target.val();
                value = _formatExpiryMobile(value);
                return $target.val(value);
            });
        };


        _formats['expiry'] = function(elem, ctrl){
            elem.on('keypress', _restrictExpiry);
            elem.on('keypress', _formatExpiry);
            elem.on('keypress', _formatForwardSlash);
            elem.on('keypress', _formatForwardExpiry);
            elem.on('keydown', _formatBackExpiry);
            elem.on('change', _reFormatExpiry);
            elem.on('input', _reFormatExpiry);

            ctrl.$parsers.push(_parseExpiry);
            ctrl.$formatters.push(_getFormattedExpiry);
        }

        return function(type, elem, ctrl){
            if(!_formats[type]){

                types = Object.keys(_formats);

                errstr  = 'Unknown type for formatting: "'+type+'". ';
                errstr += 'Should be one of: "'+types.join('", "')+'"';

                throw errstr;
            }
            return _formats[type](elem, ctrl);
        }

    }])

    .directive('paymentsFormat', ['$window', '_Format', function($window, _Format){
        return {
            restrict: 'A',
            require: 'ngModel',
            link: function(scope, elem, attr, ctrl){
                _Format(attr.paymentsFormat, elem, ctrl);
            }
        }
    }])