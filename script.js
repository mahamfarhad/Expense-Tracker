const STORAGE_KEY = "personal-expense-tracker-v1";
let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let editingId = null;

const form = document.getElementById("expenseForm");
const titleInput = document.getElementById("title");
const amountInput = document.getElementById("amount");
const categoryInput = document.getElementById("category");
const editIdInput = document.getElementById("editId");
const table = document.getElementById("expenseTable");
const totalAmount = document.getElementById("totalAmount");
const expenseCount = document.getElementById("expenseCount");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("search");
const filterCategory = document.getElementById("filterCategory");
const toast = document.getElementById("toast");

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function money(value) {
  return Number(value).toLocaleString("en-PK", {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function render() {
  const search = searchInput.value.trim().toLowerCase();
  const filter = filterCategory.value;

  const visible = expenses.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(search) || e.category.toLowerCase().includes(search);
    const matchesFilter = filter === "All" || e.category === filter;
    return matchesSearch && matchesFilter;
  });

  table.innerHTML = "";
  visible.forEach(e => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="expense-title">${escapeHtml(e.title)}</div>
        <div class="date">${new Date(e.createdAt).toLocaleDateString()}</div>
      </td>
      <td><span class="category-pill">${escapeHtml(e.category)}</span></td>
      <td class="amount">Rs ${money(e.amount)}</td>
      <td>
        <div class="actions">
          <button class="action-btn" onclick="editExpense('${e.id}')">Edit</button>
          <button class="action-btn delete" onclick="deleteExpense('${e.id}')">Delete</button>
        </div>
      </td>`;
    table.appendChild(row);
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  totalAmount.textContent = money(total);
  expenseCount.textContent = `${expenses.length} ${expenses.length === 1 ? "expense" : "expenses"} recorded`;

  emptyState.classList.toggle("show", visible.length === 0);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1800);
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const category = categoryInput.value;

  if (!title || !amount || amount <= 0 || !category) return;

  if (editingId) {
    const item = expenses.find(e => e.id === editingId);
    if (item) {
      item.title = title;
      item.amount = amount;
      item.category = category;
      showToast("Expense updated");
    }
    editingId = null;
    document.getElementById("formHeading").textContent = "Add Expense";
    document.getElementById("submitText").textContent = "Add Expense";
    document.getElementById("cancelEdit").classList.add("hidden");
  } else {
    expenses.unshift({id: crypto.randomUUID(), title, amount, category, createdAt: new Date().toISOString()});
    showToast("Expense added");
  }

  form.reset();
  save();
  render();
});

window.editExpense = id => {
  const item = expenses.find(e => e.id === id);
  if (!item) return;
  editingId = id;
  titleInput.value = item.title;
  amountInput.value = item.amount;
  categoryInput.value = item.category;
  document.getElementById("formHeading").textContent = "Edit Expense";
  document.getElementById("submitText").textContent = "Update Expense";
  document.getElementById("cancelEdit").classList.remove("hidden");
  titleInput.focus();
};

window.deleteExpense = id => {
  const item = expenses.find(e => e.id === id);
  if (!item) return;
  if (!confirm(`Delete "${item.title}"?`)) return;
  expenses = expenses.filter(e => e.id !== id);
  save();
  render();
  showToast("Expense deleted");
};

document.getElementById("cancelEdit").addEventListener("click", () => {
  editingId = null;
  form.reset();
  document.getElementById("formHeading").textContent = "Add Expense";
  document.getElementById("submitText").textContent = "Add Expense";
  document.getElementById("cancelEdit").classList.add("hidden");
});

document.getElementById("clearAll").addEventListener("click", () => {
  if (!expenses.length) return showToast("There are no expenses to clear");
  if (!confirm("Delete all expenses?")) return;
  expenses = [];
  save();
  render();
  showToast("All expenses cleared");
});

searchInput.addEventListener("input", render);
filterCategory.addEventListener("change", render);

document.getElementById("exportCsv").addEventListener("click", () => {
  if (!expenses.length) return showToast("Add an expense before exporting");
  const rows = [["Expense Title","Amount","Category","Date"]];
  expenses.forEach(e => rows.push([e.title, e.amount, e.category, new Date(e.createdAt).toLocaleDateString()]));
  const csv = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expense-tracker.csv";
  a.click();
  URL.revokeObjectURL(url);
  showToast("CSV exported");
});

const themeKey = "expense-theme";
if (localStorage.getItem(themeKey) === "dark") document.body.classList.add("dark");
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem(themeKey, document.body.classList.contains("dark") ? "dark" : "light");
});

render();
