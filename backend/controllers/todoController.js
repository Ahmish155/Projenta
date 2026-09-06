import Todo from "../models/Todo.js";

// @desc  Get my personal to-do list
// @route GET /api/todos
export const getTodos = async (req, res) => {
  const todos = await Todo.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json({ todos });
};

// @desc  Add a personal to-do item
// @route POST /api/todos
export const createTodo = async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Text is required" });
  const todo = await Todo.create({ user: req.user._id, text });
  res.status(201).json({ todo });
};

// @desc  Toggle / edit a personal to-do item
// @route PATCH /api/todos/:id
export const updateTodo = async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
  if (!todo) return res.status(404).json({ message: "Not found" });
  const { text, done } = req.body;
  if (text !== undefined) todo.text = text;
  if (done !== undefined) todo.done = done;
  await todo.save();
  res.json({ todo });
};

// @desc  Delete a personal to-do item
// @route DELETE /api/todos/:id
export const deleteTodo = async (req, res) => {
  const todo = await Todo.findOne({ _id: req.params.id, user: req.user._id });
  if (!todo) return res.status(404).json({ message: "Not found" });
  await todo.deleteOne();
  res.json({ message: "Deleted" });
};
