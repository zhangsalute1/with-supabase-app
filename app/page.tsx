"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Trash2, Moon, Sun, Calendar, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);

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

  // 根据过滤条件和搜索关键词筛选待办事项
  const filteredTodos = todos.filter((todo) => {
    // 先按照完成状态筛选
    const statusMatch =
      filter === "all"
        ? true
        : filter === "active"
          ? !todo.completed
          : todo.completed;

    // 再按照搜索关键词筛选
    const searchMatch =
      searchTerm.trim() === ""
        ? true
        : todo.text.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const completedCount = todos.filter((todo) => todo.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 dark:from-gray-900 dark:via-indigo-950 dark:to-gray-900 p-4 md:p-6 lg:p-8 transition-colors duration-300">
      {/* 页面标题区域 */}
      <div className="container max-w-6xl mx-auto mb-8">
        <div className="flex justify-between items-center py-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              任务管理系统
            </span>
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full h-10 w-10 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧面板 */}
        <div className="lg:col-span-1">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="h-6 w-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                状态分类
              </h2>
            </div>

            <div className="space-y-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("all")}
                className="w-full justify-start text-left mb-2"
              >
                全部任务
                <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {todos.length}
                </span>
              </Button>

              <Button
                variant={filter === "active" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("active")}
                className="w-full justify-start text-left mb-2"
              >
                进行中
                <span className="ml-auto bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {activeCount}
                </span>
              </Button>

              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="lg"
                onClick={() => setFilter("completed")}
                className="w-full justify-start text-left"
              >
                已完成
                <span className="ml-auto bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
                  {completedCount}
                </span>
              </Button>
            </div>

            {completedCount > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  className="w-full text-gray-600 hover:text-red-500 dark:text-gray-300 dark:hover:text-red-400 transition-colors"
                  onClick={clearCompleted}
                >
                  <Trash2 size={16} className="mr-2" />
                  清除已完成任务
                </Button>
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
              任务统计
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    完成进度
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {todos.length > 0
                      ? Math.round((completedCount / todos.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width:
                        todos.length > 0
                          ? `${(completedCount / todos.length) * 100}%`
                          : "0%",
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {todos.length}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    总任务
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-xl">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {completedCount}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    已完成
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧主面板 */}
        <div className="lg:col-span-3 space-y-6">
          {/* 搜索和添加任务区域 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                管理你的任务
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className="rounded-full"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>

            {showSearch && (
              <div className="mb-4">
                <Input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索任务..."
                  className="focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            )}

            <form onSubmit={addTodo}>
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
          </div>

          {/* 任务列表区域 */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 min-h-[500px]">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6 flex items-center">
              {filter === "all"
                ? "全部任务"
                : filter === "active"
                  ? "进行中任务"
                  : "已完成任务"}
              <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {filteredTodos.length}
              </span>
            </h2>

            {filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <svg
                  className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-lg font-medium">
                  {filter === "all"
                    ? "没有任务，休息一下吧！"
                    : filter === "active"
                      ? "恭喜！没有待完成的任务"
                      : "还没有完成任何任务"}
                </p>
                {filter !== "all" && (
                  <Button
                    variant="link"
                    onClick={() => setFilter("all")}
                    className="mt-2"
                  >
                    查看全部任务
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl transition-all border border-transparent",
                      "bg-gray-50 dark:bg-gray-700/50",
                      "hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md",
                      todo.completed && "bg-gray-50/50 dark:bg-gray-800/30"
                    )}
                  >
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors",
                        todo.completed
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                      )}
                    >
                      {todo.completed && <Check size={16} />}
                    </button>

                    <div className="flex-1 flex flex-col">
                      <span
                        className={cn(
                          "text-base font-medium text-gray-800 dark:text-gray-200 transition-all",
                          todo.completed &&
                            "line-through text-gray-400 dark:text-gray-500"
                        )}
                      >
                        {todo.text}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        创建于: {new Date(todo.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteTodo(todo.id)}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 页脚 */}
      <footer className="container max-w-6xl mx-auto mt-12 py-6 text-center text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} 高级任务管理系统 | 高端大气上档次</p>
      </footer>
    </main>
  );
}
