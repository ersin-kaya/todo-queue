const listsContainer = document.querySelector("[data-lists]");
const newListForm = document.querySelector("[data-new-list-form]");
const newListInput = document.querySelector("[data-new-list-input]");
const deleteListButton = document.querySelector("[data-delete-list-button]");
const listDisplayContainer = document.querySelector(
  "[data-list-display-container]"
);
const listTitleElement = document.querySelector("[data-list-title]");
const listCountElement = document.querySelector("[data-list-count]");
const tasksContainer = document.querySelector("[data-tasks]");
const taskTemplate = document.getElementById("task-template");
const newTaskForm = document.querySelector("[data-new-task-form]");
const newTaskInput = document.querySelector("[data-new-task-input]");
const clearCompleteTasksButton = document.querySelector(
  "[data-clear-complete-tasks-button]"
);
const todoBody = listDisplayContainer.querySelector("[data-todo-body]");

const welcomeMessage = "Let's create a list to get started!";
const deleteConfirmationMessage = (dynamicPart = "") =>
  `Are you sure you want to delete${dynamicPart ? ` ${dynamicPart}` : ""}?`;

const LOCAL_STORAGE_LIST_KEY = "task.lists";
const LOCAL_STORAGE_SELECTED_LIST_ID_KEY = "task.selectedListId";

let lists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LIST_KEY)) || [];
let selectedListId = getLocalStorageItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY);

listsContainer.addEventListener("click", (e) => {
  if (e.target.tagName.toLowerCase() === "li") {
    selectedListId = e.target.dataset.listId;
    saveAndRender();
  }
});

tasksContainer.addEventListener("click", (e) => {
  if (e.target.tagName.toLowerCase() === "input") {
    const selectedList = getSelectedListById(selectedListId);
    const selectedTask = selectedList.tasks.find(
      (task) => task.id === e.target.id
    );
    selectedTask.complete = e.target.checked;
    save();
    renderTaskCount(selectedList);
    setClearCompleteTasksButtonVisibility(selectedList);
  }
});

clearCompleteTasksButton.addEventListener("click", (e) => {
  if (!confirm(deleteConfirmationMessage("all completed tasks"))) return;
  const selectedList = getSelectedListById(selectedListId);
  selectedList.tasks = selectedList.tasks.filter((task) => !task.complete);
  resetTasksOrder(selectedList.tasks);
  saveAndRender();
});

deleteListButton.addEventListener("click", (e) => {
  if (!confirm(deleteConfirmationMessage("this list"))) return;
  lists = lists.filter((list) => list.id !== selectedListId);
  selectedListId = lists[0]?.id || null;
  if (!lists.length) {
    listTitleElement.innerText = welcomeMessage;
    listCountElement.style.display = "none";
  }
  saveAndRender();
});

newListForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const listName = newListInput.value.trim();
  if (!listName) return;
  const list = createList(listName);
  newListInput.value = null;
  lists.push(list);
  selectedListId = list.id;
  listCountElement.style.display = "";
  saveAndRender();
});

newTaskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const taskName = newTaskInput.value;
  if (!taskName) return;
  const task = createTask(taskName);
  newTaskInput.value = null;
  const selectedList = getSelectedListById(selectedListId);
  selectedList.tasks.push(task);
  saveAndRender();
});

function createList(name) {
  return {
    id: Date.now().toString(),
    name: name,
    tasks: [],
  };
}

function createTask(name) {
  return {
    id: Date.now().toString(),
    name: name,
    complete: false,
    order: getSelectedListById(selectedListId).tasks.length,
  };
}

function saveAndRender() {
  save();
  render();
}

function save() {
  localStorage.setItem(LOCAL_STORAGE_LIST_KEY, JSON.stringify(lists));
  localStorage.setItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY, selectedListId);
}

function render() {
  clearElement(listsContainer);
  renderLists();
  const selectedList = getSelectedListById(selectedListId);
  if (selectedListId === null) {
    todoBody.style.display = "none";
  } else {
    todoBody.style.display = "";
    listTitleElement.innerText = selectedList.name;
    renderTaskCount(selectedList);
    clearElement(tasksContainer);
    renderTasks(selectedList);
    setClearCompleteTasksButtonVisibility(selectedList);
  }
}

function renderTasks(selectedList) {
  const sortedTasks = [...selectedList.tasks];
  sortedTasks.sort((a, b) => b.order - a.order);
  sortedTasks.forEach((task) => {
    const taskElement = document.importNode(taskTemplate.content, true);
    const checkbox = taskElement.querySelector("input");
    checkbox.id = task.id;
    checkbox.checked = task.complete;
    const label = taskElement.querySelector("label");
    label.htmlFor = task.id;
    label.append(task.name);
    tasksContainer.appendChild(taskElement);
  });
}

function renderTaskCount(selectedList) {
  const incompleteTaskCount = selectedList.tasks.filter(
    (task) => !task.complete
  ).length;
  const taskString = incompleteTaskCount === 1 ? "task" : "tasks";
  listCountElement.innerText = `${incompleteTaskCount} ${taskString} remaining`;
}

function setClearCompleteTasksButtonVisibility(selectedList) {
  const isVisible = getCompleteTasksCount(selectedList) > 0;
  clearCompleteTasksButton.style.visibility = isVisible ? "visible" : "hidden";
}

function getCompleteTasksCount(selectedList) {
  return selectedList.tasks.reduce(
    (count, task) => count + (task.complete ? 1 : 0),
    0
  );
}

function renderLists() {
  lists.forEach((list) => {
    const listElement = document.createElement("li");
    listElement.dataset.listId = list.id;
    listElement.classList.add("list-name");
    listElement.innerText = list.name;
    if (list.id === selectedListId) {
      listElement.classList.add("active-list");
    }
    listsContainer.appendChild(listElement);
  });
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

function getSelectedListById(selectedListId) {
  return lists.find((list) => list.id === selectedListId);
}

function resetTasksOrder(tasks) {
  tasks = tasks.map((task, index) => {
    task.order = tasks.length - 1 - index;
    return task;
  });
}

function getLocalStorageItem(key) {
  const value = localStorage.getItem(key);

  const map = {
    null: null,
    undefined: undefined,
  };

  return value in map ? map[value] : value;
}

function initializeApp() {
  listTitleElement.innerText = welcomeMessage;
  render();
}

initializeApp();

// // // Notes

// // Data attributes
// getAttribute
// const listsContainer = document.querySelector(".task-list");
// const dataValue = listsContainer.getAttribute("data-lists");
// console.log(dataValue);

// dataset
// const element = document.querySelector("[data-lists]");
// console.log(element.dataset.lists);

// matches or hasAttribute
// const element = document.querySelector("[data-lists]");
// console.log("matches", element.matches("[data-lists]"));
// console.log("hasAttribute", element.hasAttribute("data-lists"));
