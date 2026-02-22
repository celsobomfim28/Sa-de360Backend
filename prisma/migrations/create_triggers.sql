-- ============================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE INDICADORES
-- Sistema Saúde 360 PSF
-- ============================================

-- Função para atualizar timestamp de última modificação
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS DE TIMESTAMP
-- ============================================

-- Pacientes
DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Usuários
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TRIGGERS DE INDICADORES - PUERICULTURA
-- ============================================

-- Função para atualizar indicadores de puericultura após consulta
CREATE OR REPLACE FUNCTION update_childcare_indicators_after_consultation()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_id UUID;
    v_birth_date DATE;
    v_days_since_birth INTEGER;
    v_consultation_count INTEGER;
    v_anthropometry_count INTEGER;
BEGIN
    v_patient_id := NEW.patient_id;
    
    -- Buscar data de nascimento
    SELECT birth_date INTO v_birth_date
    FROM patients
    WHERE id = v_patient_id;
    
    -- Calcular dias desde o nascimento
    v_days_since_birth := EXTRACT(DAY FROM (NEW.consultation_date - v_birth_date));
    
    -- Contar consultas
    SELECT COUNT(*) INTO v_consultation_count
    FROM childcare_consultations
    WHERE patient_id = v_patient_id;
    
    -- Contar registros antropométricos
    SELECT COUNT(*) INTO v_anthropometry_count
    FROM childcare_consultations
    WHERE patient_id = v_patient_id
    AND weight IS NOT NULL
    AND height IS NOT NULL;
    
    -- Atualizar indicadores
    UPDATE childcare_indicators
    SET
        -- B1: 1ª Consulta até 30 dias
        first_consultation_date = CASE 
            WHEN first_consultation_date IS NULL THEN NEW.consultation_date
            ELSE first_consultation_date
        END,
        b1_status = CASE
            WHEN first_consultation_date IS NULL AND v_days_since_birth <= 30 THEN 'GREEN'
            WHEN first_consultation_date IS NULL AND v_days_since_birth > 30 THEN 'YELLOW'
            ELSE b1_status
        END,
        -- B2: 9 Consultas até 2 anos
        consultation_count = v_consultation_count,
        b2_status = CASE
            WHEN v_consultation_count >= 9 THEN 'GREEN'
            WHEN v_consultation_count >= 5 THEN 'YELLOW'
            ELSE 'RED'
        END,
        -- B3: Peso/Altura
        anthropometry_count = v_anthropometry_count,
        b3_status = CASE
            WHEN v_anthropometry_count >= 9 THEN 'GREEN'
            WHEN v_anthropometry_count >= 5 THEN 'YELLOW'
            ELSE 'RED'
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE patient_id = v_patient_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_childcare_indicators ON childcare_consultations;
CREATE TRIGGER trigger_update_childcare_indicators
    AFTER INSERT OR UPDATE ON childcare_consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_childcare_indicators_after_consultation();

-- ============================================
-- TRIGGERS DE INDICADORES - PRÉ-NATAL
-- ============================================

-- Função para atualizar indicadores de pré-natal após consulta
CREATE OR REPLACE FUNCTION update_prenatal_indicators_after_consultation()
RETURNS TRIGGER AS $$
DECLARE
    v_prenatal_data_id UUID;
    v_consultation_count INTEGER;
    v_bp_count INTEGER;
BEGIN
    v_prenatal_data_id := NEW.prenatal_data_id;
    
    -- Contar consultas
    SELECT COUNT(*) INTO v_consultation_count
    FROM prenatal_consultations
    WHERE prenatal_data_id = v_prenatal_data_id;
    
    -- Contar aferições de PA
    SELECT COUNT(*) INTO v_bp_count
    FROM prenatal_consultations
    WHERE prenatal_data_id = v_prenatal_data_id
    AND blood_pressure IS NOT NULL;
    
    -- Atualizar indicadores
    UPDATE prenatal_indicators
    SET
        -- C1: 7 Consultas
        prenatal_consultation_count = v_consultation_count,
        c1_status = CASE
            WHEN v_consultation_count >= 7 THEN 'GREEN'
            WHEN v_consultation_count >= 4 THEN 'YELLOW'
            ELSE 'RED'
        END,
        -- C2: 7 Aferições de PA
        blood_pressure_count = v_bp_count,
        c2_status = CASE
            WHEN v_bp_count >= 7 THEN 'GREEN'
            WHEN v_bp_count >= 4 THEN 'YELLOW'
            ELSE 'RED'
        END,
        -- C3: Peso/Altura
        weight_height_recorded = CASE
            WHEN NEW.weight IS NOT NULL AND NEW.height IS NOT NULL THEN TRUE
            ELSE weight_height_recorded
        END,
        c3_status = CASE
            WHEN NEW.weight IS NOT NULL AND NEW.height IS NOT NULL THEN 'GREEN'
            ELSE c3_status
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE prenatal_data_id = v_prenatal_data_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_prenatal_indicators ON prenatal_consultations;
CREATE TRIGGER trigger_update_prenatal_indicators
    AFTER INSERT OR UPDATE ON prenatal_consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_prenatal_indicators_after_consultation();

-- ============================================
-- TRIGGERS DE INDICADORES - VISITAS DOMICILIARES
-- ============================================

-- Função para atualizar indicadores após visita domiciliar
CREATE OR REPLACE FUNCTION update_indicators_after_home_visit()
RETURNS TRIGGER AS $$
DECLARE
    v_patient_id UUID;
    v_is_child BOOLEAN;
    v_is_pregnant BOOLEAN;
    v_has_diabetes BOOLEAN;
    v_has_hypertension BOOLEAN;
    v_is_elderly BOOLEAN;
    v_visit_count INTEGER;
BEGIN
    v_patient_id := NEW.patient_id;
    
    -- Buscar características do paciente
    SELECT is_child, is_pregnant, has_diabetes, has_hypertension, is_elderly
    INTO v_is_child, v_is_pregnant, v_has_diabetes, v_has_hypertension, v_is_elderly
    FROM patients
    WHERE id = v_patient_id;
    
    -- Atualizar indicadores de puericultura (B4)
    IF v_is_child THEN
        SELECT COUNT(*) INTO v_visit_count
        FROM home_visits
        WHERE patient_id = v_patient_id
        AND visit_type IN ('VD1_RN', 'VD2_RN');
        
        UPDATE childcare_indicators
        SET
            home_visit_count = v_visit_count,
            b4_status = CASE
                WHEN v_visit_count >= 2 THEN 'GREEN'
                WHEN v_visit_count >= 1 THEN 'YELLOW'
                ELSE 'RED'
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE patient_id = v_patient_id;
    END IF;
    
    -- Atualizar indicadores de pré-natal (C4)
    IF v_is_pregnant THEN
        SELECT COUNT(*) INTO v_visit_count
        FROM home_visits hv
        INNER JOIN prenatal_data pd ON hv.patient_id = pd.patient_id
        WHERE hv.patient_id = v_patient_id
        AND hv.visit_type IN ('VD1_GESTANTE', 'VD2_GESTANTE', 'VD3_GESTANTE');
        
        UPDATE prenatal_indicators
        SET
            home_visit_count = v_visit_count,
            c4_status = CASE
                WHEN v_visit_count >= 3 THEN 'GREEN'
                WHEN v_visit_count >= 2 THEN 'YELLOW'
                ELSE 'RED'
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE prenatal_data_id IN (
            SELECT id FROM prenatal_data WHERE patient_id = v_patient_id
        );
    END IF;
    
    -- Atualizar indicadores de diabetes (D4)
    IF v_has_diabetes THEN
        SELECT COUNT(*) INTO v_visit_count
        FROM home_visits
        WHERE patient_id = v_patient_id
        AND created_at >= CURRENT_DATE - INTERVAL '12 months';
        
        UPDATE diabetes_indicators
        SET
            home_visit_count = v_visit_count,
            d4_status = CASE
                WHEN v_visit_count >= 2 THEN 'GREEN'
                WHEN v_visit_count >= 1 THEN 'YELLOW'
                ELSE 'RED'
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE patient_id = v_patient_id;
    END IF;
    
    -- Atualizar indicadores de hipertensão (E4)
    IF v_has_hypertension THEN
        SELECT COUNT(*) INTO v_visit_count
        FROM home_visits
        WHERE patient_id = v_patient_id
        AND created_at >= CURRENT_DATE - INTERVAL '12 months';
        
        UPDATE hypertension_indicators
        SET
            home_visit_count = v_visit_count,
            e4_status = CASE
                WHEN v_visit_count >= 2 THEN 'GREEN'
                WHEN v_visit_count >= 1 THEN 'YELLOW'
                ELSE 'RED'
            END,
            last_updated = CURRENT_TIMESTAMP
        WHERE patient_id = v_patient_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_indicators_after_home_visit ON home_visits;
CREATE TRIGGER trigger_update_indicators_after_home_visit
    AFTER INSERT ON home_visits
    FOR EACH ROW
    EXECUTE FUNCTION update_indicators_after_home_visit();

-- ============================================
-- TRIGGERS DE INDICADORES - AÇÕES COMPARTILHADAS
-- ============================================

-- Função para atualizar indicadores após registro de antropometria
CREATE OR REPLACE FUNCTION update_indicators_after_anthropometry()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar indicadores de puericultura (B3)
    UPDATE childcare_indicators ci
    SET
        anthropometry_count = (
            SELECT COUNT(*) 
            FROM anthropometry_records 
            WHERE patient_id = NEW.patient_id
        ),
        b3_status = CASE
            WHEN (SELECT COUNT(*) FROM anthropometry_records WHERE patient_id = NEW.patient_id) >= 9 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM anthropometry_records WHERE patient_id = NEW.patient_id) >= 5 THEN 'YELLOW'
            ELSE 'RED'
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE patient_id = NEW.patient_id
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND is_child = TRUE);
    
    -- Atualizar indicadores de pré-natal (C3)
    UPDATE prenatal_indicators pi
    SET
        weight_height_recorded = TRUE,
        c3_status = 'GREEN',
        last_updated = CURRENT_TIMESTAMP
    WHERE prenatal_data_id IN (
        SELECT id FROM prenatal_data WHERE patient_id = NEW.patient_id
    )
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND is_pregnant = TRUE);
    
    -- Atualizar indicadores de diabetes (D3)
    UPDATE diabetes_indicators
    SET
        last_anthropometry_date = NEW.measurement_date,
        d3_status = 'GREEN',
        last_updated = CURRENT_TIMESTAMP
    WHERE patient_id = NEW.patient_id
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND has_diabetes = TRUE);
    
    -- Atualizar indicadores de hipertensão (E3)
    UPDATE hypertension_indicators
    SET
        last_anthropometry_date = NEW.measurement_date,
        e3_status = 'GREEN',
        last_updated = CURRENT_TIMESTAMP
    WHERE patient_id = NEW.patient_id
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND has_hypertension = TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_indicators_after_anthropometry ON anthropometry_records;
CREATE TRIGGER trigger_update_indicators_after_anthropometry
    AFTER INSERT ON anthropometry_records
    FOR EACH ROW
    EXECUTE FUNCTION update_indicators_after_anthropometry();

-- Função para atualizar indicadores após registro de PA
CREATE OR REPLACE FUNCTION update_indicators_after_blood_pressure()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar indicadores de pré-natal (C2)
    UPDATE prenatal_indicators pi
    SET
        blood_pressure_count = (
            SELECT COUNT(*) 
            FROM blood_pressure_records 
            WHERE patient_id = NEW.patient_id
        ),
        c2_status = CASE
            WHEN (SELECT COUNT(*) FROM blood_pressure_records WHERE patient_id = NEW.patient_id) >= 7 THEN 'GREEN'
            WHEN (SELECT COUNT(*) FROM blood_pressure_records WHERE patient_id = NEW.patient_id) >= 4 THEN 'YELLOW'
            ELSE 'RED'
        END,
        last_updated = CURRENT_TIMESTAMP
    WHERE prenatal_data_id IN (
        SELECT id FROM prenatal_data WHERE patient_id = NEW.patient_id
    )
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND is_pregnant = TRUE);
    
    -- Atualizar indicadores de diabetes (D2)
    UPDATE diabetes_indicators
    SET
        last_blood_pressure_date = NEW.measurement_date,
        d2_status = 'GREEN',
        last_updated = CURRENT_TIMESTAMP
    WHERE patient_id = NEW.patient_id
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND has_diabetes = TRUE);
    
    -- Atualizar indicadores de hipertensão (E2)
    UPDATE hypertension_indicators
    SET
        last_blood_pressure_date = NEW.measurement_date,
        e2_status = 'GREEN',
        last_updated = CURRENT_TIMESTAMP
    WHERE patient_id = NEW.patient_id
    AND EXISTS (SELECT 1 FROM patients WHERE id = NEW.patient_id AND has_hypertension = TRUE);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_indicators_after_blood_pressure ON blood_pressure_records;
CREATE TRIGGER trigger_update_indicators_after_blood_pressure
    AFTER INSERT ON blood_pressure_records
    FOR EACH ROW
    EXECUTE FUNCTION update_indicators_after_blood_pressure();

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índices para melhorar performance das queries de indicadores
CREATE INDEX IF NOT EXISTS idx_childcare_consultations_patient_date 
    ON childcare_consultations(patient_id, consultation_date);

CREATE INDEX IF NOT EXISTS idx_prenatal_consultations_prenatal_date 
    ON prenatal_consultations(prenatal_data_id, consultation_date);

CREATE INDEX IF NOT EXISTS idx_home_visits_patient_date 
    ON home_visits(patient_id, created_at);

CREATE INDEX IF NOT EXISTS idx_anthropometry_records_patient_date 
    ON anthropometry_records(patient_id, measurement_date);

CREATE INDEX IF NOT EXISTS idx_blood_pressure_records_patient_date 
    ON blood_pressure_records(patient_id, measurement_date);

CREATE INDEX IF NOT EXISTS idx_vaccine_records_patient_date 
    ON vaccine_records(patient_id, application_date);

-- Índices para filtros por microárea
CREATE INDEX IF NOT EXISTS idx_patients_microarea 
    ON patients(micro_area_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_patients_eligibility 
    ON patients(is_child, is_pregnant, has_diabetes, has_hypertension, is_elderly, is_woman) 
    WHERE deleted_at IS NULL;

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON FUNCTION update_updated_at_column() IS 
'Atualiza automaticamente o campo updated_at quando um registro é modificado';

COMMENT ON FUNCTION update_childcare_indicators_after_consultation() IS 
'Atualiza indicadores de puericultura (B1, B2, B3) após registro de consulta';

COMMENT ON FUNCTION update_prenatal_indicators_after_consultation() IS 
'Atualiza indicadores de pré-natal (C1, C2, C3) após registro de consulta';

COMMENT ON FUNCTION update_indicators_after_home_visit() IS 
'Atualiza indicadores (B4, C4, D4, E4) após registro de visita domiciliar';

COMMENT ON FUNCTION update_indicators_after_anthropometry() IS 
'Atualiza indicadores (B3, C3, D3, E3) após registro de peso e altura';

COMMENT ON FUNCTION update_indicators_after_blood_pressure() IS 
'Atualiza indicadores (C2, D2, E2) após registro de pressão arterial';

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Para aplicar este script:
-- psql -U postgres -d saude360 -f backend/prisma/migrations/create_triggers.sql
