
import idb from 'idb';

// register a service worker
navigator.serviceWorker.register('./sw.js').then(function(reg) {
    if (!navigator.serviceWorker.controller) {
        return;
    }
});
// initialize a database
const dbPromise = idb.open('currency-converter', 2, function(upgradeDb) {
    switch(upgradeDb.oldVersion){
        case 0:
        upgradeDb.createObjectStore('currencies', { keyPath: 'id'});
        case 1:
        upgradeDb.createObjectStore('conversion');
    }
});

// url to populate the option values in the html select element
const currUrl = 'https://free.currencyconverterapi.com/api/v5/currencies';

fetch(currUrl).then(res=>{
    return res.json()
}).then(data=>{
    const currencies = data['results'];
    //the result of fetch is stored in the database
    dbPromise.then(db=>{
        if(!db) return;

        const tx = db.transaction('currencies', 'readwrite');
        const store = tx.objectStore('currencies');

        for(const currency in currencies){
            if(currencies.hasOwnProperty(currency)){
              store.put(currencies[currency]);               
            }
        }
    })
});

// get the values for the option tag through the database
// works offline
const loadCurrencies = ()=>{
   
    const select = document.getElementById('from'),
          select2 = document.getElementById('to');

    dbPromise.then(db=>{
         const store = db.transaction('currencies').objectStore('currencies');
         
         store.getAll().then(symbols=>{

            symbols.forEach(symbol=>{
                const child = document.createElement('option');
                let duplicate;
                
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

const button = document.querySelector('button');

button.onclick = event=>{
    event.preventDefault();

    let  amount = +(document.getElementById('amount').value);
    const result = document.getElementById('result'),
          from = encodeURIComponent(document.getElementById('from').value),
          to = encodeURIComponent(document.getElementById('to').value),
          query = `${from}_${to}`,
          url = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=y`;
    
    result.value = 'loading value ....';
    
    if(amount < 0 || !amount){
        result.value = 'Input a positive value';
        return;
    }
   // get the result of query from the network
   // if no connection, get it from the database, if available
    fetch(url).then(res=>{
        return res.json();
    }).then(data=>{
        amount *= data[query]['val'];
        result.value = `${to}${amount}`;
        dbPromise.then(db=>{
            const store= db.transaction('conversion', 'readwrite')
                            .objectStore('conversion');
            store.put(data[query]['val'], query);
        });
    }).catch(()=>{
        dbPromise.then(db=>{
            const store = db.transaction('conversion').objectStore('conversion');
            return store.get(query);
        }).then(value=>{
            amount *= value;
            result.value = amount? `${to}${amount}` : 'Unavailable';
        });
    });
};