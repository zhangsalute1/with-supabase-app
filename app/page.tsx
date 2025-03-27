"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2, Moon, Sun, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Label } from "@radix-ui/react-label";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const { theme, setTheme } = useTheme();

  // 从本地存储加载待办事项
  useEffect(() => {
    const savedTodos = localStorage.getItem("todos");
    if (savedTodos) {
      setTodos(JSON.parse(savedTodos));
    }
  }, []);

  // 保存待办事项到本地存储
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    setTodos([
      ...todos,
      {
        id: Date.now().toString(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    setNewTodo("");
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const clearCompleted = () => {
    setTodos(todos.filter((todo) => !todo.completed));
  };

  // 根据过滤条件筛选待办事项
  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <main className="min-h-screen bg-gradient-to-b  p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-500" />
            待办清单
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>

        <form onSubmit={addTodo} className="p-6">
          <div className="flex gap-2">
            <Input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="添加新任务..."
              className="flex-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              添加
            </Button>
          </div>
        </form>

        <div className="px-6 pb-2">
          <div className="flex space-x-2 pb-4">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
              className="rounded-full"
            >
              全部 ({todos.length})
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
              className="rounded-full"
            >
              进行中 ({activeCount})
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
              className="rounded-full"
            >
              已完成 ({completedCount})
            </Button>
          </div>
        </div>

        <div className="px-6 pb-6">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {filter === "all"
                ? "没有待办事项"
                : filter === "active"
                  ? "没有进行中的任务"
                  : "没有已完成的任务"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg transition-all",
                    "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700",
                    todo.completed && "bg-gray-50/50 dark:bg-gray-800/30"
                  )}
                >
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      "h-5 w-5 rounded-full flex items-center justify-center border transition-colors",
                      todo.completed
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                    )}
                  >
                    {todo.completed && <Check size={14} />}
                  </button>

                  <div className="flex-1 flex flex-col">
                    <span
                      className={cn(
                        "text-gray-700 dark:text-gray-200 transition-all",
                        todo.completed &&
                          "line-through text-gray-400 dark:text-gray-500"
                      )}
                    >
                      {todo.text}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(todo.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {completedCount > 0 && (
            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompleted}
                className="text-gray-500 hover:text-red-500 transition-colors"
              >
                清除已完成任务
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
