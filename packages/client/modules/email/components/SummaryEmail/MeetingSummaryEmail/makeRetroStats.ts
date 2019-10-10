import {RETRO_TOPIC_LABEL} from '../../../../../utils/constants'
import plural from '../../../../../utils/plural'

interface Meeting {
  reflectionGroups: {
    reflections: {
      id: string
    }[]
    voteCount: number
  }[]
  meetingMembers: {
    isCheckedIn: boolean | null
    tasks: {
      id: string
    }[]
  }[]
}

const makeRetroStats = (meeting: Meeting) => {
  const {meetingMembers, reflectionGroups} = meeting

  const reflectionCount = reflectionGroups.reduce(
    (sum, {reflections}) => sum + reflections.length,
    0
  )
  const topicCount = reflectionGroups.length
  const newTaskCount = meetingMembers.reduce((sum, {tasks}) => sum + tasks.length, 0)
  const meetingMembersCount = meetingMembers.length
  const meetingMembersPresentCount = meetingMembers.filter((member) => member.isCheckedIn === true)
    .length
  const memberCount =
    meetingMembersPresentCount >= 10
      ? meetingMembersPresentCount
      : `${meetingMembersPresentCount}/${meetingMembersCount}`
  return [
    {value: reflectionCount, label: plural(reflectionCount, 'Reflection')},
    {
      value: topicCount,
      label: plural(topicCount, `${RETRO_TOPIC_LABEL}`)
    },
    {value: newTaskCount, label: plural(newTaskCount, 'New Task')},
    {value: memberCount, label: 'Present'}
  ]
}

export default makeRetroStats
