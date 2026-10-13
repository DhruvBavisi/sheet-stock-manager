import { createFileRoute } from "@tanstack/react-router";

import { normalizeAppendRowPayload, type AppendRowPayload, type SyncEndpoint } from "@/lib/stocklog";

type SyncRequestBody = {
  action?: "append" | "delete";
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

async function sendToEndpoint(endpoint: SyncEndpoint, payload: AppendRowPayload, action: "append" | "delete") {
  const cleanPayload = normalizeAppendRowPayload(payload);
  const legacyQuantity = cleanPayload.sheetName === "Sieving"
    ? cleanPayload.qty1No ?? ""
    : cleanPayload.sheetName === "Logistics"
      ? ""
      : cleanPayload.qty40 ?? "";
  const res = await fetch(endpoint.url, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action,
      sheetId: endpoint.sheetId.trim(),
      entryId: cleanPayload.entryId ?? "",
      sheetName: cleanPayload.sheetName,
      product: cleanPayload.material,
      quantity: legacyQuantity,
      formattedQuantity: legacyQuantity,
      vehicleNumber: cleanPayload.vehicleNo ?? "",
      transporterName: cleanPayload.transporter ?? "",
      movementType: cleanPayload.movement ?? "",
      entryTime: cleanPayload.inTime ?? "",
      exitTime: cleanPayload.outTime ?? "",
      date: cleanPayload.date,
      dayNight: cleanPayload.dayNight ?? "",
      material: cleanPayload.material,
      qty40: cleanPayload.qty40 ?? "",
      qty25: cleanPayload.qty25 ?? "",
      qty20: cleanPayload.qty20 ?? "",
      qty1No: cleanPayload.qty1No ?? "",
      qty2No: cleanPayload.qty2No ?? "",
      qty3No: cleanPayload.qty3No ?? "",
      qty4No: cleanPayload.qty4No ?? "",
      vehicleNo: cleanPayload.vehicleNo ?? "",
      transporter: cleanPayload.transporter ?? "",
      movement: cleanPayload.movement ?? "",
      inTime: cleanPayload.inTime ?? "",
      outTime: cleanPayload.outTime ?? "",
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
        const action = body.action ?? "append";
        const endpoints = body.endpoints ?? [];
        const payload = body.payload ? normalizeAppendRowPayload(body.payload) : undefined;

        if (endpoints.length === 0) {
          return Response.json({ ok: false, error: "No Google Sheet endpoints configured" }, { status: 400 });
        }

        if (!payload) {
          return Response.json({ ok: false, error: "Missing append payload" }, { status: 400 });
        }

        const results = await Promise.allSettled(
          endpoints.map((endpoint) => retry(() => sendToEndpoint(endpoint, payload, action))),
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
                    : `Partial ${action} only: completed on ${successCount} of ${endpoints.length} Google Sheets. ${errors.join("; ")}`,
              syncedCount: successCount,
                  deletedCount: action === "delete" ? successCount : undefined,
              totalEndpoints: endpoints.length,
              errors,
            },
            { status: 502 },
          );
        }

        return Response.json({
          ok: true,
          syncedCount: successCount,
          deletedCount: action === "delete" ? successCount : undefined,
          totalEndpoints: endpoints.length,
          errors,
        });
      },
    },
  },
});