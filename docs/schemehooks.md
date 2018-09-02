# [Hooks](#hooks)

---

## [hooksAdd](#hooksadd)

Добавить функцию ловушку. Функция ловушки всегда первым параметром получает **next** тип **object**, если данный объект внутри функции ловушки примит значение **next.continue = false** то дальнейшие действия выполнения прервутся. Функция ловушки должна возвращать **promise** либо перед функцией должно стоять ключевое слово **async**.

### Входные параметры

| Name | Type | Description |
| :--- | :--- | :--- |
| **type** | string | Тип хука: beforeAdd, afterAdd, beforeEdit, afterEdit, beforeDel, afterDel, beforeGet, afterGet |
| **name** | string | Имя хука |
| **func** | function | Функция хука |
| priority | number | Приоритет хука. Чем ниже цифра тем приоритетней хук тем раньше он выполнится |
| description | string | Описание хука |

### Возвращаемое значение

boolean - если true то добавлен, иначе не добавлен.

---

## [hooksGet](#hooksget)

Получить хук по имени и типу, если имя не задано тогда вернется массив всех хуков типа.

### Входные параметры

| Name | Type | Description |
| :--- | :--- | :--- |
| **type** | string | Тип хука: beforeAdd, afterAdd, beforeEdit, afterEdit, beforeDel, afterDel, beforeGet, afterGet |
| name | string | Имя хука |

### Возвращаемое значение

false если хук не найден, хук если найден по имени, массив хуков если задан только тип хука.

---

## [hooksDel](#hooksdel)

Удалить хук по имени и типу, если имя не задано тогда удалятся все хуки типа.

### Входные параметры

| Name | Type | Description |
| :--- | :--- | :--- |
| **type** | string | Тип хука: beforeAdd, afterAdd, beforeEdit, afterEdit, beforeDel, afterDel, beforeGet, afterGet |
| name | string | Имя хука |

### Возвращаемое значение

false если хук не удален, true если хук удален или хуки типа удалены.

---

## [hooksSort](#hookssort)

Сортировать хуки типа. Более приоритными считаются хуки с меньшим числом.

### Входные параметры

| Name | Type | Description |
| :--- | :--- | :--- |
| **type** | string | Тип хука: beforeAdd, afterAdd, beforeEdit, afterEdit, beforeDel, afterDel, beforeGet, afterGet |

### Возвращаемое значение

false не удалось отсортировать, true если удалось отсортировать.

---

## [hooksConveyor](#hooksconveyor)

Конвеер хуков, хуки выполняются в отсортированной по приоритету последовательности. Каждой функции хука первым передается объект **next** если хук параметру **next.continue **объекта присваивает **false** то выполнения конвеера приостанавливается, дальнейшие действия прерываются.

### Входные параметры

| Name | Type | Description |
| :--- | :--- | :--- |
| **type** | string | Тип хука: beforeAdd, afterAdd, beforeEdit, afterEdit, beforeDel, afterDel, beforeGet, afterGet |
| param | all | Любой параметр который необходимо передать в хуки. если параметров несколько тогда их нужно упокавать в JS объект и предать в хуки. |

### Возвращаемое значение

**JS object **

```js
return {
    next,
    param,
    hookResult
}
```

**next.continue** - **true** если все хуки были выполнены удачно, **false** - если хук приостановил дальнейшее выполнение.

**param** - параметр переданый в хуки.

**hookResult** - результат последнего хука.

