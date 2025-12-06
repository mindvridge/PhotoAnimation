'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, Trash2, ZoomIn, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Database } from '@/types/database';

type Photo = Database['public']['Tables']['photos']['Row'];

interface PhotoGridProps {
  photos: Photo[];
  onReorder: (photoIds: string[]) => void;
  onDelete: (photoId: string) => void;
  onPreview: (photo: Photo) => void;
}

interface SortablePhotoItemProps {
  photo: Photo;
  index: number;
  onDelete: (photoId: string) => void;
  onPreview: (photo: Photo) => void;
}

function SortablePhotoItem({ photo, index, onDelete, onPreview }: SortablePhotoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // 애니메이션 실패 여부 체크
  const hasWarning = photo.animation_status === 'failed';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative aspect-square overflow-hidden rounded-xl border-2 bg-gray-100 transition-all dark:bg-gray-800',
        isDragging
          ? 'z-50 scale-105 border-rose-400 shadow-xl'
          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
      )}
    >
      {/* 이미지 */}
      <img
        src={photo.original_url}
        alt={`사진 ${index + 1}`}
        className="h-full w-full object-cover"
        loading="lazy"
      />

      {/* 순서 번호 */}
      <div className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">
        {index + 1}
      </div>

      {/* 경고 아이콘 */}
      {hasWarning && (
        <div className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white">
          <AlertTriangle className="h-4 w-4" />
        </div>
      )}

      {/* 상태 표시 */}
      {photo.animation_status === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
            <span className="text-sm font-medium text-white">처리 중...</span>
          </div>
        </div>
      )}

      {/* 호버 오버레이 */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100',
          isDragging && 'opacity-0'
        )}
      >
        {/* 드래그 핸들 */}
        <div
          {...attributes}
          {...listeners}
          className="flex h-10 w-10 cursor-grab items-center justify-center rounded-full bg-white/90 text-gray-700 transition-colors hover:bg-white active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </div>

        {/* 미리보기 버튼 */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-white/90 text-gray-700 hover:bg-white"
          onClick={() => onPreview(photo)}
        >
          <ZoomIn className="h-5 w-5" />
        </Button>

        {/* 삭제 버튼 */}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-10 w-10 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
          onClick={() => onDelete(photo.id)}
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

export function PhotoGrid({ photos, onReorder, onDelete, onPreview }: PhotoGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = photos.findIndex((p) => p.id === active.id);
        const newIndex = photos.findIndex((p) => p.id === over.id);

        const newPhotos = arrayMove(photos, oldIndex, newIndex);
        onReorder(newPhotos.map((p) => p.id));
      }
    },
    [photos, onReorder]
  );

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 py-12 dark:border-gray-700 dark:bg-gray-900/50">
        <div className="rounded-full bg-gray-100 p-4 dark:bg-gray-800">
          <ZoomIn className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          아직 업로드된 사진이 없습니다
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          위 영역에 사진을 드래그하거나 파일을 선택해주세요
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          업로드된 사진 ({photos.length}장)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          드래그하여 순서를 변경하세요
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={photos.map((p) => p.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {photos.map((photo, index) => (
              <SortablePhotoItem
                key={photo.id}
                photo={photo}
                index={index}
                onDelete={onDelete}
                onPreview={onPreview}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
