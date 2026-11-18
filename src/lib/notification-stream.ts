import type { ChangeStream } from "mongodb";
import type { SessionReason } from "@/lib/session-policy";

type StreamOptions = {
  changes: Pick<ChangeStream, "next" | "close">;
  signal: AbortSignal;
  checkSession: () => Promise<SessionReason | null>;
  heartbeatMs?: number;
  lifetimeMs?: number;
};

export function notificationStream({
  changes,
  signal,
  checkSession,
  heartbeatMs = 20_000,
  lifetimeMs = 55_000,
}: StreamOptions) {
  const encoder = new TextEncoder();
  let stop = () => {};
  return new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let checking = false;
      let pending = false;
      const heartbeat = setInterval(() => void refresh(false), heartbeatMs);
      const lifetime = setTimeout(() => stop(), lifetimeMs);
      stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        signal.removeEventListener("abort", stop);
        void changes.close().catch(() => {});
        try {
          controller.close();
        } catch {
          //
        }
      };
      const send = (frame: string) => {
        if (closed) return;
        if ((controller.desiredSize ?? 0) <= 0) {
          stop();
          return;
        }
        controller.enqueue(encoder.encode(frame));
      };
      const refresh = async (notify: boolean) => {
        pending ||= notify;
        if (checking || closed) return;
        checking = true;
        try {
          do {
            const shouldNotify = pending;
            pending = false;
            const reason = await checkSession();
            if (closed) return;
            if (reason) {
              send(
                `event: session-invalid\ndata: ${JSON.stringify({ reason })}\n\n`,
              );
              stop();
              return;
            }
            send(
              shouldNotify
                ? "event: notifications\ndata: {}\n\n"
                : ": heartbeat\n\n",
            );
          } while (pending && !closed);
        } catch {
          //
          stop();
        } finally {
          checking = false;
        }
      };
      signal.addEventListener("abort", stop, { once: true });
      if (signal.aborted) {
        stop();
        return;
      }
      send("retry: 2000\nevent: ready\ndata: {}\n\n");
      void (async () => {
        try {
          while (!closed) {
            await changes.next();
            if (!closed) await refresh(true);
          }
        } catch {
          stop();
        }
      })();
    },
    cancel() {
      stop();
    },
  });
}
