## Instruções iniciais para o agente

Você deve criar uma aplicação web chamada **GymTracker** para acompanhamento de evolução na academia.  
Siga **estritamente** todas as instruções abaixo, criando código completo, com tipagem TypeScript forte, estrutura de pastas organizada e componentes reutilizáveis.


### Regras gerais

1. Use Next.js 16.1 com App Router.
2. Use TypeScript e Tailwind CSS.
3. Todos os componentes de UI devem usar shadcn/ui.
4. Use Supabase como backend:
   - Auth para login
   - Banco PostgreSQL para dados
   - Row Level Security configurado corretamente
5. Crie hooks para buscar dados e funções utilitárias para calcular PR.
6. Componentize ao máximo. Não use `any`.
7. Layout minimalista e moderno, responsivo, com navbar simples.


### Supabase files examples


- Project URL: `https://syzjbyyxzcxpdywkgicw.supabase.co`
- Public Key: `sb_publishable_WK5CBO7bMlt_LyXMbjN1iQ_dOHM67yV`


env.local

```js
NEXT_PUBLIC_SUPABASE_URL="https://syzjbyyxzcxpdywkgicw.supabase"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sb_publishable_WK5CBO7bMlt_LyXMbjN1iQ_dOHM67yV"
```

Page.tsx
```js
import { createClient } from '@/utils/supabase/server'import { cookies } from 'next/headers'
export default async function Page() {  const cookieStore = await cookies()  const supabase = createClient(cookieStore)
  const { data: todos } = await supabase.from('todos').select()
  return (    <ul>      {todos?.map((todo) => (        <li>{todo}</li>      ))}    </ul>  )}
```

Utils/supabase/server.ts
```js
import { createServerClient, type CookieOptions } from "@supabase/ssr";import { cookies } from "next/headers";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const createClient = (cookieStore: ReturnType<typeof cookies>) => {  return createServerClient(    supabaseUrl!,    supabaseKey!,    {      cookies: {        getAll() {          return cookieStore.getAll()        },        setAll(cookiesToSet) {          try {            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))          } catch {            // The `setAll` method was called from a Server Component.            // This can be ignored if you have middleware refreshing            // user sessions.          }        },      },    },  );};
```


Utils/supabase/client.ts
```js
import { createBrowserClient } from "@supabase/ssr";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const createClient = () =>  createBrowserClient(    supabaseUrl!,    supabaseKey!,  );
```

Utils/supabase/middleware.s

```js
import { createServerClient, type CookieOptions } from "@supabase/ssr";import { type NextRequest, NextResponse } from "next/server";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
export const createClient = (request: NextRequest) => {  // Create an unmodified response  let supabaseResponse = NextResponse.next({    request: {      headers: request.headers,    },  });
  const supabase = createServerClient(    supabaseUrl!,    supabaseKey!,    {      cookies: {        getAll() {          return request.cookies.getAll()        },        setAll(cookiesToSet) {          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))          supabaseResponse = NextResponse.next({            request,          })          cookiesToSet.forEach(({ name, value, options }) =>            supabaseResponse.cookies.set(name, value, options)          )        },      },    },  );
  return supabaseResponse};
```


## Tecnologias obrigatórias

- Next.js 16.1 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth + Database
- Recharts para gráfico de evolução
- Zod para validação de schemas
- React Hook Form para gerenciamento de formulários

---

## Banco de dados (SQL)

### Tabela: `muscle_groups`

| Coluna | Tipo | Observações |
|--------|------|-------------|
| id     | uuid | PK |
| name   | text | Exemplos: Perna, Costas, Peito, Bíceps, Tríceps, Ombro |

---

### Tabela: `exercises`

| Coluna             | Tipo | Observações |
|-------------------|------|-------------|
| id                 | uuid | PK |
| name               | text | Nome do exercício |
| muscle_group_id    | uuid | FK → muscle_groups.id |
| is_custom          | boolean | default false |
| created_by_user_id | uuid | FK → auth.users.id, nullable |

**Regras:**  
- Mostrar exercícios padrão + exercícios criados pelo usuário logado.  
- Usuário pode criar novo exercício manualmente.

---

### Tabela: `workouts`

| Coluna   | Tipo | Observações |
|----------|------|-------------|
| id       | uuid | PK |
| user_id  | uuid | FK → auth.users.id |
| date     | timestamp | default now() |

---

### Tabela: `workout_sets`

| Coluna       | Tipo | Observações |
|--------------|------|-------------|
| id           | uuid | PK |
| workout_id   | uuid | FK → workouts.id |
| exercise_id  | uuid | FK → exercises.id |
| weight       | numeric | Peso levantado |
| reps         | integer | Número de repetições |
| set_number   | integer | Número da série |

---

## Row Level Security

- Usuário só pode acessar:
  - Seus workouts
  - Seus workout_sets
  - Seus exercícios customizados

Crie políticas SQL completas no Supabase.

---

## Scripts SQL para executar no Supabase

### 1. Criar tabelas

Execute este SQL no **SQL Editor** do Supabase:

```sql
-- Tabela de grupos musculares
CREATE TABLE muscle_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de exercícios
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group_id UUID NOT NULL REFERENCES muscle_groups(id) ON DELETE CASCADE,
  is_custom BOOLEAN DEFAULT FALSE,
  created_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_exercise_per_user UNIQUE (name, created_by_user_id)
);

-- Tabela de treinos
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de séries dos treinos
CREATE TABLE workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight NUMERIC(6,2) NOT NULL CHECK (weight > 0),
  reps INTEGER NOT NULL CHECK (reps > 0),
  set_number INTEGER NOT NULL CHECK (set_number > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_exercises_muscle_group ON exercises(muscle_group_id);
CREATE INDEX idx_exercises_user ON exercises(created_by_user_id);
CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_workouts_date ON workouts(date);
CREATE INDEX idx_workout_sets_workout ON workout_sets(workout_id);
CREATE INDEX idx_workout_sets_exercise ON workout_sets(exercise_id);
```

---

### 2. Habilitar Row Level Security

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
```

---

### 3. Políticas RLS

```sql
-- ============================================
-- MUSCLE_GROUPS: Todos podem ler
-- ============================================
CREATE POLICY "Todos podem ler grupos musculares"
  ON muscle_groups FOR SELECT
  TO authenticated
  USING (true);

-- ============================================
-- EXERCISES: Ver exercícios padrão + próprios customizados
-- ============================================
CREATE POLICY "Ver exercícios padrão e próprios"
  ON exercises FOR SELECT
  TO authenticated
  USING (
    is_custom = false OR created_by_user_id = auth.uid()
  );

CREATE POLICY "Usuário pode criar exercícios customizados"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (
    is_custom = true AND created_by_user_id = auth.uid()
  );

CREATE POLICY "Usuário pode atualizar seus exercícios customizados"
  ON exercises FOR UPDATE
  TO authenticated
  USING (created_by_user_id = auth.uid())
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Usuário pode deletar seus exercícios customizados"
  ON exercises FOR DELETE
  TO authenticated
  USING (created_by_user_id = auth.uid());

-- ============================================
-- WORKOUTS: Acesso total aos próprios treinos
-- ============================================
CREATE POLICY "Usuário vê apenas seus treinos"
  ON workouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuário cria seus treinos"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário atualiza seus treinos"
  ON workouts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuário deleta seus treinos"
  ON workouts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================
-- WORKOUT_SETS: Acesso baseado no treino
-- ============================================
CREATE POLICY "Usuário vê séries dos seus treinos"
  ON workout_sets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuário cria séries nos seus treinos"
  ON workout_sets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuário atualiza séries dos seus treinos"
  ON workout_sets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuário deleta séries dos seus treinos"
  ON workout_sets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = auth.uid()
    )
  );
```

---

### 4. Dados iniciais (Seed)

```sql
-- Inserir grupos musculares
INSERT INTO muscle_groups (name) VALUES
  ('Peito'),
  ('Costas'),
  ('Pernas'),
  ('Ombros'),
  ('Bíceps'),
  ('Tríceps'),
  ('Abdômen'),
  ('Panturrilha');

-- Inserir exercícios padrão (is_custom = false, created_by_user_id = null)
INSERT INTO exercises (name, muscle_group_id, is_custom, created_by_user_id)
SELECT 'Supino Reto', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL
SELECT 'Supino Inclinado', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL
SELECT 'Supino Declinado', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL
SELECT 'Crucifixo', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL
SELECT 'Peck Deck', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL
SELECT 'Barra Fixa', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL
SELECT 'Puxada Frontal', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL
SELECT 'Remada Curvada', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL
SELECT 'Remada Cavalinho', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL
SELECT 'Remada Unilateral', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL
SELECT 'Levantamento Terra', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL
SELECT 'Agachamento', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL
SELECT 'Leg Press', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL
SELECT 'Cadeira Extensora', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL
SELECT 'Cadeira Flexora', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL
SELECT 'Stiff', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL
SELECT 'Agachamento Búlgaro', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL
SELECT 'Desenvolvimento com Barra', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL
SELECT 'Desenvolvimento com Halteres', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL
SELECT 'Elevação Lateral', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL
SELECT 'Elevação Frontal', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL
SELECT 'Crucifixo Inverso', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL
SELECT 'Rosca Direta', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL
SELECT 'Rosca Alternada', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL
SELECT 'Rosca Martelo', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL
SELECT 'Rosca Concentrada', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL
SELECT 'Rosca Scott', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL
SELECT 'Tríceps Testa', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps'
UNION ALL
SELECT 'Tríceps Pulley', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps'
UNION ALL
SELECT 'Tríceps Francês', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps'
UNION ALL
SELECT 'Mergulho', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps'
UNION ALL
SELECT 'Abdominal Supra', id, false, null::UUID FROM muscle_groups WHERE name = 'Abdômen'
UNION ALL
SELECT 'Abdominal Infra', id, false, null::UUID FROM muscle_groups WHERE name = 'Abdômen'
UNION ALL
SELECT 'Prancha', id, false, null::UUID FROM muscle_groups WHERE name = 'Abdômen'
UNION ALL
SELECT 'Elevação de Pernas', id, false, null::UUID FROM muscle_groups WHERE name = 'Abdômen'
UNION ALL
SELECT 'Panturrilha em Pé', id, false, null::UUID FROM muscle_groups WHERE name = 'Panturrilha'
UNION ALL
SELECT 'Panturrilha Sentado', id, false, null::UUID FROM muscle_groups WHERE name = 'Panturrilha';
```

---

## Páginas

### 1️⃣ `/login`

- Form simples (shadcn Form + Input + Button)
- Campos:
  - Email
  - Password
  - Botão login
- Redirecionar usuário autenticado para `/dashboard`

---

### 2️⃣ `/dashboard`

Mostrar:

- Total de treinos realizados
- Último treino
- Exercício com maior peso já levantado (PR geral)
- Layout minimalista

---

### 3️⃣ `/workouts/new`

Fluxo de cadastro de treino:

1. Selecionar grupo muscular (Select shadcn)
2. Selecionar exercício (Combobox com autocomplete)
3. Área dinâmica de séries:

   - Botão "+ Nova Série"
   - A partir da segunda série:
     - Botão "Replicar anterior" (copia peso e reps da série anterior)
   - Inputs:
     - Peso
     - Repetições
   - Permitir múltiplos exercícios no mesmo treino
   - Usuário pode editar séries antes de salvar

Ao salvar:

- Criar workout
- Criar múltiplos workout_sets

---

### 4️⃣ `/progress`

Página de evolução:

- Selecionar exercício (dropdown)
- Mostrar gráfico de linha com Recharts
- Lógica do gráfico:
  - Para cada treino, pegar maior peso levantado daquele exercício
  - Ordenar por data
  - Mostrar evolução ao longo do tempo

Exemplo de dados:

| date   | max_weight |
|--------|------------|
| 01/03  | 100        |
| 05/03  | 110        |
| 10/03  | 115        |

---

## Validação com Zod

Use Zod + React Hook Form em todos os formulários. Crie schemas reutilizáveis em `lib/validations/`.

### Estrutura de validações

```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
})

export type LoginInput = z.infer<typeof loginSchema>

export const signupSchema = z.object({
  email: z
    .string()
    .min(1, 'Email é obrigatório')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'Senha deve ter no mínimo 6 caracteres')
    .max(100, 'Senha muito longa'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword']
})

export type SignupInput = z.infer<typeof signupSchema>
```

```typescript
// lib/validations/workout.ts
import { z } from 'zod'

export const workoutSetSchema = z.object({
  exerciseId: z.string().uuid('Exercício inválido'),
  weight: z
    .number({
      required_error: 'Peso é obrigatório',
      invalid_type_error: 'Peso deve ser um número'
    })
    .positive('Peso deve ser maior que zero')
    .max(1000, 'Peso muito alto'),
  reps: z
    .number({
      required_error: 'Repetições são obrigatórias',
      invalid_type_error: 'Repetições devem ser um número'
    })
    .int('Repetições devem ser um número inteiro')
    .positive('Repetições devem ser maior que zero')
    .max(500, 'Número de repetições muito alto'),
  setNumber: z.number().int().positive()
})

export const workoutFormSchema = z.object({
  muscleGroupId: z.string().uuid('Grupo muscular inválido'),
  exerciseId: z.string().uuid('Exercício inválido'),
  sets: z
    .array(workoutSetSchema)
    .min(1, 'Adicione pelo menos uma série')
    .max(20, 'Máximo de 20 séries por exercício')
})

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>
export type WorkoutFormInput = z.infer<typeof workoutFormSchema>

// Schema para criar exercício customizado
export const customExerciseSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  muscleGroupId: z.string().uuid('Grupo muscular inválido')
})

export type CustomExerciseInput = z.infer<typeof customExerciseSchema>
```

### Exemplo de uso com React Hook Form

```typescript
// app/login/page.tsx
'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const onSubmit = async (data: LoginInput) => {
    // Lógica de login com Supabase
    console.log(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </Form>
  )
}
```

### Validações no server-side (Server Actions)

```typescript
// app/actions/workout.ts
'use server'

import { workoutFormSchema } from '@/lib/validations/workout'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createWorkout(formData: unknown) {
  // 1. Validar dados
  const result = workoutFormSchema.safeParse(formData)
  
  if (!result.success) {
    return {
      error: 'Dados inválidos',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  // 2. Criar workout no banco
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({ user_id: (await supabase.auth.getUser()).data.user?.id })
    .select()
    .single()

  if (workoutError) {
    return { error: 'Erro ao criar treino' }
  }

  // 3. Criar sets
  const setsToInsert = result.data.sets.map((set) => ({
    workout_id: workout.id,
    exercise_id: set.exerciseId,
    weight: set.weight,
    reps: set.reps,
    set_number: set.setNumber
  }))

  const { error: setsError } = await supabase
    .from('workout_sets')
    .insert(setsToInsert)

  if (setsError) {
    return { error: 'Erro ao criar séries' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
```

---

## Estrutura de pastas recomendada
app/
  login/page.tsx
  dashboard/page.tsx
  workouts/new/page.tsx
  progress/page.tsx
  actions/
    workout.ts

components/
  Navbar.tsx
  ExerciseCombobox.tsx
  WorkoutForm.tsx
  SetRow.tsx
  ProgressChart.tsx

lib/
  supabaseClient.ts
  validations/
    auth.ts
    workout.ts

hooks/
  useWorkouts.ts
  useExercises.ts

utils/
  calculatePR.ts

types/
  database.types.ts

---

## Dependências necessárias

Instalar as seguintes dependências:

```bash
# Dependências principais
npm install @supabase/ssr @supabase/supabase-js
npm install zod
npm install react-hook-form @hookform/resolvers
npm install recharts

# shadcn/ui (seguir instalação oficial)
npx shadcn@latest init
npx shadcn@latest add form input button select card label

# TypeScript e Tailwind já vêm com Next.js
```

---

## Regras importantes

- Código bem tipado, separado entre lógica e UI
- Criar hooks para buscar dados e funções utilitárias para calcular PR
- Componentizar ao máximo
- Layout minimalista e responsivo
- Não usar `any`
- **Todos os formulários devem usar Zod + React Hook Form**
- **Validar dados tanto no client quanto no server (Server Actions)**
- Mostrar mensagens de erro claras e em português
- Usar estados de loading em botões e forms