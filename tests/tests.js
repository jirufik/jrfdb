const jrfDb = require('../jrfDb');
const mongoClient = require('mongodb').MongoClient;
const objectID = require('mongodb').ObjectID;
const dbRef = require('mongodb').DBRef;

let glObj = {
    countValid: 0,
    countInvalid: 0
};

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

let dates = {
    name: 'dates',
    fields: {
        date: {
            description: 'Date',
            type: 'date',
            unique: true
        }
    }
};

let typeWheels = {
    name: 'typeWheels',
    fields: {
        name: {
            description: 'Name',
            type: 'string',
            unique: true
        }
    }
};

let regNumbers = {
    name: 'regNumbers',
    fields: {
        name: {
            description: 'Name',
            type: 'string',
            unique: true,
            min: 6,
            max: 15
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

let things = {
    name: 'things',
    fields: {
        name: {
            description: 'Things',
            type: 'string',
            unique: true,
            min: 3,
            max: 20
        }
    }
};

let cars = {
    name: 'cars',
    fields: {
        name: {
            type: 'string'
        },
        code: {
            description: 'Code',
            type: 'number',
            unique: true,
            required: true,
            min: 1
        },
        typeBody: {
            description: 'Type body',
            type: 'dbref',
            scheme: 'typeBodys',
            required: true
        },
        wheels: {
            description: 'Wheels',
            type: 'array',
            typeArray: 'object',
            fields: {
                number: {
                    description: 'Wheel number',
                    type: 'number',
                    min: 1,
                    max: 30
                },
                typeWheel: {
                    description: 'Type wheel',
                    type: 'dbref',
                    scheme: 'typeWheels',
                    required: true
                },
                comment: {
                    description: 'Comment',
                    type: 'string'
                }
            }
        },
        regNumber: {
            description: 'Reg number',
            type: 'dbref',
            scheme: 'regNumbers',
            unique: true
        },
        trunk: {
            description: 'Trunk',
            type: 'array',
            typeArray: 'object',
            fields: {
                typeBag: {
                    description: 'Type bag',
                    type: 'dbref',
                    scheme: 'typeBags',
                },
                volume: {
                    description: 'Volume',
                    type: 'number',
                    min: 0
                },
                things: {
                    description: 'Things',
                    type: 'array',
                    typeArray: 'dbref',
                    scheme: 'things'
                }
            }
        },
        leftHandDrive: {
            description: 'Left hand drive',
            type: 'boolean'
        },
        rightHandDrive: {
            description: 'Right hand drive',
            type: 'boolean'
        },
        color: {
            description: 'Color',
            type: 'string',
            default: 'None'
        },
        requiredOneOf: ['leftHandDrive', 'rightHandDrive']
    }
};

let firstCar = {};

// ----------- INIT DBs -----------

async function initDBs() {

    await jrfDb.addScheme(typeBodys);
    await jrfDb.addScheme(typeWheels);
    await jrfDb.addScheme(regNumbers);
    await jrfDb.addScheme(typeBags);
    await jrfDb.addScheme(things);
    await jrfDb.addScheme(cars);
    await jrfDb.addScheme(dates);

    let connect = {port: 26000, db: 'jrfCarsTests'};
    await jrfDb.setConnection(connect);

    let scheme = await jrfDb.getScheme('typeBags');
    scheme.setConnection({db: 'jrfThingsTests'});

    scheme = await jrfDb.getScheme('things');
    scheme.setConnection({db: 'jrfThingsTests'});

    await jrfDb.connect();

}

let tests = {

// ----------- ADD TESTS ----------

    async createInvalidDateObject(key) {

        let scheme = await jrfDb.getScheme('dates');

        let obj = {
            docs: {date: {}}
        };

        let res = await scheme.add(obj);

        if (!res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);
        // console.log(JSON.stringify(res, null, 4));
    },

    async createValidDate(key) {

        let scheme = await jrfDb.getScheme('dates');

        let now = new Date();
        let obj = {
            docs: {date: now}
        };

        let res = await scheme.add(obj);

        if (res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);
        // console.log(JSON.stringify(res, null, 4));
    },

    async createValidDateAsString(key) {

        let scheme = await jrfDb.getScheme('dates');

        let now = '2018-09-09T17:06:12.728Z';

        let obj = {
            docs: {date: now}
        };

        let res = await scheme.add(obj);

        if (res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);
        // console.log(JSON.stringify(res, null, 4));
    },

    async getDateBefore(key) {

        let scheme = await jrfDb.getScheme('dates');
        let now = new Date();
        let res = await scheme.get({
            query: {
                find: {
                    date: {
                        $lt: now
                    }
                }
            }
        });

        let okay = res.okay;

        if (okay) {
            if (res.output.length !== 1) {
                okay = false;
            }
        }

        if (res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);
        // console.log(JSON.stringify(res, null, 4));
    },

    async getDateAfter(key) {

        let scheme = await jrfDb.getScheme('dates');
        let now = new Date();
        let res = await scheme.get({
            query: {
                find: {
                    date: {
                        $gt: now
                    }
                }
            }
        });

        let okay = res.okay;

        if (okay) {
            if (res.output.length !== 0) {
                okay = false;
            }
        }

        if (res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);
        // console.log(JSON.stringify(res, null, 4));
    },

    async createInvalidBodyNamez(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let obj = {
            namez: 'invalid'
        };

        let res = await scheme.add(obj);

        if (!res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);
        // console.log(JSON.stringify(res, null, 4));
    },

    async createInvalidBodyTrue(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let obj = {
            name: true
        };

        let res = await scheme.add(obj);
        // console.log(JSON.stringify(res, null, 4));

        if (!res.okay) {
            glObj.countValid++;
            return;
        }
        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidBody(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let obj = {
            docs: {name: 'coupe', _id: '5b706ac8453a393a68c4f943'}
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        res = await scheme.get({
            query: {
                find: {}
            }
        });
        // console.log(JSON.stringify(res, null, 4));
        if (res.output.length !== 1) {
            okay = false;
        }

        if (res.output[0].name !== 'coupe') {
            okay = false;
        }

        if (!res.output[0]._id.equals(objectID('5b706ac8453a393a68c4f943'))) {
            okay = false;
        }

        if (okay) {
            glObj.coupe = res.output[0]._id;
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidNotUniqueBody(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let obj = {
            docs: {name: 'coupe'}
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidThreeBody(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let obj = {
            docs: [{name: 'sedan'}, {name: 'wagon'}, {name: 'jeep'}]
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length !== 3) {
            okay = false;
        }

        for (let value of res.output) {
            glObj[value.name] = value._id;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidThreeWheel(key) {

        let scheme = await jrfDb.getScheme('typeWheels');

        let obj = {
            docs: [{name: 'summer'}, {name: 'winter'}, {name: 'universal'}]
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length !== 3) {
            okay = false;
        }

        for (let value of res.output) {
            glObj[value.name] = value._id;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidThings(key) {

        let scheme = await jrfDb.getScheme('things');

        let obj = {
            docs: [{name: 'pencil'}, {name: 'shit'}, {name: 'keyboard'}]
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length !== 3) {
            okay = false;
        }

        for (let value of res.output) {
            glObj[value.name] = value._id;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidShortRegNumber(key) {

        let scheme = await jrfDb.getScheme('regNumbers');

        let obj = {
            docs: {name: 'sh'}
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidLongRegNumber(key) {

        let scheme = await jrfDb.getScheme('regNumbers');

        let obj = {
            docs: {name: '123456789101112131415'}
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidSevenRegNumbers(key) {

        let scheme = await jrfDb.getScheme('regNumbers');

        let obj = {
            docs: [{name: 'num111'}, {name: 'num222'}, {name: 'num333'},
                {name: 'num444'}, {name: 'num555'}, {name: 'num666'},
                {name: 'num777'}]
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length !== 7) {
            okay = false;
        }

        for (let value of res.output) {
            glObj[value.name] = value._id;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidFiveBags(key) {

        let scheme = await jrfDb.getScheme('typeBags');

        let obj = {
            docs: [{name: 'suitcase'}, {name: 'handbag'}, {name: 'package'},
                {name: 'bag'}, {name: 'sack'}]
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length !== 5) {
            okay = false;
        }

        for (let value of res.output) {
            glObj[value.name] = value._id;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarEmpty(key) {

        let scheme = await jrfDb.getScheme('cars');

        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarCodeNotNumber(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.code = 'fdjd';
        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarCodeNotMin(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.code = 0;
        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            firstCar.code = 1;
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarBodyNotDbref(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.typeBody = 'ffffff';
        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarBodyOtherDbref(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.typeBody = '5b746197b3c1873614c67aad';
        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarBodyValidDbref(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.typeBody = glObj.coupe;
        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            okay = res.validation[0].description.includes('Dbref');
        }
        if (!okay) {
            okay = !res.validation[0].description.includes('One of the required fields');
        }

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarColorNone(key) {

        let scheme = await jrfDb.getScheme('cars');

        // firstCar.color = '';

        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            okay = !res.validation[0].description.includes('One of the required fields');
        }
        if (!okay) {
            okay = res.input.docs.color !== 'None';
        }

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarInvalidRequireOneOf(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.rightHandDrive = 'dsds';

        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            okay = !res.validation[0].description.includes('Boolean field not boolean');
        }

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createCarValid(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.rightHandDrive = true;

        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay && res.output.length !== 1) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarWheelsBigNumber(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.del({filter: {}});

        firstCar.wheels = [{
            number: 40
        }];

        let obj = {
            docs: firstCar
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            okay = !res.validation[0].description.includes('Number field > 30');
        }

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarWheelsNotType(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.del({filter: {}});

        firstCar.wheels = [{
            number: 5
        }];

        let obj = {
            docs: firstCar
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            okay = !res.validation[0].description.includes('Docs not have typeWheel');
        }

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidCarWithWheels(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.del({filter: {}});

        firstCar.wheels = [
            {
                number: 1,
                typeWheel: glObj.summer
            },
            {
                number: 2,
                typeWheel: glObj.summer
            },
            {
                number: 3,
                typeWheel: glObj.winter
            },
            {
                number: 4,
                typeWheel: glObj.winter
            },
            {
                number: 5,
                typeWheel: glObj.universal
            }
        ];

        let obj = {
            docs: firstCar
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay && res.output[0].wheels.length !== 5) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidCarWithRegNumber(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.del({filter: {}});

        firstCar.wheels = [
            {
                number: 1,
                typeWheel: glObj.summer
            },
            {
                number: 2,
                typeWheel: glObj.summer
            },
            {
                number: 3,
                typeWheel: glObj.winter
            },
            {
                number: 4,
                typeWheel: glObj.winter
            },
            {
                number: 5,
                typeWheel: glObj.universal
            }
        ];

        firstCar.regNumber = glObj.num111;

        let obj = {
            docs: firstCar
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay && res.output[0].wheels.length !== 5) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidCarWithTrunk(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.del({filter: {}});

        firstCar.wheels = [
            {
                number: 1,
                typeWheel: glObj.summer
            },
            {
                number: 2,
                typeWheel: glObj.summer
            },
            {
                number: 3,
                typeWheel: glObj.winter
            },
            {
                number: 4,
                typeWheel: glObj.winter
            },
            {
                number: 5,
                typeWheel: glObj.universal
            }
        ];

        firstCar.name = 'Car1';

        firstCar.regNumber = glObj.num111;

        firstCar.trunk = [
            {typeBag: glObj.bag, volume: 20, things: [glObj.pencil, glObj.keyboard]},
            {typeBag: glObj.sack, volume: 12, things: [glObj.shit]}
        ];

        let obj = {
            docs: firstCar
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay && res.output[0].wheels.length !== 5) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarNotUniqueRegNumber(key) {

        let scheme = await jrfDb.getScheme('cars');

        firstCar.wheels = [
            {
                number: 1,
                typeWheel: glObj.summer
            },
            {
                number: 2,
                typeWheel: glObj.summer
            },
            {
                number: 3,
                typeWheel: glObj.winter
            },
            {
                number: 4,
                typeWheel: glObj.winter
            },
            {
                number: 5,
                typeWheel: glObj.universal
            }
        ];

        firstCar.name = 'Car1';

        firstCar.code = 2;

        firstCar.regNumber = glObj.num111;

        firstCar.trunk = [
            {typeBag: glObj.bag, volume: 20, things: [glObj.pencil, glObj.keyboard]},
            {typeBag: glObj.sack, volume: 12, things: [glObj.shit]}
        ];

        let obj = {
            docs: firstCar
        };

        let res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (!okay) {
            okay = !res.validation[0].description.includes('Dbref value not unique');
        }

        if (!okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidAnyCars(key) {

        let scheme = await jrfDb.getScheme('cars');

        let cars = [
            {
                name: 'Car2',
                code: 2,
                typeBody: glObj.sedan,
                wheels: [
                    {
                        number: 1,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 2,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 3,
                        typeWheel: glObj.winter
                    },
                    {
                        number: 4,
                        typeWheel: glObj.winter
                    }
                ],
                regNumber: glObj.num222,
                trunk: [
                    {typeBag: glObj.package, volume: 12, things: [glObj.pencil, glObj.shit]},
                    {typeBag: glObj.handbag, volume: 17, things: [glObj.shit]}
                ],
                rightHandDrive: true
            },
            {
                name: 'Car3',
                code: 3,
                typeBody: glObj.jeep,
                wheels: [
                    {
                        number: 1,
                        typeWheel: glObj.universal
                    },
                    {
                        number: 2,
                        typeWheel: glObj.universal
                    },
                    {
                        number: 3,
                        typeWheel: glObj.universal
                    },
                    {
                        number: 4,
                        typeWheel: glObj.universal
                    }
                ],
                regNumber: glObj.num333,
                trunk: [
                    {typeBag: glObj.package, volume: 12, things: [glObj.keyboard]}
                ],
                leftHandDrive: true
            },
            {
                name: 'Car4',
                code: 4,
                typeBody: glObj.wagon,
                wheels: [
                    {
                        number: 1,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 2,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 3,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 4,
                        typeWheel: glObj.summer
                    }
                ],
                regNumber: glObj.num444,
                trunk: [
                    {typeBag: glObj.package, volume: 12, things: [glObj.pencil, glObj.shit]},
                    {typeBag: glObj.handbag, volume: 17, things: [glObj.shit]}
                ],
                rightHandDrive: true
            }
        ];


        let obj = {
            docs: cars
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay && res.output.length !== 3) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createInvalidCarNotFillRequiredOneOf(key) {

        let scheme = await jrfDb.getScheme('cars');

        let cars = [
            {
                name: 'Car5',
                code: 5,
                typeBody: glObj.sedan,
                wheels: [
                    {
                        number: 1,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 2,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 3,
                        typeWheel: glObj.winter
                    },
                    {
                        number: 4,
                        typeWheel: glObj.winter
                    }
                ],
                regNumber: glObj.num777,
                trunk: [
                    {typeBag: glObj.package, volume: 12, things: [glObj.pencil, glObj.shit]},
                    {typeBag: glObj.handbag, volume: 17, things: [glObj.shit]}
                ]
            }
        ];


        let obj = {
            docs: cars
        };

        res = await scheme.add(obj);
        let okay = !res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length) {
            okay = false;
        }

        if (res.validation[0].description.indexOf('One of the required fields') === -1) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async createValidCarNotFillRequiredOneOfWithNull(key) {

        let scheme = await jrfDb.getScheme('cars');

        let cars = [
            {
                name: 'Car5',
                code: 5,
                typeBody: glObj.sedan,
                wheels: [
                    {
                        number: 1,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 2,
                        typeWheel: glObj.summer
                    },
                    {
                        number: 3,
                        typeWheel: glObj.winter
                    },
                    {
                        number: 4,
                        typeWheel: glObj.winter
                    }
                ],
                regNumber: glObj.num777,
                trunk: [
                    {typeBag: glObj.package, volume: 12, things: [glObj.pencil, glObj.shit]},
                    {typeBag: glObj.handbag, volume: 17, things: [glObj.shit]}
                ],
                rightHandDrive: true,
                leftHandDrive: null
            }
        ];


        let obj = {
            docs: cars
        };

        res = await scheme.add(obj);
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (res.output.length !== 1) {
            okay = false;
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    //// -------- GET --------

    async getCars(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.get({
            query: {
                find: {
                    rightHandDrive: true
                }
            }
        });
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 4;
        }

        let car = {};
        if (okay) {
            car = res.output[2];
            okay = car.name === 'Car4';
        }

        if (okay) {
            okay = car.typeBody.name === 'wagon';
        }

        if (okay) {
            okay = car.wheels[3].number === 4;
        }

        if (okay) {
            okay = car.wheels[3].typeWheel.name === 'summer';
        }

        if (okay) {
            okay = car.regNumber.name === 'num444';
        }

        if (okay) {
            okay = car.trunk[1].typeBag.name === 'handbag';
        }

        if (okay) {
            okay = car.trunk[1].volume === 17;
        }

        if (okay) {
            okay = car.trunk[0].things[1].name === 'shit';
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async getCarsOnlyIdDbrefs(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.get({
            query: {
                find: {
                    rightHandDrive: true
                },
                dbrefIdOnly: true
            }
        });
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 4;
        }

        let car = {};
        if (okay) {
            car = res.output[2];
            okay = car.name === 'Car4';
        }

        if (okay) {
            okay = car.typeBody.toString() === glObj.wagon.toString();
        }

        if (okay) {
            okay = car.wheels[3].number === 4;
        }

        if (okay) {
            okay = car.wheels[3].typeWheel.toString() === glObj.summer.toString();
        }

        if (okay) {
            okay = car.regNumber.toString() === glObj.num444.toString();
        }

        if (okay) {
            okay = car.trunk[1].typeBag.toString() === glObj.handbag.toString();
        }

        if (okay) {
            okay = car.trunk[1].volume === 17;
        }

        if (okay) {
            okay = car.trunk[0].things[1].toString() === glObj.shit.toString();
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async getCarsNoDbrefDocs(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.get({
            query: {
                find: {
                    rightHandDrive: true
                },
                noDbrefDocs: true
            }
        });
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 4;
        }

        let car = {};
        if (okay) {
            car = res.output[2];
            okay = car.name === 'Car4';
        }

        if (okay) {
            okay = String(car.typeBody.oid) === glObj.wagon.toString();
        }

        if (okay) {
            okay = car.wheels[3].number === 4;
        }

        if (okay) {
            okay = String(car.wheels[3].typeWheel.oid) === glObj.summer.toString();
        }

        if (okay) {
            okay = String(car.regNumber.oid) === glObj.num444.toString();
        }

        if (okay) {
            okay = String(car.trunk[1].typeBag.oid) === glObj.handbag.toString();
        }

        if (okay) {
            okay = car.trunk[1].volume === 17;
        }

        if (okay) {
            okay = String(car.trunk[0].things[1].oid) === glObj.shit.toString();
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    //// -------- EDIT --------

    async editCarFields(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.edit({
            docs: {
                filter: {
                    leftHandDrive: true
                },
                fields: {
                    typeBody: glObj.wagon
                }
            }
        });
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 1;
        }

        let car = {};
        if (okay) {
            car = res.output[0];
            okay = car.typeBody.name === 'wagon';
        }

        if (okay) {
            okay = car.typeBody._id.toString() === glObj.wagon.toString();
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async editCarObj(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.edit({
            docs: {
                filter: {
                    leftHandDrive: true,
                    'typeBody.$id': glObj.wagon
                },
                obj: {
                    name: 'Car3',
                    code: 3,
                    typeBody: glObj.jeep,
                    wheels: [
                        {
                            number: 1,
                            typeWheel: glObj.universal
                        },
                        {
                            number: 2,
                            typeWheel: glObj.universal
                        },
                        {
                            number: 3,
                            typeWheel: glObj.universal
                        },
                        {
                            number: 4,
                            typeWheel: glObj.universal
                        }
                    ],
                    regNumber: glObj.num333,
                    trunk: [
                        {typeBag: glObj.package, volume: 12, things: [glObj.keyboard]}
                    ],
                    leftHandDrive: true
                }
            }
        });
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 1;
        }

        let car = {};
        if (okay) {
            car = res.output[0];
            okay = car.typeBody.name === 'jeep';
        }

        if (okay) {
            okay = car.typeBody._id.toString() === glObj.jeep.toString();
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async editCarDocs(key) {

        let scheme = await jrfDb.getScheme('cars');
        let res = await scheme.edit({
            docs: [
                {
                    filter: {
                        leftHandDrive: true,
                        'typeBody.$id': glObj.jeep
                    },
                    obj: {
                        name: 'Car3',
                        code: 3,
                        typeBody: glObj.wagon,
                        wheels: [
                            {
                                number: 1,
                                typeWheel: glObj.universal
                            },
                            {
                                number: 2,
                                typeWheel: glObj.universal
                            },
                            {
                                number: 3,
                                typeWheel: glObj.universal
                            },
                            {
                                number: 4,
                                typeWheel: glObj.universal
                            }
                        ],
                        regNumber: glObj.num333,
                        trunk: [
                            {typeBag: glObj.package, volume: 12, things: [glObj.keyboard]}
                        ],
                        leftHandDrive: true
                    }
                },
                {
                    filter: {
                        name: 'Car4',
                    },
                    fields: {
                        typeBody: glObj.sedan
                    }
                }
            ]
        });
        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 2;
        }

        let car = {};
        if (okay) {
            car = res.output[0];
            okay = car.typeBody.name === 'wagon';
        }

        if (okay) {
            okay = car.typeBody._id.toString() === glObj.wagon.toString();
        }

        if (okay) {
            car = res.output[1];
            okay = car.typeBody.name === 'sedan';
        }

        if (okay) {
            okay = car.typeBody._id.toString() === glObj.sedan.toString();
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    //// -------- DEL --------

    async delThings(key) {

        let scheme = await jrfDb.getScheme('things');

        let obj = {
            docs: [{name: 'cards'}, {name: 'leroy'}]
        };

        let res = await scheme.add(obj);

        res = await scheme.del({
            filter: {}
        });

        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 2;
        }

        if (okay) {
            okay = res.output[0].name === 'cards';
        }

        if (okay) {
            okay = res.output[1].name === 'leroy';
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async delTypeBodys(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let res = await scheme.del({
            filter: {}
        });

        let okay = res.okay;
        // console.log(JSON.stringify(res, null, 4));

        if (okay) {
            okay = res.output.length === 1;
        }

        if (okay) {
            okay = res.output[0].name === 'jeep';
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    },

    async test_idToObjectId(key) {

        let scheme = await jrfDb.getScheme('typeBodys');

        let okay = true;

        let find = {
            name: 'Rick',
            _id: '5b706ac8453a393a68c4f947'
        };
        let findOld = Object.assign({}, find);

        await scheme._idToObjectId(find);
        okay = find._id.equals(objectID(findOld._id));

        if (okay) {
            find = {
                name: 'Rick',
                _id: {$in: ['5b706ac8453a393a68c4f947', '5b706ac8453a393a68c4f948']}
            };
            findOld = Object.assign({}, find);

            await scheme._idToObjectId(find);
            okay = find._id.$in[1].equals(objectID(findOld._id.$in[1]));
        }

        if (okay) {
            find = {
                name: 'Rick',
                _id: {$nin: ['5b706ac8453a393a68c4f947', '5b706ac8453a393a68c4f948']}
            };
            findOld = Object.assign({}, find);

            await scheme._idToObjectId(find);
            okay = find._id.$nin[0].equals(objectID(findOld._id.$nin[0]));
        }

        if (okay) {
            find = {
                $or: [{name: 'Rick'}, {_id: {$in: ['5b706ac8453a393a68c4f947', '5b706ac8453a393a68c4f948']}}]
            };
            findOld = Object.assign({}, find);

            await scheme._idToObjectId(find);
            okay = find.$or[1]._id.$in[1].equals(objectID(findOld.$or[1]._id.$in[1]));
        }

        if (okay) {
            find = {
                $or: [{name: 'Rick'}, {_id: '5b706ac8453a393a68c4f947'}]
            };
            findOld = Object.assign({}, find);

            await scheme._idToObjectId(find);
            okay = find.$or[1]._id.equals(objectID(findOld.$or[1]._id));
        }

        if (okay) {
            glObj.countValid++;
            return;
        }

        glObj.countInvalid++;
        console.log(`invalid test ${key}`);

    }

};

async function deleteAllDocs() {

    let scheme = await jrfDb.getScheme('cars');
    let res = await scheme.del({filter: {}, originalMethod: true});
    scheme = await jrfDb.getScheme('typeBodys');
    res = await scheme.del({filter: {}});
    scheme = await jrfDb.getScheme('typeWheels');
    res = await scheme.del({filter: {}});
    scheme = await jrfDb.getScheme('regNumbers');
    res = await scheme.del({filter: {}});
    scheme = await jrfDb.getScheme('typeBags');
    res = await scheme.del({filter: {}});
    scheme = await jrfDb.getScheme('things');
    res = await scheme.del({filter: {}});
    scheme = await jrfDb.getScheme('dates');
    res = await scheme.del({filter: {}});
    // console.log(JSON.stringify(res, null, 4));

}

async function runTests() {

    await initDBs();
    await deleteAllDocs();

    for (let [key, value] of Object.entries(tests)) {
        await value(key);
    }

    await deleteAllDocs();
    console.log(JSON.stringify(glObj, null, 4));
    console.log(`Count valid tests: ${glObj.countValid}`);
    console.log(`Count invalid tests: ${glObj.countInvalid}`);

    jrfDb.disconnect();

}

runTests();