import React, { useEffect, useState } from "react";
import { Plus, Trash2, CheckSquare, Square, ListTodo } from "lucide-react";
import api from "../api/axios.js";

const TodoWidget = () => {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    const res = await api.get("/todos");
    setTodos(res.data.todos);
  };

  useEffect(() => {
    fetchTodos().finally(() => setLoading(false));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post("/todos", { text });
    setText("");
    fetchTodos();
  };

  const toggle = async (todo) => {
    await api.patch(`/todos/${todo._id}`, { done: !todo.done });
    fetchTodos();
  };

  const remove = async (id) => {
    await api.delete(`/todos/${id}`);
    fetchTodos();
  };

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ListTodo size={16} className="text-muted" />
        <h3 className="font-display font-semibold text-sm text-cream">My personal to-do list</h3>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          className="input !py-2 text-sm"
          placeholder="Add a personal task..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="btn-secondary !px-3 !py-2">
          <Plus size={16} />
        </button>
      </form>

      {loading ? (
        <p className="text-xs text-muted">Loading...</p>
      ) : todos.length === 0 ? (
        <p className="text-xs text-muted">Nothing here yet — jot down a personal reminder.</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {todos.map((t) => (
            <div key={t._id} className="flex items-center gap-2.5 group py-1.5">
              <button onClick={() => toggle(t)} className="text-muted hover:text-cream flex-shrink-0">
                {t.done ? <CheckSquare size={16} className="text-accent-green" /> : <Square size={16} />}
              </button>
              <span className={`text-sm flex-1 ${t.done ? "line-through text-muted" : "text-cream/90"}`}>
                {t.text}
              </span>
              <button
                onClick={() => remove(t._id)}
                className="text-muted hover:text-accent-red opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodoWidget;
