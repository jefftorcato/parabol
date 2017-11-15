import {cashay} from 'cashay';
import {convertToRaw, EditorState} from 'draft-js';
import {Set} from 'immutable';
import PropTypes from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {createFragmentContainer} from 'react-relay';
import editorDecorators from 'universal/components/ProjectEditor/decorators';
import withAtmosphere from 'universal/decorators/withAtmosphere/withAtmosphere';
import OutcomeCard from 'universal/modules/outcomeCard/components/OutcomeCard/OutcomeCard';
import DeleteProjectMutation from 'universal/mutations/DeleteProjectMutation';
import UpdateProjectMutation from 'universal/mutations/UpdateProjectMutation';
import getRelaySafeProjectId from 'universal/utils/getRelaySafeProjectId';
import mergeServerContent from 'universal/utils/mergeServerContent';

const teamMembersQuery = `
query {
  teamMembers(teamId: $teamId) @live {
    id
    picture
    preferredName
  }
}
`;

const mapStateToProps = (state, props) => {
  // TODO ugly patch until we remove cashay
  const relaySafeId = getRelaySafeProjectId(props.project.id);
  const [teamId] = relaySafeId.split('::');
  const {teamMembers} = cashay.query(teamMembersQuery, {
    op: 'outcomeCardContainer',
    key: teamId,
    variables: {teamId}
  }).data;
  return {
    teamMembers
  };
};

@connect(mapStateToProps)
class OutcomeCardContainer extends Component {
  constructor(props) {
    super(props);
    const {contentState} = props;
    this.state = {
      activeEditingComponents: Set(),
      cardHasHover: false,
      cardHasFocus: false,
      editorState: EditorState.createWithContent(contentState, editorDecorators),
      cardHasMenuOpen: false
    };
  }

  componentWillMount() {
    this._mounted = true;
  }

  componentWillReceiveProps(nextProps) {
    const {contentState: nextContentState} = nextProps;
    const {contentState: initialContentState} = this.props;
    if (initialContentState !== nextContentState) {
      const {editorState} = this.state;
      const newContentState = mergeServerContent(editorState, nextContentState);
      const newEditorState = EditorState.push(editorState, newContentState, 'insert-characters');
      this.setEditorState(newEditorState);
    }

    if (!this.props.isDragging && nextProps.isDragging) {
      this.handleCardUpdate();
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const curEditingComponents = this.state.activeEditingComponents;
    const prevEditingComponents = prevState.activeEditingComponents;
    if (curEditingComponents.isEmpty() !== prevEditingComponents.isEmpty()) {
      this.announceEditing(!curEditingComponents.isEmpty());
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  setEditorState = (editorState) => {
    const wasFocused = this.state.editorState.getSelection().getHasFocus();
    const isFocused = editorState.getSelection().getHasFocus();
    if (wasFocused !== isFocused) {
      this.trackEditingComponent('project-editor', isFocused);
      if (!isFocused) {
        this.handleCardUpdate();
      }
    }
    this.setState({
      editorState
    });
  };

  setEditorRef = (c) => {
    this.setState({
      editorRef: c
    });
  };

  trackEditingComponent = (uid, isEditing) => {
    this.setState((curState) => {
      const currentClients = curState.activeEditingComponents;
      const updatedClients = isEditing
        ? currentClients.add(uid)
        : currentClients.remove(uid);
      return {activeEditingComponents: updatedClients};
    });
  };

  toggleMenuState = () => {
    if (this._mounted) {
      this.setState({
        cardHasMenuOpen: !this.state.cardHasMenuOpen
      });
    }
  };

  handleCardUpdate = () => {
    const {cardHasMenuOpen, cardHasFocus, editorState} = this.state;
    const {area, atmosphere, project: {id: projectId, team: {id: teamId}}, contentState: initialContentState} = this.props;
    const contentState = editorState.getCurrentContent();
    if (!cardHasFocus && !contentState.hasText() && !cardHasMenuOpen) {
      // it's possible the user calls update, then delete, then the update timeout fires, so clear it here
      clearTimeout(this.updateTimer);
      DeleteProjectMutation(atmosphere, projectId, teamId);
    } else if (initialContentState !== contentState) {
      clearTimeout(this.updateTimer);
      this.updateTimer = setTimeout(() => {
        const updatedProject = {
          id: projectId,
          content: JSON.stringify(convertToRaw(contentState))
        };
        UpdateProjectMutation(atmosphere, updatedProject, area);
        this.updateTimer = undefined;
      }, 15);
    }
  };

  handleCardMouseEnter = () => this.setState({cardHasHover: true});
  handleCardMouseLeave = () => this.setState({cardHasHover: false});

  handleCardBlur = (e) => {
    const cb = !e.currentTarget.contains(e.relatedTarget) ? this.handleCardUpdate : undefined;
    this.setState({cardHasFocus: false}, cb);
  };

  handleCardFocus = () => this.setState({cardHasFocus: true});

  announceEditing = (isEditing) => {
    const {project: {id: projectId}} = this.props;
    const [teamId] = projectId.split('::');
    cashay.mutate('edit', {
      variables: {
        teamId,
        editing: isEditing ? `Task::${projectId}` : null
      }
    });
  };

  render() {
    const {activeEditingComponents, cardHasFocus, cardHasHover, cardHasMenuOpen, editorRef, editorState} = this.state;
    const {area, handleAddProject, hasDragStyles, isAgenda, project, teamMembers, isDragging} = this.props;
    return (
      <div
        tabIndex={-1}
        style={{outline: 'none'}}
        ref={(c) => {
          this.ref = c;
        }}
        onBlur={this.handleCardBlur}
        onFocus={this.handleCardFocus}
        onMouseEnter={this.handleCardMouseEnter}
        onMouseLeave={this.handleCardMouseLeave}
      >
        <OutcomeCard
          area={area}
          editorRef={editorRef}
          editorState={editorState}
          cardHasHover={cardHasHover}
          cardHasFocus={cardHasFocus}
          cardHasMenuOpen={cardHasMenuOpen}
          handleAddProject={handleAddProject}
          hasDragStyles={hasDragStyles}
          isAgenda={isAgenda}
          isDragging={isDragging}
          isEditing={!activeEditingComponents.isEmpty()}
          project={project}
          setEditorRef={this.setEditorRef}
          setEditorState={this.setEditorState}
          trackEditingComponent={this.trackEditingComponent}
          teamMembers={teamMembers}
          toggleMenuState={this.toggleMenuState}
        />
      </div>
    );
  }
}

OutcomeCardContainer.propTypes = {
  area: PropTypes.string,
  atmosphere: PropTypes.object.isRequired,
  contentState: PropTypes.object.isRequired,
  handleAddProject: PropTypes.func,
  project: PropTypes.object.isRequired,
  hasDragStyles: PropTypes.bool,
  isAgenda: PropTypes.bool,
  isDragging: PropTypes.bool,
  teamMembers: PropTypes.array
};

export default createFragmentContainer(
  withAtmosphere(OutcomeCardContainer),
  graphql`
    fragment OutcomeCardContainer_project on Project {
      id
      team {
        id
      }
      ...OutcomeCard_project
    }`
);
