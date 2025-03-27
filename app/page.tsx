"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Check,
  Plus,
  Trash2,
  Moon,
  Sun,
  Calendar,
  Search,
  LogIn,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { Label } from "@radix-ui/react-label";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// 更新Todo接口以匹配Supabase数据库表结构
interface Todo {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string | null;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const { theme, setTheme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 提供用户反馈
  const showFeedback = (
    message: string,
    type: "success" | "error" | "info" = "info"
  ) => {
    setActionFeedback({ message, type });
    // 3秒后自动清除
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
  };

  // 检查用户登录状态并加载待办事项
  useEffect(() => {
    const checkUserAndLoadTodos = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        setUser(data.user);

        if (data.user) {
          const { data: todos, error } = await supabase
            .from("todos")
            .select("*")
            .order("created_at", { ascending: false });

          if (error) {
            console.error("加载待办事项失败:", error.message);
            showFeedback("加载待办事项失败", "error");
          } else {
            console.log("成功加载待办事项:", todos?.length || 0);
            setTodos(todos || []);
          }
        }
      } catch (err) {
        console.error("加载待办事项时出错:", err);
        showFeedback("加载数据时发生错误", "error");
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndLoadTodos();
  }, []);

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // 检查文件类型
      if (!file.type.startsWith("image/")) {
        showFeedback("请选择图片文件", "error");
        return;
      }

      // 设置选中的图片
      setSelectedImage(file);

      // 创建预览URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // 需要在组件卸载时清理这个URL
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  // 清除选中的图片
  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 上传图片到Supabase存储
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      setIsUploading(true);
      const supabase = createClient();

      // 生成唯一的文件名
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 上传文件到my-todo bucket
      const { data, error } = await supabase.storage
        .from("my-todo")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // 获取公共URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("my-todo").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("上传图片失败:", error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 添加待办事项
  const addTodo = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTodo.trim()) return;

      // 如果用户未登录，重定向到登录页面
      if (!user) {
        console.log("用户未登录，跳转到登录页面");
        router.push("/sign-in");
        return;
      }

      setIsSubmitting(true);

      try {
        // 上传图片（如果有）
        let imageUrl = null;
        if (selectedImage) {
          imageUrl = await uploadImage(selectedImage);
          if (!imageUrl) {
            showFeedback("图片上传失败", "error");
            setIsSubmitting(false);
            return;
          }
        }

        const supabase = createClient();
        const { data, error } = await supabase
          .from("todos")
          .insert([
            {
              text: newTodo.trim(),
              user_id: user.id,
              completed: false,
              image_url: imageUrl,
            },
          ])
          .select();

        if (error) {
          console.error("添加待办事项失败:", error.message);
          showFeedback("添加待办事项失败", "error");
        } else if (data && data.length > 0) {
          console.log("成功添加新待办事项:", data[0].text);
          setTodos((prev) => [data[0], ...prev]);
          setNewTodo("");
          // 清除已选择的图片
          clearSelectedImage();
          showFeedback("成功添加新待办事项", "success");
        }
      } catch (err) {
        console.error("添加待办事项时出错:", err);
        showFeedback("添加待办事项时发生错误", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [newTodo, user, router, selectedImage]
  );

  // 切换待办事项状态
  const toggleTodo = async (id: string) => {
    const todoToUpdate = todos.find((todo) => todo.id === id);
    if (!todoToUpdate) return;

    const newStatus = !todoToUpdate.completed;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("todos")
        .update({ completed: newStatus })
        .eq("id", id);

      if (error) {
        console.error("更新待办事项状态失败:", error.message);
        showFeedback("更新状态失败", "error");
      } else {
        console.log(
          `待办事项 "${todoToUpdate.text}" 已${newStatus ? "完成" : "恢复未完成"}`
        );
        setTodos(
          todos.map((todo) =>
            todo.id === id ? { ...todo, completed: newStatus } : todo
          )
        );
        showFeedback(`已${newStatus ? "完成" : "取消完成"}任务`, "success");
      }
    } catch (err) {
      console.error("更新待办事项状态时出错:", err);
      showFeedback("更新状态时发生错误", "error");
    }
  };

  // 删除待办事项
  const deleteTodo = async (id: string) => {
    const todoToDelete = todos.find((todo) => todo.id === id);
    if (!todoToDelete) return;

    // 先在UI上直接移除，以提供即时反馈
    setTodos(todos.filter((todo) => todo.id !== id));

    try {
      const supabase = createClient();
      const { error } = await supabase.from("todos").delete().eq("id", id);

      if (error) {
        console.error("删除待办事项失败:", error.message);
        showFeedback("删除失败，请重试", "error");
        // 回滚UI
        setTodos((prev) =>
          [...prev, todoToDelete].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
      } else {
        console.log(`待办事项 "${todoToDelete.text}" 已删除`);
        showFeedback("任务已删除", "info");
      }
    } catch (err) {
      console.error("删除待办事项时出错:", err);
      showFeedback("删除时发生错误", "error");
      // 回滚UI
      setTodos((prev) =>
        [...prev, todoToDelete].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    }
  };

  // 清除已完成待办事项
  const clearCompleted = async () => {
    const completedTodos = todos.filter((todo) => todo.completed);
    if (completedTodos.length === 0) return;

    // 先在UI上更新
    setTodos(todos.filter((todo) => !todo.completed));

    try {
      const completedIds = completedTodos.map((todo) => todo.id);

      const supabase = createClient();
      const { error } = await supabase
        .from("todos")
        .delete()
        .in("id", completedIds);

      if (error) {
        console.error("清除已完成待办事项失败:", error.message);
        showFeedback("清除已完成任务失败", "error");
        // 回滚UI
        setTodos((prev) =>
          [...prev, ...completedTodos].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
      } else {
        console.log(`已清除 ${completedIds.length} 个已完成的待办事项`);
        showFeedback(`已清除 ${completedIds.length} 个已完成任务`, "success");
      }
    } catch (err) {
      console.error("清除已完成待办事项时出错:", err);
      showFeedback("清除时发生错误", "error");
      // 回滚UI
      const completedTodos = todos.filter((todo) => todo.completed);
      setTodos((prev) =>
        [...prev, ...completedTodos].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    }
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
          <div className="flex items-center gap-4">
            {user ? (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                欢迎, {user.email}
              </span>
            ) : (
              <Button asChild variant="outline" className="rounded-full">
                <Link href="/sign-in" className="flex items-center gap-2">
                  <LogIn size={16} />
                  登录
                </Link>
              </Button>
            )}
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

        {/* 操作反馈提示 */}
        {actionFeedback && (
          <div
            className={cn(
              "fixed top-4 right-4 p-3 rounded-lg shadow-lg max-w-xs z-50 flex items-center gap-2",
              actionFeedback.type === "success"
                ? "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
                : actionFeedback.type === "error"
                  ? "bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100"
                  : "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100"
            )}
          >
            {actionFeedback.type === "error" && <AlertCircle size={18} />}
            <span>{actionFeedback.message}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <LoadingSpinner size={48} />
          <span className="ml-2 text-xl text-gray-600 dark:text-gray-300">
            加载中...
          </span>
        </div>
      ) : (
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

              <form onSubmit={addTodo} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="添加新任务..."
                    className="flex-1 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    disabled={isSubmitting || isUploading || !user}
                  />
                  <Button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white transition-colors flex items-center gap-2"
                    disabled={
                      isSubmitting || isUploading || !user || !newTodo.trim()
                    }
                  >
                    {isSubmitting || isUploading ? (
                      <LoadingSpinner size={18} />
                    ) : (
                      <Plus size={18} />
                    )}
                    添加
                  </Button>
                </div>

                {/* 图片上传区域 */}
                <div className="mt-2">
                  <div className="flex items-center">
                    <label htmlFor="todo-image" className="cursor-pointer">
                      <div className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          ></rect>
                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                          <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                        <span>添加图片附件</span>
                      </div>
                    </label>
                    <input
                      id="todo-image"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isSubmitting || isUploading || !user}
                    />
                  </div>

                  {/* 图片预览 */}
                  {previewUrl && (
                    <div className="mt-3 relative inline-block">
                      <img
                        src={previewUrl}
                        alt="图片预览"
                        className="max-h-40 max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        type="button"
                        onClick={clearSelectedImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        disabled={isSubmitting || isUploading}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {!user && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    请先登录后添加任务
                  </p>
                )}
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
                    {!user ? (
                      <span>登录后开始制定您的任务清单</span>
                    ) : filter === "all" ? (
                      "开始计划点什么吧！"
                    ) : filter === "active" ? (
                      "恭喜！没有待完成的任务"
                    ) : (
                      "还没有完成任何任务"
                    )}
                  </p>
                  {!user ? (
                    <Button
                      variant="link"
                      asChild
                      className="mt-2 flex items-center gap-2"
                    >
                      <Link href="/sign-in">
                        <LogIn size={16} />
                        立即登录
                      </Link>
                    </Button>
                  ) : filter !== "all" ? (
                    <Button
                      variant="link"
                      onClick={() => setFilter("all")}
                      className="mt-2"
                    >
                      查看全部任务
                    </Button>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className={cn(
                        "flex flex-col gap-4 p-4 rounded-xl transition-all border border-transparent",
                        "bg-gray-50 dark:bg-gray-700/50",
                        "hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md",
                        todo.completed && "bg-gray-50/50 dark:bg-gray-800/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors",
                            todo.completed
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "border-gray-300 dark:border-gray-600 hover:border-blue-400"
                          )}
                          disabled={!user}
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
                            创建于: {new Date(todo.created_at).toLocaleString()}
                          </span>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteTodo(todo.id)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                          disabled={!user}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>

                      {/* 显示任务附带的图片 */}
                      {todo.image_url && (
                        <div className="mt-2 max-w-md">
                          <a
                            href={todo.image_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={todo.image_url}
                              alt="任务附件"
                              className="w-full max-h-56 object-contain rounded-lg border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity"
                              loading="lazy"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer className="container max-w-6xl mx-auto mt-12 py-6 text-center text-gray-500 dark:text-gray-400">
        <p>© {new Date().getFullYear()} 高级任务管理系统 | 高端大气上档次</p>
      </footer>
    </main>
  );
}
