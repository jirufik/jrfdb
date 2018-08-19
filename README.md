# JRFDB

---

![jrfdb](jrfdblogo.png)

## Installation

```bash
$ npm i jrfDb --save
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
const jrfDb = require('jrfDb');

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

    await jrfDb.addScheme(typeBodys);
    await jrfDb.addScheme(typeBags);

    let scheme = await jrfDb.getScheme('typeBags');
    scheme.setConnection({db: 'jrfThingsTests'});

    await jrfDb.connect();

}

// ----------- ADD DOCS -----------

async function createBody() {

    let scheme = await jrfDb.getScheme('typeBodys');

    let obj = {
        docs: {name: 'coupe', _id: '5b706ac8453a393a68c4f943'}
    };

    let res = await scheme.add(obj);

}

async function createFiveBags(key) {

    let scheme = await jrfDb.getScheme('typeBags');

    let obj = {
        docs: [{name: 'suitcase'}, {name: 'handbag'}, {name: 'package'},
            {name: 'bag'}, {name: 'sack'}]
    };

    let res = await scheme.add(obj);

}
```
  ## jrfdb
  
  * [Connection](docs/jrfdbconnection.md#[connection](#connection))
    * [setConnection](docs/jrfdbconnection.md#[setconnection](#setconnection))
    * [getStrConnect](docs/jrfdbconnection.md#[getStrConnect](#getStrConnect))
    * [connect](docs/jrfdbconnection.md#connect)
    * [disconnect](docs/jrfdbconnection.md#[disconnect](#disconnect))
  * [Schemes](docs/jrfdbschemes.md#[schemes](#schemes))
    * [addScheme](docs/jrfdbschemes.md#[addScheme](#addScheme))
    * [getScheme](docs/jrfdbschemes.md#[getScheme](#getScheme))
    * [delScheme](docs/jrfdbschemes.md#[delScheme](#delScheme))
  
## scheme

  * [Connection](docs/schemeconnection.md#[connection](#connection))
    * [setConnection](docs/schemeconnection.md#[setconnection](#setconnection))
    * [getStrConnect](docs/schemeconnection.md#[getStrConnect](#getStrConnect))
    * [connect](docs/schemeconnection.md#[connect](#connect))
    * [disconnect](docs/schemeconnection.md#[disconnect](#disconnect))
    * [resetConnect](docs/schemeconnection.md#[resetConnect](#resetConnect))
  * [Hooks](docs/schemehooks.md#[hooks](#hooks))
    * [hooksAdd](docs/schemehooks.md#[hooksAdd](#hooksAdd))
    * [hooksGet](docs/schemehooks.md#[hooksGet](#hooksGet))
    * [hooksDel](docs/schemehooks.md#[hooksDel](#hooksDel))
    * [hooksSort](docs/schemehooks.md#[hooksSort](#hooksSort))
    * [hooksConveyor](docs/schemehooks.md#[hooksConveyor](#hooksConveyor))
  * [CRUD](docs/schemecrud.md#[crud](#crud))
    * [add](docs/schemecrud.md#[add](#add))
    * [get](docs/schemecrud.md#[get](#get))
    * [edit](docs/schemecrud.md#[edit](#edit))
    * [del](docs/schemecrud.md#[del](#del))  
    
