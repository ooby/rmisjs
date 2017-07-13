# JS-обертка для работы с [RMIS](https://www.rtlabs.ru/projects/regionalnaya-meditsinskaya-informatsionnaya-sistema-rmis/)

### Начиная с версии `0.1.1` требуется [node.js](ttps://nodejs.org) версии 8.0.0 и выше

### Как использовать:

1. `npm install rmisjs`
2. Создать конфигурацию:
```javascript
var config = {
    rmis: {
        auth: {
            username: "username",
            password: "password"
        },
        path: "https://dev.is-mis.ru/",
        clinicId: clinicId,
        allowedServices: [
            "departments-ws/departments",
            "individuals-ws/individuals",
            "locations-ws/resources"
        ]
    }
}
```
3. Подключить модуль и установить конфигурацию:
```javascript
const rmis = require('rmisjs')(config);
```
4. Вызвать необходимый модуль:
```javascript
rmis.resource()
    .then(r => {
        console.log(r.describe());
    })
    .catch(e => {
        console.error(e);
    });

rmis.resource()
    .then(r => {
        return r.getLocations({ clinic: config.rmis.clinicId });
    })
    .then(r => {
        console.log(r);
    })
    .catch(e => {
        console.error(e);
    });
```