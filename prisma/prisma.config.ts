import { defineConfig } from '@prisma/client';

export default defineConfig({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/saude360?schema=public',
        },
    },
});
