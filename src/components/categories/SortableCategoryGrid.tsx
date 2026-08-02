'use client';

import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CategoryIcon } from '@/components/categories/CategoryIcon';
import type { CategoryOption } from '@/hooks/useCategories';

interface SortableCategoryGridProps {
  categories: CategoryOption[];
  onReorder: (categories: CategoryOption[]) => void;
  onSelect: (category: CategoryOption) => void;
  editMode: boolean;
}

function GridCell({ category, editMode, onSelect }: { category: CategoryOption; editMode: boolean; onSelect: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.name });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...(editMode ? { ...attributes, ...listeners } : {})}
      onClick={() => !editMode && onSelect()}
      className={`flex flex-col items-center gap-2 relative transition-all duration-150 touch-none ${
        isDragging ? 'opacity-50 z-10 scale-105' : 'opacity-100'
      } ${editMode ? 'animate-[wiggle_0.25s_ease-in-out_infinite]' : 'active:scale-95'} ${!category.is_active ? 'opacity-40' : ''}`}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-sm"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <CategoryIcon name={category.icon} color={category.color} size={22} />
      </div>
      <span className="text-[10px] text-center font-medium leading-tight line-clamp-2">{category.name}</span>
    </button>
  );
}

export function SortableCategoryGrid({ categories, onReorder, onSelect, editMode }: SortableCategoryGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex(c => c.name === active.id);
    const newIndex = categories.findIndex(c => c.name === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(categories, oldIndex, newIndex));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={categories.map(c => c.name)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-4 gap-3">
          {categories.map(category => (
            <GridCell key={category.name} category={category} editMode={editMode} onSelect={() => onSelect(category)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
