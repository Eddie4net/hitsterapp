import type { Message } from "./types";

export type Transport = {
  /** "supabase": echt over internet. "local": alleen tussen tabbladen in deze browser (testmodus). */
  kind: "supabase" | "local";
  send: (message: Message) => void;
  subscribe: (callback: (message: Message) => void) => () => void;
  close: () => void;
};

const CONNECT_TIMEOUT_MS = 8000;

function createLocalTransport(code: string): Transport {
  const channel = new BroadcastChannel(`hitster:${code}`);
  return {
    kind: "local",
    send: (message) => channel.postMessage(message),
    subscribe: (callback) => {
      const handler = (e: MessageEvent<Message>) => callback(e.data);
      channel.addEventListener("message", handler);
      return () => channel.removeEventListener("message", handler);
    },
    close: () => channel.close(),
  };
}

async function createSupabaseTransport(
  code: string,
  url: string,
  key: string,
): Promise<Transport> {
  // Pas laden als je echt gaat hosten of meedoen, zodat de rest van de app klein blijft.
  const { createClient } = await import("@supabase/supabase-js");
  const client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 20 } },
  });
  const channel = client.channel(`hitster:${code}`, {
    config: { broadcast: { self: false } },
  });
  const listeners = new Set<(message: Message) => void>();
  channel.on("broadcast", { event: "msg" }, ({ payload }) => {
    for (const listener of listeners) listener(payload as Message);
  });

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Verbinden duurde te lang.")),
      CONNECT_TIMEOUT_MS,
    );
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        clearTimeout(timer);
        resolve();
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        clearTimeout(timer);
        reject(new Error("Kon niet verbinden met de spelserver."));
      }
    });
  });

  return {
    kind: "supabase",
    send: (message) => {
      void channel.send({ type: "broadcast", event: "msg", payload: message });
    },
    subscribe: (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    close: () => {
      void client.removeChannel(channel);
    },
  };
}

/** Is er een Supabase-project ingesteld (via .env.local)? */
export function hasRealtimeServer(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export async function createTransport(code: string): Promise<Transport> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key) return createSupabaseTransport(code, url, key);
  return createLocalTransport(code);
}
