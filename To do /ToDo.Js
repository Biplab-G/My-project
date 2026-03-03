let ToDoList = [
  {
    item: 'Hoil Expence',
    dueDate: '03/03/2026'
  },
  {
    item: 'Computer On',
    dueDate: '03/03/2026'
  }
];

displayItems();

function addToDo() {
  let inputElement = document.querySelector('#ToDo-input');
  let dateElement = document.querySelector('#ToDo-date');
  let ToDoItem = inputElement.value;
  let ToDoDate = dateElement.value;
  ToDoList.push({item: ToDoItem, dueDate: ToDoDate});
  inputElement.value = '';
  dateElement.value = '';
  displayItems();
}

function displayItems() {
  let containerElement = document.querySelector('.ToDo-container');
  let newHtml = '';
  for (let i = 0; i < ToDoList.length; i++) {
    let {item, dueDate} = ToDoList[i];
    newHtml += `
      <span>${item}</span>
      <span>${dueDate}</span>
      <button class='btn-delete' onclick="ToDoList.splice(${i}, 1);
      displayItems();">Delete</button>
    `;
  }
  containerElement.innerHTML = newHtml;
}