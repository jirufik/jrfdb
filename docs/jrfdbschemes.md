# [Schemes](#schemes)

---

## [addScheme](#addscheme)

Добавить схему. Если схема с таким именем существует то она будет перезаписана новой схемой.

### Входные параметры

**scheme** - обязательный параметр. JS объект состоит из

| Name | Type | Description |
| :--- | :--- | :--- |
| **name** | string | Имя коллекции |
| **fields** | object | Описание полей коллекции |
| beforeAdd | array | Хуки перед добавлением |
| afterAdd | array | Хуки после добавления |
| beforeGet | array | Хуки перед получением |
| afterGet | array | Хуки после получения |
| beforeEdit | array | Хуки перед редактированием |
| afterEdit | array | Хуки после редактирования |
| beforeDel | array | Хуки перед удалением |
| afterDel | array | Хуки после удаления |

**scheme.hooks** - состоит из

| Name | Type | Description |
| :--- | :--- | :--- |
| **func** | function | Асинхронная функция первым параметром которой является объект **next** вторым объект **param** |
| name | string | Имя хука, если имя не задано тогда будет имя функции |
| priority | number | Приоритет, чем ниже число тем первее выполнится хук |
| description | string | Описание хука |

**scheme.fields** - состоит из

| Name | Type | Description |
| :--- | :--- | :--- |
| **description** | string | Описание поля |
| type | string | Тип значения поля может быть: string, number, date, boolean, array, object, dbref. |
| typeArray | string | Тип елементов массива: string, number, date, boolean, array, object, dbref. |
| required | boolean | Если true то поле обязательно для заполнения, иначе не обязательно. |
| unique | boolean | Если true то значение поля должно быть уникальным среди всех документов |
| max | number | Если type = string тогда максимальная длина значения. Если type = number тогда максимально допустимое число значения. Если type = array то максимальное количество элементов масива. |
| min | number | Если type = string тогда минимальная длина значения. Если type = number тогда минимально допустимое число значения. Если type = array то минимальное количество элементов масива. |
| default | all | Значение по умолчанию если в поле не передано значение. Если тип поля задан, тогда значение по умолчанию должно соответствовать типу поля. |
| requiredOneOf | array | Массив содержит в себе наименование полей, одно из этих полей должно быть обязательно заполнено |
| scheme | string | Указывается если type = dbref или typeArray = dbref. Имя схемы на объект которой ссылается идентификатор. |
| fields | object | Выше описанные в таблице поля. Т.е. струтура полей может быть вложенной и сложной. |

### Возвращаемое значение

boolean - true если добавление прошло удачно, иначе false.

### Пример

```js
const jrfdb = require('../jrfdb');

let logs = {
    name: 'logs',
    beforeAdd: [
        {
            func: hookPerm,
            name: 'hookTwo',
            priority: 20,
            description: 'second hook'
        },
        {
            func: hookAuth,
            name: 'hookOne',
            priority: 1,
            description: 'first hook'
        }
    ],
    fields: {
        bucket: {
            description: 'Bucket',
            type: 'string',
            required: true,
            unique: true,
            min: 2,
            max: 30
        },
        wheels: {
            description: 'Wheels',
            type: 'number',
            min: 1,
            max: 5
        },
        hands: {
            description: 'Hands',
            type: 'array',
            fields: {
                hand: {
                    description: 'Hand',
                    type: 'string',
                    default: 'right',
                    required: true
                },
                fingers: {
                    description: 'Fingers',
                    type: 'number',
                    default: 5,
                    min: 0,
                    max: 5
                },
                skin: {
                    description: 'Color skin',
                    type: 'string',
                    default: 'white'
                },
                test: {
                    type: 'array',
                }
            }
        },
        star: {
            type: 'object'
        },
        refuse: {
            description: 'Refuse',
            type: 'array',
            typeArray: 'dbref',
            scheme: 'refuse'
        },
        requiredOneOf: ['wheels', 'refuse']
    }
};

await jrfdb.addScheme(logs);

let connect = { port: 26000 };
await jrfdb.setConnection(connect);
await jrfdb.connect();
```

---

## [getScheme](#getscheme)

Получить схему по имени или объект содержащий все схемы.

### Входные параметры

**name** - имя получаемой схемы, либо без параметра

### Возвращаемое значение

Схема, объект схем, false если схема не найдена.

---

## [delScheme](#delscheme)

Удалить схему по имени.

### Входные параметры

**name** - имя удаляемой схемы

### Возвращаемое значение

Всегда истина.

