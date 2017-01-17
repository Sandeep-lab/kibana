import React from 'react';
import _ from 'lodash';
import { connect } from 'react-redux';
import classnames from 'classnames';

import LeftSidebar from 'plugins/rework/components/left_sidebar/left_sidebar';
import EditorToggle from 'plugins/rework/components/editor_toggle/editor_toggle';
import Centered from 'plugins/rework/components/centered/centered';
import PageControl from 'plugins/rework/components/page_control/page_control';
import Workpad from 'plugins/rework/components/workpad/workpad';
import Stack from 'plugins/rework/components/stack/stack';
import Page from 'plugins/rework/components/page/page';
import Positionable from 'plugins/rework/components/positionable/positionable';
import Element from 'plugins/rework/components/element/element';

import ElementWrapper from 'plugins/rework/containers/element_wrapper/element_wrapper';
import ElementEditor from 'plugins/rework/containers/element_editor/element_editor';


import { editorToggle } from 'plugins/rework/state/actions/editor';
import { pageNext, pagePrevious } from 'plugins/rework/state/actions/page';
import { elementSelect, elementTop, elementLeft, elementHeight, elementWidth, elementAngle } from 'plugins/rework/state/actions/element';

import './workspace.less';

const Workspace = React.createClass({
  select(id) {
    return (e) => {
      e.stopPropagation();
      const {dispatch} = this.props;
      dispatch(elementSelect(id));
    };
  },
  resizeMove(id) {
    return (e) => {
      const {dispatch} = this.props;
      const {top, left, height, width} = e.interaction.absolute;

      dispatch(elementTop(id, top));
      dispatch(elementLeft(id, left));
      dispatch(elementHeight(id, height));
      dispatch(elementWidth(id, width));
    };
  },
  rotate(id) {
    return (e) => {
      const {dispatch} = this.props;
      const {angle} = e.interaction.absolute;
      dispatch(elementAngle(id, angle));
    };
  },
  do(action) {
    const {dispatch} = this.props;
    return () => dispatch(action());
  },
  render() {
    const  {workpad, pages, elements, dataframes, editor, resolvedArgs, selectedElement} = this.props;
    const {resizeMove, rotate, select} = this;
    const currentElement = elements[selectedElement];

    // TODO: This entire thing can be broken up into smaller containers.
    // But for now, its actually *more* readable this way.
    return (
      <div className="rework--workspace">
        <LeftSidebar>

          {!editor ? null : (
            <div className="rework--editor--left">
              <ElementEditor element={currentElement}></ElementEditor>
            </div>
          )}

          <div className="rework--editor-toggle--left">
            <EditorToggle toggle={this.do(editorToggle)} status={editor}></EditorToggle>
          </div>
        </LeftSidebar>

        <Centered onMouseDown={this.select(null)}>
          <PageControl direction='previous' handler={this.do(pagePrevious)}></PageControl>
          <Workpad workpad={workpad}>
              <Stack top={workpad.page}>
                {workpad.pages.map((pageId) => {
                  const page = pages[pageId];
                  return (
                    <Page key={pageId} page={page}>
                      {page.elements.map((elementId) => {
                        const element = elements[elementId];
                        const selected = elementId === selectedElement ? true : false;
                        const position = _.pick(element, ['top', 'left', 'height', 'width', 'angle']);

                        // This is really gross because it doesn't actually wrap the element.
                        // Rather you end up with a bunch of 0 height divs stacked at the top
                        // of the page. Ew.
                        const wrapperClasses = classnames({
                          'rework--workspace-element-header': true,
                          'rework--workspace-element-header-selected': selected,
                        });
                        return (
                          <div key={elementId} className={wrapperClasses}>
                            <ElementWrapper id={elementId} args={element.args}>
                              <Positionable
                                position={position}
                                move={resizeMove(elementId)}
                                resize={resizeMove(elementId)}
                                rotate={rotate(elementId)}>
                                  <Element type={element.type} args={resolvedArgs[elementId]}></Element>
                              </Positionable>
                            </ElementWrapper>

                          </div>
                        );
                      })}
                    </Page>
                  );
                })}
              </Stack>
          </Workpad>
          <PageControl direction='next' handler={this.do(pageNext)}></PageControl>
        </Centered>
      </div>
    );
  }
});

function mapStateToProps(state) {
  return {
    editor: state.transient.editor,
    workpad: state.persistent.workpad,
    pages: state.persistent.pages,
    elements: state.persistent.elements,
    resolvedArgs: state.transient.resolvedArgs,
    selectedElement: state.transient.selectedElement
  };
}

export default connect(mapStateToProps)(Workspace);
