import { proxy } from 'valtio'
import { Poll, PollMessage } from './types'

type State = {
  polls: Poll[]
  unread: number
}

export const pollsStore = proxy<State>({ polls: [], unread: 0 })

/**
 * Apply a poll message coming from `senderIdentity`. The sender identity is
 * the one provided by LiveKit, never trusted from the payload.
 */
export const applyPollMessage = (
  message: PollMessage,
  senderIdentity: string,
  isLocal: boolean
) => {
  switch (message.type) {
    case 'create': {
      if (pollsStore.polls.some((p) => p.id === message.poll.id)) return
      pollsStore.polls.unshift({
        ...message.poll,
        creatorIdentity: senderIdentity,
        closed: false,
        votes: {},
      })
      if (!isLocal) pollsStore.unread += 1
      return
    }
    case 'vote': {
      const poll = pollsStore.polls.find((p) => p.id === message.pollId)
      if (!poll || poll.closed) return
      if (
        !Number.isInteger(message.option) ||
        message.option < 0 ||
        message.option >= poll.options.length
      )
        return
      poll.votes[senderIdentity] = message.option
      return
    }
    case 'close': {
      const poll = pollsStore.polls.find((p) => p.id === message.pollId)
      if (poll && poll.creatorIdentity === senderIdentity) poll.closed = true
      return
    }
  }
}
