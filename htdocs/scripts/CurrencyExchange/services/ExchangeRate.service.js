(function(angular) {
    "use strict";
    angular
        .module('CurrencyExchange')
        .factory('ExchangeRateService',["$q", exchangeRateService]);

    function exchangeRateService($q)
    {
        var numRowsLoaded = 0;
        var numRowsErrors = 0;
        var currencyInfo = {};
        var exchangeCsv = "/MonthlyExchangeRate.ss.csv";
        var currencyList = [];
        var promises = [];
        var initialized = false;
        // 0 = unit, 1 = init, 2 = error
        var initState = 0;
        var errorMsg = undefined;

        initService();
        return {
            WaitForService: waitForService,
            ConvertToUSD: convertToUSD,
            IsValidCurrency: isValidCurrency,
            get CurrencyList() {return currencyList;}
        };

        function serviceResults()
        {
            return {
                numRows: numRowsLoaded,
                numErrors: numRowsErrors,
            };
        }

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
                        numRowsErrors += results.errors.length;
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
                    markState(1);
                    console.log("Parsing complete:",
                                currencyInfo,
                                file,
                                numRowsErrors,
                                numRowsLoaded);
                },
                error: function(err, file){
                    markState(2, err);
                },
                download: true, // only
                skipEmptyLines: false,
                chunk: undefined,
                fastMode: undefined,
                beforeFirstChunk: undefined,
                withCredentials: undefined
            };
            initCurrencyLoader();
            Papa.parse(exchangeCsv, config);
        }

        function fullfillPromises()
        {
            if (initState == 1)
                resolvePromises();
            else if (initState == 2)
                rejectPromises();
        }
        function resolvePromises()
        {
            for (var i = 0;i< promises.length;i++)
            {
                promises[i].resolve(serviceResults());
            }
            promises = [];
        }

        function rejectPromises()
        {
            for (var i = 0;i< promises.length;i++)
            {
                promises[i].reject(errorMsg);
            }
            promises = [];
        }

        function markState(state, err)
        {
            // As papa parse API is not clear that complete and error are exclusive
            // we will ensure that state is only changes from 0 to 1 or 2
            if (initState != 0 || state == 0)
                return;
            initState = state;
            errorMsg = err;
            fullfillPromises();
        }

        function waitForService()
        {
            var deferred = $q.defer();
            promises.push(deferred);
            if (initState != 0)
                fullfillPromises();
            return deferred.promise;
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
