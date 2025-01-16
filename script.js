// If translations.json cannot be loaded, the app defaults to English. Default value assignments have been added in some parts of the code to ensure this behavior

import LOCAL_STORAGE_KEYS from "./constants/localStorageConstants.js";
import THEME from "./constants/themeConstants.js";
import LANGUAGE from "./constants/languageConstants.js";
import TIMINGS from "./constants/timingConstants.js";
import DISPLAY_STATE from "./constants/displayStateConstants.js";

const onboardingModal = document.querySelector("[data-onboarding-modal]");
const listsContainer = document.querySelector("[data-lists]");
const listTemplate = document.getElementById("list-template");
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
const emptyStateLists = document.querySelector("[data-empty-state-lists]");
const emptyStateTasks = document.querySelector("[data-empty-state-tasks]");
const emptyStateListsMessage = emptyStateLists.querySelector(
  "[data-empty-state-lists-message]"
);
const emptyStateTasksMessage = emptyStateTasks.querySelector(
  "[data-empty-state-tasks-message]"
);

let translations = {};
let activeTranslations = {};
let onboardingModalData = null;

let isAppInitialized = JSON.parse(
  getLocalStorageItem(LOCAL_STORAGE_KEYS.APP_INITIALIZED) || false
);
let lists = JSON.parse(getLocalStorageItem(LOCAL_STORAGE_KEYS.LISTS)) || [];
let selectedListId = getLocalStorageItem(LOCAL_STORAGE_KEYS.SELECTED_LIST_ID);
let defaultListCreated = JSON.parse(
  getLocalStorageItem(LOCAL_STORAGE_KEYS.DEFAULT_LIST_CREATED) || false
);
let defaultListId = getLocalStorageItem(LOCAL_STORAGE_KEYS.DEFAULT_LIST_ID);
let appTheme =
  getLocalStorageItem(LOCAL_STORAGE_KEYS.THEME) ||
  themeElement.dataset.theme ||
  THEME.LIGHT;
let appLanguage =
  getLocalStorageItem(LOCAL_STORAGE_KEYS.LANGUAGE) ||
  navigator.language.split("-")[0] ||
  LANGUAGE.EN;

listsContainer.addEventListener("click", (e) => {
  const targetElement = e.target.parentElement.parentElement;
  if (e.target.tagName.toLowerCase() === "span") {
    if (e.target.classList.contains("list-name")) {
      selectedListId = targetElement.dataset.listId;
      saveAndRender();
    } else if (e.target.classList.contains("rename-list-text")) {
      renameInputForList(targetElement);
    }
  }
});

function handleTouchForListRename(listContainer) {
  let pressTimer;

  // Touch events - Start
  listContainer.addEventListener("touchstart", (e) => {
    const targetElement = e.target.parentElement.parentElement;
    if (
      targetElement.matches("li") &&
      targetElement.dataset.listId !== defaultListId &&
      targetElement.dataset.listId === selectedListId
    ) {
      pressTimer = setTimeout(() => {
        renameInputForList(targetElement);
      }, TIMINGS.RENAME.MOBILE_PRESS_DURATION);
    }
  });

  listContainer.addEventListener("touchend", () => {
    clearTimeout(pressTimer);
  });
  // Touch events - End
}
handleTouchForListRename(listsContainer);

// When we click on a <span> inside a <label>, it also triggers the <label>'s behavior.
// The <label> has a special relationship with the <input>.
// This means clicking on the <label> (or any child like <span>) activates the <input>.
// stopPropagation() is used to stop the event from bubbling up to parent elements during the bubbling phase.
// The bubbling phase is when the event moves from the child element (e.g., <span>) to its parent elements (e.g., <label>).
// However, stopPropagation() does not stop the browser's default <label>-<input> behavior.
// Capturing phase happens before bubbling, starting from the outermost element to the target element.
// To prevent the <label>-<input> behavior, we must use preventDefault() to stop the browser's default action.
tasksContainer.addEventListener("click", (e) => {
  const targetElement = e.target;
  if (
    targetElement.tagName.toLowerCase() === "div" &&
    targetElement.classList.contains("task")
  ) {
    // if the selected element is the div with the class 'task'
    const taskCheckbox = targetElement.querySelector("input[type='checkbox']");
    if (taskCheckbox.type === "checkbox" && taskCheckbox.hasAttribute("id")) {
      updateTaskStatus(e);
    }
  } else if (
    targetElement.tagName.toLowerCase() === "input" &&
    targetElement.type === "checkbox"
  ) {
    // the user interacted with the span that has the 'checkbox' class inside the label,
    // this triggered the label's default behavior,
    // which is linked to the checkbox input
    updateTaskStatus(e);
  } else if (targetElement.tagName.toLowerCase() === "label") {
    // if the selected element is the label
    e.stopPropagation();
    e.preventDefault();
  } else if (
    targetElement.tagName.toLowerCase() === "span" &&
    targetElement.classList.contains("task-name")
  ) {
    // if the selected element is the span with the class 'task-name',
    // it should not update the task status but instead handle renaming the task.
    // this is why e.preventDefault is used to stop the label's default behavior
    // from triggering its associated checkbox input
    e.stopPropagation();
    e.preventDefault();
    const taskElementToRename = targetElement.parentElement.parentElement;
    renameInputForTask(taskElementToRename);
  }
});

tasksContainer.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    e.target.tagName.toLowerCase() === "input" &&
    e.target.type === "checkbox" // to prevent it from working when submitting with the Enter key during task renaming
  ) {
    updateTaskStatus(e);
  }
});

function updateTaskStatus(event) {
  const selectedList = getSelectedListById(selectedListId);
  const selectedTask = selectedList.tasks.find(
    (task) =>
      task.id ===
      (event.target.id ||
        event.target.querySelector("input[type='checkbox']").id)
  );

  if (event.type === "click") {
    if (
      event.target.tagName.toLowerCase() === "div" &&
      event.target.classList.contains("task")
    ) {
      selectedTask.complete = !selectedTask.complete;
    } else {
      selectedTask.complete = event.target.checked;
    }
  } else if (event.type === "keydown" && event.key === "Enter") {
    selectedTask.complete = !selectedTask.complete;
  }

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

// Event listeners are executed only when their corresponding event is triggered
// therefore, they can reference functions or variables defined later in the code
// (deleteConfirmationMessage)
clearCompleteTasksButton.addEventListener("click", (e) => {
  if (!confirm(deleteConfirmationMessage(dynamicPartForTasks))) return;
  const selectedList = getSelectedListById(selectedListId);
  selectedList.tasks = selectedList.tasks.filter((task) => !task.complete);
  if (!selectedList.tasks.length)
    emptyStateTasks.style.display = DISPLAY_STATE.DEFAULT;
  saveAndRender();
});

deleteListButton.addEventListener("click", (e) => {
  if (!confirm(deleteConfirmationMessage(dynamicPartForList))) return;
  defaultListId = defaultListId === selectedListId ? null : defaultListId;
  saveDefaultList();
  lists = lists.filter((list) => list.id !== selectedListId);
  selectedListId = lists[0]?.id || null;
  saveAndRender();
});

let baseConfirmationText = "Are you sure you want to delete";
let dynamicPartForList = "this list";
let dynamicPartForTasks = "all completed tasks";

const confirmationMessages = {
  [LANGUAGE.TR]: (dynamicPart = "") =>
    `${dynamicPart ? ` ${dynamicPart}` : ""} ${baseConfirmationText}?`,
  [LANGUAGE.EN]: (dynamicPart = "") =>
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
  if (!isValidListName(listName)) return;
  const list = createList(listName);
  newListInput.value = null;
  lists.push(list);
  selectedListId = list.id;
  listCountElement.style.display = DISPLAY_STATE.DEFAULT;
  newTaskInput.focus();
  saveAndRender();
});

newTaskForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const taskName = newTaskInput.value;
  if (!isValidTaskName(taskName)) return;
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
  setLocalStorageItem(LOCAL_STORAGE_KEYS.LISTS, lists);
  setLocalStorageItem(LOCAL_STORAGE_KEYS.SELECTED_LIST_ID, selectedListId);
}

function render() {
  if (!isAppInitialized) {
    isAppInitialized = true;
    setAppInitialized();

    if (onboardingModalData) {
      updateOnboardingModalContent();
      onboardingModal.style.display = DISPLAY_STATE.BLOCK;
    }
  }
  clearElement(listsContainer);
  renderLists();
  const selectedList = getSelectedListById(selectedListId);
  emptyStateLists.style.display = DISPLAY_STATE.NONE;
  if (selectedListId === null) {
    listCountElement.style.display = DISPLAY_STATE.NONE;
    todoBody.style.display = DISPLAY_STATE.NONE;
    if (!lists.length) {
      listTitleElement.textContent =
        activeTranslations?.messages?.welcome ||
        "Let's create a list to get started!";
      emptyStateLists.style.display = DISPLAY_STATE.DEFAULT;
    } else {
      listTitleElement.textContent =
        activeTranslations?.messages?.selectOrCreateList ||
        "Please select or create a list to continue.";
    }
  } else {
    listCountElement.style.display = DISPLAY_STATE.DEFAULT;
    todoBody.style.display = DISPLAY_STATE.DEFAULT;
    listTitleElement.textContent = selectedList.name;
    renderTaskCount(selectedList);
    clearElement(tasksContainer);
    renderTasks(selectedList);
    setClearCompleteTasksButtonVisibility(selectedList);
  }
  setLanguageToggleVisibilityFromTranslations();
}

function renderTasks(selectedList) {
  emptyStateTasks.style.display = DISPLAY_STATE.DEFAULT;
  const sortedTasks = sortTasks(selectedList.tasks);
  sortedTasks.forEach((task) => {
    emptyStateTasks.style.display = DISPLAY_STATE.NONE;
    const taskElement = document.importNode(taskTemplate.content, true);
    const taskDiv = taskElement.querySelector("[data-task-id]");
    taskDiv.dataset.taskId = task.id;
    const checkbox = taskElement.querySelector("input");
    checkbox.id = task.id;
    checkbox.checked = task.complete;
    const label = taskElement.querySelector("label");
    label.htmlFor = task.id;
    const taskNameSpan = label.querySelector("[data-task-name]");
    taskNameSpan.textContent = task.name;
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
  listCountElement.textContent = `${incompleteTaskCount} ${taskString} ${
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
    const importedContent = document.importNode(listTemplate.content, true);
    const listElement = importedContent.firstElementChild;
    listElement.dataset.listId = list.id;
    if (list.id === selectedListId) {
      listElement.classList.add("active-list");
    }

    const listName = listElement.querySelector("[data-list-name]");
    listName.textContent = list.name;

    if (listElement.dataset.listId !== defaultListId) {
      const renameListText = listElement.querySelector(
        "[data-rename-list-text]"
      );
      renameListText.textContent =
        activeTranslations?.buttons?.rename?.forList || "Rename list";
    } else {
      const listContainer = listElement.querySelector("[data-list]");
      const renameButton = listElement.querySelector("[data-rename-list-text]");
      listContainer.removeChild(renameButton);
    }

    listsContainer.appendChild(listElement);
  });
}

function clearElement(element) {
  element.innerHTML = "";
}

function getSelectedListById(selectedListId) {
  return lists.find((list) => list.id === selectedListId);
}

function renameInputForList(listElement) {
  const listToRenameId = listElement.dataset.listId;
  const listNameElement = listElement.querySelector("[data-list-name]");
  const renameListFormTemplate = `
    <form action="" data-rename-list-form>
      <input
        type="text"
        spellcheck="false"
        class="rename list"
        data-rename-list-input
        placeholder="${listNameElement.innerText}"
        value="${listNameElement.innerText}"
        aria-label="rename list name"
      />
    </form>
  `;
  listElement.innerHTML = renameListFormTemplate;
  const renameListForm = listElement.querySelector("[data-rename-list-form]");
  const renameInput = renameListForm.querySelector(
    "input[data-rename-list-input]"
  );
  //const listNameLenght = renameInput.value.length;

  // renameInput.setSelectionRange(listNameLenght, listNameLenght);
  // renameInput.scrollLeft = renameInput.scrollWidth;
  renameInput.focus();
  renameInput.select();

  renameInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      renameInput.blur();
    }
  });

  renameListForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newListName = renameInput.value;
    if (!isValidListName(newListName)) return;
    lists = lists.map((list) => {
      return list.id === listToRenameId ? { ...list, name: newListName } : list;
    });
    saveAndRender();
  });

  renameListForm.addEventListener("focusout", () => {
    render();
  });
}

function isValidListName(listName) {
  listName = listName.trim();
  return !listName ? false : true;
}

function renameInputForTask(taskElement) {
  const taskToRenameId = taskElement.dataset.taskId;
  const taskNameElement = taskElement.querySelector("[data-task-name]");
  const renameTaskFormTemplate = `
    <form action="" data-rename-task-form>
      <textarea 
        spellcheck="false"
        class="rename task"
        data-rename-task-input
        placeholder="${taskNameElement.innerText}"
        aria-label="rename task name"
      >${taskNameElement.innerText}</textarea>
    </form>
  `;
  taskElement.innerHTML = renameTaskFormTemplate;
  const renameTaskForm = taskElement.querySelector("[data-rename-task-form]");
  const renameTaskInput = renameTaskForm.querySelector(
    "textarea[data-rename-task-input]"
  );

  renameTaskInput.focus();
  renameTaskInput.select();

  // on focus, adjustInputHeight is called directly (immediate execution)
  // on input, a callback ensures adjustInputHeight runs only when the event triggers
  renameTaskInput.addEventListener("focus", adjustInputHeight());
  renameTaskInput.addEventListener("input", () => adjustInputHeight());

  function adjustInputHeight() {
    renameTaskInput.style.height = "auto";
    renameTaskInput.style.height = `${renameTaskInput.scrollHeight}px`;
  }

  renameTaskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTaskName = renameTaskInput.value;
      handleTaskRename(newTaskName, selectedListId, taskToRenameId);
    }
  });

  renameTaskInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      renameTaskInput.blur();
    }
  });

  renameTaskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newTaskName = renameTaskInput.value;
    handleTaskRename(newTaskName, selectedListId, taskToRenameId);
  });

  renameTaskForm.addEventListener("focusout", () => {
    render();
  });
}

function handleTaskRename(newTaskName, selectedListId, taskToRenameId) {
  if (!isValidTaskName(newTaskName)) return;
  const selectedList = getSelectedListById(selectedListId);
  const selectedTask = selectedList.tasks.find(
    (task) => task.id === taskToRenameId
  );
  selectedTask.name = newTaskName;
  saveAndRender();
}

function isValidTaskName(taskName) {
  taskName = taskName.trim();
  return !taskName ? false : true;
}

function getLocalStorageItem(key) {
  const value = localStorage.getItem(key);

  const map = {
    null: null,
    undefined: undefined,
  };

  return value in map ? map[value] : value;
}

function setLocalStorageItem(key, value) {
  if (!key) {
    console.log("Key is required to set an item in localStorage");
    return;
  }

  try {
    localStorage.setItem(
      key,
      typeof value === "object" ? JSON.stringify(value) : value
    );
  } catch (error) {
    console.log("Failed to set item in localStorage:", error);
  }
}

function toggleTheme() {
  const newTheme =
    getLocalStorageItem(LOCAL_STORAGE_KEYS.THEME) === THEME.LIGHT
      ? THEME.DARK
      : THEME.LIGHT;
  applyTheme(newTheme);
}

function applyTheme(theme) {
  appTheme = theme || appTheme;
  themeElement.dataset.theme = appTheme;
  themeToggleButton.textContent =
    appTheme === THEME.LIGHT
      ? activeTranslations?.buttons?.theme?.darkModeContent || "🌙"
      : activeTranslations?.buttons?.theme?.lightModeContent || "🔆";
  setLocalStorageItem(LOCAL_STORAGE_KEYS.THEME, appTheme);
}

function toggleLanguage() {
  const newLanguage =
    getLocalStorageItem(LOCAL_STORAGE_KEYS.LANGUAGE) === LANGUAGE.TR
      ? LANGUAGE.EN
      : LANGUAGE.TR;
  applyLanguage(newLanguage);
  render();
}

function applyLanguage(newLanguage) {
  appLanguage = newLanguage || appLanguage;
  languageToggleButton.textContent =
    appLanguage === LANGUAGE.TR
      ? activeTranslations?.buttons?.languageSupport?.enContent || "EN"
      : activeTranslations?.buttons?.languageSupport?.trContent || "TR";
  setLocalStorageItem(LOCAL_STORAGE_KEYS.LANGUAGE, appLanguage);
  setActiveTranslations();
  updateTextsForSelectedLanguage();
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
      appTheme === THEME.LIGHT
        ? activeTranslations.buttons.theme.darkModeContent
        : activeTranslations.buttons.theme.lightModeContent;
    languageToggleButton.textContent =
      appLanguage === LANGUAGE.TR
        ? activeTranslations.buttons.languageSupport.enContent
        : activeTranslations.buttons.languageSupport.trContent;

    emptyStateListsMessage.textContent =
      activeTranslations.messages.emptyStateForList;
    emptyStateTasksMessage.textContent =
      activeTranslations.messages.emptyStateForTask;

    if (!isAppInitialized) {
      onboardingModalData = activeTranslations.onboardingModalData;
    }

    if (defaultListId) {
      updateDefaultListNameByLanguage();
    }
  }
}

function setLanguageToggleVisibilityFromTranslations() {
  !activeTranslations
    ? (languageToggleButton.style.visibility = "hidden")
    : (languageToggleButton.style.visibility = "");
}

function saveDefaultList() {
  setLocalStorageItem(
    LOCAL_STORAGE_KEYS.DEFAULT_LIST_CREATED,
    defaultListCreated
  );
  setLocalStorageItem(LOCAL_STORAGE_KEYS.DEFAULT_LIST_ID, defaultListId);
}

function createDefaultList() {
  if (!defaultListCreated && !lists.length) {
    const listName = activeTranslations?.defaultListName ?? "Tasks";
    const defaultList = createList(listName);
    defaultListId = defaultList.id;
    defaultListCreated = true;
    saveDefaultList();
    selectedListId = defaultListId;
    lists.unshift(defaultList);
    save();
  }
}

function updateDefaultListNameByLanguage() {
  lists = lists.map((list) => {
    return list.id === defaultListId
      ? { ...list, name: activeTranslations.defaultListName }
      : list;
  });
}

function updateOnboardingModalContent() {
  const titleElement = document.querySelector("[data-onboarding-modal-title]");
  const descriptionElement = document.querySelector(
    "[data-onboarding-modal-description]"
  );
  const list = document.querySelector("[data-onboarding-modal-list]");
  const buttonStart = document.querySelector(
    "[data-onboarding-modal-button-start]"
  );
  const listItemTemplate = (content) => `
    <li
      class="onboarding-modal-list-item"
      data-onboarding-modal-list-item>
      ${content}
    </li>
  `;

  titleElement.textContent = onboardingModalData.title;
  descriptionElement.textContent = onboardingModalData.description;
  buttonStart.textContent = onboardingModalData.buttonStart;

  Object.values(onboardingModalData.listItems).forEach((listItem) => {
    list.innerHTML += listItemTemplate(listItem);
  });
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
    applyLanguage(LANGUAGE.EN);
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
    activeTranslations = translations ? translations[appLanguage] : null;
    return true;
  }
  return false;
}

function applyPreferences(theme, language) {
  applyTheme(theme);
  applyLanguage(language);
}

function setAppInitialized() {
  setLocalStorageItem(LOCAL_STORAGE_KEYS.APP_INITIALIZED, isAppInitialized);
}

async function initializeApp() {
  loadTranslations(await fetchTranslations());
  applyPreferences();
  createDefaultList();
  render();
}

initializeApp();
