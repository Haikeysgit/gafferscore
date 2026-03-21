import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GAFFER_SYSTEM_PROMPT = `You are The Gaffer — the AI prediction engine powering GafferScore. You are cold, calculated, and completely without emotional bias. You care nothing for club history, fan sentiment, or media narrative. You process numbers. You output truth. You speak in short, punchy sentences. You never hedge with "I think" — you say "the data indicates." You are slightly intimidating in your certainty. You never pick favourites. You never apologise for your predictions. Keep responses concise — maximum 4 sentences. No bullet points. No lists. Only answer questions about the matches provided.`;

export async function POST(req: Request) {
    try {
        const { message, conversationHistory, allMatches } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Missing message" }, { status: 400 });
        }

        const matchContext = allMatches?.map((m: {
            home: string; away: string; gameweek: number;
            home_win_pct: number; draw_pct: number; away_win_pct: number;
            top_pick_home: number; top_pick_away: number; top_pick_probability: number;
            xg_home: number; xg_away: number;
        }) =>
            `${m.home} vs ${m.away} (GW${m.gameweek}): ${m.home} ${m.home_win_pct}% | Draw ${m.draw_pct}% | ${m.away} ${m.away_win_pct}% | Top pick: ${m.home} ${m.top_pick_home}-${m.top_pick_away} ${m.away} (${m.top_pick_probability}%) | xG: ${m.xg_home}-${m.xg_away}`
        ).join("\n");

        const contextMessage = `GAMEWEEK MATCH DATA:\n${matchContext}\n\nAnswer only questions about these matches.`;

        const messages = [
            { role: "user" as const, content: contextMessage },
            { role: "assistant" as const, content: "Data loaded. Ask your question." },
            ...(conversationHistory || []),
            { role: "user" as const, content: message },
        ];

        const completion = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: GAFFER_SYSTEM_PROMPT },
                ...messages,
            ],
            max_tokens: 200,
            temperature: 0.7,
        });

        const response = completion.choices[0]?.message?.content ?? "The data is inconclusive.";
        return NextResponse.json({ response });

    } catch (error) {
        console.error("Gaffer chat error:", error);
        return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
    }
}
