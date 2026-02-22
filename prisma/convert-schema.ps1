# Script para converter schema.prisma de snake_case para PascalCase com @@map

$schemaPath = "schema.prisma"
$content = Get-Content $schemaPath -Raw

# Função para converter snake_case para PascalCase
function ConvertTo-PascalCase {
    param([string]$text)
    $words = $text -split '_'
    $result = ""
    foreach ($word in $words) {
        if ($word.Length -gt 0) {
            $result += $word.Substring(0,1).ToUpper() + $word.Substring(1)
        }
    }
    return $result
}

# Lista de modelos para converter
$models = @(
    'appointments', 'audit_logs', 'childcare_consultations', 'childcare_indicators',
    'diabetes_consultations', 'diabetes_indicators', 'elderly_consultations', 'elderly_indicators',
    'home_visits', 'hypertension_consultations', 'hypertension_indicators', 'micro_areas',
    'patients', 'postpartum_consultations', 'prenatal_consultations', 'prenatal_data',
    'prenatal_exams', 'prenatal_indicators', 'users', 'vaccine_records', 'vaccines',
    'woman_exams', 'woman_health_indicators'
)

foreach ($model in $models) {
    $pascalCase = ConvertTo-PascalCase $model
    # Substituir "model snake_case {" por "model PascalCase {"
    $content = $content -replace "model $model \{", "model $pascalCase {"
    # Adicionar @@map no final do modelo (antes do último })
    # Isso é complexo, então vamos fazer manualmente depois
}

# Salvar o resultado
$content | Set-Content "schema-converted.prisma"

Write-Host "Conversão concluída! Verifique schema-converted.prisma"
Write-Host "ATENÇÃO: Você ainda precisa adicionar @@map manualmente em cada modelo!"
