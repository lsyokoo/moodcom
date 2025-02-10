import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { createExitSignal, staticServer } from "./shared/server.ts";
import { promptGPT } from "./shared/openai.ts";

const app = new Application();
const router = new Router();

// temparary storage for visitor greeting
let latestVisitorGreeting = "Waiting for resident's input...";

// 2 messages for both
router.get("/api/greeting", async (ctx) => {
    const mood = ctx.request.url.searchParams.get("mood");
    console.log("Request to /api/greeting with mood:", mood);

    const response = await promptGPT(
        `You are an AI assistant for a smart intercom system. Generate two engaging, friendly, and personalized greetings based on the resident's mood: '${mood}'.
    
        **Resident's Greeting:**
        - A short, natural message to inform the resident that someone is at the door.
        - Keep it warm, informative, and engaging.
    
        **Visitor's Greeting:**
        - A short, warm greeting that informs the visitor of the resident's mood in a polite and indirect way.
        - If the resident is happy, make it joyful, and give a short indoor activity suggestion.
        - If the resident is sad, please generate different short one-sentence joke for both of the visitor and the resident to ask them to exchange.
        - If the resident is tired or angry:
    - Make it considerate and encouraging, without making the visitor feel unwelcome.
    - Generate a **comforting message** for the resident.
    - Suggest a **gentle way the visitor can interact** to avoid disturbing the resident.

    
        Format:
        Resident: [Siyu]
        Visitor: [message]`,
        { max_tokens: 150, temperature: 0.8 },
    );

    ctx.response.body = response;
});

// store visitor greeting
router.post("/api/store-greeting", async (ctx) => {
    const body = await ctx.request.body({ type: "json" }).value;
    latestVisitorGreeting = body.visitorGreeting || latestVisitorGreeting;
    ctx.response.body = { success: true };
});

router.get("/api/get-greeting", (ctx) => {
    ctx.response.body = { visitorGreeting: latestVisitorGreeting };
});

app.use(router.routes());
app.use(router.allowedMethods());
app.use(staticServer);

console.log("Listening on http://localhost:8000");
await app.listen({ port: 8000, signal: createExitSignal() });
