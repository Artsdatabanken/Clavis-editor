import React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

export function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: props.id});
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: "0.25em",
  };

  const Element = props.render || 'div';
  const l = props.id;
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DragIndicatorIcon  style={{fontSize: "1em"}} />
      {Element(l)}
    </div>
  );
}