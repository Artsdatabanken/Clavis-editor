import React from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';
import { reorder } from '../Utils';

function SortableList(props) {

  let items = props.items || [];
  let setItems = props.setItems;
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map(l => <SortableItem render={l.render} key={l.id} id={l.id} />)}
      </SortableContext>
    </DndContext>
  );
  
  function handleDragEnd(event) {
    const {active, over} = event;
    
    if (active.id !== over.id) {
      const overIndex = items.findIndex(l => l.id === over.id);
      const activeIndex = items.findIndex(l => l.id === active.id);

      items = reorder(items, activeIndex, overIndex);
      setItems(items.map(l => l.id));
    }
  }
}

export default SortableList;