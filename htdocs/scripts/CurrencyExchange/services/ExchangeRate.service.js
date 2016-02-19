(function(angular) {
    "use strict";
    angular
        .module('CurrencyExchange')
        .factory('ExchangeRateService',[exchangeRateService]);

    function exchangeRateService()
    {
        var numRowsLoaded = 0;
        var numRowsErrors = 0;
        var currencyInfo = {};
        var exchangeCsv = "/MonthlyExchangeRate.ss.csv";
        var currencyList = [];
        var initializedCallback = undefined;

        return {
            InitService: initService,
            ConvertToUSD: convertToUSD,
            IsValidCurrency: isValidCurrency,
            get CurrencyList() {return currencyList;}
        };

        function initService (callbackFn)
        {
            var config = {
                delimiter: "",// auto-detect
                newline: "",// auto-detect
                header: true,
                dynamicTyping: false,
                preview: 0,
                encoding: "",
                worker: false,
                comments: false,
                step: function(results, parser){
                    if (results.errors.length != 0)
                    {
                        numRowsErrors += 1;
                        return;
                    }
                    var resultCount = 0;
                    var totalResults = results.data.length;
                    while (resultCount < totalResults)
                    {
                        loadResult(results.data[resultCount]);
                        resultCount += 1;
                        numRowsLoaded += 1;
                    }
                },
                complete: function(results, file) {
                    for (var currency in currencyInfo)
                        if (currencyInfo.hasOwnProperty(currency))
                            currencyList.push(currency);
                    if (initializedCallback != undefined)
                        initializedCallback();
                    console.log("Parsing complete:",
                                currencyInfo,
                                file,
                                numRowsErrors,
                                numRowsLoaded);
                },
                error: undefined,
                download: true, // only
                skipEmptyLines: false,
                chunk: undefined,
                fastMode: undefined,
                beforeFirstChunk: undefined,
                withCredentials: undefined
            };
            initCurrencyLoader();
            initializedCallback = callbackFn;
            Papa.parse(exchangeCsv, config);
        }

        function convertToUSD (currency,
                               exchangeRateTypeCode,
                               exchangeDate)
        {
            var obj = currencyInfo[sanitize_currency(currency)];
            if (obj == undefined)
                return undefined;
            obj = obj[exchangeRateTypeCode];
            if (obj == undefined)
                return undefined;
            var yearArr = obj[exchangeDate.getFullYear().toString()];
            if (yearArr == undefined)
                return undefined;
            var lenArr = yearArr.length;
            var i = 0;
            while(i < lenArr)
            {
                if (exchangeDate >= yearArr[i]["FiscalStartDate"]
                    && exchangeDate <= yearArr[i]["FiscalEndDate"])
                    return yearArr[i]["ExchangeRate"];
                i+= 1;
            }
            return undefined;
        }

        function isValidCurrency (currency)
        {
            return currencyInfo.hasOwnProperty(sanitize_currency(currency));
        }


        function initCurrencyLoader ()
        {
            numRowsLoaded = 0;
            numRowsErrors = 0;
            currencyInfo = {};
            currencyList = [];
            initializedCallback = undefined;
        }

        function loadExchangeData (currencyCode,
                                        exchangeRateTypeCode,
                                        fiscalStartDate,
                                        fiscalEndDate,
                                        year,
                                        exchangeRate)
        {
            defaultArray(
                defaultDict(
                    defaultDict(
                        currencyInfo,
                        sanitize_currency(currencyCode)),
                    exchangeRateTypeCode),
                year).push({
                        "FiscalStartDate": fiscalStartDate,
                        "FiscalEndDate": fiscalEndDate,
                        "ExchangeRate": parseFloat(exchangeRate)});
        }

        function loadResult(result)
        {
            var startDate = new Date(result["FiscalMonthStartDate"]);
            var endDate = new Date(result["FiscalMonthEndDate"]);
            var startYear = startDate.getFullYear();
            var endYear = endDate.getFullYear();
            loadExchangeData(
                result["CurrencyCode"],
                result["ExchangeRateTypeCode"],
                startDate,
                endDate,
                startYear,
                result["ExchangeRateAmt"]);
            if (startYear != endYear)
            {
                loadExchangeData(
                    result["CurrencyCode"],
                    result["ExchangeRateTypeCode"],
                    startDate,
                    endDate,
                    endYear,
                    result["ExchangeRateAmt"]);
            }
        }

        function defaultDict(obj, prop)
        {
            if (obj[prop] == undefined)
                obj[prop] = {};
            return obj[prop];
        }
        function defaultArray(obj, prop)
        {
            if (obj[prop] == undefined)
                obj[prop] = new Array();
            return obj[prop];
        }
        function sanitize_currency(currency)
        {
            return currency.trim().toUpperCase();
        }

    }



})(window.angular);
