/**
 * Utility functions for handling biometric measurements with flexible units
 */

// Type definitions
export type WeightUnit = "kg" | "lbs"
export type HeightUnit = "cm" | "in"
export type Gender =
  | "male"
  | "female"
  | "non-binary"
  | "prefer-not-to-say"
  | "other"

export interface BiometricData {
  age?: number
  gender?: Gender
  weight?: {
    value: number
    unit: WeightUnit
  }
  height?: {
    value: number
    unit: HeightUnit
  }
}

// Weight conversion functions
export const convertWeight = {
  kgToLbs: (kg: number): number => kg * 2.204_62,
  lbsToKg: (lbs: number): number => lbs / 2.204_62,

  toKg: (value: number, unit: WeightUnit): number => {
    return unit === "kg" ? value : convertWeight.lbsToKg(value)
  },

  toLbs: (value: number, unit: WeightUnit): number => {
    return unit === "lbs" ? value : convertWeight.kgToLbs(value)
  },
}

// Height conversion functions
export const convertHeight = {
  cmToInches: (cm: number): number => cm / 2.54,
  inchesToCm: (inches: number): number => inches * 2.54,

  // Convert any height to centimeters
  toCm: (value: number, unit: HeightUnit): number => {
    switch (unit) {
      case "cm":
        return value
      case "in":
        return convertHeight.inchesToCm(value)
      default:
        throw new Error(`Unknown height unit: ${unit}`)
    }
  },

  // Convert any height to inches
  toInches: (value: number, unit: HeightUnit): number => {
    switch (unit) {
      case "in":
        return value
      case "cm":
        return convertHeight.cmToInches(value)
      default:
        throw new Error(`Unknown height unit: ${unit}`)
    }
  },
}

// Formatting functions for display
export const formatBiometrics = {
  weight: (value: number, unit: WeightUnit): string => {
    const rounded = Math.round(value * 100) / 100
    return `${rounded} ${unit}`
  },

  height: (value: number, unit: HeightUnit): string => {
    const rounded = Math.round(value * 100) / 100
    return `${rounded} ${unit}`
  },

  age: (age: number): string => {
    return `${age} years old`
  },

  gender: (gender: Gender): string => {
    switch (gender) {
      case "prefer-not-to-say":
        return "Prefer not to say"
      case "non-binary":
        return "Non-binary"
      default:
        return gender.charAt(0).toUpperCase() + gender.slice(1)
    }
  },
}

// Validation functions
export const validateBiometrics = {
  age: (age: number): boolean => {
    return age >= 0 && age <= 150
  },

  weight: (value: number, unit: WeightUnit): boolean => {
    if (value <= 0 || value > 999.99) return false

    // Additional sanity checks
    const kgValue = convertWeight.toKg(value, unit)
    return kgValue >= 1 && kgValue <= 650 // Reasonable human weight range
  },

  height: (value: number, unit: HeightUnit): boolean => {
    if (value <= 0 || value > 999.99) return false

    // Additional sanity checks
    const cmValue = convertHeight.toCm(value, unit)
    return cmValue >= 30 && cmValue <= 300 // Reasonable human height range (1ft to 10ft)
  },

  gender: (gender: string): gender is Gender => {
    const validGenders: Gender[] = [
      "male",
      "female",
      "non-binary",
      "prefer-not-to-say",
      "other",
    ]
    return validGenders.includes(gender as Gender)
  },
}

// Helper functions for forms
export const biometricHelpers = {
  // Get unit conversion suggestions
  getConversionSuggestion: (
    value: number,
    currentUnit: WeightUnit | HeightUnit
  ): string => {
    if (currentUnit === "kg") {
      const lbs = convertWeight.kgToLbs(value)
      return `≈ ${Math.round(lbs * 10) / 10} lbs`
    }
    if (currentUnit === "lbs") {
      const kg = convertWeight.lbsToKg(value)
      return `≈ ${Math.round(kg * 10) / 10} kg`
    }
    if (currentUnit === "cm") {
      const inches = convertHeight.cmToInches(value)
      return `≈ ${Math.round(inches * 10) / 10} in`
    }
    if (currentUnit === "in") {
      const cm = convertHeight.toCm(value, currentUnit)
      return `≈ ${Math.round(cm * 10) / 10} cm`
    }
    return ""
  },
}

// Examples for documentation:
/*
USAGE EXAMPLES:

// Converting between units:
const weightInKg = convertWeight.toKg(150, "lbs") // 68.04 kg
const heightInCm = convertHeight.toCm(70, "in") // 177.8 cm

// Validating inputs:
const isValidWeight = validateBiometrics.weight(150, "lbs") // true
const isValidHeight = validateBiometrics.height(70, "in") // true

// Formatting for display:
const weightDisplay = formatBiometrics.weight(68.04, "kg") // "68.04 kg"
const heightDisplay = formatBiometrics.height(177.8, "cm") // "177.8 cm"

// Getting conversion suggestions:
const suggestion = biometricHelpers.getConversionSuggestion(70, "in") // "≈ 177.8 cm"
*/
