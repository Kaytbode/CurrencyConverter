
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

// populate the select tags as soon as the page is loaded
document.addEventListener('DOMContentLoaded', event=>{
    loadDatabase();
    loadCurrencies();
});

// transfer the currency symbols to the database
const loadDatabase = ()=>{
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
        });
    });
}

// get the values for the option tag through the database
const loadCurrencies = ()=>{
    const selectElements = document.querySelectorAll('select');

    dbPromise.then(db=>{
         const store = db.transaction('currencies').objectStore('currencies');
         
         store.getAll().then(symbols=>{
            symbols.forEach(symbol=>{
                const child = document.createElement('option');
                let duplicate;
                
                child.setAttribute('value', symbol['id']);
            
                child.textContent = symbol['id'];
                duplicate = child.cloneNode(true);
        
                selectElements[0].appendChild(child);
                selectElements[1].appendChild(duplicate);
            }); 
         });
    });
};

//Listener for the click event
const convertCurrPairs = (event)=>{
    event.preventDefault();

    const regExp = /^[0-9]+$/;
    let  amount =  document.getElementById('amount').value;
    const result = document.getElementById('result'),
          from = encodeURIComponent(document.getElementById('from').value),
          to = encodeURIComponent(document.getElementById('to').value),
          query = `${from}_${to}`,
          url = `https://free.currencyconverterapi.com/api/v5/convert?q=${query}&compact=y`;
    
    result.textContent = 'loading value ....';
    
    //Validate user input
    if(!regExp.test(amount)){
        result.textContent = 'Input a positive value';
        return;
    }
    amount = Number(amount);

   // get the result of query from the network
   // if no connection, get it from the database, if available
   if(navigator.onLine){
        fetch(url).then(res=>{
            return res.json();
        }).then(data=>{
            amount *= data[query]['val'];
            result.textContent = `${amount.toFixed(4)}`;
            dbPromise.then(db=>{
                const store= db.transaction('conversion', 'readwrite')
                                .objectStore('conversion');
                store.put(data[query]['val'], query);
            });
        }).catch(()=> result.textContent = 'Rate Unavailable');
    }   
    else { // for offline use
        dbPromise.then(db=>{
            const store = db.transaction('conversion').objectStore('conversion');
            return store.get(query);
        }).then(value=>{
            amount *= value;
            result.textContent = amount? `${amount.toFixed(4)}` : 'Unavailable';
        });
    }       
}

//click the button to get a conversion rate
 const button = document.getElementById('convert');
 button.addEventListener('click', convertCurrPairs);