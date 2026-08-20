export function getAgeInMonths(birthDate: string | Date, now: Date = new Date()): number {
    const birth = birthDate instanceof Date ? birthDate : new Date(birthDate);
    return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

export function getAgeInYears(birthDate: string | Date, now: Date = new Date()): number {
    return Math.floor(getAgeInMonths(birthDate, now) / 12);
}

export function deriveAgeEligibility(birthDate: string | Date, sex?: string, now: Date = new Date()) {
    const ageInMonths = getAgeInMonths(birthDate, now);
    const ageInYears = Math.floor(ageInMonths / 12);

    return {
        isChild: ageInMonths < 24,
        isElderly: ageInYears >= 60,
        isWoman: sex === 'FEMALE' && ageInYears >= 9 && ageInYears <= 69,
    };
}