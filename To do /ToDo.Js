const STORAGE_KEY = 'modernTodoListV1';

let ToDoList = loadTasks();

const inputElement = document.querySelector('#ToDo-input');
const dateElement = document.querySelector('#ToDo-date');
const addButton = document.querySelector('#add-btn');
const searchInput = document.querySelector('#search-input');
const sortOrder = document.querySelector('#sort-order');
const clearCompletedButton = document.querySelector('#clear-completed');
const todoTableBody = document.querySelector('#todo-table-body');
const completedTableBody = document.querySelector('#completed-table-body');
const statsElement = document.querySelector('#stats');

addButton.addEventListener('click', addToDo);
inputElement.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addToDo();
});
searchInput.addEventListener('input', renderTasks);
sortOrder.addEventListener('change', renderTasks);
clearCompletedButton.addEventListener('click', clearCompleted);

displayItems();

function loadTasks() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return [
      { id: crypto.randomUUID(), item: 'Review daily plan', dueDate: '', completed: false, createdAt: Date.now() },
      { id: crypto.randomUUID(), item: 'Finish JS practice', dueDate: '', completed: false, createdAt: Date.now() }
    ];
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((task) => ({
      id: task.id || crypto.randomUUID(),
      item: String(task.item || '').trim(),
      dueDate: String(task.dueDate || ''),
      completed: Boolean(task.completed),
      createdAt: Number(task.createdAt) || Date.now()
    }));
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ToDoList));
}

function addToDo() {
  const itemText = inputElement.value.trim();
  const dueDate = dateElement.value;

  if (!itemText) {
    inputElement.focus();
    return;
  }

  ToDoList.unshift({
    id: crypto.randomUUID(),
    item: itemText,
    dueDate,
    completed: false,
    createdAt: Date.now()
  });

  inputElement.value = '';
  dateElement.value = '';
  saveTasks();
  renderTasks();
}

function toggleTask(taskId) {
  ToDoList = ToDoList.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  ToDoList = ToDoList.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function editTask(taskId) {
  const task = ToDoList.find((item) => item.id === taskId);
  if (!task) return;

  const updatedText = prompt('Edit task name:', task.item);
  if (updatedText === null) return;

  const cleanText = updatedText.trim();
  if (!cleanText) return;

  const updatedDate = prompt('Edit due date (YYYY-MM-DD), keep blank for none:', task.dueDate);
  if (updatedDate === null) return;

  ToDoList = ToDoList.map((item) =>
    item.id === taskId
      ? { ...item, item: cleanText, dueDate: updatedDate.trim() }
      : item
  );

  saveTasks();
  renderTasks();
}

function clearCompleted() {
  ToDoList = ToDoList.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function formatDueDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function sortTasks(tasks) {
  const sort = sortOrder.value;
  const copied = [...tasks];

  copied.sort((a, b) => {
    if (sort === 'oldest') return a.createdAt - b.createdAt;
    if (sort === 'dueSoon') {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }
    return b.createdAt - a.createdAt;
  });

  return copied;
}

function getFilteredTasks() {
  const searchText = searchInput.value.trim().toLowerCase();

  if (!searchText) {
    return {
      activeTasks: sortTasks(ToDoList.filter((task) => !task.completed)),
      completedTasks: sortTasks(ToDoList.filter((task) => task.completed))
    };
  }

  return {
    activeTasks: sortTasks(
      ToDoList.filter((task) => !task.completed && task.item.toLowerCase().includes(searchText))
    ),
    completedTasks: sortTasks(
      ToDoList.filter((task) => task.completed && task.item.toLowerCase().includes(searchText))
    )
  };
}

function updateStats() {
  const total = ToDoList.length;
  const completed = ToDoList.filter((task) => task.completed).length;
  const active = total - completed;
  statsElement.textContent = `${total} total | ${active} active | ${completed} completed`;
}

function displayItems() {
  renderTasks();
}

function renderTasks() {
  const { activeTasks, completedTasks } = getFilteredTasks();

  todoTableBody.innerHTML = activeTasks.length
    ? activeTasks
        .map(
          (task) => `
          <tr>
            <td>
              <input type="checkbox" data-action="toggle" data-id="${task.id}" aria-label="Complete task">
            </td>
            <td>${escapeHtml(task.item)}</td>
            <td>${formatDueDate(task.dueDate)}</td>
            <td>
              <div class="action-row">
                <button class="btn btn-edit" type="button" data-action="edit" data-id="${task.id}">Edit</button>
                <button class="btn btn-danger" type="button" data-action="delete" data-id="${task.id}">Delete</button>
              </div>
            </td>
          </tr>
        `
        )
        .join('')
    : '<tr><td colspan="4" class="empty-row">No active tasks.</td></tr>';

  completedTableBody.innerHTML = completedTasks.length
    ? completedTasks
        .map(
          (task) => `
          <tr>
            <td>
              <input type="checkbox" checked data-action="toggle" data-id="${task.id}" aria-label="Undo completed task">
            </td>
            <td class="completed-text">${escapeHtml(task.item)}</td>
            <td>${formatDueDate(task.dueDate)}</td>
            <td><span class="status-chip">Completed</span></td>
          </tr>
        `
        )
        .join('')
    : '<tr><td colspan="4" class="empty-row">No completed tasks.</td></tr>';

  updateStats();
}

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const taskId = target.dataset.id;
  if (!action || !taskId) return;

  if (action === 'delete') {
    deleteTask(taskId);
  }

  if (action === 'edit') {
    editTask(taskId);
  }
});

document.addEventListener('change', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  if (target.dataset.action === 'toggle' && target.dataset.id) {
    toggleTask(target.dataset.id);
  }
});

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

saveTasks();
