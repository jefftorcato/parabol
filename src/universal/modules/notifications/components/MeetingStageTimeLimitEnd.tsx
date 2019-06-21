import {MeetingStageTimeLimitEnd_notification} from '__generated__/MeetingStageTimeLimitEnd_notification.graphql'
import React from 'react'
import styled from 'react-emotion'
import {createFragmentContainer, graphql} from 'react-relay'
import IconAvatar from 'universal/components/IconAvatar/IconAvatar'
import RaisedButton from 'universal/components/RaisedButton'
import Row from 'universal/components/Row/Row'
import ui from 'universal/styles/ui'
import NotificationButton from './NotificationButton'
import NotificationMessage from './NotificationMessage'
import useRouter from 'universal/hooks/useRouter'
import {meetingTypeToLabel, meetingTypeToSlug} from 'universal/utils/meetings/lookups'
import AcknowledgeButton from 'universal/modules/notifications/components/AcknowledgeButton/AcknowledgeButton'
import useMutationProps from 'universal/hooks/useMutationProps'
import NotificationErrorMessage from 'universal/modules/notifications/components/NotificationErrorMessage'
import useAtmosphere from 'universal/hooks/useAtmosphere'
import ClearNotificationMutation from 'universal/mutations/ClearNotificationMutation'

interface Props {
  notification: MeetingStageTimeLimitEnd_notification
}

const StyledButton = styled(RaisedButton)({...ui.buttonBlockStyles})

const MeetingStageTimeLimitEnd = (props: Props) => {
  const {notification} = props
  const {history} = useRouter()
  const {id: notificationId, meeting} = notification
  const {meetingType, team} = meeting
  const {id: teamId, name: teamName} = team
  const meetingLabel = meetingTypeToLabel[meetingType]
  const {error, submitMutation, onCompleted, onError, submitting} = useMutationProps()
  const atmosphere = useAtmosphere()
  const goThere = () => {
    const meetingSlug = meetingTypeToSlug[meetingType]
    history.push(`/${meetingSlug}/${teamId}`)
  }

  const acknowledge = () => {
    if (submitting) return
    submitMutation()
    ClearNotificationMutation(atmosphere, notificationId, onError, onCompleted)
  }

  return (
    <>
      <Row>
        <IconAvatar icon='group' size='small' />
        <NotificationMessage>
          {'Your '}
          <b>{meetingLabel}</b>
          {' meeting for '}
          <b>{teamName}</b>
          {' is ready to move forward!'}
        </NotificationMessage>
        <NotificationButton>
          <StyledButton
            aria-label='Go to meeting'
            size={ui.notificationButtonSize}
            onClick={goThere}
            palette='warm'
          >
            {'Go to Meeting'}
          </StyledButton>
        </NotificationButton>
        <AcknowledgeButton onClick={acknowledge} waiting={submitting} />
      </Row>
      <NotificationErrorMessage error={error} />
    </>
  )
}

export default createFragmentContainer(
  MeetingStageTimeLimitEnd,
  graphql`
    fragment MeetingStageTimeLimitEnd_notification on NotificationMeetingStageTimeLimitEnd {
      id
      meeting {
        meetingType
        team {
          id
          name
        }
      }
    }
  `
)