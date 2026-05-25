import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@/utils/supabase/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const GOAL_LABELS: Record<string, string> = {
  hypertrophy: "Hipertrofia (ganho de massa muscular)",
  strength: "Força (aumentar carga máxima)",
  weight_loss: "Perda de peso (redução de gordura corporal)",
  endurance: "Resistência muscular",
  general_fitness: "Condicionamento geral",
  rehabilitation: "Reabilitação (prevenção de lesões)",
};

const GOAL_GUIDANCE: Record<string, string> = {
  hypertrophy:
    "Priorize volume e sobrecarga progressiva. Faixa ideal: 6-12 reps com cargas moderadas a pesadas. Verifique equilíbrio de volume por grupo muscular.",
  strength:
    "Foco em intensidade alta com baixo volume de reps (1-6). Movimentos compostos são prioritários. Monitore progressão de carga a cada sessão.",
  weight_loss:
    "Valorize alta frequência, densidade de treino e volume moderado. Faixas de 12-20 reps são benéficas. Atenção a quedas de desempenho que podem indicar déficit calórico excessivo.",
  endurance:
    "Reps altas (15-25+), intervalos curtos, progressão gradual de volume. Carga não é o principal indicador — durabilidade e consistência importam mais.",
  general_fitness:
    "Equilíbrio entre grupos musculares, frequência moderada e progressão sustentável. Variedade de estímulos é positiva.",
  rehabilitation:
    "Priorize execução técnica perfeita sobre carga. Alerte para quaisquer padrões de carga assimétrica ou grupos musculares negligenciados que aumentem risco de lesão.",
};


export async function POST(req: NextRequest) {
  // Verificar autenticação
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  // Verificar se já existe análise hoje (bloqueio server-side)
  const today = new Date().toISOString().split("T")[0];
  const { data: existingAnalysis } = await supabase
    .from("ai_coach_analyses")
    .select("id, content, created_at")
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (existingAnalysis) {
    return NextResponse.json({ result: existingAnalysis.content, cached: true });
  }

  // Buscar treinos dos últimos 60 dias
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 59);
  const { data: workouts, error } = await supabase
    .from("workouts")
    .select(
      `
      date,
      workout_sets (
        weight, reps, set_number,
        exercises ( name, muscle_groups ( name ) )
      )
    `,
    )
    .eq("user_id", user.id)
    .gte("date", cutoff.toISOString().split("T")[0])
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Erro ao buscar treinos" },
      { status: 500 },
    );
  }

  if (!workouts || workouts.length === 0) {
    return NextResponse.json(
      { error: "Nenhum treino nos últimos 30 dias" },
      { status: 400 },
    );
  }

  // Buscar objetivos do usuário
  const { data: profileData } = await supabase
    .from("user_profiles")
    .select("goal_1, goal_2")
    .eq("user_id", user.id)
    .maybeSingle();

  const goal1Label = profileData?.goal_1
    ? GOAL_LABELS[profileData.goal_1] ?? profileData.goal_1
    : null;
  const goal2Label = profileData?.goal_2
    ? GOAL_LABELS[profileData.goal_2] ?? profileData.goal_2
    : null;
  const goal1Guidance = profileData?.goal_1
    ? GOAL_GUIDANCE[profileData.goal_1] ?? ""
    : "";
  const goal2Guidance = profileData?.goal_2
    ? GOAL_GUIDANCE[profileData.goal_2] ?? ""
    : "";

  const goalsBlock = goal1Label
    ? `\n\nOBJETIVOS DO ATLETA:\n- Objetivo principal: ${goal1Label}\n${goal1Guidance}${goal2Label ? `\n- Objetivo secundário: ${goal2Label}\n${goal2Guidance}` : ""}\n\nTodas as recomendações devem ser coerentes com esses objetivos. Se houver conflito entre os dois objetivos, priorize o objetivo principal.`
    : "";


  // Calcular progressão por exercício e frequência por grupo muscular
  type ExerciseData = {
    muscle: string;
    sessions: { date: string; sets: { reps: number; weight: number }[] }[];
  };

  const exerciseMap: Record<string, ExerciseData> = {};
  const muscleGroupCount: Record<string, number> = {};

  for (const w of workouts as any[]) {
    const date = w.date.split("T")[0];
    for (const s of w.workout_sets) {
      const name: string = s.exercises?.name ?? "Desconhecido";
      const muscle: string = s.exercises?.muscle_groups?.name ?? "?";
      if (!exerciseMap[name]) exerciseMap[name] = { muscle, sessions: [] };
      let session = exerciseMap[name].sessions.find((x) => x.date === date);
      if (!session) {
        session = { date, sets: [] };
        exerciseMap[name].sessions.push(session);
      }
      session.sets.push({ reps: s.reps, weight: s.weight });
      muscleGroupCount[muscle] = (muscleGroupCount[muscle] ?? 0) + 1;
    }
  }

  const fmtDate = (d: string) => {
    const [, m, day] = d.split("-");
    return `${day}/${m}`;
  };

  const exerciseSummaries = Object.entries(exerciseMap)
    .map(([name, data]) => {
      const sessions = data.sessions.sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      const sessionLines = sessions
        .map((s) => {
          const sets = s.sets.map((x) => `${x.reps}r@${x.weight}kg`).join(" · ");
          return `    ${fmtDate(s.date)}: ${sets}`;
        })
        .join("\n");
      return `${name} (${data.muscle}) — ${sessions.length} sessões:\n${sessionLines}`;
    })
    .join("\n\n");

  const muscleFreq = Object.entries(muscleGroupCount)
    .sort((a, b) => b[1] - a[1])
    .map(([muscle, count]) => `${muscle}: ${count} séries`)
    .join(", ");

  const totalSessions = workouts.length;
  const avgPerWeek = ((totalSessions / 60) * 7).toFixed(1);

  const systemPrompt = `Você é um personal trainer experiente. Analise o histórico completo de treinos abaixo (todas as sessões, todas as séries) e responda em português do Brasil de forma concisa e direta.

Cada exercício mostra cada sessão no formato: DD/MM: reps@carga · reps@carga ...
Use essa progressão ao longo das semanas para avaliar evolução real de carga e volume.

Use EXATAMENTE esta estrutura:

**✅ Pontos positivos**
- **Nome do exercício:** observação em 1 frase sobre a evolução ao longo das semanas (ex: progressão consistente de carga, volume crescente, faixa de reps ideal mantida).

**⚠️ Problemas identificados**
- **Nome do exercício ou grupo:** problema objetivo em 1 frase baseado na tendência das sessões (ex: carga estagnada nas últimas 3 semanas, reps caindo, desequilíbrio de volume).

**🎯 Ações para esta semana**
1. **Nome do exercício:** ação específica e prática em 1 frase com referência ao valor atual (ex: passe de 25kg para 27,5kg, adicione 1 série, reduza para 20kg e foque na técnica).

Princípios científicos para guiar a análise (não são regras rígidas — aplique com julgamento):
- **Sobrecarga progressiva** (Zatsiorsky & Kraemer): a adaptação exige aumento gradual de estímulo (carga, volume ou densidade). Carga e reps estáveis por 3+ sessões sem sinal de adaptação = estagnação.
- **Princípio da especificidade (SAID)**: infira o objetivo provável do padrão de treino (ex: faixas de reps baixas e cargas altas sugerem força; volume alto com reps moderadas sugere hipertrofia; frequência elevada com cargas leves sugere resistência muscular). Não assuma o objetivo — deduza-o.
- **Relação volume-adaptação** (Schoenfeld, 2010; Krieger, 2010): volume insuficiente atrasa adaptação; volume excessivo sem recuperação aumenta risco de overreaching. Avalie a tendência de volume ao longo das semanas.
- **Gestão da fadiga** (Haff & Triplett): queda de reps ou carga ao longo das semanas pode indicar acúmulo de fadiga, não apenas fraqueza — diferencie os dois na análise.
- **Desequilíbrio de volume muscular**: grupos musculares com volume desproporcionalmente baixo em relação ao restante do treino merecem atenção (risco postural e de lesão).
- Máximo 2-3 itens por seção; máximo 350 palavras no total${goalsBlock}`;

  const userMessage = `Histórico dos meus últimos 60 dias:\nSessões de treino: ${totalSessions} (média ${avgPerWeek}x/semana)\nVolume por grupo muscular: ${muscleFreq}\n\nHistórico completo por exercício:\n${exerciseSummaries}`;
  console.log(`[ai-coach] enviando prompt — ${totalSessions} sessões, ${Object.keys(exerciseMap).length} exercícios`);
  console.log(`[ai-coach] userMessage:\n${userMessage}\n`);

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 4000,
    });

    const choice = completion.choices[0];
    console.log("[ai-coach] choice completo:", JSON.stringify(choice, null, 2));

    const result =
      choice?.message?.content ||
      (choice?.message as any)?.reasoning_content ||
      (choice?.message as any)?.refusal ||
      "Sem resposta";
    console.log(`[ai-coach] resultado:\n${result}\n`);

    const usage = completion.usage;
    if (usage) {
      const inputCost = (usage.prompt_tokens / 1_000_000) * 0.59;
      const outputCost = (usage.completion_tokens / 1_000_000) * 0.79;
      console.log(
        `[ai-coach] tokens — input: ${usage.prompt_tokens}, output: ${usage.completion_tokens}, total: ${usage.total_tokens}` +
          ` | custo estimado: $${(inputCost + outputCost).toFixed(6)}`,
      );
    } else {
      console.warn("[ai-coach] usage não retornado pela API");
    }

    // Salvar análise no banco
    const { error: insertError } = await supabase
      .from("ai_coach_analyses")
      .insert({ user_id: user.id, content: result });

    if (insertError) {
      console.error("[ai-coach] erro ao salvar no banco:", insertError);
    }

    return NextResponse.json({ result });
  } catch (err: any) {
    console.error("Groq error:", err);
    return NextResponse.json(
      { error: "Erro ao chamar IA. Verifique a chave da API." },
      { status: 500 },
    );
  }
}
