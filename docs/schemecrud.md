# [CRUD](#crud)

---

## [add](#add)

Добавление нового документа в коллекцию. Производится проверка соответствия добавляемого документа схеме. Если документ не соответствует схеме, он добавлен не будет. Перед добавлением выполняются хуки типа **beforeAdd**. После добавления выполняются хуки типа **afterAdd**.

### Входные параметры

**JS** объект с обязательным свойством **docs**. Данный **JS** объект передается в хуки типа **beforeAdd** в виде объекта **param**.

| Name | Type | Description |
| :--- | :--- | :--- |
| **docs** | object/array | Добавляемый документ или массив добавляемых в коллекцию. |

### Пример добавления в коллекцию refuse

```js
const jrfdb = require('../jrfdb');

//---- Описываем схему коллекции ----
let refuse = {
    name: 'refuse',
    fields: {
        code: {
            description: 'Code',
            type: 'number',
            required: true,
            unique: true
        },
        name: {
            description: 'Name',
            type: 'string',
            unique: true
        }
    }
};

//---- Добавление документов ----
async function addRefuse() {

    //---- Получаем схему ----
    let scheme = await jrfdb.getScheme('refuse');

    //---- Объект с массивом добавляемых документов ----
    let obj = {
        docs: [{ code: 1, name: 'error' }, { code: 2, name: 'info' }]
    };

    //---- Добавляем документы ----
    let res = await scheme.add(obj);
    console.log(JSON.stringify(res, null, 4));

}

async function initDB() {

    //---- Создаем схему ----
    await jrfdb.addScheme(refuse);

    //---- Настраиваем глобальную строку подключения ----
    //---- По умолчанию схемы используют глобальную строку подключения ----
    //---- Но у каждой схемы можно настроить свою строку подключения локально ----
    let connect = { port: 26000, db: 'logsTest' };
    await jrfdb.setConnection(connect);

    //---- Подключаем ----
    await jrfdb.connect();

    //---- Добавляем документы ----
    await addRefuse();

}
```

### Ответ добавления документов в refuse

```js
{
    okay: true,
        input: {
        docs: [
            {
                code: 1,
                name: "error",
                _id: "5b6e98c928acdd3b917b4bed"
            },
            {
                code: 2,
                name: "info",
                _id: "5b6e98c928acdd3b917b4bee"
            }
        ]
    },
    output: [
        {
            _id: "5b6e98c928acdd3b917b4bed",
            code: 1,
            name: "error"
        },
        {
            _id: "5b6e98c928acdd3b917b4bee",
            code: 2,
            name: "info"
        }
    ],
        "error": null,
            "validation": []
}
```

В ответ придет объект. После добавления документов в базу, объект ответа передается виде параметра **param** в ловушки типа **afterAdd**.

| Name | Type | Description |
| :--- | :--- | :--- |
| okay | boolean | **true** - документы добавлены **false** - документы не добавлены |
| input | object | Объект \(let = obj\) который был передан на входе, к документам добавлен **\_id** документов в базе |
| output | array | Массив содержащий добавленные в базу документы |
| error | object | Ошибка |
| validation | array | Массив объектов описывающих причины не соответствия документа схеме. Имеет объекты если **okay = false**. Каждые объект содержит свойства **description** - краткое описание не соответствия, **fullDescription** - детальное описание |

### Пример добавления в коллекцию logs

В данной коллекции содержится свойство документа типа **dbref**. Данное поле ссылается на коллекцию **refuse**.

```js
const jrfdb = require('../jrfdb');

//---- Описываем схему коллекции ----
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
            //---- массив содержит элементы dbref ссылающиеся на refuse ----
            description: 'Refuse',
            type: 'array',
            typeArray: 'dbref',
            scheme: 'refuse'
        },
        requiredOneOf: ['wheels', 'refuse']
    }
};

async function addLog() {

    let scheme = await jrfdb.getScheme('logs');
    let obj = {
        docs: {
            bucket: 'super bucket',
            wheels: 2,
            star: {
                name: 'black star'
            },
            //---- dbref заполняются idишником документа на который ссылаются
            refuse: ['5b6e98c928acdd3b917b4bee', '5b6e98c928acdd3b917b4bed']
        }
    };

    let res = await scheme.add(obj);
    console.log(JSON.stringify(res, null, 4));
}
```

### Пример ответа добавления документа в logs

```js
{
    okay: true,
        input: {
        docs: {
            bucket: 'super bucket',
                wheels: 2,
                    star: {
                name: 'black star'
            },
            refuse: [
                {
                    $ref: 'refuse',
                    $id: '5b6e98c928acdd3b917b4bee',
                    $db: 'logsTest'
                },
                {
                    $ref: 'refuse',
                    $id: '5b6e98c928acdd3b917b4bed',
                    $db: 'logsTest'
                }
            ],
                _id: '5b6eaad69c902f4b39ae865d'
        }
    },
    output: [
        {
            _id: '5b6eaad69c902f4b39ae865d',
            bucket: 'super bucket',
            wheels: 2,
            star: {
                name: 'black star'
            },
            refuse: [
                {
                    _id: '5b6e98c928acdd3b917b4bee',
                    code: 2,
                    name: 'info'
                },
                {
                    _id: '5b6e98c928acdd3b917b4bed',
                    code: 1,
                    name: 'error'
                }
            ]
        }
    ],
        error: null,
            validation: []
}
```

**input** - добавляемый документ, добавлен **\_id** документа в базе, также вместо строковых айдишников на объекты **refuse** содержатся объекты типа **dbref**.

**output** - вместо объектов **dbref** содержатся сами документы на которые ссылаются **dbref**.

---

## [get](#get)

Получение документов коллекции. Перед получением выполняются хуки типа **beforeGet**. После получения выполняются хуки типа **afterGet**.

### Входные параметры

**JS** объект с обязательным свойством **query**. Данный **JS** объект передается в хуки типа **beforeGet** в виде объекта **param**.

| **Name** | **Type** | **Description** |
| :--- | :--- | :--- |
| aggregate | array | Выполняется нативный метод агрегации. Если выполняется агрегация то вместо **dbref** не будут подставлены документы на которые ссылка. |
| find | object | Нативный метод |
| sort | object | Нативный метод |
| skip | number | Нативный метод |
| limit | number | Нативный метод |
| dbrefIdOnly | boolean | Если **true** тогда вместо **dbref** будут подставлены **id** документов в виде строки |
| noDbrefDocs | boolean | Если **true** тогда будут возвращены просто **dbref**. Если нет надобности получать документы вместо **dbref**, то лучше использовать флаг для более быстрого выполнения выборки. |

Если есть **aggregate** и другие свойства тогда выполнится только **aggregate**. Если **query** без свойств тогда вернутся все документы коллекции.

Вторым параметром в **get** передается **JS** объект, в котором описаны поля которые будут удвлены из документа(ов). Свойство объекта это имя схемы. Значение свойства массив полей которые необходимо удалить из документа(ов) схемы.

**Пример второго параметра**

```js
let withoutFields = {
  users: ['password, email'],
  roles: ['userCreated, userEdited']  
};
```

### Пример

```js
async function getLog() {

    let scheme = await jrfdb.getScheme('logs');
    let obj = {
        query: {
            find: {
                wheels: 2
            }
        }
    };

    let res = await scheme.get(obj);
    console.log(JSON.stringify(res, null, 4));

}
```

### Ответ

```js
{
    okay: true,
        input: {
        query: {
            find: {
                wheels: 2
            }
        }
    },
    output: [
        {
            _id: '5b6eaad69c902f4b39ae865d',
            bucket: 'super bucket',
            wheels: 2,
            star: {
                name: 'black star'
            },
            refuse: [
                {
                    _id: '5b6e98c928acdd3b917b4bee',
                    code: 2,
                    name: 'info'
                },
                {
                    _id: '5b6e98c928acdd3b917b4bed',
                    code: 1,
                    name: 'error'
                }
            ]
        }
    ],
        error: null,
            validation: []
}
```

В ответ придет объект. Перед ответом, объект ответа передается виде параметра **param** в ловушки типа **afterGet**.

| Name | Type | Description |
| :--- | :--- | :--- |
| okay | boolean | **true** - документы получены **false** - документы не получены |
| input | object | Объект \(let = obj\) который был передан на входе |
| output | array | Массив содержащий полученные из базы документы вместо **dbref** подставлены сами документы |
| error | object | Ошибка |
| validation | array | Массив объектов описывающих причины **okay = false**. Каждые объект содержит свойства **description** - краткое описание, **fullDescription** - детальное описание |

---

## [edit](#edit)

Обновление документов. Перед обновлением выполняются хуки типа **beforeEdit**. После получения выполняются хуки типа **afterEdit**.

Возможно два варианта выполнения обновления нативный метод **update** и не нативный.

### Входные параметры нативного метода

**JS** объект с свойствами

| Name | Type | Description |
| :--- | :--- | :--- |
| **filter** | object | Нативный |
| **update** | object | Нативный |
| upsert | object | Нативный |
| **originalMethod** | boolean | **true** - выполнить нативный метод **update** |

### Входные параметры не нативного метода

**JS** объект с свойствами

| Name | Type | Description |
| :--- | :--- | :--- |
| originalMethod | boolean | **false** - выполнить не нативный метод |
| **docs** | object/array | Объект или массив объектов обновления |

Объект **docs** состоит из

| Name | Type | Description |
| :--- | :--- | :--- |
| **filter** | object | Фильтр по которому будут отобраны обновляемые документы. Используется нативный **find** |
| fields | object | Свойства документа которые должны быть заменены, на новые значения |
| obj | object | Документ будет заменен на документ **obj**. Если есть **obj** то **fields** игнорируется |

### Пример нативного метода

```js
async function editLogOriginal() {

    let scheme = await jrfdb.getScheme('logs');

    let obj = {
        originalMethod: true,
        filter: {
            wheels: 2
        },
        update: {
            $set: {
                wheels: 3
            }
        }
    };

    let res = await scheme.edit(obj);
    console.log(JSON.stringify(res, null, 3));

}
```

### Пример не нативного метода

В не нативном методе документы проходят валидацию соответствия схеме

```js
async function editLog() {

    let scheme = await jrfdb.getScheme('logs');

    let obj = {
        docs: {
            filter: {
                wheels: 2
            },
            fields: {
                wheels: 3
            }
        }
    };

    let res = await scheme.edit(obj);
    console.log(JSON.stringify(res, null, 3));

}
```

### Пример ответа

```js
{
    okay: true,
        input: {
        docs: {
            filter: {
                wheels: 2
            },
            fields: {
                wheels: 3
            }
        }
    },
    output: [
        {
            _id: '5b6edb581008627b8f3353d5',
            bucket: 'super bucket',
            wheels: 3,
            star: {
                name: 'black star'
            },
            refuse: [
                {
                    _id: '5b6e98c928acdd3b917b4bee',
                    code: 2,
                    name: 'info'
                },
                {
                    _id: '5b6e98c928acdd3b917b4bed',
                    code: 1,
                    name: 'error'
                }
            ]
        }
    ],
        error: null,
            validation: []
}
```

В ответ придет объект. Перед ответом, объект ответа передается виде параметра **param** в ловушки типа **afterEdit**.

| Name | Type | Description |
| :--- | :--- | :--- |
| okay | boolean | **true** - документы получены **false** - документы не получены |
| input | object | Объект \(let = obj\) который был передан на входе |
| output | array | Массив содержащий обновленные из базы документы вместо **dbref** подставлены сами документы |
| error | object | Ошибка |
| validation | array | Массив объектов описывающих причины не обновления документов**okay = false**. Каждые объект содержит свойства **description** - краткое описание, **fullDescription** - детальное описание |

---

## [del](#del)

Удаление документов. Перед удалением выполняются хуки типа **beforeDel**. После удаления выполняются хуки типа **afterDel**.

Возможно два варианта выполнения удаления нативный метод **deleteMany** и не нативный. Не нативный, проверяет если есть ссылки на удаляемый документ в документах других коллекций, то документ не удаляется.

### Входные параметры

**JS** объект с свойствами

| Name | Type | Description |
| :--- | :--- | :--- |
| **filter** | object | В нативном и не нативном, фильтр отбора удаляемых документов. |
| originalMethod | boolean | Если **true** то используется нативный метод |

### Пример удаления документов

```js
async function delRefuse() {

    let scheme = await jrfdb.getScheme('refuse');

    let obj = {
        filter: {
            code: {
                $in: [1, 2]
            }
        }
    };

    let res = await scheme.del(obj);
    console.log(JSON.stringify(res, null, 4));

}
```

### Пример ответа

```js
{
    okay: true,
        input: {
        filter: {
            code: {
                $in: [
                    1,
                    2
                ]
            }
        }
    },
    output: [
        {
            _id: '5b6f37b7e94e6e2feb7ca967',
            code: 2,
            name: 'info'
        }
    ],
        error: null,
            validation: []
}
```

Удален только документ с кодом 2 т.к. на него нет ссылок из других документов, документ с кодом 1 не удален, на него есть ссылки.

В ответ придет объект. Перед ответом, объект ответа передается виде параметра **param** в ловушки типа **afterDel**.

| Name | Type | Description |
| :--- | :--- | :--- |
| okay | boolean | **true** - документы получены **false** - документы не получены |
| input | object | Объект \(let = obj\) который был передан на входе |
| output | array | Массив содержащий удаленные из базы документы вместо **dbref** подставлены сами документы |
| error | object | Ошибка |
| validation | array | Массив объектов описывающих причины не обновления документов**okay = false**. Каждые объект содержит свойства **description** - краткое описание, **fullDescription** - детальное описание |



