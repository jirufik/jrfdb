# JRFDB

---

![jrfdb](jrfdblogo.png)

## Installation

```bash
$ npm i jrfdb --save
```

Это простая async/await mongoDB orm для Nodejs. Состоит из модели и схем.

**jrfdb** - Cодержит схемы.

**scheme** - Схема содержит структуру коллекции mongoDB. Коллекции схем могут принадлежать разным базам, на разных серверах.

**CRUD** - При добавлении и редактировании документ проверяется на соответствие схеме.

При получении документа, вместо dbref ссылки подставляется документ.

При удалении, проверяется есть ли ссылки на данный документ, если есть, то документ не удаляется.

**hooks** - В каждой схеме можно установить хуки до и после CRUD операции.

## Usage

```js
const jrfdb = require('jrfdb');

// ----------- SCHEMES -----------

let typeBodys = {
    name: 'typeBodys',
    fields: {
        name: {
            description: 'Name',
            type: 'string',
            unique: true
        }
    }
};

let typeBags = {
    name: 'typeBags',
    fields: {
        name: {
            description: 'Name',
            type: 'string',
            unique: true,
            min: 3,
            max: 20
        }
    }
};

// ----------- INIT DB -----------

async function initDB() {

    await jrfdb.addScheme(typeBodys);
    await jrfdb.addScheme(typeBags);

    let scheme = await jrfdb.getScheme('typeBags');
    scheme.setConnection({db: 'jrfThingsTests'});

    await jrfdb.connect();

}

// ----------- ADD DOCS -----------

async function createBody() {

    let scheme = await jrfdb.getScheme('typeBodys');

    let obj = {
        docs: {name: 'coupe', _id: '5b706ac8453a393a68c4f943'}
    };

    let res = await scheme.add(obj);

}

async function createFiveBags(key) {

    let scheme = await jrfdb.getScheme('typeBags');

    let obj = {
        docs: [{name: 'suitcase'}, {name: 'handbag'}, {name: 'package'},
            {name: 'bag'}, {name: 'sack'}]
    };

    let res = await scheme.add(obj);

}
```
  ## jrfdb
  
  * [Connection](docs/jrfdbconnection.md#connection)
    * [setConnection](docs/jrfdbconnection.md#setconnection)
    * [getStrConnect](docs/jrfdbconnection.md#getStrConnect)
    * [connect](docs/jrfdbconnection.md#connect)
    * [disconnect](docs/jrfdbconnection.md#disconnect)
  * [Schemes](docs/jrfdbschemes.md#schemes)
    * [addScheme](docs/jrfdbschemes.md#addScheme)
    * [getScheme](docs/jrfdbschemes.md#getScheme)
    * [delScheme](docs/jrfdbschemes.md#delScheme)
  
## scheme

  * [Connection](docs/schemeconnection.md#connection)
    * [setConnection](docs/schemeconnection.md#setconnection)
    * [getStrConnect](docs/schemeconnection.md#getStrConnect)
    * [connect](docs/schemeconnection.md#connect)
    * [disconnect](docs/schemeconnection.md#disconnect)
    * [resetConnect](docs/schemeconnection.md#resetConnect)
  * [Hooks](docs/schemehooks.md#hooks)
    * [hooksAdd](docs/schemehooks.md#hooksAdd)
    * [hooksGet](docs/schemehooks.md#hooksGet)
    * [hooksDel](docs/schemehooks.md#hooksDel)
    * [hooksSort](docs/schemehooks.md#hooksSort)
    * [hooksConveyor](docs/schemehooks.md#hooksConveyor)
  * [CRUD](docs/schemecrud.md#crud)
    * [add](docs/schemecrud.md#add)
    * [get](docs/schemecrud.md#get)
    * [edit](docs/schemecrud.md#edit)
    * [del](docs/schemecrud.md#del)  
    
