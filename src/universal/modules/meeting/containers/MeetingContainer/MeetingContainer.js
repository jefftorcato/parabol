import React, {Component, PropTypes} from 'react';
import {connect} from 'react-redux';
import {cashay} from 'cashay';
import subscriber from 'universal/subscriptions/subscriber';
import socketWithPresence from 'universal/decorators/socketWithPresence/socketWithPresence';

import MeetingLayout from 'universal/modules/meeting/components/MeetingLayout/MeetingLayout';
import MeetingCheckinLayout from 'universal/modules/meeting/components/MeetingCheckinLayout/MeetingCheckinLayout';
import MeetingLobbyLayout from 'universal/modules/meeting/components/MeetingLobbyLayout/MeetingLobbyLayout';
import MeetingUpdatesLayout from 'universal/modules/meeting/components/MeetingUpdatesLayout/MeetingUpdatesLayout';
import Sidebar from 'universal/modules/team/components/Sidebar/Sidebar';

import {
  meetingSubString,
  meetingSubOptions,
  teamQueryString,
  teamQueryOptions
} from './cashayHelpers';

/**
 * MeetingContainer
 *
 * We make action meetings happen.
 *
 * At it's most fundamental, you can think of many of the phases of an
 * action meeting as set of list transformations:
 *
 * Check-In:
 *   [team member, ...] -> [check-in status, ...]
 * Project Updates:
 *   [team member, ...] -> [updated project, ...]
 * Agenda processing:
 *   [agenda item, ...] -> [new project/action, ...]
 *
 */

const mapStateToProps = (state, props) => {
  const {params: {teamId}} = props;
  return {
    authToken: state.authToken,
    meetingSub: cashay.subscribe(meetingSubString, subscriber, meetingSubOptions(teamId)),
    members: state.members,
    team: cashay.query(teamQueryString, teamQueryOptions(teamId)).data.team,
  };
};

@socketWithPresence
@connect(mapStateToProps)
export default class MeetingContainer extends Component {
  static propTypes = {
    authToken: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    meetingSub: PropTypes.object.isRequired,
    params: PropTypes.shape({
      teamId: PropTypes.string.isRequired
    }).isRequired,
    presenceSub: PropTypes.object.isRequired,
    team: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    /**
     * For now, I'm sketching everything out as state on this container
     * until I figure out where it goes (cashay, redux-form, redux, state)...
     */
    this.state = {
      members: [],
      checkins: [],
      phase: 'lobby'
    };
  }

  componentWillReceiveProps(nextProps) {
    const {teamMembers} = nextProps.team;
    const {presence} = nextProps.presenceSub.data;
    this.setMembersState(teamMembers, presence);
    this.setCheckinsState();
  }

  onCheckinNextTeammateClick = () => {
    this.setState({ phase: 'updates' });
  }

  onStartMeetingClick = () => {
    this.setState({ phase: 'checkin' });
  }

  setCheckinsState() {
    const {
      checkins: stateCheckins,
      members: stateMembers
    } = this.state;
    const checkins = [];

    stateMembers.forEach((member) => {
      const existingCheckin = stateCheckins.find(m => m.id === member.id);
      if (!existingCheckin) {
        // Create new checkin state:
        checkins.push({
          id: member.id,
          state: 'invited',
          isCurrent: false
        });
      } else {
        checkins.push(existingCheckin);
      }
    });

    this.setState({ checkins });
  }

  setMembersState(teamMembers, presence) {
    const {members: stateMembers} = this.state;
    const members = [];

    teamMembers.forEach((teamMember) => {
      const {cachedUser: {id: userId}} = teamMember;
      const existingMember = stateMembers.find(m => m.id === userId);
      const onlinePresence = presence.find(con => con.userId === userId) ?
        'online' : 'offline';
      if (!existingMember) {
        // Create new member:
        members.push({
          id: teamMember.cachedUser.id,
          connection: onlinePresence,
          hasBadge: false,
          image: teamMember.cachedUser.picture,
          name: teamMember.cachedUser.profile.preferredName,
          size: 'small'
        });
      } else {
        // Update online status of existing members:
        members.push({
          ...existingMember,
          connection: onlinePresence
        });
      }
    });

    this.setState({ members });
  }

  render() {
    const {checkins, members, phase} = this.state;
    const {team} = this.props;
    const {teamId} = this.props.params;

    const shortUrl = `https://prbl.io/m/${teamId}`;

    return (
      <MeetingLayout>
        <Sidebar
          facilitatorLocation={phase}
          location={phase}
          shortUrl={shortUrl}
          teamName={team.name}
          members={members}
        />
        {phase === 'lobby' &&
          <MeetingLobbyLayout
            members={members}
            onStartMeetingClick={this.onStartMeetingClick}
            shortUrl={shortUrl}
            teamName={team.name}
          />
        }
        {phase === 'checkin' &&
          <MeetingCheckinLayout
            checkins={checkins}
            members={members}
            onCheckinNextTeammateClick={this.onCheckinNextTeammateClick}
          />
        }
        {phase === 'updates' &&
          <MeetingUpdatesLayout
            members={members}
          />
        }
      </MeetingLayout>
    );
  }
}
