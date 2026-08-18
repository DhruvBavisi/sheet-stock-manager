import { createFileRoute } from "@tanstack/react-router";

import { type AppendRowPayload, type SyncEndpoint } from "@/lib/stocklog";

type SyncRequestBody = {
  endpoints?: SyncEndpoint[];
  payload?: AppendRowPayload;
};

async function retry<T>(task: () => Promise<T>, attempts = 2) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    }
  }

  throw lastError;
}

async function sendToEndpoint(endpoint: SyncEndpoint, payload: AppendRowPayload) {
  const res = await fetch(endpoint.url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      sheetId: endpoint.sheetId.trim(),
      sheetName: payload.sheetName,
      date: payload.date,
      material: payload.material,
      qty40: payload.qty40 ?? "",
      qty25: payload.qty25 ?? "",
      qty20: payload.qty20 ?? "",
      qty1No: payload.qty1No ?? "",
      qty2No: payload.qty2No ?? "",
      qty3No: payload.qty3No ?? "",
      qty4No: payload.qty4No ?? "",
    }),
    redirect: "follow",
  });

  const text = await res.text();
  let data: { ok?: boolean; error?: string } = {};

  try {
    data = JSON.parse(text);
  } catch {
    const snippet = text.slice(0, 180).replace(/\s+/g, " ");
    throw new Error(
      `Unexpected response from Apps Script (${res.status}). Check deployment access and authorization. ${snippet}`,
    );
  }

  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export const Route = createFileRoute("/api/sheets")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as SyncRequestBody;
        const endpoints = body.endpoints ?? [];
        const payload = body.payload;

        if (endpoints.length === 0) {
          return Response.json({ ok: false, error: "No Google Sheet endpoints configured" }, { status: 400 });
        }

        if (!payload) {
          return Response.json({ ok: false, error: "Missing append payload" }, { status: 400 });
        }

        const results = await Promise.allSettled(
          endpoints.map((endpoint) => retry(() => sendToEndpoint(endpoint, payload))),
        );

        let successCount = 0;
        const errors: string[] = [];

        results.forEach((res, idx) => {
          const epName = endpoints[idx]?.name ?? `Endpoint ${idx + 1}`;
          if (res.status === "fulfilled") {
            successCount++;
          } else {
            errors.push(`${epName}: ${res.reason?.message || "Failed"}`);
          }
        });

        if (successCount !== endpoints.length) {
          return Response.json(
            {
              ok: false,
              error:
                successCount === 0
                  ? `Failed to sync to any Google Sheet. ${errors.join("; ")}`
                  : `Partial sync only: appended to ${successCount} of ${endpoints.length} Google Sheets. ${errors.join("; ")}`,
              syncedCount: successCount,
              totalEndpoints: endpoints.length,
              errors,
            },
            { status: 502 },
          );
        }

        return Response.json({
          ok: true,
          syncedCount: successCount,
          totalEndpoints: endpoints.length,
          errors,
        });
      },
    },
  },
});