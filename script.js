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
const themeElement = document.querySelector("[data-theme]");
const themeToggleButton = document.querySelector("[data-theme-toggle-button]");
const languageToggleButton = document.querySelector(
  "[data-language-toggle-button]"
);
const pageTitle = document.querySelector("[data-page-title]");
const taskListTitle = document.querySelector("[data-task-list-title]");

let translations = {};
let activeTranslations = {};

const LOCAL_STORAGE_LIST_KEY = "task.lists";
const LOCAL_STORAGE_SELECTED_LIST_ID_KEY = "task.selectedListId";
const LOCAL_STORAGE_THEME_KEY = "app.theme";
const LOCAL_STORAGE_LANGUAGE_KEY = "app.language";

let lists = JSON.parse(localStorage.getItem(LOCAL_STORAGE_LIST_KEY)) || [];
let selectedListId = getLocalStorageItem(LOCAL_STORAGE_SELECTED_LIST_ID_KEY);
let appTheme =
  getLocalStorageItem(LOCAL_STORAGE_THEME_KEY) ||
  themeElement.dataset.theme ||
  "light";
let appLanguage =
  getLocalStorageItem(LOCAL_STORAGE_LANGUAGE_KEY) ||
  navigator.language ||
  "en-US";

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
    if (selectedTask.complete) {
      selectedTask.completedDate = Date.now();
    } else {
      selectedTask.completedDate = null;
      selectedTask.createdDate = Date.now();
    }
    saveAndRender();
    renderTaskCount(selectedList);
    setClearCompleteTasksButtonVisibility(selectedList);
  }
});

// Event listeners are executed only when their corresponding event is triggered
// therefore, they can reference functions or variables defined later in the code
// (deleteConfirmationMessage)
clearCompleteTasksButton.addEventListener("click", (e) => {
  if (!confirm(deleteConfirmationMessage(dynamicPartForTasks))) return;
  const selectedList = getSelectedListById(selectedListId);
  selectedList.tasks = selectedList.tasks.filter((task) => !task.complete);
  saveAndRender();
});

deleteListButton.addEventListener("click", (e) => {
  if (!confirm(deleteConfirmationMessage(dynamicPartForList))) return;
  lists = lists.filter((list) => list.id !== selectedListId);
  selectedListId = lists[0]?.id || null;
  saveAndRender();
});

let baseConfirmationText = "Are you sure you want to delete";
let dynamicPartForList = "this list";
let dynamicPartForTasks = "all completed tasks";

const confirmationMessages = {
  tr: (dynamicPart = "") =>
    `${dynamicPart ? ` ${dynamicPart}` : ""} ${baseConfirmationText}?`,
  "en-US": (dynamicPart = "") =>
    `${baseConfirmationText}${dynamicPart ? ` ${dynamicPart}` : ""}?`,
};

const deleteConfirmationMessage = (dynamicPart = "") => {
  return confirmationMessages[appLanguage](dynamicPart);
};

themeToggleButton.addEventListener("click", (e) => {
  toggleTheme();
});

languageToggleButton.addEventListener("click", (e) => {
  toggleLanguage();
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
  newTaskInput.focus();
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
    createdDate: Date.now(),
    completedDate: null,
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
    listCountElement.style.display = "none";
    todoBody.style.display = "none";
    if (!lists.length) {
      listTitleElement.innerText =
        activeTranslations?.messages?.welcome ||
        "Let's create a list to get started!";
    } else {
      listTitleElement.innerText =
        activeTranslations?.messages?.selectOrCreateList ||
        "Please select or create a list to continue.";
    }
  } else {
    listCountElement.style.display = "";
    todoBody.style.display = "";
    listTitleElement.innerText = selectedList.name;
    renderTaskCount(selectedList);
    clearElement(tasksContainer);
    renderTasks(selectedList);
    setClearCompleteTasksButtonVisibility(selectedList);
  }
  setLanguageToggleVisibilityFromTranslations();
}

function renderTasks(selectedList) {
  const sortedTasks = sortTasks(selectedList.tasks);
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

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.complete && b.complete) {
      return b.completedDate - a.completedDate;
    }
    if (!a.complete && !b.complete) {
      return b.createdDate - a.createdDate;
    }
    return a.complete - b.complete;
  });
}

function renderTaskCount(selectedList) {
  const incompleteTaskCount = selectedList.tasks.filter(
    (task) => !task.complete
  ).length;
  const taskString =
    incompleteTaskCount === 1
      ? activeTranslations?.taskCount?.taskSingular ?? "task"
      : activeTranslations?.taskCount?.taskPlural ?? "tasks";
  listCountElement.innerText = `${incompleteTaskCount} ${taskString} ${
    activeTranslations?.taskCount?.remaining ?? "remaining"
  }`;
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

function getLocalStorageItem(key) {
  const value = localStorage.getItem(key);

  const map = {
    null: null,
    undefined: undefined,
  };

  return value in map ? map[value] : value;
}

function toggleTheme() {
  const newTheme =
    getLocalStorageItem(LOCAL_STORAGE_THEME_KEY) === "light" ? "dark" : "light";
  applyTheme(newTheme);
}

function applyTheme(theme) {
  const newTheme = theme || appTheme;
  themeElement.dataset.theme = newTheme;
  themeToggleButton.innerText =
    newTheme === "light"
      ? activeTranslations?.buttons?.theme?.darkModeContent || "🌙"
      : activeTranslations?.buttons?.theme?.lightModeContent || "🔆";
  localStorage.setItem(LOCAL_STORAGE_THEME_KEY, newTheme);
}

function toggleLanguage() {
  const newLanguage =
    getLocalStorageItem(LOCAL_STORAGE_LANGUAGE_KEY) === "tr" ? "en-US" : "tr";
  applyLanguage(newLanguage);
}

function applyLanguage(newLanguage) {
  appLanguage = newLanguage || appLanguage;
  languageToggleButton.innerText =
    appLanguage === "tr"
      ? activeTranslations?.buttons?.languageSupport?.enContent || "EN"
      : activeTranslations?.buttons?.languageSupport?.trContent || "TR";
  localStorage.setItem(LOCAL_STORAGE_LANGUAGE_KEY, appLanguage);
  setActiveTranslations();
  updateTextsForSelectedLanguage();
  render();
}

function updateTextsForSelectedLanguage() {
  if (activeTranslations) {
    pageTitle.textContent = activeTranslations.pageTitle;
    taskListTitle.textContent = activeTranslations.taskListTitle;
    listTitleElement.textContent = activeTranslations.messages.welcome;
    newListInput.placeholder = activeTranslations.listInputPlaceholder;
    newTaskInput.placeholder = activeTranslations.taskInputPlaceholder;
    clearCompleteTasksButton.textContent =
      activeTranslations.buttons.clearCompleted;
    deleteListButton.textContent = activeTranslations.buttons.deleteList;

    baseConfirmationText =
      activeTranslations.messages.deleteConfirmation.baseMessage;
    dynamicPartForList = activeTranslations.messages.deleteConfirmation.forList;
    dynamicPartForTasks =
      activeTranslations.messages.deleteConfirmation.forTasks;

    themeToggleButton.textContent =
      getLocalStorageItem(LOCAL_STORAGE_THEME_KEY) === "light"
        ? activeTranslations.buttons.theme.darkModeContent
        : activeTranslations.buttons.theme.lightModeContent;
    languageToggleButton.textContent =
      appLanguage === "tr"
        ? activeTranslations.buttons.languageSupport.enContent
        : activeTranslations.buttons.languageSupport.trContent;
  }
}

function setLanguageToggleVisibilityFromTranslations() {
  !activeTranslations
    ? (languageToggleButton.style.visibility = "hidden")
    : (languageToggleButton.style.visibility = "");
}

async function fetchTranslations() {
  // const xhr = new XMLHttpRequest();
  // xhr.open("GET", "translations.json", true);
  // xhr.onreadystatechange = function () {
  //   if (xhr.readyState === 4 && xhr.status === 200) {
  //     const translations = JSON.parse(xhr.responseText);
  //   }
  // };
  // xhr.send();

  try {
    const response = await fetch("translations.json");
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    applyLanguage("en-US");
    console.error("Failed to fetch translations:", error.message);
    return null;
  }
}

function loadTranslations(translationsData) {
  if (translationsData) {
    translations = translationsData;
  }
}

function setActiveTranslations() {
  if (translations) {
    const language = getLocalStorageItem(LOCAL_STORAGE_LANGUAGE_KEY);
    activeTranslations = translations ? translations[language] : null;
    return true;
  }
  return false;
}

function applyPreferences(theme, language) {
  applyTheme(theme);
  applyLanguage(language);
}

async function initializeApp() {
  loadTranslations(await fetchTranslations());
  applyPreferences();
  render();
}

initializeApp();
