import { pinyin } from 'pinyin-pro'

const CHINESE_CHAR_REGEX = /[\u3400-\u9fff]/u

function normalizeSearchText(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim()
}

function compactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/\s+/g, '')
}

function addSearchTerm(terms: Set<string>, value: string): void {
  const normalizedValue = normalizeSearchText(value)
  if (!normalizedValue) {
    return
  }

  terms.add(normalizedValue)

  const compactValue = normalizedValue.replace(/\s+/g, '')
  if (compactValue && compactValue !== normalizedValue) {
    terms.add(compactValue)
  }
}

function getPinyinSearchTerms(value: string): string[] {
  if (!CHINESE_CHAR_REGEX.test(value)) {
    return []
  }

  const fullPinyin = pinyin(value, {
    toneType: 'none',
    type: 'array',
  }) as string[]
  const initials = pinyin(value, {
    pattern: 'first',
    toneType: 'none',
    type: 'array',
  }) as string[]

  return [
    fullPinyin.join(' '),
    fullPinyin.join(''),
    initials.join(' '),
    initials.join(''),
  ]
}

export function buildSearchTerms(
  ...values: Array<string | null | undefined>
): string[] {
  const terms = new Set<string>()

  for (const rawValue of values) {
    const value = rawValue?.trim()
    if (!value) {
      continue
    }

    addSearchTerm(terms, value)

    for (const pinyinTerm of getPinyinSearchTerms(value)) {
      addSearchTerm(terms, pinyinTerm)
    }
  }

  return Array.from(terms)
}

export function matchesSearchQuery(
  query: string,
  ...values: Array<string | null | undefined>
): boolean {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) {
    return true
  }

  const queryVariants = new Set(
    [normalizedQuery, compactSearchText(normalizedQuery)].filter(Boolean),
  )

  const searchTerms = buildSearchTerms(...values)
  return searchTerms.some((term) =>
    Array.from(queryVariants).some((queryVariant) =>
      term.includes(queryVariant),
    ),
  )
}
