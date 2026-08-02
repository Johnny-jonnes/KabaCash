'use client';

import { ReactNode } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface SortableCardListProps {
  order: string[];
  onOrderChange: (order: string[]) => void;
  renderCard: (id: string) => ReactNode | null;
  /** Mode réorganisation : affiche les poignées de glisser-déposer. */
  editMode: boolean;
}

function SortableItem({ id, children, editMode }: { id: string; children: ReactNode; editMode: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative transition-opacity duration-200 ${isDragging ? 'opacity-50 z-20' : 'opacity-100'}`}>
      {editMode && (
        <button
          {...attributes}
          {...listeners}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-lg bg-card border border-border text-muted-foreground shadow-sm touch-none cursor-grab active:cursor-grabbing animate-in fade-in zoom-in-95 duration-150"
          aria-label="Réorganiser cette carte"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
      )}
      <div className={editMode ? 'pl-5 transition-[padding] duration-150' : ''}>{children}</div>
    </div>
  );
}

/** Liste de cartes réordonnables par glisser-déposer, avec persistance de l'ordre déléguée à l'appelant (uiStore). */
export function SortableCardList({ order, onOrderChange, renderCard, editMode }: SortableCardListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  const items = order
    .map(id => ({ id, content: renderCard(id) }))
    .filter((item): item is { id: string; content: ReactNode } => item.content !== null);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map(i => i.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    // On ne réordonne que les entrées visibles, en conservant la position des entrées masquées dans le tableau complet
    const reorderedVisible = arrayMove(ids, oldIndex, newIndex);
    const result: string[] = [];
    let cursor = 0;
    for (const id of order) {
      if (ids.includes(id)) {
        result.push(reorderedVisible[cursor]);
        cursor++;
      } else {
        result.push(id);
      }
    }
    onOrderChange(result);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-5">
          {items.map(({ id, content }) => (
            <SortableItem key={id} id={id} editMode={editMode}>
              {content}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
