import { auth } from "@/auth";

export async function POST(request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = request.headers.get("content-type") || "";

  let uploadResponse;

  if (contentType.includes("multipart/form-data")) {
    // FormData file upload — extract the buffer and forward as octet-stream
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }
    const buffer = await file.arrayBuffer();
    uploadResponse = await fetch("https://api.createanything.com/v0/upload", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: buffer,
    });
  } else if (contentType.includes("application/json")) {
    // JSON body (url or base64)
    const body = await request.text();
    uploadResponse = await fetch("https://api.createanything.com/v0/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } else {
    // Raw binary buffer
    const buffer = await request.arrayBuffer();
    uploadResponse = await fetch("https://api.createanything.com/v0/upload", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: buffer,
    });
  }

  if (!uploadResponse.ok) {
    const status = uploadResponse.status;
    const errorText = await uploadResponse.text().catch(() => "Upload failed");
    return new Response(errorText, { status });
  }

  const data = await uploadResponse.json();
  return Response.json({ url: data.url, mimeType: data.mimeType || null });
}
