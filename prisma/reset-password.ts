import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const cpf = (process.argv[2] || '00000000000').replace(/\D/g, '');
    const newPassword = process.argv[3] || 'senha123';
    const saltRounds = 12;

    const user = await prisma.users.findUnique({ where: { cpf } });

    if (!user) {
        console.error(`❌ Usuário com CPF ${cpf} não encontrado.`);
        process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await prisma.users.update({
        where: { id: user.id },
        data: { password: hashedPassword },
    });

    console.log(`✅ Senha redefinida para ${user.fullName} (${cpf}, role=${user.role}).`);
    console.log(`   Nova senha: ${newPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());