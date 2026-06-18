import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import vm from "vm";

export async function GET(req: NextRequest, props: { params: Promise<{ funcId: string }> }) {
  return handleRequest(req, props.params);
}

export async function POST(req: NextRequest, props: { params: Promise<{ funcId: string }> }) {
  return handleRequest(req, props.params);
}

export async function PUT(req: NextRequest, props: { params: Promise<{ funcId: string }> }) {
  return handleRequest(req, props.params);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ funcId: string }> }) {
  return handleRequest(req, props.params);
}

async function handleRequest(request: NextRequest, paramsPromise: Promise<{ funcId: string }>) {
  const { funcId } = await paramsPromise;

  const db = getAdminDb();
  const snapshot = await db.collectionGroup("functions").where("id", "==", funcId).limit(1).get();

  if (snapshot.empty) {
    return NextResponse.json({ error: "Xakteir Edge Function not found or offline." }, { status: 404 });
  }

  const funcData = snapshot.docs[0].data();
  const code = funcData.code;

  if (funcData.status !== "Active") {
    return NextResponse.json({ error: "Function is not active." }, { status: 403 });
  }

  // Transform standard ES Modules `export default` to CommonJS for the VM sandbox
  let runnableCode = code.replace(/export\s+default\s+(async\s+)?function\s*\(/g, "module.exports = $1function(");
  runnableCode = runnableCode.replace(/export\s+default\s+\(/g, "module.exports = (");
  runnableCode = runnableCode.replace(/export\s+default\s+([a-zA-Z0-9_]+)/g, "module.exports = $1");

  const sandbox = {
    module: { exports: {} as any },
    console: {
      log: (...args: any[]) => console.log(`[Edge ${funcId}]`, ...args),
      error: (...args: any[]) => console.error(`[Edge ${funcId}] ERROR:`, ...args),
      warn: (...args: any[]) => console.warn(`[Edge ${funcId}] WARN:`, ...args),
    },
    fetch: fetch,
    setTimeout,
    clearTimeout,
    Buffer,
    URL,
  };

  try {
    vm.createContext(sandbox);
    vm.runInContext(runnableCode, sandbox, { timeout: 5000 });
    
    const handler = sandbox.module.exports;
    
    if (typeof handler !== "function") {
      return NextResponse.json({ error: "Function must export default a handler function." }, { status: 500 });
    }

    let responseBody: any = null;
    let responseStatus = 200;
    let responseHeaders = new Headers();
    let isFinished = false;

    // Mock Express Response
    const resMock = {
      status: (code: number) => {
        responseStatus = code;
        return resMock;
      },
      json: (data: any) => {
        responseBody = JSON.stringify(data);
        responseHeaders.set("Content-Type", "application/json");
        isFinished = true;
      },
      send: (data: any) => {
        if (typeof data === "object") {
          responseBody = JSON.stringify(data);
          responseHeaders.set("Content-Type", "application/json");
        } else {
          responseBody = data;
          if (!responseHeaders.has("Content-Type")) responseHeaders.set("Content-Type", "text/plain");
        }
        isFinished = true;
      },
      setHeader: (key: string, value: string) => {
        responseHeaders.set(key, value);
        return resMock;
      }
    };

    // Mock Express Request
    const reqMock = {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(request.nextUrl.searchParams.entries()),
      body: request.method !== "GET" && request.method !== "HEAD" 
        ? await request.json().catch(() => null) 
        : null,
    };

    // Execute User Code
    await handler(reqMock, resMock);

    return new NextResponse(responseBody || "", {
      status: responseStatus,
      headers: responseHeaders
    });

  } catch (e: any) {
    console.error(`[Edge ${funcId}] Crash:`, e);
    return NextResponse.json({ error: "Execution crashed", details: e.message }, { status: 500 });
  }
}
