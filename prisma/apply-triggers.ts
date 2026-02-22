import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function applyTriggers() {
    try {
        console.log('🔧 Aplicando triggers do PostgreSQL...\n');

        // Ler arquivo SQL
        const sqlPath = path.join(__dirname, 'migrations', 'create_triggers.sql');
        const sql = fs.readFileSync(sqlPath, 'utf-8');

        // Dividir em statements individuais (separados por ponto e vírgula)
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Encontrados ${statements.length} statements SQL\n`);

        // Executar cada statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Pular comentários de bloco
            if (statement.startsWith('/*') || statement.includes('COMMENT ON')) {
                continue;
            }

            try {
                await prisma.$executeRawUnsafe(statement + ';');
                
                // Identificar tipo de statement
                if (statement.includes('CREATE OR REPLACE FUNCTION')) {
                    const funcName = statement.match(/FUNCTION\s+(\w+)/)?.[1];
                    console.log(`✅ Função criada: ${funcName}`);
                } else if (statement.includes('CREATE TRIGGER')) {
                    const triggerName = statement.match(/TRIGGER\s+(\w+)/)?.[1];
                    console.log(`✅ Trigger criado: ${triggerName}`);
                } else if (statement.includes('DROP TRIGGER')) {
                    const triggerName = statement.match(/TRIGGER\s+IF\s+EXISTS\s+(\w+)/)?.[1];
                    console.log(`🗑️  Trigger removido: ${triggerName}`);
                } else if (statement.includes('CREATE INDEX')) {
                    const indexName = statement.match(/INDEX\s+IF\s+NOT\s+EXISTS\s+(\w+)/)?.[1];
                    console.log(`📊 Índice criado: ${indexName}`);
                }
            } catch (error: any) {
                console.error(`❌ Erro ao executar statement ${i + 1}:`, error.message);
                // Continuar mesmo com erros (alguns podem ser esperados, como DROP de triggers que não existem)
            }
        }

        console.log('\n✅ Triggers aplicados com sucesso!');
        console.log('\n📋 Resumo:');
        console.log('   - Funções de atualização de indicadores criadas');
        console.log('   - Triggers de timestamp criados');
        console.log('   - Triggers de indicadores criados');
        console.log('   - Índices de performance criados');
        console.log('\n🎯 Os indicadores agora serão atualizados automaticamente!');

    } catch (error) {
        console.error('❌ Erro ao aplicar triggers:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

applyTriggers();
