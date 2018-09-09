const mongoClient = require('mongodb').MongoClient;
const objectID = require('mongodb').ObjectID;
const dbRef = require('mongodb').DBRef;

////------------------ START CLASS JRFDB ------------------

class JRFDB {

    ////--------- START MAIN ---------

    constructor(counter = 0) {

        this.counter = 0;
        this.schemes = {};

        this.urlConnect = {
            hostname: 'localhost',
            port: '26000',
            user: '',
            pass: '',
            db: '',
            collection: ''
        };

        this.db = null;

    }

    ////--------- END MAIN ---------

    ////--------- START CONNECTION ---------

    async setConnection(connect) {

        if (typeof connect !== 'object') {
            return;
        }

        if (connect.hostname) {
            this.urlConnect.hostname = connect.hostname;
        }

        if (connect.port) {
            this.urlConnect.port = connect.port;
        }

        if (connect.user) {
            this.urlConnect.user = connect.user;
        }

        if (connect.pass) {
            this.urlConnect.pass = connect.pass;
        }

        if (connect.db) {
            this.urlConnect.db = connect.db;
        }

        if (connect.collection) {
            this.urlConnect.collection = connect.collection;
        }

        if (this.db) {

            for (let scheme in this.schemes) {
                await this.schemes[scheme].disconnect();
            }

            await this.disconnect();

            await this.connect();

            for (let scheme in this.schemes) {
                await this.schemes[scheme].connect();
            }

        }

    }

    async getStrConnect() {

        let url = 'mongodb://';
        let strUser = '';
        let strPass = '';

        strUser = this.urlConnect.user;
        strPass = this.urlConnect.pass;

        if (strUser || strPass) {
            url += strUser + ':' + strPass + '@';
        }

        if (this.urlConnect.hostname) {
            url += this.urlConnect.hostname;
        }

        if (this.urlConnect.port) {
            url += ':' + this.urlConnect.port;
        }

        if (this.urlConnect.db) {
            url += '/' + this.urlConnect.db;
        }

        return url;
    }

    async testConnect() {

        let url = await this.getStrConnect();

        try {
            let db = await mongoClient.connect(url);
            db.close();
            return true;
        } catch (err) {
            console.log(`jrfDB not connect: ${url}`);
            // console.log(err);
        }
        return false;
    }

    async connect(url) {

        await this.disconnect();

        if (!url) {
            url = await this.getStrConnect();
        }

        try {
            this.db = await mongoClient.connect(url);

            for (let scheme in this.schemes) {
                await this.schemes[scheme].connect();
            }

            return true;
        } catch (err) {
            console.log(`jrfDB not connect: ${url}`);
            // console.log(err);
        }
        return false;
    }

    async disconnect() {

        for (let scheme in this.schemes) {
            await this.schemes[scheme].disconnect();
        }

        if (!this.db) {
            return true;
        }

        try {
            this.db.close();
            this.db = null;
            return true;
        } catch (err) {
            console.log(`jrfDB not disconnect`);
        }

        return false;

    }

    ////--------- END CONNECTION ---------

    ////--------- START SCHEME ---------

    async addScheme(obj) {

        let scheme = new Scheme(obj);
        await scheme.init(obj);
        if (!scheme.isValid) {
            return false;
        }

        this.schemes[scheme.name] = scheme;

        return true;

    }

    async getScheme(name) {

        try {

            if (name) {
                return this.schemes[name];
            }

            return this.schemes;

        } catch (err) {

        }

        return false;
    }

    async delScheme(name) {

        if (this.schemes[name]) {

            await this.schemes[name].disconnect();
            delete this.schemes[name];

        }
        return true;
    }

    ////--------- END SCHEME ---------

}

let jrfd = new JRFDB();

////------------------ END CLASS JRFDB ------------------


////------------------ START CLASS SCHEME ------------------

class Scheme {

    ////--------- START MAIN ---------

    constructor(obj) {

        this.urlConnect = {};
        this.isValid = true;
        this.name = '';
        this.strict = false;
        this.db = null;
        this.dbrefs = [];

        this.hooks = {
            beforeAdd: [],
            afterAdd: [],
            beforeGet: [],
            afterGet: [],
            beforeEdit: [],
            afterEdit: [],
            beforeDel: [],
            afterDel: [],
            beforeErase: [],
            afterErase: []
        };

        if (typeof obj !== 'object') {
            console.log(`jrfdDB scheme not object: ${obj}`);
            this.isValid = false;
            return this;
        }

        if (!obj.name) {
            console.log(`jrfdDB scheme not name: ${obj}`);
            this.isValid = false;
            return this;
        }

        if (typeof obj.name !== 'string') {
            console.log(`jrfdDB scheme name not string: ${obj}`);
            this.isValid = false;
            return this;
        }

        if (!obj.fields) {
            console.log(`jrfdDB scheme not fields: ${obj}`);
            this.isValid = false;
            return this;
        }

        if (typeof obj.fields !== 'object') {
            console.log(`jrfdDB scheme fields not object: ${obj}`);
            this.isValid = false;
            return this;
        }

        if (obj.strict) {
            this.strict = true;
        }

        this.name = obj.name;

    }

    async init(obj) {

        this.dbrefs = [];

        let isValid = await this.objIsValid(obj);
        if (!isValid) {
            this.isValid = false;
            return;
        }

        isValid = await this.hooksIsValid(obj);
        if (!isValid) {
            this.isValid = false;
            return;
        }

        isValid = await this.fieldsIsValid(obj.fields);
        if (!isValid) {
            this.isValid = false;
            return;
        }

        this.urlConnect.collection = obj.name;
        this.fields = obj.fields;
        this.isValid = true;

    }

    async objIsValid(obj) {

        if (typeof obj !== 'object') {
            console.log(`jrfdDB scheme not object: ${obj}`);
            return false;//{isValid: false};
        }

        if (!obj.name) {
            console.log(`jrfdDB scheme not name: ${obj}`);
            return false;//{isValid: false};
        }

        if (typeof obj.name !== 'string') {
            console.log(`jrfdDB scheme name not string: ${obj}`);
            return false;//{isValid: false};
        }

        if (!obj.fields) {
            console.log(`jrfdDB scheme not fields: ${obj}`);
            return false;//{isValid: false};
        }

        if (typeof obj.fields !== 'object') {
            console.log(`jrfdDB scheme fields not object: ${obj}`);
            return false;//{isValid: false};
        }

        return true;

    }

    async hooksIsValid(obj) {

        for (let typeHook in this.hooks) {

            if (!obj[typeHook]) {
                continue;
            }

            // console.log(obj[typeHook]);
            if (typeof obj[typeHook] !== 'object') {
                console.log(`jrfdDB scheme ${typeHook} not array: ${obj}`);
                return false;
            }

            if (!obj[typeHook].length) {
                continue;
            }

            for (let hook of obj[typeHook]) {

                if (typeof hook !== 'object') {
                    console.log(`jrfdDB scheme ${typeHook} element of array not object: ${obj}`);
                    return false;
                }

                if (!hook.func) {
                    console.log(`jrfdDB scheme ${typeHook} element of array not func: ${obj}`);
                    return false;
                }

                if (typeof hook.func !== 'function') {
                    console.log(`jrfdDB scheme ${typeHook} element of array func not function: ${obj}`);
                    return false;
                }

                let hookName = hook.func.name;
                if (hook.name) {
                    hookName = hook.name;
                }

                let priority = 10;
                if (hook.priority) {
                    priority = hook.priority;
                }

                let description = '';
                if (hook.description) {
                    description = hook.description;
                }

                let res = await this.hooksAdd(typeHook, hookName, hook.func, priority, description);
                if (!res) {
                    return false;
                }

            }

        }

        return true;

    }

    async fieldsIsValid(fields, path = '', level = 0) {

        // console.log(`Path: ${path} Level: ${level}`);
        for (let field in fields) {
            // console.log(`${path}${field} level: ${level}`);
            // console.log(field);
            // console.log(fields[field]);
            // console.log(typeof fields[field]);
            if (typeof fields[field] !== 'object') {

                if (path) {
                    console.log(`jrfdDB scheme "${this.name}" field "${path}${field}" not object`);
                } else {
                    console.log(`jrfdDB scheme "${this.name}" field "${field}" not object`);
                }
                return false;

            }


            if (fields[field].type) {

                if (fields[field].type === 'dbref' && !fields[field].scheme) {

                    if (path) {
                        console.log(`jrfdDB scheme "${this.name}" fields in field "${path}${field}" not scheme`);
                    } else {
                        console.log(`jrfdDB scheme "${this.name}" fields in field "${field}" not scheme`);
                    }
                    return false;

                } else if (fields[field].type === 'dbref' && fields[field].scheme) {

                    let dbref = {
                        scheme: fields[field].scheme,
                        path: field
                    };

                    if (path) {
                        dbref.path = path + field;
                    }

                    this.dbrefs.push(dbref);

                } else if (fields[field].type === 'array' && fields[field].typeArray === 'dbref' && fields[field].scheme) {

                    let dbref = {
                        scheme: fields[field].scheme,
                        path: field,
                        isArray: true
                    };

                    if (path) {
                        dbref.path = path + field;
                    }

                    this.dbrefs.push(dbref);

                }

                if (fields[field].type === 'array' && fields[field].fields
                    || fields[field].type === 'object' && fields[field].fields) {

                    if (typeof fields[field].fields !== 'object') {
                        if (path) {
                            console.log(`jrfdDB scheme "${this.name}" fields in field "${path}${field}" not object`);
                        } else {
                            console.log(`jrfdDB scheme "${this.name}" fields in field "${field}" not object`);
                        }
                        return false;
                    }

                    let newPath = path + '' + field + '.';
                    let newlevel = level + 1;
                    let newFields = fields[field].fields;
                    let res = await this.fieldsIsValid(newFields, newPath, newlevel);
                    if (!res) {
                        return false;
                    }

                }
            }

        }

        return true;

    }

    ////--------- END MAIN ---------


    ////--------- START HOOKS ---------

    async hooksAdd(type, name, func, priority = 10, description = '') {

        if (!type) {
            console.log('jrfDB not type');
            return false;
        }

        if (typeof type !== 'string') {
            console.log('jrfDB type not string');
            return false;
        }

        let typeFound = false;
        for (let hook in this.hooks) {
            if (hook === type) {
                typeFound = true;
                break;
            }
        }

        if (!typeFound) {
            console.log('jrfDB type not found');
            return false;
        }

        if (!name) {
            console.log('jrfDB not name');
            return false;
        }

        if (typeof name !== 'string') {
            console.log('jrfDB name not string');
            return false;
        }

        if (!func) {
            console.log('jrfDB not func');
            return false;
        }

        if (typeof func !== 'function') {
            console.log('jrfDB func not function');
            return false;
        }

        if (typeof priority !== 'number') {
            console.log('jrfDB priority not number');
            return false;
        }

        if (description) {
            if (typeof description !== 'string') {
                console.log('jrfDB description not string');
                return false;
            }
        }

        let hook = await this.hooksGet(type, name);
        if (hook) {
            hook.func = func;
            hook.priority = priority;
            hook.description = description;
            await this.hooksSort(type);
            return true;
        }

        hook = {
            name,
            func,
            priority,
            description
        };

        // console.log(JSON.stringify(hook, null, 3));
        // console.log(hook.func);
        this.hooks[type].push(hook);
        await this.hooksSort(type);
        return true;

    }

    async hooksGet(type, name) {

        if (!type) {
            console.log('jrfDB not type');
            return false;
        }

        if (typeof type !== 'string') {
            console.log('jrfDB type not string');
            return false;
        }

        let typeFound = false;
        for (let hook in this.hooks) {
            if (hook === type) {
                typeFound = true;
                break;
            }
        }

        if (!typeFound) {
            console.log('jrfDB type not found');
            return false;
        }

        if (name) {
            if (typeof name !== 'string') {
                console.log('jrfDB name not string');
                return false;
            }
        }

        if (!name) {
            return this.hooks[type];
        }

        let hooks = this.hooks[type];
        if (!hooks.length) {
            return false;
        }

        for (let hook of hooks) {
            if (hook.name === name) {
                return hook;
            }
        }

        return false;

    }

    async hooksDel(type, name) {

        if (!type) {
            console.log('jrfDB not type');
            return false;
        }

        if (typeof type !== 'string') {
            console.log('jrfDB type not string');
            return false;
        }

        let typeFound = false;
        for (let hook in this.hooks) {
            if (hook === type) {
                typeFound = true;
                break;
            }
        }

        if (!typeFound) {
            console.log('jrfDB type not found');
            return false;
        }

        if (name) {
            if (typeof name !== 'string') {
                console.log('jrfDB name not string');
                return false;
            }
        }

        if (!name) {
            this.hooks[type] = [];
            return true;
        }

        let hooks = this.hooks[type];

        if (!hooks.length) {
            return true;
        }

        let index = -1;
        for (let hook of hooks) {
            if (hook.name === name) {
                index = hooks.indexOf(hook);
                break;
            }
        }

        if (index > -1) {
            hooks.splice(index, 1);
        }

        return true;

    }

    async hooksSort(type) {

        if (!type) {
            console.log('jrfDB not type');
            return false;
        }

        if (typeof type !== 'string') {
            console.log('jrfDB type not string');
            return false;
        }

        let typeFound = false;
        for (let hook in this.hooks) {
            if (hook === type) {
                typeFound = true;
                break;
            }
        }

        if (!typeFound) {
            console.log('jrfDB type not found');
            return false;
        }

        this.hooks[type].sort(function (a, b) {
            if (a.priority > b.priority) {
                return 1;
            }
            if (a.priority < b.priority) {
                return -1;
            }
            return 0;
        });

        return true;

    }

    async hooksConveyor(type, param) {

        if (!type) {
            console.log('jrfDB not type');
            return false;
        }

        if (typeof type !== 'string') {
            console.log('jrfDB type not string');
            return false;
        }

        let hooks = false;
        for (let hook in this.hooks) {
            if (hook === type) {
                hooks = this.hooks[hook];
                break;
            }
        }

        if (!hooks) {
            console.log('jrfDB type not found');
            return false;
        }

        await this.hooksSort(type);

        let next = {
            continue: true
        };
        let hookResult = null;

        for (let hook of hooks) {
            hookResult = await hook.func(next, param);
            if (!next.continue) {
                break;
            }
        }

        return {
            next,
            param,
            hookResult
        }
    }

    ////--------- END HOOKS ---------


    ////--------- START CRUID ---------

    //// ----------- ADD -----------

    async add(obj) {

        let result = {
            okay: true,
            input: obj,
            output: {},
            error: null,
            validation: []
        };

        if (typeof obj !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid obj`,
                fullDescription: `obj not object`
            });

            return result;

        }

        if (!obj.docs) {

            result.okay = false;
            result.validation.push({
                description: `invalid obj`,
                fullDescription: `obj not docs`
            });

            return result;

        }

        if (typeof obj.docs !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid docs`,
                fullDescription: `docs not object`
            });

            return result;

        }

        let flArray = obj.docs.length;
        let res = null;

        if (flArray) {

            for (let doc of obj.docs) {
                res = await this.docIsValid(doc);
                if (!res.okay) {
                    result.okay = false;
                    result.validation.push({
                        description: res.description,
                        fullDescription: res.description
                    });
                    return result;
                }
            }

        } else {
            res = await this.docIsValid(obj.docs);
            if (!res.okay) {
                result.okay = false;
                result.validation.push({
                    description: res.description,
                    fullDescription: res.description
                });
                return result;
            }
        }

        let resHooks = await this.hooksConveyor('beforeAdd', obj);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks before`
            });

            return result;

        }

        /// add
        let db = await this.getDB();
        let output = [];
        let ids = [];
        let collection = db.collection(this.urlConnect.collection);
        let resAdd = null;
        if (flArray) {
            resAdd = (await collection.insertMany(obj.docs));
            for (let doc of obj.docs) {
                ids.push(doc._id);
            }
        } else {
            resAdd = (await collection.insertOne(obj.docs));
            ids.push(obj.docs._id);
        }
        // console.log(JSON.stringify(resAdd, null, 3));
        let objQuery = {
            query: {
                find: {_id: {$in: ids}}
            }
        };

        res = await this.get(objQuery);
        output = res.output;
        result.output = output;

        resHooks = await this.hooksConveyor('afterAdd', result);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks after`
            });

            return result;

        }

        return result;

    }

    async docIsValid(doc, idDoc) {

        let result = {
            okay: true,
            description: ''
        };

        if (doc._id) {
            doc._id = await this.getObjectID(doc._id);
        }

        let res = await this.docIsValidByScheme(doc, this.fields, idDoc);
        if (!res.okay) {
            return res;
        }

        return result;

    }

    async docIsValidByScheme(doc, fields, idDoc, path = '', pathFull = '', level = 0) {

        let result = {
            okay: true,
            description: ''
        };

        let notFindId = idDoc;
        if (idDoc) {
            if (typeof idDoc === 'string' || typeof idDoc === 'number') {
                console.log(notFindId);
                notFindId = await this.getObjectID(idDoc);
            }
        }

        let flFindRequired = true;

        if (fields.requiredOneOf) {
            if (typeof fields.requiredOneOf === `object` && fields.requiredOneOf.length) {
                flFindRequired = false;
            }
        }

        for (let field in fields) {

            // console.log(`${path + field} from ${JSON.stringify(fields)}`);
            // console.log(`${path + field}`);
            let fieldValue = fields[path + field];
            // console.log(fieldValue);

            /// default
            if (!doc.hasOwnProperty(path + field) && fieldValue.default) {
                doc[path + field] = fieldValue.default;
            }

            /// required
            if (!doc.hasOwnProperty(path + field) && fieldValue.required) {
                result.okay = false;
                result.description = `Docs not have ${path + field}`;
                return result;
            }

            let docValue = null;

            /// boolean
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'boolean') {
                docValue = doc[path + field];
                if (typeof docValue !== `boolean`) {
                    result.okay = false;
                    result.description = `Boolean field not boolean, path: ${path + field}`;
                    return result;
                }
            }

            /// date
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'date') {
                docValue = doc[path + field];
                if (Object.prototype.toString.call(docValue) !== '[object Date]') {
                    result.okay = false;
                    result.description = `Date field not date, path: ${path + field}`;
                    return result;
                }
            }

            /// string
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'string') {

                docValue = doc[path + field];
                if (typeof docValue !== `string`) {
                    result.okay = false;
                    result.description = `String field not string, path: ${path + field}`;
                    return result;
                }

                if (fieldValue.min && docValue.length < fieldValue.min) {
                    result.okay = false;
                    result.description = `String field < ${fieldValue.min} chars length, path: ${path + field}`;
                    return result;
                }

                if (fieldValue.max && docValue.length > fieldValue.max) {
                    result.okay = false;
                    result.description = `String field > ${fieldValue.max} chars length, path: ${path + field}`;
                    return result;
                }

                if (fieldValue.unique) {

                    let findPath = path + field;
                    let obj = {
                        query: {
                            find: {[findPath]: docValue, _id: {$ne: notFindId}}
                        }
                    };

                    let res = await this.get(obj);
                    // console.log(JSON.stringify(res, null, 3));

                    if (!res.okay) {
                        result.okay = false;
                        result.description = `String value not unique "${docValue}", path: ${path + field}`;
                        return result;
                    }

                    if (res.output && typeof res.output === 'object' && res.output.length) {
                        result.okay = false;
                        result.description = `String value not unique "${docValue}", path: ${path + field}`;
                        return result;
                    }

                }

            }

            /// number
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'number') {

                docValue = doc[path + field];
                if (typeof docValue !== `number`) {
                    result.okay = false;
                    result.description = `Number field not number, path: ${path + field}`;
                    return result;
                }

                if (typeof fieldValue.min === 'number' && fieldValue.min && docValue < fieldValue.min) {
                    result.okay = false;
                    result.description = `Number field < ${fieldValue.min}, path: ${path + field}`;
                    return result;
                }

                if (typeof fieldValue.max === 'number' && fieldValue.max && docValue > fieldValue.max) {
                    result.okay = false;
                    result.description = `Number field > ${fieldValue.max}, path: ${path + field}`;
                    return result;
                }

                if (fieldValue.unique) {

                    let findPath = path + field;
                    let obj = {
                        query: {
                            find: {[findPath]: docValue, _id: {$ne: notFindId}}
                        }
                    };

                    let res = await this.get(obj);

                    if (!res.okay) {
                        result.okay = false;
                        result.description = `Number value not unique "${docValue}", path: ${path + field}`;
                        return result;
                    }

                    if (res.output && typeof res.output === 'object' && res.output.length) {
                        result.okay = false;
                        result.description = `Number value not unique "${docValue}", path: ${path + field}`;
                        return result;
                    }

                }

            }

            /// dbref
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'dbref') {

                docValue = await this.getObjectID(doc[path + field]);
                if (!docValue) {
                    result.okay = false;
                    result.description = `Scheme "${fieldValue.scheme}" invalid dbref id, path: ${path + field}`;
                    return result;
                }

                let scheme = await jrfd.getScheme(fieldValue.scheme);
                if (!scheme) {
                    result.okay = false;
                    result.description = `Scheme "${fieldValue.scheme}" not found, path: ${path + field}`;
                    return result;
                }

                let obj = {
                    query: {
                        find: {_id: docValue}
                    }
                };

                let res = null;
                try {
                    res = await scheme.get(obj);
                } catch (err) {
                    result.okay = false;
                    result.description = `Dbref "${docValue}" not id dbref, path: ${path + field}`;
                    return result;
                }

                if (!res.okay) {
                    result.okay = false;
                    result.description = `Dbref "${docValue}" not found, path: ${path + field}`;
                    return result;
                }

                if (!res.output.length) {
                    result.okay = false;
                    result.description = `Dbref "${docValue}" not found, path: ${path + field}`;
                    return result;
                }
                let objFromScheme = res.output[0];

                if (fieldValue.unique) {

                    let findPath = path + field;
                    let obj = {
                        query: {
                            find: {[findPath + '.$id']: objFromScheme._id, _id: {$ne: notFindId}}
                        }
                    };

                    let res = null;
                    try {
                        res = await this.get(obj);
                    } catch (err) {
                        result.okay = false;
                        result.description = `Dbref "${docValue}" not id dbref, path: ${path + field}`;
                        return result;
                    }

                    if (!res.okay) {
                        result.okay = false;
                        result.description = `Dbref value not unique "${docValue}", path: ${path + field}`;
                        return result;
                    }

                    if (res.output && typeof res.output === 'object' && res.output.length) {
                        result.okay = false;
                        result.description = `Dbref value not unique "${docValue}", path: ${path + field}`;
                        return result;
                    }

                }

                let strDb = scheme.urlConnect.db;
                if (!strDb) {
                    strDb = jrfd.urlConnect.db;
                }
                doc[path + field] = dbRef(scheme.urlConnect.collection, docValue, strDb);

            }

            /// object
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'object') {

                docValue = doc[path + field];
                if (typeof docValue !== `object`) {
                    result.okay = false;
                    result.description = `Object field not object, path: ${path + field}`;
                    return result;
                }

                // console.log(fieldValue);
                // console.log(docValue);
                // console.log(fieldValue.fields);
                if (fieldValue.fields) {
                    let res = await this.docIsValidByScheme(docValue, fieldValue.fields, idDoc);

                    if (!res.okay) {
                        result.okay = false;
                        result.description = res.description;
                        return result;
                    }
                }

            }

            /// array
            if (doc.hasOwnProperty(path + field) && fieldValue.type === 'array') {

                docValue = doc[path + field];
                if (typeof docValue !== `object` || !docValue.length) {
                    result.okay = false;
                    result.description = `Array field not array, path: ${path + field}`;
                    return result;
                }

                /// count
                if (typeof fieldValue.lengthMin === 'number' && fieldValue.lengthMin && docValue.length < fieldValue.lengthMin) {
                    result.okay = false;
                    result.description = `Array length < ${fieldValue.lengthMin}, path: ${path + field}`;
                    return result;
                }

                if (typeof fieldValue.lengthMax === 'number' && fieldValue.lengthMax && docValue.length > fieldValue.lengthMax) {
                    result.okay = false;
                    result.description = `Array length > ${fieldValue.lengthMax}, path: ${path + field}`;
                    return result;
                }

                if (!fieldValue.typeArray) {
                    return result;
                }

                for (let elArr of docValue) {

                    // console.log('elArr: ' + elArr);
                    /// string
                    if (fieldValue.typeArray === 'string') {

                        if (typeof elArr !== `string`) {
                            result.okay = false;
                            result.description = `String field "${elArr}" not string, path: ${path + field}`;
                            return result;
                        }

                        if (fieldValue.min && elArr.length < fieldValue.min) {
                            result.okay = false;
                            result.description = `String field "${elArr}" < ${fieldValue.min} chars length, path: ${path + field}`;
                            return result;
                        }

                        if (fieldValue.max && elArr.length > fieldValue.max) {
                            result.okay = false;
                            result.description = `String field  "${elArr}" > ${fieldValue.max} chars length, path: ${path + field}`;
                            return result;
                        }


                    } else if (fieldValue.typeArray === 'date') {

                        if (Object.prototype.toString.call(elArr) !== '[object Date]') {
                            result.okay = false;
                            result.description = `Date field "${elArr}" not date, path: ${path + field}`;
                            return result;
                        }

                    } else if (fieldValue.typeArray === 'number') {
                        /// number

                        if (typeof elArr !== `number`) {
                            result.okay = false;
                            result.description = `Number field "${elArr}" not number, path: ${path + field}`;
                            return result;
                        }

                        if (typeof fieldValue.min === 'number' && fieldValue.min && elArr < fieldValue.min) {
                            result.okay = false;
                            result.description = `Number field "${elArr}" < ${fieldValue.min}, path: ${path + field}`;
                            return result;
                        }

                        if (typeof fieldValue.max === 'number' && fieldValue.max && elArr > fieldValue.max) {
                            result.okay = false;
                            result.description = `Number field "${elArr}" > ${fieldValue.max}, path: ${path + field}`;
                            return result;
                        }

                    } else if (fieldValue.typeArray === 'object') {
                        /// object

                        if (typeof elArr !== `object`) {
                            result.okay = false;
                            result.description = `Object field "${elArr}" not object, path: ${path + field}`;
                            return result;
                        }

                        if (fieldValue.fields) {
                            let res = await this.docIsValidByScheme(elArr, fieldValue.fields, idDoc);

                            if (!res.okay) {
                                result.okay = false;
                                result.description = res.description;
                                return result;
                            }
                        }

                    } else if (fieldValue.typeArray === 'dbref') {
                        /// dbref

                        let scheme = await jrfd.getScheme(fieldValue.scheme);
                        if (!scheme) {
                            result.okay = false;
                            result.description = `Scheme "${fieldValue.scheme}" not found, path: ${path + field}`;
                            return result;
                        }

                        let obj = {
                            query: {
                                find: {_id: elArr}
                            }
                        };

                        let res = null;
                        try {
                            res = await scheme.get(obj);
                        } catch (err) {
                            result.okay = false;
                            result.description = `Dbref "${elArr}" not id dbref, path: ${path + field}`;
                            return result;
                        }

                        if (!res.okay) {
                            result.okay = false;
                            result.description = `Dbref "${elArr}" not found, path: ${path + field}`;
                            return result;
                        }

                        if (!res.output.length) {
                            result.okay = false;
                            result.description = `Dbref "${elArr}" not found, path: ${path + field}`;
                            return result;
                        }

                        let strDb = scheme.urlConnect.db;
                        if (!strDb) {
                            strDb = jrfd.urlConnect.db;
                        }

                        let idx = docValue.indexOf(elArr);

                        let tmpId = await this.getObjectID(elArr);
                        if (!tmpId) {
                            result.okay = false;
                            result.description = `Array field "${elArr}" invalid dbref id, path: ${path + field}`;
                            return result;
                        }

                        doc[path + field][idx] = dbRef(scheme.urlConnect.collection, tmpId, strDb);

                    } else if (fieldValue.typeArray === 'array') {
                        /// array

                        if (typeof elArr !== `object` || !elArr.length) {
                            result.okay = false;
                            result.description = `Array field "${elArr}" not array, path: ${path + field}`;
                            return result;
                        }

                    }


                }

            }

            if (!flFindRequired && docValue) {

                for (let nameField of fields.requiredOneOf) {
                    // console.log(field);
                    if (field === nameField) {
                        // console.log(`field: ${field} = nameField: ${nameField}`);
                        flFindRequired = true;
                        break;
                    }
                }

            }


        }

        if (!flFindRequired) {
            result.okay = false;
            result.description = `One of the required fields is not filled: ${fields.requiredOneOf.toString()}`;
            return result;
        }

        return result;

    }

    //// ----------- GET -----------

    async get(obj) {

        let result = {
            okay: true,
            input: obj,
            output: {},
            error: null,
            validation: []
        };

        if (typeof obj !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid obj`,
                fullDescription: `obj not object`
            });

            return result;

        }

        if (!obj.query) {

            result.okay = false;
            result.validation.push({
                description: `invalid obj`,
                fullDescription: `obj not query`
            });

            return result;

        }

        if (typeof obj.query !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid query`,
                fullDescription: `query not object`
            });

            return result;

        }

        let flAggregation = false;

        if (obj.query.aggregate) {

            flAggregation = true;

            if (typeof obj.query.aggregate !== 'object') {

                result.okay = false;
                result.validation.push({
                    description: `invalid aggregate`,
                    fullDescription: `aggregate not array`
                });

                return result;

            }

            if (!obj.query.aggregate.length) {

                result.okay = false;
                result.validation.push({
                    description: `invalid aggregate`,
                    fullDescription: `aggregate array not length`
                });

                return result;

            }
        }

        let resHooks = await this.hooksConveyor('beforeGet', obj);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks before`
            });

            return result;

        }


        let db = await this.getDB();
        let output = [];
        if (flAggregation) {

            let collection = db.collection(this.urlConnect.collection);
            output = (await collection.aggregate(resHooks.param.query.aggregate).toArray());
            result.output = output;

            resHooks = await this.hooksConveyor('afterGet', result);
            if (!resHooks.next.continue) {

                result.okay = false;
                result.validation.push({
                    description: `invalid hooks`,
                    fullDescription: `invalid hooks after`
                });

                return result;

            }

            return result;

        }

        let find = resHooks.param.query.find || {};
        let sort = resHooks.param.query.sort || {};
        let skip = resHooks.param.query.skip || 0;
        let limit = resHooks.param.query.limit || 0;

        await this._idToObjectId(find);

        let collection = db.collection(this.urlConnect.collection);
        output = (await collection.find(find).sort(sort).skip(skip).limit(limit).toArray());
        result.output = output;

        if (this.dbrefs.length) {
            if (!resHooks.param.query.noDbrefDocs) {
                for (let doc of result.output) {
                    await this.fillDbrefsDoc(doc, resHooks.param.query.dbrefIdOnly);
                }
            }
        }

        resHooks = await this.hooksConveyor('afterGet', result);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks after`
            });

            return result;

        }

        return result;

    }

    async _idToObjectId(find) {

        for (let field in find) {

            let fieldValue = find[field];

            /// ------- _id -------
            if (field === '_id' && typeof fieldValue === 'string') {
                let id = await this.getObjectID(fieldValue);
                if (id) {
                    find[field] = id;
                }
                continue;
            }

            /// ------- _id.$in _id.$nin -------
            if (field === '_id' && typeof fieldValue === 'object') {

                let ids = [];
                let idsObj = [];
                if (fieldValue.$in && Array.isArray(fieldValue.$in)) {
                    ids = fieldValue.$in;
                }

                if (fieldValue.$nin && Array.isArray(fieldValue.$nin)) {
                    ids = fieldValue.$nin;
                }

                if (!ids.length) {
                    continue;
                }

                for (let id of ids) {
                    let idObj = await this.getObjectID(id);
                    if (idObj) {
                        idsObj.push(idObj);
                    }
                }

                if (fieldValue.$in) {
                    find[field].$in = idsObj;
                    continue
                }

                if (fieldValue.$nin) {
                    find[field].$nin = idsObj;
                }

                continue;
            }

            if (typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
                await this._idToObjectId(find[field], field);
                continue;
            }

            if (typeof fieldValue === 'object' && Array.isArray(fieldValue)) {
                for(let el of find[field]) {
                 await this._idToObjectId(el, field);
                }
            }


        }

    }

    async fillDbrefsDoc(doc, idOnly) {
        // console.log('dbrefs');
        // console.log(doc._id);
        // console.log(doc);
        for (let el of this.dbrefs) {
            await this.fillDbrefDoc(doc, 0, el, idOnly);
        }
    }

    async fillDbrefDoc(doc, indexPath = 0, mapDbref, idOnly = false) {

        let arrPath = mapDbref.path.split('.');
        let path = arrPath[indexPath];

        if (!doc[path]) {
            return;
        }

        let docPath = doc[path];

        let lastPath = false;
        if (indexPath === arrPath.length - 1) {
            lastPath = true;
        }

        if (!lastPath) {

            let newIndexPath = indexPath + 1;
            if (typeof docPath === 'object' && !Array.isArray(docPath)) {

                await this.fillDbrefDoc(doc[path], newIndexPath, mapDbref, idOnly);

            } else if (typeof docPath === 'object' && Array.isArray(docPath)) {

                for (let i = 0; i < doc[path].length; i++) {
                    await this.fillDbrefDoc(doc[path][i], newIndexPath, mapDbref, idOnly);
                }

            }

            return;

        }

        let schemeForFind = await jrfd.getScheme(mapDbref.scheme);
        if (!schemeForFind) {
            return;
        }

        if (typeof docPath === 'object' && !Array.isArray(docPath)) {

            let res = await this.getDbrefDoc(doc[path], schemeForFind, idOnly);
            if (res) {
                doc[path] = res;
            }

        } else if (typeof docPath === 'object' && Array.isArray(docPath)) {

            for (let i = 0; i < doc[path].length; i++) {
                let res = await this.getDbrefDoc(doc[path][i], schemeForFind, idOnly);
                if (res) {
                    doc[path][i] = res;
                }
            }

        }

    }

    async getDbrefDoc(docPath, schemeForFind, idOnly) {

        if (!docPath.oid) {
            return;
        }

        let res = await schemeForFind.get({
            query: {
                find: {_id: docPath.oid}
            }
        });

        if (!res.okay) {
            return;
        }

        if (!res.output.length) {
            return;
        }

        if (idOnly) {
            return res.output[0]._id.toString();
        }

        return res.output[0];

    }

    //// ----------- EDIT -----------

    async edit(obj) {

        let result = {
            okay: true,
            input: obj,
            output: [],
            error: null,
            validation: []
        };

//validation

        if (typeof obj !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid obj`,
                fullDescription: `obj not object`
            });

            return result;

        }

        if (obj.originalMethod) {
            result = await this.editOriginal(obj);
        } else {
            result = await this.editNotOriginal(obj);
        }

        return result;

    }

    async editNotOriginal(obj) {

        let result = {
            okay: true,
            input: obj,
            output: [],
            error: null,
            validation: []
        };


        if (!obj.docs) {

            result.okay = false;
            result.validation.push({
                description: `invalid docs`,
                fullDescription: `docs not found`
            });

            return result;

        }

        if (typeof obj.docs !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid docs`,
                fullDescription: `docs not object`
            });

            return result;

        }

        let resHooks = await this.hooksConveyor('beforeEdit', obj);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks before`
            });

            return result;

        }

        let foundDocs = [];
        let res = {};

        if (obj.docs.length) {

            for (let doc of obj.docs) {

                res = await this.editDocIsValid(doc);

                if (!res.okay) {

                    result.okay = false;
                    let index = obj.docs.indexOf(doc);
                    res.validation[0].fullDescription += ` index ${index}`;
                    res.validation[0].description += ` index ${index}`;
                    result.validation = res.validation;

                    continue;

                }

                res = await this.get({
                    query: {
                        find: doc.filter,
                        dbrefIdOnly: true
                    }
                });

                if (res.output.length) {
                    for (let foundDoc of res.output) {
                        foundDocs.push({
                            doc: foundDoc,
                            obj: doc.obj,
                            fields: doc.fields
                        });
                    }
                }

            }

            if (!result.okay) {
                return result;
            }

        } else {

            res = await this.editDocIsValid(obj.docs);

            if (!res.okay) {

                result.okay = false;
                result.validation = res.validation;

                return result;

            }

            res = await this.get({
                query: {
                    find: obj.docs.filter,
                    dbrefIdOnly: true
                }
            });

            if (res.output.length) {
                for (let foundDoc of res.output) {
                    foundDocs.push({
                        doc: foundDoc,
                        obj: obj.docs.obj,
                        fields: obj.docs.fields
                    });
                }
            }

        }

        //// edit
        for (let editDoc of foundDocs) {

            if (editDoc.obj) {

                let res = await this.editNotOriginalObj(editDoc);

                if (!res.okay) {
                    result.validation.push({
                        description: res.description,
                        fullDescription: res.description
                    });
                }

            } else {

                let res = await this.editNotOriginalFields(editDoc);

                if (!res.okay) {
                    result.validation.push({
                        description: res.description,
                        fullDescription: res.description
                    });
                }

            }

        }

        for (let outDoc of foundDocs) {

            let res = await this.get({
                query: {
                    find: {
                        _id: {
                            $eq: outDoc.doc._id
                        }
                    }
                }
            });

            if (res.output.length) {
                result.output.push(res.output[0]);
            }

        }

        resHooks = await this.hooksConveyor('afterEdit', result);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks after`
            });

            return result;

        }

        return result;

    }

    async editNotOriginalFields(editDoc) {

        let result = {
            okay: true,
            description: ``
        };


        for (let field in editDoc.fields) {

            editDoc.doc[field] = editDoc.fields[field];

        }

        let res = await this.docIsValid(editDoc.doc, editDoc.doc._id);
        if (!res.okay) {
            result.okay = false;
            result.description = res.description;
            return result;
        }

        let resEdit = null;
        let db = await this.getDB();
        let collection = db.collection(this.urlConnect.collection);
        resEdit = (await collection.updateOne({_id: editDoc.doc._id}, {$set: editDoc.doc}));

        return result;

    }

    async editNotOriginalObj(editDoc) {

        let result = {
            okay: true,
            description: ``
        };

        let res = await this.docIsValid(editDoc.obj, editDoc.doc._id);
        if (!res.okay) {
            result.okay = false;
            result.description = res.description;
            return result;
        }

        let resEdit = null;
        let db = await this.getDB();
        let collection = db.collection(this.urlConnect.collection);
        resEdit = (await collection.updateOne({_id: editDoc.doc._id}, {$set: editDoc.obj}));

        return result;

    }

    async editDocIsValid(doc) {

        let result = {
            okay: true,
            output: [],
            error: null,
            validation: []
        };

        if (typeof doc !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid doc`,
                fullDescription: `doc not object`
            });

            return result;

        }

        if (!doc.filter) {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `not found filter in doc`
            });

            return result;

        }

        if (typeof doc.filter !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid filter in doc`,
                fullDescription: `filter not object in doc`
            });

            return result;

        }

        if (!doc.obj && !doc.fields) {

            result.okay = false;
            result.validation.push({
                description: `invalid not found obj and fields in doc`,
                fullDescription: `invalid not found obj and fields in doc`
            });

            return result;

        }

        if (doc.obj && typeof doc.obj !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid obj in doc`,
                fullDescription: `obj not object in doc`
            });

            return result;

        }

        if (doc.fields && typeof doc.fields !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid fields in doc`,
                fullDescription: `fields not object in doc`
            });

            return result;

        }

        return result;

    }

    async editOriginal(obj) {

        let result = {
            okay: true,
            input: obj,
            output: {},
            error: null,
            validation: []
        };

//validation


        if (!obj.filter) {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `filter not found`
            });

            return result;

        }

        if (typeof obj.filter !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `fitlter not object`
            });

            return result;

        }

        if (!obj.update) {

            result.okay = false;
            result.validation.push({
                description: `invalid update`,
                fullDescription: `update not found`
            });

            return result;

        }

        if (typeof obj.update !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid update`,
                fullDescription: `update not object`
            });

            return result;

        }

        if (obj.upsert && typeof obj.update !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid upsert`,
                fullDescription: `upsert not object`
            });

            return result;

        }


        let resHooks = await this.hooksConveyor('beforeEdit', obj);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks before`
            });

            return result;

        }


        let res = await this.get({
            query: {
                find: obj.filter
            }
        });

        let idDocs = [];
        if (res.output.length) {
            for (let doc of res.output) {
                idDocs.push(doc._id);
            }
        }

        let db = await this.getDB();
        let output = [];
        let collection = db.collection(this.urlConnect.collection);
        let resEdit = null;

        if (obj.upsert) {
            resEdit = (await collection.update(obj.filter, obj.update, obj.upsert));
        } else {
            resEdit = (await collection.update(obj.filter, obj.update));
        }

        if (idDocs.length) {
            output = await this.get({
                query: {
                    find: {
                        _id: {
                            $in: idDocs
                        }
                    }
                }
            });
            output = output.output;
        }

        result.output = output;

        resHooks = await this.hooksConveyor('afterEdit', result);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks after`
            });

            return result;

        }

        return result;

    }

    ////--------- END EDIT CRUID ---------

    ////--------- START DEL CRUID ---------

    async del(obj) {

        let result = {
            okay: true,
            input: obj,
            output: [],
            error: null,
            validation: []
        };

//validation

        if (typeof obj !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid obj`,
                fullDescription: `obj not object`
            });

            return result;

        }

        if (obj.originalMethod) {
            result = await this.delOriginal(obj);
        } else {
            result = await this.delNotOriginal(obj);
        }

        return result;

    }

    async delOriginal(obj) {

        // console.log('original');
        let result = {
            okay: true,
            input: obj,
            output: {},
            error: null,
            validation: []
        };

//validation

        if (!obj.filter) {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `filter not found`
            });

            return result;

        }

        if (typeof obj.filter !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `fitlter not object`
            });

            return result;

        }

        let resHooks = await this.hooksConveyor('beforeDel', obj);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks before`
            });

            return result;

        }

        let res = await this.get({
            query: {
                find: obj.filter
            }
        });

        result.output = res.output;

        let db = await this.getDB();
        let collection = db.collection(this.urlConnect.collection);
        let resDel = null;

        resDel = (await collection.deleteMany(obj.filter));

        resHooks = await this.hooksConveyor('afterDel', result);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks after`
            });

            return result;

        }

        return result;

    }

    async delNotOriginal(obj) {

        let result = {
            okay: true,
            input: obj,
            output: {},
            error: null,
            validation: []
        };

        if (!obj.filter) {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `filter not found`
            });

            return result;

        }

        if (typeof obj.filter !== 'object') {

            result.okay = false;
            result.validation.push({
                description: `invalid filter`,
                fullDescription: `fitlter not object`
            });

            return result;

        }

        let resHooks = await this.hooksConveyor('beforeDel', obj);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks before`
            });

            return result;

        }

        let res = await this.get({
            query: {
                find: obj.filter
            }
        });

        let foundDocs = res.output;
        // console.log(foundDocs);
        let delDocs = [];

        let schemes = await jrfd.getScheme();

        for (let schemeName in schemes) {

            let scheme = await jrfd.getScheme(schemeName);
            let dbrefs = scheme.dbrefs;
            // console.log(dbrefs);
            for (let dbref of dbrefs) {

                if (dbref.scheme !== this.name) {
                    // console.log(dbref.scheme);
                    // console.log(this.name);
                    continue;
                }

                // console.log(dbref);
                for (let i = 0; i < foundDocs.length; i++) {

                    let foundDoc = foundDocs[i];

                    let find = {};
                    find[`${dbref.path}.$id`] = foundDoc._id;
                    // console.log(find);
                    let res = await scheme.get({
                        query: {
                            find
                        }
                    });
                    // console.log(res.output);
                    if (res.output.length) {

                        foundDocs.splice(i, 1);
                        i--;

                    }

                }

            }

        }

        for (let foundDoc of foundDocs) {
            delDocs.push(foundDoc._id);
        }
        // console.log(foundDocs);
        // console.log(delDocs);

        let db = await this.getDB();
        let collection = db.collection(this.urlConnect.collection);
        let resDel = null;

        resDel = (await collection.deleteMany({
            _id: {
                $in: delDocs
            }
        }));

        result.output = foundDocs;

        resHooks = await this.hooksConveyor('afterDel', result);
        if (!resHooks.next.continue) {

            result.okay = false;
            result.validation.push({
                description: `invalid hooks`,
                fullDescription: `invalid hooks after`
            });

            return result;

        }

        return result;

    }

    ////--------- END DEL CRUID ---------

    ////--------- END CRUID ---------

    async getObjectID(id) {

        // console.log(id);
        if (typeof id === 'string' || typeof id === 'number') {
            try {
                return objectID(id);
            } catch (e) {
                return null;
            }
        }

        if (typeof id != 'object') {
            return null;
        }

        if (id.id) {
            try {
                return objectID(id.id);
            } catch (e) {
                return null;
            }
        }

        if (id._id) {
            try {
                return objectID(id._id);
            } catch (e) {
                return null;
            }
        }

        if (id.$id) {
            try {
                return objectID(id.$id);
            } catch (e) {
                return null;
            }
        }

        if (id.oid) {
            try {
                return objectID(id.oid);
            } catch (e) {
                return null;
            }
        }

        try {
            return objectID(id.toString());
        } catch (e) {
            return null;
        }

        return null;

    }

    ////--------- START CONNECTION ---------

    async setConnection(connect) {

        if (typeof connect !== 'object') {
            return;
        }

        if (connect.hostname) {
            this.urlConnect.hostname = connect.hostname;
        }

        if (connect.port) {
            this.urlConnect.port = connect.port;
        }

        if (connect.user) {
            this.urlConnect.user = connect.user;
        }

        if (connect.pass) {
            this.urlConnect.pass = connect.pass;
        }

        if (connect.db) {
            this.urlConnect.db = connect.db;
        }

        if (connect.collection) {
            this.urlConnect.collection = connect.collection;
        }

        if (this.db) {
            await this.disconnect();
            await this.connect();
        }

    }

    async resetConnect() {
        await this.disconnect();
        // this.connect = {};
        this.urlConnect = {};
    }

    async getStrConnect() {

        let url = 'mongodb://';
        let strUser = '';
        let strPass = '';

        if (this.urlConnect.user) {
            strUser = this.urlConnect.user;
        } else {
            strUser = jrfd.urlConnect.user;
        }

        if (this.urlConnect.pass) {
            strPass = this.urlConnect.pass;
        } else {
            strPass = jrfd.urlConnect.pass;
        }

        if (strUser || strPass) {
            url += strUser + ':' + strPass + '@';
        }

        if (this.urlConnect.hostname) {
            url += this.urlConnect.hostname;
        } else {
            url += jrfd.urlConnect.hostname;
        }

        if (this.urlConnect.port) {
            url += ':' + this.urlConnect.port;
        } else {
            url += ':' + jrfd.urlConnect.port;
        }

        if (this.urlConnect.db) {
            url += '/' + this.urlConnect.db;
        } else {
            url += '/' + jrfd.urlConnect.db;
        }
        // console.log(url);
        return url;
    }

    async testConnect() {

        let url = await this.getStrConnect();

        try {
            let db = await mongoClient.connect(url);
            db.close();
            return true;
        } catch (err) {
            console.log(`jrfDB not connect: ${url}`);
            console.log(err);
        }
        return false;
    }

    async connect() {

        let urlJrfd = await jrfd.getStrConnect();
        let url = await this.getStrConnect();

        if (url === urlJrfd && jrfd.db) {
            // this.db = jrfd.db;
            return true;
        }

        try {
            this.db = await mongoClient.connect(url);
            return true;
        } catch (err) {
            console.log(`jrfDB not connect: ${url}`);
            // console.log(err);
        }
        return false;
    }

    async disconnect() {

        if (!this.db) {
            return true;
        }

        try {
            this.db.close();
            this.db = null;
            return true;
        } catch (err) {
            console.log(`jrfDB not disconnect`);
        }

        return false;

    }

    async getDB() {

        if (this.db) {
            if (this.urlConnect.db) {
                return this.db.db(this.urlConnect.db);
            } else {
                return this.db.db(jrfd.urlConnect.db);
            }
        }

        if (this.urlConnect.db) {
            return jrfd.db.db(this.urlConnect.db);
        } else {
            return jrfd.db.db(jrfd.urlConnect.db);
        }

    }

    ////--------- END CONNECTION ---------

}

////------------------ END CLASS SCHEME ------------------


module.exports = jrfd;