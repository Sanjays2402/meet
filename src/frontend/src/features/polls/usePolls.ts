import { useCallback, useEffect } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { RemoteParticipant, RoomEvent } from 'livekit-client'
import { applyPollMessage } from './store'
import { MAX_POLL_OPTIONS, POLL_TOPIC, PollMessage } from './types'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

/** Subscribe to poll messages for the lifetime of the calling component. */
export const usePollsListener = () => {
  const room = useRoomContext()

  useEffect(() => {
    const onData = (
      payload: Uint8Array,
      participant?: RemoteParticipant,
      _kind?: unknown,
      topic?: string
    ) => {
      if (topic !== POLL_TOPIC || !participant) return
      try {
        const message = JSON.parse(decoder.decode(payload)) as PollMessage
        if (message.type === 'create') {
          const { poll } = message
          if (
            typeof poll?.question !== 'string' ||
            !Array.isArray(poll.options) ||
            poll.options.length > MAX_POLL_OPTIONS ||
            !poll.options.every((o) => typeof o === 'string')
          )
            return
        }
        applyPollMessage(message, participant.identity, false)
      } catch {
        // ignore malformed payloads
      }
    }
    room.on(RoomEvent.DataReceived, onData)
    return () => {
      room.off(RoomEvent.DataReceived, onData)
    }
  }, [room])
}

export const usePolls = () => {
  const room = useRoomContext()

  const send = useCallback(
    async (message: PollMessage) => {
      applyPollMessage(message, room.localParticipant.identity, true)
      await room.localParticipant.publishData(
        encoder.encode(JSON.stringify(message)),
        { reliable: true, topic: POLL_TOPIC }
      )
    },
    [room]
  )

  const createPoll = (question: string, options: string[]) =>
    send({
      type: 'create',
      poll: {
        id: crypto.randomUUID(),
        question,
        options,
        creatorIdentity: room.localParticipant.identity,
        creatorName:
          room.localParticipant.name || room.localParticipant.identity,
      },
    })

  const vote = (pollId: string, option: number) =>
    send({ type: 'vote', pollId, option })

  const closePoll = (pollId: string) => send({ type: 'close', pollId })

  return {
    createPoll,
    vote,
    closePoll,
    localIdentity: room.localParticipant.identity,
  }
}
