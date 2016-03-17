(function(angular) {
    "use strict";
    angular
        .module('CurrencyExchange')
        .controller("CurrencyExchangeController",
                    ["ExchangeRateService",
                    currencyExchangeController]);

        function currencyExchangeController (ExchangeRateService)
        {
            var self = this;

            self.CurrencyState = "uninitialized";
            self.CurrencyFrom = null;
            self.CurrencyTo = null;
            self.UserAmounts = null;
            self.TransactionDate = null;
            self.Currencies = [];
            self.Amounts=[];
            self.ExchangeRate = null;
            self.ErrorMsg = null;

            self.UpdateExchangeRate = function() {
                self.ExchangeRate = null;
                if (!self.TransactionDate || !self.CurrencyFrom || !self.CurrencyTo)
                    return;
                var dateTransactionDate = new Date(self.TransactionDate);
                var rateFrom = ExchangeRateService.ConvertToUSD (
                                self.CurrencyFrom,
                                "P&L",
                                dateTransactionDate);
                if (!rateFrom)
                    return ;
                var rateTo = ExchangeRateService.ConvertToUSD(
                                self.CurrencyTo,
                                "P&L",
                                dateTransactionDate);
                if (!rateTo)
                    return ;
                self.ExchangeRate = rateFrom/rateTo;
            };

            self.UpdateAmounts = function() {
                self.Amounts = []
                if (!self.UserAmounts)
                    return;
                var trimmed = self.UserAmounts.trim();
                if (trimmed == '')
                    return;
                self.Amounts =  trimmed
                                    .replace(/[$(),]/g,'')
                                    .split(/\s+/mg)
                                    .map(parseFloat);
            };

            ExchangeRateService.WaitForService().then(
                function(state) {
                    self.Currencies = ExchangeRateService.CurrencyList;
                    self.CurrencyState = "initialized";
                },
                function(errorMsg) {
                    self.CurrencyState = "error";
                    self.ErrorMsg = errorMsg;
                });

        }
})(window.angular);
