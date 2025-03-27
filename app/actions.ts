"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect("error", "/sign-up", "邮箱和密码不能为空");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", translateError(error.message));
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "注册成功！请检查您的邮箱并点击验证链接完成注册。"
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", translateError(error.message));
  }

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "请输入邮箱地址");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "密码重置失败，请稍后再试"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "已发送重置密码链接到您的邮箱，请查收"
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "密码和确认密码不能为空"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "两次输入的密码不一致"
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "密码更新失败，请稍后再试"
    );
  }

  encodedRedirect("success", "/protected/reset-password", "密码已更新成功");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

// 翻译Supabase常见错误信息
function translateError(errorMessage: string): string {
  const errorMap: Record<string, string> = {
    "Invalid login credentials": "登录凭证无效，请检查邮箱和密码",
    "Email not confirmed": "邮箱未验证，请先验证您的邮箱",
    "User already registered": "该邮箱已被注册",
    "Password should be at least 6 characters": "密码长度至少为6个字符",
    "For security purposes, you can only request this once every 60 seconds":
      "出于安全考虑，60秒内只能请求一次",
    "Email link is invalid or has expired": "邮件链接无效或已过期",
  };

  return errorMap[errorMessage] || errorMessage;
}
