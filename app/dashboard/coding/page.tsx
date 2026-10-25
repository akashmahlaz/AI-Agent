"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Check,
  GitBranch,
  Key,
  ExternalLink,
  Loader2,
  LogOut,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { operonFetch, operonToken, OPERON_API_URL } from "@/lib/operon-api";

interface GithubStatus {
  connected: boolean;
  login?: string | null;
  accountId?: string | null;
}

function CodingPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GithubStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [validatingToken, setValidatingToken] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (searchParams.get("connected") === "github") {
      toast.success("GitHub connected successfully");
    } else if (searchParams.get("error")) {
      toast.error(`GitHub connection failed: ${searchParams.get("error")}`);
    }
  }, [searchParams]);

  const loadStatus = async () => {
    try {
      const res = await operonFetch("/integrations/github/status");
      if (!res.ok) throw new Error("status failed");
      const data = (await res.json()) as GithubStatus;
      setStatus(data);
    } catch {
      setStatus({ connected: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  function connectGithubOAuth() {
    const token = operonToken();
    if (!token) {
      toast.error("Sign in required");
      return;
    }
    window.location.href = `${OPERON_API_URL}/auth/oauth/github?token=${encodeURIComponent(token)}`;
  }

  async function handleConnectToken(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      toast.error("Please enter a GitHub token");
      return;
    }

    setValidatingToken(true);
    try {
      const res = await operonFetch("/integrations/github/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || "Token verification failed");
      }

      toast.success(
        data.login
          ? `Connected to GitHub as @${data.login}`
          : "GitHub token connected successfully"
      );
      setStatus({
        connected: true,
        login: data.login,
        accountId: data.accountId,
      });
      setTokenInput("");
      setConnectModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect token";
      toast.error(message);
    } finally {
      setValidatingToken(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm("Are you sure you want to disconnect GitHub?")) return;
    setDisconnecting(true);
    try {
      const res = await operonFetch("/integrations/github/disconnect", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      setStatus({ connected: false });
      toast.success("GitHub disconnected");
    } catch {
      toast.error("Failed to disconnect GitHub");
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold">Connectors & Integrations</h1>
          <p className="text-xs text-muted-foreground">
            Connect developer platforms and repository tools for your AI coding agents.
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* GitHub Connector Card */}
            <div className="flex min-h-56 flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80">
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <GitBranch className="size-5" />
                  </div>
                  {status?.connected ? (
                    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Check className="mr-1 size-3" /> Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Not connected
                    </Badge>
                  )}
                </div>
                <h3 className="text-sm font-semibold">GitHub</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Connect your GitHub account so the coding agent can inspect repositories, search code, create branches, and open pull requests.
                </p>

                {status?.connected && status.login && (
                  <div className="mt-3 flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-emerald-500" />
                    <span>Authorized as <strong className="font-medium text-foreground">@{status.login}</strong></span>
                  </div>
                )}
              </div>

              <div className="mt-5 border-t border-border/40 pt-4">
                {status?.connected ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                      onClick={() => setConnectModalOpen(true)}
                    >
                      Update Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      disabled={disconnecting}
                      onClick={handleDisconnect}
                    >
                      {disconnecting ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <LogOut className="size-3.5" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    disabled={loading}
                    onClick={() => setConnectModalOpen(true)}
                    className="w-full text-xs"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Checking…
                      </>
                    ) : (
                      "Connect GitHub"
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Dialog with PAT & OAuth Options */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <GitBranch className="size-4" />
              </div>
              <DialogTitle className="text-base font-semibold">Connect GitHub</DialogTitle>
            </div>
            <DialogDescription className="text-xs">
              Authorize Operon to interact with your GitHub repositories. Choose either a Personal Access Token or OAuth.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="token" className="w-full pt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="token" className="text-xs">
                <Key className="mr-1.5 size-3.5" /> Personal Access Token
              </TabsTrigger>
              <TabsTrigger value="oauth" className="text-xs">
                <ExternalLink className="mr-1.5 size-3.5" /> OAuth App
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Personal Access Token (PAT) */}
            <TabsContent value="token" className="space-y-4 pt-3">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Recommended for local development & full control:</p>
                <p className="mt-1">
                  Create a token with <code className="rounded bg-muted px-1 py-0.5 text-foreground font-mono text-[11px]">repo</code>,{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground font-mono text-[11px]">read:user</code>, and{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground font-mono text-[11px]">user:email</code> scopes.
                </p>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo,read:user,user:email&description=Operon%20AI%20Agent"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  Generate Token with Pre-configured Scopes on GitHub <ExternalLink className="size-3" />
                </a>
              </div>

              <form onSubmit={handleConnectToken} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    GitHub Personal Access Token (Classic or Fine-grained)
                  </label>
                  <div className="relative">
                    <Input
                      type={showToken ? "text" : "password"}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="ghp_... or github_pat_..."
                      className="pr-10 font-mono text-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showToken ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setConnectModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={validatingToken || !tokenInput.trim()}
                    className="text-xs"
                  >
                    {validatingToken ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Verifying with GitHub…
                      </>
                    ) : (
                      "Connect Token"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* TAB 2: OAuth Flow */}
            <TabsContent value="oauth" className="space-y-4 pt-3">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div>
                    <p className="font-medium">OAuth App Configuration Notice</p>
                    <p className="mt-0.5 leading-relaxed text-[11px] opacity-90">
                      If GitHub shows a <em>&quot;redirect_uri mismatch&quot;</em> error, ensure your GitHub OAuth App has its Authorization callback URL set to:
                    </p>
                    <code className="mt-1 block rounded bg-black/10 px-2 py-1 font-mono text-[11px] dark:bg-black/30">
                      http://127.0.0.1:8080/auth/oauth/github/callback
                    </code>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setConnectModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={connectGithubOAuth}
                  className="text-xs"
                >
                  <ExternalLink className="mr-1.5 size-3.5" /> Authorize via GitHub OAuth
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CodingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center text-muted-foreground">
          <Loader2 className="mr-2 size-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      }
    >
      <CodingPageInner />
    </Suspense>
  );
}

