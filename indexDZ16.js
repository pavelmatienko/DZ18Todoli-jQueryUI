const $listTodos = $('.js-my-List-Todo');
const $addButton = $('.js-button');
const $addActionModalButton = $('.js-show-add-modal');
const $updateButton = $('.js-update');
const $cancelButton = $('.js-cancel');
const $actionAddForm = $('form[name="add-action"]');
const $actionEditForm = $('form[name="edit-action"]');
const $addModal = $('.js-add-modal');
const $editdModal = $('.js-edit-modal');
const $checkboxModal = $('.js-checkbox');

$checkboxModal.checked = true;


//EVENT LISTENERS

function createAddActionModalEventListener() {
    $addActionModalButton.click(() => {
        $addModal.dialog("open");
    })
}

function createAddActionEventListener() {
    $addButton.click(() => {
        createAction();
    })
}

function createEditActionEventListener() {
    $updateButton.click(() => {
        updateAction();
    })
}

function createCancelEditEventListener() {
    $cancelButton.click(() => {
        cancelEdit();
    })
}

function createActionActionsEventListener() {
    $listTodos.delegate('.js-action-delete', 'click', deleteAction);
    $listTodos.delegate('.js-action-edit', 'click', editAction);
}

// LOGIC

function getTodos() {
    const promise = sendGetTodosRequest();
    promise.then((todos) => {
        renderTodos(todos);
        todosRepository.todos = todos;
    })
}

function createAction() {
    const action = getActionFormData($actionAddForm);
    const promise = sendPostActionRequest(action);
    promise.then(action =>{
        cleanForm($actionAddForm);
        renderAction(action);
        $addModal.dialog("close");
        todosRepository.todos = [...todosRepository.todos, action];
    });
}

function updateAction() {
    const action = getActionFormData($actionEditForm);
    const actionId = todosRepository.selectedActionId;

    const promise = sendPutActionRequest(actionId, action);
    
    promise.then(updatedAction => {
        todosRepository.selectedActionId = null;

        todosRepository.todos = todosRepository.todos.map(action => {
            if(action.id === actionId) {
                return updatedAction;
            }
            return action;
        });

        const updatedTableRow = getTableRow(updatedAction);
        const $tableRow = $listTodos.find(`li[data-id="${actionId}"]`);
        
        $tableRow.replaceWith($(updatedTableRow));
        cleanForm($actionEditForm);
        
    });
    $editdModal.dialog('close');
}

function deleteAction(event) {
    const $parentTableRow = $(event.target).closest('li');
    const id = parseInt($parentTableRow.data('id'), 10);
    const promise = sendDeleteActionRequest(id);

    promise.then(() => {
        const tableRow = $listTodos.find(`li[data-id="${id}"]`);
        tableRow.remove();
        todosRepository.todos = todosRepository.todos.filter(action => action.id !== id);
    })
}

function editAction(event) {
    const parentTableRow = event.target.closest('li');
    todosRepository.selectedActionId = parseInt(parentTableRow.dataset.id, 10);
    const action = todosRepository.getActionById(todosRepository.selectedActionId);

    setEditActionFormData(action);
    $editdModal.dialog('open');
}

function cancelEdit() {
    cleanForm($actionEditForm);
    $editdModal.dialog('close');
}

// REQUESTS

function sendGetTodosRequest() {
    return new Promise((resolve, reject) => {
        $.ajax('https://jsonplaceholder.typicode.com/todos', {
            success: (data) => {
                resolve(data);
            },
            error: () => {
                reject(new Error('UPS'));
            },
        });
    });
}

function sendPostActionRequest(action) {
    return new Promise((resolve, reject) => {
        $.ajax('https://jsonplaceholder.typicode.com/todos', {
            method: 'POST',
            data: action,
            success: (data) => {
                resolve(data);
            },
            error: () => {
                reject(new Error('UPS'));
            },
        });
    });
}

function sendPutActionRequest(id,action) {
    $checkboxModal.checked = !$checkboxModal.checked;
    return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        method: 'PUT',
        // body: JSON.stringify(action),
        body: JSON.stringify({
            title: action,
            completed: $checkboxModal.checked,
        }),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    })
    .then((response) => response.json())
}

function sendDeleteActionRequest(id) {
    return fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
        method: 'DELETE',
    });
}

class TodosRepository {
    constructor() {
        this._todos = [];
        this._selectedActionId = null;
    }

    get selectedActionId() {
        return this._selectedActionId;
    }

    set selectedActionId(selectedActionId) {
        this._selectedActionId = selectedActionId;
    }

    get todos() {
        return this._todos;
    }

    set todos(todos) {
        this._todos = todos;
    }

    getActionById(id) {
        return this._todos.find(action => action.id === id);
    }
}

const todosRepository = new TodosRepository();

class ActionUI {
    static initModals() {
        const baseModalOptions = {
            autoOpen: false,
            modal: true
        };

        $addModal.dialog(baseModalOptions);
        $editdModal.dialog(baseModalOptions);
    }
}

// RENDER

function renderTodos(todos) {
    const tableRows = todos.map(action => getTableRow(action));
    $listTodos.html(tableRows.join(''));
}

function renderAction(action) {
    const tableRow = getTableRow(action)
    $listTodos.prepend(tableRow);
}

function getTableRow(action) {
    return`
        <li data-id="${action.id}" class ="js-action">${action.title}; ${action.completed}
            <i class="far fa-trash-alt action js-action-delete"></i>
            <i class="far fa-edit action js-action-edit"></i>
        </li>
    `;
}

//FORM UTILS

function getActionFormData($form) {
    const formData = new FormData($form[0]);

    return {
        title: formData.get('title'),
        completed: formData.get('completed'),
    }
}

function setEditActionFormData(action) {
    $actionEditForm[0].action.title = action.title;
    $actionEditForm[0].action.completed = action.completed;
}

function cleanForm($form) {
    $form[0].reset();
}

// Init

function init() {
    ActionUI.initModals();
    getTodos();
    createAddActionModalEventListener();
    createAddActionEventListener();
    createEditActionEventListener();
    createCancelEditEventListener();
    createActionActionsEventListener();
}

init();