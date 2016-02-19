(function(angular) {
    "use strict";
    angular
        .module('CurrencyExchange')
        .controller("CurrencyExchangeController",
                    ["$scope",
                    "ExchangeRateService",
                    currencyExchangeController]);

        function currencyExchangeController ($scope, ExchangeRateService)
        {
            var self = this;

            self.CurrencyState = "uninitialized";
            self.CurrencyFrom = new currency("");
            self.CurrencyTo = new currency("");
            self.Currencies = [];
            self.Amounts=[];
            self.ExchangeRate = null;

            self.UpdateExchangeRate = function() {
                self.ExchangeRate = null
                if (!self.TransactionDate)
                    return;
                var dateTransactionDate = new Date(self.TransactionDate);
                var rateFrom = ExchangeRateService.ConvertToUSD (
                                self.CurrencyFrom.Name,
                                "P&L",
                                dateTransactionDate);
                var rateTo = ExchangeRateService.ConvertToUSD(
                                self.CurrencyTo.Name,
                                "P&L",
                                dateTransactionDate);
                if (rateFrom && rateTo)
                    self.ExchangeRate = rateFrom/rateTo;
            };

            self.UpdateAmounts = function() {
                self.Amounts = []
                var trimmed = self.UserAmounts.trim();
                if (trimmed != '')
                    self.Amounts =  trimmed
                                    .replace(/[$(),]/g,'')
                                    .split(/\s+/mg)
                                    .map(parseFloat);
            };

            ExchangeRateService.InitService(function() {
                self.Currencies = ExchangeRateService.CurrencyList;
                self.CurrencyState = "initialized";
                console.log($scope);
                $scope.$digest();
            });

            function currency(currencycode) {
                var self = this;
                self.Name = currencycode;
                self.Validity = function() {
                    if (self.Name.trim() == 0)
                        return "empty";
                    if (ExchangeRateService.IsValidCurrency(self.Name))
                        return "valid";
                    return "invalid";
                }
            }
        }
})(window.angular);
