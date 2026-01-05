import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

type IpLogRow = {
  id: string;
  ip: string;
  event_type: string;
  created_at: string;
};

const PAGE_SIZE = 50;

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function UserIpDialog({
  userId,
  userName,
  children,
}: {
  userId: string;
  userName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<IpLogRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const cursor = useMemo(() => rows[rows.length - 1]?.created_at ?? null, [rows]);

  const fetchPage = useCallback(
    async (mode: "initial" | "more") => {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        let q = supabase
          .from("user_ip_logs")
          .select("id, ip, event_type, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE);

        if (mode === "more" && cursor) {
          q = q.lt("created_at", cursor);
        }

        const { data, error } = await q;
        if (error) throw error;

        const page = (data || []) as IpLogRow[];

        setRows((prev) => (mode === "initial" ? page : [...prev, ...page]));
        setHasMore(page.length === PAGE_SIZE);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [cursor, userId]
  );

  useEffect(() => {
    if (!open) return;
    setRows([]);
    setHasMore(true);
    fetchPage("initial");
  }, [open, fetchPage]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>IP 记录 · {userName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-10 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            暂无记录（登录后会自动记录）
          </div>
        ) : (
          <>
            <ScrollArea className="h-[360px] pr-3">
              <div className="space-y-2">
                {rows.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-md border border-border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm truncate">{r.ip}</div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        {formatDateTime(r.created_at)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      类型：{r.event_type}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="pt-3 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {hasMore ? "可继续加载更早记录" : "已显示全部"}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasMore || isLoadingMore}
                onClick={() => fetchPage("more")}
              >
                {isLoadingMore ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "加载更多"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
