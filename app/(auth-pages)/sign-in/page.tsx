import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <form className="flex-1 flex flex-col min-w-64">
      <h1 className="text-2xl font-medium">登录</h1>
      <p className="text-sm text-foreground">
        还没有账号？{" "}
        <Link className="text-foreground font-medium underline" href="/sign-up">
          立即注册
        </Link>
      </p>
      <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
        <Label htmlFor="email">邮箱</Label>
        <Input name="email" placeholder="你的邮箱地址" required />
        <div className="flex justify-between items-center">
          <Label htmlFor="password">密码</Label>
          <Link
            className="text-xs text-foreground underline"
            href="/forgot-password"
          >
            忘记密码？
          </Link>
        </div>
        <Input
          type="password"
          name="password"
          placeholder="你的密码"
          required
        />
        <SubmitButton pendingText="登录中..." formAction={signInAction}>
          登录
        </SubmitButton>
        <FormMessage message={searchParams} />
      </div>
    </form>
  );
}
