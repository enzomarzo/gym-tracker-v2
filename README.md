# GymTracker

Aplicação web para acompanhamento de evolução na academia, construída com Next.js 16.1, TypeScript, Tailwind CSS e Supabase.

## 🚀 Tecnologias

- **Next.js 16.1** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** - Componentes UI
- **Supabase** - Authentication + PostgreSQL
- **Recharts** - Gráficos de evolução
- **Zod** - Validação de schemas
- **React Hook Form** - Gerenciamento de formulários

## 📋 Funcionalidades

- ✅ Autenticação de usuários
- ✅ Dashboard com estatísticas
- ✅ Registro de treinos com múltiplas séries
- ✅ Seleção de grupos musculares e exercícios
- ✅ Gráfico de evolução por exercício
- ✅ Cálculo de Personal Records (PR)
- ✅ Interface responsiva e minimalista

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd gym-tracker
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1. Crie um projeto no [Supabase](https://supabase.com)

#### 3.2. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL="sua-url-do-supabase"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="sua-chave-publica"
```

#### 3.3. Execute os scripts SQL

No **SQL Editor** do Supabase, execute na ordem:

**1. Criar tabelas:**

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

**2. Habilitar Row Level Security:**

```sql
ALTER TABLE muscle_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
```

**3. Criar políticas RLS:**

```sql
-- MUSCLE_GROUPS: Todos podem ler
CREATE POLICY "Todos podem ler grupos musculares"
  ON muscle_groups FOR SELECT
  TO authenticated
  USING (true);

-- EXERCISES: Ver exercícios padrão + próprios customizados
CREATE POLICY "Ver exercícios padrão e próprios"
  ON exercises FOR SELECT
  TO authenticated
  USING (is_custom = false OR created_by_user_id = auth.uid());

CREATE POLICY "Usuário pode criar exercícios customizados"
  ON exercises FOR INSERT
  TO authenticated
  WITH CHECK (is_custom = true AND created_by_user_id = auth.uid());

-- WORKOUTS: Acesso total aos próprios treinos
CREATE POLICY "Usuário vê apenas seus treinos"
  ON workouts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Usuário cria seus treinos"
  ON workouts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- WORKOUT_SETS: Acesso baseado no treino
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
```

**4. Inserir dados iniciais (Seed):**

```sql
-- Inserir grupos musculares
INSERT INTO muscle_groups (name) VALUES
  ('Peito'), ('Costas'), ('Pernas'), ('Ombros'),
  ('Bíceps'), ('Tríceps'), ('Abdômen'), ('Panturrilha');

-- Inserir exercícios padrão
INSERT INTO exercises (name, muscle_group_id, is_custom, created_by_user_id)
SELECT 'Supino Reto', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL SELECT 'Supino Inclinado', id, false, null::UUID FROM muscle_groups WHERE name = 'Peito'
UNION ALL SELECT 'Leg Press', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Agachamento', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Puxada Frontal', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL SELECT 'Remada Curvada', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL SELECT 'Desenvolvimento', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL SELECT 'Elevação Lateral', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL SELECT 'Rosca Direta', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL SELECT 'Rosca Martelo', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL SELECT 'Tríceps Pulley', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps'
UNION ALL SELECT 'Tríceps Testa', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps';
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
gym-tracker/
├── app/
│   ├── actions/
│   │   └── workout.ts          # Server Actions
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard
│   ├── login/
│   │   └── page.tsx            # Login
│   ├── progress/
│   │   └── page.tsx            # Gráfico de evolução
│   ├── workouts/
│   │   └── new/
│   │       └── page.tsx        # Novo treino
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                     # Componentes shadcn/ui
│   ├── Navbar.tsx              # Barra de navegação
│   └── ProgressChart.tsx       # Gráfico Recharts
├── hooks/
│   ├── useExercises.ts         # Hook de exercícios
│   └── useWorkouts.ts          # Hook de treinos
├── lib/
│   ├── validations/
│   │   ├── auth.ts             # Schemas Zod (auth)
│   │   └── workout.ts          # Schemas Zod (workout)
│   └── utils.ts                # Utilitários
├── types/
│   └── database.types.ts       # Tipos TypeScript
├── utils/
│   ├── calculatePR.ts          # Cálculos de PR
│   └── supabase/
│       ├── client.ts           # Supabase client
│       ├── server.ts           # Supabase server
│       └── middleware.ts       # Supabase middleware
└── middleware.ts               # Next.js middleware
```

## 🎯 Uso

1. **Criar conta**: Use o sistema de autenticação do Supabase
2. **Dashboard**: Veja estatísticas gerais
3. **Novo Treino**: Registre treinos com múltiplas séries
4. **Progresso**: Visualize evolução por exercício

## 📝 Licença

MIT

## 👤 Autor

Desenvolvido como projeto de acompanhamento fitness.
