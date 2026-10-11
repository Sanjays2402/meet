import { FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSnapshot } from 'valtio'
import { Button, Div, Text } from '@/primitives'
import { css } from '@/styled-system/css'
import { pollsStore } from './store'
import { usePolls } from './usePolls'
import { MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from './types'

const inputClass = css({
  width: '100%',
  border: '1px solid',
  borderColor: 'box.border',
  borderRadius: 4,
  padding: '0.5rem 0.75rem',
})

const CreatePoll = ({ onDone }: { onDone: () => void }) => {
  const { t } = useTranslation('rooms', { keyPrefix: 'polls' })
  const { createPoll } = usePolls()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])

  const cleaned = options.map((o) => o.trim()).filter(Boolean)
  const canSubmit = question.trim() !== '' && cleaned.length >= MIN_POLL_OPTIONS

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    await createPoll(question.trim(), cleaned)
    onDone()
  }

  return (
    <form
      onSubmit={onSubmit}
      className={css({
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      })}
    >
      <input
        className={inputClass}
        value={question}
        maxLength={200}
        placeholder={t('questionPlaceholder')}
        aria-label={t('questionPlaceholder')}
        onChange={(e) => setQuestion(e.target.value)}
      />
      {options.map((value, i) => (
        <input
          key={i}
          className={inputClass}
          value={value}
          maxLength={100}
          placeholder={t('optionPlaceholder', { number: i + 1 })}
          aria-label={t('optionPlaceholder', { number: i + 1 })}
          onChange={(e) =>
            setOptions(options.map((o, j) => (j === i ? e.target.value : o)))
          }
        />
      ))}
      <div className={css({ display: 'flex', gap: '0.5rem' })}>
        {options.length < MAX_POLL_OPTIONS && (
          <Button
            variant="secondaryText"
            size="sm"
            onPress={() => setOptions([...options, ''])}
          >
            {t('addOption')}
          </Button>
        )}
        <Button variant="secondaryText" size="sm" onPress={onDone}>
          {t('cancel')}
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          isDisabled={!canSubmit}
        >
          {t('launch')}
        </Button>
      </div>
    </form>
  )
}

export const PollsPanel = () => {
  const { t } = useTranslation('rooms', { keyPrefix: 'polls' })
  const { polls } = useSnapshot(pollsStore)
  const { vote, closePoll, localIdentity } = usePolls()
  const [creating, setCreating] = useState(false)

  return (
    <Div
      display="flex"
      flexDirection="column"
      overflowY="auto"
      padding="0 1rem 1rem"
      flexGrow={1}
      gap={0.75}
    >
      {creating ? (
        <CreatePoll onDone={() => setCreating(false)} />
      ) : (
        <Button variant="primary" size="sm" onPress={() => setCreating(true)}>
          {t('create')}
        </Button>
      )}
      {polls.length === 0 && !creating && (
        <Text variant="note" wrap="balance">
          {t('empty')}
        </Text>
      )}
      {polls.map((poll) => {
        const total = Object.keys(poll.votes).length
        const mine = poll.votes[localIdentity]
        return (
          <section
            key={poll.id}
            aria-label={poll.question}
            className={css({
              border: '1px solid',
              borderColor: 'box.border',
              borderRadius: 8,
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            })}
          >
            <Text
              as="h2"
              margin={false}
              className={css({ fontWeight: 'semibold' })}
            >
              {poll.question}
            </Text>
            <Text variant="smNote" margin={false}>
              {t('by', { name: poll.creatorName })} ·{' '}
              {t('votes', { count: total })}
              {poll.closed && ` · ${t('closed')}`}
            </Text>
            {poll.options.map((option, i) => {
              const count = Object.values(poll.votes).filter(
                (v) => v === i
              ).length
              const pct = total ? Math.round((count / total) * 100) : 0
              return (
                <button
                  key={i}
                  type="button"
                  disabled={poll.closed}
                  aria-pressed={mine === i}
                  onClick={() => vote(poll.id, i)}
                  className={css({
                    position: 'relative',
                    textAlign: 'start',
                    padding: '0.5rem 0.75rem',
                    border: '1px solid',
                    borderColor: mine === i ? 'primary.800' : 'box.border',
                    borderRadius: 4,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    _disabled: { cursor: 'default' },
                  })}
                >
                  <span
                    aria-hidden="true"
                    className={css({
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'primary.50',
                    })}
                    style={{ width: `${pct}%` }}
                  />
                  <span
                    className={css({
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    })}
                  >
                    <span>{option}</span>
                    <span>
                      {count} · {pct}%
                    </span>
                  </span>
                </button>
              )
            })}
            {!poll.closed && poll.creatorIdentity === localIdentity && (
              <Button
                variant="secondaryText"
                size="sm"
                onPress={() => closePoll(poll.id)}
              >
                {t('close')}
              </Button>
            )}
          </section>
        )
      })}
    </Div>
  )
}
