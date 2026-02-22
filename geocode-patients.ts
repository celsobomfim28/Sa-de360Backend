import geocodingService from './src/services/geocoding.service';

async function main() {
  console.log('🌍 Iniciando geocodificação de pacientes...\n');

  // Obter estatísticas antes
  const statsBefore = await geocodingService.getGeocodingStats();
  console.log('📊 Estatísticas antes da geocodificação:');
  console.log(`   Total de pacientes: ${statsBefore.total}`);
  console.log(`   Geocodificados: ${statsBefore.geocoded} (${statsBefore.percentage}%)`);
  console.log(`   Pendentes: ${statsBefore.pending}\n`);

  if (statsBefore.pending === 0) {
    console.log('✅ Todos os pacientes já estão geocodificados!');
    return;
  }

  // Perguntar quantos geocodificar
  const limit = process.argv[2] ? parseInt(process.argv[2]) : 10;
  console.log(`🔄 Geocodificando até ${limit} pacientes...\n`);

  // Geocodificar
  const result = await geocodingService.geocodeAllPatients(limit);

  // Obter estatísticas depois
  const statsAfter = await geocodingService.getGeocodingStats();
  console.log('\n📊 Estatísticas após geocodificação:');
  console.log(`   Total de pacientes: ${statsAfter.total}`);
  console.log(`   Geocodificados: ${statsAfter.geocoded} (${statsAfter.percentage}%)`);
  console.log(`   Pendentes: ${statsAfter.pending}\n`);

  console.log('✅ Processo concluído!');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
