const listsContainer = document.querySelector("[data-lists]");

let lists = ["name", "todo"];

function render() {
  clearElement(listsContainer);
  lists.forEach((list) => {
    const listElement = document.createElement("li");
    listElement.classList.add("list-name");
    listElement.innerText = list;
    listsContainer.appendChild(listElement);
  });
}

function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

render();

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
