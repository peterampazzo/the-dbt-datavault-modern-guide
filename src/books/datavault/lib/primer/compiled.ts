import source from './compiled.json?raw'

export interface CompiledPrimerStep {
  id: string
  label: string
  setupSql: string[]
  dbtSql: string[]
  checkSql: string
}

export interface CompiledPrimer {
  dbtVersion: string
  adapterVersion: string
  steps: CompiledPrimerStep[]
}

export const compiledPrimer = JSON.parse(source) as CompiledPrimer
