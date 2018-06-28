'use strict';

var _idb = require('idb');

var _idb2 = _interopRequireDefault(_idb);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// register a service worker
navigator.serviceWorker.register('./sw.js').then(function (reg) {
    if (!navigator.serviceWorker.controller) {
        return;
    }
    console.log('yay');
});
// initialize a database
var dbPromise = _idb2.default.open('currency-converter', 2, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
        case 0:
            upgradeDb.createObjectStore('currencies', { keyPath: 'id' });
        case 1:
            upgradeDb.createObjectStore('conversion');
    }
});

// url to populate the option values in the html select element
var currUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';

fetch(currUrl).then(function (res) {
    return res.json();
}).then(function (data) {
    var currencies = data['results'];
    //the result of fetch is stored in the database
    dbPromise.then(function (db) {
        if (!db) return;

        var tx = db.transaction('currencies', 'readwrite');
        var store = tx.objectStore('currencies');

        for (var currency in currencies) {
            if (currencies.hasOwnProperty(currency)) {
                store.put(currencies[currency]);
            }
        }
    });
});

// get the values for the option tag through the database
// works offline
var loadCurrencies = function loadCurrencies() {

    var select = document.getElementById('from'),
        select2 = document.getElementById('to');

    dbPromise.then(function (db) {
        var store = db.transaction('currencies').objectStore('currencies');

        store.getAll().then(function (symbols) {

            symbols.forEach(function (symbol) {
                var child = document.createElement('option');
                var duplicate = void 0;

                child.setAttribute('value', symbol['id']);

                child.textContent = symbol['id'];
                duplicate = child.cloneNode(true);

                select.appendChild(child);
                select2.appendChild(duplicate);
            });
        });
    });
};

loadCurrencies();

var button = document.querySelector('button');

button.onclick = function (event) {
    event.preventDefault();

    var amount = +document.getElementById('amount').value;
    var result = document.getElementById('result'),
        from = encodeURIComponent(document.getElementById('from').value),
        to = encodeURIComponent(document.getElementById('to').value),
        query = from + '_' + to,
        url = 'https://free.currencyconverterapi.com/api/v5/convert?q=' + query + '&compact=y';

    result.value = 'loading value ....';

    if (amount < 0 || !amount) {
        result.value = 'Input a positive value';
        return;
    }
    // get the result of query from the network
    // if no connection, get it from the database, if available
    fetch(url).then(function (res) {
        return res.json();
    }).then(function (data) {
        amount *= data[query]['val'];
        result.value = amount;
        dbPromise.then(function (db) {
            var store = db.transaction('conversion', 'readwrite').objectStore('conversion');
            store.put(data[query]['val'], query);
        });
    }).catch(function () {
        dbPromise.then(function (db) {
            var store = db.transaction('conversion').objectStore('conversion');
            return store.get(query);
        }).then(function (value) {
            amount *= value;
            result.value = amount ? amount : 'Unavailable';
        });
    });
};