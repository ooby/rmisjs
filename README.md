# JS-библиотеки для работы с WSDL [RMIS](https://www.rtlabs.ru/projects/regionalnaya-meditsinskaya-informatsionnaya-sistema-rmis/)

## Как использовать:

1. Создать конфигурацию:
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
2. Подключить модуль и установить конфигурацию:
```javascript
var rmis = require('rmisjs')(config);
```
3. Вызвать необходимый модуль:
```javascript
rmis.resource(function (e, r) {
    if (e) { console.log(e); return; }
    console.log(r.describe());
});
```