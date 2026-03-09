-- Adicionar novos exercícios ao banco de dados
-- Execute este script no SQL Editor do Supabase

-- Deletar grupo muscular Panturrilha
DELETE FROM muscle_groups WHERE name = 'Panturrilha';

-- PERNAS
INSERT INTO exercises (name, muscle_group_id, is_custom, created_by_user_id)
SELECT 'Leg Press Horizontal', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Cadeira Flexora', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Cadeira Extensora', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Abdutor', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Adutor', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'
UNION ALL SELECT 'Leg Press Sentado (Gêmeos)', id, false, null::UUID FROM muscle_groups WHERE name = 'Pernas'

-- COSTAS
UNION ALL SELECT 'Puxada Aberta Frontal', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL SELECT 'Remada Sentada Aberta', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'
UNION ALL SELECT 'Remada Sentada Fechada', id, false, null::UUID FROM muscle_groups WHERE name = 'Costas'

-- OMBROS
UNION ALL SELECT 'Shoulder Press Máquina', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'
UNION ALL SELECT 'Elevação Frontal', id, false, null::UUID FROM muscle_groups WHERE name = 'Ombros'

-- BÍCEPS
UNION ALL SELECT 'Rosca Polia', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'
UNION ALL SELECT 'Rosca Halteres Banco Inclinado', id, false, null::UUID FROM muscle_groups WHERE name = 'Bíceps'

-- TRÍCEPS
UNION ALL SELECT 'Francês Sentado', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps'
UNION ALL SELECT 'Pulley Polia', id, false, null::UUID FROM muscle_groups WHERE name = 'Tríceps';
